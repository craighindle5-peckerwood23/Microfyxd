import { Annotation } from "@langchain/langgraph";

/** Last-write-wins reducer with a default value (LangGraph v1 syntax). */
const last = <T>(defaultValue: () => T) => Annotation<T>({
  reducer: (_current, next) => next,
  default: defaultValue,
});

export const AgentGraphState = Annotation.Root({
  input: last<string | Record<string, unknown>[]>(() => []),
  task: last<Record<string, unknown> | null>(() => null),
  code: last<string>(() => ""),
  result: last<Record<string, unknown>>(() => ({})),
  next: last<string>(() => ""),

  groupedOutput: last<Record<string, unknown[]>>(() => ({})),
  targetFile: last<string>(() => ""),
  plan: last<string>(() => ""),
  generatedCode: last<string>(() => ""),
  sandboxResult: last<Record<string, unknown> | null>(() => null),
  patch: last<string>(() => ""),
  branchName: last<string>(() => ""),
  gitStatus: last<string>(() => ""),
  attempts: last<number>(() => 0),
  escalated: last<boolean>(() => false),
  humanApprovalRequired: last<boolean>(() => false),
  logEntries: last<Array<{ step: string; message: string; timestamp: string; level: string }>>(() => []),
});

export type AgentStateType = typeof AgentGraphState.State;
