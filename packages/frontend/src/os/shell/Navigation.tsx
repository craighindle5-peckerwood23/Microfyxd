"use client";
import { useOS, Workspace } from "@/os/state/OSContext";

const ITEMS: Array<[Workspace, string]> = [
  ["mission", "◉ Mission"], ["intelligence", "AI"], ["agents", "Agents"], ["laboratory", "Lab"], ["system", "System"],
];

export default function Navigation() {
  const { workspace, setWorkspace, running } = useOS();
  return (
    <nav className="flex items-center justify-center gap-2 py-2 border-t border-[#0e1a33] bg-[#02081a]">
      {ITEMS.map(([id, label]) => (
        <button key={id} onClick={() => setWorkspace(id)} disabled={running}
          className={"px-5 py-1.5 rounded text-[10px] uppercase tracking-[0.25em] transition-colors " +
            (workspace === id ? "bg-[#469afd1a] text-[#a2c1f5] border border-[#469afd50]" : "text-[#4a5d7d] border border-transparent hover:text-[#7d8fae]")}>
          {label}
        </button>
      ))}
    </nav>
  );
}
