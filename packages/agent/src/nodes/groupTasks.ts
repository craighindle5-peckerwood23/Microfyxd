import type { AgentStateType } from "../state.js";

export async function groupTasksNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const raw = Array.isArray(state.input) ? state.input : [];
  const grouped = raw.reduce<Record<string, unknown[]>>((acc, item) => {
    const key = String((item as Record<string, unknown>).unit || "unknown");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return {
    groupedOutput: grouped,
    next: "planning",
    logEntries: [...(state.logEntries || []), { step: "groupTasks", message: `Grouped ${raw.length} items into ${Object.keys(grouped).length} groups`, timestamp: new Date().toISOString(), level: "info" }],
  };
}
