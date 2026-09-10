/**
 * OPERATION NIGHTFALL - the case clock.
 *
 * Every timestamp in the dataset resolves through this module, so the narrative
 * cannot drift out of sync. Values are NORMALIZED (NTP-correct) case time in
 * US Eastern Daylight Time. Records written by DEV-0042 are flagged hostClock
 * and render +3m12s later when the investigator selects the host basis.
 */

import { parseTs } from '@/lib/time'

const t = (iso: string): number => parseTs(iso)

/** Named beats of the incident, normalized to NTP. */
export const T = {
  /* ------------------------------------------------------- prior activity */
  ntpSyncWarning: t('2026-08-11T03:14:56-04:00'),
  usbB2LastSeen: t('2026-08-11T16:22:38-04:00'),
  usbA1FirstSeen: t('2026-07-29T10:41:19-04:00'),
  halcyonReviewMeeting: t('2026-08-14T11:00:00-04:00'),
  resignationSubmitted: t('2026-08-14T16:31:00-04:00'),

  /* --------------------------------------------------- 2026-08-17 daytime */
  directorAccess: t('2026-08-17T14:22:10-04:00'),
  passwordResetTicket: t('2026-08-17T17:02:41-04:00'),
  reedSessionEnd: t('2026-08-17T20:55:00-04:00'),
  chenExternalDrive: t('2026-08-17T21:03:26-04:00'),
  reedHrEmail: t('2026-08-17T21:40:12-04:00'),
  reedBadgeExit: t('2026-08-17T22:14:09-04:00'),
  whitfieldChatLoaner: t('2026-08-17T22:58:12-04:00'),

  /* ---------------------------------------------- patch window (ruled out) */
  chenPatchChat: t('2026-08-17T23:10:02-04:00'),
  rdpSessionStart: t('2026-08-17T23:12:07-04:00'),
  rdpSessionEnd: t('2026-08-17T23:29:40-04:00'),

  /* ------------------------------------------------------ incident window */
  whitfieldBadgeEntry: t('2026-08-17T23:33:41-04:00'),
  consoleLogon: t('2026-08-17T23:37:50-04:00'),
  vpnConnect: t('2026-08-17T23:38:26-04:00'),
  explicitCredential: t('2026-08-17T23:40:11-04:00'),
  usbInsert: t('2026-08-17T23:41:06-04:00'),
  researchDirAccess: t('2026-08-17T23:42:04-04:00'),
  archiverLaunched: t('2026-08-17T23:42:59-04:00'),
  archiveCreated: t('2026-08-17T23:43:50-04:00'),
  archiveCopied: t('2026-08-17T23:45:05-04:00'),
  browserSession: t('2026-08-17T23:48:32-04:00'),
  proxyBlocked: t('2026-08-17T23:49:50-04:00'),
  usbRemoved: t('2026-08-17T23:50:59-04:00'),
  scratchDeleted: t('2026-08-17T23:51:48-04:00'),
  consoleLogoff: t('2026-08-17T23:52:56-04:00'),
  whitfieldBadgeExit: t('2026-08-17T23:59:07-04:00'),

  /* ---------------------------------------------------------- 2026-08-18+ */
  accountDisabled: t('2026-08-18T09:12:00-04:00'),
  dlpAlert: t('2026-08-18T09:48:00-04:00'),
  caseOpened: t('2026-08-18T10:40:00-04:00'),
  imageAcquiredDev0042: t('2026-08-18T14:12:00-04:00'),
  imageAcquiredLap0117: t('2026-08-18T16:35:00-04:00'),
  imageAcquiredWks0088: t('2026-08-19T09:05:00-04:00'),
  logsAcquired: t('2026-08-18T15:20:00-04:00'),
  usbB2Surrendered: t('2026-08-19T11:18:00-04:00'),
  analysisStart: t('2026-08-19T08:00:00-04:00'),
  interimReview: t('2026-08-21T13:00:00-04:00'),
} as const

export type CaseBeat = keyof typeof T

export const CASE_WINDOW = {
  /** Full span shown on the master timeline. */
  start: T.usbA1FirstSeen,
  end: T.interimReview,
  /** The 15-minute window the reconstruction focuses on. */
  incidentStart: T.consoleLogon,
  incidentEnd: T.consoleLogoff,
} as const
