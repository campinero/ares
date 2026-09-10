import type { Account, Person } from './types'
import { T } from './clock'

/**
 * Persons of interest. The confidence field is the strength of the evidentiary
 * association surfaced so far - it is deliberately NOT a verdict, and on a first
 * pass it points at the account holder rather than the operator.
 */
export const PERSONS: Person[] = [
  {
    id: 'PER-001',
    name: 'Morgan Reed',
    role: 'Senior Research Engineer',
    department: 'Advanced Energy Storage',
    employment: 'employee',
    status: 'offboarding',
    accountIds: ['ACC-001'],
    deviceIds: ['DEV-0042', 'LAP-0117'],
    badgeId: 'BDG-4471',
    summary:
      'Principal author on Project HALCYON. Submitted resignation on 14 AUG 2026 with a final day of 21 AUG. Her domain account performed every action inside the incident window and was disabled the following morning.',
    indicators: [
      'Interactive logon 4624 (type 2) on DEV-0042 at the start of the incident window uses her credentials',
      'All HALCYON directory reads and the archive creation are attributed to her account token',
      'Resignation submitted three days before the incident; had legitimate access to the research share',
    ],
    exculpatory: [
      'Facility badge records her turnstile exit at 22:14:09, over one hour before the console logon',
      'Corporate laptop LAP-0117 established a VPN session from her residential ISP 36 seconds after the console logon on DEV-0042',
      'No badge re-entry is recorded for BDG-4471 for the remainder of 17 AUG',
    ],
    confidence: 0.71,
    significance: 'critical',
    avatarSeed: 'morgan-reed',
  },
  {
    id: 'PER-002',
    name: 'Avery Chen',
    role: 'Infrastructure Engineer',
    department: 'Platform Operations',
    employment: 'employee',
    status: 'active',
    accountIds: ['ACC-002', 'ACC-005'],
    deviceIds: ['WKS-0031', 'MOB-0231'],
    badgeId: 'BDG-2210',
    summary:
      'Holds domain administrator rights and ran the approved 17 AUG patch window. Connected an external drive to his own workstation the same evening, which surfaced him in the initial DLP sweep.',
    indicators: [
      'Remote desktop session into DEV-0042 on the night of the incident',
      'Connected a 2 TB Seagate external drive to WKS-0031 at 21:03:26',
      'Domain administrator privileges allow credential and audit-policy changes',
    ],
    exculpatory: [
      'RDP session closed at 23:29:40, eight minutes before the console logon that begins the incident window',
      'Change ticket CHG-8871 authorises the patch window and matches the session times',
      'Logon type 10 (RemoteInteractive) is inconsistent with the type 2 console logon under investigation',
    ],
    confidence: 0.38,
    significance: 'high',
    avatarSeed: 'avery-chen',
  },
  {
    id: 'PER-003',
    name: 'Dana Whitfield',
    role: 'IT Support Technician',
    department: 'Northgate Managed Services (contract)',
    employment: 'contractor',
    status: 'active',
    accountIds: ['ACC-003'],
    deviceIds: ['WKS-0088'],
    badgeId: 'BDG-9106',
    summary:
      'Contract deskside technician with helpdesk privileges. Processed a password reset for the Reed account earlier the same day and was on the fourth floor during the incident window.',
    indicators: [
      'Closed helpdesk ticket HD-44192 at 17:02:41, performing a password reset on the Reed account',
      'Badge BDG-9106 entered floor 4 at 23:33:41 and exited at 23:59:07, bracketing the incident window',
      'The USB serial recorded on DEV-0042 was first enrolled on WKS-0088, her assigned workstation',
      'The archiver executed from the IT tools share her role administers',
    ],
    exculpatory: [
      'Her own domain account never authenticated to DEV-0042',
      'Floor 4 access is within her normal support remit and she logged a loaner-collection message at 22:58',
    ],
    confidence: 0.44,
    significance: 'critical',
    avatarSeed: 'dana-whitfield',
  },
  {
    id: 'PER-004',
    name: 'Kelsey Nunes',
    role: 'Director of Research',
    department: 'Advanced Energy Storage',
    employment: 'employee',
    status: 'active',
    accountIds: ['ACC-004'],
    deviceIds: [],
    badgeId: 'BDG-1032',
    summary:
      'Programme owner for HALCYON. Appears in the artifact set through routine daytime access to the research share and the review meeting on 14 AUG.',
    indicators: ['Read access to the HALCYON directory at 14:22:10 on 17 AUG'],
    exculpatory: [
      'Access occurred during business hours from the file server, nine hours before the incident window',
      'No badge activity on site after 18:40 on 17 AUG',
    ],
    confidence: 0.15,
    significance: 'low',
    avatarSeed: 'kelsey-nunes',
  },
]

export const ACCOUNTS: Account[] = [
  {
    id: 'ACC-001',
    username: 'morgan.reed',
    displayName: 'Reed, Morgan',
    domain: 'MERIDIAN',
    personId: 'PER-001',
    type: 'domain',
    enabled: false,
    disabledAt: T.accountDisabled,
    lastLogon: T.consoleLogon,
    privileges: ['Research Share (RW)', 'HALCYON Project Group', 'Local Users - DEV-0042'],
    sid: 'S-1-5-21-1844356712-2019447835-1176492001-4471',
  },
  {
    id: 'ACC-002',
    username: 'avery.chen',
    displayName: 'Chen, Avery',
    domain: 'MERIDIAN',
    personId: 'PER-002',
    type: 'admin',
    enabled: true,
    lastLogon: T.rdpSessionStart,
    privileges: ['Domain Admins', 'Remote Desktop Users', 'Backup Operators'],
    sid: 'S-1-5-21-1844356712-2019447835-1176492001-2210',
  },
  {
    id: 'ACC-003',
    username: 'dana.whitfield',
    displayName: 'Whitfield, Dana (Contract)',
    domain: 'MERIDIAN',
    personId: 'PER-003',
    type: 'domain',
    enabled: true,
    lastLogon: T.passwordResetTicket,
    privileges: ['Helpdesk Operators', 'Password Reset - Tier 1', 'IT Tools Share (RX)'],
    sid: 'S-1-5-21-1844356712-2019447835-1176492001-9106',
  },
  {
    id: 'ACC-004',
    username: 'kelsey.nunes',
    displayName: 'Nunes, Kelsey',
    domain: 'MERIDIAN',
    personId: 'PER-004',
    type: 'domain',
    enabled: true,
    lastLogon: T.directorAccess,
    privileges: ['Research Share (RW)', 'HALCYON Project Group', 'Programme Owners'],
    sid: 'S-1-5-21-1844356712-2019447835-1176492001-1032',
  },
  {
    id: 'ACC-005',
    username: 'svc_backup',
    displayName: 'Service - Nightly Backup',
    domain: 'MERIDIAN',
    personId: 'PER-002',
    type: 'service',
    enabled: true,
    lastLogon: T.chenExternalDrive,
    privileges: ['Backup Operators', 'Log on as a service'],
    sid: 'S-1-5-21-1844356712-2019447835-1176492001-5501',
  },
]

export const PERSON_BY_ID = new Map(PERSONS.map((p) => [p.id, p]))
export const ACCOUNT_BY_ID = new Map(ACCOUNTS.map((a) => [a.id, a]))
