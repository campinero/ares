import {
  Activity,
  Binary,
  Braces,
  Cable,
  ClipboardList,
  Cpu,
  FileSearch,
  FileText,
  Fingerprint,
  FolderTree,
  GitBranch,
  Globe,
  LayoutDashboard,
  ListTree,
  Play,
  Tags,
  Usb,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  path: string
  label: string
  short: string
  icon: ComponentType<{ className?: string }>
  group: 'case' | 'artifacts' | 'analysis' | 'product'
  shortcut?: string
  description: string
}

/** Single source of truth for routing, the sidebar and the command palette. */
export const NAV: NavItem[] = [
  { path: '/', label: 'Case Overview', short: 'OVERVIEW', icon: LayoutDashboard, group: 'case', description: 'Case status, coverage and unresolved questions' },
  { path: '/evidence', label: 'Evidence', short: 'EVIDENCE', icon: FileSearch, group: 'artifacts', shortcut: 'E', description: 'Every artifact in the case file' },
  { path: '/filesystem', label: 'File System', short: 'FILES', icon: FolderTree, group: 'artifacts', description: 'NTFS tree, deleted and recovered objects' },
  { path: '/hex', label: 'Hex Viewer', short: 'HEX', icon: Binary, group: 'artifacts', description: 'Byte level inspection of a selected artifact' },
  { path: '/strings', label: 'Strings', short: 'STRINGS', icon: Braces, group: 'artifacts', description: 'Printable runs recovered from artifact data' },
  { path: '/metadata', label: 'Metadata', short: 'META', icon: Tags, group: 'artifacts', description: 'MACB times, digests and provenance' },
  { path: '/browser', label: 'Browser Artifacts', short: 'BROWSER', icon: Globe, group: 'artifacts', description: 'History, searches and downloads' },
  { path: '/usb', label: 'USB Devices', short: 'USB', icon: Usb, group: 'artifacts', description: 'Removable media enrolment and mount history' },
  { path: '/network', label: 'Network Activity', short: 'NETWORK', icon: Cable, group: 'artifacts', description: 'Flows, egress decisions and anomaly scoring' },
  { path: '/timeline', label: 'Timeline', short: 'TIMELINE', icon: Activity, group: 'analysis', shortcut: 'T', description: 'Zoomable master timeline of every event' },
  { path: '/graph', label: 'Evidence Graph', short: 'GRAPH', icon: GitBranch, group: 'analysis', shortcut: 'G', description: 'Entities and the relations the evidence supports' },
  { path: '/persons', label: 'Persons', short: 'PERSONS', icon: Users, group: 'analysis', description: 'Persons of interest and their associations' },
  { path: '/devices', label: 'Devices', short: 'DEVICES', icon: Cpu, group: 'analysis', description: 'Devices, acquisition state and clock integrity' },
  { path: '/hypotheses', label: 'Hypotheses', short: 'HYPOTH', icon: ListTree, group: 'analysis', shortcut: 'H', description: 'Competing explanations weighed against evidence' },
  { path: '/custody', label: 'Chain of Custody', short: 'CUSTODY', icon: ClipboardList, group: 'product', description: 'Custody ledger and integrity verification' },
  { path: '/reconstruction', label: 'Incident Reconstruction', short: 'RECON', icon: Play, group: 'product', shortcut: 'R', description: 'Cinematic playback of the incident window' },
  { path: '/report', label: 'Forensic Report', short: 'REPORT', icon: FileText, group: 'product', description: 'Assemble and export the examination report' },
]

export const NAV_GROUPS: Array<{ id: NavItem['group']; label: string }> = [
  { id: 'case', label: 'Case' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'product', label: 'Work product' },
]

export const NAV_ICON_FALLBACK = Fingerprint
