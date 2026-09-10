import type { CaseDataset, EvidenceItem, EvidenceId, Hashes } from './types'
import { CASE_META } from './case'
import { PERSONS, ACCOUNTS } from './people'
import { DEVICES } from './devices'
import { USB_DEVICES } from './usb'
import { EVENTS } from './events'
import { EVIDENCE_SEEDS, type EvidenceSeed } from './evidence'
import { EVIDENCE_FILES } from './evidence.files'
import { EVIDENCE_LOGS } from './evidence.logs'
import { EVIDENCE_WEB } from './evidence.web'
import { EVIDENCE_COMMS } from './evidence.comms'
import { BROWSER_RECORDS } from './browser'
import { NETWORK_FLOWS } from './network'
import { LOG_RECORDS } from './logs'
import { COMMS_RECORDS } from './comms'
import { FS_NODES } from './filesystem'
import { GRAPH_ENTITIES, GRAPH_RELATIONS } from './graph'
import { HYPOTHESES } from './hypotheses'
import { CUSTODY_EVENTS } from './custody'
import { CASE_NOTES } from './notes'
import { buildBytes } from './synth'
import { md5Like, sha1Like, sha256 } from '@/lib/sha256'

/* ------------------------------------------------------------ byte streams */

const BYTES = new Map<EvidenceId, Uint8Array>()
const HASHES = new Map<EvidenceId, Hashes>()

const ALL_SEEDS: EvidenceSeed[] = [
  ...EVIDENCE_SEEDS,
  ...EVIDENCE_FILES,
  ...EVIDENCE_LOGS,
  ...EVIDENCE_WEB,
  ...EVIDENCE_COMMS,
]

/** Synthetic bytes for an artifact, built once and cached. */
export function evidenceBytes(id: EvidenceId): Uint8Array {
  const cached = BYTES.get(id)
  if (cached) return cached
  const seed = ALL_SEEDS.find((s) => s.id === id)
  if (!seed) return new Uint8Array(0)
  const bytes = buildBytes(seed.id, seed.content)
  BYTES.set(id, bytes)
  return bytes
}

function digestsFor(seed: EvidenceSeed): Hashes {
  const cached = HASHES.get(seed.id)
  if (cached) return cached
  const bytes = evidenceBytes(seed.id)
  const hashes: Hashes = { sha256: sha256(bytes), sha1: sha1Like(bytes), md5: md5Like(bytes) }
  HASHES.set(seed.id, hashes)
  return hashes
}

export const EVIDENCE: EvidenceItem[] = ALL_SEEDS.map((seed) => ({ ...seed, hashes: digestsFor(seed) }))

/* ---------------------------------------------------------------- dataset */

export const CASE: CaseDataset = {
  meta: CASE_META,
  persons: PERSONS,
  accounts: ACCOUNTS,
  devices: DEVICES,
  usbDevices: USB_DEVICES,
  evidence: EVIDENCE,
  events: [...EVENTS].sort((a, b) => a.at - b.at),
  entities: GRAPH_ENTITIES,
  relations: GRAPH_RELATIONS,
  browser: [...BROWSER_RECORDS].sort((a, b) => a.at - b.at),
  network: [...NETWORK_FLOWS].sort((a, b) => a.at - b.at),
  logs: [...LOG_RECORDS].sort((a, b) => a.at - b.at),
  comms: [...COMMS_RECORDS].sort((a, b) => a.at - b.at),
  filesystem: FS_NODES,
  hypotheses: HYPOTHESES,
  custody: CUSTODY_EVENTS,
  notes: CASE_NOTES,
}

/* ---------------------------------------------------------------- indexes */

export const evidenceById = new Map(CASE.evidence.map((e) => [e.id, e]))
export const eventById = new Map(CASE.events.map((e) => [e.id, e]))
export const personById = new Map(CASE.persons.map((p) => [p.id, p]))
export const deviceById = new Map(CASE.devices.map((d) => [d.id, d]))
export const accountById = new Map(CASE.accounts.map((a) => [a.id, a]))
export const usbById = new Map(CASE.usbDevices.map((u) => [u.id, u]))
export const entityById = new Map(CASE.entities.map((n) => [n.id, n]))
export const fsById = new Map(CASE.filesystem.map((n) => [n.id, n]))

/** Events that cite a given evidence item. */
export function eventsForEvidence(id: EvidenceId) {
  return CASE.events.filter((e) => e.evidenceIds.includes(id))
}

/** Evidence cited by a given event. */
export function evidenceForEvent(eventId: string) {
  const event = eventById.get(eventId)
  if (!event) return []
  return event.evidenceIds.map((id) => evidenceById.get(id)).filter((e): e is EvidenceItem => Boolean(e))
}

export function evidenceForPerson(personId: string) {
  const accounts = new Set(CASE.accounts.filter((a) => a.personId === personId).map((a) => a.id))
  return CASE.evidence.filter((e) => e.personId === personId || (e.accountId && accounts.has(e.accountId)))
}

export function evidenceForDevice(deviceId: string) {
  return CASE.evidence.filter((e) => e.deviceId === deviceId)
}

export function eventsForPerson(personId: string) {
  const accounts = new Set(CASE.accounts.filter((a) => a.personId === personId).map((a) => a.id))
  return CASE.events.filter((e) => e.personId === personId || (e.accountId && accounts.has(e.accountId)))
}

export function relationsForEntity(entityId: string) {
  return CASE.relations.filter((r) => r.source === entityId || r.target === entityId)
}

export const CASE_SPAN = {
  start: CASE.events.length ? CASE.events[0].at : CASE_META.opened,
  end: CASE.events.length ? CASE.events[CASE.events.length - 1].at : CASE_META.opened,
}

export const SUSPICIOUS_EVENTS = CASE.events.filter((e) => e.suspicious)

export { CASE_META } from './case'
export { T, CASE_WINDOW } from './clock'
export { RECONSTRUCTION_EVENTS } from './events'
export { extractStrings } from './synth'
export type { EvidenceSeed } from './evidence'
