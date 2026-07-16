/**
 * 1E Consumer API — MCP Server
 *
 * Supports two transport modes controlled by the TRANSPORT env var:
 *
 *   TRANSPORT=stdio  (default) — stdio, for Claude Desktop / local MCP clients
 *   TRANSPORT=http             — Streamable HTTP on PORT (default 3000)
 *
 * Required env vars:
 *   ONE_E_BASE_URL        e.g. https://your-tenant.1e.com/consumer
 *   ONE_E_BEARER_TOKEN    (or ONE_E_API_KEY, or ONE_E_USERNAME+ONE_E_PASSWORD)
 *
 * HTTP-only env vars:
 *   PORT                        HTTP port (default 3000)
 *   MCP_AUTH_TOKEN              Required. All /mcp requests must carry "Authorization: Bearer <token>"
 *   ONE_E_CLIENT_SUPPLIED_KEY   Set to "true" to run in per-client credential mode: each session
 *                               must supply its own 1E API key via the "X-API-Key" header instead
 *                               of the server using one shared, env-configured 1E identity.
 */

import { createServer, IncomingMessage } from "node:http";
import { randomUUID, createHash, timingSafeEqual } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { createClientFromEnv, OneEConsumerClient, ApiError } from "./client.js";
import tools from "./tools.js";

// ─── API client (shared across all sessions, unless ONE_E_CLIENT_SUPPLIED_KEY) ─

const sharedClient = createClientFromEnv();

// ─── MCP server factory ───────────────────────────────────────────────────────
// Creates a new Server instance per transport connection (required by the SDK —
// each Server can only be connected to one transport at a time). `client` is
// baked into this instance's request handlers via closure, so each session can
// be wired to its own 1E identity.

function createMcpServer(client: OneEConsumerClient): Server {
  const server = new Server(
    { name: "1e-consumer-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    try {
      const content = await tool.handler(args ?? {}, client);
      return { content };
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          content: [
            {
              type: "text" as const,
              text: `API Error ${err.status}: ${err.statusText}\n\n${err.body}`,
            },
          ],
          isError: true,
        };
      }
      if (err instanceof Error) {
        return {
          content: [{ type: "text" as const, text: err.message }],
          isError: true,
        };
      }
      throw err;
    }
  });

  return server;
}

// ─── Helper: read + parse the request body ────────────────────────────────────

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : undefined);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

// ─── stdio mode ───────────────────────────────────────────────────────────────

async function startStdio() {
  const server = createMcpServer(sharedClient);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("1E Consumer MCP server running on stdio");
}

// ─── HTTP mode ────────────────────────────────────────────────────────────────

// Constant-time string comparison. Hashing first fixes the compared length
// at 32 bytes regardless of input length, so timingSafeEqual never throws
// on a length mismatch and no timing signal leaks the token's real length.
function safeCompare(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function securityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Cache-Control": "no-store",
  };
}

function corsHeaders(): Record<string, string> {
  const allowed = process.env.CORS_ORIGIN ?? "*";
  return {
    // Always the configured literal value — never reflect the request's
    // Origin header, which would make "*" behave as an implicit allow-list.
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Mcp-Session-Id, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

async function startHttp() {
  const PORT = parseInt(process.env.PORT ?? "3000", 10);
  const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
  const CLIENT_SUPPLIED_KEY = process.env.ONE_E_CLIENT_SUPPLIED_KEY === "true";

  if (!AUTH_TOKEN) {
    throw new Error(
      "Missing required environment variable: MCP_AUTH_TOKEN\n" +
        "HTTP transport requires an auth token so /mcp isn't reachable by anyone " +
        "on the network or in a browser tab. Set it to a strong random secret, e.g.:\n" +
        "  export MCP_AUTH_TOKEN=$(openssl rand -hex 32)"
    );
  }

  // ONE_E_BASE_URL is already guaranteed non-null here — createClientFromEnv()
  // validated it at module load when building sharedClient, above.
  const baseUrl = process.env.ONE_E_BASE_URL!.replace(/\/$/, "");

  // Session registry: sessionId → transport
  const sessions = new Map<string, StreamableHTTPServerTransport>();

  const httpServer = createServer(async (req, res) => {
    const baseHeaders = { ...securityHeaders(), ...corsHeaders() };

    try {
      // ── CORS preflight ──────────────────────────────────────────────────
      if (req.method === "OPTIONS") {
        res.writeHead(204, baseHeaders);
        res.end();
        return;
      }

      // ── Health check ────────────────────────────────────────────────────
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { ...baseHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({
          status: "ok",
          sessions: sessions.size,
          uptime: Math.floor(process.uptime()),
        }));
        return;
      }

      // ── Only handle /mcp ────────────────────────────────────────────────
      if (req.url !== "/mcp" && req.url !== "/mcp/") {
        res.writeHead(404, baseHeaders);
        res.end(JSON.stringify({ error: "Not found" }));
        return;
      }

      // ── Bearer auth ──────────────────────────────────────────────────────
      const auth = req.headers["authorization"];
      if (typeof auth !== "string" || !safeCompare(auth, `Bearer ${AUTH_TOKEN}`)) {
        res.writeHead(401, { ...baseHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Unauthorized" }));
        return;
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      // ── Existing session ────────────────────────────────────────────────
      if (sessionId) {
        const transport = sessions.get(sessionId);
        if (!transport) {
          res.writeHead(404, { ...baseHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Session not found" }));
          return;
        }
        const body = req.method === "POST" ? await readBody(req) : undefined;
        await transport.handleRequest(req, res, body);
        return;
      }

      // ── New session (POST initialize) ───────────────────────────────────
      if (req.method !== "POST") {
        res.writeHead(400, { ...baseHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "New sessions must use POST" }));
        return;
      }

      // In per-client mode, each new session brings its own 1E identity via
      // X-API-Key rather than using the server's shared, env-configured one.
      let sessionClient = sharedClient;
      if (CLIENT_SUPPLIED_KEY) {
        const apiKeyHeader = req.headers["x-api-key"];
        const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
        if (!apiKey) {
          res.writeHead(401, { ...baseHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({
            error: "Missing X-API-Key header. This server requires each client to supply its own 1E API key.",
          }));
          return;
        }
        sessionClient = new OneEConsumerClient({
          baseUrl,
          consumerName: process.env.ONE_E_CONSUMER_NAME,
          apiKey,
        });
      }

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
      };

      const server = createMcpServer(sessionClient);
      await server.connect(transport);

      const body = await readBody(req);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      console.error("Request error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { ...baseHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  });

  // ── Graceful shutdown ───────────────────────────────────────────────────────
  const shutdown = () => {
    console.error("Shutting down...");
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  httpServer.listen(PORT, () => {
    console.error(`1E Consumer MCP server running on HTTP port ${PORT}`);
    console.error(`  Endpoint: http://0.0.0.0:${PORT}/mcp`);
    console.error(`  Health:   http://0.0.0.0:${PORT}/health`);
    console.error("  Auth:     Bearer token required");
    console.error(
      CLIENT_SUPPLIED_KEY
        ? "  1E Auth:  per-client — each session supplies its own X-API-Key"
        : "  1E Auth:  shared server identity (env-configured)"
    );
    console.error(`  CORS:     ${process.env.CORS_ORIGIN ?? "*"}`);
  });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const TRANSPORT = process.env.TRANSPORT ?? "stdio";

if (TRANSPORT === "http") {
  startHttp().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
} else {
  startStdio().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
