import type { CustodyAction, CustodyEvent, EvidenceId } from './types'
import { T } from './clock'

/**
 * Chain of custody shipped with the case file.
 *
 * Every disk image carries the full sequence an examiner would expect to see:
 * acquisition behind a write blocker, an independent digest verification, a
 * two-person transfer to the locker, a seal, then the analysis passes that
 * touched it. Derived artifacts inherit the custody of the image they were
 * carved from and carry their own analysis entries.
 *
 * `hashVerified` is recorded truthfully. Exactly one entry is false, and its
 * note says why.
 */

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

const VASQUEZ = 'C. Vasquez, GCFA'
const OKAFOR = 'M. Okafor, Evidence Technician'
const OKONKWO = 'R. Okonkwo, Head of Investigations'
const LOCKER = 'Evidence Locker A'

const M_ACQUIRE = 'Tableau T35u write blocker / dd'
const M_EXPORT = 'Logical export via forensic collector, digest written on read'
const M_DIGEST = 'SHA-256 recomputed and compared against the acquisition manifest'
const M_CARRY = 'Hand carry, two-person integrity, sealed antistatic bag ES-04412'
const M_SEAL = 'Sealed antistatic bag ES-04412'
const M_MOUNT = 'Read-only mount, no writes to source'
const M_CARVE = 'Read-only carve from the parent image, digest on write'
const M_DESK = 'Desk review of the case file record, no handling of the physical item'

/** Terse constructor - custody rows are uniform apart from the narrative note. */
const ev = (
  id: string,
  evidenceId: EvidenceId,
  at: number,
  action: CustodyAction,
  custodian: string,
  method: string,
  note: string,
  rest: Partial<CustodyEvent> = {},
): CustodyEvent => ({
  id,
  evidenceId,
  at,
  action,
  custodian,
  method,
  note,
  hashVerified: true,
  builtIn: true,
  ...rest,
})

export const CUSTODY_EVENTS: CustodyEvent[] = [
  /* ------------------------------------------- ARES-E-0001 DEV-0042 image */
  ev('CUS-001', 'ARES-E-0001', T.imageAcquiredDev0042, 'ACQUIRED', VASQUEZ, M_ACQUIRE,
    'Workstation powered down at the desk and the system volume acquired behind a hardware write blocker. Acquisition digest written to the manifest at completion.',
    { from: 'DEV-0042, desk 4-118', to: 'Imaging station 2' }),
  ev('CUS-002', 'ARES-E-0001', T.imageAcquiredDev0042 + 18 * MIN, 'VERIFIED', OKAFOR, M_DIGEST,
    'Independent verification pass by a second examiner. Recomputed SHA-256 matches the acquisition manifest.'),
  ev('CUS-003', 'ARES-E-0001', T.imageAcquiredDev0042 + 2 * HOUR, 'TRANSFERRED', OKAFOR, M_CARRY,
    'Image drive and the signed acquisition sheet moved to the locker. Digest confirmed against the manifest at handover.',
    { from: 'Imaging station 2', to: LOCKER }),
  ev('CUS-004', 'ARES-E-0001', T.imageAcquiredDev0042 + 2 * HOUR + 14 * MIN, 'SEALED', LOCKER, M_SEAL,
    'Tamper-evident seal ES-04412 applied and logged. Locker record carries the verified digest.',
    { to: LOCKER }),
  ev('CUS-005', 'ARES-E-0001', T.analysisStart, 'ANALYZED', VASQUEZ, M_MOUNT,
    'First examination pass. Volume mounted read-only, filesystem tree and MFT extracted. Source digest unchanged on dismount.'),
  ev('CUS-006', 'ARES-E-0001', T.analysisStart + 1 * DAY + 2 * HOUR, 'ANALYZED', VASQUEZ, M_MOUNT,
    'Second pass targeting unallocated space and the recycle bin. Source digest unchanged on dismount.'),
  ev('CUS-007', 'ARES-E-0001', T.interimReview, 'NOTE', OKONKWO, M_DESK,
    'Interim review. Acquisition provenance and seal record accepted; item remains sealed and available for re-examination.'),

  /* ------------------------------------------- ARES-E-0002 LAP-0117 image */
  ev('CUS-008', 'ARES-E-0002', T.imageAcquiredLap0117, 'ACQUIRED', VASQUEZ, M_ACQUIRE,
    'Corporate laptop collected from the offboarding queue and acquired behind a hardware write blocker.',
    { from: 'LAP-0117, IT offboarding queue', to: 'Imaging station 2' }),
  ev('CUS-009', 'ARES-E-0002', T.imageAcquiredLap0117 + 22 * MIN, 'VERIFIED', OKAFOR, M_DIGEST,
    'Independent verification pass. Recomputed SHA-256 matches the acquisition manifest.'),
  ev('CUS-010', 'ARES-E-0002', T.imageAcquiredLap0117 + 1 * HOUR + 50 * MIN, 'TRANSFERRED', OKAFOR, M_CARRY,
    'Moved to the locker with the acquisition sheet. Digest confirmed at handover.',
    { from: 'Imaging station 2', to: LOCKER }),
  ev('CUS-011', 'ARES-E-0002', T.imageAcquiredLap0117 + 2 * HOUR, 'SEALED', LOCKER, M_SEAL,
    'Sealed and logged. Locker record carries the verified digest.', { to: LOCKER }),
  ev('CUS-012', 'ARES-E-0002', T.analysisStart + 3 * HOUR, 'ANALYZED', VASQUEZ, M_MOUNT,
    'VPN client profile and connection cache extracted to corroborate the concentrator record. Source digest unchanged on dismount.'),

  /* ------------------------------------------- ARES-E-0003 WKS-0088 image */
  ev('CUS-013', 'ARES-E-0003', T.imageAcquiredWks0088, 'ACQUIRED', VASQUEZ, M_ACQUIRE,
    'Contract technician bench workstation acquired behind a hardware write blocker after the USB serial correlation was raised.',
    { from: 'WKS-0088, deskside bench 2-04', to: 'Imaging station 1' }),
  ev('CUS-014', 'ARES-E-0003', T.imageAcquiredWks0088 + 26 * MIN, 'VERIFIED', OKAFOR, M_DIGEST,
    'Independent verification pass. Recomputed SHA-256 matches the acquisition manifest.'),
  ev('CUS-015', 'ARES-E-0003', T.imageAcquiredWks0088 + 3 * HOUR, 'TRANSFERRED', OKAFOR, M_CARRY,
    'Moved to the locker with the acquisition sheet. Digest confirmed at handover.',
    { from: 'Imaging station 1', to: LOCKER }),
  ev('CUS-016', 'ARES-E-0003', T.imageAcquiredWks0088 + 3 * HOUR + 12 * MIN, 'SEALED', LOCKER, M_SEAL,
    'Sealed and logged. Locker record carries the verified digest.', { to: LOCKER }),
  ev('CUS-017', 'ARES-E-0003', T.analysisStart + 1 * DAY + 4 * HOUR, 'ANALYZED', VASQUEZ, M_MOUNT,
    'USBSTOR and device enumeration keys extracted from the registry hives. Source digest unchanged on dismount.'),
  ev('CUS-018', 'ARES-E-0003', T.analysisStart + 1 * DAY + 5 * HOUR, 'NOTE', VASQUEZ, M_DESK,
    'Acquisition of this machine was requested after the serial correlation surfaced, so it postdates the other images by a day. Sequence noted for the record.'),

  /* ---------------------------------------------- ARES-E-0004 USB-B2 image */
  ev('CUS-019', 'ARES-E-0004', T.usbB2Surrendered, 'ACQUIRED', VASQUEZ, M_ACQUIRE,
    'Personal drive voluntarily surrendered and imaged in the presence of the owner and a witness from People Operations.',
    { from: 'Voluntary surrender, interview room 1', to: 'Imaging station 1' }),
  ev('CUS-020', 'ARES-E-0004', T.usbB2Surrendered + 34 * MIN, 'VERIFIED', OKAFOR, M_DIGEST,
    'Independent verification pass. Recomputed SHA-256 matches the acquisition manifest.'),
  ev('CUS-021', 'ARES-E-0004', T.usbB2Surrendered + 2 * HOUR, 'TRANSFERRED', OKAFOR, M_CARRY,
    'Drive and image moved to the locker. Digest confirmed at handover.',
    { from: 'Imaging station 1', to: LOCKER }),
  ev('CUS-022', 'ARES-E-0004', T.usbB2Surrendered + 2 * HOUR + 10 * MIN, 'SEALED', LOCKER, M_SEAL,
    'Sealed and logged. The physical drive is retained pending the outcome of the case.', { to: LOCKER }),
  ev('CUS-023', 'ARES-E-0004', T.usbB2Surrendered + 5 * HOUR, 'ANALYZED', VASQUEZ, M_MOUNT,
    'Full examination including carve of deleted content. No HALCYON material located. Source digest unchanged on dismount.'),
  ev('CUS-024', 'ARES-E-0004', T.interimReview - 4 * HOUR, 'NOTE', OKONKWO, M_DESK,
    'Negative finding accepted for the interim review. Absence of material on this drive says nothing about media that was never produced.'),

  /* ------------------------------------ ARES-E-0030 DEV-0042 Security log */
  ev('CUS-025', 'ARES-E-0030', T.logsAcquired, 'ACQUIRED', VASQUEZ, M_EXPORT,
    'Security channel exported from the mounted image rather than from the live host, so the export cannot have altered the source.',
    { from: 'ARES-E-0001 (mounted read-only)', to: 'Case working set' }),
  ev('CUS-026', 'ARES-E-0030', T.logsAcquired + 12 * MIN, 'VERIFIED', OKAFOR, M_DIGEST,
    'Export digest recomputed and matched. Record count reconciled with the channel header.'),
  ev('CUS-027', 'ARES-E-0030', T.logsAcquired + 40 * MIN, 'TRANSFERRED', OKAFOR, M_CARRY,
    'Working copy written to the case store; the source image returned to the locker. Digest confirmed at handover.',
    { from: 'Imaging station 2', to: LOCKER }),
  ev('CUS-028', 'ARES-E-0030', T.logsAcquired + 50 * MIN, 'SEALED', LOCKER, M_SEAL,
    'Export sealed alongside the parent image. Locker record carries the verified digest.', { to: LOCKER }),
  ev('CUS-029', 'ARES-E-0030', T.analysisStart + 45 * MIN, 'ANALYZED', VASQUEZ, M_DESK,
    'Logon, logoff, explicit credential, process creation and removable-media records extracted and normalised against the documented host drift.'),
  ev('CUS-030', 'ARES-E-0010', T.analysisStart + 2 * HOUR, 'ANALYZED', VASQUEZ, M_CARVE,
    'Container header and central directory carved from the parent image. Entry names recorded against the file server audit list.'),
  ev('CUS-031', 'ARES-E-0011', T.analysisStart + 2 * HOUR + 25 * MIN, 'NOTE', VASQUEZ, M_DESK,
    'Reconstructed artifact only. The physical volume was never recovered, so no acquisition entry exists and none should be created.'),
  ev('CUS-032', 'ARES-E-0023', T.analysisStart + 3 * HOUR, 'ANALYZED', VASQUEZ, M_CARVE,
    'Shell link parsed; target path, volume serial and volume label transcribed into the case record.'),
  ev('CUS-033', 'ARES-E-0031', T.imageAcquiredWks0088 + 3 * HOUR, 'ACQUIRED', OKAFOR, M_EXPORT,
    'USBSTOR subtree exported from the mounted support workstation image.',
    { from: 'ARES-E-0003 (mounted read-only)', to: 'Case working set' }),
  ev('CUS-034', 'ARES-E-0031', T.imageAcquiredWks0088 + 4 * HOUR, 'VERIFIED', VASQUEZ, M_DIGEST,
    'Export digest matched. Device serials and last-write values reconciled against the parent hive.'),
  ev('CUS-035', 'ARES-E-0042', T.logsAcquired + 2 * HOUR, 'ACQUIRED', OKAFOR, M_EXPORT,
    'Proxy access log pulled directly from the appliance over an authenticated session and hashed on write.',
    { from: 'FW-EDGE-01', to: 'Case working set' }),
  ev('CUS-036', 'ARES-E-0042', T.logsAcquired + 2 * HOUR + 20 * MIN, 'VERIFIED', VASQUEZ, M_DIGEST,
    'Digest matched. Line count and time range reconciled against the appliance retention window.'),
  ev('CUS-037', 'ARES-E-0044', T.logsAcquired + 3 * HOUR, 'ACQUIRED', OKAFOR, M_EXPORT,
    'VPN concentrator session records exported for the 24 hours surrounding the incident window.',
    { to: 'Case working set' }),
  ev('CUS-038', 'ARES-E-0060', T.logsAcquired + 4 * HOUR, 'ACQUIRED', OKONKWO, M_EXPORT,
    'Facility access records requested through the physical security team and delivered as a signed export.',
    { from: 'Physical Security', to: 'Case working set' }),
  ev('CUS-039', 'ARES-E-0060', T.logsAcquired + 5 * HOUR, 'VERIFIED', VASQUEZ, M_DIGEST,
    'Export digest matched the value in the covering memorandum. Reader identifiers cross-checked against the floor plan.'),
  ev('CUS-040', 'ARES-E-0017', T.analysisStart + 5 * HOUR, 'ANALYZED', VASQUEZ, M_CARVE,
    'Deleted object recovered in full from unallocated clusters and hashed. Recovery method recorded in the examination log.'),
  ev('CUS-041', 'ARES-E-0004', T.usbB2Surrendered + 6 * HOUR, 'ANALYZED', VASQUEZ, M_MOUNT,
    'Volume examined in full including carved deleted content. Negative finding recorded for HALCYON material.'),
  ev('CUS-043', 'ARES-E-0024', T.analysisStart + 7 * HOUR, 'ANALYZED', VASQUEZ, M_CARVE,
    'Shellbag subtree carved from the parent image. The digest recorded at carve time could not be reproduced on re-read: the second pass returned a different value for the same offset range, which points at the carve tooling rather than at the image. Re-verification against a fresh export is outstanding and this artifact must not be relied on until it clears.',
    { hashVerified: false }),
  ev('CUS-042', 'ARES-E-0001', T.interimReview, 'NOTE', OKONKWO, M_DESK,
    'Interim review held. The parent image remains sealed; all analysis to date has been performed against working copies.'),
]

export const CUSTODY_BY_EVIDENCE = CUSTODY_EVENTS.reduce<Map<string, CustodyEvent[]>>((map, entry) => {
  const list = map.get(entry.evidenceId) ?? []
  list.push(entry)
  map.set(entry.evidenceId, list)
  return map
}, new Map())
