/**
 * Deterministic link-chart layout.
 *
 * Nodes are seeded into an angular sector per entity kind at a radius set by
 * significance - critical material sits nearest the centre - and then relaxed
 * with a fixed number of Fruchterman-Reingold iterations. A weak anchor pulls
 * each node back toward its seed so the kind grouping survives relaxation.
 *
 * Every input is derived from the dataset and every constant is fixed, so the
 * chart is byte-identical on every load. No Math.random anywhere.
 */
import type { EntityKind, GraphEntity, GraphRelation, Significance } from '@/data/types'
import { KIND_ORDER, nodeHeight, nodeWidth } from './kinds'

export interface Point {
  x: number
  y: number
}

/** FNV-1a folded to 0..1. Stable jitter source, never a random number. */
function unit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 100_000) / 100_000
}

const RING: Record<Significance, number> = {
  critical: 215,
  high: 340,
  moderate: 450,
  low: 545,
  noise: 625,
}

const ITERATIONS = 340
const IDEAL = 196
const START_TEMP = 150
const ANCHOR = 0.028
const GRAVITY = 0.006

interface Body {
  id: string
  x: number
  y: number
  ax: number
  ay: number
  w: number
  h: number
}

function seedBodies(entities: GraphEntity[]): Body[] {
  const counts = new Map<EntityKind, number>()
  for (const e of entities) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1)

  const seen = new Map<EntityKind, number>()
  const sector = (Math.PI * 2) / KIND_ORDER.length

  return entities.map((e) => {
    const slot = KIND_ORDER.indexOf(e.kind)
    const index = seen.get(e.kind) ?? 0
    seen.set(e.kind, index + 1)
    const total = counts.get(e.kind) ?? 1
    const spread = sector * 0.82
    const base = (slot < 0 ? 0 : slot) * sector - Math.PI / 2
    const offset = total === 1 ? 0 : (index / (total - 1) - 0.5) * spread
    const angle = base + offset + (unit(e.id) - 0.5) * sector * 0.16
    const radius = RING[e.significance] * (0.9 + unit(`${e.id}:r`) * 0.2)
    return {
      id: e.id,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      ax: Math.cos(angle) * radius,
      ay: Math.sin(angle) * radius,
      w: nodeWidth(e.significance),
      h: nodeHeight(e.significance),
    }
  })
}

/**
 * Seeded rings plus a fixed force relaxation.
 *
 * ponytail: O(n^2) repulsion over ~60 entities is roughly half a million cheap
 * iterations and runs once per layout. Swap in a Barnes-Hut quadtree only if
 * the case file ever grows past a few hundred entities.
 */
export function layoutGraph(entities: GraphEntity[], relations: GraphRelation[]): Map<string, Point> {
  const bodies = seedBodies(entities)
  const index = new Map(bodies.map((b, i) => [b.id, i]))

  const links = relations
    .map((r) => ({ a: index.get(r.source), b: index.get(r.target), weight: r.weight }))
    .filter((l): l is { a: number; b: number; weight: number } => l.a !== undefined && l.b !== undefined)

  const dx = new Float64Array(bodies.length)
  const dy = new Float64Array(bodies.length)
  const k2 = IDEAL * IDEAL

  for (let step = 0; step < ITERATIONS; step++) {
    dx.fill(0)
    dy.fill(0)

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        let vx = bodies[i].x - bodies[j].x
        let vy = bodies[i].y - bodies[j].y
        let d = Math.hypot(vx, vy)
        if (d < 1) {
          // Deterministic nudge for coincident bodies.
          vx = (i - j) % 2 === 0 ? 0.7 : -0.7
          vy = 0.7
          d = 1
        }
        const force = k2 / d
        dx[i] += (vx / d) * force
        dy[i] += (vy / d) * force
        dx[j] -= (vx / d) * force
        dy[j] -= (vy / d) * force
      }
    }

    for (const link of links) {
      const vx = bodies[link.a].x - bodies[link.b].x
      const vy = bodies[link.a].y - bodies[link.b].y
      const d = Math.max(1, Math.hypot(vx, vy))
      const pull = ((d * d) / IDEAL) * (0.55 + link.weight * 0.22)
      dx[link.a] -= (vx / d) * pull
      dy[link.a] -= (vy / d) * pull
      dx[link.b] += (vx / d) * pull
      dy[link.b] += (vy / d) * pull
    }

    const temp = START_TEMP * (1 - step / ITERATIONS)
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i]
      dx[i] += (b.ax - b.x) * ANCHOR * IDEAL * 0.02 + -b.x * GRAVITY
      dy[i] += (b.ay - b.y) * ANCHOR * IDEAL * 0.02 + -b.y * GRAVITY
      const mag = Math.hypot(dx[i], dy[i])
      if (mag < 1e-6) continue
      const limit = Math.min(mag, temp)
      b.x += (dx[i] / mag) * limit
      b.y += (dy[i] / mag) * limit
    }
  }

  // Report React Flow top-left coordinates rather than centres.
  const out = new Map<string, Point>()
  for (const b of bodies) {
    out.set(b.id, { x: Math.round(b.x - b.w / 2), y: Math.round(b.y - b.h / 2) })
  }
  return out
}
