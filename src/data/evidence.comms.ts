import type { EvidenceSeed } from './evidence'
import { T } from './clock'

/**
 * Mail and chat exports. All four systems are NTP-disciplined, so nothing here
 * carries the DEV-0042 drift. Mail items are exported as RFC 5322 message
 * source; chat items as one JSON object per line, which is how the archive
 * connector writes them.
 */
export const EVIDENCE_COMMS: EvidenceSeed[] = [
  {
    id: 'ARES-E-0050',
    label: 'Helpdesk ticket HD-44192 mail thread',
    category: 'comms',
    type: 'RFC 5322 message export (2 messages)',
    source: 'Mail archive export / journal store / thread 41761',
    description:
      'The request that opened HD-44192 and the closure notice sent when the tier-1 password reset was applied to the Reed account, five and a half hours before the incident window.',
    acquiredAt: T.logsAcquired,
    createdAt: T.passwordResetTicket - 1_680_000,
    modifiedAt: T.passwordResetTicket,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.9,
    significance: 'critical',
    personId: 'PER-003',
    accountId: 'ACC-003',
    path: '/exports/mail/thread-41761.eml',
    sizeBytes: 4_096,
    mimeType: 'message/rfc822',
    owner: 'Mail Archive Service',
    permissions: 'read-only (journal copy)',
    tags: ['email', 'helpdesk', 'password-reset', 'pivot'],
    eventIds: ['EV-006'],
    content: {
      kind: 'text',
      text: `Message-ID: <41761.1@mail.meridian-dynamics.example>
Date: Mon, 17 Aug 2026 16:34:41 -0400
From: Meridian Helpdesk <helpdesk@meridian-dynamics.example>
To: Morgan Reed <morgan.reed@meridian-dynamics.example>
Cc: Helpdesk Queue <helpdesk-queue@meridian-dynamics.example>
Subject: HD-44192 opened - cannot sign in to workstation
X-Ticket-Id: HD-44192
X-Priority: 3 (Normal)
Content-Type: text/plain; charset=utf-8

Your request has been logged as HD-44192 and assigned to deskside support.
A technician will contact you on the number held in the directory.

--- 8< ---

Message-ID: <41761.2@mail.meridian-dynamics.example>
In-Reply-To: <41761.1@mail.meridian-dynamics.example>
Date: Mon, 17 Aug 2026 17:02:41 -0400
From: Dana Whitfield <dana.whitfield@meridian-dynamics.example>
To: Helpdesk Queue <helpdesk-queue@meridian-dynamics.example>
Cc: Morgan Reed <morgan.reed@meridian-dynamics.example>
Subject: HD-44192 closed - password reset completed
X-Ticket-Id: HD-44192
X-Resolution-Code: TIER1-PWRESET
X-Originating-Host: MD-WKS-0088 [10.20.4.88]
Content-Type: text/plain; charset=utf-8

Tier-1 reset applied to the MERIDIAN account for M. Reed and the temporary
value passed to the requester by phone. Force-change-at-next-logon was left
unset at the requester preference so the workstation profile would not prompt
mid-session.

Ticket closed. No follow-up scheduled.`,
    },
    caveat:
      'Journal copies are captured at the transport layer, so the headers are trustworthy. The message body is the technician account of what was done and has not been independently corroborated.',
  },
  {
    id: 'ARES-E-0051',
    label: 'Chat export - #it-support, 17 AUG evening',
    category: 'comms',
    type: 'Chat archive export (JSON lines)',
    source: 'Collaboration platform compliance export / channel #it-support',
    description:
      'Channel transcript covering the evening of 17 AUG. Includes a message announcing a fourth floor visit shortly before the incident window.',
    acquiredAt: T.logsAcquired,
    createdAt: T.whitfieldChatLoaner,
    modifiedAt: T.whitfieldChatLoaner,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.79,
    significance: 'high',
    personId: 'PER-003',
    accountId: 'ACC-003',
    mimeType: 'application/x-ndjson',
    owner: 'Compliance export service',
    permissions: 'read-only export',
    tags: ['chat', 'timeline-context'],
    eventIds: ['EV-011'],
    content: {
      kind: 'text',
      text: `{"ts":"2026-08-17T22:41:08-04:00","channel":"it-support","user":"priya.raman","text":"Anyone still around? The 3rd floor printer queue is stuck again."}
{"ts":"2026-08-17T22:44:52-04:00","channel":"it-support","user":"dana.whitfield","text":"Restarted the spooler, should clear in a minute."}
{"ts":"2026-08-17T22:58:12-04:00","channel":"it-support","user":"dana.whitfield","text":"Grabbing the loaner from 4th floor, back in 30."}
{"ts":"2026-08-17T23:01:30-04:00","channel":"it-support","user":"priya.raman","text":"Queue cleared, thanks."}
{"ts":"2026-08-18T07:52:19-04:00","channel":"it-support","user":"dana.whitfield","text":"Loaner is on the bench, imaged and ready for the new starter."}`,
    },
    caveat:
      'A stated intention in a chat message is not evidence that the action was carried out as described, nor of how long it took.',
  },
  {
    id: 'ARES-E-0052',
    label: 'Email - offboarding confirmation to people operations',
    category: 'comms',
    type: 'Email message (RFC 5322)',
    source: 'Mail archive journal export / message 41982',
    description:
      'Short administrative message from the account holder confirming an exit interview time. No attachments.',
    acquiredAt: T.logsAcquired,
    createdAt: T.reedHrEmail,
    modifiedAt: T.reedHrEmail,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.9,
    significance: 'low',
    personId: 'PER-001',
    accountId: 'ACC-001',
    mimeType: 'message/rfc822',
    owner: 'Mail journal service',
    permissions: 'read-only export',
    tags: ['email', 'context', 'offboarding'],
    eventIds: ['EV-009', 'EV-004'],
    content: {
      kind: 'text',
      text: `Message-ID: <41982.20260817.2140@mail.meridian-dynamics.example>
Date: Mon, 17 Aug 2026 21:40:12 -0400
From: Morgan Reed <morgan.reed@meridian-dynamics.example>
To: People Operations <people-ops@meridian-dynamics.example>
Subject: Re: Exit interview - Friday
X-Journal-Capture: transport
Content-Type: text/plain; charset=utf-8

Friday at 10:00 works. I will have the handover notes for the HALCYON
test bench finished before then.

Signing off for the evening.

Morgan`,
    },
  },
  {
    id: 'ARES-E-0053',
    label: 'Chat export - #platform-ops change window',
    category: 'comms',
    type: 'Chat archive export (JSON lines)',
    source: 'Collaboration platform compliance export / channel #platform-ops',
    description:
      'Transcript recording the announcement of change CHG-8871 and the maintenance window on the subject workstation.',
    acquiredAt: T.logsAcquired,
    createdAt: T.chenPatchChat,
    modifiedAt: T.chenPatchChat,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'verified',
    confidence: 0.84,
    significance: 'moderate',
    personId: 'PER-002',
    accountId: 'ACC-002',
    mimeType: 'application/x-ndjson',
    owner: 'Compliance export service',
    permissions: 'read-only export',
    tags: ['chat', 'change-management', 'exculpatory'],
    eventIds: ['EV-012', 'EV-013', 'EV-014'],
    content: {
      kind: 'text',
      text: `{"ts":"2026-08-17T23:10:02-04:00","channel":"platform-ops","user":"avery.chen","text":"Starting the patch window on DEV-0042 under CHG-8871, expect a reboot."}
{"ts":"2026-08-17T23:29:58-04:00","channel":"platform-ops","user":"avery.chen","text":"DEV-0042 patched and back up. Closing the session, CHG-8871 done."}
{"ts":"2026-08-17T23:31:11-04:00","channel":"platform-ops","user":"sam.oyelaran","text":"Nice one. I will pick up the rest of the batch tomorrow."}`,
    },
    caveat:
      'The stated session close at 23:29:58 is corroborated independently by the remote desktop session log and the workstation security channel.',
  },
  {
    id: 'ARES-E-0054',
    label: 'Email - vendor newsletter',
    category: 'comms',
    type: 'Email message (RFC 5322)',
    source: 'Mail archive journal export / message 41870',
    description:
      'Routine marketing newsletter delivered to a distribution list. Retained to document the ordinary contents of the mailbox during the review period.',
    acquiredAt: T.logsAcquired,
    createdAt: T.reedHrEmail - 4 * 3600_000,
    modifiedAt: T.reedHrEmail - 4 * 3600_000,
    accessedAt: T.analysisStart,
    hostClock: false,
    status: 'excluded',
    confidence: 0.95,
    significance: 'noise',
    personId: 'PER-001',
    mimeType: 'message/rfc822',
    owner: 'Mail journal service',
    permissions: 'read-only export',
    tags: ['email', 'noise'],
    eventIds: [],
    content: {
      kind: 'text',
      text: `Message-ID: <41870.20260817.1735@bulk.cellworks-supply.example>
Date: Mon, 17 Aug 2026 17:35:44 -0400
From: Cellworks Supply <news@cellworks-supply.example>
To: eng-announce@meridian-dynamics.example
Subject: August catalogue - pouch cell tooling and test fixtures
List-Unsubscribe: <https://cellworks-supply.example/u/41870>
Content-Type: text/plain; charset=utf-8

New this month: revised pouch cell crimping fixtures, four-wire sense
harnesses, and a restock on the 18650 test sleds.

You are receiving this because your address is on the engineering
announce list.`,
    },
    caveat: 'No case relevance. Retained so the mailbox review can be shown to have been complete rather than selective.',
  },
]
