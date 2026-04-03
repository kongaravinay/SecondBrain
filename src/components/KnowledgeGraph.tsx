'use client'
// ============================================================
// SECOND BRAIN — KnowledgeGraph
// Canvas-based force-directed graph with physics simulation
// ============================================================

import { useRef, useEffect, useCallback, useState } from 'react'
import type { GraphNode, GraphEdge } from '@/types'
import {
  getDimensionColor,
  dimColor,
  similarityToOpacity,
  similarityToLineWidth,
} from '@/lib/colors'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  hoveredNodeId: string | null
  onSelectNode: (id: string | null) => void
  onHoverNode: (id: string | null) => void
  onPinNode: (id: string, x: number, y: number) => void
  onUnpinNode: (id: string) => void
  width: number
  height: number
}

interface Tooltip {
  x: number
  y: number
  node: GraphNode
}

export default function KnowledgeGraph({
  nodes,
  edges,
  selectedNodeId,
  hoveredNodeId,
  onSelectNode,
  onHoverNode,
  onPinNode,
  onUnpinNode,
  width,
  height,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  // Drag state
  const dragRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null)

  // Zoom/pan state
  const transformRef = useRef({ scale: 1, tx: 0, ty: 0 })
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  // Canvas → world coordinate transform
  const toWorld = useCallback(
    (cx: number, cy: number) => {
      const t = transformRef.current
      return {
        x: (cx - t.tx) / t.scale,
        y: (cy - t.ty) / t.scale,
      }
    },
    []
  )

  // Hit-test: which node is at canvas position (cx, cy)?
  const hitTest = useCallback(
    (cx: number, cy: number): GraphNode | null => {
      const world = toWorld(cx, cy)
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        const dx = n.x - world.x
        const dy = n.y - world.y
        if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 4) return n
      }
      return null
    },
    [nodes, toWorld]
  )

  // ---- Main draw loop ----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const t = transformRef.current

    // Clear
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0a0a12'
    ctx.fillRect(0, 0, width, height)

    // Apply zoom/pan transform
    ctx.save()
    ctx.translate(t.tx, t.ty)
    ctx.scale(t.scale, t.scale)

    // Draw edges
    for (const edge of edges) {
      const src = nodes.find(n => n.id === edge.sourceId)
      const dst = nodes.find(n => n.id === edge.targetId)
      if (!src || !dst) continue

      const opacity = similarityToOpacity(edge.similarity)
      const lineWidth = similarityToLineWidth(edge.similarity)
      const isHighlighted =
        src.id === selectedNodeId ||
        dst.id === selectedNodeId ||
        src.id === hoveredNodeId ||
        dst.id === hoveredNodeId

      const color = isHighlighted
        ? `rgba(255, 255, 255, ${opacity * 1.5})`
        : `rgba(100, 120, 180, ${opacity * 0.6})`

      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(dst.x, dst.y)
      ctx.strokeStyle = color
      ctx.lineWidth = isHighlighted ? lineWidth * 1.5 : lineWidth
      ctx.stroke()
    }

    // Draw nodes
    for (const node of nodes) {
      const color = getDimensionColor(node.dominantDim)
      const isSelected = node.id === selectedNodeId
      const isHovered = node.id === hoveredNodeId
      const r = isSelected ? node.radius * 1.5 : isHovered ? node.radius * 1.25 : node.radius

      // Glow effect
      if (isSelected || isHovered) {
        ctx.shadowColor = color
        ctx.shadowBlur = isSelected ? 28 : 16
      }

      // Outer ring for selected
      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2)
        ctx.strokeStyle = `${color}88`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Main circle — filled
      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2)

      // Radial gradient for depth
      const grad = ctx.createRadialGradient(
        node.x - r * 0.3,
        node.y - r * 0.3,
        r * 0.1,
        node.x,
        node.y,
        r
      )
      grad.addColorStop(0, `${color}ff`)
      grad.addColorStop(1, `${color}88`)
      ctx.fillStyle = grad
      ctx.fill()

      // Border
      ctx.strokeStyle = `${color}cc`
      ctx.lineWidth = isSelected ? 2.5 : 1
      ctx.stroke()

      // Reset shadow
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'

      // Label (short summary excerpt)
      if (r >= 12 || isHovered || isSelected) {
        const label = node.note.analysis.summary.slice(0, 22) + (node.note.analysis.summary.length > 22 ? '…' : '')
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = `${isSelected ? 'bold ' : ''}${Math.max(9, Math.min(11, r * 0.7))}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, node.x, node.y + r + 12)
      }
    }

    ctx.restore()

    // Draw node count watermark
    if (nodes.length === 0) {
      ctx.fillStyle = 'rgba(100, 120, 180, 0.3)'
      ctx.font = '16px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Add your first note to begin mapping your knowledge', width / 2, height / 2)
    }
  }, [nodes, edges, selectedNodeId, hoveredNodeId, width, height])

  // ---- Mouse events ----
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      // Panning
      if (isPanningRef.current) {
        transformRef.current.tx = panStartRef.current.tx + (cx - panStartRef.current.x)
        transformRef.current.ty = panStartRef.current.ty + (cy - panStartRef.current.y)
        return
      }

      // Dragging a node
      if (dragRef.current) {
        const world = toWorld(cx, cy)
        onPinNode(dragRef.current.nodeId, world.x + dragRef.current.offsetX, world.y + dragRef.current.offsetY)
        return
      }

      // Hover detection
      const hit = hitTest(cx, cy)
      onHoverNode(hit?.id ?? null)

      if (hit) {
        const rect2 = canvasRef.current!.getBoundingClientRect()
        setTooltip({
          x: e.clientX - rect2.left,
          y: e.clientY - rect2.top - 10,
          node: hit,
        })
      } else {
        setTooltip(null)
      }
    },
    [hitTest, onHoverNode, onPinNode, toWorld]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const hit = hitTest(cx, cy)

      if (hit) {
        const world = toWorld(cx, cy)
        dragRef.current = {
          nodeId: hit.id,
          offsetX: hit.x - world.x,
          offsetY: hit.y - world.y,
        }
      } else if (e.button === 0) {
        isPanningRef.current = true
        panStartRef.current = {
          x: cx,
          y: cy,
          tx: transformRef.current.tx,
          ty: transformRef.current.ty,
        }
      }
    },
    [hitTest, toWorld]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top

      if (dragRef.current) {
        onUnpinNode(dragRef.current.nodeId)
        dragRef.current = null
      } else if (isPanningRef.current) {
        isPanningRef.current = false
      } else {
        const hit = hitTest(cx, cy)
        onSelectNode(hit?.id ?? null)
      }
    },
    [hitTest, onSelectNode, onUnpinNode]
  )

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const t = transformRef.current
    const newScale = Math.max(0.2, Math.min(5, t.scale * factor))
    // Zoom toward cursor
    t.tx = cx - (cx - t.tx) * (newScale / t.scale)
    t.ty = cy - (cy - t.ty) * (newScale / t.scale)
    t.scale = newScale
  }, [])

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        suppressHydrationWarning
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setTooltip(null); onHoverNode(null) }}
        onWheel={handleWheel}
        style={{ display: 'block', cursor: hoveredNodeId ? 'pointer' : 'default' }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 16, width - 260),
            top: Math.max(tooltip.y - 90, 10),
            background: 'rgba(15,15,30,0.97)',
            border: `1px solid ${getDimensionColor(tooltip.node.dominantDim)}55`,
            borderRadius: 10,
            padding: '10px 14px',
            maxWidth: 240,
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div style={{ fontSize: 11, color: getDimensionColor(tooltip.node.dominantDim), marginBottom: 4, fontWeight: 600 }}>
            {tooltip.node.note.analysis.tags.map(t => `#${t}`).join(' ')}
          </div>
          <div style={{ fontSize: 12, color: '#e0e0f0', lineHeight: 1.5 }}>
            {tooltip.node.note.analysis.summary}
          </div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 6, fontStyle: 'italic' }}>
            Click to expand
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: '+', action: () => { transformRef.current.scale = Math.min(5, transformRef.current.scale * 1.2) } },
          { label: '⟲', action: () => { transformRef.current = { scale: 1, tx: 0, ty: 0 } } },
          { label: '−', action: () => { transformRef.current.scale = Math.max(0.2, transformRef.current.scale * 0.8) } },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#aaa', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
