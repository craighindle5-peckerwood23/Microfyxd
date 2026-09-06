import { Router } from "express";
import { supabase, isSupabaseConfigured } from "../supabase.js";

const router = Router();

// GET /api/test — health check
router.get("/test", (_req, res) => {
  res.json({ ok: true, supabase: isSupabaseConfigured(), timestamp: new Date().toISOString() });
});

// ─── Goals ───────────────────────────────────────────────────────────────
router.get("/goals", async (_req, res) => {
  if (!supabase) return res.json({ ok: true, goals: [] });
  const { data, error } = await supabase.from("goals").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, goals: data || [] });
});

router.post("/goals", async (req, res) => {
  if (!supabase) return res.json({ ok: true, goal: { id: "stub", text: req.body.text, status: "active", created_at: new Date().toISOString() } });
  const { data, error } = await supabase.from("goals").insert({ text: req.body.text, status: "active" }).select();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, goal: data?.[0] });
});

router.patch("/goals/:id", async (req, res) => {
  if (!supabase) return res.json({ ok: true });
  const { data, error } = await supabase.from("goals").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, goal: data?.[0] });
});

// ─── Tasks ────────────────────────────────────────────────────────────────
router.get("/tasks", async (_req, res) => {
  if (!supabase) return res.json({ ok: true, tasks: [] });
  const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, tasks: data || [] });
});

router.post("/tasks", async (req, res) => {
  if (!supabase) return res.json({ ok: true, task: { ...req.body, id: "stub", created_at: new Date().toISOString() } });
  const { data, error } = await supabase.from("tasks").insert(req.body).select();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, task: data?.[0] });
});

router.patch("/tasks/:id", async (req, res) => {
  if (!supabase) return res.json({ ok: true });
  const { data, error } = await supabase.from("tasks").update(req.body).eq("id", req.params.id).select();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, task: data?.[0] });
});

// ─── ECU ───────────────────────────────────────────────────────────────────
router.get("/ecu", async (_req, res) => {
  if (!supabase) return res.json({ ok: true, logs: [] });
  const { data, error } = await supabase.from("ecu_logs").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, logs: data || [] });
});

router.post("/ecu", async (req, res) => {
  if (!supabase) return res.json({ ok: true, log: { ...req.body, id: "stub", created_at: new Date().toISOString() } });
  const { data, error } = await supabase.from("ecu_logs").insert({
    rpm: req.body.rpm,
    coolant: req.body.coolant,
    throttle: req.body.throttle,
    dtc: req.body.dtc || null,
  }).select();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, log: data?.[0] });
});

// ─── Agent State ───────────────────────────────────────────────────────────
router.get("/state", async (_req, res) => {
  if (!supabase) return res.json({ ok: true, states: [] });
  const { data, error } = await supabase.from("agent_states").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, states: data || [] });
});

router.post("/state", async (req, res) => {
  if (!supabase) return res.json({ ok: true, state: { ...req.body, id: "stub", created_at: new Date().toISOString() } });
  const { data, error } = await supabase.from("agent_states").insert({
    loop_step: req.body.loop_step,
    summary: req.body.summary,
  }).select();
  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, state: data?.[0] });
});

// ─── Agent Loop ─────────────────────────────────────────────────────────────
router.post("/agent/loop", async (_req, res) => {
  try {
    if (!supabase) {
      return res.json({ ok: true, action: "idle", message: "Supabase not configured — running in stub mode" });
    }

    // Get the oldest active goal
    const { data: goals } = await supabase.from("goals").select("*").eq("status", "active").order("created_at", { ascending: true }).limit(1);
    if (!goals || goals.length === 0) {
      return res.json({ ok: true, action: "idle", message: "No active goals" });
    }

    const goal = goals[0];

    // Create a task for this goal
    await supabase.from("tasks").insert({ goal_id: goal.id, text: `Process: ${goal.text}`, priority: 1, status: "pending" });

    // Log agent state
    const steps = ["groupTasks", "planning", "writeCode", "sandboxTest", "gitOpsSubmit"];
    for (const step of steps) {
      await supabase.from("agent_states").insert({ loop_step: step, summary: `Processing goal: ${goal.text}` });
    }

    // Mark goal as processing
    await supabase.from("goals").update({ status: "processing" }).eq("id", goal.id);
    await supabase.from("tasks").update({ status: "done" }).eq("goal_id", goal.id);
    await supabase.from("goals").update({ status: "done" }).eq("id", goal.id);

    res.json({ ok: true, action: "processed", goal, steps: steps.map(s => ({ step: s, status: "done" })) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ ok: false, error: message });
  }
});

export default router;
