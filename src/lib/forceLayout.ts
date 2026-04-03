// ============================================================
// SECOND BRAIN — Force-Directed Layout Engine
// Fruchterman-Reingold algorithm for knowledge graph physics
// ============================================================

import type { GraphNode, GraphEdge } from '@/types'

const DAMPING = 0.88        // velocity damping per frame
const MIN_DISTANCE = 25     // prevent infinite repulsion at zero distance
const PADDING = 40          // keep nodes away from canvas edges
const GRAVITY = 0.02        // gentle pull toward center

export interface ForceConfig {
  width: number
  height: number
  repulsionStrength?: number  // multiplier for repulsion (default 1.0)
  attractionStrength?: number // multiplier for attraction (default 1.0)
}

/**
 * Run a single iteration of the Fruchterman-Reingold force algorithm.
 *
 * Physics:
 *   k  = sqrt(canvas_area / num_nodes)  — ideal spring length
 *
 *   Repulsion (all pairs):
 *     force = repulsion_strength * k² / distance
 *
 *   Attraction (connected pairs only):
 *     force = attraction_strength * distance² / k * similarity_weight
 *
 *   Gravity (toward center):
 *     force = GRAVITY * distance_from_center
 *
 * @param nodes    - mutable array of graph nodes (x, y, vx, vy updated in-place)
 * @param edges    - edges with similarity weights
 * @param config   - canvas dimensions and force tuning
 * @param temperature - controls max displacement per step (cools over time)
 */
export function runForceIteration(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: ForceConfig,
  temperature: number
): void {
  const n = nodes.length
  if (n === 0) return

  const { width, height, repulsionStrength = 1.0, attractionStrength = 1.0 } = config
  const area = width * height
  const k = Math.sqrt(area / n)
  const cx = width / 2
  const cy = height / 2

  // Build id → node index map for O(1) edge lookup
  const nodeMap = new Map<string, GraphNode>()
  for (const node of nodes) nodeMap.set(node.id, node)

  // Initialize per-node force accumulators
  const fx = new Float64Array(n)
  const fy = new Float64Array(n)

  // --- REPULSION: every node repels every other node ---
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distSq = dx * dx + dy * dy
      const dist = Math.max(Math.sqrt(distSq), MIN_DISTANCE)

      // F_rep = repulsion_strength * k² / dist
      const force = repulsionStrength * (k * k) / dist
      const ux = dx / dist  // unit vector x
      const uy = dy / dist  // unit vector y

      fx[i] += ux * force
      fy[i] += uy * force
      fx[j] -= ux * force
      fy[j] -= uy * force
    }
  }

  // --- ATTRACTION: only connected pairs ---
  for (const edge of edges) {
    const a = nodeMap.get(edge.sourceId)
    const b = nodeMap.get(edge.targetId)
    if (!a || !b) continue

    const ai = nodes.indexOf(a)
    const bi = nodes.indexOf(b)
    if (ai === -1 || bi === -1) continue

    const dx = b.x - a.x
    const dy = b.y - a.y
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DISTANCE)

    // F_att = attraction_strength * dist² / k * similarity
    const force = attractionStrength * (dist * dist) / k * edge.similarity
    const ux = dx / dist
    const uy = dy / dist

    fx[ai] += ux * force
    fy[ai] += uy * force
    fx[bi] -= ux * force
    fy[bi] -= uy * force
  }

  // --- GRAVITY: gentle pull toward canvas center ---
  for (let i = 0; i < n; i++) {
    const node = nodes[i]
    fx[i] += (cx - node.x) * GRAVITY
    fy[i] += (cy - node.y) * GRAVITY
  }

  // --- APPLY FORCES with temperature capping and damping ---
  for (let i = 0; i < n; i++) {
    const node = nodes[i]
    if (node.pinned) continue  // skip dragged nodes

    // Accumulate velocity
    node.vx = (node.vx + fx[i]) * DAMPING
    node.vy = (node.vy + fy[i]) * DAMPING

    // Cap displacement by temperature
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
    if (speed > temperature) {
      node.vx = (node.vx / speed) * temperature
      node.vy = (node.vy / speed) * temperature
    }

    node.x += node.vx
    node.y += node.vy

    // Clamp to canvas bounds with padding
    const pad = node.radius + PADDING
    node.x = Math.max(pad, Math.min(width - pad, node.x))
    node.y = Math.max(pad, Math.min(height - pad, node.y))
  }
}

/**
 * Create a fresh GraphNode from a note, placed randomly near canvas center.
 */
export function createNode(
  note: import('@/types').Note,
  dominantDim: number,
  width: number,
  height: number
): GraphNode {
  const cx = width / 2
  const cy = height / 2
  const spread = Math.min(width, height) * 0.3

  return {
    id: note.id,
    x: cx + (Math.random() - 0.5) * spread,
    y: cy + (Math.random() - 0.5) * spread,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    note,
    dominantDim,
    radius: 14 + Math.min(note.content.length / 100, 8), // slightly bigger for longer notes
    pinned: false,
  }
}

/**
 * Compute temperature schedule — starts hot, cools logarithmically.
 * Higher temperature = nodes move more = layout explores more.
 */
export function computeTemperature(frame: number, maxFrames = 300): number {
  const progress = Math.min(frame / maxFrames, 1)
  return Math.max(0.5, 80 * (1 - progress * progress))
}
