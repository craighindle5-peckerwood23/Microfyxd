export interface EcmParameter { name: string; value: number; unit: string; min: number; max: number; }
export interface SafetyLimits { maxRpm: number; maxBoost: number; minAfr: number; maxCoolantTemp: number; }
export interface ValidationResult { valid: boolean; violations: string[]; }

export const SAFETY_LIMITS: SafetyLimits = {
  maxRpm: 8500,
  maxBoost: 25, // psi
  minAfr: 10.5,  // air/fuel ratio
  maxCoolantTemp: 230, // °F
};

export function getSafetyLimits(): SafetyLimits {
  return { ...SAFETY_LIMITS };
}

export async function readEcmParameters(): Promise<EcmParameter[]> {
  return [
    { name: "fuelMap", value: 14.7, unit: "AFR", min: 10, max: 18 },
    { name: "ignitionTiming", value: 28, unit: "°BTDC", min: 0, max: 40 },
    { name: "airFuelRatio", value: 14.7, unit: "AFR", min: 10.5, max: 18 },
    { name: "boostPressure", value: 14, unit: "psi", min: 0, max: 25 },
  ];
}

export async function writeEcmParameter(name: string, value: number): Promise<{ success: boolean; parameter: EcmParameter }> {
  const params = await readEcmParameters();
  const param = params.find((p) => p.name === name);
  if (!param) throw new Error(`Unknown parameter: ${name}`);
  if (value < param.min || value > param.max) {
    return { success: false, parameter: { ...param, value } };
  }
  return { success: true, parameter: { ...param, value } };
}

export function validateTuning(params: EcmParameter[]): ValidationResult {
  const violations: string[] = [];
  for (const p of params) {
    if (p.name === "boostPressure" && p.value > SAFETY_LIMITS.maxBoost) violations.push(`Boost ${p.value} exceeds max ${SAFETY_LIMITS.maxBoost} psi`);
    if (p.name === "airFuelRatio" && p.value < SAFETY_LIMITS.minAfr) violations.push(`AFR ${p.value} below min ${SAFETY_LIMITS.minAfr}`);
    if (p.name === "fuelMap" && p.value < SAFETY_LIMITS.minAfr) violations.push(`Fuel map AFR ${p.value} below safe min`);
  }
  return { valid: violations.length === 0, violations };
}
