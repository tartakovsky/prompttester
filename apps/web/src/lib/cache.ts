const PREFIX = "prompttester:";

export function cacheLoad<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function cacheSave(key: string, value: unknown) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

export function cacheLoadStr(key: string): string | null {
  try {
    return localStorage.getItem(`${PREFIX}${key}`);
  } catch {
    return null;
  }
}

export function cacheSaveStr(key: string, value: string) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, value);
  } catch { /* quota exceeded — ignore */ }
}
