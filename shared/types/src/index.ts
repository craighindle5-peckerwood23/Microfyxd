export interface Goal {
  id: string;
  text: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | string;
  created_at: string;
}

export interface Task {
  id: string;
  goal_id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | string;
  created_at: string;
}

export interface EcuLog {
  id: string;
  rpm: number;
  coolant: number;
  throttle: number;
  dtc: string[];
  created_at: string;
}

export interface AgentState {
  id: string;
  loop_step: number;
  summary: string;
  created_at: string;
}

export type LangGraphInput = string | Record<string, unknown>[];

export interface LangGraphOutput {
  task?: string | Task;
  code?: string;
  result?: string;
  groupedOutput?: string;
  targetFile?: string;
  plan?: string;
  sandboxResult?: SandboxResult;
  patch?: string;
  branchName?: string;
  gitStatus?: string;
}

export interface DTC {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | string;
}

export interface LiveData {
  pid: number;
  name: string;
  value: number;
  unit: string;
}

export interface EcmParameter {
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
}

export interface SafetyLimits {
  maxRpm: number;
  maxBoost: number;
  minAfr: number;
  maxCoolantTemp: number;
}

export interface SandboxResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  output?: string;
}

export interface OversightDecision {
  approve: boolean;
  reason: string;
  escalate: boolean;
}

export interface LogEntry {
  step: string;
  message: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | string;
}

export type MovementNode =
  | 'groupTasks'
  | 'planning'
  | 'writeCode'
  | 'sandboxTest'
  | 'gitOpsSubmit'
  | 'oversight'
  | 'selfHeal';

export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'testing'
  | 'submitting'
  | 'escalated'
  | 'done';
