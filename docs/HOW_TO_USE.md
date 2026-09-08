# How to Use DEXMCP

This walks through actually *using* the server once it's running — connecting a client, then working through the device health identification and remediation workflow it's built for. For installation and deployment, see [README.md](../README.md).

---

## 1. Connect a client

### Claude Desktop (local, stdio)

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

Restart Claude Desktop. All 92 tools appear automatically — no scoping applied in stdio mode by default.

### Microsoft Copilot Studio (hosted, HTTP)

If the server is running in `http` mode with `ONE_E_CLIENT_SUPPLIED_KEY=true` (the recommended setup for a shared/hosted deployment):

1. Add a new **Model Context Protocol** tool to your agent.
2. **Server URL**: `https://your-server/mcp`
3. **Authentication**: *API key in header*
   - Header name: `X-API-Key`
   - Value: your 1E/Tachyon credential
4. Save — Copilot Studio discovers the available tools automatically.

If you configured `ONE_E_TOOL_ALLOWLIST` (see README), you'll see a curated subset rather than all 92 — that's expected, not an error.

**A credential note that costs real time if missed:** a Tachyon session token copied from the DEX web UI is short-lived (roughly an hour). If tool calls start failing with an authentication error after working fine earlier, get a fresh token before troubleshooting anything else.

---

## 2. The core workflow: find and fix device health issues

The tools are designed around one loop: **find devices → find the right instruction → run it → check what happened.**

### Step 1 — Find the devices you care about

Ask your agent something like:

> "List all devices in the 'Finance' management group"

This calls `management_groups_list` (or `management_groups_get_contents` if you already know the group), then `devices_list`/`devices_search`. Use `devices_summary` first if you just want an aggregate health/status count before drilling into individual devices.

### Step 2 — Find the right instruction

Every action — a health check, a remediation script, a data query — is an **Instruction Definition**. Ask:

> "Find instruction definitions related to disk space"

This calls `instruction_definitions_search`. Once you know the exact name, `instruction_definitions_get_by_name` returns its full parameter schema — what values it expects before you can run it.

### Step 3 — Run it

> "Run the 'Check Disk Space' instruction against all devices in the Finance group"

This calls `instructions_send` (targeting a management group scope) or `instructions_send_to_device` (a single device by Tachyon GUID). It returns an instruction ID immediately — the instruction runs asynchronously across the targeted devices.

### Step 4 — Track it to completion

> "What's the status of that instruction?"

- `instructions_get_by_id` — status, target info, approval state
- `instructions_get_statistics` — how many devices responded, how many are still pending, how many errored
- `instructions_get_statistics_detail` — the same, broken down per individual state
- `instructions_get_responses` / `instructions_get_responses_aggregate` — the actual data devices returned

If something needs to run again later (a second remediation pass, a re-check after a fix):

> "Re-run that instruction"

→ `instructions_rerun`. To stop an in-progress one: `instructions_cancel`.

---

## 3. Example end-to-end prompt

> "Check which devices in the 'Retail Stores' group have failed their last ConfigMgr client health check, then run the remediation instruction against just the failing ones, and tell me when it's done."

A capable agent chains this into: `management_groups_get_contents` → `instructions_search` (find the last health-check run) → `instructions_get_responses` (see which devices failed) → `instructions_send` (remediation, targeted at just those devices) → `instructions_get_statistics` (poll until complete).

---

## 4. Troubleshooting

| Symptom | Likely cause |
|---|---|
| "Unauthorized" immediately on connect | Missing or wrong credential header — see the auth section above |
| A tool call succeeds getting *to* the server but 1E itself rejects it | Credential expired (common with copied UI session tokens) or wrong tenant |
| "Session not found" after it was working a moment ago | The server process restarted — sessions are in-memory and don't survive it. Reconnect the client. |
| Tool discovery returns far fewer than 92 tools | Expected if `ONE_E_TOOL_ALLOWLIST` is set — not a bug |
| Connector fetch fails with a 404 | Check the exact URL path — it must end in `/mcp`, and watch for a doubled path (`/mcp/mcp`) if a gateway/proxy sits in front and also appends a path |

For deeper technical detail on any of this — auth modes, hosting models, SSRF protections, tool scoping — see [README.md](../README.md) and [docs/TOOLS.md](TOOLS.md).
