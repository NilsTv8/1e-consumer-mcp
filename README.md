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

## Hosting for multiple MCP clients (Claude, Copilot Studio, etc.)

Run in `http` mode to let several MCP clients connect to one running server instance. Two independent credential models:

**Shared identity** (default, `ONE_E_CLIENT_SUPPLIED_KEY` unset) — the server holds one 1E credential (any of the 3 auth modes above) and every connecting client uses it. `MCP_AUTH_TOKEN` gates access to your hosted server and is required in this mode.

**Per-client identity** (`ONE_E_CLIENT_SUPPLIED_KEY=true`) — each client supplies its *own* 1E credential on the request that opens its session, via an `X-API-Key` header (or an `api_key`/`apiKey` query parameter, for clients like Microsoft Copilot Studio whose "API key" auth option only supports query strings). The server builds a fresh, isolated 1E client for that session and uses it for every tool call the session makes — nobody's calls run under anyone else's 1E identity. Despite the header's name, the value is forwarded to 1E as a bearer token (`X-Tachyon-Authenticate`), not literally as `X-API-Key` — that's what worked empirically against a live tenant for Tachyon-issued session tokens (1E rejected the same token via `X-API-Key` with "No authentication token found," but accepted it via `X-Tachyon-Authenticate`). OAuth/JWT pass-through isn't supported — sending a private key per request is not something clients should do.

`MCP_AUTH_TOKEN` becomes **optional** in this mode: a valid `X-API-Key` satisfies the access gate on its own, since MCP clients that can only configure one credential (Copilot Studio included) can't also send a separate `Authorization: Bearer` header. If you do set `MCP_AUTH_TOKEN`, it's still accepted as an alternate path for clients that support two headers.

```bash
export ONE_E_BASE_URL=https://your-tenant.1e.com/consumer
export ONE_E_CLIENT_SUPPLIED_KEY=true
TRANSPORT=http npm start
```

### Per-client tenant selection

By default every session hits the one tenant configured in `ONE_E_BASE_URL`. Set `ONE_E_CLIENT_SUPPLIED_TENANT=true` (requires `ONE_E_CLIENT_SUPPLIED_KEY=true`) to let each session pick its own tenant instead, via an `X-1E-Base-URL` header (or `base_url`/`baseUrl` query parameter):

```bash
export ONE_E_CLIENT_SUPPLIED_TENANT=true
```

Arbitrary caller-supplied URLs are a real SSRF vector, so every one is validated before use: HTTPS-only, `localhost` rejected, and the hostname is DNS-resolved and rejected if it lands on a private, loopback, or link-local address (link-local — `169.254.0.0/16` — is where AWS/GCP/Azure serve instance credentials from, so this specifically blocks the classic cloud-metadata SSRF). This is a startup-configured, deliberate opt-in — it's refused to start if enabled without `ONE_E_CLIENT_SUPPLIED_KEY`, since arbitrary tenant selection must never be paired with the server's own shared credential (a caller could otherwise exfiltrate it by pointing "tenant" at a server they control).

Known limitation: the SSRF check resolves DNS once at session-creation time, not on every subsequent request — a sufficiently sophisticated DNS-rebinding attack could still slip through between the check and the actual request. Fine for testing/internal use; a production-grade multi-tenant deployment should additionally pin the resolved IP via a custom fetch dispatcher.

| Header | Purpose | Required when |
|---|---|---|
| `Authorization: Bearer <MCP_AUTH_TOKEN>` | Alternate gate credential | Only if `MCP_AUTH_TOKEN` is set and the client can't send `X-API-Key` |
| `X-API-Key: <their 1E API key>` | Determines *which* 1E identity a session's calls run as, and satisfies the gate on its own | `ONE_E_CLIENT_SUPPLIED_KEY=true` |
| `X-1E-Base-URL: <their tenant URL>` | Determines *which* 1E tenant a session's calls hit | Optional even when `ONE_E_CLIENT_SUPPLIED_TENANT=true` — omit to fall back to `ONE_E_BASE_URL` |

Check your MCP client's docs for how it lets you set custom headers (or query parameters) on an HTTP connection.

### Restricting the tool catalog

By default all 92 tools are available. Set `ONE_E_TOOL_ALLOWLIST` to a comma-separated list of tool names to expose only a subset — everything else disappears from `tools/list` and is rejected if called anyway. Applies to both transports. Useful because an LLM pays a real token cost just to reason over the tool catalog on every turn, so a narrowly-scoped deployment should ship a narrow tool list, not all 92.

`.env.example` ships with a recommended scope for **device health identification and remediation** — find devices → find the right health-check/remediation instruction → run it → track it to completion:

```bash
ONE_E_TOOL_ALLOWLIST=devices_list,devices_search,devices_get_by_fqdn,devices_summary,management_groups_list,management_groups_get_contents,instruction_definitions_search,instruction_definitions_get_by_name,instructions_send,instructions_send_to_device,instructions_get_by_id,instructions_get_statistics,instructions_get_statistics_detail,instructions_get_responses,instructions_get_responses_aggregate,instructions_rerun,instructions_cancel
```

That's 17 tools instead of 92. It deliberately excludes approvals, persistent/scheduled instructions, and custom properties — add those back in if your remediation workflow needs an approval step, continuous (not just on-demand) monitoring, or health state tracked via custom properties rather than instruction responses.

Comment the line out (or unset the variable) to expose the full 92-tool catalog instead. An unknown tool name in the list fails the server at startup with a clear error, rather than silently having no effect.

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
