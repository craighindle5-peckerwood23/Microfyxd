"use client";
import { useState } from "react";
import { useOS } from "@/os/state/OSContext";

export default function LaboratoryWorkspace() {
  const { run, executeMission, running } = useOS();
  const [pane, setPane] = useState<"CODE" | "DIFF">("CODE");
  const FILES = ["packages/agent/src/index.ts", "packages/backend/server.js", "packages/tools/src/sandbox.ts", "src/handler.ts"];
  return (
    <div className="p-5 space-y-4">
      <h2 className="text-[11px] uppercase tracking-[0.4em] text-[#a2c1f5]">Laboratory — engineering bay</h2>
      <div className="flex gap-[1px] text-[8px] uppercase tracking-[0.2em]">
        {["CODE", "RUN", "TEST", "DIFF", "VERIFY", "PROMOTE"].map((b) => (
          <button key={b} onClick={() => { if (b === "RUN" || b === "CODE" || b === "TEST") { setPane("CODE"); executeMission("Laboratory request — regenerate " + b.toLowerCase() + " pass for src/handler.ts"); } if (b === "DIFF") setPane("DIFF"); }}
            className={"flex-1 py-1.5 border " + (pane === b || (b === "CODE" && pane === "CODE") ? "bg-[#469afd1a] border-[#469afd60] text-[#a2c1f5]" : "border-[#0e1a33] text-[#4a5d7d] hover:text-[#7d8fae]")}>
            {b}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[180px_1fr] gap-2">
        <div className="panel">
          <h3 className="panel-title">FILES</h3>
          <ul className="feed">{FILES.map((f) => <li key={f} className="feed-row mono"><span className="dim">▸</span><span className="truncate">{f}</span></li>)}</ul>
          <p className="mini mt-2">All edits isolated to sandbox branches. Production is never touched directly.</p>
        </div>
        <div className="panel min-h-[240px]">
          <h3 className="panel-title">{pane === "DIFF" ? "DIFF — PATCH" : "EDITOR — src/handler.ts"}</h3>
          {run ? (
            pane === "DIFF"
              ? <pre className="code whitespace-pre-wrap">{run.patch || "(no patch content)"}</pre>
              : <pre className="code">{run.code}</pre>
          ) : <p className="empty">{running ? "The organism is working…" : "No artifact yet — request a change from the dock or press RUN."}</p>}
          {run && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={"badge " + (run.sandboxOk ? "ok" : "bad")}>TEST {run.sandboxOk ? "PASS" : "FAIL"}</span>
              <span className={"badge " + (run.escalated ? "bad" : "info")}>{run.escalated ? "AWAITING PROMOTE APPROVAL" : "READY"}</span>
              <span className="badge info">{run.gitStatus}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
