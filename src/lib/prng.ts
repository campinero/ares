/**
 * Deterministic pseudo-randomness.
 *
 * Every synthetic byte, offset and jitter in the ARES evidence set derives from
 * a seeded generator so the case is byte-identical on every load. Nothing in the
 * dataset calls Math.random().
 */

/** FNV-1a 32-bit string hash, used to turn an artifact ID into a seed. */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 - small, fast, good enough for synthetic evidence filler. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Rng {
  next(): number
  int(minInclusive: number, maxInclusive: number): number
  pick<T>(items: readonly T[]): T
  bool(probability: number): boolean
  byte(): number
}

export function rngFrom(seedText: string): Rng {
  const next = mulberry32(seedFrom(seedText))
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick(items) {
      return items[Math.floor(next() * items.length) % items.length]
    },
    bool: (p) => next() < p,
    byte: () => Math.floor(next() * 256) & 0xff,
  }
}
