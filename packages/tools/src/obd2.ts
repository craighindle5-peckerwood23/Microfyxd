export interface DTC { code: string; description: string; severity: "low" | "medium" | "high"; }
export interface LiveData { pid: number; name: string; value: number; unit: string; }

export const PID_MAP: Record<number, string> = {
  0x0c: "RPM",
  0x05: "Coolant Temp",
  0x11: "Throttle Position",
  0x0f: "Intake Air Temp",
  0x42: "Battery Voltage",
  0x46: "Ambient Air Temp",
  0x02: "VIN",
};

export async function readDTCs(): Promise<DTC[]> {
  return [
    { code: "P0301", description: "Cylinder 1 misfire detected", severity: "high" },
    { code: "P0171", description: "System too lean (Bank 1)", severity: "medium" },
  ];
}

export async function clearDTCs(): Promise<{ success: boolean }> {
  return { success: true };
}

export async function readLiveData(pids: number[]): Promise<LiveData[]> {
  return pids.map((pid) => ({
    pid,
    name: PID_MAP[pid] || `PID_${pid.toString(16)}`,
    value: Math.round(Math.random() * 9000),
    unit: pid === 0x0c ? "RPM" : pid === 0x05 ? "°C" : pid === 0x11 ? "%" : "raw",
  }));
}

export async function readVin(): Promise<string> {
  return "1HGCM82633A123456";
}
