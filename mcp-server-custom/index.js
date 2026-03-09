#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Custom MCP Server implementation
 */
const server = new Server(
    {
        name: "mcp-server-custom",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

/**
 * Handler that lists available tools.
 * Exposes a few example tools for the AI to use.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_system_time",
                description: "Returns the current system time in ISO format.",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "echo",
                description: "Echoes back the input text provided.",
                inputSchema: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "The message to echo back.",
                        },
                    },
                    required: ["message"],
                },
            },
        ],
    };
});

/**
 * Handler for the tool calls.
 * Implements the logic for 'get_system_time' and 'echo'.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
        case "get_system_time": {
            return {
                content: [
                    {
                        type: "text",
                        text: `Current system time: ${new Date().toISOString()}`,
                    },
                ],
            };
        }

        case "echo": {
            const message = request.params.arguments?.message;
            return {
                content: [
                    {
                        type: "text",
                        text: `You said: ${message}`,
                    },
                ],
            };
        }

        default:
            throw new Error("Unknown tool");
    }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate with the host application via stdin/stdout.
 */
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
