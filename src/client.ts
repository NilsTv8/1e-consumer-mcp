/**
 * 1E Consumer API Client
 *
 * Handles authentication and all HTTP communication with the 1E Consumer API.
 * Base URL and credentials are loaded from environment variables.
 *
 * Authentication modes (pick one):
 *
 *   1. Modern OAuth / JWT Certificate Assertion  ← preferred
 *      ONE_E_PRIVATE_KEY      RSA private key PEM
 *      ONE_E_CERTIFICATE      X.509 certificate PEM (for thumbprint)
 *      ONE_E_APPLICATION_ID   Azure AD application (client) ID
 *      ONE_E_CONSUMER_NAME    Tachyon consumer name
 *
 *   2. Static bearer token (manual rotation)
 *      ONE_E_BEARER_TOKEN
 *
 *   3. API key
 *      ONE_E_API_KEY
 */

import { createSign, createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

// ─── Config ───────────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  consumerName?: string;

  // Auth mode 1 – JWT OAuth
  privateKeyPem?: string;
  certificatePem?: string;
  applicationId?: string;

  // Auth mode 2 – static bearer token
  bearerToken?: string;

  // Auth mode 3 – API key
  apiKey?: string;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: string
  ) {
    super(`API Error ${status} ${statusText}: ${body}`);
    this.name = "ApiError";
  }
}

// ─── Token cache ──────────────────────────────────────────────────────────────

interface CachedToken {
  value: string;
  expiresAt: number; // ms since epoch
}

class TokenCache {
  private entry: CachedToken | null = null;
  private static BUFFER_MS = 5 * 60 * 1000; // 5 min safety margin

  isValid(): boolean {
    return (
      this.entry !== null &&
      this.entry.expiresAt - Date.now() > TokenCache.BUFFER_MS
    );
  }

  get(): string | null {
    return this.isValid() ? this.entry!.value : null;
  }

  set(value: string, ttlSeconds: number): void {
    this.entry = { value, expiresAt: Date.now() + ttlSeconds * 1000 };
  }

  clear(): void {
    this.entry = null;
  }
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function base64url(buf: Buffer): string {
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Compute the SHA-1 thumbprint (x5t) of an X.509 certificate PEM.
 * Strips PEM headers/footers, decodes the DER, hashes with SHA-1, Base64URL-encodes.
 */
function computeThumbprint(certPem: string): string {
  const der = Buffer.from(
    certPem
      .replace(/-----[^-]+-----/g, "")
      .replace(/\s+/g, ""),
    "base64"
  );
  return base64url(createHash("sha1").update(der).digest());
}

/**
 * Build and sign a JWT Client Assertion using RS256.
 */
function buildJwt(
  tokenEndpoint: string,
  applicationId: string,
  privateKeyPem: string,
  thumbprint: string
): string {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(
    Buffer.from(JSON.stringify({
      alg: "RS256",
      typ: "JWT",
      x5t: thumbprint,
      kid: thumbprint,
    }))
  );

  const payload = base64url(
    Buffer.from(JSON.stringify({
      aud: tokenEndpoint,
      iss: applicationId,
      sub: applicationId,
      iat: now,
      exp: now + 3600,
      jti: randomUUID(),
    }))
  );

  const signingInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = base64url(signer.sign(privateKeyPem));

  return `${signingInput}.${signature}`;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class OneEConsumerClient {
  private config: ApiClientConfig;
  private tokenCache = new TokenCache();

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  /**
   * OAuth / JWT Certificate Assertion flow (5 steps):
   *
   *  1. GET  {origin}/tachyon/api/Authentication/metadataendpoint
   *     → returns the OpenID configuration URL
   *
   *  2. GET  {openidConfigUrl}
   *     → returns JSON, extract "token_endpoint"
   *
   *  3. Build a signed JWT Client Assertion (RS256, certificate thumbprint)
   *
   *  4. POST {origin}/Tachyon/api/Authentication/RequestJwtAuthentication
   *     → returns Tachyon bearer token (plain text)
   *
   *  5. Cache token for 3600 s (with 5 min safety margin)
   */
  private async fetchOAuthToken(): Promise<string> {
    const origin = new URL(this.config.baseUrl).origin;
    const { privateKeyPem, certificatePem, applicationId, consumerName } =
      this.config;

    if (!privateKeyPem || !certificatePem || !applicationId) {
      throw new Error(
        "JWT OAuth requires ONE_E_PRIVATE_KEY, ONE_E_CERTIFICATE, and ONE_E_APPLICATION_ID"
      );
    }

    // Step 1 – metadata endpoint
    const metaRes = await fetch(
      `${origin}/tachyon/api/Authentication/metadataendpoint`
    );
    if (!metaRes.ok) {
      throw new Error(
        `Metadata endpoint failed: ${metaRes.status} ${metaRes.statusText}`
      );
    }
    const metadataUrl = (await metaRes.text()).trim();

    // Step 2 – OpenID configuration → token_endpoint
    const oidcRes = await fetch(metadataUrl);
    if (!oidcRes.ok) {
      throw new Error(
        `OpenID config fetch failed: ${oidcRes.status} ${oidcRes.statusText}`
      );
    }
    const oidc = (await oidcRes.json()) as { token_endpoint: string };
    const tokenEndpoint = oidc.token_endpoint;

    // Step 3 – build signed JWT
    const thumbprint = computeThumbprint(certificatePem);
    const jwt = buildJwt(tokenEndpoint, applicationId, privateKeyPem, thumbprint);

    // Step 4 – exchange JWT for Tachyon token
    const tokenRes = await fetch(
      `${origin}/Tachyon/api/Authentication/RequestJwtAuthentication`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tachyon-Consumer": consumerName ?? "Default",
        },
        body: JSON.stringify(jwt),
      }
    );
    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(
        `JWT exchange failed: ${tokenRes.status} ${tokenRes.statusText} – ${body}`
      );
    }
    const tachyonToken = (await tokenRes.text()).trim();

    // Step 5 – cache
    this.tokenCache.set(tachyonToken, 3600);
    return tachyonToken;
  }

  /**
   * Resolve the bearer token to use for this request.
   * - JWT OAuth mode: returns cached token or fetches a new one.
   * - Static bearer mode: returns the configured token.
   * - API key mode: returns undefined (key goes in a different header).
   */
  private async resolveToken(): Promise<string | undefined> {
    if (this.config.privateKeyPem) {
      const cached = this.tokenCache.get();
      if (cached) return cached;
      return this.fetchOAuthToken();
    }
    return this.config.bearerToken;
  }

  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.config.consumerName) {
      headers["X-Tachyon-Consumer"] = this.config.consumerName;
    }

    const token = await this.resolveToken();
    if (token) {
      headers["X-Tachyon-Authenticate"] = token;
    } else if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }

    return headers;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    options: {
      query?: Record<string, string | number | boolean | undefined>;
      body?: unknown;
    } = {}
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.config.baseUrl}${path}`);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: await this.buildAuthHeaders(),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      // Never follow redirects. A caller-supplied tenant URL (see
      // ONE_E_CLIENT_SUPPLIED_TENANT in index.ts) is SSRF-validated once,
      // before this call — silently following a redirect would let a
      // validated-but-malicious server hop the real credential to an
      // unvalidated address afterward. 1E's API has no legitimate reason
      // to redirect; a 3xx response falls through to the !response.ok
      // branch below and surfaces as a normal ApiError.
      redirect: "manual",
    });

    const text = await response.text();
    let data: T;
    try {
      data = text ? JSON.parse(text) : ({} as T);
    } catch {
      data = text as unknown as T;
    }

    if (!response.ok) {
      // If a static token returned 401, clear cache so next call retries OAuth
      if (response.status === 401) {
        this.tokenCache.clear();
      }
      throw new ApiError(response.status, response.statusText, text);
    }

    return { data, status: response.status, ok: response.ok };
  }

  // ─── Convenience Methods ──────────────────────────────────────────────────

  get<T = unknown>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ) {
    return this.request<T>("GET", path, { query });
  }

  post<T = unknown>(path: string, body?: unknown) {
    return this.request<T>("POST", path, { body });
  }

  put<T = unknown>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, { body });
  }

  patch<T = unknown>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, { body });
  }

  delete<T = unknown>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create the API client from environment variables.
 *
 * Required:
 *   ONE_E_BASE_URL         e.g. https://your-tenant.1e.com/consumer
 *
 * Auth mode 1 – Modern OAuth / JWT Certificate (recommended):
 *   ONE_E_PRIVATE_KEY      RSA private key in PEM format
 *   ONE_E_CERTIFICATE      X.509 certificate in PEM format
 *   ONE_E_APPLICATION_ID   Azure AD application (client) ID
 *   ONE_E_CONSUMER_NAME    Tachyon consumer name
 *
 * Auth mode 2 – Static bearer token:
 *   ONE_E_BEARER_TOKEN
 *
 * Auth mode 3 – API key:
 *   ONE_E_API_KEY
 */
function loadPem(content?: string, filePath?: string): string | undefined {
  if (content) return content;
  if (filePath) return readFileSync(filePath, "utf8");
  return undefined;
}

export function createClientFromEnv(): OneEConsumerClient {
  const baseUrl = process.env.ONE_E_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Missing required environment variable: ONE_E_BASE_URL\n" +
        "Set it to the 1E Consumer API base URL, e.g.:\n" +
        "  export ONE_E_BASE_URL=https://your-tenant.1e.com/consumer"
    );
  }

  return new OneEConsumerClient({
    baseUrl: baseUrl.replace(/\/$/, ""),
    consumerName: process.env.ONE_E_CONSUMER_NAME,

    // Auth mode 1 – content or file path
    privateKeyPem:  loadPem(process.env.ONE_E_PRIVATE_KEY,  process.env.ONE_E_PRIVATE_KEY_FILE),
    certificatePem: loadPem(process.env.ONE_E_CERTIFICATE,   process.env.ONE_E_CERTIFICATE_FILE),
    applicationId:  process.env.ONE_E_APPLICATION_ID,

    // Auth mode 2
    bearerToken: process.env.ONE_E_BEARER_TOKEN,

    // Auth mode 3
    apiKey: process.env.ONE_E_API_KEY,
  });
}
