import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCase } from '@/store/useCase'

/** Routes bound to single-key shortcuts, mirrored in the command palette. */
export const SHORTCUTS: Array<{ key: string; path: string; label: string }> = [
  { key: 'g', path: '/graph', label: 'Evidence graph' },
  { key: 't', path: '/timeline', label: 'Timeline' },
  { key: 'e', path: '/evidence', label: 'Evidence' },
  { key: 'r', path: '/reconstruction', label: 'Reconstruction' },
  { key: 'h', path: '/hypotheses', label: 'Hypotheses' },
]

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function useShortcuts(): void {
  const navigate = useNavigate()
  const setPaletteOpen = useCase((s) => s.setPaletteOpen)
  const paletteOpen = useCase((s) => s.paletteOpen)
  const inspectorOpen = useCase((s) => s.inspectorOpen)
  const closeInspector = useCase((s) => s.closeInspector)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.ctrlKey || event.metaKey

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(!paletteOpen)
        return
      }

      if (event.key === 'Escape') {
        if (paletteOpen) {
          setPaletteOpen(false)
          return
        }
        if (inspectorOpen) {
          closeInspector()
        }
        return
      }

      if (meta || event.altKey || event.shiftKey) return
      if (isTypingTarget(event.target)) return
      if (paletteOpen) return

      const match = SHORTCUTS.find((s) => s.key === event.key.toLowerCase())
      if (match) {
        event.preventDefault()
        navigate(match.path)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate, setPaletteOpen, paletteOpen, inspectorOpen, closeInspector])
}
