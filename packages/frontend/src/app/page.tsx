"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────
interface Goal { id: string; text: string; status: string; created_at: string; }
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
const LAWS = ["Safety First", "Never Silently Corrupt", "Minimal Targeted Changes", "Always Verify", "Escalate on Failure", "Log Everything", "Respect Human Oversight"];

async function apiGet<T>(path: string): Promise<T> { const res = await fetch(path); return res.json(); }
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.json();
}

// ─── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <div className="text-[10px] tracking-wide truncate text-[#a2c1f5]">{label}</div>
        <div className="text-[8px] text-[#4a5d7d] uppercase tracking-wider truncate">{sub}</div>
      </div>
      <button onClick={() => onChange(!on)}
        className={`relative w-8 h-4 rounded-full border shrink-0 transition-colors ${on ? "bg-[#469afd30] border-[#469afd]" : "bg-[#020817] border-[#0e1a33]"}`} aria-label={label}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${on ? "left-4 bg-[#a2c1f5] shadow-[0_0_8px_#469afd]" : "left-0.5 bg-[#1e2f52]"}`} />
      </button>
    </div>
  );
}

// ─── Holographic Presence Model — reference: BRIGHT solid glowing mass ──
function PresenceModel({ thinking }: { thinking: boolean }) {
  return (
    <svg viewBox="0 0 300 400" className={`holo-svg ${thinking ? "thinking" : ""} w-full max-w-[380px]`} aria-label="Microfyxd presence model">
      <defs>
        <pattern id="dotM" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="1.5" fill="#6cabff" opacity="0.95" />
        </pattern>
        <pattern id="dotDim" width="5.5" height="5.5" patternUnits="userSpaceOnUse">
          <circle cx="2.75" cy="2.75" r="1.3" fill="#5a9bf5" opacity="0.8" />
        </pattern>
        <radialGradient id="headFill" cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#469afd" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#2f6cd6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1a3f8f" stopOpacity="0.12" />
        </radialGradient>
        <radialGradient id="eyeG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0f6ff" stopOpacity="1" />
          <stop offset="30%" stopColor="#c0d8ff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#469afd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#469afd" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#469afd" stopOpacity="0" />
        </radialGradient>
        <filter id="rimG" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <ellipse cx="150" cy="170" rx="150" ry="195" fill="url(#hGlow)" />

      <g className="spin-ring" opacity="0.5">
        <ellipse cx="150" cy="172" rx="142" ry="40" fill="none" stroke="#7dbcff" strokeWidth="1.4" strokeDasharray="10 8" />
      </g>
      <g className="spin-ring-rev" opacity="0.35">
        <ellipse cx="150" cy="172" rx="114" ry="28" fill="none" stroke="#8f83f3" strokeWidth="1.1" strokeDasharray="3 9" />
      </g>

      <g className="flicker">
        {/* head — big bright mass, 80% of frame width */}
        <path d="M150 12 C 200 12 232 48 232 92 C 232 115 226 134 218 149 C 212 160 208 169 205 180 C 201 193 193 204 180 212 C 173 216 162 218 150 218 C 138 218 127 216 120 212 C 107 204 99 193 95 180 C 92 169 88 160 82 149 C 74 134 68 115 68 92 C 68 48 100 12 150 12 Z"
          fill="url(#headFill)" />
        <path d="M150 12 C 200 12 232 48 232 92 C 232 115 226 134 218 149 C 212 160 208 169 205 180 C 201 193 193 204 180 212 C 173 216 162 218 150 218 C 138 218 127 216 120 212 C 107 204 99 193 95 180 C 92 169 88 160 82 149 C 74 134 68 115 68 92 C 68 48 100 12 150 12 Z"
          fill="url(#dotDim)" />
        <path d="M150 12 C 200 12 232 48 232 92 C 232 115 226 134 218 149 C 212 160 208 169 205 180 C 201 193 193 204 180 212 C 173 216 162 218 150 218 C 138 218 127 216 120 212 C 107 204 99 193 95 180 C 92 169 88 160 82 149 C 74 134 68 115 68 92 C 68 48 100 12 150 12 Z"
          fill="none" stroke="#8fc0ff" strokeWidth="2.2" filter="url(#rimG)" />
        {/* contour lines */}
        <path d="M84 58 C 108 34 192 34 216 58" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.45" />
        <path d="M76 86 C 106 66 194 66 224 86" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.4" />
        <path d="M73 110 C 104 94 196 94 227 110" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.4" />
        <path d="M80 132 C 108 118 192 118 220 132" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.45" />
        <path d="M90 153 C 116 144 184 144 210 153" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.45" />
        <path d="M150 12 L 150 218" strokeDasharray="2 6" stroke="#a2c1f5" strokeWidth="0.7" opacity="0.35" />
        {/* brow */}
        <path d="M112 104 C 122 97 134 96 140 102" fill="none" stroke="#e6f0ff" strokeWidth="2.8" opacity="0.8" strokeLinecap="round" />
        <path d="M188 104 C 178 97 166 96 160 102" fill="none" stroke="#e6f0ff" strokeWidth="2.8" opacity="0.8" strokeLinecap="round" />
        {/* eyes — big bright glowing orbs */}
        <ellipse cx="126" cy="118" rx="15" ry="9" fill="url(#eyeG)" />
        <ellipse cx="174" cy="118" rx="15" ry="9" fill="url(#eyeG)" />
        <circle cx="126" cy="118" r="3.4" fill="#ffffff" opacity="0.98" />
        <circle cx="174" cy="118" r="3.4" fill="#ffffff" opacity="0.98" />
        {/* nose */}
        <path d="M150 122 L 148 143 C 146 148 144 149 146 151" fill="none" stroke="#d7e3f5" strokeWidth="1.5" opacity="0.55" strokeLinecap="round" />
        {/* lips */}
        <path d="M134 176 C 142 172 158 172 166 176 C 162 185 155 190 150 190 C 145 190 138 185 134 176 Z" fill="#5a9bf5" opacity="0.4" stroke="#d7e3f5" strokeWidth="1.3" />
        {/* neck */}
        <path d="M136 216 L 136 242 C 136 251 164 251 164 242 L 164 216 Z" fill="url(#dotM)" />
        {/* shoulders */}
        <path d="M96 298 C 110 262 190 262 204 298 L 210 314 L 90 314 Z" fill="url(#headFill)" stroke="#8fc0ff" strokeWidth="1.5" opacity="0.95" filter="url(#rimG)" />
        <path d="M96 298 C 110 262 190 262 204 298 L 210 314 L 90 314 Z" fill="url(#dotDim)" opacity="0.7" />
        {/* pedestal rings — bright expanding arcs */}
        <ellipse cx="150" cy="282" rx="92" ry="15" fill="none" stroke="#7dbcff" strokeWidth="1.4" opacity="0.55" />
        <ellipse cx="150" cy="295" rx="114" ry="19" fill="none" stroke="#6cabff" strokeWidth="1.2" opacity="0.45" strokeDasharray="8 6" />
        <ellipse cx="150" cy="308" rx="136" ry="23" fill="none" stroke="#8f83f3" strokeWidth="1.1" opacity="0.35" strokeDasharray="3 8" />
        <ellipse cx="150" cy="321" rx="150" ry="25" fill="none" stroke="#469afd" strokeWidth="1" opacity="0.25" />
        <line x1="6" y1="352" x2="294" y2="352" stroke="#7dbcff" strokeWidth="1.2" opacity="0.45" />
        <ellipse cx="150" cy="352" rx="144" ry="16" fill="none" stroke="#469afd" strokeWidth="0.9" opacity="0.2" />
        {/* base platform */}
        <path d="M36 380 C 74 362 226 362 264 380 L 272 392 L 28 392 Z" fill="url(#dotDim)" opacity="0.55" />
      </g>

      <circle className="node" cx="85" cy="58" r="3" fill="#e6f0ff" />
      <circle className="node" cx="215" cy="58" r="3" fill="#e6f0ff" style={{ animationDelay: "0.4s" }} />
      <circle className="node" cx="75" cy="88" r="3" fill="#e6f0ff" style={{ animationDelay: "0.8s" }} />
      <circle className="node" cx="225" cy="88" r="3" fill="#e6f0ff" style={{ animationDelay: "1.2s" }} />
      <circle className="node" cx="150" cy="214" r="2.8" fill="#c0b5ff" style={{ animationDelay: "1s" }} />
      <circle className="node" cx="136" cy="244" r="2.5" fill="#e6f0ff" style={{ animationDelay: "1.4s" }} />
      <circle className="node" cx="164" cy="244" r="2.5" fill="#e6f0ff" style={{ animationDelay: "1.8s" }} />

      <rect className="scanline" x="62" y="0" width="176" height="3" fill="#c0d8ff" opacity="0.7" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function MicrofyxdOS() {
  const [view, setView] = useState<"workspace" | "system">("workspace");
  const [connected, setConnected] = useState(false);
  const [supabaseLive, setSupabaseLive] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ecuLogs, setEcuLogs] = useState<EcuLog[]>([]);
  const [agentStates, setAgentStates] = useState<AgentState[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [thinking, setThinking] = useState(false);
  const [lastRun, setLastRun] = useState<AgentOutput | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [organInput, setOrganInput] = useState("");
  const [gov, setGov] = useState({ autonomy: false, approvalRoute: true, promotionApp: false, traceDisplay: true });
  const [loading, setLoading] = useState({ goals: false, ecu: false });
  const [ecuForm, setEcuForm] = useState({ rpm: 750, coolant: 195, throttle: 0, dtc: "" });

  const refreshAll = useCallback(async () => {
    try {
      const [test, g, ecu, st] = await Promise.all([
        apiGet<{ ok: boolean; supabase?: boolean }>("/api/test"),
        apiGet<{ ok: boolean; goals: Goal[] }>("/api/goals"),
        apiGet<{ ok: boolean; logs: EcuLog[] }>("/api/ecu"),
        apiGet<{ ok: boolean; states: AgentState[] }>("/api/state"),
      ]);
      setConnected(test.ok);
      setSupabaseLive(Boolean(test.supabase));
      if (g.goals) setGoals(g.goals);
      if (ecu.logs) setEcuLogs(ecu.logs);
      if (st.states) setAgentStates(st.states);
    } catch { setConnected(false); }
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const speak = useCallback(async (msg: string) => {
    if (!msg.trim()) return;
    setChat((p) => [...p, { role: "user", text: msg }]);
    setThinking(true);
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
          text: `Movement complete — ${out.targetFile}. Awaiting your approval on branch ${out.branchName}.`,
          meta,
        }]);
      } else {
        setChat((p) => [...p, { role: "system", text: "Runtime error — movement aborted.", meta: "error" }]);
      }
    } catch {
      setChat((p) => [...p, { role: "system", text: "Protected server proxy unreachable — check runtime status.", meta: "error" }]);
    }
    setThinking(false);
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

  const inspect = () => {
    setChat((p) => [...p, {
      role: "system",
      text: `System inspection — ${goals.length} goals · ${ecuLogs.length} telemetry logs · ${agentStates.length} state records.`,
      meta: `backend: ${connected ? "online" : "offline"} · telemetry: ${supabaseLive ? "supabase" : "local store"}`,
    }]);
  };

  const pipelineStage = lastRun?.logEntries?.length ? lastRun.logEntries[lastRun.logEntries.length - 1].step : "idle";

  const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="panel">
      <h3 className="panel-title">{title}</h3>
      {children}
    </div>
  );

  const workspaceView = (
    <>
      <Panel title="CREATE GOAL">
        <div className="flex gap-2">
          <input className="input-field" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} placeholder="State a mission objective…" onKeyDown={(e) => e.key === "Enter" && createGoal()} />
          <button className="btn-primary whitespace-nowrap" onClick={createGoal} disabled={loading.goals}>{loading.goals ? "…" : "COMMIT"}</button>
        </div>
      </Panel>
      <Panel title={`GOALS (${goals.length})`}>
        {goals.length === 0 && <p className="empty">No goals registered.</p>}
        <ul className="feed">
          {goals.slice(-8).reverse().map((g) => (
            <li key={g.id} className="feed-row"><span className="dot" /><span className="flex-1 truncate">{g.text}</span><span className="tag">{g.status}</span></li>
          ))}
        </ul>
      </Panel>
      <Panel title="OBD2 / ECM TELEMETRY">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <label className="mini">RPM<input type="number" className="input-field mt-1" value={ecuForm.rpm} onChange={(e) => setEcuForm({ ...ecuForm, rpm: Number(e.target.value) })} /></label>
          <label className="mini">COOLANT °F<input type="number" className="input-field mt-1" value={ecuForm.coolant} onChange={(e) => setEcuForm({ ...ecuForm, coolant: Number(e.target.value) })} /></label>
          <label className="mini">THROTTLE %<input type="number" className="input-field mt-1" value={ecuForm.throttle} onChange={(e) => setEcuForm({ ...ecuForm, throttle: Number(e.target.value) })} /></label>
          <label className="mini">DTC<input className="input-field mt-1" value={ecuForm.dtc} onChange={(e) => setEcuForm({ ...ecuForm, dtc: e.target.value })} placeholder="P0300" /></label>
        </div>
        <button className="btn-secondary w-full" onClick={sendEcu} disabled={loading.ecu || !connected}>{loading.ecu ? "TRANSMITTING…" : "LOG TELEMETRY"}</button>
        <ul className="feed mt-2">
          {ecuLogs.slice(-6).reverse().map((l) => (
            <li key={l.id} className="feed-row mono"><span className="dim">{new Date(l.created_at).toLocaleTimeString()}</span><span>{l.rpm}rpm {l.coolant}°F {l.throttle}%</span>{l.dtc && <span className="warn">DTC {l.dtc}</span>}</li>
          ))}
        </ul>
      </Panel>
    </>
  );

  const systemView = (
    <>
      <Panel title="MOVEMENT PIPELINE">
        <div className="flex flex-wrap items-center gap-1.5">
          {PIPELINE.map((step, i) => {
            const done = lastRun?.logEntries?.some((l) => l.step === step);
            return (
              <span key={step} className="flex items-center gap-1.5">
                <span className={`stage ${done ? "done" : ""}`}>{step}</span>
                {i < PIPELINE.length - 1 && <span className="sep">→</span>}
              </span>
            );
          })}
        </div>
      </Panel>
      {lastRun && (
        <Panel title="LAST GENERATED CODE">
          <pre className="code">{lastRun.code}</pre>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`badge ${lastRun.sandboxResult?.success ? "ok" : "bad"}`}>SANDBOX {lastRun.sandboxResult?.success ? "PASSED" : "FAILED"}</span>
            <span className="badge info">{lastRun.branchName}</span>
            <span className="badge">{lastRun.gitStatus}</span>
            {lastRun.escalated && <span className="badge bad">ESCALATED · HUMAN OVERSIGHT</span>}
          </div>
        </Panel>
      )}
      <Panel title={`AGENT STATE RECORDS (${agentStates.length})`}>
        {agentStates.length === 0 && <p className="empty">No activity recorded yet — transmit a governed request.</p>}
        <ul className="feed tall">
          {agentStates.slice(-14).reverse().map((s) => (
            <li key={s.id} className="feed-row mono"><span className="dim">{new Date(s.created_at).toLocaleTimeString()}</span><span className="accent">[{s.loop_step}]</span><span className="flex-1 truncate">{s.summary}</span></li>
          ))}
        </ul>
      </Panel>
      <Panel title="CONSTITUTION — 7 LAWS">
        <ul className="feed">
          {LAWS.map((law, i) => (
            <li key={law} className="feed-row"><span className="accent mono text-[10px] w-4">{i + 1}</span><span className="flex-1">{law}</span><span className="ok-tag">✓</span></li>
          ))}
        </ul>
        <a href="/constitution" className="link mt-3 inline-block">READ FULL CONSTITUTION →</a>
      </Panel>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ─── Left column ─── */}
      <aside className="w-[300px] shrink-0 border-r border-[#0e1a33] bg-[#02081a] flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-[#0e1a33]">
          <div className="text-sm font-bold tracking-[0.35em] text-[#d7e3f5]">MICROFYXD</div>
          <div className="text-[8px] uppercase tracking-[0.4em] text-[#469afd] mt-0.5">spatial os shell</div>
        </div>
        <nav className="p-2 border-b border-[#0e1a33] space-y-0.5">
          <button onClick={() => setView("workspace")}
            className={`w-full text-left px-3 py-1.5 rounded text-[10px] tracking-[0.2em] transition-colors flex items-center gap-2 ${view === "workspace" ? "bg-[#469afd1a] text-[#a2c1f5] border border-[#469afd40]" : "text-[#4a5d7d] hover:bg-[#0a1526] border border-transparent"}`}>
            <span className="accent">◉</span> WORKSPACE
          </button>
          <button onClick={() => setView("system")}
            className={`w-full text-left px-3 py-1.5 rounded text-[10px] tracking-[0.2em] transition-colors flex items-center gap-2 ${view === "system" ? "bg-[#469afd1a] text-[#a2c1f5] border border-[#469afd40]" : "text-[#4a5d7d] hover:bg-[#0a1526] border border-transparent"}`}>
            <span className="accent">◈</span> SYSTEM
          </button>
        </nav>

        <div className="p-3 border-b border-[#0e1a33]">
          <h3 className="panel-title">LIVE OPERATIONS</h3>
          <p className="mini mb-1.5">{connected ? `Live telemetry verified · ${supabaseLive ? "supabase" : "local store"}` : "No verified live telemetry is available: proxy offline"}</p>
          <ul className="feed small">
            {agentStates.slice(-6).reverse().map((s) => (
              <li key={s.id} className="feed-row mono"><span className="dim">{new Date(s.created_at).toLocaleTimeString()}</span><span className="accent">[{s.loop_step}]</span></li>
            ))}
          </ul>
        </div>

        <div className="p-3">
          <h3 className="panel-title">GOVERNANCE STATUS</h3>
          <Toggle on={gov.autonomy} onChange={(v) => setGov({ ...gov, autonomy: v })} label="AUTONOMY MASTER SWITCH" sub={gov.autonomy ? "engaged" : "standby · human gate"} />
          <Toggle on={gov.approvalRoute} onChange={(v) => setGov({ ...gov, approvalRoute: v })} label="HUMAN APPROVAL ROUTE" sub="promotions require sign-off" />
          <Toggle on={gov.promotionApp} onChange={(v) => setGov({ ...gov, promotionApp: v })} label="PROMOTION APPLICATION" sub="branch promotion pipeline" />
          <Toggle on={gov.traceDisplay} onChange={(v) => setGov({ ...gov, traceDisplay: v })} label="TRACE DISPLAY" sub="movement log stream" />
        </div>
      </aside>

      {/* ─── Center — presence model ALWAYS ON DISPLAY ─── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#010713]">
        <header className="h-10 border-b border-[#1e3a66] bg-gradient-to-r from-[#0d1c38] via-[#0a1526] to-[#0d1c38] flex items-center justify-between px-5 shadow-[0_1px_12px_#469afd30]">
          <h1 className="text-[9px] uppercase tracking-[0.3em] text-[#d7e3f5] font-medium">presence layer — authentication proxy</h1>
          <div className="flex items-center gap-4 text-[8px] uppercase tracking-[0.25em]">
            <span className="text-[#4a5d7d]">governed intent surface selected</span>
            <span className={thinking ? "text-[#a2c1f5] status-live" : connected ? "text-[#469afd]" : "text-[#ff9d00]"}>
              {thinking ? "processing" : connected ? "live telemetry" : "telemetry unavailable"}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="pt-4 flex flex-col items-center">
            <div className="text-[12px] tracking-[0.4em] text-[#a2c1f5]">MICROFYXD / PRESENCE MODEL</div>
            <div className="text-[9px] uppercase tracking-[0.35em] text-[#7d8fae] mt-1.5">always-present interface</div>
            <div className={`text-[8px] uppercase tracking-[0.3em] mt-1 ${connected ? "text-[#00ff9d]" : "text-[#ff5d5d]"}`}>
              {connected ? "runtime request — live" : "runtime request returned error"}
            </div>
          </div>
          <div className="flex justify-center px-6 py-2">
            <PresenceModel thinking={thinking} />
          </div>

          {/* Display Organ — governed runtime request console */}
          <div className="mx-auto max-w-[520px] mt-1 mb-4 px-4 text-center">
            <p className="text-[9px] text-[#4a5d7d] leading-relaxed mb-2">
              Use the Display Organ beneath the avatar to prepare a governed runtime request. A response is shown only after the protected server proxy completes.
            </p>
            <div className="panel">
              <div className="flex gap-2">
                <input className="input-field" value={organInput} onChange={(e) => setOrganInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { speak(organInput); setOrganInput(""); } }} placeholder="Prepare a governed runtime request…" disabled={thinking} />
                <button className="btn-primary whitespace-nowrap" onClick={() => { speak(organInput); setOrganInput(""); }} disabled={thinking || !organInput.trim()}>{thinking ? "…" : "TRANSMIT"}</button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-6">
            {view === "workspace" ? workspaceView : systemView}
          </div>
        </div>

        <footer className="h-7 border-t border-[#0e1a33] bg-[#02081a] flex items-center px-5 gap-4 text-[8px] uppercase tracking-[0.25em] text-[#4a5d7d]">
          <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#469afd] status-live" : "bg-[#ff9d00]"}`} /> proxy {connected ? "online" : "offline"}</span>
          <span>·</span><span>stage: {pipelineStage}</span>
          <span>·</span><span>telemetry: {supabaseLive ? "supabase live" : "local store"}</span>
          <span>·</span><span>7 laws enforced</span>
        </footer>
      </main>

      {/* ─── Right column ─── */}
      <aside className="w-[290px] shrink-0 border-l border-[#0e1a33] bg-[#02081a] flex flex-col min-h-0 overflow-y-auto">
        <div className="p-3 border-b border-[#0e1a33]">
          <h3 className="panel-title">RUNTIME STATUS</h3>
          <div className="kv">
            <span className="k">SPATIAL OS SHELL</span><span className="v accent">1.3</span>
            <span className="k">GOVERNOR RUNTIME</span><span className={connected ? "v ok" : "v bad"}>{connected ? "ONLINE" : "UNAVAILABLE"}</span>
            <span className="k">AUTONOMY</span><span className={gov.autonomy ? "v ok" : "v warn"}>{gov.autonomy ? "ENGAGED" : "GATED · DETERMINED"}</span>
            <span className="k">LIVE TELEMETRY</span><span className={connected ? "v ok" : "v bad"}>{connected ? (supabaseLive ? "VERIFIED · SUPABASE" : "VERIFIED · LOCAL") : "UNAVAILABLE"}</span>
            <span className="k">RUNTIME REQUEST</span><span className={connected ? "v ok" : "v bad"}>{connected ? "LIVE" : "HTTP 404"}</span>
            <span className="k">STAGE</span><span className="v accent">{pipelineStage}</span>
          </div>
        </div>

        <div className="p-3 border-b border-[#0e1a33]">
          <h3 className="panel-title">RUNTIME & OPERATOR CREDENTIALS</h3>
          <div className="kv">
            <span className="k">OPERATOR</span><span className="v">C. HINDLE</span>
            <span className="k">ROLE</span><span className="v">SOVEREIGN HUMAN</span>
            <span className="k">AUTHENTICATION</span><span className="v ok">VERIFIED</span>
            <span className="k">APPROVAL ROUTE</span><span className={gov.approvalRoute ? "v ok" : "v bad"}>{gov.approvalRoute ? "ACTIVE" : "BYPASSED"}</span>
            <span className="k">PROMOTION</span><span className={gov.promotionApp ? "v ok" : "v warn"}>{gov.promotionApp ? "APPLIED" : "GATED"}</span>
          </div>
        </div>

        <div className="px-3 pt-3 pb-1">
          <h3 className="panel-title">VOICE TRANSCRIPT</h3>
        </div>
        <div className="px-3 pb-3 space-y-2.5 border-b border-[#0e1a33]">
          {chat.length === 0 && <p className="empty">No verified utterance has been received.</p>}
          {chat.map((m, i) => (
            <div key={i} className={`text-[11px] leading-relaxed ${m.role === "user" ? "text-[#d7e3f5] pl-2 border-l-2 border-[#469afd80]" : "text-[#7d8fae]"}`}>
              {m.role === "user" && <div className="text-[8px] uppercase tracking-widest text-[#469afd] mb-0.5">operator</div>}
              <p>{m.text}</p>
              {m.meta && <p className="text-[9px] font-mono text-[#469afd90] mt-1 break-words">{m.meta}</p>}
            </div>
          ))}
          {thinking && <div className="text-[10px] text-[#a2c1f5] status-live">presence is thinking…</div>}
        </div>

        <div className="p-3">
          <h3 className="panel-title">QUICK INTENTS</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={inspect} disabled={thinking} className="intent">INSPECT</button>
            <button onClick={() => speak("Run movement pipeline — generate an API handler for src/handler.ts")} disabled={thinking} className="intent">RUN</button>
            <button onClick={() => speak("Review the last generated code and sandbox result for approval")} disabled={thinking} className="intent">REVIEW</button>
            <button onClick={trace} disabled={thinking} className="intent">TRACE</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
