import { test, describe } from "node:test";
import assert from "node:assert";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, "..", "dist", "index.js");
const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
);

// Launches dist/index.js the way MCP clients do, then drives a minimal MCP
// `initialize` handshake over stdio and resolves with the parsed response.
function initialize() {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [entry], {
            env: { ...process.env, CONTACT_TOKEN: "test-token" },
            stdio: ["pipe", "pipe", "inherit"],
        });

        const timer = setTimeout(() => {
            child.kill();
            reject(new Error("timed out waiting for initialize response"));
        }, 10000);

        let buffer = "";
        child.stdout.on("data", (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
                if (!line.trim()) continue;
                let message;
                try {
                    message = JSON.parse(line);
                } catch {
                    continue;
                }
                if (message.id === 1) {
                    clearTimeout(timer);
                    child.kill();
                    resolve(message);
                }
            }
        });

        child.on("error", (err) => {
            clearTimeout(timer);
            reject(err);
        });

        const request = {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "test-client", version: "0.0.0" },
            },
        };
        child.stdin.write(JSON.stringify(request) + "\n");
    });
}

describe("server startup", () => {
    test("initialize returns serverInfo with version from package.json", async () => {
        const response = await initialize();

        assert.ok(
            response.result?.serverInfo,
            "initialize result should include serverInfo",
        );
        assert.strictEqual(response.result.serverInfo.version, packageJson.version);
    });
});
