"use client";
import { useState } from "react";
import { useOS } from "@/os/state/OSContext";

interface Agent { id: string; role: string; status: string; detail: string; }

export default function AgentsWorkspace() {
  const { run, running, health } = useOS();
  const [selected, setSelected] = useState<Agent | null>(null);
  const step = (name: string) => (run?.steps || []).find((s) => s.step === name);
  const agents: Agent[] = [
    { id: "planner", role: "PLANNER", status: running ? "ACTIVE" : step("planning") ? "COMPLETE" : "IDLE", detail: "Decomposes the mission into governed tasks." },
    { id: "coder", role: "CODER", status: running ? "ACTIVE" : step("writeCode") ? "COMPLETE" : "IDLE", detail: "Writes the code change on an isolated branch." },
    { id: "tester", role: "TESTER", status: running ? "ANALYZING" : step("sandboxTest") ? (run?.sandboxOk ? "COMPLETE" : "FAILED") : "WAITING", detail: "Executes sandbox verification before any promotion." },
    { id: "gitops", role: "GIT OPS", status: running ? "ACTIVE" : step("gitOpsSubmit") ? "COMPLETE" : "IDLE", detail: "Creates the patch and requests human approval." },
  ];
  return (
    <div className="p-5 space-y-4">
      <h2 className="text-[11px] uppercase tracking-[0.4em] text-[#a2c1f5]">Agent Network</h2>
      <div className="panel">
        <pre className="mono text-[10px] text-[#7d8fae] leading-relaxed">{`                 MICROFYXD
                      │
         ┌────────────┼────────────┐
         │            │            │
      PLANNER      CODER       GIT OPS
      ${agents[0].status.padEnd(12)}${agents[1].status.padEnd(12)}${agents[3].status}
                      │
                   TESTER
                   ${agents[2].status}`}</pre>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {agents.map((a) => (
          <button key={a.id} onClick={() => setSelected(a)} className="panel text-left hover:border-[#469afd60]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] tracking-[0.2em] text-[#d7e3f5]">{a.role}</span>
              <span className={"text-[9px] " + (a.status === "ACTIVE" || a.status === "ANALYZING" ? "text-[#00ff9d] status-live" : a.status === "FAILED" ? "text-[#ff6d6d]" : "text-[#4a5d7d]")}>{a.status}</span>
            </div>
            <p className="text-[9px] text-[#4a5d7d] mt-1.5">{a.detail}</p>
          </button>
        ))}
      </div>
      {selected && (
        <div className="panel">
          <h3 className="panel-title">{selected.role} AGENT</h3>
          <div className="kv">
            <span className="k">Mission</span><span className="v">{run?.mission || "standby"}</span>
            <span className="k">Status</span><span className="v accent">{selected.status}</span>
            <span className="k">Files</span><span className="v mono">src/handler.ts</span>
            <span className="k">Engine records</span><span className="v">{health.records}</span>
          </div>
          <p className="mini mt-2">{selected.detail}</p>
        </div>
      )}
    </div>
  );
}
