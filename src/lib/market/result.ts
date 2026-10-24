// "use cache" functions can't throw custom errors (the class is lost crossing the cache boundary),
// so they return a Result and callers re-throw outside the cache.
export type Result<T> = { ok: true; data: T } | { ok: false; status: number; message: string };
export const fail = (status: number, message: string): Result<never> => ({ ok: false, status, message });
