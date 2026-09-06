import { END } from "@langchain/langgraph";
import type { AgentStateType } from "../state.js";

export async function sandboxTestNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const attempts = state.attempts + 1;

  // Simulated sandbox test — in production this would run the code in a VM
  const success = Math.random() > 0.3 || !process.env.OPENAI_API_KEY;
  const result: Record<string, unknown> = {
    success,
    errors: success ? [] : ["SyntaxError: unexpected token"],
    warnings: [],
    output: success ? "Build + tests passed" : "Build failed",
  };

  const shouldEscalate = !success && attempts >= 3;

  return {
    sandboxResult: result,
    attempts,
    escalated: shouldEscalate,
    next: shouldEscalate ? "oversight" : success ? "gitOpsSubmit" : "sandboxTest",
    logEntries: [...(state.logEntries || []), {
      step: "sandboxTest",
      message: success ? "Sandbox passed" : `Sandbox failed (attempt ${attempts})`,
      timestamp: new Date().toISOString(),
      level: success ? "info" : "warn",
    }],
  };
}
