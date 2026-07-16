# 1E Platform Consumer API — MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the **1E Platform Consumer API** as 92 callable tools for any MCP-compatible LLM client (Claude Desktop, Cursor, etc.).

---

## Covered endpoints

| Controller | Tools |
|---|---|
| **ApplicableOperations** | Get by type ID, Get by type name, Add, Delete |
| **Approvals** | Approve instruction/scheduled/persistent (×3), CanApprove checks (×3), Pending notifications (×4) |
| **AuditLogs** | Search, Add entries |
| **Authentication** | 2FA token for instruction, 2FA token for scheduled instruction |
| **CachedUserGroupMemberships** | Get, Add, Delete, Get groups for user, Add groups for user, Remove groups for user, Get users in group |
| **CachedUsers** | List, Get by ID, Add, Update, Delete |
| **Certificates** | List IdP certs, Download cert, Set active cert, Verify cert |
| **Consumers** | List, Get by ID, Get by name, Search, Add, Update, Delete, Delete many, Refresh cache |
| **CustomProperties** | Get by type ID/name, Get by ID, Search, Add, Update, Delete, Delete many |
| **CustomPropertyTypes** | List, Add |
| **Devices** | List, Search, Get by FQDN, Get by Tachyon GUID, Get management groups by FQDN, Summary |
| **ManagementGroups** (device groups) | List, Get by ID, Get by name, Search, Get contents, Get all devices |
| **InstructionDefinitions** | List, Get by ID, Get by name, Search |
| **Instructions** | Send, Send to device, Get by ID, Search, Get statistics (×2), Get responses (×2), Get responding devices, Get target list, Cancel, Rerun |
| **ScheduledInstructions** | Create, Get by ID, Search, Update, Cancel, Delete |
| **PersistentInstructions** | Create, Get by ID, Search, Cancel, Delete |

---

## Project structure

```
src/
├── index.ts    # MCP server entry point (stdio + Streamable HTTP transports)
├── client.ts   # HTTP client — auth (OAuth/JWT, bearer, API key), token cache, retries
└── tools.ts    # All 92 tool definitions
package.json
tsconfig.json
```

---

## Quick start

### 1. Install

```bash
npm install
```

### 2. Set environment variables

`ONE_E_BASE_URL` is always required, e.g. `https://your-tenant.1e.com/consumer`. Pick **one** auth mode:

| Mode | Variables | Notes |
|---|---|---|
| **1. OAuth / JWT Certificate Assertion** (preferred, auto-rotating) | `ONE_E_PRIVATE_KEY` (or `ONE_E_PRIVATE_KEY_FILE`), `ONE_E_CERTIFICATE` (or `ONE_E_CERTIFICATE_FILE`), `ONE_E_APPLICATION_ID`, `ONE_E_CONSUMER_NAME` | Signs a client-assertion JWT (RS256), exchanges it for a Tachyon token, caches it (5 min safety buffer before expiry) |
| **2. Static bearer token** | `ONE_E_BEARER_TOKEN` | Manual rotation |
| **3. API key** | `ONE_E_API_KEY` | Sent as `X-API-Key` |

```bash
export ONE_E_BASE_URL=https://your-tenant.1e.com/consumer
export ONE_E_PRIVATE_KEY_FILE=/path/to/key.pem
export ONE_E_CERTIFICATE_FILE=/path/to/cert.pem
export ONE_E_APPLICATION_ID=<azure-ad-app-id>
export ONE_E_CONSUMER_NAME=<tachyon-consumer-name>
```

### 3. Run

```bash
# Development (stdio)
npm run dev

# Development (Streamable HTTP)
npm run dev:http

# Production
npm run build && npm start
```

---

## Transports

Controlled by the `TRANSPORT` env var:

- `stdio` (default) — for Claude Desktop / local MCP clients
- `http` — Streamable HTTP on `PORT` (default `3000`), endpoint `/mcp`, health check `/health`

HTTP-only env vars:

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `MCP_AUTH_TOKEN` | **Required.** All `/mcp` requests must carry `Authorization: Bearer <token>`. The server refuses to start in HTTP mode without it. |
| `CORS_ORIGIN` | Allowed CORS origin (default `*`) — echoed back literally, never inferred from the request |
| `ONE_E_CLIENT_SUPPLIED_KEY` | Set to `true` to run in **per-client credential mode** (see below) |

---

## Hosting for multiple MCP clients (Claude, Copilot, etc.)

Run in `http` mode to let several MCP clients connect to one running server instance. Two credential models, controlled by `ONE_E_CLIENT_SUPPLIED_KEY`:

**Shared identity** (default, `ONE_E_CLIENT_SUPPLIED_KEY` unset) — the server holds one 1E credential (any of the 3 auth modes above) and every connecting client uses it. `MCP_AUTH_TOKEN` is the only thing gating access to your hosted server.

**Per-client identity** (`ONE_E_CLIENT_SUPPLIED_KEY=true`) — each client supplies its *own* 1E API key on the request that opens its session, via an `X-API-Key` header. The server builds a fresh, isolated 1E client for that session and uses it for every tool call the session makes — nobody's calls run under anyone else's 1E identity. This requires each connecting user/service to already have their own 1E API key issued (auth mode 3 only — OAuth/JWT and static bearer tokens aren't supported for pass-through, since sending a private key or long-lived bearer token per request is not something clients should do).

There are still two separate headers in this mode:

| Header | Purpose |
|---|---|
| `Authorization: Bearer <MCP_AUTH_TOKEN>` | Gates access to your hosted server at all (same shared secret for every client) |
| `X-API-Key: <their 1E API key>` | Sent once, on the request that opens a session — determines *which* 1E identity that session's tool calls run as |

```bash
export ONE_E_BASE_URL=https://your-tenant.1e.com/consumer
export ONE_E_CLIENT_SUPPLIED_KEY=true
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
TRANSPORT=http npm start
```

Each MCP client config then needs both headers set — check your client's docs for how it lets you set custom headers on an HTTP MCP connection.

---

## Connect to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "1e-consumer": {
      "command": "node",
      "args": ["/absolute/path/to/1e-consumer-mcp/dist/index.js"],
      "env": {
        "ONE_E_BASE_URL": "https://your-tenant.1e.com/consumer",
        "ONE_E_PRIVATE_KEY_FILE": "/absolute/path/to/key.pem",
        "ONE_E_CERTIFICATE_FILE": "/absolute/path/to/cert.pem",
        "ONE_E_APPLICATION_ID": "<azure-ad-app-id>",
        "ONE_E_CONSUMER_NAME": "<tachyon-consumer-name>"
      }
    }
  }
}
```

Restart Claude Desktop and the tools appear automatically.

---

## Adding more tools

Copy this pattern into `src/tools.ts`:

```typescript
{
  name: "my_new_tool",
  description: "What it does and what permissions it requires.",
  inputSchema: {
    type: "object",
    properties: {
      someParam: { type: "string", description: "..." },
    },
    required: ["someParam"],
  },
  async handler(args, client) {
    const res = await client.get(`/MyEndpoint/${args.someParam}`);
    return [{ type: "text", text: JSON.stringify(res.data, null, 2) }];
  },
},
```
