import type { Hypothesis } from './types'
import { T } from './clock'

const AUTHOR = 'C. Vasquez, GCFA - Digital Forensics Unit'

/**
 * Competing explanations shipped with the case file.
 *
 * Each is stated as a proposition that evidence can support or contradict, not
 * as an accusation. The investigator can re-weight the links, add their own,
 * and create further hypotheses; nothing here is presented as settled.
 */
export const HYPOTHESES: Hypothesis[] = [
  {
    id: 'HYP-BUILTIN-1',
    code: 'H1',
    title: 'Research data was copied to removable media',
    statement:
      'The HALCYON project directory was archived on DEV-0042 and the resulting container was written to a USB mass storage device that left the premises.',
    status: 'supported',
    createdAt: T.analysisStart,
    author: AUTHOR,
    builtIn: true,
    links: [
      {
        evidenceId: 'ARES-E-0010',
        stance: 'supports',
        weight: 3,
        rationale: 'A 393 MiB archive of the project directory exists in the user temp path with a creation time inside the window.',
      },
      {
        evidenceId: 'ARES-E-0023',
        stance: 'supports',
        weight: 3,
        rationale: 'The shell link target records the same filename on a removable volume, with volume serial A47C-91DE and label FIELDKIT.',
      },
      {
        evidenceId: 'ARES-E-0024',
        stance: 'supports',
        weight: 2,
        rationale: 'Shellbag entries show the E: volume was browsed during the session, corroborating the LNK target.',
      },
      {
        evidenceId: 'ARES-E-0030',
        stance: 'supports',
        weight: 3,
        rationale: 'PnP event 6416 places a mass storage device on the host four minutes before the archive was created.',
      },
      {
        evidenceId: 'ARES-E-0032',
        stance: 'supports',
        weight: 2,
        rationale: 'A surprise removal event closes the media window five minutes after the copy.',
      },
      {
        evidenceId: 'ARES-E-0011',
        stance: 'neutral',
        weight: 2,
        rationale: 'The destination object is reconstructed from host-side references only; the media was never recovered or examined.',
      },
      {
        evidenceId: 'ARES-E-0004',
        stance: 'contradicts',
        weight: 1,
        rationale: 'The one removable device recovered in this case contains no HALCYON material, though it is not the device seen in the window.',
      },
    ],
    openQuestions: [
      'The physical device was never recovered - can it be located through the enrolling workstation?',
      'Does any downstream system show the archive after it left the estate?',
      'Can the carved sample digest be compared against a copy held elsewhere?',
    ],
  },
  {
    id: 'HYP-BUILTIN-2',
    code: 'H2',
    title: 'Data was transferred over a network connection',
    statement:
      'The archived research data left the estate over the network rather than on physical media, using an external file transfer service.',
    status: 'refuted',
    createdAt: T.analysisStart,
    author: AUTHOR,
    builtIn: true,
    links: [
      {
        evidenceId: 'ARES-E-0040',
        stance: 'supports',
        weight: 2,
        rationale: 'Browser history shows a deliberate search for a transfer service followed by a visit to its upload page.',
      },
      {
        evidenceId: 'ARES-E-0043',
        stance: 'supports',
        weight: 1,
        rationale: 'The resolver log confirms the external host was looked up from the subject workstation.',
      },
      {
        evidenceId: 'ARES-E-0042',
        stance: 'contradicts',
        weight: 3,
        rationale: 'The proxy denied the CONNECT under policy EGRESS-114 and recorded only 8,214 bytes outbound - a handshake, not a 393 MiB payload.',
      },
      {
        evidenceId: 'ARES-E-0041',
        stance: 'contradicts',
        weight: 2,
        rationale: 'The cached upload page shows the client-side form was reached, but no upload session identifier was ever issued.',
      },
      {
        evidenceId: 'ARES-E-0062',
        stance: 'neutral',
        weight: 1,
        rationale: 'The DLP correlation fired on the attempt itself, which does not distinguish a successful transfer from a blocked one.',
      },
    ],
    openQuestions: [
      'Was any portion of the archive staged before the block, for example in a resumable upload session?',
      'Do egress records exist for the period between the session close and the next morning?',
    ],
  },
  {
    id: 'HYP-BUILTIN-3',
    code: 'H3',
    title: 'The account holder was not the person at the keyboard',
    statement:
      'The credentials used inside the incident window were presented by someone other than the employee to whom the account belongs.',
    status: 'supported',
    createdAt: T.analysisStart,
    author: AUTHOR,
    builtIn: true,
    links: [
      {
        evidenceId: 'ARES-E-0060',
        stance: 'supports',
        weight: 3,
        rationale: 'The account holder badged out at 22:14:09 and no re-entry is recorded, while another badge is on the floor across the entire window.',
      },
      {
        evidenceId: 'ARES-E-0044',
        stance: 'supports',
        weight: 3,
        rationale: 'A VPN session for the same account originates from a residential address 36 seconds after a console logon on site.',
      },
      {
        evidenceId: 'ARES-E-0030',
        stance: 'supports',
        weight: 3,
        rationale: 'Logon type 2 is raised at the physical console, so the session cannot be explained by remote access.',
      },
      {
        evidenceId: 'ARES-E-0050',
        stance: 'supports',
        weight: 2,
        rationale: 'A tier-1 password reset earlier the same day placed a working credential for the account in a third party pair of hands.',
      },
      {
        evidenceId: 'ARES-E-0031',
        stance: 'supports',
        weight: 2,
        rationale: 'The device serial mounted during the window was first enrolled on a workstation belonging to a different person.',
      },
      {
        evidenceId: 'ARES-E-0035',
        stance: 'neutral',
        weight: 2,
        rationale: 'The conflict only resolves once the host clock drift is normalised; without it the two sessions appear further apart than they are.',
      },
    ],
    openQuestions: [
      'Was the temporary password from HD-44192 disclosed to anyone beyond the requester?',
      'Is there camera coverage of Lab Bay 4C for the window?',
      'Can the enrolling workstation confirm continued possession of the device serial?',
    ],
  },
  {
    id: 'HYP-BUILTIN-4',
    code: 'H4',
    title: 'An administrator misused an authorised maintenance window',
    statement:
      'The activity was performed under the cover of the approved patch window by the engineer holding domain administrator rights.',
    status: 'refuted',
    createdAt: T.analysisStart,
    author: AUTHOR,
    builtIn: true,
    links: [
      {
        evidenceId: 'ARES-E-0046',
        stance: 'supports',
        weight: 2,
        rationale: 'A remote desktop session into the subject workstation exists on the same evening under privileged credentials.',
      },
      {
        evidenceId: 'ARES-E-0034',
        stance: 'supports',
        weight: 1,
        rationale: 'A 2 TB external drive was attached to the same engineer workstation earlier that evening.',
      },
      {
        evidenceId: 'ARES-E-0030',
        stance: 'contradicts',
        weight: 3,
        rationale: 'The session under investigation is logon type 2 at the console; the administrative session is type 10 and uses a different account.',
      },
      {
        evidenceId: 'ARES-E-0046',
        stance: 'contradicts',
        weight: 3,
        rationale: 'The administrative session closed at 23:29:40, eight minutes and ten seconds before the console logon.',
      },
      {
        evidenceId: 'ARES-E-0053',
        stance: 'contradicts',
        weight: 1,
        rationale: 'The maintenance window was announced in advance in a shared channel and matches change record CHG-8871.',
      },
    ],
    openQuestions: [
      'Were any audit policy changes made during the administrative session?',
      'Does the external drive contain HALCYON material if examined?',
    ],
  },
  {
    id: 'HYP-BUILTIN-5',
    code: 'H5',
    title: 'The activity was authorised work misread as an incident',
    statement:
      'The archive and the media write were a legitimate backup taken during offboarding, and the alert is a false positive.',
    status: 'refuted',
    createdAt: T.analysisStart,
    author: AUTHOR,
    builtIn: true,
    links: [
      {
        evidenceId: 'ARES-E-0020',
        stance: 'supports',
        weight: 1,
        rationale: 'An offboarding process was genuinely under way, which makes some handling of project material expected.',
      },
      {
        evidenceId: 'ARES-E-0022',
        stance: 'contradicts',
        weight: 3,
        rationale: 'The archiver was executed from a support tools share rather than any sanctioned backup tooling.',
      },
      {
        evidenceId: 'ARES-E-0042',
        stance: 'contradicts',
        weight: 3,
        rationale: 'A legitimate backup does not attempt an upload to an uncategorised external transfer service.',
      },
      {
        evidenceId: 'ARES-E-0017',
        stance: 'contradicts',
        weight: 2,
        rationale: 'A working file was deleted minutes after the copy, which is not consistent with a routine archive task.',
      },
      {
        evidenceId: 'ARES-E-0060',
        stance: 'contradicts',
        weight: 2,
        rationale: 'The work was performed after midnight by someone other than the account holder, with no change record.',
      },
    ],
    openQuestions: [
      'Does any retention or offboarding policy authorise a local archive of project data?',
      'Was a sanctioned backup of the HALCYON directory taken through normal channels?',
    ],
  },
]
