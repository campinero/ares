import type { EventId } from '@/data/types'

/**
 * The reconstruction stage.
 *
 * A fixed set of actors laid out on a plane, and a mapping from each
 * reconstruction event to the actors it lights up and the transfer it draws.
 * Positions are authored, not generated, so the scene reads the same every run.
 */

export type StageKind = 'device' | 'media' | 'file' | 'person' | 'network' | 'facility' | 'server'

export interface StageNode {
  id: string
  label: string
  sub: string
  kind: StageKind
  position: [number, number, number]
}

export const STAGE_NODES: StageNode[] = [
  { id: 'badge', label: 'STAIR-F4-N', sub: 'facility reader', kind: 'facility', position: [-6.1, 0, 2.4] },
  { id: 'operator', label: 'CONSOLE', sub: 'physical seat', kind: 'person', position: [-3.6, 0, 3.2] },
  { id: 'workstation', label: 'DEV-0042', sub: 'subject workstation', kind: 'device', position: [0, 0, 0] },
  { id: 'usb', label: 'FIELDKIT', sub: 'removable volume E:', kind: 'media', position: [-3.4, 0, -2.6] },
  { id: 'fileserver', label: 'SRV-CORE-03', sub: 'research + tools shares', kind: 'server', position: [-1.2, 0, -5.0] },
  { id: 'archive', label: 'research_archive.zip', sub: 'staged container', kind: 'file', position: [2.6, 0, -2.4] },
  { id: 'proxy', label: 'FW-EDGE-01', sub: 'egress proxy', kind: 'network', position: [3.9, 0, 0.2] },
  { id: 'internet', label: 'vaultbridge-share.io', sub: 'external transfer service', kind: 'network', position: [5.7, 0, 2.4] },
  { id: 'laptop', label: 'LAP-0117', sub: 'VPN from residential ISP', kind: 'device', position: [3.9, 0, 4.9] },
]

export interface StageBeat {
  /** Actors that pulse when this event fires. */
  active: string[]
  /** Optional directed transfer drawn between two actors. */
  flow?: [string, string]
  /** Short caption rendered over the scene. */
  caption: string
  /** Transfers that read as a failure rather than a success. */
  denied?: boolean
}

export const EVENT_STAGE: Record<EventId, StageBeat> = {
  'EV-015': {
    active: ['badge'],
    caption: 'Badge read on the floor four stairwell reader',
  },
  'EV-016': {
    active: ['operator', 'workstation'],
    flow: ['operator', 'workstation'],
    caption: 'Interactive logon raised at the physical console',
  },
  'EV-017': {
    active: ['laptop'],
    flow: ['laptop', 'proxy'],
    caption: 'The same account authenticates over VPN from a residential address',
  },
  'EV-018': {
    active: ['workstation', 'fileserver'],
    flow: ['workstation', 'fileserver'],
    caption: 'Explicit credentials presented to the file server',
  },
  'EV-019': {
    active: ['usb', 'workstation'],
    flow: ['usb', 'workstation'],
    caption: 'Removable volume mounted as E:',
  },
  'EV-020': {
    active: ['fileserver', 'workstation'],
    flow: ['fileserver', 'workstation'],
    caption: 'Nine project files read in a single burst',
  },
  'EV-021': {
    active: ['fileserver', 'workstation'],
    flow: ['fileserver', 'workstation'],
    caption: 'Archiver executed from the support tools share',
  },
  'EV-022': {
    active: ['workstation', 'archive'],
    flow: ['workstation', 'archive'],
    caption: 'Archive written to the user temp directory',
  },
  'EV-023': {
    active: ['archive', 'usb'],
    flow: ['archive', 'usb'],
    caption: 'Archive copied to the removable volume',
  },
  'EV-024': {
    active: ['workstation', 'internet'],
    flow: ['workstation', 'proxy'],
    caption: 'Browser session opened to an external transfer service',
  },
  'EV-025': {
    active: ['proxy', 'internet'],
    flow: ['proxy', 'internet'],
    denied: true,
    caption: 'Upload attempt denied at the boundary - 8,214 bytes out',
  },
  'EV-026': {
    active: ['usb'],
    flow: ['workstation', 'usb'],
    caption: 'Removable volume removed - device never recovered',
  },
  'EV-027': {
    active: ['workstation'],
    caption: 'Working notes file deleted',
  },
  'EV-028': {
    active: ['operator', 'workstation'],
    caption: 'Console session closed after fifteen minutes',
  },
  'EV-029': {
    active: ['badge'],
    caption: 'Badge exits floor four',
  },
}

export const STAGE_NODE_BY_ID = new Map(STAGE_NODES.map((n) => [n.id, n]))

export const KIND_COLOR: Record<StageKind, string> = {
  device: '#33c9de',
  media: '#edb04a',
  file: '#8f7df2',
  person: '#4a90f0',
  network: '#34c98b',
  facility: '#a3b4c7',
  server: '#4a90f0',
}
