import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { HardDrive, Link2, Usb } from 'lucide-react'
import { CASE, deviceById, personById } from '@/data'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs } from '@/lib/time'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FieldRow,
  Panel,
  PanelHeader,
  SectionLabel,
  SignificanceTag,
  Stat,
} from '@/components/ui'

const ACTION_TONE = {
  connected: 'text-cyan',
  mounted: 'text-jade',
  dismounted: 'text-amber',
  removed: 'text-signal',
} as const

export function UsbDevices() {
  const clockBasis = useCase((s) => s.clockBasis)
  const investigationMode = useCase((s) => s.investigationMode)
  const selectedUsbId = useCase((s) => s.selectedUsbId)
  const selectUsb = useCase((s) => s.selectUsb)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectDevice = useCase((s) => s.selectDevice)
  const navigate = useNavigate()

  const devices = useMemo(
    () => CASE.usbDevices.filter((u) => !investigationMode || u.significance !== 'noise'),
    [investigationMode],
  )

  const selected = selectedUsbId ? CASE.usbDevices.find((u) => u.id === selectedUsbId) ?? null : null

  /** Machines that hold an enrolment record for each serial. */
  const enrolments = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const usb of CASE.usbDevices) {
      const hosts = new Set<string>([usb.registeredToDeviceId])
      for (const mount of usb.mountEvents) hosts.add(mount.deviceId)
      map.set(usb.id, hosts)
    }
    return map
  }, [])

  const massStorage = CASE.usbDevices.filter((u) => u.capacityBytes > 0).length
  const crossMachine = CASE.usbDevices.filter((u) => (enrolments.get(u.id)?.size ?? 0) > 1).length

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <Panel>
          <Stat label="Enrolled devices" value={String(CASE.usbDevices.length)} icon={<Usb />} />
        </Panel>
        <Panel>
          <Stat label="Mass storage" value={String(massStorage)} hint={`${CASE.usbDevices.length - massStorage} peripheral`} icon={<HardDrive />} />
        </Panel>
        <Panel>
          <Stat
            label="Seen on 2+ hosts"
            value={String(crossMachine)}
            tone={crossMachine > 0 ? 'warn' : 'default'}
            hint="serial appears in more than one registry hive"
            icon={<Link2 />}
          />
        </Panel>
        <Panel>
          <Stat
            label="Recovered"
            value={`${CASE.usbDevices.filter((u) => u.id === 'USB-B2').length}/${massStorage}`}
            hint="physically seized and imaged"
            tone="warn"
          />
        </Panel>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(300px,340px)_minmax(0,1fr)] gap-2">
        <Panel className="min-h-0">
          <PanelHeader title="Removable media" icon={<Usb />} readout={`${devices.length} devices`} />
          <div className="min-h-0 flex-1 overflow-auto">
            {devices.length === 0 ? (
              <EmptyState title="No removable media in scope" hint="Investigation mode is hiding low-signal devices." />
            ) : (
              devices.map((usb) => {
                const active = usb.id === selectedUsbId
                const hosts = enrolments.get(usb.id)?.size ?? 1
                return (
                  <button
                    key={usb.id}
                    type="button"
                    onClick={() => selectUsb(usb.id)}
                    className={cn(
                      'relative flex w-full flex-col gap-1 border-b border-line/60 px-3 py-2 text-left transition-colors',
                      active ? 'bg-cyan/10' : 'hover:bg-panel-2',
                    )}
                  >
                    {active ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                    <div className="flex items-center gap-2">
                      <span className="tabular font-mono text-[11px] text-cyan">{usb.id}</span>
                      <SignificanceTag value={usb.significance} />
                      {hosts > 1 ? <Badge tone="amber">{hosts} hosts</Badge> : null}
                    </div>
                    <span className={cn('truncate text-[12px]', active ? 'text-ink' : 'text-ink-2')}>
                      {usb.vendor} {usb.product}
                    </span>
                    <span className="tabular truncate font-mono text-[10px] text-ink-4">{usb.serial}</span>
                    <span className="truncate text-[10px] text-ink-4">
                      {usb.capacityBytes ? `${formatBytes(usb.capacityBytes, 0)} ${usb.filesystem}` : 'no storage function'}
                      {usb.volumeLabel ? ` - ${usb.volumeLabel}` : ''}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </Panel>

        <Panel className="min-h-0" lit>
          <PanelHeader
            title={selected ? `${selected.vendor} ${selected.product}` : 'Device detail'}
            subtitle={selected ? selected.serial : undefined}
            readout={selected?.id}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {!selected ? (
              <EmptyState
                title="No device selected"
                hint="Choose a removable device to review its enrolment history, mount events and the files referenced from it."
                icon={<Usb />}
              />
            ) : (
              <div className="flex flex-col gap-3 p-3">
                <SectionLabel>Identification</SectionLabel>
                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Vendor" value={selected.vendor} />
                  <FieldRow label="Product" value={selected.product} />
                  <FieldRow label="Serial" value={selected.serial} mono />
                  <FieldRow label="VID:PID" value={`${selected.vendorId}:${selected.productId}`} mono />
                  <FieldRow
                    label="Capacity"
                    value={selected.capacityBytes ? formatBytes(selected.capacityBytes, 0) : 'not a storage device'}
                    mono
                  />
                  <FieldRow label="Filesystem" value={selected.filesystem} />
                  <FieldRow label="Volume label" value={selected.volumeLabel || 'none'} mono />
                  <FieldRow label="First connected" value={formatTs(selected.firstConnected)} mono />
                  <FieldRow label="Last connected" value={formatTs(selected.lastConnected)} mono />
                  <FieldRow
                    label="Enrolled on"
                    value={deviceById.get(selected.registeredToDeviceId)?.name ?? selected.registeredToDeviceId}
                  />
                  <FieldRow
                    label="Associated person"
                    value={
                      selected.associatedPersonId
                        ? personById.get(selected.associatedPersonId)?.name ?? selected.associatedPersonId
                        : 'not attributed'
                    }
                  />
                </dl>

                <SectionLabel>Cross-machine enrolment</SectionLabel>
                <div className="rounded-[2px] border border-line">
                  <p className="border-b border-line/60 px-3 py-1.5 text-[11px] leading-relaxed text-ink-4">
                    Hosts whose registry or event records carry this serial. A serial present on more than one machine
                    links those machines; it does not by itself establish who was holding the device.
                  </p>
                  {[...(enrolments.get(selected.id) ?? new Set<string>())].map((hostId) => {
                    const host = deviceById.get(hostId)
                    return (
                      <button
                        key={hostId}
                        type="button"
                        onClick={() => {
                          selectDevice(hostId)
                          navigate('/devices')
                        }}
                        className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-panel-2"
                      >
                        <span className="tabular w-[92px] shrink-0 font-mono text-[10px] text-cyan">{hostId}</span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
                          {host?.name ?? 'unknown host'}
                        </span>
                        <span className="hidden shrink-0 text-[10px] text-ink-4 xl:block">
                          {host?.ownerId ? personById.get(host.ownerId)?.name : 'unassigned'}
                        </span>
                        {hostId === selected.registeredToDeviceId ? <Badge tone="cyan">first enrolment</Badge> : null}
                      </button>
                    )
                  })}
                </div>

                <SectionLabel>Mount events</SectionLabel>
                <div className="rounded-[2px] border border-line">
                  {selected.mountEvents.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-ink-4">
                      No mount transition recorded. This device exposes no mass storage function.
                    </p>
                  ) : (
                    [...selected.mountEvents]
                      .sort((a, b) => a.at - b.at)
                      .map((mount, index) => (
                        <div
                          key={`${mount.at}-${index}`}
                          className="flex items-center gap-2.5 border-b border-line/60 px-3 py-1.5 last:border-0"
                        >
                          <span
                            className={cn(
                              'w-[86px] shrink-0 text-[10px] font-semibold tracking-[0.1em] uppercase',
                              ACTION_TONE[mount.action],
                            )}
                          >
                            {mount.action}
                          </span>
                          <span className="tabular w-[132px] shrink-0 font-mono text-[11px] text-ink-2">
                            {formatTs(displayTs(mount.at, clockBasis, mount.hostClock))}
                          </span>
                          <span className="tabular w-[86px] shrink-0 font-mono text-[10px] text-ink-4">
                            {mount.deviceId}
                          </span>
                          <span className="tabular w-8 shrink-0 font-mono text-[11px] text-ink-3">
                            {mount.driveLetter}
                          </span>
                          {mount.hostClock ? <Badge tone="amber">host clock</Badge> : null}
                          <div className="flex-1" />
                          {mount.evidenceId ? (
                            <button
                              type="button"
                              onClick={() => selectEvidence(mount.evidenceId as string)}
                              className="font-mono text-[10px] text-cyan hover:underline"
                            >
                              {mount.evidenceId}
                            </button>
                          ) : null}
                        </div>
                      ))
                  )}
                </div>

                <SectionLabel>Files referenced from this volume</SectionLabel>
                <ul className="rounded-[2px] border border-line">
                  {selected.filesAccessed.length === 0 ? (
                    <li className="px-3 py-2 text-[11px] text-ink-4">No file reference recovered for this device.</li>
                  ) : (
                    selected.filesAccessed.map((path) => (
                      <li
                        key={path}
                        className="tabular border-b border-line/60 px-3 py-1.5 font-mono text-[11px] text-ink-2 last:border-0"
                      >
                        {path}
                      </li>
                    ))
                  )}
                </ul>

                <div className="mb-3 rounded-[2px] border border-line bg-panel-2/50 px-3 py-2">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-ink-4 uppercase">Examiner note</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{selected.notes}</p>
                </div>

                <Button onClick={() => navigate('/timeline')}>Open removable media events in timeline</Button>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
