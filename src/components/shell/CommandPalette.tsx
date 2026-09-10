import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Cpu, CornerDownLeft, FileSearch, Terminal, Usb, Users } from 'lucide-react'
import { CASE } from '@/data'
import { NAV } from '@/nav'
import { useCase } from '@/store/useCase'
import { cn } from '@/lib/cn'
import { formatTs } from '@/lib/time'
import { KeyHint } from '@/components/ui'

interface Command {
  id: string
  group: string
  label: string
  hint?: string
  icon: ReactNode
  run: () => void
}

export function CommandPalette() {
  const open = useCase((s) => s.paletteOpen)
  const setOpen = useCase((s) => s.setPaletteOpen)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectPerson = useCase((s) => s.selectPerson)
  const selectDevice = useCase((s) => s.selectDevice)
  const selectEvent = useCase((s) => s.selectEvent)
  const selectUsb = useCase((s) => s.selectUsb)
  const toggleInvestigationMode = useCase((s) => s.toggleInvestigationMode)
  const addHypothesis = useCase((s) => s.addHypothesis)
  const addNote = useCase((s) => s.addNote)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  const commands = useMemo<Command[]>(() => {
    const out: Command[] = []

    for (const item of NAV) {
      const Icon = item.icon
      out.push({
        id: `nav:${item.path}`,
        group: 'Navigate',
        label: item.label,
        hint: item.description,
        icon: <Icon className="size-3.5" />,
        run: () => navigate(item.path),
      })
    }

    out.push(
      {
        id: 'cmd:investigation',
        group: 'Commands',
        label: 'Toggle investigation mode',
        hint: 'Hide low-signal artifacts across every module',
        icon: <Terminal className="size-3.5" />,
        run: toggleInvestigationMode,
      },
      {
        id: 'cmd:hypothesis',
        group: 'Commands',
        label: 'Create hypothesis',
        hint: 'Open the hypothesis workbench with a new draft',
        icon: <Terminal className="size-3.5" />,
        run: () => {
          addHypothesis({
            title: 'Untitled working hypothesis',
            statement: 'State the proposition this hypothesis tests, then attach evidence for and against it.',
          })
          navigate('/hypotheses')
        },
      },
      {
        id: 'cmd:note',
        group: 'Commands',
        label: 'Add examiner note',
        hint: 'Append a timestamped note to the case file',
        icon: <Terminal className="size-3.5" />,
        run: () => {
          addNote('New examiner note - open the case overview to edit.')
          navigate('/')
        },
      },
      {
        id: 'cmd:report',
        group: 'Commands',
        label: 'Export report',
        hint: 'Open the report builder and print to PDF',
        icon: <Terminal className="size-3.5" />,
        run: () => navigate('/report'),
      },
    )

    for (const e of CASE.evidence) {
      out.push({
        id: `ev:${e.id}`,
        group: 'Evidence',
        label: `${e.id} - ${e.label}`,
        hint: `${e.type} - ${e.source}`,
        icon: <FileSearch className="size-3.5" />,
        run: () => {
          selectEvidence(e.id)
          navigate('/evidence')
        },
      })
    }

    for (const p of CASE.persons) {
      out.push({
        id: `per:${p.id}`,
        group: 'Persons',
        label: p.name,
        hint: `${p.role} - ${p.department}`,
        icon: <Users className="size-3.5" />,
        run: () => {
          selectPerson(p.id)
          navigate('/persons')
        },
      })
    }

    for (const d of CASE.devices) {
      out.push({
        id: `dev:${d.id}`,
        group: 'Devices',
        label: `${d.id} - ${d.name}`,
        hint: `${d.kind} - ${d.os}`,
        icon: <Cpu className="size-3.5" />,
        run: () => {
          selectDevice(d.id)
          navigate('/devices')
        },
      })
    }

    for (const u of CASE.usbDevices) {
      out.push({
        id: `usb:${u.id}`,
        group: 'Devices',
        label: `${u.id} - ${u.vendor} ${u.product}`,
        hint: `serial ${u.serial}`,
        icon: <Usb className="size-3.5" />,
        run: () => {
          selectUsb(u.id)
          navigate('/usb')
        },
      })
    }

    for (const e of CASE.events) {
      out.push({
        id: `evt:${e.id}`,
        group: 'Events',
        label: e.title,
        hint: `${formatTs(e.at)} - ${e.source}`,
        icon: <Clock className="size-3.5" />,
        run: () => {
          selectEvent(e.id)
          navigate('/timeline')
        },
      })
    }

    return out
  }, [
    navigate,
    selectEvidence,
    selectPerson,
    selectDevice,
    selectEvent,
    selectUsb,
    toggleInvestigationMode,
    addHypothesis,
    addNote,
  ])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands.filter((c) => c.group === 'Navigate' || c.group === 'Commands').slice(0, 24)
    const scored: Array<{ c: Command; score: number }> = []
    for (const c of commands) {
      const haystack = `${c.label} ${c.hint ?? ''}`.toLowerCase()
      const idx = haystack.indexOf(q)
      if (idx < 0) continue
      scored.push({ c, score: idx + (c.label.toLowerCase().startsWith(q) ? -50 : 0) })
    }
    scored.sort((a, b) => a.score - b.score)
    return scored.slice(0, 40).map((s) => s.c)
  }, [commands, query])

  useEffect(() => setCursor(0), [query])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [cursor, open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-void/80 pt-[12vh] backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[62vh] w-[min(680px,92vw)] flex-col overflow-hidden rounded-[3px] border border-line-2 bg-panel shadow-2xl shadow-black/60"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-2 border-b border-line px-3 py-2">
              <Terminal className="size-3.5 text-cyan" />
              <input
                autoFocus
                value={query}
                spellCheck={false}
                placeholder="Search evidence, persons, devices, events, or run a command"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setCursor((c) => Math.min(results.length - 1, c + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setCursor((c) => Math.max(0, c - 1))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    const target = results[cursor]
                    if (target) {
                      target.run()
                      setOpen(false)
                    }
                  } else if (e.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-4 focus:outline-none"
              />
              <KeyHint combo="Esc" />
            </div>

            <div ref={listRef} className="min-h-0 flex-1 overflow-auto py-1">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-[12px] text-ink-4">No match in the case file.</p>
              ) : (
                results.map((cmd, index) => {
                  const showGroup = index === 0 || results[index - 1].group !== cmd.group
                  return (
                    <div key={cmd.id}>
                      {showGroup ? (
                        <div className="px-3 pt-2 pb-1 text-[9px] font-semibold tracking-[0.18em] text-ink-4 uppercase">
                          {cmd.group}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        data-index={index}
                        onMouseEnter={() => setCursor(index)}
                        onClick={() => {
                          cmd.run()
                          setOpen(false)
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors',
                          index === cursor ? 'bg-cyan/12 text-ink' : 'text-ink-2 hover:bg-panel-2',
                        )}
                      >
                        <span className="text-ink-4">{cmd.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px]">{cmd.label}</span>
                          {cmd.hint ? <span className="block truncate text-[10px] text-ink-4">{cmd.hint}</span> : null}
                        </span>
                        {index === cursor ? <CornerDownLeft className="size-3 shrink-0 text-cyan" /> : null}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
