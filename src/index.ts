#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const token = process.env.CONTACT_TOKEN;

if (!token) {
    console.error(
        "Please set CONTACT_TOKEN environment variable",
    );
    process.exit(1);
}

const API_BASE = "https://contacts.infomaniak.com/api/pim";

class ContactClient {
    private readonly headers: { Authorization: string; "Content-Type": string };

    constructor() {
        this.headers = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }

    private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
        const url = `${API_BASE}${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.headers,
                ...(options.headers as Record<string, string> || {}),
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(
                `API request failed: ${response.status} ${response.statusText}\n${text}`,
            );
        }

        return response.json();
    }

    async fetchAllContacts(): Promise<any[]> {
        const response = await this.apiRequest(
            "/contact/all?with=emails,phones,others,user_id",
        );

        if (response.result !== "success") {
            throw new Error(`API error: ${JSON.stringify(response)}`);
        }

        return response.data || [];
    }

    searchContacts(contacts: any[], query: string): any[] {
        const q = query.toLowerCase();
        return contacts.filter((c) => {
            const searchText = [
                c.name,
                c.firstname,
                c.lastname,
                ...(c.emails || []),
                ...(c.phones || []),
            ].filter(Boolean).join(" ").toLowerCase();
            return searchText.includes(q);
        });
    }
}

const server = new McpServer(
    {
        name: "Infomaniak Contact MCP Server",
        version: "0.0.1",
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

const contactClient = new ContactClient();

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
