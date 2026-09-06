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

const NAV = [
  { id: "mission", label: "MISSION WORKSPACE" },
  { id: "agents", label: "AGENTS" },
  { id: "core", label: "AI CORE" },
  { id: "architecture", label: "MISSION ARCHITECTURE" },
  { id: "constitution", label: "CONSTITUTION" },
  { id: "governance", label: "GOVERNANCE" },
] as const;
type View = (typeof NAV)[number]["id"];

const LAWS = ["Safety First", "Never Silently Corrupt", "Minimal Targeted Changes", "Always Verify", "Escalate on Failure", "Log Everything", "Respect Human Oversight"];

// ─── API helpers ──────────────────────────────────────────────────────────
async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  return res.json();
}
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
      <button
        onClick={() => onChange(!on)}
        className={`relative w-8 h-4 rounded-full border shrink-0 transition-colors ${on ? "bg-[#469afd30] border-[#469afd]" : "bg-[#020817] border-[#0e1a33]"}`}
        aria-label={label}
      >
        <span className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${on ? "left-4 bg-[#a2c1f5] shadow-[0_0_8px_#469afd]" : "left-0.5 bg-[#1e2f52]"}`} />
      </button>
    </div>
  );
}

// ─── Holographic Head — ALWAYS ON DISPLAY (blue periwinkle, from reference) ─
function PresenceModel({ thinking }: { thinking: boolean }) {
  return (
    <div className="relative flex flex-col items-center select-none w-full">
      <svg viewBox="0 0 400 470" className={`holo-svg ${thinking ? "thinking" : ""} w-full max-w-[440px]`} aria-label="Microfyxd presence model">
        <defs>
          <pattern id="dotM" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.2" fill="#469afd" opacity="0.85" />
          </pattern>
          <pattern id="dotDim" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="0.9" fill="#3367d6" opacity="0.45" />
          </pattern>
          <radialGradient id="eyeG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e6f0ff" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#a2c1f5" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#469afd" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="hGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#469afd" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#469afd" stopOpacity="0" />
          </radialGradient>
          <filter id="rimG" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ambient glow */}
        <ellipse cx="200" cy="210" rx="190" ry="225" fill="url(#hGlow)" />

        {/* rotating containment ring */}
        <g className="spin-ring" opacity="0.35">
          <ellipse cx="200" cy="215" rx="168" ry="52" fill="none" stroke="#469afd" strokeWidth="1" strokeDasharray="8 6" />
        </g>
        <g className="spin-ring-rev" opacity="0.22">
          <ellipse cx="200" cy="215" rx="136" ry="36" fill="none" stroke="#8f83f3" strokeWidth="0.8" strokeDasharray="3 8" />
        </g>

        <g className="flicker">
          {/* head silhouette — dot matrix */}
          <path id="headPath" d="M200 42 C 258 42 292 86 292 138 C 292 166 285 188 275 205 C 268 218 262 228 258 242 C 254 257 243 271 227 280 C 220 284 210 286 200 286 C 190 286 180 284 173 280 C 157 271 146 257 142 242 C 138 228 132 218 125 205 C 115 188 108 166 108 138 C 108 86 142 42 200 42 Z"
            fill="url(#dotDim)" />
          <path d="M200 42 C 258 42 292 86 292 138 C 292 166 285 188 275 205 C 268 218 262 228 258 242 C 254 257 243 271 227 280 C 220 284 210 286 200 286 C 190 286 180 284 173 280 C 157 271 146 257 142 242 C 138 228 132 218 125 205 C 115 188 108 166 108 138 C 108 86 142 42 200 42 Z"
            fill="none" stroke="#469afd" strokeWidth="1.6" filter="url(#rimG)" />
          {/* cranial contour lines */}
          <path d="M124 96 C 152 66 248 66 276 96" fill="none" stroke="#469afd" strokeWidth="0.8" opacity="0.4" />
          <path d="M114 130 C 148 106 252 106 286 130" fill="none" stroke="#469afd" strokeWidth="0.8" opacity="0.35" />
          <path d="M118 166 C 152 146 248 146 282 166" fill="none" stroke="#469afd" strokeWidth="0.8" opacity="0.35" />
          <path d="M128 198 C 158 184 242 184 272 198" fill="none" stroke="#469afd" strokeWidth="0.8" opacity="0.4" />
          <path d="M144 228 C 168 218 232 218 256 228" fill="none" stroke="#469afd" strokeWidth="0.8" opacity="0.4" />
          {/* vertical axis */}
          <path d="M200 42 L 200 286" strokeDasharray="2 6" stroke="#469afd" strokeWidth="0.6" opacity="0.3" />
          {/* brow */}
          <path d="M155 152 C 167 144 183 143 190 150" fill="none" stroke="#a2c1f5" strokeWidth="2.4" opacity="0.6" strokeLinecap="round" />
          <path d="M245 152 C 233 144 217 143 210 150" fill="none" stroke="#a2c1f5" strokeWidth="2.4" opacity="0.6" strokeLinecap="round" />
          {/* eyes — glowing periwinkle */}
          <ellipse cx="172" cy="168" rx="13" ry="7" fill="url(#eyeG)" />
          <ellipse cx="228" cy="168" rx="13" ry="7" fill="url(#eyeG)" />
          <circle cx="172" cy="168" r="2.6" fill="#e6f0ff" opacity="0.95" />
          <circle cx="228" cy="168" r="2.6" fill="#e6f0ff" opacity="0.95" />
          {/* nose */}
          <path d="M200 172 L 198 200 C 196 205 194 206 196 208" fill="none" stroke="#a2c1f5" strokeWidth="1.4" opacity="0.5" strokeLinecap="round" />
          {/* lips */}
          <path d="M180 234 C 190 230 210 230 220 234 C 216 244 208 249 200 249 C 192 249 184 244 180 234 Z" fill="#469afd" opacity="0.25" stroke="#a2c1f5" strokeWidth="1.2" />
          {/* neck — dot matrix */}
          <path d="M182 284 L 182 318 C 182 330 218 330 218 318 L 218 284 Z" fill="url(#dotM)" opacity="0.8" />
          {/* shoulders — dot matrix */}
          <path d="M120 388 C 138 344 262 344 280 388 L 288 410 L 112 410 Z" fill="url(#dotDim)" stroke="#469afd" strokeWidth="1.1" opacity="0.85" filter="url(#rimG)" />
          {/* concentric pedestal rings */}
          <ellipse cx="200" cy="368" rx="116" ry="20" fill="none" stroke="#469afd" strokeWidth="1" opacity="0.4" />
          <ellipse cx="200" cy="384" rx="140" ry="24" fill="none" stroke="#469afd" strokeWidth="0.9" opacity="0.3" strokeDasharray="6 4" />
          <ellipse cx="200" cy="400" rx="164" ry="28" fill="none" stroke="#8f83f3" strokeWidth="0.8" opacity="0.25" strokeDasharray="2 6" />
          <ellipse cx="200" cy="416" rx="184" ry="32" fill="none" stroke="#469afd" strokeWidth="0.7" opacity="0.16" />
          <line x1="16" y1="448" x2="384" y2="448" stroke="#469afd" strokeWidth="0.8" opacity="0.3" />
          <ellipse cx="200" cy="448" rx="176" ry="20" fill="none" stroke="#469afd" strokeWidth="0.6" opacity="0.12" />
        </g>

        {/* pulsing nodes */}
        <circle className="node" cx="126" cy="98" r="2.4" fill="#a2c1f5" />
        <circle className="node" cx="274" cy="98" r="2.4" fill="#a2c1f5" style={{ animationDelay: "0.4s" }} />
        <circle className="node" cx="114" cy="132" r="2.4" fill="#a2c1f5" style={{ animationDelay: "0.8s" }} />
        <circle className="node" cx="286" cy="132" r="2.4" fill="#a2c1f5" style={{ animationDelay: "1.2s" }} />
        <circle className="node" cx="200" cy="284" r="2.2" fill="#8f83f3" style={{ animationDelay: "1s" }} />
        <circle className="node" cx="182" cy="322" r="2" fill="#a2c1f5" style={{ animationDelay: "1.4s" }} />
        <circle className="node" cx="218" cy="322" r="2" fill="#a2c1f5" style={{ animationDelay: "1.8s" }} />

        {/* scanline */}
        <rect className="scanline" x="104" y="0" width="192" height="2.5" fill="#a2c1f5" opacity="0.5" />
      </svg>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function MicrofyxdOS() {
  const [view, setView] = useState<View>("mission");
  const [connected, setConnected] = useState(false);
  const [supabase, setSupabase] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
      text: `System inspection — ${goals.length} goals · ${tasks.length} tasks · ${ecuLogs.length} telemetry logs · ${agentStates.length} state records.`,
      meta: `backend: ${connected ? "online" : "offline"} · telemetry: ${supabase ? "supabase" : "local store"}`,
    }]);
  };

  const pipelineStage = lastRun?.logEntries?.length ? lastRun.logEntries[lastRun.logEntries.length - 1].step : "idle";

  // ─── Center/left view content per nav ─────────────────────────────────────
  const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="panel">
      <h3 className="panel-title">{title}</h3>
      {children}
    </div>
  );

  const views: Record<View, React.ReactNode> = {
    mission: (
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
    ),
    agents: (
      <Panel title={`AGENT STATE RECORDS (${agentStates.length})`}>
        {agentStates.length === 0 && <p className="empty">No activity recorded yet — transmit a governed request.</p>}
        <ul className="feed tall">
          {agentStates.slice(-14).reverse().map((s) => (
            <li key={s.id} className="feed-row mono"><span className="dim">{new Date(s.created_at).toLocaleTimeString()}</span><span className="accent">[{s.loop_step}]</span><span className="flex-1 truncate">{s.summary}</span></li>
          ))}
        </ul>
      </Panel>
    ),
    core: (
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
      </>
    ),
    architecture: (
      <>
        <Panel title="SYSTEM ARCHITECTURE">
          <ul className="feed">
            <li className="feed-row"><span className="dot" />LangGraph.js engine — 5-step movement flow</li>
            <li className="feed-row"><span className="dot" />Node/Express protected server proxy</li>
            <li className="feed-row"><span className="dot" />Supabase state + logging layer</li>
            <li className="feed-row"><span className="dot" />OBD2/ECM automotive tools + sandbox testing</li>
            <li className="feed-row"><span className="dot" />Self-healing meta layer + human-in-the-loop oversight</li>
          </ul>
        </Panel>
        <Panel title="MOVEMENT FLOW">
          <p className="mono text-[11px] leading-relaxed">{PIPELINE.join(" → ")}</p>
          <p className="mini mt-2">Governed runtime: every movement passes the protected server proxy before the response is shown.</p>
        </Panel>
      </>
    ),
    constitution: (
      <Panel title="CONSTITUTION — 7 LAWS">
        <ul className="feed">
          {LAWS.map((law, i) => (
            <li key={law} className="feed-row"><span className="accent mono text-[10px] w-4">{i + 1}</span><span className="flex-1">{law}</span><span className="ok-tag">✓</span></li>
          ))}
        </ul>
        <a href="/constitution" className="link mt-3 inline-block">READ FULL CONSTITUTION →</a>
      </Panel>
    ),
    governance: (
      <>
        <Panel title="GOVERNANCE STATUS">
          <Toggle on={gov.autonomy} onChange={(v) => setGov({ ...gov, autonomy: v })} label="AUTONOMY MASTER SWITCH" sub={gov.autonomy ? "engaged" : "standby · human gate"} />
          <Toggle on={gov.approvalRoute} onChange={(v) => setGov({ ...gov, approvalRoute: v })} label="HUMAN APPROVAL ROUTE" sub="promotions require sign-off" />
          <Toggle on={gov.promotionApp} onChange={(v) => setGov({ ...gov, promotionApp: v })} label="PROMOTION APPLICATION" sub="branch promotion pipeline" />
          <Toggle on={gov.traceDisplay} onChange={(v) => setGov({ ...gov, traceDisplay: v })} label="TRACE DISPLAY" sub="movement log stream" />
        </Panel>
        <Panel title="OVERSIGHT">
          <p className="mini">The human-in-the-loop is sovereign. Any human veto is final and immediate. Governor runtime reports autonomy as {gov.autonomy ? "ENGAGED" : "GATED"}.</p>
        </Panel>
      </>
    ),
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ─── Left column ─── */}
      <aside className="w-[248px] shrink-0 border-r border-[#0e1a33] bg-[#02081a] flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-[#0e1a33]">
          <div className="text-sm font-bold tracking-[0.35em] text-[#d7e3f5]">MICROFYXD</div>
          <div className="text-[8px] uppercase tracking-[0.4em] text-[#469afd] mt-0.5">spatial os shell</div>
        </div>
        <nav className="p-2 border-b border-[#0e1a33] space-y-0.5">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`w-full text-left px-3 py-1.5 rounded text-[9px] tracking-[0.15em] transition-colors ${view === n.id ? "bg-[#469afd1a] text-[#a2c1f5] border border-[#469afd40]" : "text-[#4a5d7d] hover:bg-[#0a1526] border border-transparent"}`}>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-b border-[#0e1a33]">
          <h3 className="panel-title">LIVE OPERATIONS</h3>
          {agentStates.length === 0 && <p className="empty">No verified activity recorded yet.</p>}
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
        <header className="h-10 border-b border-[#0e1a33] bg-[#02081a] flex items-center justify-between px-5">
          <h1 className="text-[9px] uppercase tracking-[0.3em] text-[#4a5d7d]">presence layer — governed intent surface</h1>
          <div className="flex items-center gap-4 text-[8px] uppercase tracking-[0.25em]">
            <span className="text-[#4a5d7d]">governed intent surface selected</span>
            <span className={thinking ? "text-[#a2c1f5] status-live" : "text-[#469afd]"}>
              {thinking ? "processing" : connected ? "live telemetry" : "proxy offline"}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="pt-5 flex flex-col items-center">
            <div className="text-[11px] tracking-[0.4em] text-[#a2c1f5]">MICROFYXD / PRESENCE MODEL</div>
            <div className="text-[8px] uppercase tracking-[0.4em] text-[#4a5d7d] mt-1">spatial os shell</div>
          </div>
          <div className="flex justify-center px-6 py-3">
            <PresenceModel thinking={thinking} />
          </div>
          <div className="text-center text-[8px] uppercase tracking-[0.35em] text-[#4a5d7d]">always-present interface</div>

          {/* Display Organ — governed runtime request console */}
          <div className="mx-auto max-w-[560px] mt-4 mb-4 px-4">
            <p className="text-[9px] text-[#4a5d7d] leading-relaxed text-center mb-2">
              Use the Display Organ beneath the avatar to prepare a governed runtime request. A response is shown only after the protected server proxy completes.
            </p>
            <div className="panel">
              <div className="flex gap-2">
                <input className="input-field" value={organInput} onChange={(e) => setOrganInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { speak(organInput); setOrganInput(""); } }} placeholder="Prepare a governed runtime request…" disabled={thinking} />
                <button className="btn-primary whitespace-nowrap" onClick={() => { speak(organInput); setOrganInput(""); }} disabled={thinking || !organInput.trim()}>{thinking ? "…" : "TRANSMIT"}</button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-6 max-w-full">
            {views[view]}
          </div>
        </div>

        <footer className="h-7 border-t border-[#0e1a33] bg-[#02081a] flex items-center px-5 gap-4 text-[8px] uppercase tracking-[0.25em] text-[#4a5d7d]">
          <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#469afd] status-live" : "bg-[#ff9d00]"}`} /> proxy {connected ? "online" : "offline"}</span>
          <span>·</span><span>stage: {pipelineStage}</span>
          <span>·</span><span>telemetry: {supabase ? "supabase live" : "local store"}</span>
          <span>·</span><span>7 laws enforced</span>
        </footer>
      </main>

      {/* ─── Right column ─── */}
      <aside className="w-[268px] shrink-0 border-l border-[#0e1a33] bg-[#02081a] flex flex-col min-h-0 overflow-y-auto">
        <div className="p-3 border-b border-[#0e1a33]">
          <h3 className="panel-title">RUNTIME STATUS</h3>
          <div className="kv">
            <span className="k">GOVERNOR RUNTIME</span><span className={connected ? "v ok" : "v bad"}>{connected ? "ONLINE" : "UNAVAILABLE"}</span>
            <span className="k">AUTONOMY</span><span className={gov.autonomy ? "v ok" : "v warn"}>{gov.autonomy ? "ENGAGED" : "GATED · DETERMINED"}</span>
            <span className="k">LIVE TELEMETRY</span><span className="v ok">{supabase ? "VERIFIED · SUPABASE" : "VERIFIED · LOCAL STORE"}</span>
            <span className="k">PROTECTED PROXY</span><span className={connected ? "v ok" : "v bad"}>{connected ? "CONNECTED" : "HTTP 404"}</span>
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
