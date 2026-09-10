import type { CaseNote } from './types'
import { T } from './clock'

const AUTHOR = 'C. Vasquez, GCFA - Digital Forensics Unit'
const MIN = 60_000
const HOUR = 60 * MIN

/**
 * Examiner working notes.
 *
 * These are observations and open threads, not conclusions. They point at what
 * still needs resolving and deliberately stop short of naming an operator.
 */
export const CASE_NOTES: CaseNote[] = [
  {
    id: 'NOTE-001',
    at: T.analysisStart + 35 * MIN,
    author: AUTHOR,
    body: 'Workstation RTC is 3m12s fast against the domain time source, documented by W32Time event 37 on 11 AUG and re-measured at acquisition. Every host-written timestamp in this case file is stored normalised and re-offset only for display. Anyone reading raw MACB values or the security channel without applying this will build a sequence that is three minutes out and will mis-order the host events against the proxy and badge records.',
    pinned: true,
    evidenceIds: ['ARES-E-0035', 'ARES-E-0021', 'ARES-E-0030'],
    eventIds: ['EV-002'],
  },
  {
    id: 'NOTE-002',
    at: T.analysisStart + 2 * HOUR + 10 * MIN,
    author: AUTHOR,
    body: 'The device serial recorded by the PnP event on the subject workstation also appears in the USBSTOR hive of the support bench workstation, first written 29 JUL. That is a link between two machines, not a demonstration of who was holding the device on the night. Recommend the enrolling workstation be re-examined for continued possession and that asset records for loaned removable media be requested.',
    pinned: true,
    evidenceIds: ['ARES-E-0031', 'ARES-E-0033', 'ARES-E-0030'],
    eventIds: ['EV-019', 'EV-001'],
  },
  {
    id: 'NOTE-003',
    at: T.analysisStart + 3 * HOUR + 40 * MIN,
    author: AUTHOR,
    body: 'Proxy recorded 8,214 bytes outbound and 1,196 inbound on the denied CONNECT. That volume is consistent with a TLS handshake and a policy block page, and is three orders of magnitude below the archive size. On the current record the network path did not carry the data. Two subsequent retries were also denied with smaller counts.',
    pinned: false,
    evidenceIds: ['ARES-E-0042', 'ARES-E-0010'],
    eventIds: ['EV-025'],
  },
  {
    id: 'NOTE-004',
    at: T.analysisStart + 4 * HOUR + 5 * MIN,
    author: AUTHOR,
    body: 'The removable volume was never recovered. Everything recorded about E:\research_archive.zip is inferred from the shell link target, the shellbag entry and the size carried in the LNK metadata. The artifact is marked contested for that reason and its confidence should not be raised without the physical media or an independent copy.',
    pinned: false,
    evidenceIds: ['ARES-E-0011', 'ARES-E-0023', 'ARES-E-0024'],
    eventIds: ['EV-023', 'EV-026'],
  },
  {
    id: 'NOTE-005',
    at: T.analysisStart + 5 * HOUR + 20 * MIN,
    author: AUTHOR,
    body: 'Two records place the same account in two places within 36 seconds: a type 2 console logon on the subject workstation and a VPN session from a residential address. Type 2 is raised at the physical keyboard, so this is not a remote session being misread. Either one record is wrong, or the credential was in use by two parties. Both source systems were in sync with the domain time source, so the conflict does not dissolve under normalisation.',
    pinned: false,
    evidenceIds: ['ARES-E-0030', 'ARES-E-0044', 'ARES-E-0060'],
    eventIds: ['EV-016', 'EV-017'],
  },
  {
    id: 'NOTE-006',
    at: T.analysisStart + 6 * HOUR,
    author: AUTHOR,
    body: 'The archiver ran from the support tools share rather than any local installation, and no sanctioned backup tooling appears in the process record. Request the share access log for ittools$ covering 17 AUG and confirm which accounts hold read rights to it.',
    pinned: false,
    evidenceIds: ['ARES-E-0022', 'ARES-E-0025', 'ARES-E-0045'],
    eventIds: ['EV-021'],
  },
  {
    id: 'NOTE-007',
    at: T.interimReview + 30 * MIN,
    author: AUTHOR,
    body: 'Re-verification of one custody entry is still outstanding and is flagged in the ledger. Do not sign the report while an artifact digest is unconfirmed. Also outstanding: whether the temporary password issued under HD-44192 was disclosed beyond the requester, which is a question for the helpdesk process owner rather than for this examination.',
    pinned: false,
    evidenceIds: ['ARES-E-0050', 'ARES-E-0061'],
    eventIds: ['EV-006'],
  },
  {
    id: 'NOTE-008',
    at: T.interimReview + 55 * MIN,
    author: AUTHOR,
    body: 'The deleted scratch note recovered intact contains ordinary engineering to-do items and one ambiguous line about pulling the project set before Friday. It is consistent with routine handover and with other readings. It should not be leaned on in either direction without corroboration.',
    pinned: false,
    evidenceIds: ['ARES-E-0017'],
    eventIds: ['EV-027'],
  },
]
