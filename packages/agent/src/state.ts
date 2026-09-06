import { Annotation } from "@langchain/langgraph";

export const AgentGraphState = Annotation.Root({
  input: Annotation<string | Record<string, unknown>[]>({}),
  task: Annotation<Record<string, unknown> | null>({ default: () => null }),
  code: Annotation<string>({ default: () => "" }),
  result: Annotation<Record<string, unknown>>({ default: () => ({}) }),
  next: Annotation<string>({ default: () => "" }),

  groupedOutput: Annotation<Record<string, unknown[]>>({ default: () => ({}) }),
  targetFile: Annotation<string>({ default: () => "" }),
  plan: Annotation<string>({ default: () => "" }),
  generatedCode: Annotation<string>({ default: () => "" }),
  sandboxResult: Annotation<Record<string, unknown> | null>({ default: () => null }),
  patch: Annotation<string>({ default: () => "" }),
  branchName: Annotation<string>({ default: () => "" }),
  gitStatus: Annotation<string>({ default: () => "" }),
  attempts: Annotation<number>({ default: () => 0 }),
  escalated: Annotation<boolean>({ default: () => false }),
  humanApprovalRequired: Annotation<boolean>({ default: () => false }),
  logEntries: Annotation<Array<{ step: string; message: string; timestamp: string; level: string }>>({ default: () => [] }),
});

export type AgentStateType = typeof AgentGraphState.State;
