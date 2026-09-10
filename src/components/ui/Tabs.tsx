import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabDef {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn('flex shrink-0 items-stretch border-b border-line bg-panel-2/50', className)}>
      {tabs.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors [&>svg]:size-3',
              selected ? 'text-cyan' : 'text-ink-4 hover:text-ink-2',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined ? (
              <span className="tabular font-mono text-[10px] text-ink-4">{tab.count}</span>
            ) : null}
            {selected ? <span className="absolute inset-x-0 -bottom-px h-px bg-cyan" /> : null}
          </button>
        )
      })}
    </div>
  )
}
