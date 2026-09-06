export interface LogEntry {
  step: string;
  message: string;
  timestamp: string;
  level: "info" | "error" | "warn";
}

export class AgentLogger {
  private entries: LogEntry[] = [];

  log(step: string, message: string): LogEntry {
    const entry: LogEntry = { step, message, timestamp: new Date().toISOString(), level: "info" };
    this.entries.push(entry);
    console.log(`[${entry.level.toUpperCase()}] ${step}: ${message}`);
    return entry;
  }

  error(step: string, message: string): LogEntry {
    const entry: LogEntry = { step, message, timestamp: new Date().toISOString(), level: "error" };
    this.entries.push(entry);
    console.error(`[ERROR] ${step}: ${message}`);
    return entry;
  }

  warn(step: string, message: string): LogEntry {
    const entry: LogEntry = { step, message, timestamp: new Date().toISOString(), level: "warn" };
    this.entries.push(entry);
    console.warn(`[WARN] ${step}: ${message}`);
    return entry;
  }

  getLog(): LogEntry[] {
    return [...this.entries];
  }
}
