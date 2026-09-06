import { StateGraph, END } from "@langchain/langgraph";
import { AgentGraphState } from "./state.js";
import { groupTasksNode } from "./nodes/groupTasks.js";
import { planningNode } from "./nodes/planning.js";
import { writeCodeNode } from "./nodes/writeCode.js";
import { sandboxTestNode } from "./nodes/sandboxTest.js";
import { gitOpsSubmitNode } from "./nodes/gitOpsSubmit.js";
import { oversightNode } from "./nodes/oversight.js";
import type { AgentStateType } from "./state.js";

// Conditional edge after sandboxTest: escalate to oversight if attempts >= 3 and not successful
const routeAfterSandbox = (state: AgentStateType) => {
  if (state.escalated) return "oversight" as const;
  if (state.sandboxResult?.success === false && state.attempts < 3) return "sandboxTest" as const;
  return "gitOpsSubmit" as const;
};

export const app = new StateGraph({ stateSchema: AgentGraphState })
  .addNode("groupTasks", groupTasksNode)
  .addNode("planning", planningNode)
  .addNode("writeCode", writeCodeNode)
  .addNode("sandboxTest", sandboxTestNode)
  .addNode("gitOpsSubmit", gitOpsSubmitNode)
  .addNode("oversight", oversightNode)
  .addEdge("__start__", "groupTasks")
  .addEdge("groupTasks", "planning")
  .addEdge("planning", "writeCode")
  .addEdge("writeCode", "sandboxTest")
  .addConditionalEdges("sandboxTest", routeAfterSandbox)
  .addEdge("gitOpsSubmit", END)
  .addEdge("oversight", END)
  .compile();
