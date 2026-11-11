export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let value = Math.imul(next ^ (next >>> 15), 1 | next);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return { value: ((value ^ (value >>> 14)) >>> 0) / 4294967296, state: next };
}
export function randomSource(seed: string) {
  let state = hashSeed(seed);
  return {
    next: () => {
      const result = nextRandom(state);
      state = result.state;
      return result.value;
    },
    state: () => state,
  };
}
export const clamp = (n: number, low = 0, high = 100) =>
  Math.min(high, Math.max(low, Math.round(n)));
