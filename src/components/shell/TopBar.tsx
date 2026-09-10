import { PanelLeftClose, PanelLeftOpen, Search, ShieldAlert, ShieldCheck, Radar } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useNavigate } from 'react-router-dom'
import { useCase } from '@/store/useCase'
import { CASE_META } from '@/data'
import { CASE_TZ_LABEL, HOST_CLOCK_DRIFT_SECONDS } from '@/lib/time'
import { IconButton, KeyHint } from '@/components/ui'

export function TopBar({ collapsed, onToggleSidebar }: { collapsed: boolean; onToggleSidebar: () => void }) {
  const clockBasis = useCase((s) => s.clockBasis)
  const setClockBasis = useCase((s) => s.setClockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const toggleInvestigationMode = useCase((s) => s.toggleInvestigationMode)
  const setPaletteOpen = useCase((s) => s.setPaletteOpen)
  const custody = useCase((s) => s.custody)
  const navigate = useNavigate()
  const openDigests = custody.filter((c) => !c.hashVerified).length

  return (
    <header className="ares-no-print relative z-20 flex h-11 shrink-0 items-center gap-3 border-b border-line bg-panel/90 px-3 backdrop-blur">
      <IconButton label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={onToggleSidebar}>
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </IconButton>

      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[15px] font-semibold tracking-[0.34em] text-cyan">ARES</span>
        <span className="hidden text-[10px] tracking-[0.16em] text-ink-4 uppercase lg:inline">
          Autonomous Digital Forensics Command Center
        </span>
      </div>

      <div className="mx-1 h-5 w-px bg-line" />

      <div className="flex min-w-0 items-baseline gap-2">
        <span className="tabular font-mono text-[12px] text-ink">{CASE_META.id}</span>
        <span className="truncate text-[11px] tracking-[0.14em] text-amber uppercase">{CASE_META.codename}</span>
      </div>

      <div className="flex-1" />

      <div className="hidden items-center gap-1 rounded-[2px] border border-line bg-abyss/70 p-[2px] md:flex">
        {(['normalized', 'host'] as const).map((basis) => (
          <button
            key={basis}
            type="button"
            onClick={() => setClockBasis(basis)}
            title={
              basis === 'normalized'
                ? 'Show NTP-normalised case time'
                : `Show times as recorded by DEV-0042 (+${HOST_CLOCK_DRIFT_SECONDS}s drift)`
            }
            className={cn(
              'rounded-[2px] px-2 py-[3px] text-[10px] tracking-[0.12em] uppercase transition-colors',
              clockBasis === basis ? 'bg-cyan/15 text-cyan' : 'text-ink-4 hover:text-ink-2',
            )}
          >
            {basis === 'normalized' ? 'Normalised' : 'Host clock'}
          </button>
        ))}
      </div>

      <span className="hidden font-mono text-[10px] text-ink-4 xl:inline">{CASE_TZ_LABEL}</span>

      <button
        type="button"
        onClick={toggleInvestigationMode}
        title="Investigation mode hides low-signal artifacts across every module"
        className={cn(
          'inline-flex h-7 items-center gap-1.5 rounded-[2px] border px-2 text-[10px] tracking-[0.12em] uppercase transition-colors',
          investigationMode
            ? 'border-amber/45 bg-amber/12 text-amber'
            : 'border-line bg-panel-2 text-ink-4 hover:text-ink-2',
        )}
      >
        <Radar className="size-3.5" />
        <span className="hidden sm:inline">Investigation</span>
      </button>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="inline-flex h-7 items-center gap-2 rounded-[2px] border border-line bg-abyss/70 px-2 text-[11px] text-ink-4 transition-colors hover:border-line-3 hover:text-ink-2"
      >
        <Search className="size-3.5" />
        <span className="hidden sm:inline">Search case</span>
        <KeyHint combo="Ctrl+K" />
      </button>

      <button
        type="button"
        onClick={() => navigate('/custody')}
        title={
          openDigests > 0
            ? `${openDigests} custody entr${openDigests === 1 ? 'y' : 'ies'} carry an unverified digest - open the ledger`
            : 'Every custody entry carries a verified digest - open the ledger'
        }
        className={cn(
          'hidden items-center gap-1.5 rounded-[2px] border px-2 py-[3px] text-[10px] tracking-[0.1em] uppercase transition-colors 2xl:flex',
          openDigests > 0
            ? 'border-signal/40 bg-signal/10 text-signal hover:bg-signal/20'
            : 'border-jade/30 bg-jade/8 text-jade hover:bg-jade/15',
        )}
      >
        {openDigests > 0 ? <ShieldAlert className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
        {openDigests > 0 ? `${openDigests} digest open` : 'Integrity nominal'}
      </button>
    </header>
  )
}
