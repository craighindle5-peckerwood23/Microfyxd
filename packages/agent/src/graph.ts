import { StateGraph, END } from "@langchain/langgraph";
import { AgentGraphState, type AgentStateType } from "./state.js";
import { groupTasksNode } from "./nodes/groupTasks.js";
import { planningNode } from "./nodes/planning.js";
import { writeCodeNode } from "./nodes/writeCode.js";
import { sandboxTestNode } from "./nodes/sandboxTest.js";
import { gitOpsSubmitNode } from "./nodes/gitOpsSubmit.js";
import { oversightNode } from "./nodes/oversight.js";

const graph = new StateGraph(AgentGraphState);

graph.addNode("groupTasks", groupTasksNode);
graph.addNode("planning", planningNode);
graph.addNode("writeCode", writeCodeNode);
graph.addNode("sandboxTest", sandboxTestNode);
graph.addNode("gitOpsSubmit", gitOpsSubmitNode);
graph.addNode("oversight", oversightNode);

graph.addEdge("__start__", "groupTasks");
graph.addEdge("groupTasks", "planning");
graph.addEdge("planning", "writeCode");
graph.addEdge("writeCode", "sandboxTest");

// Conditional edge after sandboxTest: escalate to oversight if attempts >= 3 and not successful
graph.addConditionalEdges("sandboxTest", (state: AgentStateType) => {
  if (state.escalated) return "oversight";
  if (state.sandboxResult?.success === false && state.attempts < 3) return "sandboxTest";
  return "gitOpsSubmit";
});

graph.addEdge("gitOpsSubmit", END);
graph.addEdge("oversight", END);

export const app = graph.compile();
