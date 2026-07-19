"use client";

import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────
interface Goal {
  id: string;
  text: string;
  status: string;
  created_at: string;
}
interface Task {
  id: string;
  goal_id: string;
  text: string;
  priority: number;
  status: string;
  created_at: string;
}
interface EcuLog {
  id: string;
  rpm: number;
  coolant: number;
  throttle: number;
  dtc: unknown;
  created_at: string;
}
interface AgentState {
  id: string;
  loop_step: string;
  summary: string;
  created_at: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  return res.json();
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Cockpit() {
  const [connected, setConnected] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ecuLogs, setEcuLogs] = useState<EcuLog[]>([]);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [ecuForm, setEcuForm] = useState({ rpm: 750, coolant: 195, throttle: 0, dtc: "" });
  const [loopResult, setLoopResult] = useState<string>("");
  const [loading, setLoading] = useState({ goals: false, tasks: false, ecu: false, loop: false });

  // ─── Fetch all data ──────────────────────────────────────────────────────
  const refreshAll = useCallback(async () => {
    try {
      const [test, g, t, ecu, st] = await Promise.all([
        apiGet<{ ok: boolean }>("/api/test"),
        apiGet<{ ok: boolean; goals: Goal[] }>("/api/goals"),
        apiGet<{ ok: boolean; tasks: Task[] }>("/api/tasks"),
        apiGet<{ ok: boolean; logs: EcuLog[] }>("/api/ecu"),
        apiGet<{ ok: boolean; states: AgentState[] }>("/api/state"),
      ]);
      setConnected(test.ok);
      if (g.goals) setGoals(g.goals);
      if (t.tasks) setTasks(t.tasks);
      if (ecu.logs) setEcuLogs(ecu.logs);
      if (st.states) setAgentStates(st.states);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  // ─── Create goal ────────────────────────────────────────────────────────
  const createGoal = async () => {
    if (!newGoal.trim()) return;
    setLoading((p) => ({ ...p, goals: true }));
    await apiPost("/api/goals", { text: newGoal });
    setNewGoal("");
    await refreshAll();
    setLoading((p) => ({ ...p, goals: false }));
  };

  // ─── Run agent loop ──────────────────────────────────────────────────────
  const runLoop = async () => {
    setLoading((p) => ({ ...p, loop: true }));
    const result = await apiPost<{ ok: boolean; action: string; message?: string; goal?: Goal; steps?: unknown[] }>(
      "/api/agent/loop",
      {}
    );
    if (result.ok) {
      setLoopResult(
        result.action === "idle"
          ? result.message || "Idle"
          : `Processed goal: ${result.goal?.text || "unknown"}`
      );
    } else {
      setLoopResult("Loop failed");
    }
    await refreshAll();
    setLoading((p) => ({ ...p, loop: false }));
  };

  // ─── Send ECU telemetry ─────────────────────────────────────────────────
  const sendEcu = async () => {
    setLoading((p) => ({ ...p, ecu: true }));
    await apiPost("/api/ecu", {
      rpm: Number(ecuForm.rpm),
      coolant: Number(ecuForm.coolant),
      throttle: Number(ecuForm.throttle),
      dtc: ecuForm.dtc ? JSON.parse(ecuForm.dtc) : null,
    });
    setEcuForm({ ...ecuForm, dtc: "" });
    await refreshAll();
    setLoading((p) => ({ ...p, ecu: false }));
  };

  return (
    <main className="min-h-screen bg-[#080c14] text-[#f0f4f8] flex flex-col">
      {/* ─── Header ─── */}
      <header className="h-16 border-b border-[#1c2535] bg-[#0e1420]/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="text-xl tracking-[0.35em] uppercase font-semibold">
          Micro<span className="text-[#00e5ff]">fyxd</span> Cockpit
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? "bg-[#00ff9d] animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs uppercase tracking-widest text-[#9fb3c8]">
            {connected ? "Backend Online" : "Backend Offline"}
          </span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* ─── LEFT: Goals + Tasks ─── */}
        <div className="space-y-4">
          {/* Create Goal */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Create Goal</h2>
            <div className="flex gap-2">
              <input
                className="flex-1"
                type="text"
                placeholder="What should Microfyxd accomplish?"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createGoal()}
              />
              <button
                className="btn btn-primary"
                onClick={createGoal}
                disabled={loading.goals}
              >
                {loading.goals ? "..." : "Add"}
              </button>
            </div>
          </div>

          {/* Goals List */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Goals ({goals.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {goals.length === 0 ? (
                <p className="text-sm text-[#9fb3c8]">No goals yet.</p>
              ) : (
                goals.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-2 rounded bg-[#080c14]/50">
                    <div className="text-sm">{g.text}</div>
                    <span className={`text-xs px-2 py-0.5 rounded ${g.status === "active" ? "bg-[#00ff9d]/20 text-[#00ff9d]" : "bg-[#9fb3c8]/20 text-[#9fb3c8]"}`}>
                      {g.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Tasks ({tasks.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-sm text-[#9fb3c8]">No tasks yet.</p>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded bg-[#080c14]/50">
                    <div className="text-sm">{t.text}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9fb3c8]">P{t.priority}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${t.status === "pending" ? "bg-[#ff9d00]/20 text-[#ff9d00]" : "bg-[#00ff9d]/20 text-[#00ff9d]"}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── CENTER: Agent Loop ─── */}
        <div className="space-y-4">
          {/* Run Loop */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Agent Loop</h2>
            <button
              className="btn btn-primary w-full mb-3"
              onClick={runLoop}
              disabled={loading.loop || !connected}
            >
              {loading.loop ? "Running..." : "▶ Run Agent Loop"}
            </button>
            {loopResult && (
              <div className="text-sm p-3 rounded bg-[#080c14]/50 text-[#9fb3c8]">
                {loopResult}
              </div>
            )}
          </div>

          {/* Agent State Log */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Agent State ({agentStates.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {agentStates.length === 0 ? (
                <p className="text-sm text-[#9fb3c8]">No state entries yet.</p>
              ) : (
                agentStates.map((s) => (
                  <div key={s.id} className="p-2 rounded bg-[#080c14]/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-[#00e5ff]">{s.loop_step}</span>
                      <span className="text-xs text-[#9fb3c8]">{new Date(s.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-[#9fb3c8]">{s.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: ECU Telemetry ─── */}
        <div className="space-y-4">
          {/* Send ECU Data */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">ECU Telemetry</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[#9fb3c8]">RPM</label>
                  <input
                    type="number"
                    value={ecuForm.rpm}
                    onChange={(e) => setEcuForm({ ...ecuForm, rpm: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9fb3c8]">Coolant °</label>
                  <input
                    type="number"
                    value={ecuForm.coolant}
                    onChange={(e) => setEcuForm({ ...ecuForm, coolant: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#9fb3c8]">Throttle %</label>
                  <input
                    type="number"
                    value={ecuForm.throttle}
                    onChange={(e) => setEcuForm({ ...ecuForm, throttle: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#9fb3c8]">DTC (JSON, optional)</label>
                <input
                  type="text"
                  placeholder='["P0301"]'
                  value={ecuForm.dtc}
                  onChange={(e) => setEcuForm({ ...ecuForm, dtc: e.target.value })}
                  className="w-full"
                />
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={sendEcu}
                disabled={loading.ecu || !connected}
              >
                {loading.ecu ? "Sending..." : "📡 Log Telemetry"}
              </button>
            </div>
          </div>

          {/* ECU Logs */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">ECU Logs ({ecuLogs.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ecuLogs.length === 0 ? (
                <p className="text-sm text-[#9fb3c8]">No telemetry logged.</p>
              ) : (
                ecuLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded bg-[#080c14]/50 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-[#9fb3c8]">{new Date(log.created_at).toLocaleTimeString()}</span>
                      {log.dtc && <span className="text-[#ff9d00]">⚠ DTC</span>}
                    </div>
                    <div className="flex gap-3 text-xs font-mono">
                      <span>RPM: {log.rpm}</span>
                      <span>CLT: {log.coolant}°</span>
                      <span>THR: {log.throttle}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="h-10 border-t border-[#1c2535] bg-[#0e1420]/80 flex items-center justify-between px-6 text-xs text-[#9fb3c8]">
        <span>Microfyxd Cockpit — Backend: localhost:3000</span>
        <span>Auto-refresh: 5s</span>
      </footer>
    </main>
  );
}
