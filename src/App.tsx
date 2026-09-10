import { Suspense, lazy, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Panel, ProgressSweep } from '@/components/ui'
import { Sidebar } from '@/components/shell/Sidebar'
import { TopBar } from '@/components/shell/TopBar'
import { StatusRail } from '@/components/shell/StatusRail'
import { CommandPalette } from '@/components/shell/CommandPalette'
import { EvidenceInspector } from '@/components/inspector/EvidenceInspector'
import { useShortcuts } from '@/hooks/useShortcuts'
import { CaseOverview } from '@/views/CaseOverview'
import { Evidence } from '@/views/Evidence'
import { FileSystem } from '@/views/FileSystem'
import { HexViewer } from '@/views/HexViewer'
import { Strings } from '@/views/Strings'
import { Metadata } from '@/views/Metadata'
import { UsbDevices } from '@/views/UsbDevices'
import { Timeline } from '@/views/Timeline'
import { Persons } from '@/views/Persons'
import { Devices } from '@/views/Devices'
import { Hypotheses } from '@/views/Hypotheses'
import { ChainOfCustody } from '@/views/ChainOfCustody'

const BrowserArtifacts = lazy(() => import("@/views/BrowserArtifacts").then((m) => ({ default: m.BrowserArtifacts })))
const NetworkActivity = lazy(() => import("@/views/NetworkActivity").then((m) => ({ default: m.NetworkActivity })))
const EvidenceGraph = lazy(() => import("@/views/EvidenceGraph").then((m) => ({ default: m.EvidenceGraph })))
const Reconstruction = lazy(() => import("@/views/Reconstruction").then((m) => ({ default: m.Reconstruction })))
const ForensicReport = lazy(() => import("@/views/ForensicReport").then((m) => ({ default: m.ForensicReport })))

function ModuleLoading() {
  return (
    <Panel className="h-full">
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <ProgressSweep active />
        <p className="text-[11px] tracking-[0.14em] text-ink-4 uppercase">Loading module</p>
      </div>
    </Panel>
  )
}

export function App() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  useShortcuts()

  return (
    <div className="ares-vignette relative flex h-full flex-col bg-void">
      <div className="grid-field pointer-events-none absolute inset-0 opacity-[0.35]" />

      <TopBar collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />

      <div className="relative flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="flex min-h-0 flex-1 flex-col p-2"
          >
              <Suspense fallback={<ModuleLoading />}>
                <Routes location={location}>
                <Route path="/" element={<CaseOverview />} />
                <Route path="/evidence" element={<Evidence />} />
                <Route path="/filesystem" element={<FileSystem />} />
                <Route path="/hex" element={<HexViewer />} />
                <Route path="/strings" element={<Strings />} />
                <Route path="/metadata" element={<Metadata />} />
                <Route path="/browser" element={<BrowserArtifacts />} />
                <Route path="/usb" element={<UsbDevices />} />
                <Route path="/network" element={<NetworkActivity />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/graph" element={<EvidenceGraph />} />
                <Route path="/persons" element={<Persons />} />
                <Route path="/devices" element={<Devices />} />
                <Route path="/hypotheses" element={<Hypotheses />} />
                <Route path="/custody" element={<ChainOfCustody />} />
                <Route path="/reconstruction" element={<Reconstruction />} />
                <Route path="/report" element={<ForensicReport />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
          </motion.div>
        </main>

        <EvidenceInspector />
      </div>

      <StatusRail />
      <CommandPalette />
    </div>
  )
}
