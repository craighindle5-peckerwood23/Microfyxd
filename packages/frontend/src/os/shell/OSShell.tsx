"use client";
import { useOS } from "@/os/state/OSContext";
import AIPresence from "@/os/shell/AIPresence";
import AmbientTelemetry from "@/os/shell/AmbientTelemetry";
import Navigation from "@/os/shell/Navigation";
import CommandDock from "@/os/shell/CommandDock";
import MissionWorkspace from "@/os/workspaces/MissionWorkspace";
import IntelligenceWorkspace from "@/os/workspaces/IntelligenceWorkspace";
import AgentsWorkspace from "@/os/workspaces/AgentsWorkspace";
import LaboratoryWorkspace from "@/os/workspaces/LaboratoryWorkspace";
import SystemWorkspace from "@/os/workspaces/SystemWorkspace";

export default function OSShell() {
  const { booted, setBooted, workspace, health, clock, activity, aiState } = useOS();
  const views = { mission: MissionWorkspace, intelligence: IntelligenceWorkspace, agents: AgentsWorkspace, laboratory: LaboratoryWorkspace, system: SystemWorkspace };
  const View = views[workspace];
  if (!booted) { return null; }
  return (
    <div className="h-screen flex flex-col bg-[#010713] text-[#d7e3f5] overflow-hidden">
      {/* top bar — persists across workspaces */}
      <header className="h-9 border-b border-[#0e1a33] bg-[#02081a] flex items-center justify-between px-5 shrink-0">
        <span className="text-[11px] font-bold tracking-[0.4em]">MICROFYXD</span>
        <AmbientTelemetry />
        <span className="flex items-center gap-4 text-[9px] uppercase tracking-[0.3em]">
          <span className={health.backend ? "text-[#00ff9d]" : "text-[#ff6d6d]"}>{health.backend ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}</span>
          <span className="text-[#4a5d7d] font-mono">{clock}</span>
        </span>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* workspace area — changes with navigation */}
        <main className="flex-1 overflow-y-auto min-w-0"><View /></main>

        {/* presence column — the organism, always present */}
        <aside className="w-[380px] shrink-0 border-l border-[#0e1a33] bg-[#01050f] flex flex-col items-center overflow-y-auto">
          <div className="text-[8px] uppercase tracking-[0.35em] text-[#4a5d7d] mt-3">AI PRESENCE</div>
          <AIPresence />
          <div className="w-full px-4 mt-1">
            <div className="text-[8px] uppercase tracking-[0.35em] text-[#4a5d7d] mb-1.5">LIVE OPERATIONS</div>
            <ul className="feed small">
              {[...activity].reverse().slice(0, 8).map((a) => (
                <li key={a.id} className="feed-row mono"><span className="dim">{a.ts}</span><span className="accent">[{a.source}]</span><span className="flex-1 truncate">{a.message}</span></li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <Navigation />
      <CommandDock />
      <div className="sr-only">{"state:" + aiState}</div>
      <button className="hidden" onClick={() => setBooted(false)}>reboot</button>
    </div>
  );
}
