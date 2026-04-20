/**
 * 1E Consumer API — MCP Server
 *
 * Starts a stdio-based MCP server that exposes the 1E Consumer API
 * as a set of tools that any MCP-compatible LLM client can call.
 *
 * Usage:
 *   export ONE_E_BASE_URL=https://1edev.dev.preprod.1e.com/consumer
 *   export ONE_E_BEARER_TOKEN=<your-token>   # or ONE_E_API_KEY / ONE_E_USERNAME+PASSWORD
 *   npm run dev      # development (tsx)
 *   npm run build && npm start   # production
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

import { createClientFromEnv, ApiError } from "./client.js";
import tools from "./tools.js";

// ─── Bootstrap ────────────────────────────────────────────────────────────

const client = createClientFromEnv();

const server = new Server(
  {
    name: "1e-consumer-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── List tools ───────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// ─── Call tool ────────────────────────────────────────────────────────────

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
      // Surface API errors as MCP tool errors (not crashes)
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

// ─── Start ────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("1E Consumer MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
