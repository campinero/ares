import { useMemo } from 'react'
import { CASE, evidenceById } from '@/data'
import { cn } from '@/lib/cn'

/**
 * Evidence accumulation strip.
 *
 * One cell per artifact in the case file. As the reconstruction plays, cells
 * light as their artifact is first cited, so the investigator watches the
 * evidentiary basis for the sequence build rather than taking the narration on
 * trust. The strip is the link between the playback and the register.
 */
export function EvidenceReactor({
  firedEventIds,
  activeEventId,
  onSelect,
  selectedEvidenceId,
}: {
  firedEventIds: string[]
  activeEventId: string | null
  onSelect: (id: string) => void
  selectedEvidenceId: string | null
}) {
  const { cited, current } = useMemo(() => {
    const citedSet = new Set<string>()
    const currentSet = new Set<string>()
    const fired = new Set(firedEventIds)
    for (const event of CASE.events) {
      if (!fired.has(event.id)) continue
      for (const id of event.evidenceIds) citedSet.add(id)
      if (event.id === activeEventId) for (const id of event.evidenceIds) currentSet.add(id)
    }
    return { cited: citedSet, current: currentSet }
  }, [firedEventIds, activeEventId])

  return (
    <div className="shrink-0 border-t border-line bg-abyss/60 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-3">
        <span className="text-[9px] font-semibold tracking-[0.16em] text-ink-4 uppercase">
          Evidentiary basis
        </span>
        <span className="tabular font-mono text-[10px] text-cyan">
          {cited.size} / {CASE.evidence.length} artifacts cited so far
        </span>
        <div className="h-px flex-1 bg-line" />
        <span className="text-[9px] tracking-[0.12em] text-ink-4 uppercase">click a cell to inspect</span>
      </div>
      <div className="flex flex-wrap gap-[3px]">
        {CASE.evidence.map((item) => {
          const isCurrent = current.has(item.id)
          const isCited = cited.has(item.id)
          const isSelected = item.id === selectedEvidenceId
          return (
            <button
              key={item.id}
              type="button"
              title={`${item.id} - ${item.label}`}
              onClick={() => onSelect(item.id)}
              className={cn(
                'h-4 w-[26px] rounded-[1px] border font-mono text-[8px] leading-[14px] transition-all duration-300',
                isCurrent
                  ? 'border-cyan bg-cyan/35 text-ink'
                  : isCited
                    ? 'border-cyan/40 bg-cyan/12 text-cyan'
                    : 'border-line bg-panel-2 text-ink-4/60',
                isSelected && 'ring-1 ring-violet',
              )}
              style={isCurrent ? { boxShadow: '0 0 8px color-mix(in oklab, var(--color-cyan) 55%, transparent)' } : undefined}
            >
              {item.id.slice(-4)}
            </button>
          )
        })}
      </div>
      {current.size > 0 ? (
        <p className="mt-1.5 truncate text-[10px] text-ink-4">
          This beat rests on {[...current].map((id) => evidenceById.get(id)?.label ?? id).join('; ')}
        </p>
      ) : null}
    </div>
  )
}
