import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocket as WS } from "ws";

// Patch global WebSocket for Node 20 (Supabase realtime needs this)
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WS;
}

import agentRouter from "./routes/agent.js";
import apiRouter from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/agent", agentRouter);
app.use("/api", apiRouter);

// ─── Health ──────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "Microfyxd Backend",
    version: "1.0.0",
    endpoints: {
      "GET /": "this info",
      "GET /agent": "agent info + 7 laws",
      "POST /agent": "run LangGraph pipeline { input: string | array }",
      "GET /api/test": "health check",
      "GET/POST /api/goals": "goals CRUD",
      "GET/POST/PATCH /api/tasks": "tasks CRUD",
      "GET/POST /api/ecu": "ECU telemetry",
      "GET/POST /api/state": "agent state",
      "POST /api/agent/loop": "run agent loop",
    },
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║   Microfyxd Backend — Port ${PORT}          ║`);
  console.log(`  ╠══════════════════════════════════════════╣`);
  console.log(`  ║   POST /agent    → LangGraph pipeline     ║`);
  console.log(`  ║   GET  /api/test → health check           ║`);
  console.log(`  ║   GET  /api/goals→ list goals             ║`);
  console.log(`  ║   POST /api/goals→ create goal            ║`);
  console.log(`  ║   GET  /api/tasks→ list tasks             ║`);
  console.log(`  ║   GET  /api/ecu  → ECU logs               ║`);
  console.log(`  ║   POST /api/ecu  → log telemetry           ║`);
  console.log(`  ║   GET  /api/state→ agent states           ║`);
  console.log(`  ║   POST /api/agent/loop → run loop         ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});

export default app;
