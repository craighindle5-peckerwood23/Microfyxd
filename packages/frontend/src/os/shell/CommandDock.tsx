"use client";
import { useState } from "react";
import { useOS } from "@/os/state/OSContext";

export default function CommandDock() {
  const { executeMission, running, aiState } = useOS();
  const [text, setText] = useState("");
  const submit = () => { executeMission(text); setText(""); };
  return (
    <div className="px-6 py-3 border-t border-[#0e1a33] bg-[#01050f]">
      <div className="max-w-[720px] mx-auto flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          disabled={running}
          placeholder={running ? "The organism is executing…" : "What should I do? — what are we accomplishing?"}
          className="input-field flex-1" />
        <button onClick={submit} disabled={running || !text.trim()} className="btn-primary whitespace-nowrap">
          {running ? aiState.toUpperCase() : "EXECUTE"}
        </button>
      </div>
    </div>
  );
}
