"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type Workspace = "mission" | "intelligence" | "agents" | "laboratory" | "system";
export type AIState = "idle" | "listening" | "thinking" | "executing" | "analyzing" | "waiting" | "alert";

export interface ActivityEvent { id: string; source: string; message: string; ts: string; level?: string; }
export interface MovementRun {
  steps: Array<{ step: string; message: string; done: boolean }>;
  code: string; patch: string; branchName: string; gitStatus: string;
  sandboxOk: boolean; escalated: boolean; mission: string;
}
interface Health { backend: boolean; supabase: boolean; records: number; goals: number; }
interface OSCtx {
  booted: boolean; setBooted: (b: boolean) => void;
  workspace: Workspace; setWorkspace: (w: Workspace) => void;
  aiState: AIState; setAIState: (s: AIState) => void;
  activity: ActivityEvent[]; pushActivity: (source: string, message: string, level?: string) => void;
  health: Health;
  run: MovementRun | null; setRun: (r: MovementRun | null) => void;
  running: boolean;
  executeMission: (text: string) => Promise<void>;
  clock: string;
}

const Ctx = createContext<OSCtx | null>(null);
export const useOS = () => { const c = useContext(Ctx); if (!c) throw new Error("useOS outside provider"); return c; };

const STEP_MAP: Record<string, AIState> = {
  groupTasks: "thinking", planning: "thinking", writeCode: "executing",
  sandboxTest: "analyzing", gitOpsSubmit: "executing", movementComplete: "idle",
};

export function OSProvider({ children }: { children: ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>("mission");
  const [aiState, setAIState] = useState<AIState>("idle");
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [health, setHealth] = useState<Health>({ backend: false, supabase: false, records: 0, goals: 0 });
  const [run, setRun] = useState<MovementRun | null>(null);
  const [running, setRunning] = useState(false);
  const [clock, setClock] = useState("");

  const pushActivity = useCallback((source: string, message: string, level = "info") => {
    setActivity((p) => [...p.slice(-49), { id: Math.random().toString(36).slice(2), source, message, ts: new Date().toLocaleTimeString(), level }]);
  }, []);

  // event bridge — poll the engine's real telemetry and map it to OS state
  useEffect(() => {
    let lastSeen = "";
    const poll = async () => {
      try {
        const [t, s, g] = await Promise.all([
          fetch("/api/test").then((r) => r.json()),
          fetch("/api/state").then((r) => r.json()),
          fetch("/api/goals").then((r) => r.json()),
        ]);
        setHealth((h) => ({ ...h, backend: t.ok, supabase: Boolean(t.supabase), records: s.states ? s.states.length : 0, goals: g.goals ? g.goals.length : 0 }));
        if (s.states && s.states.length) {
          const latest = s.states[0];
          if (latest.id !== lastSeen) {
            lastSeen = latest.id;
            pushActivity(latest.loop_step, latest.summary);
            if (!running) setAIState(STEP_MAP[latest.loop_step] || "idle");
          }
        }
      } catch { setHealth((h) => ({ ...h, backend: false })); }
    };
    poll();
    const iv = setInterval(poll, 4000);
    return () => clearInterval(iv);
  }, [pushActivity, running]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick(); const iv = setInterval(tick, 10000); return () => clearInterval(iv);
  }, []);

  const executeMission = useCallback(async (text: string) => {
    if (!text.trim() || running) return;
    setRunning(true);
    pushActivity("operator", "Mission accepted: " + text);
    setAIState("thinking");
    try {
      const res = await fetch("/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: [{ unit: "api", targetFile: "src/handler.ts", description: text }] }) }).then((r) => r.json());
      if (res.ok && res.output) {
        const o = res.output;
        const steps = (o.logEntries || []).map((l: { step: string; message: string }) => ({ step: l.step, message: l.message, done: true }));
        setRun({ steps, code: o.code, patch: o.patch, branchName: o.branchName, gitStatus: o.gitStatus, sandboxOk: o.sandboxResult?.success, escalated: o.escalated, mission: text });
        pushActivity("governor", "Movement complete — branch " + o.branchName + (o.escalated ? " · awaiting human approval" : ""));
        setAIState(o.escalated ? "waiting" : "idle");
      } else { pushActivity("governor", "Movement failed — runtime error", "error"); setAIState("alert"); }
    } catch { pushActivity("governor", "Event bridge unreachable — backend offline", "error"); setAIState("alert"); }
    setRunning(false);
  }, [running, pushActivity]);

  return (
    <Ctx.Provider value={{ booted, setBooted, workspace, setWorkspace, aiState, setAIState, activity, pushActivity, health, run, setRun, running, executeMission, clock }}>
      {children}
    </Ctx.Provider>
  );
}
