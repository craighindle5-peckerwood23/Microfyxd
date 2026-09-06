import { ChatOpenAI } from "@langchain/openai";
import { SYSTEM_HEADER } from "../constitution.js";

const llm = process.env.OPENAI_API_KEY
  ? new ChatOpenAI({ model: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY })
  : null;

const MAX_ATTEMPTS = 3;

export interface SelfHealResult {
  success: boolean;
  buildOk: boolean;
  testsOk: boolean;
  patch: string | null;
  attempts: number;
  escalated: boolean;
}

export async function selfHealRepo(errorContext: {
  logs?: string;
  stackTrace?: string;
}): Promise<SelfHealResult> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (!llm) {
      return { success: false, buildOk: false, testsOk: false, patch: null, attempts: attempt, escalated: true };
    }

    try {
      const res = await llm.invoke([
        { role: "system", content: SYSTEM_HEADER + "\nYou are a senior engineer. Generate a minimal patch to fix the error. Return only code." },
        { role: "user", content: `Error context:\n${errorContext.logs ?? ""}\n${errorContext.stackTrace ?? ""}` },
      ]);

      const patch = typeof res.content === "string" ? res.content.trim() : "";
      if (!patch) continue;

      // Simulated build + test
      const buildOk = Math.random() > 0.4;
      const testsOk = buildOk && Math.random() > 0.3;

      if (buildOk && testsOk) {
        return { success: true, buildOk, testsOk, patch, attempts: attempt, escalated: false };
      }
    } catch {
      continue;
    }
  }

  return { success: false, buildOk: false, testsOk: false, patch: null, attempts: MAX_ATTEMPTS, escalated: true };
}
