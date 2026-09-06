"use client";
import { useEffect, useState } from "react";

const LINES = [
  ["CORE", "ONLINE"], ["MEMORY", "ONLINE"], ["ORCHESTRATOR", "ONLINE"],
  ["AGENTS", "REGISTERED"], ["SANDBOX", "READY"], ["GOVERNANCE", "READY"],
  ["TELEMETRY", "CONNECTED"], ["AI PRESENCE", "FORMING"],
];

export default function BootExperience({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [nominal, setNominal] = useState(false);
  useEffect(() => {
    if (visible < LINES.length) { const t = setTimeout(() => setVisible((v) => v + 1), 260); return () => clearTimeout(t); }
    const t1 = setTimeout(() => setNominal(true), 400);
    const t2 = setTimeout(onDone, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible, onDone]);
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono">
      <div className="text-[#a2c1f5] text-sm tracking-[0.5em] mb-6 animate-pulse">MICROFYXD INITIALIZING</div>
      <div className="w-[280px] text-[10px] text-[#469afd] space-y-1.5">
        {LINES.slice(0, visible).map(([k, v]) => (
          <div key={k} className="flex justify-between"><span>{k}</span><span className="text-[#a2c1f5]">............. {v}</span></div>
        ))}
      </div>
      {nominal && <div className="mt-8 text-[#00ff9d] text-xs tracking-[0.4em]">SYSTEM NOMINAL</div>}
    </div>
  );
}
