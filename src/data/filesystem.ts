import type { FsNode, Significance } from './types'
import { T } from './clock'

/**
 * Browsable filesystem for OPERATION NIGHTFALL.
 *
 * Two trees share one deviceId. `C:\\` is the NTFS system volume carved from the
 * DEV-0042 image. `E:\\` is the removable volume: the media itself was never
 * recovered, so those nodes are reconstructed from LNK targets and shellbag
 * entries and are labelled as such in the evidence that backs them.
 *
 * Every node here was written by the DEV-0042 clock, so `hostClock` is true
 * throughout and the UI adds the documented +3m12s drift in host basis.
 * Timestamps derive from named case beats - never from raw epochs.
 */

const KiB = 1024
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/* ------------------------------------------------------------ HALCYON set */
/* Nine project files, 402.6 MiB total. These byte counts are authoritative and
   are mirrored exactly by the matching seeds in evidence.files.ts. */
const SZ_CELL_MATRIX = 90_387_251 //  86.2 MiB
const SZ_ELECTROLYTE = 4_299_162 //    4.1 MiB
const SZ_BENCH_LOG = 64_697_139 //    61.7 MiB
const SZ_PATENT = 2_936_013 //         2.8 MiB
const SZ_SPECTRA = 19_293_798 //      18.4 MiB
const SZ_THERMAL = 118_384_230 //    112.9 MiB
const SZ_CATHODE = 9_751_757 //        9.3 MiB
const SZ_README = 4 * KiB //           4.0 KiB
const SZ_CYCLE_LIFE = 112_407_347 //  107.2 MiB

const OWNER_USER = 'MERIDIAN\\morgan.reed'
const OWNER_SYS = 'NT AUTHORITY\\SYSTEM'
const OWNER_EXT = 'unknown (exFAT)'

const ACL_USER =
  'MERIDIAN\\morgan.reed: FullControl (I); BUILTIN\\Administrators: FullControl (I); NT AUTHORITY\\SYSTEM: FullControl (I)'
const ACL_USER_RO =
  'MERIDIAN\\morgan.reed: ReadAndExecute, Synchronize (I); BUILTIN\\Administrators: FullControl (I); NT AUTHORITY\\SYSTEM: FullControl (I)'
const ACL_SYS =
  'NT AUTHORITY\\SYSTEM: FullControl; BUILTIN\\Administrators: FullControl; BUILTIN\\Users: ReadAndExecute, Synchronize'
const ACL_SYS_LOCKED = 'NT AUTHORITY\\SYSTEM: FullControl; BUILTIN\\Administrators: ReadAndExecute'
const ACL_NONE = 'n/a (exFAT volume, no ACL support)'

/** MFT record numbers: unique, monotonic, inside the range seen in the image. */
let mftCursor = 40_961
const nextMft = (): number => (mftCursor += 149)

const baseName = (p: string): string => {
  const parts = p.replace(/\\+$/, '').split('\\')
  return parts[parts.length - 1] ?? p
}

/** Directory node. Directories carry one settled timestamp for all four MACB fields. */
function d(
  id: string,
  path: string,
  parentId: string | undefined,
  at: number,
  significance: Significance,
  rest: Partial<FsNode> = {},
): FsNode {
  return {
    id,
    name: baseName(path),
    path,
    kind: 'directory',
    deviceId: 'DEV-0042',
    sizeBytes: 0,
    created: at,
    modified: at,
    accessed: at,
    changed: at,
    hostClock: true,
    owner: OWNER_USER,
    permissions: ACL_USER,
    attributes: ['NOT_CONTENT_INDEXED'],
    mftRecord: nextMft(),
    significance,
    parentId,
    ...rest,
  }
}

/** File node. `changed` ($FILE_NAME) defaults to `modified` ($STANDARD_INFORMATION). */
function f(
  id: string,
  path: string,
  parentId: string,
  sizeBytes: number,
  created: number,
  modified: number,
  accessed: number,
  significance: Significance,
  rest: Partial<FsNode> = {},
): FsNode {
  return {
    id,
    name: baseName(path),
    path,
    kind: 'file',
    deviceId: 'DEV-0042',
    sizeBytes,
    created,
    modified,
    accessed,
    changed: modified,
    hostClock: true,
    owner: OWNER_USER,
    permissions: ACL_USER,
    attributes: ['ARCHIVE'],
    mftRecord: nextMft(),
    significance,
    parentId,
    ...rest,
  }
}

const SYS_DIR: Partial<FsNode> = { owner: OWNER_SYS, permissions: ACL_SYS, attributes: ['SYSTEM', 'NOT_CONTENT_INDEXED'] }
const SYS_FILE: Partial<FsNode> = { owner: OWNER_SYS, permissions: ACL_SYS, attributes: ['ARCHIVE', 'SYSTEM'] }
const SYS_HIDDEN: Partial<FsNode> = {
  owner: OWNER_SYS,
  permissions: ACL_SYS_LOCKED,
  attributes: ['HIDDEN', 'SYSTEM', 'NOT_CONTENT_INDEXED'],
}
const EXT_NODE: Partial<FsNode> = { owner: OWNER_EXT, permissions: ACL_NONE, attributes: ['ARCHIVE'] }

/** OS deployment and profile creation, both well before the case window. */
const OS_BUILD = T.usbA1FirstSeen - 402 * DAY
const PROFILE = T.usbA1FirstSeen - 388 * DAY
/** The last routine working day Reed spent at the console. */
const LAST_WORKDAY = T.reedSessionEnd

export const FS_NODES: FsNode[] = [
  /* ------------------------------------------------------- C: volume spine */
  d('fs-c', 'C:\\', undefined, OS_BUILD, 'low', SYS_DIR),
  d('fs-users', 'C:\\Users', 'fs-c', OS_BUILD, 'low', SYS_DIR),
  d('fs-windows', 'C:\\Windows', 'fs-c', OS_BUILD, 'low', SYS_DIR),
  d('fs-progdata', 'C:\\ProgramData', 'fs-c', OS_BUILD, 'noise', SYS_DIR),
  d('fs-recycle', 'C:\\$Recycle.Bin', 'fs-c', OS_BUILD, 'moderate', SYS_HIDDEN),
  f('fs-mft', 'C:\\$MFT', 'fs-c', 268_435_456, OS_BUILD, T.consoleLogoff, T.consoleLogoff, 'critical', {
    ...SYS_HIDDEN,
    mftRecord: 0,
    evidenceId: 'ARES-E-0021',
  }),
  f('fs-pagefile', 'C:\\pagefile.sys', 'fs-c', 17_179_869_184, OS_BUILD, T.consoleLogoff, T.consoleLogoff, 'low', {
    ...SYS_HIDDEN,
  }),
  f('fs-hiberfil', 'C:\\hiberfil.sys', 'fs-c', 12_884_901_888, OS_BUILD, T.reedSessionEnd, T.reedSessionEnd, 'noise', {
    ...SYS_HIDDEN,
  }),

  /* ------------------------------------------------------------- profiles */
  d('fs-reed', 'C:\\Users\\morgan.reed', 'fs-users', PROFILE, 'high'),
  d('fs-public', 'C:\\Users\\Public', 'fs-users', OS_BUILD, 'noise', SYS_DIR),
  f('fs-ntuser', 'C:\\Users\\morgan.reed\\NTUSER.DAT', 'fs-reed', 6_029_312, PROFILE, T.consoleLogoff, T.consoleLogoff, 'high', {
    attributes: ['HIDDEN', 'SYSTEM', 'NOT_CONTENT_INDEXED'],
  }),
  d('fs-docs', 'C:\\Users\\morgan.reed\\Documents', 'fs-reed', PROFILE, 'high'),
  d('fs-dl', 'C:\\Users\\morgan.reed\\Downloads', 'fs-reed', PROFILE, 'low'),
  d('fs-desktop', 'C:\\Users\\morgan.reed\\Desktop', 'fs-reed', PROFILE, 'low'),
  d('fs-appdata', 'C:\\Users\\morgan.reed\\AppData', 'fs-reed', PROFILE, 'high', {
    attributes: ['HIDDEN', 'NOT_CONTENT_INDEXED'],
  }),

  /* ------------------------------------------------------------- Documents */
  d('fs-research', 'C:\\Users\\morgan.reed\\Documents\\Research', 'fs-docs', PROFILE + 12 * DAY, 'critical', {
    accessed: T.researchDirAccess,
  }),
  f('fs-doc-ini', 'C:\\Users\\morgan.reed\\Documents\\desktop.ini', 'fs-docs', 402, PROFILE, PROFILE, PROFILE, 'noise', {
    attributes: ['HIDDEN', 'SYSTEM', 'ARCHIVE'],
  }),
  f('fs-tax', 'C:\\Users\\morgan.reed\\Documents\\tax_return_2025.pdf', 'fs-docs', 1_884_732,
    T.usbA1FirstSeen - 190 * DAY, T.usbA1FirstSeen - 188 * DAY, T.usbA1FirstSeen - 188 * DAY, 'noise'),
  f('fs-nda', 'C:\\Users\\morgan.reed\\Documents\\nda_signed_reed.pdf', 'fs-docs', 318_446,
    PROFILE + 1 * DAY, PROFILE + 1 * DAY, T.resignationSubmitted + 41 * MIN, 'low', {
      permissions: ACL_USER_RO,
      attributes: ['ARCHIVE', 'READONLY'],
      evidenceId: 'ARES-E-0020',
    }),
  f('fs-standup', 'C:\\Users\\morgan.reed\\Documents\\standup_notes.txt', 'fs-docs', 11_204,
    T.halcyonReviewMeeting - 60 * DAY, LAST_WORKDAY - 3 * HOUR, LAST_WORKDAY - 3 * HOUR, 'noise'),
  f('fs-slides', 'C:\\Users\\morgan.reed\\Documents\\conference_slides_2026.pptx', 'fs-docs', 24_117_248,
    T.usbB2LastSeen - 9 * DAY, T.usbB2LastSeen - 2 * HOUR, T.usbB2LastSeen, 'noise'),
  f('fs-expenses', 'C:\\Users\\morgan.reed\\Documents\\expenses_july.xlsx', 'fs-docs', 47_104,
    T.usbA1FirstSeen + 3 * DAY, T.usbB2LastSeen - 1 * DAY, T.usbB2LastSeen, 'noise'),
  f('fs-thumbs', 'C:\\Users\\morgan.reed\\Documents\\Thumbs.db', 'fs-docs', 82_944,
    PROFILE, LAST_WORKDAY, LAST_WORKDAY, 'noise', { attributes: ['HIDDEN', 'SYSTEM', 'ARCHIVE'] }),

  /* -------------------------------------------------------------- Research */
  d('fs-halcyon', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON', 'fs-research',
    T.usbA1FirstSeen - 95 * DAY, 'critical', { accessed: T.researchDirAccess }),
  f('fs-scratch', 'C:\\Users\\morgan.reed\\Documents\\Research\\halcyon_notes_scratch.txt', 'fs-research', 2_914,
    T.halcyonReviewMeeting - 2 * DAY, T.scratchDeleted, T.scratchDeleted, 'high', {
      deleted: true,
      recoverable: true,
      evidenceId: 'ARES-E-0017',
    }),
  f('fs-inventory', 'C:\\Users\\morgan.reed\\Documents\\Research\\lab_inventory_2026.xlsx', 'fs-research', 186_368,
    T.usbA1FirstSeen - 40 * DAY, T.ntpSyncWarning + 6 * HOUR, T.researchDirAccess - 3 * DAY, 'low'),

  /* --------------------------------------------------------- HALCYON files */
  /* Created and modified days to weeks apart, but every access time in this
     directory lands inside the same one-minute enumeration burst. */
  f('fs-hal-matrix', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\halcyon_cell_matrix_v7.xlsx',
    'fs-halcyon', SZ_CELL_MATRIX, T.usbA1FirstSeen - 21 * DAY, T.halcyonReviewMeeting - 2 * DAY,
    T.researchDirAccess, 'critical', { attributes: ['ARCHIVE', 'NOT_CONTENT_INDEXED'], evidenceId: 'ARES-E-0012' }),
  f('fs-hal-electro', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\electrolyte_formulation_rev12.docx',
    'fs-halcyon', SZ_ELECTROLYTE, T.usbA1FirstSeen - 35 * DAY, T.halcyonReviewMeeting - 6 * HOUR,
    T.researchDirAccess, 'critical', { evidenceId: 'ARES-E-0013' }),
  f('fs-hal-bench', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\test_bench_log_0812.csv',
    'fs-halcyon', SZ_BENCH_LOG, T.ntpSyncWarning + 1 * DAY + 2 * HOUR, T.ntpSyncWarning + 1 * DAY + 14 * HOUR,
    T.researchDirAccess, 'high', { attributes: ['ARCHIVE', 'NOT_CONTENT_INDEXED'], evidenceId: 'ARES-E-0014' }),
  f('fs-hal-patent', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\patent_draft_HAL-118.docx',
    'fs-halcyon', SZ_PATENT, T.halcyonReviewMeeting - 27 * DAY, T.resignationSubmitted - 3 * DAY,
    T.researchDirAccess, 'critical', { evidenceId: 'ARES-E-0015' }),
  f('fs-hal-spectra', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\spectra_scan_0731.png',
    'fs-halcyon', SZ_SPECTRA, T.usbA1FirstSeen + 2 * DAY + 5 * HOUR, T.usbA1FirstSeen + 2 * DAY + 5 * HOUR,
    T.researchDirAccess, 'high', { evidenceId: 'ARES-E-0016' }),
  f('fs-hal-thermal', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\thermal_runaway_series_0805.csv',
    'fs-halcyon', SZ_THERMAL, T.ntpSyncWarning - 6 * DAY + 2 * HOUR, T.ntpSyncWarning - 6 * DAY + 8 * HOUR,
    T.researchDirAccess, 'high', { attributes: ['ARCHIVE', 'NOT_CONTENT_INDEXED'] }),
  f('fs-hal-cathode', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\cathode_batch_manifest.xlsx',
    'fs-halcyon', SZ_CATHODE, T.halcyonReviewMeeting - 22 * DAY, T.halcyonReviewMeeting - 9 * DAY,
    T.researchDirAccess, 'high'),
  f('fs-hal-readme', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\HALCYON_readme.txt',
    'fs-halcyon', SZ_README, T.usbA1FirstSeen - 60 * DAY, T.usbA1FirstSeen - 30 * DAY,
    T.researchDirAccess, 'moderate'),
  f('fs-hal-cycle', 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON\\cycle_life_projection.xlsx',
    'fs-halcyon', SZ_CYCLE_LIFE, T.halcyonReviewMeeting - 14 * DAY, T.halcyonReviewMeeting + 90 * MIN,
    T.researchDirAccess, 'high', { attributes: ['ARCHIVE', 'NOT_CONTENT_INDEXED'] }),

  /* ------------------------------------------------------------- Downloads */
  /* driver_backup_2026.cab carries a MACB inconsistency: $STANDARD_INFORMATION
     modified predates the $FILE_NAME change time by months. The seed that backs
     it states what that pattern is and is not. */
  f('fs-cab', 'C:\\Users\\morgan.reed\\Downloads\\driver_backup_2026.cab', 'fs-dl', 41_517_056,
    T.ntpSyncWarning - 150 * DAY, T.ntpSyncWarning - 150 * DAY, T.usbB2LastSeen + 2 * HOUR, 'moderate', {
      changed: T.usbB2LastSeen + 2 * HOUR,
      attributes: ['ARCHIVE', 'COMPRESSED'],
      evidenceId: 'ARES-E-0021',
    }),
  f('fs-printer', 'C:\\Users\\morgan.reed\\Downloads\\printer_driver_v4.exe', 'fs-dl', 18_302_016,
    T.usbB2LastSeen + 3 * HOUR, T.usbB2LastSeen + 3 * HOUR, T.usbB2LastSeen + 3 * HOUR + 8 * MIN, 'noise', {
      evidenceId: 'ARES-E-0019',
    }),
  f('fs-vacation', 'C:\\Users\\morgan.reed\\Downloads\\vacation_photos_2025.zip', 'fs-dl', 1_476_395_008,
    T.usbA1FirstSeen - 220 * DAY, T.usbA1FirstSeen - 220 * DAY, T.usbA1FirstSeen - 12 * DAY, 'noise', {
      attributes: ['ARCHIVE', 'NOT_CONTENT_INDEXED'],
      evidenceId: 'ARES-E-0018',
    }),
  f('fs-mixtape', 'C:\\Users\\morgan.reed\\Downloads\\mixtape_commute.mp3', 'fs-dl', 9_437_184,
    T.usbA1FirstSeen - 74 * DAY, T.usbA1FirstSeen - 74 * DAY, LAST_WORKDAY - 6 * HOUR, 'noise'),
  f('fs-python', 'C:\\Users\\morgan.reed\\Downloads\\python-3.13.2-amd64.exe', 'fs-dl', 27_058_176,
    T.usbA1FirstSeen - 15 * DAY, T.usbA1FirstSeen - 15 * DAY, T.usbA1FirstSeen - 15 * DAY, 'noise'),
  f('fs-datasheet', 'C:\\Users\\morgan.reed\\Downloads\\sensor_datasheet_ncm811.pdf', 'fs-dl', 1_204_782,
    T.halcyonReviewMeeting - 31 * DAY, T.halcyonReviewMeeting - 31 * DAY, T.halcyonReviewMeeting - 4 * DAY, 'low'),

  /* --------------------------------------------------------------- Desktop */
  f('fs-offboard', 'C:\\Users\\morgan.reed\\Desktop\\offboarding_checklist.docx', 'fs-desktop', 38_412,
    T.resignationSubmitted + 22 * MIN, LAST_WORKDAY - 40 * MIN, LAST_WORKDAY - 40 * MIN, 'low'),
  f('fs-hlnk', 'C:\\Users\\morgan.reed\\Desktop\\RESEARCH SHARE (H).lnk', 'fs-desktop', 1_284,
    PROFILE + 30 * DAY, PROFILE + 30 * DAY, T.researchDirAccess - 22 * MIN, 'moderate'),

  /* --------------------------------------------------------------- AppData */
  d('fs-local', 'C:\\Users\\morgan.reed\\AppData\\Local', 'fs-appdata', PROFILE, 'high', {
    attributes: ['HIDDEN', 'NOT_CONTENT_INDEXED'],
  }),
  d('fs-roaming', 'C:\\Users\\morgan.reed\\AppData\\Roaming', 'fs-appdata', PROFILE, 'high', {
    attributes: ['HIDDEN', 'NOT_CONTENT_INDEXED'],
  }),
  d('fs-temp', 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp', 'fs-local', PROFILE, 'critical', {
    accessed: T.archiveCopied,
    attributes: ['NOT_CONTENT_INDEXED'],
  }),
  d('fs-localms', 'C:\\Users\\morgan.reed\\AppData\\Local\\Microsoft', 'fs-local', PROFILE, 'high'),
  f('fs-archive', 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp\\research_archive.zip', 'fs-temp', 412_338_112,
    T.archiveCreated, T.archiveCreated + 44_000, T.archiveCopied, 'critical', {
      attributes: ['ARCHIVE', 'NOT_CONTENT_INDEXED'],
      mftRecord: 118_442,
      evidenceId: 'ARES-E-0010',
    }),
  f('fs-7z', 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp\\7z.exe', 'fs-temp', 604_672,
    T.archiverLaunched - 9_000, T.archiverLaunched - 9_000, T.archiverLaunched, 'critical', {
      evidenceId: 'ARES-E-0022',
    }),
  f('fs-tmp1', 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp\\~DF3A19.tmp', 'fs-temp', 65_536,
    LAST_WORKDAY - 2 * HOUR, LAST_WORKDAY - 2 * HOUR, LAST_WORKDAY - 2 * HOUR, 'noise'),
  f('fs-tmp2', 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp\\MSI4c21b.log', 'fs-temp', 372_318,
    T.usbB2LastSeen + 3 * HOUR, T.usbB2LastSeen + 3 * HOUR + 4 * MIN, T.usbB2LastSeen + 3 * HOUR + 4 * MIN, 'noise'),
  d('fs-localwin', 'C:\\Users\\morgan.reed\\AppData\\Local\\Microsoft\\Windows', 'fs-localms', PROFILE, 'high'),
  f('fs-usrclass', 'C:\\Users\\morgan.reed\\AppData\\Local\\Microsoft\\Windows\\UsrClass.dat', 'fs-localwin', 8_912_896,
    PROFILE, T.consoleLogoff, T.consoleLogoff, 'high', {
      attributes: ['HIDDEN', 'SYSTEM', 'NOT_CONTENT_INDEXED'],
      evidenceId: 'ARES-E-0024',
    }),
  d('fs-roamms', 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft', 'fs-roaming', PROFILE, 'moderate'),
  d('fs-roamwin', 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft\\Windows', 'fs-roamms', PROFILE, 'moderate'),
  d('fs-recent', 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft\\Windows\\Recent', 'fs-roamwin', PROFILE, 'critical', {
    accessed: T.archiveCopied,
  }),
  f('fs-lnk-archive', 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\research_archive.zip.lnk',
    'fs-recent', 1_486, T.archiveCopied, T.archiveCopied, T.archiveCopied, 'critical', {
      evidenceId: 'ARES-E-0023',
    }),
  f('fs-lnk-halcyon', 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\HALCYON.lnk',
    'fs-recent', 1_402, T.researchDirAccess, T.researchDirAccess, T.researchDirAccess, 'high'),
  f('fs-lnk-tax', 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft\\Windows\\Recent\\tax_return_2025.pdf.lnk',
    'fs-recent', 1_178, T.usbA1FirstSeen - 188 * DAY, T.usbA1FirstSeen - 188 * DAY, T.usbA1FirstSeen - 188 * DAY, 'noise'),

  /* --------------------------------------------------------------- Windows */
  d('fs-prefetch', 'C:\\Windows\\Prefetch', 'fs-windows', OS_BUILD, 'high', SYS_DIR),
  f('fs-pf-7z', 'C:\\Windows\\Prefetch\\7Z.EXE-4A1C8B02.pf', 'fs-prefetch', 47_326,
    T.archiverLaunched, T.archiverLaunched, T.archiverLaunched, 'high', {
      ...SYS_FILE,
      evidenceId: 'ARES-E-0025',
    }),
  f('fs-pf-cmd', 'C:\\Windows\\Prefetch\\CMD.EXE-0F2B1C33.pf', 'fs-prefetch', 31_204,
    OS_BUILD + 3 * DAY, T.archiverLaunched - 41_000, T.archiverLaunched - 41_000, 'moderate', SYS_FILE),
  f('fs-pf-notepad', 'C:\\Windows\\Prefetch\\NOTEPAD.EXE-D8A9C111.pf', 'fs-prefetch', 22_918,
    OS_BUILD + 9 * DAY, LAST_WORKDAY - 5 * HOUR, LAST_WORKDAY - 5 * HOUR, 'noise', SYS_FILE),
  d('fs-sys32', 'C:\\Windows\\System32', 'fs-windows', OS_BUILD, 'low', SYS_DIR),
  d('fs-config', 'C:\\Windows\\System32\\config', 'fs-sys32', OS_BUILD, 'high', SYS_DIR),
  f('fs-hive-system', 'C:\\Windows\\System32\\config\\SYSTEM', 'fs-config', 31_195_136,
    OS_BUILD, T.consoleLogoff, T.consoleLogoff, 'high', { ...SYS_HIDDEN, evidenceId: 'ARES-E-0033' }),
  f('fs-hive-software', 'C:\\Windows\\System32\\config\\SOFTWARE', 'fs-config', 118_489_088,
    OS_BUILD, T.consoleLogoff, T.consoleLogoff, 'low', SYS_HIDDEN),
  d('fs-winevt', 'C:\\Windows\\System32\\winevt', 'fs-sys32', OS_BUILD, 'moderate', SYS_DIR),
  d('fs-evtlogs', 'C:\\Windows\\System32\\winevt\\Logs', 'fs-winevt', OS_BUILD, 'critical', SYS_DIR),
  f('fs-evt-sec', 'C:\\Windows\\System32\\winevt\\Logs\\Security.evtx', 'fs-evtlogs', 20_975_616,
    OS_BUILD, T.consoleLogoff, T.consoleLogoff, 'critical', { ...SYS_FILE, evidenceId: 'ARES-E-0030' }),
  f('fs-evt-sys', 'C:\\Windows\\System32\\winevt\\Logs\\System.evtx', 'fs-evtlogs', 15_732_736,
    OS_BUILD, T.usbRemoved, T.usbRemoved, 'high', { ...SYS_FILE, evidenceId: 'ARES-E-0035' }),
  f('fs-evt-app', 'C:\\Windows\\System32\\winevt\\Logs\\Application.evtx', 'fs-evtlogs', 8_396_800,
    OS_BUILD, T.consoleLogoff, T.consoleLogoff, 'noise', SYS_FILE),
  f('fs-ntoskrnl', 'C:\\Windows\\System32\\ntoskrnl.exe', 'fs-sys32', 11_534_336,
    OS_BUILD, OS_BUILD, T.consoleLogon, 'noise', SYS_FILE),
  f('fs-net-exe', 'C:\\Windows\\System32\\net.exe', 'fs-sys32', 60_416,
    OS_BUILD, OS_BUILD, T.explicitCredential, 'moderate', SYS_FILE),
  d('fs-drivers', 'C:\\Windows\\System32\\drivers', 'fs-sys32', OS_BUILD, 'noise', SYS_DIR),
  f('fs-usbstor', 'C:\\Windows\\System32\\drivers\\USBSTOR.SYS', 'fs-drivers', 129_536,
    OS_BUILD, OS_BUILD, T.usbInsert, 'moderate', SYS_FILE),
  f('fs-wulog', 'C:\\Windows\\WindowsUpdate.log', 'fs-windows', 2_183_642,
    OS_BUILD, T.rdpSessionEnd, T.rdpSessionEnd, 'noise', SYS_FILE),
  d('fs-wintemp', 'C:\\Windows\\Temp', 'fs-windows', OS_BUILD, 'noise', SYS_DIR),
  f('fs-wintemp-log', 'C:\\Windows\\Temp\\CHG-8871-patch.log', 'fs-wintemp', 96_412,
    T.rdpSessionStart, T.rdpSessionEnd, T.rdpSessionEnd, 'low', SYS_FILE),

  /* ----------------------------------------------------------- ProgramData */
  d('fs-pd-ms', 'C:\\ProgramData\\Microsoft', 'fs-progdata', OS_BUILD, 'noise', SYS_DIR),
  d('fs-pd-md', 'C:\\ProgramData\\Meridian', 'fs-progdata', OS_BUILD + 1 * DAY, 'low', SYS_DIR),
  f('fs-edr-log', 'C:\\ProgramData\\Meridian\\edr_agent.log', 'fs-pd-md', 4_718_592,
    OS_BUILD + 1 * DAY, T.consoleLogoff, T.consoleLogoff, 'low', SYS_FILE),

  /* ---------------------------------------------------------- $Recycle.Bin */
  d('fs-rb-sid', 'C:\\$Recycle.Bin\\S-1-5-21-3402198877-1449281304-2210556313-4471', 'fs-recycle',
    PROFILE, 'high', { ...SYS_HIDDEN, accessed: T.scratchDeleted }),
  f('fs-rb-i', 'C:\\$Recycle.Bin\\S-1-5-21-3402198877-1449281304-2210556313-4471\\$IZK41P2', 'fs-rb-sid', 544,
    T.scratchDeleted, T.scratchDeleted, T.scratchDeleted, 'high', {
      attributes: ['ARCHIVE', 'HIDDEN', 'NOT_CONTENT_INDEXED'],
      evidenceId: 'ARES-E-0017',
    }),
  f('fs-rb-r', 'C:\\$Recycle.Bin\\S-1-5-21-3402198877-1449281304-2210556313-4471\\$RZK41P2', 'fs-rb-sid', 2_914,
    T.halcyonReviewMeeting - 2 * DAY, T.scratchDeleted, T.scratchDeleted, 'high', {
      attributes: ['ARCHIVE', 'HIDDEN', 'NOT_CONTENT_INDEXED'],
      recoverable: true,
      evidenceId: 'ARES-E-0017',
    }),

  /* ------------------------------------------------- E: removable volume */
  /* Reconstructed from LNK targets and BagMRU. The media was never recovered,
     so nothing below was observed on the device itself. */
  d('fs-e', 'E:\\', undefined, T.usbA1FirstSeen, 'critical', {
    ...EXT_NODE,
    attributes: ['NOT_CONTENT_INDEXED'],
    accessed: T.usbRemoved,
  }),
  f('fs-e-archive', 'E:\\research_archive.zip', 'fs-e', 412_338_112,
    T.archiveCopied, T.archiveCopied, T.archiveCopied, 'critical', {
      ...EXT_NODE,
      evidenceId: 'ARES-E-0011',
    }),
  d('fs-e-svi', 'E:\\System Volume Information', 'fs-e', T.usbA1FirstSeen, 'moderate', {
    ...EXT_NODE,
    attributes: ['HIDDEN', 'SYSTEM', 'NOT_CONTENT_INDEXED'],
  }),
  f('fs-e-wps', 'E:\\System Volume Information\\WPSettings.dat', 'fs-e-svi', 12,
    T.usbA1FirstSeen, T.usbInsert, T.usbInsert, 'moderate', {
      ...EXT_NODE,
      attributes: ['ARCHIVE', 'HIDDEN', 'SYSTEM'],
    }),
  d('fs-e-fieldkit', 'E:\\fieldkit', 'fs-e', T.usbA1FirstSeen + 4 * HOUR, 'moderate', {
    ...EXT_NODE,
    attributes: ['NOT_CONTENT_INDEXED'],
  }),
  f('fs-e-checklist', 'E:\\fieldkit\\imaging_checklist.txt', 'fs-e-fieldkit', 1_842,
    T.usbA1FirstSeen + 4 * HOUR, T.usbA1FirstSeen + 4 * HOUR + 18 * MIN, T.usbInsert, 'moderate', EXT_NODE),
]
