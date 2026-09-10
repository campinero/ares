# OPERATION NIGHTFALL - internal build brief

Case ID `ARES-2026-0817`. Everything is fictional and synthetic. No real people,
companies, or criminal data. Organisation: **Meridian Dynamics** (fictional).
Project at risk: **HALCYON** (solid-state battery electrolyte research).

## Narrative ground truth (do NOT surface this in UI copy)

The IT contract technician **Dana Whitfield (PER-003)** processed a tier-1
password reset on Morgan Reed's account at 17:02:41, badged onto floor 4 at
23:33:41, logged into DEV-0042 **at the console** using Reed's credentials at
23:37:50 normalized, archived the HALCYON directory with `7z.exe` run from the
IT tools share, wrote the archive to a Kingston USB whose serial was first
enrolled on her own bench workstation WKS-0088, attempted an upload to
`vaultbridge-share.io` which the proxy **blocked**, deleted a scratch notes
file, logged off at 23:52:56 and left the floor at 23:59:07. The successful
exfiltration path was **removable media**, not the network.

Misdirection that must stay intact:
- Every on-host action is attributed to `morgan.reed` (account, not person).
- Reed had resigned and was offboarding - apparent motive.
- Reed badged **out** at 22:14:09 and her laptop held a VPN session from her home
  ISP at 23:38:26, 36 s after the console logon. She cannot be in both places.
- Avery Chen (PER-002) had an RDP session 23:12:07-23:29:40 under change
  CHG-8871 and attached a 2 TB drive to his own machine at 21:03:26. He ends
  before the window and his logon type is 10, not 2.
- Kelsey Nunes (PER-004) read the directory at 14:22:10, nine hours early.

## The clock problem

DEV-0042 ran **+192 s (3m12s) fast** versus NTP (W32Time event 37, 11 AUG).
- `hostClock: true` records were written by DEV-0042 and are stored NORMALIZED
  in the dataset; the UI adds the drift when the host basis is selected.
- `hostClock: false` records (proxy, DNS, VPN, badge, file server, AD, HR) are
  already correct.

Host-clock readings the investigator will see in host basis:
logon 23:41:02, USB insert 23:44:18, archiver 23:46:11, archive created
23:47:02, archive copied 23:48:17, browser 23:51:44, USB removed 23:54:11,
delete 23:55:00, logoff 23:56:08.

## Canonical identifiers

Persons: PER-001 Morgan Reed, PER-002 Avery Chen, PER-003 Dana Whitfield,
PER-004 Kelsey Nunes.
Accounts: ACC-001 morgan.reed, ACC-002 avery.chen, ACC-003 dana.whitfield,
ACC-004 kelsey.nunes, ACC-005 svc_backup.
Devices: DEV-0042 (subject workstation, 10.20.7.42), LAP-0117 (Reed laptop,
10.20.9.117), WKS-0088 (Whitfield bench, 10.20.4.88), WKS-0031 (Chen jump host,
10.20.4.31), SRV-CORE-03 (file server, 10.20.2.13), FW-EDGE-01 (proxy,
10.20.0.1), MOB-0231 (noise).
USB: USB-A1 Kingston 60A44C413786E2B1937C2A44 (pivot), USB-B2 SanDisk MREED
(red herring), USB-C3 Logitech receiver (noise), USB-D4 Seagate on WKS-0031
(alternative path), USB-E5 card reader (noise).
Events: EV-001..EV-033 in `src/data/events.ts`. Read it for exact wording.
Timestamps: import `T` from `src/data/clock.ts`. NEVER hardcode epoch numbers.

## External hosts used in the case

- `vaultbridge-share.io` / `cdn-sync.vaultbridge-share.io` - 203.0.113.47 (blocked)
- `update.meridian-dynamics.internal` - 10.20.2.44 (routine)
- `telemetry.northgate-msp.example` - 198.51.100.22 (contractor tooling, noise)
- Reed home ISP public address 74.83.112.19, VPN tunnel 100.64.12.31
All addresses are from RFC 5737 / RFC 6598 documentation ranges.

## Rules for every contributor

1. TypeScript strict. No `any`. Named exports only.
2. Import types from `@/data/types`. Import timestamps from `@/data/clock`.
3. Determinism: no `Math.random()`, no `Date.now()` in dataset modules.
4. Roughly one third of records must be irrelevant noise so the case requires
   real filtering, but noise must be plausible, never filler text.
5. Never write the ground truth above into user-visible strings.
