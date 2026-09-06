"use client";
import { useState } from "react";
import { useOS } from "@/os/state/OSContext";

export default function MissionWorkspace() {
  const { run, running, executeMission, activity } = useOS();
  const [mission, setMission] = useState("");
  return (
    <div className="p-5 space-y-4">
      <h2 className="text-[11px] uppercase tracking-[0.4em] text-[#a2c1f5]">Mission</h2>
      <p className="text-[10px] text-[#4a5d7d]">What are we accomplishing?</p>
      <div className="flex gap-2">
        <textarea value={mission} onChange={(e) => setMission(e.target.value)} disabled={running}
          placeholder="Build me a SaaS application for automotive fleet diagnostics…"
          className="input-field min-h-[64px] flex-1 leading-relaxed" />
        <button onClick={() => { executeMission(mission); setMission(""); }} disabled={running || !mission.trim()} className="btn-primary">EXECUTE</button>
      </div>

      {run && (
        <div className="panel">
          <h3 className="panel-title">MISSION ACCEPTED — {run.mission}</h3>
          <ul className="feed">
            {run.steps.map((s) => (
              <li key={s.step} className="feed-row mono"><span className="ok-tag">●</span><span className="accent w-28">[{s.step}]</span><span className="flex-1 truncate">{s.message}</span></li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={"badge " + (run.sandboxOk ? "ok" : "bad")}>SANDBOX {run.sandboxOk ? "VERIFIED" : "FAILED"}</span>
            <span className="badge info">{run.branchName}</span>
            {run.escalated && <span className="badge bad">HUMAN APPROVAL REQUIRED</span>}
          </div>
        </div>
      )}

      <div className="panel">
        <h3 className="panel-title">ACTIVITY — EVENT BRIDGE</h3>
        {activity.length === 0 && <p className="empty">No events yet. Submit a mission.</p>}
        <ul className="feed tall">
          {[...activity].reverse().map((a) => (
            <li key={a.id} className="feed-row mono"><span className="dim">{a.ts}</span><span className="accent">[{a.source}]</span><span className="flex-1 truncate">{a.message}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
