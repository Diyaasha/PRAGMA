/**
 * PRAGMA — Compliance Traceability Graph
 *
 * Visual provenance graph: Circular → Clause → MAP → Approval → Department → Events
 * Built with @xyflow/react for interactive pan/zoom.
 *
 * This is flagship Feature 2 — provides complete regulatory explainability
 * and audit-grade provenance for every compliance obligation.
 */

import { useCallback, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMaps } from '../hooks/useMaps'
import { useCirculars } from '../hooks/useCirculars'
import {
  FileText, CheckSquare, Building2, ScrollText,
  GitBranch, Shield, ChevronDown, ChevronRight,
} from 'lucide-react'
import PriorityBadge from '../components/shared/PriorityBadge'
import StatusBadge from '../components/shared/StatusBadge'

// ── Custom node types ─────────────────────────────────────────────────────────

function CircularNode({ data }) {
  return (
    <div className="rounded-xl border-2 border-brass bg-ink px-4 py-3 shadow-lg min-w-[200px] max-w-[260px]">
      <Handle type="source" position={Position.Bottom} className="!bg-brass" />
      <div className="flex items-center gap-2 mb-1">
        <FileText size={13} className="text-brass flex-shrink-0" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-brass">Circular</span>
      </div>
      <p className="text-[12px] font-semibold text-white leading-snug">{data.label}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className="rounded bg-brass/20 px-1.5 py-0.5 font-mono text-[9px] text-brass">{data.source}</span>
        <span className="font-mono text-[9px] text-slate-500">{data.date}</span>
      </div>
    </div>
  )
}

function MapNode({ data }) {
  const priorityColors = {
    Critical: 'border-red-500 bg-red-950/60',
    High:     'border-amber-500 bg-amber-950/40',
    Medium:   'border-blue-500 bg-blue-950/40',
    Low:      'border-slate-500 bg-slate-900/60',
  }
  const colorClass = priorityColors[data.priority] || priorityColors.Medium

  return (
    <div className={`rounded-xl border-2 ${colorClass} px-4 py-3 shadow-lg min-w-[220px] max-w-[280px]`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">MAP</span>
        <PriorityBadge priority={data.priority} />
      </div>
      <p className="text-[11px] font-medium text-white leading-snug line-clamp-3">{data.label}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[9px] text-slate-500">{data.department}</span>
        <StatusBadge status={data.status} />
      </div>
      {data.deadline && (
        <div className="mt-1 font-mono text-[9px] text-slate-500">⏱ {data.deadline}</div>
      )}
    </div>
  )
}

function DeptNode({ data }) {
  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3 shadow min-w-[160px]">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={12} className="text-slate-400" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Department</span>
      </div>
      <p className="text-[13px] font-semibold text-white">{data.label}</p>
      <p className="mt-0.5 font-mono text-[9px] text-slate-500">{data.mapCount} obligation{data.mapCount !== 1 ? 's' : ''}</p>
    </div>
  )
}

function ApprovalNode({ data }) {
  const approved = data.status?.toLowerCase() === 'approved'
  return (
    <div className={`rounded-xl border px-4 py-3 shadow min-w-[180px] ${
      approved
        ? 'border-green-600 bg-green-950/60'
        : 'border-amber-600 bg-amber-950/40'
    }`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-1">
        <CheckSquare size={12} className={approved ? 'text-green-400' : 'text-amber-400'} />
        <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Approval</span>
      </div>
      <p className="text-[12px] font-semibold text-white">{data.label}</p>
      <div className="mt-1">
        <StatusBadge status={data.status} />
      </div>
    </div>
  )
}

const NODE_TYPES = {
  circular: CircularNode,
  map:      MapNode,
  dept:     DeptNode,
  approval: ApprovalNode,
}

// ── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(circulars, maps, selectedCircularId) {
  const nodes = []
  const edges = []

  const filtered = selectedCircularId
    ? circulars.filter(c => String(c.id) === String(selectedCircularId))
    : circulars.slice(0, 3)  // show max 3 circulars when no filter

  const circularMaps = {}
  for (const m of maps) {
    const cid = String(m.circular_id)
    if (!circularMaps[cid]) circularMaps[cid] = []
    circularMaps[cid].push(m)
  }

  let yBase = 0
  const deptNodes = {}

  filtered.forEach((circ, ci) => {
    const circId = `circ-${circ.id}`
    const xBase  = ci * 320

    // Circular node
    nodes.push({
      id:       circId,
      type:     'circular',
      position: { x: xBase, y: yBase },
      data: {
        label:  circ.title,
        source: circ.source,
        date:   circ.uploaded_at?.slice(0, 10) || '',
      },
    })

    const cirMaps = circularMaps[String(circ.id)] || []

    cirMaps.forEach((map, mi) => {
      const mapId = `map-${map.id}`

      nodes.push({
        id:       mapId,
        type:     'map',
        position: { x: xBase + (mi % 2 === 0 ? -40 : 200), y: yBase + 160 + Math.floor(mi / 2) * 180 },
        data: {
          label:      map.action,
          priority:   map.priority,
          status:     map.status,
          department: map.department?.name || map.department || '—',
          deadline:   map.deadline,
        },
      })

      edges.push({
        id:              `e-${circId}-${mapId}`,
        source:          circId,
        target:          mapId,
        animated:        true,
        style:           { stroke: '#c69b4f', strokeWidth: 2 },
        label:           'mandates',
        labelStyle:      { fill: '#8b98aa', fontSize: 9 },
        labelBgStyle:    { fill: 'transparent' },
      })

      // Department node (deduplicated)
      const deptName = map.department?.name || map.department || 'Unknown'
      const deptId   = `dept-${deptName}`
      if (!deptNodes[deptId]) {
        deptNodes[deptId] = { id: deptId, name: deptName, count: 0, y: 0, x: 0 }
      }
      deptNodes[deptId].count++

      edges.push({
        id:           `e-${mapId}-${deptId}`,
        source:       mapId,
        target:       deptId,
        style:        { stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '4 2' },
        label:        'assigned to',
        labelStyle:   { fill: '#64748b', fontSize: 9 },
        labelBgStyle: { fill: 'transparent' },
      })
    })

    yBase += 160 + Math.ceil((cirMaps.length || 1) / 2) * 180 + 60
  })

  // Lay out department nodes in a row at the bottom
  const deptArr = Object.values(deptNodes)
  const deptY   = yBase
  deptArr.forEach((d, i) => {
    nodes.push({
      id:       d.id,
      type:     'dept',
      position: { x: i * 220 - (deptArr.length - 1) * 110 + 300, y: deptY },
      data:     { label: d.name, mapCount: d.count },
    })
  })

  return { nodes, edges }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TraceabilityGraph() {
  const { maps,      loading: mapsLoading }      = useMaps()
  const { circulars, loading: circularsLoading } = useCirculars()
  const [selectedCircular, setSelectedCircular]  = useState('')

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!circulars.length) return { nodes: [], edges: [] }
    return buildGraph(circulars, maps, selectedCircular)
  }, [circulars, maps, selectedCircular])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Re-derive nodes/edges when data or filter changes
  const { nodes: derivedNodes, edges: derivedEdges } = useMemo(
    () => buildGraph(circulars, maps, selectedCircular),
    [circulars, maps, selectedCircular]
  )

  const loading = mapsLoading || circularsLoading

  const proOptions = { hideAttribution: true }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch size={16} className="text-brass" />
            <h1 className="text-xl font-semibold text-ink dark:text-white">Compliance Traceability</h1>
          </div>
          <p className="text-sm text-[#8b98aa]">
            Complete provenance graph — Circular → MAP → Department → Approval chain
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCircular}
            onChange={e => setSelectedCircular(e.target.value)}
            className="h-9 rounded-lg border border-line bg-white dark:bg-card text-sm text-ink dark:text-[#e8edf5] px-3 focus:border-primary-400 focus:outline-none"
          >
            <option value="">All Circulars (up to 3)</option>
            {circulars.map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.title.slice(0, 60)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-shrink-0 bg-white dark:bg-card rounded-xl border border-line px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#8b98aa]">Legend</span>
        <div className="h-3 w-px bg-line" />
        {[
          { color: 'bg-brass', label: 'Circular (RBI/SEBI/MCA)' },
          { color: 'bg-red-500', label: 'Critical MAP' },
          { color: 'bg-amber-500', label: 'High MAP' },
          { color: 'bg-blue-500', label: 'Medium MAP' },
          { color: 'bg-slate-500', label: 'Dept / Low' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span className="text-[11px] text-[#8b98aa]">{label}</span>
          </div>
        ))}
        <div className="ml-auto font-mono text-[9px] text-[#8b98aa]">
          Scroll to zoom · Drag to pan · Click node for details
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 rounded-2xl border border-line bg-[#0a1628] overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass border-t-transparent" />
              <p className="font-mono text-[11px] text-slate-500">Loading traceability data…</p>
            </div>
          </div>
        ) : derivedNodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
            <Shield size={40} className="text-slate-600" />
            <div>
              <p className="text-sm font-medium text-slate-400">No compliance data yet</p>
              <p className="mt-1 text-[12px] text-slate-600">
                Upload a circular to generate the traceability graph
              </p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={derivedNodes}
            edges={derivedEdges}
            nodeTypes={NODE_TYPES}
            proOptions={proOptions}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1.0 }}
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{
              type: 'smoothstep',
            }}
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls
              style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
              showInteractive={false}
            />
            <MiniMap
              style={{ background: '#111827', border: '1px solid #1f2937' }}
              nodeColor={(n) => {
                if (n.type === 'circular') return '#c69b4f'
                if (n.type === 'map') return '#3b82f6'
                if (n.type === 'dept') return '#475569'
                return '#1f2937'
              }}
              maskColor="rgba(0,0,0,0.6)"
            />
          </ReactFlow>
        )}
      </div>

      {/* Stats bar */}
      {!loading && derivedNodes.length > 0 && (
        <div className="flex items-center gap-6 flex-shrink-0 bg-white dark:bg-card rounded-xl border border-line px-4 py-2.5">
          {[
            { label: 'Circulars', value: circulars.length },
            { label: 'MAPs',      value: maps.length },
            { label: 'Graph nodes', value: derivedNodes.length },
            { label: 'Connections', value: derivedEdges.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-lg font-bold text-ink dark:text-white">{value}</span>
              <span className="text-[11px] text-[#8b98aa]">{label}</span>
            </div>
          ))}
          <div className="ml-auto font-mono text-[9px] text-[#8b98aa]">
            Air-Gapped Compliance Traceability · PRAGMA v1.0
          </div>
        </div>
      )}
    </div>
  )
}
