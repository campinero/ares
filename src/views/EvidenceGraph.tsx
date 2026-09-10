import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Focus, GitBranch, Layers, RotateCcw, Waypoints } from 'lucide-react'
import { CASE, entityById, evidenceById, relationsForEntity } from '@/data'
import type { EntityKind, RelationKind } from '@/data/types'
import { EntityNode, type EntityFlowNode } from '@/components/graph/EntityNode'
import {
  KIND_META,
  KIND_ORDER,
  RELATION_ORDER,
  relationColor,
  relationLabel,
  relationWidth,
} from '@/components/graph/kinds'
import { layoutGraph } from '@/components/graph/layout'
import { useCase } from '@/store/useCase'
import { formatTs } from '@/lib/time'
import { cn } from '@/lib/cn'
import {
  Badge,
  Button,
  EmptyState,
  FieldRow,
  FilterChip,
  IconButton,
  Panel,
  PanelHeader,
  SearchInput,
  SectionLabel,
  Toolbar,
} from '@/components/ui'

const NODE_TYPES = { entity: EntityNode }

export function EvidenceGraph() {
  return (
    <ReactFlowProvider>
      <GraphWorkspace />
    </ReactFlowProvider>
  )
}

function GraphWorkspace() {
  const investigationMode = useCase((s) => s.investigationMode)
  const selectedEntityId = useCase((s) => s.selectedEntityId)
  const selectEntity = useCase((s) => s.selectEntity)
  const selectEvidence = useCase((s) => s.selectEvidence)
  const selectedEvidenceId = useCase((s) => s.selectedEvidenceId)
  const selectEvent = useCase((s) => s.selectEvent)
  const selectPerson = useCase((s) => s.selectPerson)
  const selectDevice = useCase((s) => s.selectDevice)
  const navigate = useNavigate()
  const flow = useReactFlow()

  const [kinds, setKinds] = useState<Set<EntityKind>>(new Set())
  const [relationKinds, setRelationKinds] = useState<Set<RelationKind>>(new Set())
  const [query, setQuery] = useState('')
  const [isolated, setIsolated] = useState<string | null>(null)
  const [hops, setHops] = useState(1)
  const [layoutKey, setLayoutKey] = useState(0)

  /* ---------------------------------------------------------- filtering */

  const baseEntities = useMemo(
    () =>
      CASE.entities.filter((entity) => {
        if (investigationMode && entity.significance === 'noise') return false
        if (kinds.size > 0 && !kinds.has(entity.kind)) return false
        return true
      }),
    [investigationMode, kinds],
  )

  const isolationSet = useMemo(() => {
    if (!isolated) return null
    const keep = new Set<string>([isolated])
    let frontier = new Set<string>([isolated])
    for (let hop = 0; hop < hops; hop++) {
      const next = new Set<string>()
      for (const id of frontier) {
        for (const relation of relationsForEntity(id)) {
          const other = relation.source === id ? relation.target : relation.source
          if (!keep.has(other)) {
            keep.add(other)
            next.add(other)
          }
        }
      }
      frontier = next
      if (frontier.size === 0) break
    }
    return keep
  }, [isolated, hops])

  const visibleEntities = useMemo(
    () => (isolationSet ? baseEntities.filter((e) => isolationSet.has(e.id)) : baseEntities),
    [baseEntities, isolationSet],
  )

  const visibleIds = useMemo(() => new Set(visibleEntities.map((e) => e.id)), [visibleEntities])

  const visibleRelations = useMemo(
    () =>
      CASE.relations.filter((relation) => {
        if (!visibleIds.has(relation.source) || !visibleIds.has(relation.target)) return false
        if (relationKinds.size > 0 && !relationKinds.has(relation.kind)) return false
        return true
      }),
    [visibleIds, relationKinds],
  )

  /* ------------------------------------------------------ highlight hops */

  const neighbourhood = useMemo(() => {
    // An artifact selected anywhere in the application lights the entities it
    // evidences, so the chart answers "what does this artifact actually prove".
    if (!selectedEntityId && selectedEvidenceId) {
      const touched = new Map<string, number>()
      // The artifact may itself be a node on the chart...
      for (const entity of visibleEntities) {
        if (entity.refId === selectedEvidenceId) touched.set(entity.id, 0)
      }
      // ...and it justifies relations between other entities.
      for (const relation of visibleRelations) {
        if (!relation.evidenceIds.includes(selectedEvidenceId)) continue
        touched.set(relation.source, 0)
        touched.set(relation.target, 0)
      }
      // One hop out, so the artifact is shown in the context it speaks to.
      const seeds = [...touched.keys()]
      for (const relation of visibleRelations) {
        if (seeds.includes(relation.source) && !touched.has(relation.target)) touched.set(relation.target, 1)
        if (seeds.includes(relation.target) && !touched.has(relation.source)) touched.set(relation.source, 1)
      }
      return touched.size > 0 ? touched : null
    }
    if (!selectedEntityId) return null
    const distance = new Map<string, number>([[selectedEntityId, 0]])
    let frontier = [selectedEntityId]
    for (let hop = 1; hop <= hops; hop++) {
      const next: string[] = []
      for (const id of frontier) {
        for (const relation of visibleRelations) {
          if (relation.source !== id && relation.target !== id) continue
          const other = relation.source === id ? relation.target : relation.source
          if (!distance.has(other)) {
            distance.set(other, hop)
            next.push(other)
          }
        }
      }
      frontier = next
      if (frontier.length === 0) break
    }
    return distance
  }, [selectedEntityId, selectedEvidenceId, visibleEntities, visibleRelations, hops])

  const degrees = useMemo(() => {
    const map = new Map<string, number>()
    for (const relation of visibleRelations) {
      map.set(relation.source, (map.get(relation.source) ?? 0) + 1)
      map.set(relation.target, (map.get(relation.target) ?? 0) + 1)
    }
    return map
  }, [visibleRelations])

  const positions = useMemo(
    () => layoutGraph(CASE.entities, CASE.relations),
    // layoutKey lets the reset control recompute the deterministic layout
    // after the investigator has dragged nodes around.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layoutKey],
  )

  const computedNodes = useMemo<EntityFlowNode[]>(
    () =>
      visibleEntities.map((entity) => {
        const point = positions.get(entity.id) ?? { x: 0, y: 0 }
        const hop = neighbourhood?.get(entity.id) ?? null
        return {
          id: entity.id,
          type: 'entity',
          position: point,
          selected: entity.id === selectedEntityId,
          data: {
            entity,
            dimmed: neighbourhood !== null && hop === null,
            hop,
            degree: degrees.get(entity.id) ?? 0,
            focused: entity.id === selectedEntityId,
          },
        }
      }),
    [visibleEntities, positions, neighbourhood, degrees, selectedEntityId],
  )

  const showEdgeLabels = visibleRelations.length <= 34 || neighbourhood !== null

  const computedEdges = useMemo<Edge[]>(
    () =>
      visibleRelations.map((relation) => {
        const source = entityById.get(relation.source)
        const target = entityById.get(relation.target)
        const inHighlight =
          neighbourhood === null ||
          (neighbourhood.has(relation.source) && neighbourhood.has(relation.target))
        return {
          id: relation.id,
          source: relation.source,
          target: relation.target,
          type: 'straight',
          label: showEdgeLabels ? relationLabel(relation.kind) : undefined,
          animated: inHighlight && relation.weight >= 3 && neighbourhood !== null,
          style: {
            stroke: relationColor(
              source?.significance ?? 'low',
              target?.significance ?? 'low',
              relation.weight,
            ),
            strokeWidth: relationWidth(relation.weight),
            opacity: inHighlight ? 0.9 : 0.12,
          },
          labelStyle: {
            fill: inHighlight ? '#6a7f96' : '#2a3b4e',
            fontSize: 9,
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '0.06em',
          },
          labelBgStyle: { fill: '#070a10', fillOpacity: inHighlight ? 0.85 : 0.3 },
          labelBgPadding: [3, 1] as [number, number],
        }
      }),
    [visibleRelations, neighbourhood, showEdgeLabels],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<EntityFlowNode>(computedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(computedEdges)

  useEffect(() => setNodes(computedNodes), [computedNodes, setNodes])
  useEffect(() => setEdges(computedEdges), [computedEdges, setEdges])

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_event, node) => selectEntity(node.id === selectedEntityId ? null : node.id),
    [selectEntity, selectedEntityId],
  )

  function runSearch(next: string) {
    setQuery(next)
    const q = next.trim().toLowerCase()
    if (!q) return
    const hit = visibleEntities.find((e) => e.label.toLowerCase().includes(q))
    if (hit) {
      selectEntity(hit.id)
      const point = positions.get(hit.id)
      if (point) flow.setCenter(point.x + 70, point.y + 24, { zoom: 1.1, duration: 320 })
    }
  }

  const selected = selectedEntityId ? entityById.get(selectedEntityId) : undefined
  const selectedRelations = selectedEntityId ? relationsForEntity(selectedEntityId) : []

  function toggle<T>(set: Set<T>, value: T, apply: (next: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    apply(next)
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(296px,340px)] gap-2">
      <Panel className="min-h-0" lit>
        <PanelHeader
          title="Evidence graph"
          icon={<GitBranch />}
          subtitle="Entities and the relations the evidence actually supports"
          readout={`${nodes.length}/${CASE.entities.length} nodes - ${edges.length}/${CASE.relations.length} edges`}
          actions={
            <>
              <IconButton
                label={`Highlight depth ${hops} hop${hops > 1 ? 's' : ''}`}
                onClick={() => setHops((h) => (h >= 3 ? 1 : h + 1))}
              >
                <Waypoints />
              </IconButton>
              <IconButton
                label={isolated ? 'Clear isolation' : 'Isolate selected node'}
                active={Boolean(isolated)}
                disabled={!isolated && !selectedEntityId}
                onClick={() => setIsolated(isolated ? null : selectedEntityId)}
              >
                <Focus />
              </IconButton>
              <IconButton
                label="Reset graph"
                onClick={() => {
                  setKinds(new Set())
                  setRelationKinds(new Set())
                  setIsolated(null)
                  setQuery('')
                  setHops(1)
                  selectEntity(null)
                  setLayoutKey((k) => k + 1)
                  window.setTimeout(() => flow.fitView({ duration: 320, padding: 0.16 }), 30)
                }}
              >
                <RotateCcw />
              </IconButton>
            </>
          }
        />

        <Toolbar>
          <SearchInput value={query} onChange={runSearch} placeholder="Find entity" className="w-52" />
          <span className="text-[10px] tracking-[0.1em] text-ink-4 uppercase">Trace depth {hops}</span>
          {isolated ? (
            <Badge tone="cyan">isolated: {entityById.get(isolated)?.label ?? isolated}</Badge>
          ) : null}
          <div className="flex-1" />
          <Layers className="size-3.5 text-ink-4" />
          {KIND_ORDER.map((kind) => {
            const count = CASE.entities.filter((e) => e.kind === kind).length
            if (count === 0) return null
            return (
              <FilterChip
                key={kind}
                active={kinds.has(kind)}
                onClick={() => toggle(kinds, kind, setKinds)}
                count={count}
                tone={KIND_META[kind].accent}
              >
                {KIND_META[kind].label}
              </FilterChip>
            )
          })}
        </Toolbar>

        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line bg-abyss/30 px-3 py-1.5">
          {RELATION_ORDER.map((kind) => {
            const count = CASE.relations.filter((r) => r.kind === kind).length
            if (count === 0) return null
            return (
              <FilterChip
                key={kind}
                active={relationKinds.has(kind)}
                onClick={() => toggle(relationKinds, kind, setRelationKinds)}
                count={count}
              >
                {relationLabel(kind)}
              </FilterChip>
            )
          })}
        </div>

        <div className="min-h-0 flex-1">
          {nodes.length === 0 ? (
            <EmptyState
              title="No entity matches the current filter"
              hint="Clear a node-kind facet, or reset the graph, to bring the chart back."
              icon={<GitBranch />}
              action={
                <Button
                  onClick={() => {
                    setKinds(new Set())
                    setRelationKinds(new Set())
                    setIsolated(null)
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={() => selectEntity(null)}
              onInit={(instance) => instance.setCenter(0, 0, { zoom: 0.78 })}
              fitViewOptions={{ padding: 0.16 }}
              minZoom={0.15}
              maxZoom={2.4}
              proOptions={{ hideAttribution: true }}
              colorMode="dark"
              className="bg-void"
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#16202c" />
              <Controls
                showInteractive={false}
                className="!border !border-line !bg-panel [&_button]:!border-line [&_button]:!bg-panel-2 [&_button]:!fill-ink-3 [&_button:hover]:!bg-panel-3"
              />
              <MiniMap
                pannable
                zoomable
                className="!border !border-line !bg-abyss"
                maskColor="rgba(4,6,10,0.78)"
                nodeColor={(node) => {
                  const entity = entityById.get(node.id)
                  return entity ? KIND_META[entity.kind].accent : '#2a3b4e'
                }}
              />
            </ReactFlow>
          )}
        </div>
      </Panel>

      <Panel className="min-h-0">
        <PanelHeader
          title={selected ? selected.label : 'Node inspector'}
          subtitle={selected ? KIND_META[selected.kind].label : 'Nothing selected'}
          readout={selected ? `${selectedRelations.length} relations` : undefined}
        />
        <div className="min-h-0 flex-1 overflow-auto">
          {!selected ? (
            <div>
              <EmptyState
                title="No node selected"
                hint="Click a node to trace what the evidence connects it to. Selecting also dims everything outside the highlight neighbourhood."
                icon={<GitBranch />}
              />
              <SectionLabel>Legend</SectionLabel>
              <div className="flex flex-col gap-1 px-3 pb-4">
                {KIND_ORDER.map((kind) => {
                  const meta = KIND_META[kind]
                  const Icon = meta.icon
                  const count = CASE.entities.filter((e) => e.kind === kind).length
                  if (count === 0) return null
                  return (
                    <div key={kind} className="flex items-center gap-2 text-[11px] text-ink-3">
                      <span
                        className="flex size-5 items-center justify-center rounded-[2px] border"
                        style={{ borderColor: meta.accent, color: meta.accent }}
                      >
                        <Icon className="size-3" />
                      </span>
                      <span className="flex-1">{meta.label}</span>
                      <span className="tabular font-mono text-[10px] text-ink-4">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-3">
              <dl className="rounded-[2px] border border-line">
                <FieldRow label="Kind" value={KIND_META[selected.kind].label} />
                {selected.sublabel ? <FieldRow label="Descriptor" value={selected.sublabel} /> : null}
                <FieldRow label="Significance" value={selected.significance} />
                <FieldRow label="Confidence" value={`${(selected.confidence * 100).toFixed(0)}%`} mono />
                {selected.detail.map((row) => (
                  <FieldRow key={row.label} label={row.label} value={row.value} mono />
                ))}
              </dl>

              <div className="flex flex-wrap gap-1.5">
                <Button
                  onClick={() => setIsolated(isolated === selected.id ? null : selected.id)}
                  tone={isolated === selected.id ? 'primary' : 'default'}
                >
                  <Focus />
                  {isolated === selected.id ? 'Clear isolation' : 'Isolate'}
                </Button>
                {selected.refId ? (
                  <Button
                    tone="primary"
                    onClick={() => {
                      const ref = selected.refId as string
                      if (ref.startsWith('ARES-E-')) {
                        selectEvidence(ref)
                      } else if (ref.startsWith('EV-')) {
                        selectEvent(ref)
                        navigate('/timeline')
                      } else if (ref.startsWith('PER-')) {
                        selectPerson(ref)
                        navigate('/persons')
                      } else if (ref.startsWith('USB-')) {
                        navigate('/usb')
                      } else {
                        selectDevice(ref)
                        navigate('/devices')
                      }
                    }}
                  >
                    Open record
                  </Button>
                ) : null}
              </div>

              <SectionLabel>Relations</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {selectedRelations.length === 0 ? (
                  <p className="text-[11px] text-ink-4">No relation touches this entity.</p>
                ) : (
                  selectedRelations.map((relation) => {
                    const otherId = relation.source === selected.id ? relation.target : relation.source
                    const other = entityById.get(otherId)
                    const outbound = relation.source === selected.id
                    return (
                      <div key={relation.id} className="rounded-[2px] border border-line bg-panel-2/40 px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] tracking-[0.08em] text-cyan">
                            {relationLabel(relation.kind)}
                          </span>
                          <span className="text-[10px] text-ink-4">{outbound ? 'to' : 'from'}</span>
                          <button
                            type="button"
                            onClick={() => selectEntity(otherId)}
                            className="min-w-0 flex-1 truncate text-left text-[11px] text-ink-2 hover:text-cyan"
                          >
                            {other?.label ?? otherId}
                          </button>
                          <span className="tabular shrink-0 font-mono text-[10px] text-ink-4">w{relation.weight}</span>
                        </div>
                        {relation.at ? (
                          <p className="tabular mt-0.5 font-mono text-[10px] text-ink-4">{formatTs(relation.at)}</p>
                        ) : null}
                        {relation.note ? (
                          <p className="mt-0.5 text-[10px] leading-relaxed text-ink-4">{relation.note}</p>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {relation.evidenceIds.map((id) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => selectEvidence(id)}
                              title={evidenceById.get(id)?.label}
                              className={cn(
                                'rounded-[2px] border border-line px-1.5 py-[1px] font-mono text-[9px] text-ink-4',
                                'hover:border-cyan/40 hover:text-cyan',
                              )}
                            >
                              {id}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>
    </div>
  )
}
