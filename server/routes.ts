import type { Express } from "express";
import { createServer, type Server } from "http";

const GENLAYER_RPC_URL = "https://studio.genlayer.com/api";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/genlayer-rpc", async (req, res) => {
    try {
      const method = req.body?.method;
      const response = await fetch(GENLAYER_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      if (data.error) {
        console.error(`GenLayer RPC error for ${method}:`, JSON.stringify(data.error).substring(0, 300));
      }
      res.json(data);
    } catch (err: any) {
      console.error("GenLayer RPC proxy error:", err.message);
      res.status(502).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Failed to reach GenLayer RPC: " + err.message },
        id: req.body?.id || null,
      });
    }
  });

  return httpServer;
}
