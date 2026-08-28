/** Parses a value as a finite number, safely falling back to 0 for anything invalid (NaN, blank, stray text). */
export function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
