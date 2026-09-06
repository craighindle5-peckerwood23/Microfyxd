"use client";
import { useState, useCallback } from "react";
import { useOS } from "@/os/state/OSContext";

interface Goal { id: string; text: string; status: string; }
interface EcuLog { id: string; rpm: number; coolant: number; throttle: number; dtc: string | null; }
const LAWS = ["Safety First", "Never Silently Corrupt", "Minimal Targeted Changes", "Always Verify", "Escalate on Failure", "Log Everything", "Respect Human Oversight"];

export default function SystemWorkspace() {
  const { health, activity, pushActivity } = useOS();
  const [gov, setGov] = useState({ autonomy: false, approvalRoute: true, promotionApp: false });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [ecu, setEcu] = useState<EcuLog[]>([]);
  const [ecuForm, setEcuForm] = useState({ rpm: 750, coolant: 195, throttle: 0, dtc: "" });
  const [newGoal, setNewGoal] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [g, e] = await Promise.all([fetch("/api/goals").then((r) => r.json()), fetch("/api/ecu").then((r) => r.json())]);
      if (g.goals) setGoals(g.goals); if (e.logs) setEcu(e.logs);
    } catch { /* offline */ }
  }, []);
  useState(() => { refresh(); });

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: newGoal }) });
    pushActivity("workspace", "Goal registered: " + newGoal);
    setNewGoal(""); refresh();
  };
  const logEcu = async () => {
    await fetch("/api/ecu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...ecuForm, dtc: ecuForm.dtc || null }) });
    pushActivity("obd2", "Telemetry logged — " + ecuForm.rpm + "rpm");
    refresh();
  };

  return (
    <div className="p-5 space-y-4">
      <h2 className="text-[11px] uppercase tracking-[0.4em] text-[#a2c1f5]">System — diagnostics & control</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="panel">
          <h3 className="panel-title">RUNTIME STATUS</h3>
          <div className="kv">
            <span className="k">BACKEND</span><span className={health.backend ? "v ok" : "v bad"}>{health.backend ? "ONLINE" : "OFFLINE"}</span>
            <span className="k">STATE STORE</span><span className="v">{health.supabase ? "SUPABASE" : "LOCAL FALLBACK"}</span>
            <span className="k">ENGINE RECORDS</span><span className="v accent">{health.records}</span>
            <span className="k">EVENTS THIS SESSION</span><span className="v">{activity.length}</span>
          </div>
        </div>
        <div className="panel">
          <h3 className="panel-title">GOVERNANCE</h3>
          {(["autonomy", "approvalRoute", "promotionApp"] as const).map((k) => {
            const labels = { autonomy: ["AUTONOMY MASTER", "engaged" ], approvalRoute: ["HUMAN APPROVAL ROUTE", "active"], promotionApp: ["PROMOTION APPLICATION", "applied"] };
            const on = gov[k];
            return (
              <button key={k} onClick={() => { setGov({ ...gov, [k]: !on }); pushActivity("governance", labels[k][0] + " " + (on ? "disengaged" : labels[k][1])); }}
                className="w-full flex items-center justify-between py-1.5 text-left">
                <span className="text-[10px] text-[#a2c1f5]">{labels[k][0]}</span>
                <span className={"relative w-8 h-4 rounded-full border " + (on ? "bg-[#469afd30] border-[#469afd]" : "bg-[#020817] border-[#0e1a33]")}>
                  <span className={"absolute top-0.5 w-3 h-3 rounded-full " + (on ? "left-4 bg-[#a2c1f5]" : "left-0.5 bg-[#1e2f52]")} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">GOALS — {goals.length}</h3>
        <div className="flex gap-2 mb-2">
          <input className="input-field" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGoal()} placeholder="Register a mission objective…" />
          <button className="btn-primary whitespace-nowrap" onClick={addGoal}>COMMIT</button>
        </div>
        <ul className="feed">{[...goals].reverse().map((g) => <li key={g.id} className="feed-row"><span className="dot" /><span className="flex-1 truncate">{g.text}</span><span className="tag">{g.status}</span></li>)}</ul>
      </div>

      <div className="panel">
        <h3 className="panel-title">OBD2 / ECM TELEMETRY</h3>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {[["RPM", "rpm"], ["COOLANT °F", "coolant"], ["THROTTLE %", "throttle"], ["DTC", "dtc"]].map(([label, key]) => (
            <label key={key} className="mini">{label}
              <input type={key === "dtc" ? "text" : "number"} className="input-field mt-1" value={(ecuForm as Record<string, string | number>)[key]}
                onChange={(e) => setEcuForm({ ...ecuForm, [key]: key === "dtc" ? e.target.value : Number(e.target.value) })} placeholder={key === "dtc" ? "P0300" : ""} />
            </label>
          ))}
        </div>
        <button className="btn-secondary w-full" onClick={logEcu}>LOG TELEMETRY</button>
        <ul className="feed mt-2">{[...ecu].reverse().slice(0, 6).map((l) => <li key={l.id} className="feed-row mono"><span className="dim">{l.rpm}rpm</span><span>{l.coolant}°F {l.throttle}%</span>{l.dtc && <span className="warn">DTC {l.dtc}</span>}</li>)}</ul>
      </div>

      <div className="panel">
        <h3 className="panel-title">CONSTITUTION — 7 LAWS</h3>
        <ul className="feed">{LAWS.map((law, i) => <li key={law} className="feed-row"><span className="accent mono text-[10px] w-4">{i + 1}</span><span className="flex-1">{law}</span><span className="ok-tag">✓</span></li>)}</ul>
        <a href="/constitution" className="link mt-3 inline-block">READ FULL CONSTITUTION →</a>
      </div>
    </div>
  );
}
