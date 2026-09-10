import type { EvidenceSeed } from './evidence'
import { T } from './clock'

/**
 * File-level artifacts carved from the DEV-0042 image (ARES-E-0001).
 *
 * Every path and byte count here is the same value the filesystem browser
 * reports for the matching node in `filesystem.ts`; the two are meant to be
 * cross-checked by the investigator and must not drift apart. All of these
 * records were written by the DEV-0042 clock, so `hostClock` is true and the
 * UI adds the documented +3m12s drift when the host basis is selected.
 */

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** Same derived beats the filesystem tree uses, so the MACB values line up. */
const OS_BUILD = T.usbA1FirstSeen - 402 * DAY
const PROFILE = T.usbA1FirstSeen - 388 * DAY

const OWNER_USER = 'MERIDIAN\\morgan.reed'
const OWNER_SYS = 'NT AUTHORITY\\SYSTEM'

const ACL_USER =
  'MERIDIAN\\morgan.reed: FullControl (I); BUILTIN\\Administrators: FullControl (I); NT AUTHORITY\\SYSTEM: FullControl (I)'
const ACL_USER_RO =
  'MERIDIAN\\morgan.reed: ReadAndExecute, Synchronize (I); BUILTIN\\Administrators: FullControl (I); NT AUTHORITY\\SYSTEM: FullControl (I)'
const ACL_SYS =
  'NT AUTHORITY\\SYSTEM: FullControl; BUILTIN\\Administrators: FullControl; BUILTIN\\Users: ReadAndExecute, Synchronize'
const ACL_SYS_LOCKED = 'NT AUTHORITY\\SYSTEM: FullControl; BUILTIN\\Administrators: ReadAndExecute'

const HALCYON_DIR = 'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON'
const RESEARCH_DIR = 'C:\\Users\\morgan.reed\\Documents\\Research'
const DOCS_DIR = 'C:\\Users\\morgan.reed\\Documents'
const DL_DIR = 'C:\\Users\\morgan.reed\\Downloads'
const TEMP_DIR = 'C:\\Users\\morgan.reed\\AppData\\Local\\Temp'
const RECENT_DIR = 'C:\\Users\\morgan.reed\\AppData\\Roaming\\Microsoft\\Windows\\Recent'
const USRCLASS = 'C:\\Users\\morgan.reed\\AppData\\Local\\Microsoft\\Windows\\UsrClass.dat'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PE_MIME = 'application/vnd.microsoft.portable-executable'

/** Recovered body of the deleted scratch note - 2,914 bytes, byte-exact. */
const SCRATCH_NOTE = `HALCYON - scratch notes, week of 10 AUG
(working list, not a deliverable, do not circulate)

BENCH
- rerun cells 14 and 17 on the 2C profile, the coulombic numbers from
  last week look off by about 0.3 pct and I still think that is the
  shunt resistor and not the cell
- ask facilities for the chamber humidity log, it drifted again on the
  overnight run and nobody wrote it down
- swap the leads on rig 3, one of them is intermittent and it shows up
  as a voltage step that is not real
- calibrate the reference cell before the next series or the whole log
  is worthless
- rig 2 fan is loud again, put it back on the maintenance list before
  someone files a safety ticket about it
- label the spare separator stock, three trays are unmarked and nobody
  remembers which batch is which

DATA
- test_bench_log_0812.csv still has the duplicate timestamp rows from
  the logger restart, strip them before anyone plots it
- cycle_life_projection.xlsx needs the new impedance column wired in
- pull the full HALCYON set before Friday
- move the 0805 thermal series off my Documents folder, it is 112 MB
  and it re-syncs every single time I log in
- the logger writes local time with no offset, add a note to the readme
  so nobody has to work that out again from scratch
- check whether the 0731 spectra export kept the capture parameters or
  whether they only live in the instrument log

PATENT
- HAL-118 draft: claim 7 is still too broad, legal flagged it twice
- send Kelsey the corrected separator thickness before the review
- figure numbering is off by one from figure 4 onward
- confirm the inventor list is final before it goes anywhere external

ADMIN
- offboarding checklist, IT wants the laptop back on the 21st
- July expenses still not submitted, third reminder now
- book the small room on 4 for the Thursday readout
- the printer on this floor is still asking for a driver, ticket open
- return the loaner monitor to the deskside cage

OPEN QUESTIONS
- do we have clearance to publish the 0731 spectra or is that still
  sitting under the joint filing
- who owns the H: share cleanup now that the platform team reorganised
- is the 2C profile the right baseline for the next projection or do we
  go back to 1C like the original protocol said
- does the cathode manifest need to match the batch numbering that the
  supplier changed in June, because right now it does not

NEXT WEEK
- write up the 0812 series properly instead of leaving it in the sheet
- get the impedance fixture back from the other lab, it has been out on
  loan for a month and we need it for the rerun
- redo the projection chart with the corrected axis, the current one is
  misleading and somebody will screenshot it
- ask about a second logger channel so the temperature and the current
  stop sharing a timebase
- chase the calibration certificate for the reference cell, it has
  expired and somebody will ask about it
`

/** First rows of the bench logger export. The logger writes local time with no offset. */
const BENCH_CSV = `timestamp,cell_id,voltage_v,current_a,temp_c,cycle
2026-08-12T09:14:02,HAL-C14,4.1482,-4.402,24.6,311
2026-08-12T09:14:32,HAL-C14,4.0913,-4.401,25.1,311
2026-08-12T09:15:02,HAL-C14,3.9744,-4.398,25.9,311
2026-08-12T09:15:32,HAL-C14,3.8021,-4.399,26.8,311
2026-08-12T09:16:02,HAL-C14,3.6675,-4.400,27.6,311
2026-08-12T09:16:32,HAL-C14,3.4198,-4.397,28.3,311
2026-08-12T09:17:02,HAL-C14,3.2004,-4.395,28.9,311
2026-08-12T09:17:32,HAL-C14,3.2011,0.000,28.1,311
2026-08-12T09:18:02,HAL-C14,3.4870,2.201,27.4,312
2026-08-12T09:18:32,HAL-C14,3.7412,2.200,27.0,312
2026-08-12T09:19:02,HAL-C17,4.1503,-4.404,24.4,308
2026-08-12T09:19:32,HAL-C17,4.0866,-4.403,25.0,308
2026-08-12T09:20:02,HAL-C17,3.9581,-4.401,25.8,308
2026-08-12T09:20:32,HAL-C17,3.7934,-4.402,26.7,308
`

export const EVIDENCE_FILES: EvidenceSeed[] = [
  {
    id: 'ARES-E-0012',
    label: 'halcyon_cell_matrix_v7.xlsx',
    category: 'filesystem',
    type: 'Office Open XML workbook',
    source: 'DEV-0042 / carved from ARES-E-0001 / Documents\\Research\\HALCYON',
    description:
      'Primary HALCYON cell performance workbook. Largest object in the project directory and the first file touched in the enumeration burst that precedes the archive.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.usbA1FirstSeen - 21 * DAY,
    modifiedAt: T.halcyonReviewMeeting - 2 * DAY,
    accessedAt: T.researchDirAccess,
    hostClock: true,
    status: 'verified',
    confidence: 0.95,
    significance: 'high',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${HALCYON_DIR}\\halcyon_cell_matrix_v7.xlsx`,
    sizeBytes: 90_387_251,
    mimeType: XLSX_MIME,
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['halcyon', 'workbook', 'proprietary', 'host-clock'],
    eventIds: ['EV-020', 'EV-022'],
    content: {
      kind: 'binary',
      format: 'xlsx',
      logicalSize: 90_387_251,
      sampleSize: 6144,
      strings: [
        'xl/worksheets/sheet1.xml',
        'docProps/core.xml',
        'Cell Matrix v7',
        'Cycle Summary',
        'Impedance Sweep',
        'Thermal Envelope',
        'cell_id',
        'cycle_index',
        'capacity_mAh',
        'coulombic_eff',
        'internal_res_mohm',
        'dc:creator morgan.reed@meridian-dynamics.example',
        'cp:lastModifiedBy MERIDIAN\\morgan.reed',
        'HALCYON-CONFIDENTIAL',
        'Meridian Dynamics - Restricted',
      ],
    },
    carved: true,
    caveat:
      'The case file carries the first 6 KiB of the container. Digests are computed over that carved sample, not over the full 86.2 MiB object.',
  },
  {
    id: 'ARES-E-0013',
    label: 'electrolyte_formulation_rev12.docx',
    category: 'filesystem',
    type: 'Office Open XML document',
    source: 'DEV-0042 / carved from ARES-E-0001 / Documents\\Research\\HALCYON',
    description:
      'Working revision of the electrolyte formulation specification. Tracked changes are still present in the container, so the revision history survived into the archive.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.usbA1FirstSeen - 35 * DAY,
    modifiedAt: T.halcyonReviewMeeting - 6 * HOUR,
    accessedAt: T.researchDirAccess,
    hostClock: true,
    status: 'verified',
    confidence: 0.93,
    significance: 'high',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${HALCYON_DIR}\\electrolyte_formulation_rev12.docx`,
    sizeBytes: 4_299_162,
    mimeType: DOCX_MIME,
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['halcyon', 'specification', 'proprietary', 'host-clock'],
    eventIds: ['EV-020', 'EV-022'],
    content: {
      kind: 'binary',
      format: 'docx',
      logicalSize: 4_299_162,
      sampleSize: 4096,
      strings: [
        'word/settings.xml',
        'docProps/core.xml',
        'Electrolyte Formulation - Revision 12',
        'Meridian Dynamics - Restricted',
        'Table 3 - Solvent blend ratios by batch',
        'w:ins w:author="kelsey.nunes" w:date="2026-08-12T13:41:00Z"',
        'w:del w:author="morgan.reed" w:date="2026-08-14T05:18:00Z"',
        'Tracked changes retained: 41 insertions, 12 deletions',
        'HALCYON-CONFIDENTIAL',
      ],
    },
    carved: true,
    caveat:
      'The case file carries the first 4 KiB of the container. Author names inside a document are metadata written by the editing application and are not proof of who operated the machine.',
  },
  {
    id: 'ARES-E-0014',
    label: 'test_bench_log_0812.csv',
    category: 'filesystem',
    type: 'Delimited text export (instrument logger)',
    source: 'DEV-0042 / carved from ARES-E-0001 / Documents\\Research\\HALCYON',
    description:
      'Cycler export for the 12 AUG bench series. Carried in the case file as a head sample so the column layout and the timestamp convention can be read directly.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.ntpSyncWarning + 1 * DAY + 2 * HOUR,
    modifiedAt: T.ntpSyncWarning + 1 * DAY + 14 * HOUR,
    accessedAt: T.researchDirAccess,
    hostClock: true,
    status: 'verified',
    confidence: 0.9,
    significance: 'moderate',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${HALCYON_DIR}\\test_bench_log_0812.csv`,
    sizeBytes: 64_697_139,
    mimeType: 'text/csv',
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['halcyon', 'instrument-data', 'host-clock'],
    eventIds: ['EV-020', 'EV-022'],
    content: { kind: 'text', text: BENCH_CSV },
    carved: true,
    caveat:
      'Head sample only: the first 15 lines of a 61.7 MiB export. The logger writes local time with no UTC offset, so these row timestamps carry no basis of their own and must not be compared with host records without stating the assumption.',
  },
  {
    id: 'ARES-E-0015',
    label: 'patent_draft_HAL-118.docx',
    category: 'filesystem',
    type: 'Office Open XML document',
    source: 'DEV-0042 / carved from ARES-E-0001 / Documents\\Research\\HALCYON',
    description:
      'Unfiled patent application draft covering the HALCYON separator stack. Last modified three days before the resignation was submitted.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.halcyonReviewMeeting - 27 * DAY,
    modifiedAt: T.resignationSubmitted - 3 * DAY,
    accessedAt: T.researchDirAccess,
    hostClock: true,
    status: 'verified',
    confidence: 0.92,
    significance: 'moderate',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${HALCYON_DIR}\\patent_draft_HAL-118.docx`,
    sizeBytes: 2_936_013,
    mimeType: DOCX_MIME,
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['halcyon', 'intellectual-property', 'draft', 'host-clock'],
    eventIds: ['EV-020', 'EV-022'],
    content: {
      kind: 'binary',
      format: 'docx',
      logicalSize: 2_936_013,
      sampleSize: 4096,
      strings: [
        'word/document.xml',
        'Attorney Docket No. HAL-118',
        'DRAFT - NOT FILED',
        'What is claimed is:',
        '1. A solid-state electrochemical cell comprising a sulfide separator layer',
        'disposed between a lithium metal anode and a layered oxide cathode, wherein',
        '7. The cell of claim 1, wherein the interfacial coating has a thickness of',
        'Field of the Invention',
        'Meridian Dynamics - Restricted',
        'HALCYON-CONFIDENTIAL',
      ],
    },
    carved: true,
    caveat:
      'The case file carries the first 4 KiB of the container. The draft is unfiled; nothing in this artifact establishes ownership of the underlying invention.',
  },
  {
    id: 'ARES-E-0016',
    label: 'spectra_scan_0731.png',
    category: 'filesystem',
    type: 'PNG raster image (instrument capture)',
    source: 'DEV-0042 / carved from ARES-E-0001 / Documents\\Research\\HALCYON',
    description:
      'Raman microprobe capture of a HALCYON separator coupon. The instrument software writes its capture parameters into the PNG text chunks.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.usbA1FirstSeen + 2 * DAY + 5 * HOUR,
    modifiedAt: T.usbA1FirstSeen + 2 * DAY + 5 * HOUR,
    accessedAt: T.researchDirAccess,
    hostClock: true,
    status: 'verified',
    confidence: 0.88,
    significance: 'low',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${HALCYON_DIR}\\spectra_scan_0731.png`,
    sizeBytes: 19_293_798,
    mimeType: 'image/png',
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['halcyon', 'instrument-data', 'image', 'host-clock'],
    eventIds: ['EV-020', 'EV-022'],
    content: {
      kind: 'binary',
      format: 'png',
      logicalSize: 19_293_798,
      sampleSize: 4096,
      strings: [
        'tEXtSoftware Meridian SpectraCap 4.2.1 build 20260612',
        'tEXtInstrument Raman microprobe RM-2200',
        'tEXtExcitation 532 nm / 12.0 mW',
        'tEXtIntegration 8 x 2.0 s',
        'tEXtGrating 1800 gr/mm',
        'tEXtObjective 50x / NA 0.75',
        'tEXtSample HAL-C7-0731 coupon B',
        'tEXtOperator morgan.reed',
        'tEXtCopyright Meridian Dynamics - Restricted',
      ],
    },
    carved: true,
    caveat:
      'The case file carries the first 4 KiB of the container. The operator field is an instrument software setting carried over from capture and is not an authentication record.',
  },
  {
    id: 'ARES-E-0017',
    label: 'halcyon_notes_scratch.txt',
    category: 'filesystem',
    type: 'Plain text file (recovered, deleted)',
    source: 'DEV-0042 / unallocated clusters + $Recycle.Bin \\$RZK41P2',
    description:
      'Deleted engineering scratch list recovered in full from unallocated clusters. The body is a routine week-of task list; one line refers to the HALCYON set without stating a purpose.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.halcyonReviewMeeting - 2 * DAY,
    modifiedAt: T.scratchDeleted,
    accessedAt: T.scratchDeleted,
    hostClock: true,
    status: 'analyzed',
    confidence: 0.74,
    significance: 'high',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${RESEARCH_DIR}\\halcyon_notes_scratch.txt`,
    sizeBytes: 2_914,
    mimeType: 'text/plain',
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['deleted', 'recovered', 'notes', 'host-clock'],
    eventIds: ['EV-027'],
    content: { kind: 'text', text: SCRATCH_NOTE },
    carved: true,
    caveat:
      'Recovered from unallocated clusters after the record was released; the resident data run was intact and the recovered length matches the 2,914-byte $FILE_NAME entry, but no independent copy exists to verify it against. The document is undated internally and its author is inferred from the containing profile, not established. Read the HALCYON line as ambiguous: nothing in the text states an intent, a destination or a recipient.',
  },
  {
    id: 'ARES-E-0018',
    label: 'vacation_photos_2025.zip',
    category: 'filesystem',
    type: 'ZIP archive',
    source: 'DEV-0042 / carved from ARES-E-0001 / Downloads',
    description:
      'Personal photo archive in the Downloads folder. Reviewed and set aside: contents are consumer camera images, last touched eight months before the case window.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.usbA1FirstSeen - 220 * DAY,
    modifiedAt: T.usbA1FirstSeen - 220 * DAY,
    accessedAt: T.usbA1FirstSeen - 12 * DAY,
    hostClock: true,
    status: 'excluded',
    confidence: 0.91,
    significance: 'noise',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${DL_DIR}\\vacation_photos_2025.zip`,
    sizeBytes: 1_476_395_008,
    mimeType: 'application/zip',
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['personal', 'reviewed', 'no-case-relevance'],
    eventIds: [],
    content: {
      kind: 'binary',
      format: 'zip',
      logicalSize: 1_476_395_008,
      sampleSize: 4096,
      strings: [
        'DSC_04118.JPG',
        'DSC_04119.JPG',
        'DSC_04203.JPG',
        'IMG_20250714_181206.jpg',
        'IMG_20250714_181244.jpg',
        'coast_road/',
        'ferry_day/',
        'Canon EOS R8',
        'created-by: Windows Explorer send-to compressed folder',
      ],
    },
    carved: true,
    caveat:
      'Central directory listing reviewed in full at acquisition; no HALCYON or Meridian material present. Carried here as a 4 KiB sample for completeness only.',
  },
  {
    id: 'ARES-E-0019',
    label: 'printer_driver_v4.exe',
    category: 'filesystem',
    type: 'Portable executable (vendor installer)',
    source: 'DEV-0042 / carved from ARES-E-0001 / Downloads',
    description:
      'Vendor print driver package downloaded during the afternoon of 11 AUG. Authenticode signature is intact and chains to the vendor certificate; the install log in Temp corresponds.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.usbB2LastSeen + 3 * HOUR,
    modifiedAt: T.usbB2LastSeen + 3 * HOUR,
    accessedAt: T.usbB2LastSeen + 3 * HOUR + 8 * MIN,
    hostClock: true,
    status: 'analyzed',
    confidence: 0.89,
    significance: 'noise',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${DL_DIR}\\printer_driver_v4.exe`,
    sizeBytes: 18_302_016,
    mimeType: PE_MIME,
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['executable', 'signed', 'reviewed', 'no-case-relevance'],
    eventIds: [],
    content: {
      kind: 'binary',
      format: 'exe',
      logicalSize: 18_302_016,
      sampleSize: 4096,
      strings: [
        'Northgate Peripherals Universal Print Driver',
        'ProductVersion 4.0.2211.6',
        'CompanyName Northgate Peripherals, Inc.',
        'Authenticode: valid, countersigned 2026-06-02T09:44:11Z',
        'Signer: Northgate Peripherals, Inc. (EV code signing)',
        'InstallShield Setup Launcher',
        'MSI4c21b.log',
      ],
    },
    carved: true,
    caveat:
      'A legitimately signed vendor package. It appears in this case file only because it is an executable in a user Downloads folder; the signature verified at acquisition and no case-relevant behaviour is associated with it.',
  },
  {
    id: 'ARES-E-0020',
    label: 'nda_signed_reed.pdf',
    category: 'filesystem',
    type: 'PDF document (executed agreement)',
    source: 'DEV-0042 / carved from ARES-E-0001 / Documents',
    description:
      'Executed confidentiality and invention assignment agreement held in the user profile. Opened once, 41 minutes after the resignation was submitted, and not modified.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: PROFILE + 1 * DAY,
    modifiedAt: PROFILE + 1 * DAY,
    accessedAt: T.resignationSubmitted + 41 * MIN,
    hostClock: true,
    status: 'analyzed',
    confidence: 0.94,
    significance: 'low',
    deviceId: 'DEV-0042',
    personId: 'PER-001',
    accountId: 'ACC-001',
    path: `${DOCS_DIR}\\nda_signed_reed.pdf`,
    sizeBytes: 318_446,
    mimeType: 'application/pdf',
    owner: OWNER_USER,
    permissions: ACL_USER_RO,
    tags: ['policy', 'context', 'read-only'],
    eventIds: ['EV-004'],
    content: {
      kind: 'binary',
      format: 'pdf',
      logicalSize: 318_446,
      sampleSize: 3072,
      strings: [
        'Employee Confidentiality and Invention Assignment Agreement',
        'Meridian Dynamics (fictional)',
        'Schedule A - Designated Projects: HALCYON',
        'Signatory: M. Reed, Senior Research Engineer',
        'Countersigned: People Operations',
        'Producer: Meridian DocSign 3.4',
      ],
    },
    carved: true,
    caveat:
      'Context only. This artifact establishes what the account holder had agreed to, not what anyone did. A read of an agreement after a resignation is unremarkable on its own and carries no inference either way.',
  },
  {
    id: 'ARES-E-0021',
    label: 'DEV-0042 $MFT extract',
    category: 'filesystem',
    type: 'NTFS master file table extract',
    source: 'DEV-0042 / carved from ARES-E-0001 / volume 3 record 0',
    description:
      'Master file table for the system volume. Every MACB value shown in the filesystem browser resolves to a $STANDARD_INFORMATION and $FILE_NAME pair in this extract, including the archive, the staged archiver, the deleted scratch note and the driver_backup_2026.cab entry in Downloads.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: OS_BUILD,
    modifiedAt: T.consoleLogoff,
    accessedAt: T.consoleLogoff,
    hostClock: true,
    status: 'verified',
    confidence: 0.97,
    significance: 'critical',
    deviceId: 'DEV-0042',
    path: 'C:\\$MFT',
    sizeBytes: 268_435_456,
    mimeType: 'application/octet-stream',
    owner: OWNER_SYS,
    permissions: ACL_SYS_LOCKED,
    tags: ['ntfs', 'metadata', 'macb', 'host-clock'],
    eventIds: ['EV-022', 'EV-023', 'EV-027'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 268_435_456,
      sampleSize: 8192,
      strings: [
        'FILE0',
        '$STANDARD_INFORMATION',
        '$FILE_NAME',
        '$DATA',
        '$BITMAP',
        'research_archive.zip',
        'research_archive.zip.lnk',
        'halcyon_notes_scratch.txt',
        'driver_backup_2026.cab',
        '7z.exe',
        '$RZK41P2',
        'record 118442 in use, resident 0, allocated 412342272',
      ],
    },
    carved: true,
    caveat:
      'The case file carries an 8 KiB window of the table. One MACB inconsistency is present and is explained: driver_backup_2026.cab in Downloads carries a $STANDARD_INFORMATION modified time months earlier than its $FILE_NAME change time. That is the ordinary signature of a file copied onto the volume with its original modification time preserved - the copy operation stamps the new $FILE_NAME entry while the content timestamp travels with the data. It is a copy artifact and is NOT evidence of timestamp tampering or anti-forensics.',
  },
  {
    id: 'ARES-E-0022',
    label: '7z.exe (staged copy under user temp)',
    category: 'filesystem',
    type: 'Portable executable (command line archiver)',
    source: 'DEV-0042 / carved from ARES-E-0001 / AppData\\Local\\Temp',
    description:
      'Copy of the command line archiver found in the user temp directory, written nine seconds before the archiver process started. The binary is not part of the DEV-0042 software baseline.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.archiverLaunched - 9_000,
    modifiedAt: T.archiverLaunched - 9_000,
    accessedAt: T.archiverLaunched,
    hostClock: true,
    status: 'verified',
    confidence: 0.95,
    significance: 'critical',
    deviceId: 'DEV-0042',
    accountId: 'ACC-001',
    path: `${TEMP_DIR}\\7z.exe`,
    sizeBytes: 604_672,
    mimeType: PE_MIME,
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['executable', 'archiver', 'staged', 'host-clock'],
    eventIds: ['EV-021', 'EV-022'],
    content: {
      kind: 'binary',
      format: 'exe',
      logicalSize: 604_672,
      sampleSize: 4096,
      strings: [
        '7-Zip 24.09',
        '7-Zip 24.09 : Copyright (c) 1999-2026 Igor Pavlov',
        'Igor Pavlov',
        '\\\\SRV-CORE-03\\ittools$\\7zip\\7z.exe',
        'a -tzip -mx1',
        'OriginalFilename 7z.exe',
        'FileDescription 7-Zip Console',
        'Cannot open file as archive',
      ],
    },
    carved: true,
    caveat:
      'The case file carries the first 4 KiB. The embedded share path is a string inside the binary and records where the copy came from, not where it was executed from; the execution path must be read from the process creation record and the prefetch entry.',
  },
  {
    id: 'ARES-E-0023',
    label: 'research_archive.zip.lnk',
    category: 'filesystem',
    type: 'Windows shell link (LNK)',
    source: 'DEV-0042 / carved from ARES-E-0001 / Recent',
    description:
      'Shell link written when the archive was opened from the removable volume. Carries the target path, the target size, the volume serial and the machine name that created it.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.archiveCopied,
    modifiedAt: T.archiveCopied,
    accessedAt: T.archiveCopied,
    hostClock: true,
    status: 'verified',
    confidence: 0.91,
    significance: 'critical',
    deviceId: 'DEV-0042',
    accountId: 'ACC-001',
    path: `${RECENT_DIR}\\research_archive.zip.lnk`,
    sizeBytes: 1_486,
    mimeType: 'application/x-ms-shortcut',
    owner: OWNER_USER,
    permissions: ACL_USER,
    tags: ['lnk', 'removable', 'target-metadata', 'host-clock'],
    eventIds: ['EV-023'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 1_486,
      sampleSize: 1_486,
      strings: [
        'E:\\research_archive.zip',
        'research_archive.zip',
        'A47C-91DE',
        'FIELDKIT',
        'MD-DEV-0042',
        'DriveType: DRIVE_REMOVABLE',
        'TargetSize: 412338112',
      ],
    },
    caveat:
      'A shell link records what the shell was told about a target at the moment it was written. It evidences a reference to E:\\research_archive.zip on a volume with serial A47C-91DE; it does not evidence the contents of that volume, which was never produced.',
  },
  {
    id: 'ARES-E-0024',
    label: 'Shellbag (BagMRU) extract from UsrClass.dat',
    category: 'registry',
    type: 'Registry hive extract (Shell\\BagMRU)',
    source: 'DEV-0042 / carved from ARES-E-0001 / AppData\\Local\\Microsoft\\Windows',
    description:
      'Shell folder browsing history for the account profile. Records the folders that were opened in Explorer, including the removable volume root and the research share.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: PROFILE,
    modifiedAt: T.consoleLogoff,
    accessedAt: T.consoleLogoff,
    hostClock: true,
    status: 'analyzed',
    confidence: 0.86,
    significance: 'high',
    deviceId: 'DEV-0042',
    accountId: 'ACC-001',
    path: USRCLASS,
    sizeBytes: 8_912_896,
    mimeType: 'application/octet-stream',
    owner: OWNER_USER,
    permissions: ACL_SYS_LOCKED,
    tags: ['registry', 'shellbag', 'browsing-history', 'host-clock'],
    eventIds: ['EV-020', 'EV-023'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 8_912_896,
      sampleSize: 4096,
      strings: [
        'Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU',
        'NodeSlot',
        'MRUListEx',
        'E:\\',
        'E:\\fieldkit',
        'E:\\System Volume Information',
        'H:\\HALCYON',
        'H:\\HALCYON\\archive',
        'C:\\Users\\morgan.reed\\Documents\\Research\\HALCYON',
        'FIELDKIT (E:)',
      ],
    },
    carved: true,
    caveat:
      'Shellbag entries record that a folder was displayed in Explorer under this profile. They carry no per-file read record and their write times are updated lazily, so treat the ordering as indicative rather than exact.',
  },
  {
    id: 'ARES-E-0025',
    label: 'Prefetch 7Z.EXE-4A1C8B02.pf',
    category: 'filesystem',
    type: 'Windows prefetch record',
    source: 'DEV-0042 / carved from ARES-E-0001 / Windows\\Prefetch',
    description:
      'Prefetch entry for the command line archiver. Carries the last run time and the list of files the process touched, including the archiver image, the loader libraries and the archive that was written.',
    acquiredAt: T.imageAcquiredDev0042,
    createdAt: T.archiverLaunched,
    modifiedAt: T.archiverLaunched,
    accessedAt: T.archiverLaunched,
    hostClock: true,
    status: 'verified',
    confidence: 0.9,
    significance: 'high',
    deviceId: 'DEV-0042',
    accountId: 'ACC-001',
    path: 'C:\\Windows\\Prefetch\\7Z.EXE-4A1C8B02.pf',
    sizeBytes: 47_326,
    mimeType: 'application/octet-stream',
    owner: OWNER_SYS,
    permissions: ACL_SYS,
    tags: ['prefetch', 'execution', 'archiver', 'host-clock'],
    eventIds: ['EV-021', 'EV-022'],
    content: {
      kind: 'binary',
      format: 'raw',
      logicalSize: 47_326,
      sampleSize: 4096,
      strings: [
        'MAM',
        'SCCA',
        '7Z.EXE',
        '7Z.EXE-4A1C8B02.pf',
        'RunCount: 1',
        'VolumePath: \\DEVICE\\HARDDISKVOLUME3',
        'VolumeSerial: 9E44-0C71',
        '\\DEVICE\\MUP\\SRV-CORE-03\\ITTOOLS$\\7ZIP\\7Z.EXE',
        '\\DEVICE\\HARDDISKVOLUME3\\USERS\\MORGAN.REED\\APPDATA\\LOCAL\\TEMP\\7Z.EXE',
        '\\DEVICE\\HARDDISKVOLUME3\\USERS\\MORGAN.REED\\APPDATA\\LOCAL\\TEMP\\RESEARCH_ARCHIVE.ZIP',
        '\\DEVICE\\HARDDISKVOLUME3\\WINDOWS\\SYSTEM32\\NTDLL.DLL',
        '\\DEVICE\\HARDDISKVOLUME3\\WINDOWS\\SYSTEM32\\KERNEL32.DLL',
      ],
    },
    carved: true,
    caveat:
      'The prefetch filename hash 4A1C8B02 is derived from the executable path and cannot be reversed, so this record alone does not establish which of the two archiver paths was executed. Exactly one prefetch entry for the archiver exists on the volume; the run count is 1 and only one run time slot is populated.',
  },
]
