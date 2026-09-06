import { END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { SYSTEM_HEADER } from "../constitution.js";
import type { AgentStateType } from "../state.js";

export interface OversightDecision {
  approve: boolean;
  reason: string;
  escalate: boolean;
}

const llm = process.env.OPENAI_API_KEY
  ? new ChatOpenAI({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function oversightNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  return {
    humanApprovalRequired: true,
    escalated: true,
    next: END,
    result: {
      ...state.result,
      oversight: { escalate: true, reason: "Sandbox failed 3 times — human review required" },
    },
    logEntries: [...(state.logEntries || []), {
      step: "oversight",
      message: "Escalated to human oversight after 3 failed sandbox attempts",
      timestamp: new Date().toISOString(),
      level: "error",
    }],
  };
}

export async function reviewSelfHeal(
  errorContext: { logs?: string; stackTrace?: string },
  patchResult: { success: boolean; patch?: string }
): Promise<OversightDecision> {
  if (!llm) {
    return { approve: false, reason: "No LLM available for oversight review", escalate: true };
  }

  try {
    const res = await llm.invoke([
      { role: "system", content: SYSTEM_HEADER + "\nYou are a cautious reviewer. Respond as JSON: { \"approve\": boolean, \"reason\": string, \"escalate\": boolean }" },
      { role: "user", content: `Context: ${JSON.stringify(errorContext)}\nResult: ${JSON.stringify(patchResult)}` },
    ]);
    const raw = typeof res.content === "string" ? res.content : "";
    return JSON.parse(raw) as OversightDecision;
  } catch {
    return { approve: false, reason: "Oversight parse failure", escalate: true };
  }
}
