"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────
interface Goal { id: string; text: string; status: string; created_at: string; }
interface Task { id: string; goal_id: string; text: string; priority: number; status: string; created_at: string; }
interface EcuLog { id: string; rpm: number; coolant: number; throttle: number; dtc: string | null; created_at: string; }
interface AgentState { id: string; loop_step: string; summary: string; created_at: string; }
interface AgentOutput {
  task: Record<string, unknown> | null;
  code: string;
  result: Record<string, unknown>;
  plan: string;
  targetFile: string;
  sandboxResult: { success: boolean; errors?: string[]; output?: string } | null;
  patch: string;
  branchName: string;
  gitStatus: string;
  attempts: number;
  escalated: boolean;
  logEntries: Array<{ step: string; message: string; timestamp: string; level: string }>;
}

// ─── API helpers ──────────────────────────────────────────────────────────
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json();
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

export default function Cockpit() {
  const [connected, setConnected] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ecuLogs, setEcuLogs] = useState<EcuLog[]>([]);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [ecuForm, setEcuForm] = useState({ rpm: 750, coolant: 195, throttle: 0, dtc: "" });
  const [loopResult, setLoopResult] = useState("");
  const [agentInput, setAgentInput] = useState('[{"unit":"api","targetFile":"src/handler.ts","description":"test handler"}]');
  const [agentOutput, setAgentOutput] = useState<AgentOutput | null>(null);
  const [loading, setLoading] = useState({ goals: false, ecu: false, loop: false, agent: false });

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
    } catch { setConnected(false); }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const createGoal = async () => {
    if (!newGoal.trim()) return;
    setLoading((p) => ({ ...p, goals: true }));
    await apiPost("/api/goals", { text: newGoal });
    setNewGoal("");
    await refreshAll();
    setLoading((p) => ({ ...p, goals: false }));
  };

  const runLoop = async () => {
    setLoading((p) => ({ ...p, loop: true }));
    const result = await apiPost<{ ok: boolean; action: string; message?: string; goal?: Goal }>("/api/agent/loop", {});
    setLoopResult(result.ok ? (result.action === "idle" ? result.message || "Idle" : `Processed: ${result.goal?.text || "unknown"}`) : "Loop failed");
    await refreshAll();
    setLoading((p) => ({ ...p, loop: false }));
  };

  const runAgent = async () => {
    setLoading((p) => ({ ...p, agent: true }));
    try {
      let input: unknown = agentInput;
      try { input = JSON.parse(agentInput); } catch { /* use as string */ }
      const result = await apiPost<{ ok: boolean; output: AgentOutput; error?: string }>("/agent", { input });
      if (result.ok && result.output) {
        setAgentOutput(result.output);
      } else {
        setAgentOutput({ ...({} as AgentOutput), task: null, code: "", result: { error: result.error || "Agent failed" }, plan: "", targetFile: "", sandboxResult: null, patch: "", branchName: "", gitStatus: "", attempts: 0, escalated: false, logEntries: [] });
      }
    } catch (err) {
      setAgentOutput(null);
    }
    setLoading((p) => ({ ...p, agent: false }));
  };

  const sendEcu = async () => {
    setLoading((p) => ({ ...p, ecu: true }));
    await apiPost("/api/ecu", {
      rpm: Number(ecuForm.rpm), coolant: Number(ecuForm.coolant), throttle: Number(ecuForm.throttle),
      dtc: ecuForm.dtc ? JSON.parse(ecuForm.dtc) : null,
    });
    setEcuForm({ ...ecuForm, dtc: "" });
    await refreshAll();
    setLoading((p) => ({ ...p, ecu: false }));
  };

  return (
    <main className="min-h-screen bg-[#080c14] text-[#f0f4f8] flex flex-col">
      <header className="h-16 border-b border-[#1c2535] bg-[#0e1420]/80 backdrop-blur-md flex items-center justify-between px-6">
        <div className="text-xl tracking-[0.35em] uppercase font-semibold">Micro<span className="text-[#00e5ff]">fyxd</span> Cockpit</div>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connected ? "bg-[#00ff9d] animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs uppercase tracking-widest text-[#9fb3c8]">{connected ? "Backend Online" : "Backend Offline"}</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-6">
        {/* LEFT: Goals + Tasks */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Create Goal</h2>
            <div className="flex gap-2">
              <input className="flex-1" type="text" placeholder="What should Microfyxd accomplish?" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createGoal()} />
              <button className="btn btn-primary" onClick={createGoal} disabled={loading.goals}>{loading.goals ? "..." : "Add"}</button>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Goals ({goals.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {goals.length === 0 ? <p className="text-sm text-[#9fb3c8]">No goals yet.</p> : goals.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-2 rounded bg-[#080c14]/50">
                  <div className="text-sm">{g.text}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${g.status === "active" ? "bg-[#00ff9d]/20 text-[#00ff9d]" : "bg-[#9fb3c8]/20 text-[#9fb3c8]"}`}>{g.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Tasks ({tasks.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.length === 0 ? <p className="text-sm text-[#9fb3c8]">No tasks yet.</p> : tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded bg-[#080c14]/50">
                  <div className="text-sm">{t.text}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#9fb3c8]">P{t.priority}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${t.status === "pending" ? "bg-[#ff9d00]/20 text-[#ff9d00]" : "bg-[#00ff9d]/20 text-[#00ff9d]"}`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER: Agent Loop + Agent Engine */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Agent Loop</h2>
            <button className="btn btn-primary w-full mb-3" onClick={runLoop} disabled={loading.loop || !connected}>{loading.loop ? "Running..." : "▶ Run Agent Loop"}</button>
            {loopResult && <div className="text-sm p-3 rounded bg-[#080c14]/50 text-[#9fb3c8]">{loopResult}</div>}
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">LangGraph Engine</h2>
            <textarea className="w-full h-24 mb-3 font-mono text-xs" placeholder="JSON input array" value={agentInput} onChange={(e) => setAgentInput(e.target.value)} />
            <button className="btn btn-primary w-full mb-3" onClick={runAgent} disabled={loading.agent}>{loading.agent ? "Running..." : "▶ Run LangGraph"}</button>
            {agentOutput && (
              <div className="space-y-2">
                <div className="text-xs text-[#9fb3c8]">Plan: {agentOutput.plan}</div>
                <div className="text-xs text-[#9fb3c8]">Target: {agentOutput.targetFile}</div>
                <div className="text-xs text-[#9fb3c8]">Sandbox: {agentOutput.sandboxResult?.success ? "✅ Passed" : "❌ Failed"}</div>
                {agentOutput.escalated && <div className="text-xs text-[#ff9d00]">⚠ Escalated to human oversight</div>}
                <div className="text-xs text-[#9fb3c8]">Branch: {agentOutput.branchName}</div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-[#00e5ff]">Log ({agentOutput.logEntries?.length || 0} entries)</summary>
                  <div className="mt-2 space-y-1">
                    {agentOutput.logEntries?.map((e, i) => (
                      <div key={i} className={`text-xs ${e.level === "error" ? "text-red-400" : e.level === "warn" ? "text-[#ff9d00]" : "text-[#9fb3c8]"}`}>
                        [{e.step}] {e.message}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Agent State ({agentStates.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {agentStates.length === 0 ? <p className="text-sm text-[#9fb3c8]">No state entries.</p> : agentStates.map((s) => (
                <div key={s.id} className="p-2 rounded bg-[#080c14]/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[#00e5ff]">{s.loop_step}</span>
                    <span className="text-xs text-[#9fb3c8]">{new Date(s.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-[#9fb3c8]">{s.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: ECU */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">ECU Telemetry</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs text-[#9fb3c8]">RPM</label><input type="number" value={ecuForm.rpm} onChange={(e) => setEcuForm({ ...ecuForm, rpm: Number(e.target.value) })} className="w-full" /></div>
                <div><label className="text-xs text-[#9fb3c8]">Coolant°</label><input type="number" value={ecuForm.coolant} onChange={(e) => setEcuForm({ ...ecuForm, coolant: Number(e.target.value) })} className="w-full" /></div>
                <div><label className="text-xs text-[#9fb3c8]">Throttle%</label><input type="number" value={ecuForm.throttle} onChange={(e) => setEcuForm({ ...ecuForm, throttle: Number(e.target.value) })} className="w-full" /></div>
              </div>
              <div><label className="text-xs text-[#9fb3c8]">DTC (JSON)</label><input type="text" placeholder='["P0301"]' value={ecuForm.dtc} onChange={(e) => setEcuForm({ ...ecuForm, dtc: e.target.value })} className="w-full" /></div>
              <button className="btn btn-primary w-full" onClick={sendEcu} disabled={loading.ecu || !connected}>{loading.ecu ? "Sending..." : "📡 Log Telemetry"}</button>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">ECU Logs ({ecuLogs.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ecuLogs.length === 0 ? <p className="text-sm text-[#9fb3c8]">No telemetry.</p> : ecuLogs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-[#080c14]/50 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-[#9fb3c8]">{new Date(log.created_at).toLocaleTimeString()}</span>
                    {log.dtc != null && <span className="text-[#ff9d00]">⚠ DTC</span>}
                  </div>
                  <div className="flex gap-3 text-xs font-mono">
                    <span>RPM: {log.rpm}</span><span>CLT: {log.coolant}°</span><span>THR: {log.throttle}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="h-10 border-t border-[#1c2535] bg-[#0e1420]/80 flex items-center justify-between px-6 text-xs text-[#9fb3c8]">
        <span>Microfyxd Cockpit — Auto-refresh: 5s</span>
        <a href="/constitution" className="hover:text-[#00e5ff]">7 Laws →</a>
      </footer>
    </main>
  );
}
