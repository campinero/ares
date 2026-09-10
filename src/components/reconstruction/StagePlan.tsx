import { useMemo } from 'react'
import { EVENT_STAGE, KIND_COLOR, STAGE_NODES, STAGE_NODE_BY_ID } from './stage'
import { cn } from '@/lib/cn'

/**
 * Flat plan view of the reconstruction stage.
 *
 * Used when WebGL is unavailable. It carries the same information as the 3D
 * scene - actors, the active beat, and the transfer in flight - so the module
 * stays fully usable rather than degrading to a message.
 */
export function StagePlan({
  activeEventId,
  beatProgress,
  focusedNode,
  onSelectNode,
}: {
  activeEventId: string | null
  beatProgress: number
  focusedNode: string | null
  onSelectNode: (id: string) => void
}) {
  const beat = activeEventId ? EVENT_STAGE[activeEventId] : undefined
  const active = new Set(beat?.active ?? [])

  // World coordinates run roughly -8.5..9 on x and -6..6 on z.
  const project = useMemo(
    () =>
      (position: [number, number, number]): { x: number; y: number } => ({
        x: ((position[0] + 9.5) / 19) * 100,
        y: ((position[2] + 7) / 14) * 100,
      }),
    [],
  )

  const flow = beat?.flow
  const from = flow ? STAGE_NODE_BY_ID.get(flow[0]) : undefined
  const to = flow ? STAGE_NODE_BY_ID.get(flow[1]) : undefined
  const travel = beat?.denied ? Math.min(beatProgress, 0.62) : beatProgress

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
      <defs>
        <pattern id="ares-plan-grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#16202c" strokeWidth="0.15" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#ares-plan-grid)" />

      {from && to ? (
        <g>
          <line
            x1={project(from.position).x}
            y1={project(from.position).y}
            x2={project(to.position).x}
            y2={project(to.position).y}
            stroke={beat?.denied ? '#ef5340' : '#33c9de'}
            strokeWidth="0.4"
            strokeDasharray={beat?.denied ? '1.5 1' : undefined}
            opacity="0.55"
          />
          <circle
            cx={project(from.position).x + (project(to.position).x - project(from.position).x) * travel}
            cy={project(from.position).y + (project(to.position).y - project(from.position).y) * travel}
            r="1.1"
            fill={beat?.denied ? '#ef5340' : '#33c9de'}
          />
        </g>
      ) : null}

      {STAGE_NODES.map((node) => {
        const point = project(node.position)
        const isActive = active.has(node.id)
        const dimmed = focusedNode !== null && focusedNode !== node.id
        return (
          <g
            key={node.id}
            transform={`translate(${point.x} ${point.y})`}
            className={cn('cursor-pointer', dimmed && 'opacity-30')}
            onClick={() => onSelectNode(node.id)}
          >
            {isActive ? <circle r="3.4" fill={KIND_COLOR[node.kind]} opacity="0.14" /> : null}
            <rect
              x="-1.6"
              y="-1.6"
              width="3.2"
              height="3.2"
              fill={KIND_COLOR[node.kind]}
              opacity={isActive ? 0.95 : 0.5}
            />
            <text
              y="-2.6"
              textAnchor="middle"
              fill={isActive ? KIND_COLOR[node.kind] : '#a3b4c7'}
              style={{ fontSize: '2.1px', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}
            >
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
