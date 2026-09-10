/**
 * Visual identity for the link chart.
 *
 * Kind accents are grouped by meaning rather than picked for variety: identity
 * runs violet, hosts and addresses run cyan, removable media amber, data jade,
 * external infrastructure azure, places grey. Red belongs to the incident
 * events and to the critical spine that joins them - nothing else.
 */
import type { LucideIcon } from 'lucide-react'
import { FileText, Globe, KeyRound, MapPin, Monitor, Network, User, Usb, Zap } from 'lucide-react'
import type { EntityKind, RelationKind, Significance } from '@/data/types'

export interface KindMeta {
  label: string
  accent: string
  icon: LucideIcon
}

/** Rendering and filter order - identity first, infrastructure last. */
export const KIND_ORDER: EntityKind[] = [
  'person',
  'account',
  'device',
  'ip',
  'domain',
  'usb',
  'file',
  'event',
  'location',
]

export const KIND_META: Record<EntityKind, KindMeta> = {
  person: { label: 'Person', accent: '#8f7df2', icon: User },
  account: { label: 'Account', accent: '#b0a0ff', icon: KeyRound },
  device: { label: 'Device', accent: '#33c9de', icon: Monitor },
  ip: { label: 'Address', accent: '#2596a8', icon: Network },
  domain: { label: 'Domain', accent: '#4a90f0', icon: Globe },
  usb: { label: 'Removable', accent: '#edb04a', icon: Usb },
  file: { label: 'File', accent: '#34c98b', icon: FileText },
  event: { label: 'Event', accent: '#ef5340', icon: Zap },
  location: { label: 'Location', accent: '#7d92a8', icon: MapPin },
}

export const RELATION_ORDER: RelationKind[] = [
  'OWNS',
  'LOGGED_IN',
  'ACCESSED',
  'CREATED',
  'MODIFIED',
  'DELETED',
  'COPIED',
  'CONNECTED',
  'DOWNLOADED',
  'EMAILED',
  'COMMUNICATED_WITH',
  'ASSOCIATED_WITH',
]

/** "LOGGED_IN" -> "logged in" */
export function relationLabel(kind: RelationKind): string {
  return kind.toLowerCase().replace(/_/g, ' ')
}

export const SIGNIFICANCE_COLOR: Record<Significance, string> = {
  critical: '#ef5340',
  high: '#edb04a',
  moderate: '#33c9de',
  low: '#4a90f0',
  noise: '#47596d',
}

/* ------------------------------------------------------------- geometry */

const WIDTH: Record<Significance, number> = {
  critical: 182,
  high: 164,
  moderate: 150,
  low: 138,
  noise: 128,
}

const HEIGHT: Record<Significance, number> = {
  critical: 48,
  high: 46,
  moderate: 44,
  low: 42,
  noise: 40,
}

export function nodeWidth(significance: Significance): number {
  return WIDTH[significance]
}

export function nodeHeight(significance: Significance): number {
  return HEIGHT[significance]
}

/* ----------------------------------------------------------------- edges */

/** Steel for context, cyan for well-evidenced links, red for the critical spine. */
export function relationColor(a: Significance, b: Significance, weight: number): string {
  if (a === 'critical' && b === 'critical') return '#c2412f'
  if (weight >= 3) return '#2f7f8d'
  if (weight === 2) return '#2a3b4e'
  return '#1e2b3a'
}

export function relationWidth(weight: number): number {
  return 0.9 + Math.max(0, Math.min(3, weight)) * 0.55
}

export const EDGE_DIM = '#16202c'
export const NODE_DIM_OPACITY = 0.16
