import { ChatOpenAI } from "@langchain/openai";
import { SYSTEM_HEADER } from "../constitution.js";
import type { AgentStateType } from "../state.js";

const llm = process.env.OPENAI_API_KEY
  ? new ChatOpenAI({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function planningNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const firstGroup = Object.values(state.groupedOutput)[0];
  const task = firstGroup?.[0] ?? null;
  const target = ((task as Record<string, unknown>)?.targetFile as string) || "src/handler.ts";

  let plan = `Modify ${target}`;

  if (llm) {
    try {
      const res = await llm.invoke([
        { role: "system", content: SYSTEM_HEADER + "\nYou are a Microfyxd planning agent. Return a concise one-line plan." },
        { role: "user", content: `Plan a modification for ${target}.` },
      ]);
      plan = typeof res.content === "string" ? res.content : plan;
    } catch { /* fall back to heuristic */ }
  }

  return {
    task: task as Record<string, unknown> | null,
    targetFile: target,
    plan,
    next: "writeCode",
    logEntries: [...(state.logEntries || []), { step: "planning", message: `Plan: ${plan}`, timestamp: new Date().toISOString(), level: "info" }],
  };
}
