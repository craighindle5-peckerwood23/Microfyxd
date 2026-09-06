"use client";
import { useOS } from "@/os/state/OSContext";

export default function AmbientTelemetry() {
  const { health, running, activity } = useOS();
  const memory = Math.min(96, 38 + health.records * 2);
  return (
    <div className="flex items-center justify-center gap-6 text-[9px] font-mono uppercase tracking-[0.25em] text-[#4a5d7d]">
      <span>memory <span className="text-[#a2c1f5]">{memory}%</span></span>
      <span>agents <span className="text-[#a2c1f5]">{Math.max(1, Math.min(12, 1 + (activity.length > 2 ? 3 : 0) + (health.goals > 0 ? 1 : 0)))}</span></span>
      <span>graph <span className={running ? "text-[#00ff9d] status-live" : "text-[#469afd]"}>{running ? "ACTIVE" : "READY"}</span></span>
      <span>telemetry <span className={health.backend ? "text-[#00ff9d]" : "text-[#ff6d6d]"}>{health.backend ? (health.supabase ? "SUPABASE" : "VERIFIED") : "OFFLINE"}</span></span>
    </div>
  );
}
