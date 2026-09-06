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
interface ChatMsg { role: "user" | "system"; text: string; meta?: string; }

const PIPELINE = ["groupTasks", "planning", "writeCode", "sandboxTest", "gitOpsSubmit"];

// ─── API helpers ──────────────────────────────────────────────────────────
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json();
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

// ─── Toggle switch ─────────────────────────────────────────────────────────
function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <div className="text-[11px] tracking-wide truncate">{label}</div>
        <div className="text-[9px] text-[#5c7290] uppercase tracking-wider truncate">{sub}</div>
      </div>
      <button
        onClick={() => onChange(!on)}
        className={`relative w-9 h-5 rounded-full border shrink-0 transition-colors ${on ? "bg-[#00e5ff30] border-[#00e5ff]" : "bg-[#0a0f18] border-[#1c2535]"}`}
        aria-label={label}
      >
        <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${on ? "left-4 bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" : "left-0.5 bg-[#2a3a52]"}`} />
      </button>
    </div>
  );
}

// ─── Dot-matrix holographic presence — ALWAYS ON DISPLAY ──────────────────
function PresenceModel({ thinking }: { thinking: boolean }) {
  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <div className="text-center mb-3">
        <div className="text-sm font-bold tracking-[0.35em] text-[#f0f4f8]">MICROFYXD</div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff]">presence model</div>
      </div>
      <svg viewBox="0 0 200 260" className={`holo-svg ${thinking ? "thinking" : ""} w-full max-w-[380px]`} aria-label="Microfyxd presence model">
        <defs>
          <pattern id="dotMatrix" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.85" fill="#00e5ff" />
          </pattern>
          <pattern id="dotMatrixDim" width="5" height="5" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="0.7" fill="#00e5ff" opacity="0.5" />
          </pattern>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#7df9ff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hologGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
          <filter id="rimGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softBlur"><feGaussianBlur stdDeviation="1" /></filter>
        </defs>

        {/* ambient holographic glow */}
        <ellipse cx="100" cy="110" rx="95" ry="115" fill="url(#hologGlow)" />

        {/* rotating containment rings */}
        <g className="spin-ring" opacity="0.4">
          <ellipse cx="100" cy="108" rx="84" ry="26" fill="none" stroke="#00e5ff" strokeWidth="0.7" strokeDasharray="5 4" />
        </g>
        <g className="spin-ring-rev" opacity="0.25">
          <ellipse cx="100" cy="108" rx="68" ry="18" fill="none" stroke="#00e5ff" strokeWidth="0.5" strokeDasharray="2 5" />
        </g>

        <g className="flicker">
          {/* head silhouette — dot matrix fill + wireframe rim */}
          <path d="M100 24 C 131 24 149 49 149 78 C 149 88 148 96 146 103 C 145 110 142 116 139 121 C 136 127 133 132 131 138 C 129 146 124 154 115 159 C 111 161 106 162 100 162 C 94 162 89 161 85 159 C 76 154 71 146 69 138 C 67 132 64 127 61 121 C 58 116 55 110 54 103 C 52 96 51 88 51 78 C 51 49 69 24 100 24 Z"
            fill="url(#dotMatrixDim)" opacity="0.85" />
          <path d="M100 24 C 131 24 149 49 149 78 C 149 88 148 96 146 103 C 145 110 142 116 139 121 C 136 127 133 132 131 138 C 129 146 124 154 115 159 C 111 161 106 162 100 162 C 94 162 89 161 85 159 C 76 154 71 146 69 138 C 67 132 64 127 61 121 C 58 116 55 110 54 103 C 52 96 51 88 51 78 C 51 49 69 24 100 24 Z"
            fill="none" stroke="#00e5ff" strokeWidth="1.1" filter="url(#rimGlow)" />
          {/* cranial contour lines */}
          <path d="M58 58 C 72 44 128 44 142 58" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.4" />
          <path d="M54 78 C 74 66 126 66 146 78" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.35" />
          <path d="M57 98 C 78 88 122 88 143 98" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.35" />
          <path d="M64 118 C 82 110 118 110 136 118" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.4" />
          <path d="M74 138 C 86 132 114 132 126 138" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.4" />
          {/* vertical axis */}
          <path d="M100 24 L 100 162" strokeDasharray="2 4" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3" />
          {/* brow ridges */}
          <path d="M70 80 C 76 75 88 74 93 78" fill="none" stroke="#9ffbff" strokeWidth="1.6" opacity="0.6" strokeLinecap="round" />
          <path d="M130 80 C 124 75 112 74 107 78" fill="none" stroke="#9ffbff" strokeWidth="1.6" opacity="0.6" strokeLinecap="round" />
          {/* eyes — glowing */}
          <ellipse cx="82" cy="89" rx="8" ry="4.5" fill="url(#eyeGlow)" />
          <ellipse cx="118" cy="89" rx="8" ry="4.5" fill="url(#eyeGlow)" />
          <circle cx="82" cy="89" r="1.8" fill="#ffffff" opacity="0.95" />
          <circle cx="118" cy="89" r="1.8" fill="#ffffff" opacity="0.95" />
          {/* nose */}
          <path d="M100 92 L 99 106 C 98 108 97 109 98 110" fill="none" stroke="#9ffbff" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
          {/* lips */}
          <path d="M90 126 C 95 124 105 124 110 126 C 108 131 104 133 100 133 C 96 133 92 131 90 126 Z" fill="#00e5ff" opacity="0.25" stroke="#9ffbff" strokeWidth="0.9" />
          {/* neck — dot matrix */}
          <path d="M90 160 L 90 188 C 90 195 110 195 110 188 L 110 160 Z" fill="url(#dotMatrix)" opacity="0.7" />
          {/* shoulders — dot matrix */}
          <path d="M56 222 C 70 200 130 200 144 222 L 150 244 L 50 244 Z" fill="url(#dotMatrixDim)" stroke="#00e5ff" strokeWidth="0.8" opacity="0.8" />
          {/* pedestal rings */}
          <ellipse cx="100" cy="222" rx="58" ry="10" fill="none" stroke="#00e5ff" strokeWidth="0.7" opacity="0.35" />
          <ellipse cx="100" cy="230" rx="66" ry="12" fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.25" strokeDasharray="4 3" />
          <ellipse cx="100" cy="238" rx="74" ry="14" fill="none" stroke="#00e5ff" strokeWidth="0.5" opacity="0.18" strokeDasharray="2 4" />
          <line x1="30" y1="244" x2="170" y2="244" stroke="#00e5ff" strokeWidth="0.6" opacity="0.3" />
        </g>

        {/* pulsing data nodes */}
        <circle className="node" cx="58" cy="62" r="2" fill="#9ffbff" />
        <circle className="node" cx="142" cy="62" r="2" fill="#9ffbff" style={{ animationDelay: "0.4s" }} />
        <circle className="node" cx="54" cy="80" r="2" fill="#9ffbff" style={{ animationDelay: "0.8s" }} />
        <circle className="node" cx="146" cy="80" r="2" fill="#9ffbff" style={{ animationDelay: "1.2s" }} />
        <circle className="node" cx="100" cy="160" r="1.8" fill="#00e5ff" style={{ animationDelay: "1s" }} />

        {/* scanline */}
        <rect className="scanline" x="46" y="0" width="108" height="2" fill="#9ffbff" opacity="0.5" />
      </svg>
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#5c7290] mt-2">always-present interface</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
type View = "workspace" | "system";

export default function MicrofyxdOS() {
  const [view, setView] = useState<View>("workspace");
  const [connected, setConnected] = useState(false);
  const [supabase, setSupabase] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ecuLogs, setEcuLogs] = useState<EcuLog[]>([]);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [thinking, setThinking] = useState(false);
  const [lastRun, setLastRun] = useState<AgentOutput | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([
    { role: "system", text: "Voice transcript active. Presence model online. Governed by the 7 Laws.", meta: "boot" },
  ]);
  const [gov, setGov] = useState({ autonomy: false, approvalRoute: true, promotionApp: false, traceDisplay: true });
  const [loading, setLoading] = useState({ goals: false, ecu: false, chat: false });
  const [ecuForm, setEcuForm] = useState({ rpm: 750, coolant: 195, throttle: 0, dtc: "" });

  const refreshAll = useCallback(async () => {
    try {
      const [test, g, t, ecu, st] = await Promise.all([
        apiGet<{ ok: boolean; supabase?: boolean }>("/api/test"),
        apiGet<{ ok: boolean; goals: Goal[] }>("/api/goals"),
        apiGet<{ ok: boolean; tasks: Task[] }>("/api/tasks"),
        apiGet<{ ok: boolean; logs: EcuLog[] }>("/api/ecu"),
        apiGet<{ ok: boolean; states: AgentState[] }>("/api/state"),
      ]);
      setConnected(test.ok);
      setSupabase(Boolean(test.supabase));
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

  const speak = useCallback(async (msg: string, quiet = false) => {
    if (!msg.trim()) return;
    if (!quiet) setChat((p) => [...p, { role: "user", text: msg }]);
    setThinking(true);
    setLoading((p) => ({ ...p, chat: true }));
    try {
      const res = await apiPost<{ ok: boolean; output?: AgentOutput }>("/agent", {
        input: [{ unit: "api", targetFile: "src/handler.ts", description: msg }],
      });
      if (res.ok && res.output) {
        const out: AgentOutput = res.output;
        setLastRun(out);
        const sb = out.sandboxResult;
        const meta = [
          `plan: ${out.plan}`,
          `sandbox: ${sb?.success ? "passed" : "failed"}`,
          `git: ${out.branchName} (${out.gitStatus})`,
          out.escalated ? "escalated to human" : null,
        ].filter(Boolean).join(" · ");
        setChat((p) => [...p, {
          role: "system",
          text: `Movement complete — handler generated for ${out.targetFile}. Awaiting your approval on branch ${out.branchName}.`,
          meta,
        }]);
      } else {
        setChat((p) => [...p, { role: "system", text: "Runtime error — movement aborted.", meta: "error" }]);
      }
    } catch {
      setChat((p) => [...p, { role: "system", text: "Backend unreachable — check runtime status.", meta: "error" }]);
    }
    setThinking(false);
    setLoading((p) => ({ ...p, chat: false }));
    await refreshAll();
  }, [refreshAll]);

  const createGoal = async () => {
    if (!newGoal.trim()) return;
    setLoading((p) => ({ ...p, goals: true }));
    await apiPost("/api/goals", { text: newGoal });
    setNewGoal("");
    await refreshAll();
    setLoading((p) => ({ ...p, goals: false }));
  };

  const sendEcu = async () => {
    setLoading((p) => ({ ...p, ecu: true }));
    await apiPost("/api/ecu", { ...ecuForm, dtc: ecuForm.dtc || null });
    await refreshAll();
    setLoading((p) => ({ ...p, ecu: false }));
  };

  const trace = () => {
    if (lastRun?.logEntries) {
      const t = lastRun.logEntries.map((l) => `[${l.step}] ${l.message}`).join(" | ");
      setChat((p) => [...p, { role: "system", text: `Movement trace — ${lastRun.branchName}`, meta: t }]);
    } else {
      setChat((p) => [...p, { role: "system", text: "No movement on record yet — run a task first." }]);
    }
  };

  const inspect = async () => {
    setChat((p) => [...p, {
      role: "system",
      text: `System inspection — ${goals.length} goals · ${tasks.length} tasks · ${ecuLogs.length} telemetry logs · ${agentStates.length} state records.`,
      meta: `backend: ${connected ? "online" : "offline"} · supabase: ${supabase ? "connected" : "local mode"}`,
    }]);
  };

  const pipelineStage = lastRun?.logEntries?.length ? lastRun.logEntries[lastRun.logEntries.length - 1].step : "idle";

  // ─── Left view panels ────────────────────────────────────────────────────
  const WorkspaceView = () => (
    <div className="space-y-3 view-enter">
      <div className="holo-card">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-3">Create Goal</h2>
        <div className="flex gap-2">
          <input className="input-field" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="State a mission objective…" onKeyDown={(e) => e.key === "Enter" && createGoal()} />
          <button className="btn-primary whitespace-nowrap" onClick={createGoal} disabled={loading.goals}>{loading.goals ? "…" : "Commit"}</button>
        </div>
      </div>
      <div className="holo-card">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-3">Tasks ({tasks.length})</h2>
        {tasks.length === 0 && <p className="text-xs text-[#5c7290]">No tasks derived from goals yet.</p>}
        <ul className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
          {tasks.slice(-10).reverse().map((t) => (
            <li key={t.id} className="flex gap-2 items-baseline">
              <span className="text-[#00e5ff] font-mono text-[10px]">P{t.priority}</span>
              <span className="flex-1 truncate">{t.text}</span>
              <span className="text-[9px] uppercase tracking-wider text-[#5c7290]">{t.status}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="holo-card">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-3">OBD2 / ECM Telemetry</h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <label className="text-[10px] text-[#5c7290] uppercase tracking-wider">RPM
            <input type="number" className="input-field mt-1" value={ecuForm.rpm} onChange={(e) => setEcuForm({ ...ecuForm, rpm: Number(e.target.value) })} />
          </label>
          <label className="text-[10px] text-[#5c7290] uppercase tracking-wider">Coolant °F
            <input type="number" className="input-field mt-1" value={ecuForm.coolant} onChange={(e) => setEcuForm({ ...ecuForm, coolant: Number(e.target.value) })} />
          </label>
          <label className="text-[10px] text-[#5c7290] uppercase tracking-wider">Throttle %
            <input type="number" className="input-field mt-1" value={ecuForm.throttle} onChange={(e) => setEcuForm({ ...ecuForm, throttle: Number(e.target.value) })} />
          </label>
          <label className="text-[10px] text-[#5c7290] uppercase tracking-wider">DTC
            <input className="input-field mt-1" value={ecuForm.dtc} onChange={(e) => setEcuForm({ ...ecuForm, dtc: e.target.value })} placeholder="P0300" />
          </label>
        </div>
        <button className="btn-secondary w-full text-xs" onClick={sendEcu} disabled={loading.ecu || !connected}>{loading.ecu ? "Transmitting…" : "📡 Log Telemetry"}</button>
        <ul className="mt-2 space-y-1 text-[10px] font-mono max-h-24 overflow-y-auto text-[#9fb3c8]">
          {ecuLogs.slice(-6).reverse().map((l) => (
            <li key={l.id} className="flex gap-2">
              <span className="text-[#00e5ff70]">{new Date(l.created_at).toLocaleTimeString()}</span>
              <span>{l.rpm}rpm {l.coolant}°F {l.throttle}%</span>
              {l.dtc && <span className="text-[#ff9d00]">{l.dtc}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const SystemView = () => (
    <div className="space-y-3 view-enter">
      <div className="holo-card">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-3">Constitution — 7 Laws</h2>
        <ul className="space-y-1.5 text-xs">
          {["Safety First", "Never Silently Corrupt", "Minimal Targeted Changes", "Always Verify", "Escalate on Failure", "Log Everything", "Respect Human Oversight"].map((law, i) => (
            <li key={law} className="flex items-center gap-2">
              <span className="text-[#00e5ff] font-mono text-[10px] w-3">{i + 1}</span>
              <span className="flex-1 text-[#9fb3c8]">{law}</span>
              <span className="text-[#00ff9d] text-[10px]">✓</span>
            </li>
          ))}
        </ul>
        <a href="/constitution" className="inline-block mt-3 text-[10px] text-[#00e5ff] hover:underline">Read full constitution →</a>
      </div>
      <div className="holo-card">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-3">Last Movement</h2>
        {lastRun ? (
          <>
            <pre className="text-[10px] text-[#9fb3c8] whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">{lastRun.code}</pre>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] uppercase tracking-wider">
              <span className={`px-2 py-0.5 rounded border ${lastRun.sandboxResult?.success ? "border-[#00ff9d] text-[#00ff9d]" : "border-[#ff9d00] text-[#ff9d00]"}`}>sandbox {lastRun.sandboxResult?.success ? "passed" : "failed"}</span>
              <span className="px-2 py-0.5 rounded border border-[#00e5ff50] text-[#00e5ff]">{lastRun.branchName}</span>
            </div>
          </>
        ) : <p className="text-xs text-[#5c7290]">No movement on record yet.</p>}
      </div>
    </div>
  );

  const views: Record<View, () => JSX.Element> = { workspace: WorkspaceView, system: SystemView };
  const ActiveView = views[view];

  return (
    <div className="flex h-screen overflow-hidden holo-grid-bg">
      {/* ─── Left sidebar: nav + live ops + governance ─── */}
      <aside className="w-64 shrink-0 border-r border-[#1c2535] bg-[#0e1420cc] backdrop-blur-md flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-[#1c2535]">
          <div className="text-base font-bold tracking-[0.3em]">MICROFYXD</div>
          <div className="text-[9px] uppercase tracking-[0.3em] text-[#00e5ff]">os · holographic</div>
        </div>
        <nav className="p-2 flex gap-1 border-b border-[#1c2535]">
          {(["workspace", "system"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 px-2 py-1.5 rounded text-[10px] uppercase tracking-widest transition-colors ${view === v ? "bg-[#00e5ff15] text-[#00e5ff] border border-[#00e5ff40]" : "text-[#5c7290] hover:bg-[#1c2535] border border-transparent"}`}>
              {v}
            </button>
          ))}
        </nav>

        <div className="p-4 border-b border-[#1c2535]">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-2">Live Operations</h2>
          <ul className="space-y-1 text-[10px] font-mono max-h-32 overflow-y-auto">
            {agentStates.length === 0 && <li className="text-[#5c7290]">no activity recorded</li>}
            {agentStates.slice(-8).reverse().map((s) => (
              <li key={s.id} className="flex gap-2">
                <span className="text-[#00e5ff70]">{new Date(s.created_at).toLocaleTimeString()}</span>
                <span className="text-[#9fb3c8] truncate">[{s.loop_step}] {s.summary}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-2">Governance Status</h2>
          <Toggle on={gov.autonomy} onChange={(v) => setGov({ ...gov, autonomy: v })} label="Autonomy master switch" sub={gov.autonomy ? "engaged" : "standby · human gate"} />
          <Toggle on={gov.approvalRoute} onChange={(v) => setGov({ ...gov, approvalRoute: v })} label="Human approval route" sub="promotions require sign-off" />
          <Toggle on={gov.promotionApp} onChange={(v) => setGov({ ...gov, promotionApp: v })} label="Promotion application" sub="branch promotion pipeline" />
          <Toggle on={gov.traceDisplay} onChange={(v) => setGov({ ...gov, traceDisplay: v })} label="Trace display" sub="movement log stream" />
        </div>
      </aside>

      {/* ─── Center: presence model — ALWAYS ON DISPLAY ─── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-[#1c2535] bg-[#0e142088] backdrop-blur-md flex items-center justify-between px-5">
          <h1 className="text-[11px] uppercase tracking-[0.3em] text-[#9fb3c8]">microfyxd os — holographic command</h1>
          <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest text-[#5c7290]">
            <span>{PIPELINE.join(" → ")}</span>
            <span className={thinking ? "text-[#00e5ff] status-live" : "text-[#00ff9d]"}>{thinking ? "processing" : "stable"}</span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          <PresenceModel thinking={thinking} />
        </div>
        <footer className="h-8 border-t border-[#1c2535] flex items-center px-5 text-[9px] uppercase tracking-widest text-[#5c7290]">
          <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#00ff9d] status-live" : "bg-[#ff9d00]"}`} /> runtime {connected ? "online" : "offline"}</span>
          <span className="mx-4">·</span>
          <span>stage: {pipelineStage}</span>
          <span className="mx-4">·</span>
          <span>governance: 7 laws enforced</span>
        </footer>
      </main>

      {/* ─── Right sidebar: runtime + credentials + transcript + intents ─── */}
      <aside className="w-80 shrink-0 border-l border-[#1c2535] bg-[#0e1420cc] backdrop-blur-md flex flex-col min-h-0">
        <div className="p-4 border-b border-[#1c2535] space-y-2">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-2">Runtime Status</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <span className="text-[#5c7290] uppercase tracking-wider">Backend</span>
              <span className={connected ? "text-[#00ff9d]" : "text-[#ff9d00]"}>{connected ? "ONLINE" : "OFFLINE"}</span>
              <span className="text-[#5c7290] uppercase tracking-wider">Supabase</span>
              <span className={supabase ? "text-[#00ff9d]" : "text-[#9fb3c8]"}>{supabase ? "CONNECTED" : "LOCAL MODE"}</span>
              <span className="text-[#5c7290] uppercase tracking-wider">Engine</span>
              <span className="text-[#9fb3c8]">LangGraph.js</span>
              <span className="text-[#5c7290] uppercase tracking-wider">Stage</span>
              <span className="text-[#00e5ff]">{pipelineStage}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#1c2535]">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff] mb-2">Runtime & Operator Credentials</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <span className="text-[#5c7290] uppercase tracking-wider">Operator</span>
              <span className="text-[#9fb3c8]">C. Hindle</span>
              <span className="text-[#5c7290] uppercase tracking-wider">Role</span>
              <span className="text-[#9fb3c8]">Sovereign human</span>
              <span className="text-[#5c7290] uppercase tracking-wider">Autonomy</span>
              <span className={gov.autonomy ? "text-[#00ff9d]" : "text-[#ff9d00]"}>{gov.autonomy ? "ENGAGED" : "GATED"}</span>
              <span className="text-[#5c7290] uppercase tracking-wider">Approval route</span>
              <span className={gov.approvalRoute ? "text-[#00ff9d]" : "text-[#ff9d00]"}>{gov.approvalRoute ? "ACTIVE" : "BYPASSED"}</span>
            </div>
          </div>
        </div>

        {/* Voice transcript */}
        <div className="px-4 pt-3 pb-1">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff]">Voice Transcript</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-2.5 min-h-0">
          {chat.map((m, i) => (
            <div key={i} className={`text-xs leading-relaxed ${m.role === "user" ? "text-[#f0f4f8] pl-3 border-l-2 border-[#00e5ff60]" : "text-[#9fb3c8]"}`}>
              {m.role === "user" && <div className="text-[9px] uppercase tracking-widest text-[#00e5ff] mb-0.5">operator</div>}
              <p>{m.text}</p>
              {m.meta && <p className="text-[9px] font-mono text-[#00e5ff70] mt-1 break-words">{m.meta}</p>}
            </div>
          ))}
          {thinking && <div className="text-[10px] text-[#00e5ff] status-live">presence is thinking…</div>}
        </div>

        {/* Quick intents */}
        <div className="p-4 border-t border-[#1c2535] space-y-2">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#00e5ff]">Quick Intents</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={inspect} disabled={thinking} className="btn-secondary text-[10px] uppercase tracking-widest py-2 disabled:opacity-40">Inspect</button>
            <button onClick={() => speak("Run movement pipeline — generate an API handler for src/handler.ts")} disabled={thinking} className="btn-secondary text-[10px] uppercase tracking-widest py-2 disabled:opacity-40">Run</button>
            <button onClick={() => speak("Review the last generated code and sandbox result for approval")} disabled={thinking} className="btn-secondary text-[10px] uppercase tracking-widest py-2 disabled:opacity-40">Review</button>
            <button onClick={trace} disabled={thinking} className="btn-secondary text-[10px] uppercase tracking-widest py-2 disabled:opacity-40">Trace</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
