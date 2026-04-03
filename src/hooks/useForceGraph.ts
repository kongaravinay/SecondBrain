'use client'
// ============================================================
// SECOND BRAIN — useForceGraph hook (v2 — fixed)
// Physics simulation with stable animation loop
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Note, GraphNode, GraphEdge } from '@/types'
import { computeSimilarityMatrix, dominantDimension } from '@/lib/vectorMath'
import { runForceIteration, createNode, computeTemperature } from '@/lib/forceLayout'

const SIMILARITY_THRESHOLD = 0.4

export function useForceGraph(canvasWidth: number, canvasHeight: number) {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [similarityThreshold, setSimilarityThreshold] = useState(SIMILARITY_THRESHOLD)

  // Use refs for animation loop — avoids stale closures and prevents
  // the loop from restarting every time canvas size changes
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const canvasSizeRef = useRef({ width: canvasWidth, height: canvasHeight })
  const frameRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const thresholdRef = useRef(SIMILARITY_THRESHOLD)

  // Keep canvas size ref in sync — physics reads from ref, not state
  canvasSizeRef.current = { width: canvasWidth, height: canvasHeight }

  // Keep threshold ref in sync
  thresholdRef.current = similarityThreshold

  // Sync node/edge refs whenever state changes
  nodesRef.current = nodes
  edgesRef.current = edges

  // ---- Recompute edges when notes/threshold changes ----
  const recomputeEdges = useCallback(
    (currentNodes: GraphNode[], threshold: number): GraphEdge[] => {
      const notesFromNodes = currentNodes.map(n => n.note)
      const matrix = computeSimilarityMatrix(notesFromNodes, threshold)
      const newEdges: GraphEdge[] = []
      for (const [key, similarity] of matrix.entries()) {
        const [sourceId, targetId] = key.split(':')
        newEdges.push({ sourceId, targetId, similarity })
      }
      return newEdges
    },
    []
  )

  // ---- Add a single new note to the graph ----
  const addNoteToGraph = useCallback(
    (note: Note) => {
      const dim = dominantDimension(note.analysis.vector)
      const { width, height } = canvasSizeRef.current
      const newNode = createNode(note, dim, width, height)

      setNodes(prev => {
        const next = [...prev, newNode]
        const newEdges = recomputeEdges(next, thresholdRef.current)
        edgesRef.current = newEdges
        setEdges(newEdges)
        // Reheat physics so layout re-settles
        frameRef.current = Math.max(0, frameRef.current - 150)
        return next
      })
    },
    [recomputeEdges]
  )

  // ---- Full sync with notes array (for initial load from localStorage) ----
  const syncWithNotes = useCallback(
    (notes: Note[]) => {
      if (notes.length === 0) {
        setNodes([])
        setEdges([])
        nodesRef.current = []
        edgesRef.current = []
        return
      }

      setNodes(prev => {
        const existingMap = new Map(prev.map(n => [n.id, n]))
        const noteIds = new Set(notes.map(n => n.id))
        const { width, height } = canvasSizeRef.current

        // Remove deleted notes, keep positions of existing ones
        const updated = notes.map(note => {
          if (existingMap.has(note.id)) {
            return existingMap.get(note.id)!
          }
          const dim = dominantDimension(note.analysis.vector)
          return createNode(note, dim, width, height)
        })

        const newEdges = recomputeEdges(updated, thresholdRef.current)
        edgesRef.current = newEdges
        nodesRef.current = updated
        setEdges(newEdges)
        return updated
      })
    },
    [recomputeEdges]
  )

  // ---- Remove a node when a note is deleted ----
  const removeNodeFromGraph = useCallback(
    (noteId: string) => {
      setNodes(prev => {
        const next = prev.filter(n => n.id !== noteId)
        const newEdges = recomputeEdges(next, thresholdRef.current)
        edgesRef.current = newEdges
        setEdges(newEdges)
        return next
      })
      setSelectedNodeId(id => (id === noteId ? null : id))
    },
    [recomputeEdges]
  )

  // ---- Update similarity threshold ----
  const updateThreshold = useCallback(
    (threshold: number) => {
      setSimilarityThreshold(threshold)
      thresholdRef.current = threshold
      const newEdges = recomputeEdges(nodesRef.current, threshold)
      edgesRef.current = newEdges
      setEdges(newEdges)
    },
    [recomputeEdges]
  )

  // ---- Physics animation loop — starts once, never restarts ----
  useEffect(() => {
    const tick = () => {
      const currentNodes = nodesRef.current

      if (currentNodes.length > 0) {
        const temp = computeTemperature(frameRef.current)
        // Mutate a copy to avoid directly mutating state
        const nodesCopy = currentNodes.map(n => ({ ...n }))
        const { width, height } = canvasSizeRef.current

        runForceIteration(nodesCopy, edgesRef.current, { width, height }, temp)

        nodesRef.current = nodesCopy
        setNodes([...nodesCopy])
        frameRef.current++
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, []) // Empty deps — runs once, reads everything from refs

  // ---- Node drag support ----
  const pinNode = useCallback((id: string, x: number, y: number) => {
    setNodes(prev =>
      prev.map(n => (n.id === id ? { ...n, x, y, vx: 0, vy: 0, pinned: true } : n))
    )
  }, [])

  const unpinNode = useCallback((id: string) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, pinned: false } : n)))
    frameRef.current = Math.max(0, frameRef.current - 80)
  }, [])

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null
  const hoveredNode = nodes.find(n => n.id === hoveredNodeId) ?? null

  return {
    nodes,
    edges,
    selectedNode,
    hoveredNode,
    selectedNodeId,
    hoveredNodeId,
    similarityThreshold,
    addNoteToGraph,
    removeNodeFromGraph,
    syncWithNotes,
    updateThreshold,
    setSelectedNodeId,
    setHoveredNodeId,
    pinNode,
    unpinNode,
  }
}
