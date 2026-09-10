import type { CaseMeta } from './types'
import { T } from './clock'
import { CASE_TZ_LABEL } from '@/lib/time'

export const CASE_META: CaseMeta = {
  id: 'ARES-2026-0817',
  name: 'Suspected exfiltration of proprietary research data',
  codename: 'OPERATION NIGHTFALL',
  classification: 'INTERNAL - INVESTIGATION SENSITIVE',
  status: 'active',
  opened: T.caseOpened,
  organization: 'Meridian Dynamics (fictional)',
  lead: 'R. Okonkwo, Head of Investigations',
  examiner: 'C. Vasquez, GCFA - Digital Forensics Unit',
  jurisdiction: 'Internal corporate investigation - no law enforcement referral at this stage',
  synopsis:
    'Meridian Dynamics believes proprietary Project HALCYON research data was copied from an engineering workstation shortly before the assigned employee account was disabled. A data loss prevention rule fired the following morning on a correlation of an out-of-hours bulk archive, a write to removable media and a blocked outbound upload. The subject workstation, a corporate laptop, and a support workstation were imaged. All artifacts in this case file are synthetic and generated for training.',
  mandate: [
    'Establish what occurred on DEV-0042 between 23:30 and 24:00 on 17 AUG 2026',
    'Determine whether proprietary data left the estate, and by which path',
    'Identify the account and the operator behind the activity, and distinguish the two',
    'Reconcile conflicting timestamps between host and network sources',
    'Assess whether removable media or a network transfer was the exfiltration vector',
    'Record which findings are supported and which remain uncertain',
  ],
  unresolvedQuestions: [
    'The removable device carrying the archive was never recovered - content is inferred, not observed',
    'Whether any payload traversed the network boundary before the proxy denied the request',
    'Whether the deletion of the scratch notes file was deliberate or incidental',
    'Whether the operator acted alone or on behalf of another party',
    'Whether the temporary password issued under HD-44192 was disclosed beyond the requester',
  ],
  timezone: CASE_TZ_LABEL,
}
