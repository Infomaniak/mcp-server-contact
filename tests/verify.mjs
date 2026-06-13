import { test, describe } from "node:test";
import assert from "node:assert";
import { ContactClient } from "../dist/contact-client.js";

describe("ContactClient instantiation", () => {
    test("creates a client with token", () => {
        const client = new ContactClient("test-token");
        assert.ok(client);
    });

    test("exposes all expected methods", () => {
        const client = new ContactClient("test-token");
        const methods = ["fetchAllContacts", "searchContacts"];
        for (const m of methods) {
            assert.strictEqual(
                typeof client[m],
                "function",
                `method ${m} should be a function`
            );
        }
    });
});

describe("ContactClient.fetchAllContacts", () => {
    test("calls fetch with correct URL", async () => {
        let capturedUrl = null;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async (url) => {
            capturedUrl = url;
            return { 
                ok: true,
                json: async () => ({ result: "success", data: [] }),
            };
        };

        const client = new ContactClient("test-token");
        await client.fetchAllContacts();

        assert.ok(capturedUrl, "fetch was called");
        assert.ok(capturedUrl.includes("contacts.infomaniak.com/api/pim"), "URL contains correct base URL");
        assert.ok(capturedUrl.includes("/contact/all"), "URL contains /contact/all");

        globalThis.fetch = originalFetch;
    });

    test("returns contacts on success", async () => {
        const originalFetch = globalThis.fetch;
        const mockContacts = [
            { id: 1, name: "John", emails: ["john@test.com"] },
        ];
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({ result: "success", data: mockContacts }),
        });

        const client = new ContactClient("test-token");
        const result = await client.fetchAllContacts();

        assert.deepStrictEqual(result, mockContacts, "returns contacts");

        globalThis.fetch = originalFetch;
    });

    test("throws when result is not success", async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({ result: "error", message: "auth failed" }),
        });

        const client = new ContactClient("test-token");
        await assert.rejects(
            async () => client.fetchAllContacts(),
            /auth failed/
        );

        globalThis.fetch = originalFetch;
    });

    test("throws on HTTP error", async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => ({
            ok: false,
            status: 401,
            statusText: "Unauthorized",
            text: async () => "invalid token",
        });

        const client = new ContactClient("test-token");
        await assert.rejects(
            async () => client.fetchAllContacts(),
            /401 Unauthorized/
        );

        globalThis.fetch = originalFetch;
    });
});

describe("ContactClient.searchContacts", () => {
    const mockContacts = [
        { id: 1, name: "John Doe", firstname: "John", lastname: "Doe", emails: ["john@test.com"], phones: [] },
        { id: 2, name: "Jane Doe", firstname: "Jane", lastname: "Doe", emails: [], phones: ["123456"] },
        { id: 3, name: "Bob Smith", firstname: "Bob", lastname: "Smith", emails: [], phones: [] },
    ];

    test("filters by name", () => {
        const client = new ContactClient("test-token");
        const result = client.searchContacts(mockContacts, "John");

        assert.strictEqual(result.length, 1, "finds one contact");
        assert.strictEqual(result[0].id, 1, "finds John");
    });

    test("filters by firstname", () => {
        const client = new ContactClient("test-token");
        const result = client.searchContacts(mockContacts, "Jane");

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 2);
    });

    test("filters by email", () => {
        const client = new ContactClient("test-token");
        const result = client.searchContacts(mockContacts, "john@test");

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 1);
    });

    test("filters by phone", () => {
        const client = new ContactClient("test-token");
        const result = client.searchContacts(mockContacts, "123456");

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 2);
    });

    test("returns empty array for no match", () => {
        const client = new ContactClient("test-token");
        const result = client.searchContacts(mockContacts, "nonexistent");

        assert.strictEqual(result.length, 0);
    });

    test("is case insensitive", () => {
        const client = new ContactClient("test-token");
        const result = client.searchContacts(mockContacts, "JOHN");

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].id, 1);
    });
});
