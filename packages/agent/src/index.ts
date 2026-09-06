export { SEVEN_LAWS, SYSTEM_HEADER, type Law } from "./constitution.js";
export { AgentGraphState, type AgentStateType } from "./state.js";
export { AgentLogger, type LogEntry } from "./logger.js";
export { app } from "./graph.js";
export { groupTasksNode } from "./nodes/groupTasks.js";
export { planningNode } from "./nodes/planning.js";
export { writeCodeNode } from "./nodes/writeCode.js";
export { sandboxTestNode } from "./nodes/sandboxTest.js";
export { gitOpsSubmitNode } from "./nodes/gitOpsSubmit.js";
export { oversightNode, reviewSelfHeal, type OversightDecision } from "./nodes/oversight.js";
export { selfHealRepo, type SelfHealResult } from "./nodes/selfHeal.js";

export interface LangGraphOutput {
  task: Record<string, unknown> | null;
  code: string;
  result: Record<string, unknown>;
  groupedOutput: Record<string, unknown[]>;
  targetFile: string;
  plan: string;
  sandboxResult: Record<string, unknown> | null;
  patch: string;
  branchName: string;
  gitStatus: string;
  attempts: number;
  escalated: boolean;
  logEntries: Array<{ step: string; message: string; timestamp: string; level: string }>;
}

export async function runLangGraph(
  input: string | Record<string, unknown>[]
): Promise<LangGraphOutput> {
  const { app } = await import("./graph.js");
  const finalState = (await app.invoke({ input })) as AgentStateType;

  return {
    task: finalState.task,
    code: finalState.code,
    result: finalState.result,
    groupedOutput: finalState.groupedOutput,
    targetFile: finalState.targetFile,
    plan: finalState.plan,
    sandboxResult: finalState.sandboxResult,
    patch: finalState.patch,
    branchName: finalState.branchName,
    gitStatus: finalState.gitStatus,
    attempts: finalState.attempts,
    escalated: finalState.escalated,
    logEntries: finalState.logEntries,
  };
}
