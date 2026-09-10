import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RECONSTRUCTION_EVENTS } from '@/data'
import { T } from '@/data/clock'

/**
 * Playback clock for the incident reconstruction.
 *
 * Case time runs from just before the first reconstruction beat to just after
 * the last, and is advanced by requestAnimationFrame at a chosen multiple of
 * a base compression rate. The transport is a real clock, not a step counter,
 * so scrubbing lands between events rather than snapping to them.
 */

/** Case seconds advanced per real second at 1x. */
const BASE_RATE = 45

export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8] as const
export type Speed = (typeof SPEEDS)[number]

export interface PlaybackState {
  /** Current position in case time (epoch ms, normalised). */
  at: number
  start: number
  end: number
  playing: boolean
  speed: Speed
  /** 0..1 across the whole window. */
  progress: number
  activeEventId: string | null
  /** 0..1 through the current beat, for transfer animation. */
  beatProgress: number
  firedEventIds: string[]
}

export function usePlayback() {
  const events = RECONSTRUCTION_EVENTS
  const start = useMemo(() => (events.length ? events[0].at - 25_000 : T.consoleLogon), [events])
  const end = useMemo(() => (events.length ? events[events.length - 1].at + 45_000 : T.consoleLogoff), [events])

  const [at, setAt] = useState(start)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const frameRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)

  useEffect(() => {
    setAt(start)
  }, [start])

  useEffect(() => {
    if (!playing) {
      lastRef.current = null
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      return
    }

    function step(timestamp: number) {
      const last = lastRef.current
      lastRef.current = timestamp
      if (last !== null) {
        const deltaSeconds = (timestamp - last) / 1000
        setAt((current) => {
          const next = current + deltaSeconds * BASE_RATE * speed * 1000
          if (next >= end) {
            setPlaying(false)
            return end
          }
          return next
        })
      }
      frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [playing, speed, end])

  const fired = useMemo(() => events.filter((e) => e.at <= at), [events, at])
  const activeEvent = fired.length ? fired[fired.length - 1] : null
  const nextEvent = events.find((e) => e.at > at) ?? null

  const beatProgress = useMemo(() => {
    if (!activeEvent) return 0
    const span = (nextEvent ? nextEvent.at : end) - activeEvent.at
    if (span <= 0) return 1
    return Math.max(0, Math.min(1, (at - activeEvent.at) / Math.min(span, 90_000)))
  }, [activeEvent, nextEvent, at, end])

  const seek = useCallback(
    (value: number) => setAt(Math.max(start, Math.min(end, value))),
    [start, end],
  )

  const seekProgress = useCallback((p: number) => seek(start + (end - start) * p), [seek, start, end])

  const stepEvent = useCallback(
    (direction: 1 | -1) => {
      if (!events.length) return
      if (direction === 1) {
        const next = events.find((e) => e.at > at + 1)
        seek(next ? next.at : end)
      } else {
        const previous = [...events].reverse().find((e) => e.at < at - 1200)
        seek(previous ? previous.at : start)
      }
    },
    [events, at, seek, start, end],
  )

  const state: PlaybackState = {
    at,
    start,
    end,
    playing,
    speed,
    progress: end > start ? (at - start) / (end - start) : 0,
    activeEventId: activeEvent?.id ?? null,
    beatProgress,
    firedEventIds: fired.map((e) => e.id),
  }

  return {
    ...state,
    events,
    play: () => setPlaying(true),
    pause: () => setPlaying(false),
    toggle: () => setPlaying((p) => !p),
    restart: () => {
      setAt(start)
      setPlaying(true)
    },
    setSpeed,
    seek,
    seekProgress,
    stepEvent,
  }
}
