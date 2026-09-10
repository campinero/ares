import type { EvidenceSeed } from './evidence'
import { T } from './clock'

/**
 * Log, registry and facility exports.
 *
 * Everything here was either carved from a disk image already in custody or
 * exported from a system disciplined to the domain NTP source. The hostClock
 * flag records which: only records written by DEV-0042 carry the +3m12s drift.
 */
export const EVIDENCE_LOGS: EvidenceSeed[] = [
  {
    id: 'ARES-E-0030',
    label: 'DEV-0042 Security event log',
    category: 'log',
    type: 'Windows event log (Security channel)',
    source: 'DEV-0042 / carved from ARES-E-0001 / winevt\\Logs\\Security.evtx',
    description:
      'Security channel for the subject workstation. Carries the logon, logoff, explicit credential, process creation and removable-media records that bound the incident window.',
    acquiredAt: T.logsAcquired,
    createdAt: T.ntpSyncWarning,
    modifiedAt: T.consoleLogoff,
    accessedAt: T.analysisStart,
    hostClock: true,
    status: 'verified',
    confidence: 0.96,
    significance: 'critical',
    deviceId: 'DEV-0042',
    path: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    sizeBytes: 20_971_520,
    mimeType: 'application/octet-stream',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl; Event Log Readers: Read',
    tags: ['eventlog', 'authentication', 'process', 'host-clock'],
    eventIds: ['EV-007', 'EV-013', 'EV-014', 'EV-016', 'EV-018', 'EV-019', 'EV-021', 'EV-028'],
    content: {
      kind: 'binary',
      format: 'evtx',
      logicalSize: 20_971_520,
      sampleSize: 8192,
      strings: [
        'Microsoft-Windows-Security-Auditing',
        'MD-DEV-0042.meridian.internal',
        '4624 An account was successfully logged on',
        'Logon Type: 2',
        'MERIDIAN\\morgan.reed',
        'S-1-5-21-1844356712-2019447835-1176492001-4471',
        '4634 An account was logged off',
        '4648 A logon was attempted using explicit credentials',
        'C:\\Windows\\System32\\net.exe',
        '4688 A new process has been created',
        '\\\\SRV-CORE-03\\ittools$\\7zip\\7z.exe',
        '6416 A new external device was recognized by the system',
        'USBSTOR\\Disk&Ven_Kingston&Prod_DataTraveler_3.0',
        '60A44C413786E2B1937C2A44',
      ],
    },
    carved: true,
    caveat:
      'The case file carries an 8 KiB chunk of the container. Every record in this log was written by the drifted host clock and reads 3m12s late until normalised.',
  },
  {
    id: 'ARES-E-0031',
    label: 'WKS-0088 USBSTOR registry export',
    category: 'registry',
    type: 'Registry key export (SYSTEM\\CurrentControlSet\\Enum\\USBSTOR)',
    source: 'WKS-0088 / carved from ARES-E-0003 / SYSTEM hive',
    description:
      'Mass-storage enumeration key from the contract technician bench workstation. Holds the first enrolment of the Kingston serial that later mounted on DEV-0042, three weeks before the incident window.',
    acquiredAt: T.imageAcquiredWks0088,
    createdAt: T.usbA1FirstSeen,
    modifiedAt: T.usbA1FirstSeen + 41_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.94,
    significance: 'critical',
    deviceId: 'WKS-0088',
    personId: 'PER-003',
    path: 'C:\\Windows\\System32\\config\\SYSTEM',
    sizeBytes: 61_440,
    mimeType: 'application/octet-stream',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl',
    tags: ['registry', 'usbstor', 'pivot'],
    eventIds: ['EV-001', 'EV-019'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 61_440,
      sampleSize: 4096,
      strings: [
        'ROOT\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR',
        'Disk&Ven_Kingston&Prod_DataTraveler_3.0&Rev_PMAP',
        '60A44C413786E2B1937C2A44',
        'FriendlyName: Kingston DataTraveler 3.0 USB Device',
        'ContainerID: {a41e6c02-7d55-5f18-9a3e-118c4d0b7742}',
        'VID_0951&PID_1666',
        'MountedDevices: \\DosDevices\\F:',
        'WKS-0088',
        'LastWrite: 2026-07-29 10:41:19 -04:00',
      ],
    },
    caveat:
      'Key last-write times reflect the most recent enrolment of each device, not every connection. WKS-0088 was measured in sync with the domain time source at acquisition.',
  },
  {
    id: 'ARES-E-0032',
    label: 'DEV-0042 System event log',
    category: 'log',
    type: 'Windows event log (System channel)',
    source: 'DEV-0042 / carved from ARES-E-0001 / winevt\\Logs\\System.evtx',
    description:
      'System channel for the subject workstation. Carries the time service warning, service and update noise for the preceding week, and the surprise-removal record for the E: volume.',
    acquiredAt: T.logsAcquired,
    createdAt: T.ntpSyncWarning,
    modifiedAt: T.usbRemoved,
    accessedAt: T.analysisStart,
    hostClock: true,
    status: 'verified',
    confidence: 0.94,
    significance: 'high',
    deviceId: 'DEV-0042',
    path: 'C:\\Windows\\System32\\winevt\\Logs\\System.evtx',
    sizeBytes: 15_728_640,
    mimeType: 'application/octet-stream',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl; Event Log Readers: Read',
    tags: ['eventlog', 'removable-media', 'host-clock'],
    eventIds: ['EV-002', 'EV-026'],
    content: {
      kind: 'binary',
      format: 'evtx',
      logicalSize: 15_728_640,
      sampleSize: 8192,
      strings: [
        'Microsoft-Windows-Kernel-PnP',
        'MD-DEV-0042.meridian.internal',
        '225 Surprise removal of volume E:',
        'USBSTOR\\Disk&Ven_Kingston&Prod_DataTraveler_3.0&Rev_PMAP',
        'Safe eject requested: No',
        'Microsoft-Windows-Time-Service',
        '37 The time service is no longer synchronised',
        'Service Control Manager',
        'Microsoft-Windows-WindowsUpdateClient',
        'KB5064118',
        'Ntfs 98 Volume C: is healthy',
      ],
    },
    carved: true,
    caveat:
      'Written by the drifted host clock. The surprise-removal record reads 23:54:11 on the host and 23:50:59 once normalised.',
  },
  {
    id: 'ARES-E-0033',
    label: 'DEV-0042 USBSTOR registry export',
    category: 'registry',
    type: 'Registry key export (SYSTEM\\CurrentControlSet\\Enum\\USBSTOR)',
    source: 'DEV-0042 / carved from ARES-E-0001 / SYSTEM hive',
    description:
      'Mass-storage enumeration key from the subject workstation. Holds both the Kingston serial that mounted inside the incident window and the SanDisk drive registered to the Reed profile six days earlier.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.usbB2LastSeen,
    modifiedAt: T.usbRemoved,
    accessedAt: T.analysisStart,
    hostClock: true,
    status: 'verified',
    confidence: 0.95,
    significance: 'high',
    deviceId: 'DEV-0042',
    path: 'C:\\Windows\\System32\\config\\SYSTEM',
    sizeBytes: 73_728,
    mimeType: 'application/octet-stream',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl',
    tags: ['registry', 'usbstor', 'pivot', 'host-clock'],
    eventIds: ['EV-003', 'EV-019', 'EV-026'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 73_728,
      sampleSize: 4096,
      strings: [
        'ROOT\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR',
        'Disk&Ven_Kingston&Prod_DataTraveler_3.0&Rev_PMAP',
        '60A44C413786E2B1937C2A44',
        'FriendlyName: Kingston DataTraveler 3.0 USB Device',
        'VID_0951&PID_1666',
        'MountedDevices: \\DosDevices\\E:',
        'Disk&Ven_SanDisk&Prod_Cruzer_Blade&Rev_1.00',
        '4C530001180716117025',
        'FriendlyName: SanDisk Cruzer Blade USB Device',
        'VID_0781&PID_5567',
        'VolumeLabel: MREED',
        'VolumeLabel: FIELDKIT',
        'DiskId: {a47c91de-3f02-4d6b-9c11-6e2f5b8a0d47}',
      ],
    },
    caveat:
      'Key last-write times reflect the most recent enrolment of each device, not every connection. Values here read 3m12s late until normalised.',
  },
  {
    id: 'ARES-E-0034',
    label: 'WKS-0031 USBSTOR registry export',
    category: 'registry',
    type: 'Registry key export (SYSTEM\\CurrentControlSet\\Enum\\USBSTOR)',
    source: 'WKS-0031 / live registry export under change CHG-8871',
    description:
      'Mass-storage enumeration key from the platform operations workstation, taken to test the alternative transfer path raised by the initial DLP sweep. Records a 2 TB Seagate volume mounted the same evening.',
    acquiredAt: T.logsAcquired,
    createdAt: T.chenExternalDrive,
    modifiedAt: T.chenExternalDrive + 118_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'analyzed',
    confidence: 0.88,
    significance: 'moderate',
    deviceId: 'WKS-0031',
    personId: 'PER-002',
    accountId: 'ACC-002',
    path: 'C:\\Windows\\System32\\config\\SYSTEM',
    sizeBytes: 57_344,
    mimeType: 'application/octet-stream',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl',
    tags: ['registry', 'usbstor', 'alternative-path'],
    eventIds: ['EV-008'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 57_344,
      sampleSize: 4096,
      strings: [
        'ROOT\\SYSTEM\\CurrentControlSet\\Enum\\USBSTOR',
        'Disk&Ven_Seagate&Prod_Backup+_Portable&Rev_0304',
        'NA9K2R7C',
        'FriendlyName: Seagate Backup Plus Portable 2TB',
        'VID_0BC2&PID_AB44',
        'MountedDevices: \\DosDevices\\G:',
        'VolumeLabel: AC-BACKUP',
        'Filesystem: NTFS',
        'WKS-0031',
        'LastWrite: 2026-08-17 21:03:26 -04:00',
      ],
    },
    caveat:
      'The Kingston serial recorded on DEV-0042 does not appear in this hive. This export neither places nor excludes the drive as a transfer medium for other material.',
  },
  {
    id: 'ARES-E-0035',
    label: 'DEV-0042 time service drift record',
    category: 'log',
    type: 'System log excerpt (W32Time event 37)',
    source: 'DEV-0042 / carved from ARES-E-0001 / System.evtx record 88214',
    description:
      'The record that establishes the workstation clock offset. Every host-written timestamp in the case file is normalised against the measured +192 s value; without it the DEV-0042 sequence cannot be aligned with the proxy, VPN, badge and directory records.',
    acquiredAt: T.logsAcquired,
    createdAt: T.ntpSyncWarning,
    modifiedAt: T.ntpSyncWarning,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.99,
    significance: 'critical',
    deviceId: 'DEV-0042',
    path: 'C:\\Windows\\System32\\winevt\\Logs\\System.evtx',
    sizeBytes: 1_184,
    mimeType: 'text/plain',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'read-only (analyst extract)',
    tags: ['clock', 'normalisation', 'w32time'],
    eventIds: ['EV-002'],
    content: {
      kind: 'text',
      text: `Log Name:      System
Source:        Microsoft-Windows-Time-Service
Event ID:      37
Level:         Warning
Computer:      MD-DEV-0042.meridian.internal
Logged:        2026-08-11 03:14:56 -04:00 (host clock)

Description:
The time provider NtpClient is currently receiving valid time data from
ntp.meridian-dynamics.internal (ntp.m [10.20.2.9:123]), but the local clock
offset exceeds MaxAllowedPhaseOffset. No correction was applied and the
service has stopped disciplining the local clock.

  MeasuredOffset  : +192.000 s (local clock ahead of reference)
  MaxAllowedPhase : 45 s
  SyncState       : Unsynchronised
  LastGoodSync    : 2026-08-04 02:58:11 -04:00

--- Examiner note, C. Vasquez, 19 AUG 2026 ---
Offset re-measured at acquisition against the same reference: +192 s, unchanged.
Records written by this host are stored normalised in the case file. Selecting
the host basis re-applies +3m12s to every hostClock artifact and event.`,
    },
    caveat:
      'Analyst extract rather than a carved container. The originating System.evtx (ARES-E-0032) is held separately and its digest covers the full record.',
  },
  {
    id: 'ARES-E-0042',
    label: 'Forward proxy access log export',
    category: 'network',
    type: 'Proxy access log (extended common log format)',
    source: 'FW-EDGE-01 / Meridian Edge Proxy 9.4 / access.log rotation 2026-08-17',
    description:
      'Egress record for the incident window. Shows the browse to the transfer service succeeding and the subsequent tunnel attempts being denied by policy, with the byte counts that bound how much data could have left the estate.',
    acquiredAt: T.logsAcquired,
    createdAt: T.browserSession - 60_000,
    modifiedAt: T.proxyBlocked + 19_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.96,
    significance: 'critical',
    deviceId: 'FW-EDGE-01',
    accountId: 'ACC-001',
    path: '/var/log/meridian-proxy/access.log.2026-08-17',
    sizeBytes: 2_048,
    mimeType: 'text/plain',
    owner: 'proxy:adm',
    permissions: '0640 proxy:adm',
    tags: ['proxy', 'egress', 'blocked', 'ntp-disciplined'],
    eventIds: ['EV-025'],
    content: {
      kind: 'text',
      text: `# Meridian Edge Proxy 9.4 - access.log
# fields: client - user [time] "request" status bytes_out bytes_in ms "referrer" action policy
10.20.4.88 - MERIDIAN\\dana.whitfield [17/Aug/2026:23:12:44 -0400] "CONNECT telemetry.northgate-msp.example:443 HTTP/1.1" 200 3104 9822 412 "-" ALLOWED contractor-tooling
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:41:12 -0400] "GET http://update.meridian-dynamics.internal/wsus/selfupdate HTTP/1.1" 304 812 402 55 "-" ALLOWED internal-bypass
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:47:47 -0400] "GET https://search.orbitsearch.example/search?q=large+file+transfer+no+signup HTTP/1.1" 200 1944 61208 288 "-" ALLOWED search-engines
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:48:01 -0400] "GET https://vaultbridge-share.io/ HTTP/1.1" 200 1622 48310 341 "https://search.orbitsearch.example/" ALLOWED uncategorised-read
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:48:32 -0400] "GET https://vaultbridge-share.io/upload HTTP/1.1" 200 1708 39204 296 "https://vaultbridge-share.io/" ALLOWED uncategorised-read
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:49:44 -0400] "POST https://vaultbridge-share.io/upload/session HTTP/1.1" 200 2210 918 174 "https://vaultbridge-share.io/upload" ALLOWED uncategorised-read
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:49:50 -0400] "CONNECT cdn-sync.vaultbridge-share.io:443 HTTP/1.1" 403 8214 1196 2470 "https://vaultbridge-share.io/upload" BLOCKED EGRESS-114 cloud-storage-uncategorised
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:49:57 -0400] "CONNECT cdn-sync.vaultbridge-share.io:443 HTTP/1.1" 403 4102 612 1180 "https://vaultbridge-share.io/upload" BLOCKED EGRESS-114 cloud-storage-uncategorised
10.20.7.42 - MERIDIAN\\morgan.reed [17/Aug/2026:23:50:09 -0400] "CONNECT cdn-sync.vaultbridge-share.io:443 HTTP/1.1" 403 2988 588 940 "https://vaultbridge-share.io/upload" BLOCKED EGRESS-114 cloud-storage-uncategorised
10.20.9.117 - MERIDIAN\\morgan.reed [17/Aug/2026:23:52:18 -0400] "CONNECT mail.meridian-dynamics.internal:443 HTTP/1.1" 200 214016 1884160 62400 "-" ALLOWED internal-mail
# rotation closed 2026-08-18 00:00:00 -0400 - 15304 bytes total egress to 203.0.113.47, no session completed`,
    },
    caveat:
      'Written by an NTP-disciplined appliance, so these times need no normalisation. The byte counts are proxy-side accounting for the denied tunnels and cover handshake traffic only.',
  },
  {
    id: 'ARES-E-0043',
    label: 'DNS resolver query log',
    category: 'network',
    type: 'Recursive resolver query log',
    source: 'MD-DNS-02 / meridian internal resolver / query.log 2026-08-17',
    description:
      'Name resolution for the incident window. Records the first internal resolution of the transfer service and its content delivery host, alongside routine internal lookups from the same client.',
    acquiredAt: T.logsAcquired,
    createdAt: T.browserSession - 90_000,
    modifiedAt: T.proxyBlocked + 19_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.93,
    significance: 'high',
    accountId: 'ACC-001',
    path: '/var/log/named/query.log.2026-08-17',
    sizeBytes: 1_536,
    mimeType: 'text/plain',
    owner: 'named:named',
    permissions: '0640 named:named',
    tags: ['dns', 'resolution', 'ntp-disciplined'],
    eventIds: ['EV-024', 'EV-025'],
    content: {
      kind: 'text',
      text: `# meridian recursive resolver - query.log (client, qname, qtype, rcode, answer, tag)
17-Aug-2026 23:12:41.882 client 10.20.4.88#51204 telemetry.northgate-msp.example A NOERROR 198.51.100.22 known-vendor
17-Aug-2026 23:41:09.117 client 10.20.7.42#49318 update.meridian-dynamics.internal A NOERROR 10.20.2.44 internal-zone
17-Aug-2026 23:42:02.441 client 10.20.7.42#49402 srv-core-03.meridian.internal A NOERROR 10.20.2.13 internal-zone
17-Aug-2026 23:47:45.209 client 10.20.7.42#49771 search.orbitsearch.example A NOERROR 198.51.100.61 external-known
17-Aug-2026 23:47:59.664 client 10.20.7.42#49802 vaultbridge-share.io A NOERROR 203.0.113.47 newly-observed-domain
17-Aug-2026 23:48:00.118 client 10.20.7.42#49803 vaultbridge-share.io AAAA NOERROR - newly-observed-domain
17-Aug-2026 23:49:41.905 client 10.20.7.42#49918 cdn-sync.vaultbridge-share.io A NOERROR 203.0.113.47 newly-observed-domain
17-Aug-2026 23:49:56.330 client 10.20.7.42#49931 cdn-sync.vaultbridge-share.io A NOERROR 203.0.113.47 cached-ttl-284
17-Aug-2026 23:50:08.774 client 10.20.7.42#49944 cdn-sync.vaultbridge-share.io A NOERROR 203.0.113.47 cached-ttl-271
17-Aug-2026 23:52:16.028 client 10.20.9.117#38210 mail.meridian-dynamics.internal A NOERROR 10.20.2.35 internal-zone
# first observation of vaultbridge-share.io in this zone: 17-Aug-2026 23:47:59.664`,
    },
    caveat:
      'Resolution proves a name was looked up from a client address, not that a transfer took place. Pair with the proxy export before drawing any conclusion about payload.',
  },
  {
    id: 'ARES-E-0044',
    label: 'VPN concentrator session log',
    category: 'network',
    type: 'Remote access session log export',
    source: 'MD-VPN-CONC-01 / Meridian VPN Concentrator 4.8 / session audit',
    description:
      'Remote access session for the Reed account from a residential ISP allocation, established thirty-six seconds after the same account logged on at the DEV-0042 physical console.',
    acquiredAt: T.logsAcquired,
    createdAt: T.vpnConnect,
    modifiedAt: T.vpnConnect + 3_542_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.94,
    significance: 'critical',
    deviceId: 'LAP-0117',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: '/var/log/vpn/session-audit-2026-08-17.log',
    sizeBytes: 1_408,
    mimeType: 'text/plain',
    owner: 'vpnadm:vpnadm',
    permissions: '0640 vpnadm:vpnadm',
    tags: ['vpn', 'remote-access', 'alibi', 'ntp-disciplined'],
    eventIds: ['EV-017'],
    content: {
      kind: 'text',
      text: `Meridian VPN Concentrator 4.8 - session audit export
Generated 2026-08-18 15:20:00 -0400 by C. Vasquez, case ARES-2026-0817

2026-08-17 23:38:26 -0400  113019  SESSION-START   user=morgan.reed
    client         = MD-LAP-0117 (AnyConnect 5.1.2.42, Windows 11 26100)
    peer-address   = 74.83.112.19
    peer-rdns      = cpe-74-83-112-19.res.example-isp.net
    assigned-ip    = 100.64.12.31
    group-policy   = MERIDIAN-STAFF-SPLIT
    auth           = machine-certificate + password, MFA push accepted 23:38:24
    posture        = compliant (disk encrypted, agent 4.2.1)
2026-08-17 23:40:02 -0400  113022  TUNNEL-TRAFFIC  user=morgan.reed dst=mail.meridian-dynamics.internal:443
2026-08-17 23:51:44 -0400  113022  TUNNEL-TRAFFIC  user=morgan.reed dst=payroll.meridian-dynamics.example:443
2026-08-18 00:37:28 -0400  113025  SESSION-END     user=morgan.reed duration=00:59:02 bytes-out=9461760 bytes-in=24117248
    disconnect-reason = client-initiated

Note: no split-tunnel exclusion applies to 203.0.113.47; no traffic to that host
traversed this tunnel during the session.`,
    },
    caveat:
      'The concentrator authenticates a credential and a device, not a person. It does establish that LAP-0117 held a live session from a residential address while the console session on DEV-0042 was open.',
  },
  {
    id: 'ARES-E-0045',
    label: 'SRV-CORE-03 file server audit export',
    category: 'log',
    type: 'Windows object access audit export (event 4663)',
    source: 'SRV-CORE-03 / Security channel / object access auditing on research$ and ittools$',
    description:
      'Share-side object access record. Covers the daytime read of the HALCYON directory, the out-of-hours read burst against the same nine files, and the fetch of the archiver binary from the IT tools share.',
    acquiredAt: T.logsAcquired,
    createdAt: T.directorAccess,
    modifiedAt: T.archiverLaunched + 4_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.92,
    significance: 'critical',
    deviceId: 'SRV-CORE-03',
    path: 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx',
    sizeBytes: 3_072,
    mimeType: 'text/plain',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl',
    tags: ['fileserver', 'object-access', 'halcyon', 'ntp-disciplined'],
    eventIds: ['EV-005', 'EV-020'],
    content: {
      kind: 'text',
      text: `MD-SRV-CORE-03 - event 4663 export, 2026-08-17 (times NTP disciplined)
fields: time | subject | client | object | access mask

14:22:10 | MERIDIAN\\kelsey.nunes | 10.20.6.19 | research$\\HALCYON\\halcyon_cell_matrix_v7.xlsx | 0x81
14:22:10 | MERIDIAN\\kelsey.nunes | 10.20.6.19 | research$\\HALCYON\\electrolyte_formulation_rev12.docx | 0x81
14:22:11 | MERIDIAN\\kelsey.nunes | 10.20.6.19 | research$\\HALCYON (7 further objects, mask 0x81) | 0x81

23:42:04 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\halcyon_cell_matrix_v7.xlsx | 0x89
23:42:05 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\electrolyte_formulation_rev12.docx | 0x89
23:42:06 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\test_bench_log_0812.csv | 0x89
23:42:07 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\patent_draft_HAL-118.docx | 0x89
23:42:09 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\spectra_scan_0731.png | 0x89
23:42:10 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\thermal_runaway_series_0805.csv | 0x89
23:42:12 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\cathode_batch_manifest.xlsx | 0x89
23:42:13 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\HALCYON_readme.txt | 0x89
23:42:15 | MERIDIAN\\morgan.reed | 10.20.7.42 | research$\\HALCYON\\cycle_life_projection.xlsx | 0x89

23:42:57 | MERIDIAN\\morgan.reed | 10.20.7.42 | ittools$\\7zip\\7z.exe | 0x20 (Execute)
23:42:57 | MERIDIAN\\morgan.reed | 10.20.7.42 | ittools$\\7zip\\7z.dll | 0x20 (Execute)

Summary: 9 objects, 402.6 MiB, read burst spanning 11 s. The ittools$ share is
mapped read-execute for Helpdesk Operators and read-only for all other staff.`,
    },
    caveat:
      'Object access auditing records the account token presented to the share, not the operator at the keyboard.',
  },
  {
    id: 'ARES-E-0046',
    label: 'RDP session log export',
    category: 'log',
    type: 'Terminal services session log export',
    source: 'DEV-0042 / TerminalServices-LocalSessionManager and RemoteConnectionManager',
    description:
      'Remote desktop session detail for the approved patch window. Establishes the start, end and source of the administrative session that precedes the incident window.',
    acquiredAt: T.logsAcquired,
    createdAt: T.rdpSessionStart,
    modifiedAt: T.rdpSessionEnd,
    accessedAt: T.analysisStart,
    hostClock: true,
    status: 'verified',
    confidence: 0.91,
    significance: 'high',
    deviceId: 'DEV-0042',
    personId: 'PER-002',
    accountId: 'ACC-002',
    path: 'C:\\Windows\\System32\\winevt\\Logs\\Microsoft-Windows-TerminalServices-LocalSessionManager%2FOperational.evtx',
    sizeBytes: 2_560,
    mimeType: 'text/plain',
    owner: 'NT AUTHORITY\\SYSTEM',
    permissions: 'SYSTEM: FullControl; Administrators: FullControl',
    tags: ['rdp', 'change-window', 'host-clock', 'exculpatory'],
    eventIds: ['EV-013', 'EV-014'],
    content: {
      kind: 'text',
      text: `MD-DEV-0042 - terminal services session export (host clock, +192 s fast)
normalised times shown in the right-hand column

host      normalised  event  detail
23:15:19  23:12:07    1149   RemoteConnectionManager: user authentication succeeded
                             user  = MERIDIAN\\avery.chen
                             source = 10.20.4.31 (MD-WKS-0031)
23:15:19  23:12:07    21     LocalSessionManager: session logon succeeded, session 2
23:15:20  23:12:08    4624   logon type 10 (RemoteInteractive), package Kerberos, id 0x41C7A2
23:15:21  23:12:09    4672   special privileges assigned (SeBackup, SeDebug, SeLoadDriver)
23:32:52  23:29:40    24     LocalSessionManager: session disconnected, session 2
23:32:52  23:29:40    4634   logoff, logon id 0x41C7A2, duration 17m 33s

Change record CHG-8871: "August cumulative update, DEV-0042 and 14 peers,
window 23:00-01:00, approved by K. Nunes 15 AUG". Session times fall inside it.

Next interactive logon on this host: session 3, logon type 2, 23:37:50
normalised - 8m 10s after this session closed. The sessions do not overlap.`,
    },
    caveat:
      'Written by the drifted host clock. Both columns are carried so the session can be compared with the NTP-disciplined records without recomputation.',
  },
  {
    id: 'ARES-E-0060',
    label: 'Facility access control export',
    category: 'facility',
    type: 'Badge reader event export',
    source: 'HQ-ACS-01 / Meridian Access Control 6.1 / reader history 17 AUG 2026',
    description:
      'Badge reader history for the evening of 17 AUG. Independent of every domain-joined system and disciplined to the building time source, so it anchors physical presence against the host record.',
    acquiredAt: T.logsAcquired,
    createdAt: T.reedBadgeExit,
    modifiedAt: T.whitfieldBadgeExit,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.95,
    significance: 'critical',
    path: '/exports/acs/reader-history-2026-08-17.csv',
    sizeBytes: 1_792,
    mimeType: 'text/plain',
    owner: 'Facilities Security',
    permissions: 'read-only (export, watermarked)',
    tags: ['facility', 'badge', 'presence', 'ntp-disciplined'],
    eventIds: ['EV-010', 'EV-015', 'EV-029'],
    content: {
      kind: 'text',
      text: `Meridian Access Control 6.1 - reader history export
site HQ, 2026-08-17 18:00 to 2026-08-18 01:00, times from the building master clock

time      reader            dir  badge     holder                      decision
18:41:55  LOBBY-TURN-01     out  BDG-1032  Nunes, Kelsey               GRANTED
20:12:30  LOADING-DOCK-01   in   BDG-2210  Chen, Avery                 GRANTED
21:02:44  STAIR-F2-S        in   BDG-2210  Chen, Avery                 GRANTED
22:14:09  LOBBY-TURN-02     out  BDG-4471  Reed, Morgan                GRANTED
22:47:31  LOBBY-TURN-01     in   BDG-9106  Whitfield, Dana (Contract)  GRANTED
23:33:41  STAIR-F4-N        in   BDG-9106  Whitfield, Dana (Contract)  GRANTED
23:41:58  LOBBY-TURN-02     out  BDG-2210  Chen, Avery                 GRANTED
23:59:07  STAIR-F4-N        out  BDG-9106  Whitfield, Dana (Contract)  GRANTED
00:04:22  LOBBY-TURN-02     out  BDG-9106  Whitfield, Dana (Contract)  GRANTED

Anti-passback: enabled on lobby turnstiles, disabled on stairwell readers.
No read for BDG-4471 after 22:14:09 on any reader for the remainder of 17 AUG.
Floor 4 badge holders present between 23:30 and 24:00: BDG-9106 only.`,
    },
    caveat:
      'A badge read records a credential at a reader. It places a card, not a person, and stairwell readers are not anti-passback enforced.',
  },
  {
    id: 'ARES-E-0061',
    label: 'Active Directory change log export',
    category: 'log',
    type: 'Directory service change log export',
    source: 'MD-DC-01 / directory service auditing / change log extract',
    description:
      'Directory-side account changes for the Reed account: the tier-1 password reset processed under helpdesk ticket HD-44192 and the scheduled offboarding disable the following morning.',
    acquiredAt: T.logsAcquired,
    createdAt: T.passwordResetTicket,
    modifiedAt: T.accountDisabled,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.95,
    significance: 'critical',
    accountId: 'ACC-001',
    path: '/exports/ad/change-log-ARES-2026-0817.txt',
    sizeBytes: 1_664,
    mimeType: 'text/plain',
    owner: 'Identity Operations',
    permissions: 'read-only (export)',
    tags: ['active-directory', 'account', 'password-reset', 'ntp-disciplined'],
    eventIds: ['EV-006', 'EV-030'],
    content: {
      kind: 'text',
      text: `MD-DC-01 - directory change log extract for CN=Reed\\ Morgan,OU=Research,DC=meridian,DC=internal

2026-08-17 17:02:41 -0400  event 4724  ATTEMPT TO RESET PASSWORD
  subject          : MERIDIAN\\dana.whitfield (S-1-5-21-...-9106)
  target           : MERIDIAN\\morgan.reed (S-1-5-21-...-4471)
  privilege        : Helpdesk Operators - Password Reset Tier 1
  result           : SUCCESS
  pwdLastSet       : 2026-06-02 08:11:04 -> 2026-08-17 17:02:41
  userAccountControl: unchanged (0x210 NORMAL_ACCOUNT | DONT_EXPIRE_PASSWORD)
  force change at next logon : NOT SET
  correlating ticket         : HD-44192

2026-08-17 17:02:41 -0400  event 4738  USER ACCOUNT WAS CHANGED
  changed attributes : pwdLastSet, badPwdCount(reset)

2026-08-18 09:12:00 -0400  event 4725  USER ACCOUNT WAS DISABLED
  subject           : MERIDIAN\\svc_identity (automated)
  target            : MERIDIAN\\morgan.reed
  userAccountControl: 0x210 -> 0x212 (ACCOUNTDISABLE set)
  workflow          : HR-2026-0431 offboarding

No further password or group membership change is recorded for this account.
A tier-1 reset sets a temporary value that is disclosed to the requester and,
with the force-change flag unset, remains usable until the holder changes it.`,
    },
    caveat:
      'The directory records the operator account that performed each change. It does not record who received or retained the temporary value.',
  },
  {
    id: 'ARES-E-0062',
    label: 'DLP correlation alert record',
    category: 'log',
    type: 'Detection engine alert record',
    source: 'Meridian DLP correlation engine / alert 2026-0817-114',
    description:
      'The alert that opened the case. Correlates the out-of-hours archive, the write to a removable volume and the denied upload attempt into a single scored finding.',
    acquiredAt: T.logsAcquired,
    createdAt: T.dlpAlert,
    modifiedAt: T.caseOpened,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'analyzed',
    confidence: 0.85,
    significance: 'high',
    deviceId: 'DEV-0042',
    accountId: 'ACC-001',
    path: '/exports/dlp/alert-2026-0817-114.json',
    sizeBytes: 1_920,
    mimeType: 'application/json',
    owner: 'Security Operations',
    permissions: 'read-only (export)',
    tags: ['dlp', 'correlation', 'alert', 'triage'],
    eventIds: ['EV-031'],
    content: {
      kind: 'text',
      text: `{
  "alert_id": "2026-0817-114",
  "raised_at": "2026-08-18T09:48:00-04:00",
  "rule": "EXF-0042",
  "rule_name": "out-of-hours bulk archive to removable media",
  "score": 91,
  "severity": "critical",
  "status": "escalated",
  "case_ref": "ARES-2026-0817",
  "subject": {
    "account": "MERIDIAN\\morgan.reed",
    "host": "MD-DEV-0042",
    "host_clock_offset_s": 192
  },
  "signals": [
    { "id": "S1", "weight": 34, "detail": "archive 412338112 bytes written to %TEMP% outside 07:00-20:00" },
    { "id": "S2", "weight": 28, "detail": "same object referenced on removable volume E: within 75 s" },
    { "id": "S3", "weight": 19, "detail": "CONNECT to uncategorised cloud storage denied by EGRESS-114" },
    { "id": "S4", "weight": 10, "detail": "archiver executed from a share not installed on the host" }
  ],
  "suppressed_signals": [
    { "id": "X1", "detail": "concurrent VPN session for the same account from 74.83.112.19" },
    { "id": "X2", "detail": "no badge read for BDG-4471 after 22:14:09" }
  ],
  "analyst_note": "Score is driven by account attribution. The two suppressed signals are inconsistent with a single operator and were not weighted by the rule; both require manual review before the account is treated as the actor.",
  "triage": { "assigned_to": "C. Vasquez", "opened_case_at": "2026-08-18T10:40:00-04:00" }
}`,
    },
    caveat:
      'A correlation score ranks a combination of signals against a rule. It is a triage priority, not a finding, and the engine discarded two contradicting signals by design.',
  },
]
