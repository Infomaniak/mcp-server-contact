#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ContactClient } from "./contact-client.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const token = process.env.CONTACT_TOKEN;

if (!token) {
    console.error(
        "Please set CONTACT_TOKEN environment variable",
    );
    process.exit(1);
}

const server = new McpServer(
    {
        name: "Infomaniak Contact MCP Server",
        version,
    },
    {
        capabilities: {
            completions: {},
            prompts: {},
            resources: {},
            tools: {},
        },
    },
);

const contactClient = new ContactClient(token);

server.tool(
    "contact_list",
    "List all contacts from your Infomaniak account",
    {},
    async () => {
        const contacts = await contactClient.fetchAllContacts();
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(contacts, null, 2),
                },
            ],
        };
    },
);

server.tool(
    "contact_search",
    "Search contacts by name, email, or phone",
    {
        query: z.string().describe("Search query string"),
    },
    async ({ query }) => {
        const allContacts = await contactClient.fetchAllContacts();
        const matches = contactClient.searchContacts(allContacts, query);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(matches, null, 2),
                },
            ],
        };
    },
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
