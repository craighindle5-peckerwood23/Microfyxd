import { END } from "@langchain/langgraph";
import type { AgentStateType } from "../state.js";

export async function gitOpsSubmitNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const patch = `diff --git a/${state.targetFile} b/${state.targetFile}\n--- a/${state.targetFile}\n+++ b/${state.targetFile}\n@@ -1,1 +1,20 @@\n${state.generatedCode}\n`;
  const branchName = `microfyxd-update-${Date.now()}`;
  const gitStatus = "awaiting-approval";

  return {
    patch,
    branchName,
    gitStatus,
    result: {
      sandbox: state.sandboxResult,
      git: { branchName, status: gitStatus },
      patch,
      targetFile: state.targetFile,
    },
    next: END,
    logEntries: [...(state.logEntries || []), {
      step: "gitOpsSubmit",
      message: `Created patch on branch ${branchName}, status: ${gitStatus}`,
      timestamp: new Date().toISOString(),
      level: "info",
    }],
  };
}
