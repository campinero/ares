import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import type { GraphEntity } from '@/data/types'
import { cn } from '@/lib/cn'
import { KIND_META, NODE_DIM_OPACITY, SIGNIFICANCE_COLOR, nodeHeight, nodeWidth } from './kinds'

export interface EntityNodeData extends Record<string, unknown> {
  entity: GraphEntity
  /** Outside the current highlight neighbourhood. */
  dimmed: boolean
  /** Hop distance from the focused node, or null when nothing is focused. */
  hop: number | null
  /** Number of relations attached to this entity in the visible chart. */
  degree: number
  focused: boolean
}

export type EntityFlowNode = Node<EntityNodeData, 'entity'>

function EntityNodeBody({ data, selected }: NodeProps<EntityFlowNode>) {
  const { entity, dimmed, hop, degree, focused } = data
  const meta = KIND_META[entity.kind]
  const Icon = meta.icon
  const significance = SIGNIFICANCE_COLOR[entity.significance]
  const critical = entity.significance === 'critical'

  return (
    <div
      className={cn(
        'relative flex items-center overflow-hidden rounded-[3px] border bg-panel-2 transition-[opacity,box-shadow,border-color] duration-200',
        selected ? 'border-cyan' : focused ? 'border-line-3' : 'border-line-2',
      )}
      style={{
        width: nodeWidth(entity.significance),
        height: nodeHeight(entity.significance),
        opacity: dimmed ? NODE_DIM_OPACITY : 1,
        boxShadow: selected
          ? '0 0 0 1px rgba(51,201,222,0.35), 0 0 18px -6px rgba(51,201,222,0.5)'
          : critical && !dimmed
            ? '0 0 0 1px rgba(239,83,64,0.16)'
            : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} className="ares-flow-handle" isConnectable={false} />
      <span className="h-full w-[3px] shrink-0" style={{ background: meta.accent }} />

      <span className="flex size-6 shrink-0 items-center justify-center" style={{ color: meta.accent }}>
        <Icon className="size-3.5" />
      </span>

      <span className="min-w-0 flex-1 py-1 pr-1">
        <span className="block truncate text-[11px] leading-tight font-medium text-ink">{entity.label}</span>
        {entity.sublabel ? (
          <span className="block truncate text-[10px] leading-tight text-ink-4">{entity.sublabel}</span>
        ) : null}
      </span>

      <span className="flex h-full shrink-0 flex-col items-end justify-between border-l border-line/70 px-1.5 py-1">
        <span
          className="size-[6px] rounded-full"
          style={{ background: significance }}
          title={entity.significance}
        />
        <span className="tabular font-mono text-[9px] leading-none text-ink-4">
          {hop !== null && hop > 0 ? `+${hop}` : degree}
        </span>
      </span>

      <Handle type="source" position={Position.Right} className="ares-flow-handle" isConnectable={false} />
    </div>
  )
}

export const EntityNode = memo(EntityNodeBody)
