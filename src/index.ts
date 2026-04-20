import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

const getServer = () => {
  const server = new McpServer({ name: "mcp-test-server", version: "1.0.0" });

  server.tool("hello", "Say hello", { name: z.string() }, async ({ name }) => ({
    content: [{ type: "text", text: `Hello, ${name}!` }],
  }));

  server.tool("add", "Add two numbers", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
    content: [{ type: "text", text: `${a} + ${b} = ${a + b}` }],
  }));

  return server;
};

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const server = getServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  }
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
});

app.delete("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP test server on port ${PORT}`);
});