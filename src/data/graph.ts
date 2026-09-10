import type { EntityKind, GraphEntity, GraphRelation, RelationKind, Significance } from './types'
import { ACCOUNTS, PERSONS } from './people'
import { DEVICES } from './devices'
import { USB_DEVICES } from './usb'
import { EVENTS } from './events'
import { T } from './clock'
import { formatBytes } from '@/lib/format'
import { formatTs } from '@/lib/time'

/**
 * The link chart.
 *
 * Entities that already exist as records are derived from those records so the
 * graph can never contradict the underlying case file. Files, addresses,
 * domains and locations are declared here because they exist only as
 * relationships. Every relation carries the evidence IDs that justify it - a
 * relation with no evidence has no business being drawn.
 */

const PREFIX: Record<EntityKind, string> = {
  person: 'NP',
  account: 'NA',
  device: 'ND',
  usb: 'NU',
  file: 'NF',
  ip: 'NI',
  domain: 'NM',
  event: 'NE',
  location: 'NL',
}

export function entityId(kind: EntityKind, ref: string): string {
  return `${PREFIX[kind]}-${ref}`
}

const personEntities: GraphEntity[] = PERSONS.map((p) => ({
  id: entityId('person', p.id),
  kind: 'person',
  label: p.name,
  sublabel: p.role,
  refId: p.id,
  significance: p.significance,
  confidence: p.confidence,
  detail: [
    { label: 'Role', value: p.role },
    { label: 'Department', value: p.department },
    { label: 'Employment', value: p.employment },
    { label: 'Status', value: p.status },
    { label: 'Badge', value: p.badgeId },
  ],
}))

const accountEntities: GraphEntity[] = ACCOUNTS.map((a) => ({
  id: entityId('account', a.id),
  kind: 'account',
  label: `${a.domain}\\${a.username}`,
  sublabel: a.type,
  refId: a.id,
  significance: a.id === 'ACC-001' ? 'critical' : a.id === 'ACC-003' ? 'high' : 'moderate',
  confidence: 0.9,
  detail: [
    { label: 'Display name', value: a.displayName },
    { label: 'Type', value: a.type },
    { label: 'Enabled', value: a.enabled ? 'yes' : 'no' },
    { label: 'SID', value: a.sid },
    { label: 'Privileges', value: a.privileges.join('; ') },
  ],
}))

const deviceEntities: GraphEntity[] = DEVICES.map((d) => ({
  id: entityId('device', d.id),
  kind: 'device',
  label: d.name,
  sublabel: d.kind,
  refId: d.id,
  significance: d.significance,
  confidence: d.imaged ? 0.96 : 0.72,
  detail: [
    { label: 'Operating system', value: d.os },
    { label: 'Address', value: d.ip },
    { label: 'Location', value: d.location },
    { label: 'Imaged', value: d.imaged ? 'yes' : 'logs only' },
    { label: 'Clock drift', value: `${d.clockDriftSeconds} s` },
  ],
}))

const usbEntities: GraphEntity[] = USB_DEVICES.map((u) => ({
  id: entityId('usb', u.id),
  kind: 'usb',
  label: `${u.vendor} ${u.product}`,
  sublabel: u.volumeLabel || 'no volume',
  refId: u.id,
  significance: u.significance,
  confidence: u.significance === 'critical' ? 0.93 : 0.8,
  detail: [
    { label: 'Serial', value: u.serial },
    { label: 'VID:PID', value: `${u.vendorId}:${u.productId}` },
    { label: 'Capacity', value: u.capacityBytes ? formatBytes(u.capacityBytes, 0) : 'n/a' },
    { label: 'Filesystem', value: u.filesystem },
    { label: 'Enrolled on', value: u.registeredToDeviceId },
    { label: 'Last connected', value: formatTs(u.lastConnected) },
  ],
}))

const eventEntities: GraphEntity[] = EVENTS.filter((e) => e.reconstruction).map((e) => ({
  id: entityId('event', e.id),
  kind: 'event',
  label: e.title,
  sublabel: formatTs(e.at).slice(11),
  refId: e.id,
  significance: e.severity === 'critical' ? 'critical' : e.severity === 'warning' ? 'high' : 'moderate',
  confidence: e.confidence,
  detail: [
    { label: 'Category', value: e.category },
    { label: 'Source', value: e.source },
    { label: 'Normalised', value: formatTs(e.at) },
    ...e.detail.slice(0, 3),
  ],
}))

interface DeclaredEntity {
  ref: string
  kind: EntityKind
  label: string
  sublabel?: string
  refId?: string
  significance: Significance
  confidence: number
  detail: Array<{ label: string; value: string }>
}

const DECLARED: DeclaredEntity[] = [
  {
    ref: 'ARES-E-0010',
    kind: 'file',
    label: 'research_archive.zip',
    sublabel: 'workstation temp copy',
    refId: 'ARES-E-0010',
    significance: 'critical',
    confidence: 0.97,
    detail: [
      { label: 'Path', value: 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp' },
      { label: 'Size', value: '412,338,112 bytes' },
      { label: 'Created', value: '2026-08-17 23:43:50 normalised' },
    ],
  },
  {
    ref: 'ARES-E-0011',
    kind: 'file',
    label: 'research_archive.zip',
    sublabel: 'removable volume copy',
    refId: 'ARES-E-0011',
    significance: 'critical',
    confidence: 0.72,
    detail: [
      { label: 'Path', value: 'E:\\research_archive.zip' },
      { label: 'Provenance', value: 'Reconstructed from LNK and shellbag' },
      { label: 'Media recovered', value: 'No' },
    ],
  },
  {
    ref: 'ARES-E-0022',
    kind: 'file',
    label: '7z.exe',
    sublabel: 'archiver staged from the IT tools share',
    refId: 'ARES-E-0022',
    significance: 'critical',
    confidence: 0.93,
    detail: [
      { label: 'Origin', value: '\\\\SRV-CORE-03\\ittools$\\7zip' },
      { label: 'Installed on host', value: 'No' },
      { label: 'Share administered by', value: 'Deskside support' },
    ],
  },
  {
    ref: 'ARES-E-0023',
    kind: 'file',
    label: 'research_archive.zip.lnk',
    sublabel: 'shell link target record',
    refId: 'ARES-E-0023',
    significance: 'critical',
    confidence: 0.89,
    detail: [
      { label: 'Target', value: 'E:\\research_archive.zip' },
      { label: 'Volume serial', value: 'A47C-91DE' },
      { label: 'Volume label', value: 'FIELDKIT' },
    ],
  },
  {
    ref: 'ARES-E-0017',
    kind: 'file',
    label: 'halcyon_notes_scratch.txt',
    sublabel: 'deleted, recovered',
    refId: 'ARES-E-0017',
    significance: 'high',
    confidence: 0.78,
    detail: [
      { label: 'Deleted', value: '2026-08-17 23:51:48 normalised' },
      { label: 'Recovery', value: 'Full content from unallocated clusters' },
    ],
  },
  {
    ref: 'ARES-E-0012',
    kind: 'file',
    label: 'halcyon_cell_matrix_v7.xlsx',
    sublabel: 'HALCYON project file',
    refId: 'ARES-E-0012',
    significance: 'high',
    confidence: 0.9,
    detail: [{ label: 'Directory', value: 'Documents\\Research\\HALCYON' }],
  },
  {
    ref: 'ARES-E-0015',
    kind: 'file',
    label: 'patent_draft_HAL-118.docx',
    sublabel: 'HALCYON project file',
    refId: 'ARES-E-0015',
    significance: 'high',
    confidence: 0.88,
    detail: [{ label: 'Marking', value: 'DRAFT - NOT FILED' }],
  },
]

const NETWORK_DECLARED: DeclaredEntity[] = [
  {
    ref: '10.20.7.42',
    kind: 'ip',
    label: '10.20.7.42',
    sublabel: 'subject workstation',
    significance: 'critical',
    confidence: 0.98,
    detail: [
      { label: 'Assigned to', value: 'MD-DEV-0042' },
      { label: 'Segment', value: 'Engineering VLAN 7' },
    ],
  },
  {
    ref: '10.20.4.31',
    kind: 'ip',
    label: '10.20.4.31',
    sublabel: 'administrative jump host',
    significance: 'moderate',
    confidence: 0.95,
    detail: [
      { label: 'Assigned to', value: 'MD-WKS-0031' },
      { label: 'Segment', value: 'Operations VLAN 4' },
    ],
  },
  {
    ref: '10.20.2.13',
    kind: 'ip',
    label: '10.20.2.13',
    sublabel: 'file server',
    significance: 'high',
    confidence: 0.96,
    detail: [
      { label: 'Assigned to', value: 'MD-SRV-CORE-03' },
      { label: 'Shares', value: 'research$, ittools$' },
    ],
  },
  {
    ref: '203.0.113.47',
    kind: 'ip',
    label: '203.0.113.47',
    sublabel: 'external transfer service',
    significance: 'critical',
    confidence: 0.91,
    detail: [
      { label: 'Resolved from', value: 'cdn-sync.vaultbridge-share.io' },
      { label: 'Egress decision', value: 'Blocked by policy EGRESS-114' },
    ],
  },
  {
    ref: '74.83.112.19',
    kind: 'ip',
    label: '74.83.112.19',
    sublabel: 'residential ISP address',
    significance: 'critical',
    confidence: 0.94,
    detail: [
      { label: 'Observed on', value: 'VPN concentrator' },
      { label: 'Session start', value: '2026-08-17 23:38:26' },
    ],
  },
  {
    ref: '100.64.12.31',
    kind: 'ip',
    label: '100.64.12.31',
    sublabel: 'VPN tunnel address',
    significance: 'high',
    confidence: 0.9,
    detail: [{ label: 'Pool', value: 'MERIDIAN-VPN remote access' }],
  },
  {
    ref: 'vaultbridge-share.io',
    kind: 'domain',
    label: 'vaultbridge-share.io',
    sublabel: 'file transfer service',
    significance: 'critical',
    confidence: 0.92,
    detail: [
      { label: 'Category', value: 'Uncategorised cloud storage' },
      { label: 'First seen in estate', value: '2026-08-17 23:48:32' },
    ],
  },
  {
    ref: 'cdn-sync.vaultbridge-share.io',
    kind: 'domain',
    label: 'cdn-sync.vaultbridge-share.io',
    sublabel: 'upload endpoint',
    significance: 'critical',
    confidence: 0.92,
    detail: [{ label: 'Proxy verdict', value: 'CONNECT denied, 8,214 bytes out' }],
  },
  {
    ref: 'update.meridian-dynamics.internal',
    kind: 'domain',
    label: 'update.meridian-dynamics.internal',
    sublabel: 'internal update service',
    significance: 'noise',
    confidence: 0.99,
    detail: [{ label: 'Category', value: 'Sanctioned internal service' }],
  },
  {
    ref: 'telemetry.northgate-msp.example',
    kind: 'domain',
    label: 'telemetry.northgate-msp.example',
    sublabel: 'contractor tooling telemetry',
    significance: 'low',
    confidence: 0.85,
    detail: [{ label: 'Category', value: 'Approved vendor endpoint' }],
  },
  {
    ref: 'LOC-F4',
    kind: 'location',
    label: 'HQ Floor 4 - Lab Bay 4C',
    sublabel: 'subject workstation location',
    significance: 'critical',
    confidence: 0.93,
    detail: [{ label: 'Reader', value: 'STAIR-F4-N' }],
  },
  {
    ref: 'LOC-F2',
    kind: 'location',
    label: 'HQ Floor 2 - IT Bench',
    sublabel: 'deskside support area',
    significance: 'high',
    confidence: 0.9,
    detail: [{ label: 'Hosts', value: 'MD-WKS-0088, MD-WKS-0031' }],
  },
  {
    ref: 'LOC-HOME',
    kind: 'location',
    label: 'Residential address - Reed',
    sublabel: 'off-site',
    significance: 'high',
    confidence: 0.86,
    detail: [{ label: 'Evidenced by', value: 'VPN source address 74.83.112.19' }],
  },
]

function toEntity(d: DeclaredEntity): GraphEntity {
  return {
    id: entityId(d.kind, d.ref),
    kind: d.kind,
    label: d.label,
    sublabel: d.sublabel,
    refId: d.refId,
    significance: d.significance,
    confidence: d.confidence,
    detail: d.detail,
  }
}

export const GRAPH_ENTITIES: GraphEntity[] = [
  ...personEntities,
  ...accountEntities,
  ...deviceEntities,
  ...usbEntities,
  ...eventEntities,
  ...DECLARED.map(toEntity),
  ...NETWORK_DECLARED.map(toEntity),
]

const p = (id: string) => entityId('person', id)
const ac = (id: string) => entityId('account', id)
const dv = (id: string) => entityId('device', id)
const ub = (id: string) => entityId('usb', id)
const fl = (id: string) => entityId('file', id)
const ip = (id: string) => entityId('ip', id)
const dm = (id: string) => entityId('domain', id)
const lc = (id: string) => entityId('location', id)
const evn = (id: string) => entityId('event', id)

let relationSequence = 0
function rel(
  source: string,
  target: string,
  kind: RelationKind,
  evidenceIds: string[],
  weight: number,
  extra: { at?: number; note?: string } = {},
): GraphRelation {
  relationSequence += 1
  return {
    id: `REL-${String(relationSequence).padStart(3, '0')}`,
    source,
    target,
    kind,
    evidenceIds,
    weight,
    at: extra.at,
    note: extra.note,
  }
}

export const GRAPH_RELATIONS: GraphRelation[] = [
  /* ------------------------------------------------------ ownership spine */
  rel(p('PER-001'), ac('ACC-001'), 'OWNS', ['ARES-E-0061'], 3, { note: 'Directory record binds the account to the employee' }),
  rel(p('PER-002'), ac('ACC-002'), 'OWNS', ['ARES-E-0061'], 3),
  rel(p('PER-002'), ac('ACC-005'), 'OWNS', ['ARES-E-0061'], 1, { note: 'Service account operated by platform operations' }),
  rel(p('PER-003'), ac('ACC-003'), 'OWNS', ['ARES-E-0061'], 3),
  rel(p('PER-004'), ac('ACC-004'), 'OWNS', ['ARES-E-0061'], 3),
  rel(p('PER-001'), dv('DEV-0042'), 'OWNS', ['ARES-E-0001'], 3, { note: 'Assigned engineering workstation' }),
  rel(p('PER-001'), dv('LAP-0117'), 'OWNS', ['ARES-E-0002'], 3),
  rel(p('PER-003'), dv('WKS-0088'), 'OWNS', ['ARES-E-0003'], 3, { note: 'Assigned deskside support bench' }),
  rel(p('PER-002'), dv('WKS-0031'), 'OWNS', ['ARES-E-0046'], 2),
  rel(p('PER-002'), dv('MOB-0231'), 'OWNS', ['ARES-E-0053'], 1),

  /* ------------------------------------------------------------ addresses */
  rel(dv('DEV-0042'), ip('10.20.7.42'), 'ASSOCIATED_WITH', ['ARES-E-0042', 'ARES-E-0045'], 3),
  rel(dv('WKS-0031'), ip('10.20.4.31'), 'ASSOCIATED_WITH', ['ARES-E-0046'], 3),
  rel(dv('SRV-CORE-03'), ip('10.20.2.13'), 'ASSOCIATED_WITH', ['ARES-E-0045'], 3),
  rel(dm('cdn-sync.vaultbridge-share.io'), ip('203.0.113.47'), 'ASSOCIATED_WITH', ['ARES-E-0043'], 3, {
    note: 'Resolver log records the A record used for the upload attempt',
  }),
  rel(dm('vaultbridge-share.io'), ip('203.0.113.47'), 'ASSOCIATED_WITH', ['ARES-E-0043'], 2),
  rel(dv('LAP-0117'), ip('74.83.112.19'), 'CONNECTED', ['ARES-E-0044'], 3, {
    at: T.vpnConnect,
    note: 'Public source address of the VPN session',
  }),
  rel(dv('LAP-0117'), ip('100.64.12.31'), 'ASSOCIATED_WITH', ['ARES-E-0044'], 2, { at: T.vpnConnect }),

  /* -------------------------------------------------------------- location */
  rel(dv('DEV-0042'), lc('LOC-F4'), 'ASSOCIATED_WITH', ['ARES-E-0001'], 3),
  rel(dv('WKS-0088'), lc('LOC-F2'), 'ASSOCIATED_WITH', ['ARES-E-0003'], 3),
  rel(dv('WKS-0031'), lc('LOC-F2'), 'ASSOCIATED_WITH', ['ARES-E-0046'], 2),
  rel(p('PER-003'), lc('LOC-F4'), 'ASSOCIATED_WITH', ['ARES-E-0060'], 3, {
    at: T.whitfieldBadgeEntry,
    note: 'Badge BDG-9106 present on the floor for 25m26s across the incident window',
  }),
  rel(p('PER-001'), lc('LOC-HOME'), 'ASSOCIATED_WITH', ['ARES-E-0044'], 2, {
    at: T.vpnConnect,
    note: 'Inferred from the residential source address of the VPN session',
  }),
  rel(p('PER-001'), lc('LOC-F4'), 'ASSOCIATED_WITH', ['ARES-E-0060'], 1, {
    at: T.reedBadgeExit,
    note: 'Present earlier in the day; badge egress recorded at 22:14:09 with no re-entry',
  }),

  /* ---------------------------------------------------- removable media */
  rel(ub('USB-A1'), dv('WKS-0088'), 'CONNECTED', ['ARES-E-0031'], 3, {
    at: T.usbA1FirstSeen,
    note: 'First enrolment of this serial anywhere in the estate',
  }),
  rel(ub('USB-A1'), dv('DEV-0042'), 'CONNECTED', ['ARES-E-0030', 'ARES-E-0033'], 3, {
    at: T.usbInsert,
    note: 'Same serial, mounted as E: inside the incident window',
  }),
  rel(p('PER-003'), ub('USB-A1'), 'ASSOCIATED_WITH', ['ARES-E-0031', 'ARES-E-0003'], 2, {
    note: 'Association is through the enrolling workstation, not a direct observation of possession',
  }),
  rel(ub('USB-B2'), dv('DEV-0042'), 'CONNECTED', ['ARES-E-0033'], 2, {
    at: T.usbB2LastSeen,
    note: 'Six days before the incident window',
  }),
  rel(p('PER-001'), ub('USB-B2'), 'OWNS', ['ARES-E-0004'], 3, { note: 'Surrendered voluntarily and imaged' }),
  rel(ub('USB-D4'), dv('WKS-0031'), 'CONNECTED', ['ARES-E-0034'], 2, { at: T.chenExternalDrive }),
  rel(p('PER-002'), ub('USB-D4'), 'OWNS', ['ARES-E-0034'], 2),
  rel(ub('USB-C3'), dv('DEV-0042'), 'CONNECTED', ['ARES-E-0033'], 1, { note: 'Input peripheral, no storage function' }),
  rel(ub('USB-E5'), dv('LAP-0117'), 'CONNECTED', ['ARES-E-0002'], 1),

  /* ------------------------------------------------------- authentication */
  rel(ac('ACC-001'), dv('DEV-0042'), 'LOGGED_IN', ['ARES-E-0030'], 3, {
    at: T.consoleLogon,
    note: 'Logon type 2 - raised at the physical console, not over the network',
  }),
  rel(ac('ACC-002'), dv('DEV-0042'), 'LOGGED_IN', ['ARES-E-0030', 'ARES-E-0046'], 2, {
    at: T.rdpSessionStart,
    note: 'Logon type 10 under change CHG-8871, closed before the incident window',
  }),
  rel(ac('ACC-001'), dv('LAP-0117'), 'LOGGED_IN', ['ARES-E-0044'], 3, {
    at: T.vpnConnect,
    note: 'Same account authenticated from a residential address 36 s after the console logon',
  }),
  rel(ac('ACC-003'), ac('ACC-001'), 'ASSOCIATED_WITH', ['ARES-E-0050', 'ARES-E-0061'], 3, {
    at: T.passwordResetTicket,
    note: 'Tier-1 password reset performed under helpdesk ticket HD-44192',
  }),
  rel(ac('ACC-004'), dv('SRV-CORE-03'), 'ACCESSED', ['ARES-E-0045'], 1, {
    at: T.directorAccess,
    note: 'Routine daytime read of the project directory',
  }),

  /* --------------------------------------------------------- file actions */
  rel(ac('ACC-001'), fl('ARES-E-0012'), 'ACCESSED', ['ARES-E-0045', 'ARES-E-0021'], 3, { at: T.researchDirAccess }),
  rel(ac('ACC-001'), fl('ARES-E-0015'), 'ACCESSED', ['ARES-E-0045', 'ARES-E-0021'], 3, { at: T.researchDirAccess }),
  rel(ac('ACC-001'), fl('ARES-E-0022'), 'ACCESSED', ['ARES-E-0030', 'ARES-E-0025'], 3, {
    at: T.archiverLaunched,
    note: 'Archiver executed from the IT tools share rather than a local installation',
  }),
  rel(ac('ACC-001'), fl('ARES-E-0010'), 'CREATED', ['ARES-E-0021', 'ARES-E-0025'], 3, { at: T.archiveCreated }),
  rel(fl('ARES-E-0010'), fl('ARES-E-0011'), 'COPIED', ['ARES-E-0023', 'ARES-E-0024'], 3, {
    at: T.archiveCopied,
    note: 'Carved sample digests match across both locations',
  }),
  rel(fl('ARES-E-0011'), ub('USB-A1'), 'ASSOCIATED_WITH', ['ARES-E-0023'], 3, {
    note: 'LNK volume serial A47C-91DE and label FIELDKIT identify the destination media',
  }),
  rel(ac('ACC-001'), fl('ARES-E-0017'), 'DELETED', ['ARES-E-0017', 'ARES-E-0021'], 2, { at: T.scratchDeleted }),
  rel(ac('ACC-001'), fl('ARES-E-0017'), 'MODIFIED', ['ARES-E-0021'], 1, { note: 'Last write predates the deletion by two days' }),
  rel(fl('ARES-E-0012'), fl('ARES-E-0010'), 'ASSOCIATED_WITH', ['ARES-E-0010'], 2, { note: 'Named in the archive central directory' }),
  rel(fl('ARES-E-0015'), fl('ARES-E-0010'), 'ASSOCIATED_WITH', ['ARES-E-0010'], 2),
  rel(dv('SRV-CORE-03'), fl('ARES-E-0022'), 'ASSOCIATED_WITH', ['ARES-E-0045'], 3, { note: 'Binary served from ittools$' }),

  /* ------------------------------------------------------------- network */
  rel(dv('DEV-0042'), dm('vaultbridge-share.io'), 'DOWNLOADED', ['ARES-E-0040', 'ARES-E-0043'], 2, {
    at: T.browserSession,
    note: 'Upload page retrieved; nothing was downloaded to disk',
  }),
  rel(ip('10.20.7.42'), ip('203.0.113.47'), 'CONNECTED', ['ARES-E-0042'], 3, {
    at: T.proxyBlocked,
    note: 'CONNECT denied by policy - 8,214 bytes out, consistent with a handshake and no payload',
  }),
  rel(ip('10.20.4.31'), ip('10.20.7.42'), 'CONNECTED', ['ARES-E-0046'], 2, {
    at: T.rdpSessionStart,
    note: 'Remote desktop session during the approved change window',
  }),
  rel(ip('10.20.7.42'), ip('10.20.2.13'), 'ACCESSED', ['ARES-E-0045'], 3, {
    at: T.researchDirAccess,
    note: 'Bulk SMB read of the project directory immediately before the archive was written',
  }),
  rel(dv('DEV-0042'), dm('update.meridian-dynamics.internal'), 'CONNECTED', ['ARES-E-0043'], 1),
  rel(dv('WKS-0088'), dm('telemetry.northgate-msp.example'), 'CONNECTED', ['ARES-E-0043'], 1),

  /* ------------------------------------------------------- communications */
  rel(p('PER-003'), p('PER-004'), 'EMAILED', ['ARES-E-0050'], 1, {
    at: T.passwordResetTicket,
    note: 'Ticket closure notice copied to the requesting department',
  }),
  rel(p('PER-001'), p('PER-004'), 'EMAILED', ['ARES-E-0052'], 1, { at: T.reedHrEmail }),
  rel(p('PER-003'), p('PER-002'), 'COMMUNICATED_WITH', ['ARES-E-0051', 'ARES-E-0053'], 1, {
    note: 'Both posted in shared operational channels on the evening of 17 AUG',
  }),
  rel(p('PER-002'), dv('DEV-0042'), 'ASSOCIATED_WITH', ['ARES-E-0053'], 1, {
    at: T.chenPatchChat,
    note: 'Announced the patch window on the subject workstation',
  }),

  /* -------------------------------------------------- events to the world */
  rel(evn('EV-016'), ac('ACC-001'), 'ASSOCIATED_WITH', ['ARES-E-0030'], 3, { at: T.consoleLogon }),
  rel(evn('EV-016'), dv('DEV-0042'), 'ASSOCIATED_WITH', ['ARES-E-0030'], 3, { at: T.consoleLogon }),
  rel(evn('EV-017'), dv('LAP-0117'), 'ASSOCIATED_WITH', ['ARES-E-0044'], 3, { at: T.vpnConnect }),
  rel(evn('EV-017'), ip('74.83.112.19'), 'ASSOCIATED_WITH', ['ARES-E-0044'], 3, { at: T.vpnConnect }),
  rel(evn('EV-015'), p('PER-003'), 'ASSOCIATED_WITH', ['ARES-E-0060'], 3, { at: T.whitfieldBadgeEntry }),
  rel(evn('EV-015'), lc('LOC-F4'), 'ASSOCIATED_WITH', ['ARES-E-0060'], 3, { at: T.whitfieldBadgeEntry }),
  rel(evn('EV-029'), p('PER-003'), 'ASSOCIATED_WITH', ['ARES-E-0060'], 3, { at: T.whitfieldBadgeExit }),
  rel(evn('EV-019'), ub('USB-A1'), 'ASSOCIATED_WITH', ['ARES-E-0030', 'ARES-E-0033'], 3, { at: T.usbInsert }),
  rel(evn('EV-019'), dv('DEV-0042'), 'ASSOCIATED_WITH', ['ARES-E-0030'], 3, { at: T.usbInsert }),
  rel(evn('EV-020'), dv('SRV-CORE-03'), 'ASSOCIATED_WITH', ['ARES-E-0045'], 3, { at: T.researchDirAccess }),
  rel(evn('EV-021'), fl('ARES-E-0022'), 'ASSOCIATED_WITH', ['ARES-E-0030', 'ARES-E-0025'], 3, { at: T.archiverLaunched }),
  rel(evn('EV-022'), fl('ARES-E-0010'), 'ASSOCIATED_WITH', ['ARES-E-0021'], 3, { at: T.archiveCreated }),
  rel(evn('EV-023'), fl('ARES-E-0011'), 'ASSOCIATED_WITH', ['ARES-E-0023'], 3, { at: T.archiveCopied }),
  rel(evn('EV-023'), ub('USB-A1'), 'ASSOCIATED_WITH', ['ARES-E-0023', 'ARES-E-0024'], 3, { at: T.archiveCopied }),
  rel(evn('EV-024'), dm('vaultbridge-share.io'), 'ASSOCIATED_WITH', ['ARES-E-0040'], 2, { at: T.browserSession }),
  rel(evn('EV-025'), dm('cdn-sync.vaultbridge-share.io'), 'ASSOCIATED_WITH', ['ARES-E-0042'], 3, { at: T.proxyBlocked }),
  rel(evn('EV-025'), ip('203.0.113.47'), 'ASSOCIATED_WITH', ['ARES-E-0042'], 3, { at: T.proxyBlocked }),
  rel(evn('EV-026'), ub('USB-A1'), 'ASSOCIATED_WITH', ['ARES-E-0032'], 3, { at: T.usbRemoved }),
  rel(evn('EV-027'), fl('ARES-E-0017'), 'ASSOCIATED_WITH', ['ARES-E-0017'], 2, { at: T.scratchDeleted }),
  rel(evn('EV-028'), ac('ACC-001'), 'ASSOCIATED_WITH', ['ARES-E-0030'], 3, { at: T.consoleLogoff }),
  rel(evn('EV-018'), ac('ACC-001'), 'ASSOCIATED_WITH', ['ARES-E-0030'], 2, { at: T.explicitCredential }),
]

export const ENTITY_BY_ID = new Map(GRAPH_ENTITIES.map((e) => [e.id, e]))
