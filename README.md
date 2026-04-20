# 1E Platform Consumer API — MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that exposes the **1E Platform Consumer API** as 55 callable tools for any MCP-compatible LLM client (Claude Desktop, Cursor, etc.).

---

## Covered endpoints

| Controller | Tools |
|---|---|
| **ApplicableOperations** | Get by type ID, Get by type name, Add, Delete |
| **Approvals** | Approve instruction/scheduled/persistent, CanApprove checks (×3), Pending notifications (×4) |
| **AuditLogs** | Search, Add entries |
| **Authentication** | 2FA token for instruction, 2FA token for scheduled instruction |
| **CachedUserGroupMemberships** | Get, Add, Delete, Get groups for user, Add groups for user, Remove groups for user, Get users in group |
| **CachedUsers** | List, Get by ID, Add, Update, Delete |
| **Certificates** | List IdP certs, Download cert, Set active cert, Verify cert |
| **Consumers** | List, Get by ID, Get by name, Search, Add, Update, Delete, Delete many, Refresh cache |
| **CustomProperties** | Get by type ID/name, Get by ID, Search, Add, Update, Delete, Delete many |
| **CustomPropertyTypes** | List, Add |

---

## Project structure

```
src/
├── index.ts    # MCP stdio server entry point
├── client.ts   # HTTP client with auth + retry helpers
└── tools.ts    # All 55 tool definitions
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

| Variable | Required | Description |
|---|---|---|
| `ONE_E_BASE_URL` | ✅ | e.g. `https://1edev.dev.preprod.1e.com/consumer` |
| `ONE_E_BEARER_TOKEN` | one of these | Bearer token |
| `ONE_E_API_KEY` | one of these | API key (`X-API-Key` header) |
| `ONE_E_USERNAME` + `ONE_E_PASSWORD` | one of these | Basic auth |

```bash
export ONE_E_BASE_URL=https://1edev.dev.preprod.1e.com/consumer
export ONE_E_BEARER_TOKEN=your-token-here
```

### 3. Run

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

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
        "ONE_E_BASE_URL": "https://1edev.dev.preprod.1e.com/consumer",
        "ONE_E_BEARER_TOKEN": "your-token-here"
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
