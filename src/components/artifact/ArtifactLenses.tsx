import { useLocation, useNavigate } from 'react-router-dom'
import { Binary, Braces, Tags } from 'lucide-react'
import { cn } from '@/lib/cn'

const LENSES = [
  { path: '/hex', label: 'Hex', icon: Binary },
  { path: '/strings', label: 'Strings', icon: Braces },
  { path: '/metadata', label: 'Metadata', icon: Tags },
]

/**
 * Three lenses over one artifact.
 *
 * The byte view, the recovered strings and the metadata sheet are different
 * questions about the same object, so they share a selection and switch like
 * tabs rather than reading as three unrelated destinations.
 */
export function ArtifactLenses({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div
      role="tablist"
      aria-label="Artifact lens"
      className={cn('flex shrink-0 items-stretch border-b border-line bg-panel-2/60', className)}
    >
      {LENSES.map((lens) => {
        const active = pathname === lens.path
        const Icon = lens.icon
        return (
          <button
            key={lens.path}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => navigate(lens.path)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase transition-colors',
              active ? 'text-cyan' : 'text-ink-4 hover:text-ink-2',
            )}
          >
            <Icon className="size-3" />
            {lens.label}
            {active ? <span className="absolute inset-x-0 -bottom-px h-px bg-cyan" /> : null}
          </button>
        )
      })}
      <div className="flex flex-1 items-center justify-end px-3">
        <span className="text-[9px] tracking-[0.14em] text-ink-4 uppercase">same artifact, three lenses</span>
      </div>
    </div>
  )
}
