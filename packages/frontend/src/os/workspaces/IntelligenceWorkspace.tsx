"use client";
import { useOS } from "@/os/state/OSContext";

export default function IntelligenceWorkspace() {
  const { health, activity, run } = useOS();
  return (
    <div className="p-5 space-y-4">
      <h2 className="text-[11px] uppercase tracking-[0.4em] text-[#a2c1f5]">Intelligence</h2>
      <div className="panel">
        <pre className="mono text-[10px] text-[#7d8fae] leading-relaxed">{`        MEMORY (${health.records} records)
           │
           ▼
       REASONING
       /       \\
  PLANNING    LEARNING
      │           │
      ▼           ▼
  AGENTS ───── AUTOMATION
      │
      ▼
  EXECUTION ${run ? "→ last: " + run.branchName : "(idle)"}
      │
      ▼
  WORKSPACE`}</pre>
      </div>
      <div className="panel">
        <h3 className="panel-title">COGNITIVE STATE</h3>
        <div className="kv">
          <span className="k">EVENTS PROCESSED</span><span className="v accent">{activity.length}</span>
          <span className="k">GOALS HELD</span><span className="v">{health.goals}</span>
          <span className="k">GRAPH</span><span className="v">{run ? "5-NODE MOVEMENT" : "DORMANT"}</span>
          <span className="k">TELEMETRY</span><span className={health.backend ? "v ok" : "v bad"}>{health.backend ? (health.supabase ? "SUPABASE LIVE" : "LOCAL STORE") : "OFFLINE"}</span>
        </div>
      </div>
    </div>
  );
}
