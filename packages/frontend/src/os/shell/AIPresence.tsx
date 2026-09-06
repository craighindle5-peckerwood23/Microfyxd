"use client";
import { useOS } from "@/os/state/OSContext";

// AI presence — the organism's face. State comes from the real system, not animation.
export default function AIPresence() {
  const { aiState, health } = useOS();
  const active = aiState !== "idle";
  const waiting = aiState === "waiting";
  const alert = aiState === "alert";
  const stroke = alert ? "#ff6d6d" : waiting ? "#8f83f3" : "#8fc0ff";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 400" className={`w-full max-w-[300px] ${active ? "thinking" : ""}`} aria-label="Microfyxd AI presence">
        <defs>
          <pattern id="pDot" width="5.5" height="5.5" patternUnits="userSpaceOnUse">
            <circle cx="2.75" cy="2.75" r="1.4" fill={alert ? "#ff9d9d" : "#5a9bf5"} opacity="0.85" />
          </pattern>
          <radialGradient id="pFill" cx="50%" cy="40%" r="58%">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.5" />
            <stop offset="60%" stopColor="#2f6cd6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a3f8f" stopOpacity="0.1" />
          </radialGradient>
          <radialGradient id="pEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor={waiting ? "#c0b5ff" : "#c0d8ff"} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#469afd" stopOpacity="0" />
          </radialGradient>
          <filter id="pRim" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g className={active ? "spin-ring" : ""} opacity="0.4">
          <ellipse cx="150" cy="172" rx="144" ry="42" fill="none" stroke={stroke} strokeWidth="1.3" strokeDasharray="10 8" />
        </g>
        <g className={active ? "spin-ring-rev" : ""} opacity="0.3">
          <ellipse cx="150" cy="172" rx="116" ry="30" fill="none" stroke="#8f83f3" strokeWidth="1" strokeDasharray="3 9" />
        </g>
        <g className="flicker">
          <path d="M150 12 C 200 12 231 48 231 92 C 231 115 225 134 217 149 C 211 160 207 169 204 180 C 200 193 192 204 179 212 C 172 216 161 218 150 218 C 139 218 128 216 121 212 C 108 204 100 193 96 180 C 93 169 89 160 83 149 C 75 134 69 115 69 92 C 69 48 100 12 150 12 Z" fill="url(#pFill)" />
          <path d="M150 12 C 200 12 231 48 231 92 C 231 115 225 134 217 149 C 211 160 207 169 204 180 C 200 193 192 204 179 212 C 172 216 161 218 150 218 C 139 218 128 216 121 212 C 108 204 100 193 96 180 C 93 169 89 160 83 149 C 75 134 69 115 69 92 C 69 48 100 12 150 12 Z" fill="url(#pDot)" />
          <path d="M150 12 C 200 12 231 48 231 92 C 231 115 225 134 217 149 C 211 160 207 169 204 180 C 200 193 192 204 179 212 C 172 216 161 218 150 218 C 139 218 128 216 121 212 C 108 204 100 193 96 180 C 93 169 89 160 83 149 C 75 134 69 115 69 92 C 69 48 100 12 150 12 Z" fill="none" stroke={stroke} strokeWidth="2" filter="url(#pRim)" />
          <path d="M84 56 C 108 34 192 34 216 56" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.4" />
          <path d="M76 84 C 106 64 194 64 224 84" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.35" />
          <path d="M73 108 C 104 92 196 92 227 108" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.35" />
          <path d="M80 130 C 108 116 192 116 220 130" fill="none" stroke="#a2c1f5" strokeWidth="0.9" opacity="0.4" />
          <ellipse cx="127" cy="116" rx="16" ry="9" fill="url(#pEye)" />
          <ellipse cx="173" cy="116" rx="16" ry="9" fill="url(#pEye)" />
          <circle cx="127" cy="116" r={active ? 4 : 3} fill="#ffffff" opacity="0.98" />
          <circle cx="173" cy="116" r={active ? 4 : 3} fill="#ffffff" opacity="0.98" />
          <path d="M136 216 L 136 242 C 136 251 164 251 164 242 L 164 216 Z" fill="url(#pDot)" />
          <path d="M96 298 C 110 262 190 262 204 298 L 210 314 L 90 314 Z" fill="url(#pFill)" stroke={stroke} strokeWidth="1.4" filter="url(#pRim)" />
          <ellipse cx="150" cy="284" rx="92" ry="15" fill="none" stroke={stroke} strokeWidth="1.3" opacity="0.5" />
          <ellipse cx="150" cy="297" rx="114" ry="19" fill="none" stroke="#6cabff" strokeWidth="1.1" opacity="0.4" strokeDasharray="8 6" />
          <ellipse cx="150" cy="310" rx="136" ry="23" fill="none" stroke="#8f83f3" strokeWidth="1" opacity="0.3" strokeDasharray="3 8" />
          <line x1="8" y1="336" x2="292" y2="336" stroke={stroke} strokeWidth="1.2" opacity="0.4" />
        </g>
        <rect className={active ? "scanline" : ""} x="63" y="0" width="174" height="2.5" fill="#c0d8ff" opacity={active ? 0.7 : 0.25} />
      </svg>
      <div className={"text-[9px] uppercase tracking-[0.4em] mt-1 " + (alert ? "text-[#ff6d6d]" : waiting ? "text-[#c0b5ff]" : "text-[#7d8fae]")}>
        {aiState} {health.backend ? "" : "· offline"}
      </div>
    </div>
  );
}
