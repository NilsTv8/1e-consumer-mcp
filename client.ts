/**
 * 1E Consumer API Client
 *
 * Handles authentication and all HTTP communication with the 1E Consumer API.
 * Base URL and credentials are loaded from environment variables.
 */

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
}

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

export class OneEConsumerClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private buildAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.config.bearerToken) {
      headers["Authorization"] = `Bearer ${this.config.bearerToken}`;
    } else if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    } else if (this.config.username && this.config.password) {
      const creds = Buffer.from(
        `${this.config.username}:${this.config.password}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${creds}`;
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
      headers: this.buildAuthHeaders(),
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const text = await response.text();
    let data: T;
    try {
      data = text ? JSON.parse(text) : ({} as T);
    } catch {
      data = text as unknown as T;
    }

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText, text);
    }

    return { data, status: response.status, ok: response.ok };
  }

  // ─── Convenience Methods ─────────────────────────────────────────────────

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

/**
 * Create the API client from environment variables.
 *
 * Required:
 *   ONE_E_BASE_URL  – e.g. https://1edev.dev.preprod.1e.com/consumer
 *
 * Authentication (pick one):
 *   ONE_E_BEARER_TOKEN
 *   ONE_E_API_KEY
 *   ONE_E_USERNAME + ONE_E_PASSWORD
 */
export function createClientFromEnv(): OneEConsumerClient {
  const baseUrl = process.env.ONE_E_BASE_URL;
  if (!baseUrl) {
    throw new Error(
      "Missing required environment variable: ONE_E_BASE_URL\n" +
        "Set it to the 1E Consumer API base URL, e.g.:\n" +
        "  export ONE_E_BASE_URL=https://1edev.dev.preprod.1e.com/consumer"
    );
  }

  return new OneEConsumerClient({
    baseUrl: baseUrl.replace(/\/$/, ""),
    bearerToken: process.env.ONE_E_BEARER_TOKEN,
    apiKey: process.env.ONE_E_API_KEY,
    username: process.env.ONE_E_USERNAME,
    password: process.env.ONE_E_PASSWORD,
  });
}
