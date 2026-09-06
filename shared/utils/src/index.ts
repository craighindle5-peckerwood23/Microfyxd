export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export function validateInput(input: unknown): { valid: boolean; error?: string } {
  if (input === undefined || input === null) {
    return { valid: false, error: 'Input is null or undefined' };
  }
  if (typeof input === 'string') {
    if (input.trim() === '') {
      return { valid: false, error: 'Input is an empty string' };
    }
  } else if (Array.isArray(input)) {
    if (input.length === 0) {
      return { valid: false, error: 'Input is an empty array' };
    }
  } else if (typeof input === 'object') {
    if (Object.keys(input).length === 0) {
      return { valid: false, error: 'Input is an empty object' };
    }
  }
  return { valid: true };
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '...';
}

export function sanitizeLogEntry(entry: { step: string; message: string }): { step: string; message: string } {
  const sanitize = (text: string): string => {
    return text
      .replace(/(api[_-]?key|password|secret|token|auth|bearer)\b\s*[:=]\s*["']?[a-zA-Z0-9_\-\.\/~\+\*=]{8,}["']?/gi, '$1=***')
      .replace(/(authorization\s*:\s*)\b(bearer\s+)?[a-zA-Z0-9_\-\.\/~\+\*=]{8,}/gi, '$1Bearer ***');
  };
  return {
    step: entry.step,
    message: sanitize(entry.message),
  };
}

export function deepMerge<T>(target: T, source: Partial<T>): T {
  if (target === null || target === undefined) {
    return source as T;
  }
  if (source === null || source === undefined) {
    return target;
  }
  if (typeof target !== 'object' || typeof source !== 'object') {
    return source as T;
  }
  if (Array.isArray(target) || Array.isArray(source)) {
    return source as T;
  }
  const result = { ...target } as any;
  for (const key of Object.keys(source)) {
    const sourceValue = (source as any)[key];
    const targetValue = result[key];
    if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  return result as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        throw error;
      }
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await sleep(backoffDelay);
    }
  }
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
