import { describe, expect, it } from 'vitest'
import { CASE, EVIDENCE, evidenceBytes, entityById, evidenceById, eventById } from './index'
import { extractStrings } from './synth'
import { sha256 } from '@/lib/sha256'
import { HOST_CLOCK_DRIFT_SECONDS, displayTs, formatTs, fromHostClock, toHostClock } from '@/lib/time'

describe('digests', () => {
  it('matches known SHA-256 vectors', () => {
    expect(sha256(new TextEncoder().encode(''))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(sha256(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('recomputes every artifact digest from its own bytes', () => {
    for (const item of EVIDENCE) {
      expect(sha256(evidenceBytes(item.id)), `digest mismatch for ${item.id}`).toBe(item.hashes.sha256)
    }
  })

  it('produces byte-identical artifacts across repeated builds', () => {
    for (const item of EVIDENCE.slice(0, 12)) {
      const a = Array.from(evidenceBytes(item.id))
      const b = Array.from(evidenceBytes(item.id))
      expect(a).toEqual(b)
    }
  })

  it('gives every artifact distinct content', () => {
    const digests = new Set(EVIDENCE.map((e) => e.hashes.sha256))
    expect(digests.size).toBe(EVIDENCE.length)
  })
})

describe('referential integrity', () => {
  it('has unique evidence ids', () => {
    expect(new Set(EVIDENCE.map((e) => e.id)).size).toBe(EVIDENCE.length)
  })

  it('resolves every evidence id cited by an event', () => {
    for (const event of CASE.events) {
      for (const id of event.evidenceIds) {
        expect(evidenceById.has(id), `${event.id} cites missing ${id}`).toBe(true)
      }
    }
  })

  it('resolves every evidence id cited by a graph relation', () => {
    for (const relation of CASE.relations) {
      for (const id of relation.evidenceIds) {
        expect(evidenceById.has(id), `${relation.id} cites missing ${id}`).toBe(true)
      }
      expect(entityById.has(relation.source), `${relation.id} source missing`).toBe(true)
      expect(entityById.has(relation.target), `${relation.id} target missing`).toBe(true)
    }
  })

  it('resolves every evidence id cited by a hypothesis, note or custody entry', () => {
    for (const hypothesis of CASE.hypotheses) {
      for (const link of hypothesis.links) {
        expect(evidenceById.has(link.evidenceId), `${hypothesis.code} cites missing ${link.evidenceId}`).toBe(true)
      }
    }
    for (const note of CASE.notes) {
      for (const id of note.evidenceIds) expect(evidenceById.has(id), `note cites missing ${id}`).toBe(true)
      for (const id of note.eventIds) expect(eventById.has(id), `note cites missing ${id}`).toBe(true)
    }
    for (const entry of CASE.custody) {
      expect(evidenceById.has(entry.evidenceId), `custody cites missing ${entry.evidenceId}`).toBe(true)
    }
  })

  it('points every person, device and account reference at a real record', () => {
    const people = new Set(CASE.persons.map((p) => p.id))
    const devices = new Set(CASE.devices.map((d) => d.id))
    const accounts = new Set(CASE.accounts.map((a) => a.id))
    for (const item of EVIDENCE) {
      if (item.personId) expect(people.has(item.personId), `${item.id} person`).toBe(true)
      if (item.deviceId) expect(devices.has(item.deviceId), `${item.id} device`).toBe(true)
      if (item.accountId) expect(accounts.has(item.accountId), `${item.id} account`).toBe(true)
    }
    for (const account of CASE.accounts) expect(people.has(account.personId)).toBe(true)
    for (const usb of CASE.usbDevices) expect(devices.has(usb.registeredToDeviceId)).toBe(true)
  })
})

describe('the case clock', () => {
  it('round-trips the documented host drift', () => {
    const normalised = CASE.events[0].at
    expect(fromHostClock(toHostClock(normalised))).toBe(normalised)
    expect(toHostClock(normalised) - normalised).toBe(HOST_CLOCK_DRIFT_SECONDS * 1000)
  })

  it('only shifts host-written records', () => {
    const hostBound = CASE.events.find((e) => e.hostClock)
    const external = CASE.events.find((e) => !e.hostClock)
    expect(hostBound).toBeDefined()
    expect(external).toBeDefined()
    if (!hostBound || !external) return
    expect(displayTs(hostBound.at, 'host', true) - hostBound.at).toBe(192_000)
    expect(displayTs(external.at, 'host', false)).toBe(external.at)
    expect(displayTs(hostBound.at, 'normalized', true)).toBe(hostBound.at)
  })

  it('renders times in the fixed case offset regardless of the host time zone', () => {
    // 2026-08-17T23:37:50-04:00
    expect(formatTs(Date.parse('2026-08-17T23:37:50-04:00'))).toBe('2026-08-17 23:37:50')
  })

  it('records the console logon and the VPN session 36 seconds apart', () => {
    const logon = CASE.events.find((e) => e.id === 'EV-016')
    const vpn = CASE.events.find((e) => e.id === 'EV-017')
    expect(logon && vpn).toBeTruthy()
    if (!logon || !vpn) return
    expect(vpn.at - logon.at).toBe(36_000)
  })
})

describe('the case is coherent and solvable', () => {
  it('carries enough evidence, events and entities to work', () => {
    expect(EVIDENCE.length).toBeGreaterThanOrEqual(30)
    expect(CASE.events.length).toBeGreaterThanOrEqual(25)
    expect(CASE.entities.length).toBeGreaterThanOrEqual(40)
    expect(CASE.relations.length).toBeGreaterThanOrEqual(50)
    expect(CASE.persons.length).toBeGreaterThanOrEqual(3)
  })

  it('keeps roughly a third of the artifact set as low-signal noise', () => {
    const noise = EVIDENCE.filter((e) => e.significance === 'noise' || e.significance === 'low').length
    expect(noise).toBeGreaterThan(2)
    expect(noise).toBeLessThan(EVIDENCE.length)
  })

  it('holds a reconstruction sequence in chronological order', () => {
    const sequence = CASE.events.filter((e) => e.reconstruction)
    expect(sequence.length).toBeGreaterThanOrEqual(10)
    const times = sequence.map((e) => e.at)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })

  it('exposes the removable media path and the blocked network path', () => {
    const blocked = CASE.network.filter((f) => f.status === 'blocked')
    expect(blocked.length).toBeGreaterThan(0)
    // The denied egress must be tiny next to the archive it supposedly carried.
    const archive = evidenceById.get('ARES-E-0010')
    expect(archive).toBeDefined()
    const largestBlocked = Math.max(...blocked.map((f) => f.bytesOut))
    expect(largestBlocked).toBeLessThan((archive?.sizeBytes ?? 0) / 1000)
  })

  it('enrols the pivotal removable device on two different machines', () => {
    const usb = CASE.usbDevices.find((u) => u.id === 'USB-A1')
    expect(usb).toBeDefined()
    const hosts = new Set(usb?.mountEvents.map((m) => m.deviceId))
    expect(hosts.size).toBeGreaterThanOrEqual(2)
  })
})

describe('synthetic content', () => {
  it('recovers the embedded strings from an artifact buffer', () => {
    const archive = evidenceById.get('ARES-E-0010')
    expect(archive).toBeDefined()
    const runs = extractStrings(evidenceBytes('ARES-E-0010'), 4).map((r) => r.text)
    expect(runs.some((r) => r.includes('halcyon_cell_matrix_v7.xlsx'))).toBe(true)
  })

  it('writes a recognisable container signature', () => {
    const bytes = evidenceBytes('ARES-E-0010')
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04])
  })
})
