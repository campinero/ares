/**
 * ARES domain model - OPERATION NIGHTFALL.
 *
 * Everything in the case is synthetic and fictional. The model mirrors the
 * shape of a real forensic case file so the workflows stay honest: artifacts
 * carry MACB timestamps, acquisition provenance, digests, custody and
 * confidence; events carry a clock basis; entities and relations carry the
 * evidence IDs that justify them.
 */

export type PersonId = string
export type DeviceId = string
export type AccountId = string
export type EvidenceId = string
export type EventId = string
export type EntityId = string
export type UsbId = string

/* ------------------------------------------------------------------ scoring */

/** How much an artifact or event matters to the investigation. */
export type Significance = 'critical' | 'high' | 'moderate' | 'low' | 'noise'

/** Review state of an evidence item inside the case file. */
export type EvidenceStatus = 'verified' | 'analyzed' | 'pending' | 'contested' | 'excluded'

export type Severity = 'critical' | 'warning' | 'notice' | 'info'

export const SIGNIFICANCE_ORDER: Record<Significance, number> = {
  critical: 0,
  high: 1,
  moderate: 2,
  low: 3,
  noise: 4,
}

/* ------------------------------------------------------------------- people */

export interface Account {
  id: AccountId
  username: string
  displayName: string
  domain: string
  personId: PersonId
  type: 'domain' | 'local' | 'service' | 'admin'
  enabled: boolean
  disabledAt?: number
  lastLogon?: number
  privileges: string[]
  sid: string
}

export interface Person {
  id: PersonId
  name: string
  role: string
  department: string
  employment: 'employee' | 'contractor' | 'vendor'
  status: 'active' | 'offboarding' | 'suspended' | 'terminated'
  accountIds: AccountId[]
  deviceIds: DeviceId[]
  badgeId: string
  /** Investigator-facing summary. Never states the conclusion. */
  summary: string
  /** Facts that raise suspicion. */
  indicators: string[]
  /** Facts that reduce suspicion. */
  exculpatory: string[]
  /** 0..1 strength of the evidentiary association, not a verdict. */
  confidence: number
  significance: Significance
  avatarSeed: string
}

/* ------------------------------------------------------------------ devices */

export interface Device {
  id: DeviceId
  name: string
  kind: 'workstation' | 'laptop' | 'server' | 'mobile' | 'network' | 'removable'
  os: string
  serial: string
  ip: string
  mac: string
  location: string
  ownerId?: PersonId
  custodian: string
  imaged: boolean
  imageId?: EvidenceId
  encryption: string
  lastSeen: number
  /** Documented clock offset versus NTP at acquisition, in seconds. */
  clockDriftSeconds: number
  notes: string
  significance: Significance
}

export interface UsbMountEvent {
  at: number
  deviceId: DeviceId
  driveLetter: string
  action: 'connected' | 'mounted' | 'dismounted' | 'removed'
  hostClock: boolean
  evidenceId?: EvidenceId
}

export interface UsbDevice {
  id: UsbId
  vendor: string
  product: string
  serial: string
  vendorId: string
  productId: string
  capacityBytes: number
  filesystem: string
  volumeLabel: string
  firstConnected: number
  lastConnected: number
  registeredToDeviceId: DeviceId
  mountEvents: UsbMountEvent[]
  associatedPersonId?: PersonId
  filesAccessed: string[]
  significance: Significance
  notes: string
}

/* ----------------------------------------------------------------- evidence */

export type EvidenceCategory =
  | 'disk'
  | 'filesystem'
  | 'log'
  | 'browser'
  | 'network'
  | 'usb'
  | 'comms'
  | 'registry'
  | 'facility'

export type BinaryFormat =
  | 'zip'
  | 'docx'
  | 'xlsx'
  | 'pdf'
  | 'png'
  | 'jpeg'
  | 'mp3'
  | 'exe'
  | 'sqlite'
  | 'evtx'
  | 'raw'

/** How the synthetic bytes behind an artifact are produced. */
export type ContentSpec =
  | { kind: 'text'; text: string }
  | {
      kind: 'binary'
      format: BinaryFormat
      /** On-disk size claimed by the artifact record. */
      logicalSize: number
      /** How many bytes were carved into the case file and are viewable. */
      sampleSize: number
      /** Human-readable strings embedded in the byte stream. */
      strings: string[]
    }

export interface Hashes {
  sha256: string
  sha1: string
  md5: string
}

export interface EvidenceItem {
  id: EvidenceId
  label: string
  category: EvidenceCategory
  /** Human label, e.g. "ZIP archive", "Windows Security event 4624". */
  type: string
  /** Acquisition provenance, e.g. "DEV-0042 / NTFS $MFT record 118442". */
  source: string
  description: string
  acquiredAt: number
  createdAt: number
  modifiedAt: number
  accessedAt: number
  /** True when the timestamps came from the drifted DEV-0042 clock. */
  hostClock: boolean
  status: EvidenceStatus
  /** 0..1 analyst confidence in the artifact itself, not in any conclusion. */
  confidence: number
  significance: Significance
  deviceId?: DeviceId
  personId?: PersonId
  accountId?: AccountId
  path?: string
  sizeBytes?: number
  mimeType?: string
  owner?: string
  permissions?: string
  tags: string[]
  content: ContentSpec
  eventIds: EventId[]
  /** Populated during dataset assembly from the synthetic byte stream. */
  hashes: Hashes
  /** Set when only part of the object was recoverable. */
  carved?: boolean
  /** Analyst-visible caveat rendered in the inspector. */
  caveat?: string
}

/* ------------------------------------------------------------------- events */

export type EventCategory =
  | 'authentication'
  | 'filesystem'
  | 'removable-media'
  | 'process'
  | 'network'
  | 'browser'
  | 'communication'
  | 'facility'
  | 'system'
  | 'account'

export interface TimelineEvent {
  id: EventId
  /** Normalized (NTP-correct) case time. */
  at: number
  /** True when the source record was written by the drifted DEV-0042 clock. */
  hostClock: boolean
  title: string
  summary: string
  category: EventCategory
  severity: Severity
  suspicious: boolean
  source: string
  deviceId?: DeviceId
  personId?: PersonId
  accountId?: AccountId
  evidenceIds: EvidenceId[]
  detail: Array<{ label: string; value: string }>
  confidence: number
  /** Included in the incident reconstruction sequence. */
  reconstruction?: boolean
}

/* -------------------------------------------------------------------- graph */

export type EntityKind =
  | 'person'
  | 'device'
  | 'file'
  | 'usb'
  | 'ip'
  | 'domain'
  | 'event'
  | 'account'
  | 'location'

export type RelationKind =
  | 'OWNS'
  | 'ACCESSED'
  | 'CREATED'
  | 'MODIFIED'
  | 'DELETED'
  | 'COPIED'
  | 'CONNECTED'
  | 'LOGGED_IN'
  | 'DOWNLOADED'
  | 'EMAILED'
  | 'COMMUNICATED_WITH'
  | 'ASSOCIATED_WITH'

export interface GraphEntity {
  id: EntityId
  kind: EntityKind
  label: string
  sublabel?: string
  /** Underlying record id (person, device, evidence, event, usb). */
  refId?: string
  significance: Significance
  confidence: number
  detail: Array<{ label: string; value: string }>
}

export interface GraphRelation {
  id: string
  source: EntityId
  target: EntityId
  kind: RelationKind
  at?: number
  evidenceIds: EvidenceId[]
  /** 1..3 - how strongly the relation is evidenced. */
  weight: number
  note?: string
}

/* ----------------------------------------------------- artifact sub-records */

export interface BrowserRecord {
  id: string
  kind: 'visit' | 'download' | 'search' | 'form'
  at: number
  hostClock: boolean
  url: string
  domain: string
  title: string
  referrer?: string
  browser: string
  profile: string
  visitCount: number
  transition: string
  bytes?: number
  targetPath?: string
  personId?: PersonId
  deviceId?: DeviceId
  evidenceId?: EvidenceId
  significance: Significance
}

export interface NetworkFlow {
  id: string
  at: number
  hostClock: boolean
  sourceIp: string
  sourceHost: string
  destIp: string
  destHost: string
  domain?: string
  protocol: 'TCP' | 'UDP' | 'TLS' | 'HTTP' | 'HTTPS' | 'DNS' | 'RDP' | 'SMB' | 'IPSEC'
  port: number
  bytesOut: number
  bytesIn: number
  durationMs: number
  status: 'allowed' | 'blocked' | 'reset' | 'timeout' | 'established' | 'closed'
  /** 0..100 detection-engine score. Not proof of anything. */
  anomalyScore: number
  rule?: string
  deviceId?: DeviceId
  personId?: PersonId
  evidenceId?: EvidenceId
  significance: Significance
}

export interface LogRecord {
  id: string
  at: number
  hostClock: boolean
  channel: 'Security' | 'System' | 'Application' | 'Sysmon' | 'Proxy' | 'VPN' | 'Facility' | 'FileServer'
  eventId: number
  level: Severity
  provider: string
  computer: string
  account?: string
  message: string
  fields: Array<{ label: string; value: string }>
  evidenceId?: EvidenceId
  significance: Significance
}

export interface CommsRecord {
  id: string
  kind: 'email' | 'chat'
  at: number
  from: string
  to: string[]
  channel?: string
  subject?: string
  body: string
  attachments: Array<{ name: string; sizeBytes: number }>
  personId?: PersonId
  evidenceId?: EvidenceId
  significance: Significance
}

export interface FsNode {
  id: string
  name: string
  path: string
  kind: 'directory' | 'file'
  deviceId: DeviceId
  sizeBytes: number
  created: number
  modified: number
  accessed: number
  changed: number
  hostClock: boolean
  owner: string
  permissions: string
  attributes: string[]
  deleted?: boolean
  recoverable?: boolean
  mftRecord?: number
  evidenceId?: EvidenceId
  significance: Significance
  parentId?: string
}

/* --------------------------------------------------------- analyst products */

export type HypothesisStance = 'supports' | 'contradicts' | 'neutral'

export interface HypothesisLink {
  evidenceId: EvidenceId
  stance: HypothesisStance
  /** 1..3 evidentiary weight assigned by the analyst. */
  weight: number
  rationale: string
}

export type HypothesisStatus = 'open' | 'supported' | 'refuted' | 'unresolved'

export interface Hypothesis {
  id: string
  code: string
  title: string
  statement: string
  status: HypothesisStatus
  createdAt: number
  author: string
  links: HypothesisLink[]
  openQuestions: string[]
  /** Shipped with the case file rather than authored by the investigator. */
  builtIn: boolean
}

export type CustodyAction =
  | 'ACQUIRED'
  | 'TRANSFERRED'
  | 'ANALYZED'
  | 'VERIFIED'
  | 'SEALED'
  | 'RELEASED'
  | 'NOTE'

export interface CustodyEvent {
  id: string
  evidenceId: EvidenceId
  at: number
  action: CustodyAction
  custodian: string
  from?: string
  to?: string
  method: string
  hashVerified: boolean
  note: string
  builtIn: boolean
}

export interface CaseNote {
  id: string
  at: number
  author: string
  body: string
  pinned: boolean
  evidenceIds: EvidenceId[]
  eventIds: EventId[]
}

/* ---------------------------------------------------------------- case meta */

export interface CaseMeta {
  id: string
  name: string
  codename: string
  classification: string
  status: 'active' | 'review' | 'closed'
  opened: number
  organization: string
  lead: string
  examiner: string
  jurisdiction: string
  synopsis: string
  mandate: string[]
  unresolvedQuestions: string[]
  timezone: string
}

export interface CaseDataset {
  meta: CaseMeta
  persons: Person[]
  accounts: Account[]
  devices: Device[]
  usbDevices: UsbDevice[]
  evidence: EvidenceItem[]
  events: TimelineEvent[]
  entities: GraphEntity[]
  relations: GraphRelation[]
  browser: BrowserRecord[]
  network: NetworkFlow[]
  logs: LogRecord[]
  comms: CommsRecord[]
  filesystem: FsNode[]
  hypotheses: Hypothesis[]
  custody: CustodyEvent[]
  notes: CaseNote[]
}
