import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Cpu, HardDrive, Usb } from 'lucide-react'
import { CASE, evidenceForDevice, personById } from '@/data'
import { useCase } from '@/store/useCase'
import { displayTs, formatTs, HOST_CLOCK_DRIFT_SECONDS } from '@/lib/time'
import { formatBytes } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FieldRow,
  Panel,
  PanelHeader,
  SEVERITY_TONE,
  SectionLabel,
  SeverityDot,
  SignificanceTag,
  Stat,
} from '@/components/ui'

export function Devices() {
  const clockBasis = useCase((s) => s.clockBasis)
  const selectedDeviceId = useCase((s) => s.selectedDeviceId)
  const selectDevice = useCase((s) => s.selectDevice)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectEvent = useCase((s) => s.selectEvent)
  const selectUsb = useCase((s) => s.selectUsb)
  const navigate = useNavigate()

  const selected = selectedDeviceId ? CASE.devices.find((d) => d.id === selectedDeviceId) ?? null : null

  const evidence = useMemo(() => (selected ? evidenceForDevice(selected.id) : []), [selected])
  const events = useMemo(
    () => (selected ? CASE.events.filter((e) => e.deviceId === selected.id) : []),
    [selected],
  )
  const usbDevices = useMemo(
    () => (selected ? CASE.usbDevices.filter((u) => u.registeredToDeviceId === selected.id) : []),
    [selected],
  )

  const drifted = CASE.devices.filter((d) => d.clockDriftSeconds !== 0).length
  const imaged = CASE.devices.filter((d) => d.imaged).length

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <Panel>
          <Stat label="Devices" value={String(CASE.devices.length)} icon={<Cpu />} />
        </Panel>
        <Panel>
          <Stat label="Imaged" value={`${imaged}/${CASE.devices.length}`} tone="good" icon={<HardDrive />} />
        </Panel>
        <Panel>
          <Stat label="Logs only" value={String(CASE.devices.length - imaged)} />
        </Panel>
        <Panel>
          <Stat
            label="Clock drift"
            value={String(drifted)}
            hint={drifted > 0 ? 'requires normalisation' : 'all in sync'}
            tone={drifted > 0 ? 'warn' : 'good'}
            icon={<AlertTriangle />}
          />
        </Panel>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(292px,332px)_minmax(0,1fr)] gap-2">
        <Panel className="min-h-0">
          <PanelHeader title="Device inventory" icon={<Cpu />} readout={`${CASE.devices.length} devices`} />
          <div className="min-h-0 flex-1 overflow-auto">
            {CASE.devices.map((device) => {
              const active = device.id === selectedDeviceId
              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => selectDevice(device.id)}
                  className={cn(
                    'relative flex w-full flex-col gap-1 border-b border-line/60 px-3 py-2 text-left transition-colors',
                    active ? 'bg-cyan/10' : 'hover:bg-panel-2',
                  )}
                >
                  {active ? <span className="absolute inset-y-0 left-0 w-[2px] bg-cyan" /> : null}
                  <div className="flex items-center gap-2">
                    <span className="tabular font-mono text-[11px] text-cyan">{device.id}</span>
                    <SignificanceTag value={device.significance} />
                    {device.clockDriftSeconds !== 0 ? <Badge tone="amber">drift</Badge> : null}
                  </div>
                  <span className={cn('truncate text-[12px]', active ? 'text-ink' : 'text-ink-2')}>{device.name}</span>
                  <span className="truncate text-[10px] text-ink-4">
                    {device.kind} - {device.ip} - {device.imaged ? 'imaged' : 'logs only'}
                  </span>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel className="min-h-0" lit>
          <PanelHeader
            title={selected ? selected.name : 'Device detail'}
            subtitle={selected ? `${selected.kind} - ${selected.location}` : undefined}
            readout={selected?.id}
          />
          <div className="min-h-0 flex-1 overflow-auto">
            {!selected ? (
              <EmptyState
                title="No device selected"
                hint="Choose a device to review its acquisition record, clock integrity, and the artifacts collected from it."
                icon={<Cpu />}
              />
            ) : (
              <div className="flex flex-col gap-3 p-3">
                {selected.clockDriftSeconds !== 0 ? (
                  <div className="rounded-[2px] border border-amber/35 bg-amber/[0.07] px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 text-amber" />
                      <span className="text-[10px] font-semibold tracking-[0.14em] text-amber uppercase">
                        Clock integrity
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                      This host ran{' '}
                      <span className="tabular font-mono text-amber">
                        +{selected.clockDriftSeconds} s
                      </span>{' '}
                      against the domain time source, measured at acquisition. Every timestamp written by this device -
                      filesystem MACB values, security and system event records, browser history - carries that offset.
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-ink-3">
                      Consequence: a host record and an externally sourced record that appear{' '}
                      {Math.floor(selected.clockDriftSeconds / 60)}m{selected.clockDriftSeconds % 60}s apart may in fact
                      be simultaneous. Reconcile before ordering events from mixed sources. ARES stores these
                      timestamps normalised and re-applies the offset only when the host basis is selected.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[2px] border border-jade/25 bg-jade/[0.05] px-3 py-2">
                    <p className="text-[11px] text-ink-2">
                      Clock measured in sync with the domain time source at acquisition. Timestamps from this device
                      need no normalisation.
                    </p>
                  </div>
                )}

                <SectionLabel>Hardware and acquisition</SectionLabel>
                <dl className="rounded-[2px] border border-line">
                  <FieldRow label="Device ID" value={selected.id} mono />
                  <FieldRow label="Hostname" value={selected.name} mono />
                  <FieldRow label="Kind" value={selected.kind} />
                  <FieldRow label="Operating system" value={selected.os} />
                  <FieldRow label="Serial" value={selected.serial} mono />
                  <FieldRow label="IP address" value={selected.ip} mono />
                  <FieldRow label="MAC" value={selected.mac} mono />
                  <FieldRow label="Location" value={selected.location} />
                  <FieldRow
                    label="Owner"
                    value={selected.ownerId ? personById.get(selected.ownerId)?.name ?? selected.ownerId : 'unassigned'}
                  />
                  <FieldRow label="Custodian" value={selected.custodian} />
                  <FieldRow label="Encryption" value={selected.encryption} />
                  <FieldRow
                    label="Acquisition"
                    value={
                      selected.imaged ? (
                        <span className="text-jade">imaged{selected.imageId ? ` - ${selected.imageId}` : ''}</span>
                      ) : (
                        <span className="text-amber">not seized - logs only</span>
                      )
                    }
                  />
                  <FieldRow label="Last seen" value={formatTs(selected.lastSeen)} mono />
                  <FieldRow
                    label="Clock drift"
                    value={
                      selected.clockDriftSeconds === 0
                        ? 'none measured'
                        : `+${selected.clockDriftSeconds} s (reference ${HOST_CLOCK_DRIFT_SECONDS} s)`
                    }
                    mono
                  />
                </dl>

                <div className="rounded-[2px] border border-line bg-panel-2/50 px-3 py-2">
                  <p className="text-[10px] font-semibold tracking-[0.12em] text-ink-4 uppercase">Examiner note</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-2">{selected.notes}</p>
                </div>

                {usbDevices.length > 0 ? (
                  <>
                    <SectionLabel>Removable media enrolled on this host</SectionLabel>
                    <div className="rounded-[2px] border border-line">
                      {usbDevices.map((usb) => (
                        <button
                          key={usb.id}
                          type="button"
                          onClick={() => {
                            selectUsb(usb.id)
                            navigate('/usb')
                          }}
                          className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-panel-2"
                        >
                          <Usb className="size-3.5 shrink-0 text-ink-4" />
                          <span className="tabular w-[70px] shrink-0 font-mono text-[10px] text-cyan">{usb.id}</span>
                          <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
                            {usb.vendor} {usb.product}
                          </span>
                          <span className="tabular hidden shrink-0 font-mono text-[10px] text-ink-4 xl:block">
                            {usb.capacityBytes ? formatBytes(usb.capacityBytes, 0) : 'no storage'}
                          </span>
                          <SignificanceTag value={usb.significance} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                <SectionLabel>Evidence collected from this device</SectionLabel>
                <div className="rounded-[2px] border border-line">
                  {evidence.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-ink-4">No artifact in the case file is attributed to this device.</p>
                  ) : (
                    evidence.map((artifact) => (
                      <button
                        key={artifact.id}
                        type="button"
                        onClick={() => selectEvidence(artifact.id)}
                        className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-panel-2"
                      >
                        <span className="tabular w-[104px] shrink-0 font-mono text-[10px] text-cyan">{artifact.id}</span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{artifact.label}</span>
                        <span className="hidden w-[150px] shrink-0 truncate text-[10px] text-ink-4 xl:block">
                          {artifact.type}
                        </span>
                        <SignificanceTag value={artifact.significance} />
                      </button>
                    ))
                  )}
                </div>

                <SectionLabel>Events attributed to this device</SectionLabel>
                <div className="mb-3 rounded-[2px] border border-line">
                  {events.length === 0 ? (
                    <p className="px-3 py-2 text-[11px] text-ink-4">No event in the case file names this device.</p>
                  ) : (
                    events.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          selectEvent(event.id)
                          navigate('/timeline')
                        }}
                        className="flex w-full items-center gap-2.5 border-b border-line/60 px-3 py-1.5 text-left last:border-0 hover:bg-panel-2"
                      >
                        <SeverityDot severity={event.severity} />
                        <span className="tabular w-[132px] shrink-0 font-mono text-[11px] text-ink-3">
                          {formatTs(displayTs(event.at, clockBasis, event.hostClock))}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{event.title}</span>
                        <Badge tone={SEVERITY_TONE[event.severity]}>{event.severity}</Badge>
                      </button>
                    ))
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pb-2">
                  {selected.imageId ? (
                    <Button tone="primary" onClick={() => selectEvidence(selected.imageId as string)}>
                      Open acquisition image
                    </Button>
                  ) : null}
                  <Button onClick={() => navigate('/timeline')}>Open timeline</Button>
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}
