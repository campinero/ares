/**
 * INTERNAL CASE SOLUTION - OPERATION NIGHTFALL
 *
 * This module is the ground truth for the simulation. It exists so the case can
 * be validated as solvable and so an instructor can grade an investigator
 * conclusion against it.
 *
 * IT MUST NEVER BE IMPORTED BY A VIEW, COMPONENT, STORE OR HOOK.
 * `src/data/solution.test.ts` enforces that: the only permitted importers are
 * test files. Nothing here is rendered anywhere in the application.
 *
 * Everything below is fictional and synthetic.
 */

export interface SolutionStep {
  order: number
  /** Normalised case time, as a readable string rather than an epoch. */
  at: string
  what: string
  /** Artifacts that establish this step. */
  evidenceIds: string[]
}

export interface CaseSolution {
  culpritPersonId: string
  culpritAccountUsed: string
  exfiltrationVector: 'removable-media' | 'network' | 'print' | 'none'
  subjectDeviceId: string
  mediaId: string
  /** The decisive artifact chain, in the order an examiner would build it. */
  provingChain: string[]
  /** Facts that look incriminating but are not. */
  redHerrings: Array<{ what: string; why: string }>
  /** Questions the evidence genuinely cannot answer. */
  residualUncertainty: string[]
  sequence: SolutionStep[]
  /** The minimum an investigator must connect to have solved it. */
  gradingCriteria: string[]
}

export const CASE_SOLUTION: CaseSolution = {
  culpritPersonId: 'PER-003',
  culpritAccountUsed: 'ACC-001',
  exfiltrationVector: 'removable-media',
  subjectDeviceId: 'DEV-0042',
  mediaId: 'USB-A1',

  provingChain: [
    'ARES-E-0050',
    'ARES-E-0030',
    'ARES-E-0060',
    'ARES-E-0044',
    'ARES-E-0031',
    'ARES-E-0022',
    'ARES-E-0010',
    'ARES-E-0023',
    'ARES-E-0042',
  ],

  redHerrings: [
    {
      what: 'Morgan Reed had resigned and every on-host action carries her account token.',
      why: 'The account was used, not necessarily the person. Her badge egress at 22:14:09 and the VPN session from her residential ISP 36 s after the console logon place her elsewhere.',
    },
    {
      what: 'Avery Chen held domain admin and had an RDP session into the subject workstation that night.',
      why: 'Logon type 10 ended at 23:29:40, eight minutes before the type 2 console logon under investigation, and is covered by change CHG-8871.',
    },
    {
      what: 'A 2 TB external drive was attached to Chen workstation at 21:03:26.',
      why: 'It was never enrolled on DEV-0042 and predates the window. It is imaging kit for the patch round.',
    },
    {
      what: 'A SanDisk drive is registered to the Reed profile on DEV-0042.',
      why: 'Last connected 11 AUG, surrendered voluntarily and imaged, and contains no HALCYON material.',
    },
    {
      what: 'driver_backup_2026.cab shows a $FILE_NAME / $STANDARD_INFORMATION mismatch that looks like timestomping.',
      why: 'It is an ordinary copy artifact, and the evidence caveat says so.',
    },
    {
      what: 'A browser session reached an external transfer service, which reads as the exfiltration path.',
      why: 'The proxy denied the CONNECT. Only 8,214 bytes left the estate against a 393 MiB archive.',
    },
  ],

  residualUncertainty: [
    'The removable device was never recovered, so the archive on it is inferred from LNK and shellbag data rather than observed.',
    'Whether any payload traversed the boundary before the block, though the byte counts argue strongly against it.',
    'Whether the deletion of halcyon_notes_scratch.txt was deliberate.',
    'Whether the operator acted alone or at the direction of another party.',
    'Whether the temporary password from HD-44192 was disclosed beyond the requester.',
  ],

  sequence: [
    {
      order: 1,
      at: '2026-08-17 17:02:41',
      what: 'Whitfield closes helpdesk ticket HD-44192, performing a tier-1 password reset on the Reed account and taking possession of a working credential.',
      evidenceIds: ['ARES-E-0050', 'ARES-E-0061'],
    },
    {
      order: 2,
      at: '2026-08-17 22:14:09',
      what: 'Reed badges out of the building. No re-entry is recorded for her badge for the rest of the day.',
      evidenceIds: ['ARES-E-0060'],
    },
    {
      order: 3,
      at: '2026-08-17 23:29:40',
      what: 'Chen closes the authorised remote maintenance session, clearing him of the window that follows.',
      evidenceIds: ['ARES-E-0046'],
    },
    {
      order: 4,
      at: '2026-08-17 23:33:41',
      what: 'Whitfield badges onto floor 4, where the subject workstation sits.',
      evidenceIds: ['ARES-E-0060'],
    },
    {
      order: 5,
      at: '2026-08-17 23:37:50',
      what: 'An interactive type 2 logon is raised at the DEV-0042 console using the Reed credentials.',
      evidenceIds: ['ARES-E-0030'],
    },
    {
      order: 6,
      at: '2026-08-17 23:38:26',
      what: 'The same account authenticates to the VPN from Reed residential address, which the console logon cannot be reconciled with.',
      evidenceIds: ['ARES-E-0044'],
    },
    {
      order: 7,
      at: '2026-08-17 23:41:06',
      what: 'A Kingston device is mounted as E:. The serial was first enrolled on WKS-0088, the Whitfield bench workstation.',
      evidenceIds: ['ARES-E-0030', 'ARES-E-0033', 'ARES-E-0031'],
    },
    {
      order: 8,
      at: '2026-08-17 23:42:59',
      what: 'An archiver is executed from the IT tools share, which the deskside support role administers and which holds no local installation on this host.',
      evidenceIds: ['ARES-E-0022', 'ARES-E-0025', 'ARES-E-0030'],
    },
    {
      order: 9,
      at: '2026-08-17 23:43:50',
      what: 'research_archive.zip is written to the user temp path, containing the nine HALCYON project files.',
      evidenceIds: ['ARES-E-0010', 'ARES-E-0021'],
    },
    {
      order: 10,
      at: '2026-08-17 23:45:05',
      what: 'The archive is copied to the removable volume. The LNK target records volume serial A47C-91DE, label FIELDKIT.',
      evidenceIds: ['ARES-E-0023', 'ARES-E-0024'],
    },
    {
      order: 11,
      at: '2026-08-17 23:49:50',
      what: 'An upload attempt to an external transfer service is denied at the proxy. Only 8,214 bytes leave the estate, so the network is not the successful path.',
      evidenceIds: ['ARES-E-0042', 'ARES-E-0040'],
    },
    {
      order: 12,
      at: '2026-08-17 23:50:59',
      what: 'The removable volume is removed. It was never recovered.',
      evidenceIds: ['ARES-E-0032'],
    },
    {
      order: 13,
      at: '2026-08-17 23:52:56',
      what: 'The console session is logged off after 15m06s.',
      evidenceIds: ['ARES-E-0030'],
    },
    {
      order: 14,
      at: '2026-08-17 23:59:07',
      what: 'Whitfield badges off floor 4, 6m11s after the session closed.',
      evidenceIds: ['ARES-E-0060'],
    },
  ],

  gradingCriteria: [
    'Identifies removable media, not the network, as the successful exfiltration vector, citing the proxy byte counts.',
    'Separates the account (morgan.reed) from the operator, citing the type 2 console logon against the badge and VPN records.',
    'Traces the USB serial from DEV-0042 back to its first enrolment on WKS-0088.',
    'Notes that the archiver came from the IT tools share rather than a local or sanctioned tool.',
    'Applies the +192 s host clock normalisation before ordering host records against proxy, VPN and badge records.',
    'States the removable device was never recovered, and does not overstate what the reconstructed E: artifact proves.',
    'Rules out Chen on logon type and session timing rather than on assertion.',
  ],
}
