// server.js — Microfyxd Backend (Express + Supabase)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── Health ──────────────────────────────────────────────────────────────

app.get("/api/test", (req, res) => {
  res.json({ ok: true, service: "microfyxd-backend", timestamp: new Date().toISOString() });
});

// ─── Goals ────────────────────────────────────────────────────────────────

app.get("/api/goals", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, goals: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/goals", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ ok: false, error: "text is required" });

    const { data, error } = await supabase
      .from("goals")
      .insert({ text, status: "active" })
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, goal: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch("/api/goals/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("goals")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, goal: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Tasks ───────────────────────────────────────────────────────────────

app.get("/api/tasks", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, tasks: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { goal_id, text, priority } = req.body;
    if (!goal_id || !text) return res.status(400).json({ ok: false, error: "goal_id and text are required" });

    const { data, error } = await supabase
      .from("tasks")
      .insert({ goal_id, text, priority: priority || 1, status: "pending" })
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, task: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, task: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── ECU Telemetry ───────────────────────────────────────────────────────

app.get("/api/ecu", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("ecu_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, logs: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/ecu", async (req, res) => {
  try {
    const { rpm, coolant, throttle, dtc } = req.body;

    const { data, error } = await supabase
      .from("ecu_logs")
      .insert({ rpm, coolant, throttle, dtc: dtc || null })
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, log: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Agent State ─────────────────────────────────────────────────────────

app.get("/api/state", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("agent_state")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, states: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/api/state", async (req, res) => {
  try {
    const { loop_step, summary } = req.body;

    const { data, error } = await supabase
      .from("agent_state")
      .insert({ loop_step, summary })
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, state: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Agent Loop (autonomous) ──────────────────────────────────────────────

app.post("/api/agent/loop", async (req, res) => {
  try {
    const steps = [];

    // 1. Read active goals
    const { data: goals, error: goalsErr } = await supabase
      .from("goals")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: true });

    if (goalsErr) return res.status(500).json({ ok: false, error: goalsErr.message });
    steps.push({ step: "read_goals", count: goals.length });

    if (goals.length === 0) {
      // Log the idle state
      await supabase.from("agent_state").insert({
        loop_step: "idle",
        summary: "No active goals found. Waiting for input.",
      });

      return res.json({
        ok: true,
        action: "idle",
        message: "No active goals. Create a goal to start the loop.",
        steps,
      });
    }

    // 2. Pick the first active goal
    const goal = goals[0];
    steps.push({ step: "pick_goal", goal_id: goal.id, text: goal.text });

    // 3. Check if tasks exist for this goal
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("goal_id", goal.id);

    if (!existingTasks || existingTasks.length === 0) {
      // Create a task for the goal
      const { data: newTask, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          goal_id: goal.id,
          text: `Auto-generated task for: ${goal.text}`,
          priority: 1,
          status: "pending",
        })
        .select()
        .single();

      if (taskErr) {
        steps.push({ step: "create_task", error: taskErr.message });
      } else {
        steps.push({ step: "create_task", task_id: newTask.id, text: newTask.text });
      }
    } else {
      steps.push({ step: "tasks_exist", count: existingTasks.length });
    }

    // 4. Log the loop state
    const { data: stateLog } = await supabase
      .from("agent_state")
      .insert({
        loop_step: "process_goal",
        summary: `Processed goal "${goal.text}" — ${existingTasks?.length || 1} task(s) associated.`,
      })
      .select()
      .single();

    steps.push({ step: "log_state", state_id: stateLog?.id });

    res.json({
      ok: true,
      action: "processed",
      goal: { id: goal.id, text: goal.text, status: goal.status },
      steps,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const supabaseOk = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Microfyxd Backend                        ║");
  console.log(`║  http://localhost:${PORT}                       ║`);
  console.log(`║  Supabase:  ${supabaseOk ? "✅ connected" : "⚠️  not configured"}       ║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log("  Endpoints:");
  console.log("    GET  /api/test        — health check");
  console.log("    GET  /api/goals       — list goals");
  console.log("    POST /api/goals       — create goal");
  console.log("    GET  /api/tasks       — list tasks");
  console.log("    POST /api/tasks       — create task");
  console.log("    GET  /api/ecu         — ECU logs");
  console.log("    POST /api/ecu         — log telemetry");
  console.log("    GET  /api/state       — agent state");
  console.log("    POST /api/state       — log state");
  console.log("    POST /api/agent/loop  — run agent loop");
  console.log("");
});
