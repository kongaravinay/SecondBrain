// ============================================================
// SECOND BRAIN — Color System
// Each of the 20 knowledge dimensions has a unique color
// ============================================================

import { DIMENSIONS } from '@/types'

/** One color per knowledge dimension — vivid, distinct palette */
export const DIMENSION_COLORS: string[] = [
  '#a855f7', // 0  AI/ML       — purple
  '#3b82f6', // 1  Programming  — blue
  '#06b6d4', // 2  Mathematics  — cyan
  '#10b981', // 3  Science      — emerald
  '#f59e0b', // 4  Business     — amber
  '#ef4444', // 5  Health       — red
  '#6366f1', // 6  Philosophy   — indigo
  '#f97316', // 7  Art          — orange
  '#a78bfa', // 8  History      — lavender (previously stone, too dull)
  '#14b8a6', // 9  Psychology   — teal
  '#0ea5e9', // 10 Physics      — sky blue
  '#84cc16', // 11 Biology      — lime
  '#64748b', // 12 Society      — slate
  '#38bdf8', // 13 Education    — light blue
  '#8b5cf6', // 14 Technology   — violet
  '#ec4899', // 15 Personal     — pink
  '#c084fc', // 16 Language     — purple-light
  '#94a3b8', // 17 Systems      — blue-gray
  '#34d399', // 18 Data         — green
  '#6b7280', // 19 Other        — gray
]

/** Dimmed version of a color (for edges and backgrounds) */
export function dimColor(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/** Get color for a given dimension index */
export function getDimensionColor(dimIndex: number): string {
  return DIMENSION_COLORS[dimIndex] ?? DIMENSION_COLORS[19]
}

/** Get dimension name */
export function getDimensionName(dimIndex: number): string {
  return DIMENSIONS[dimIndex] ?? 'Other'
}

/** Map similarity (0.4–1.0) to edge opacity (0.15–0.9) */
export function similarityToOpacity(similarity: number): number {
  return 0.15 + (similarity - 0.4) * (0.75 / 0.6)
}

/** Map similarity (0.4–1.0) to edge line width (0.5px–4px) */
export function similarityToLineWidth(similarity: number): number {
  return 0.5 + (similarity - 0.4) * (3.5 / 0.6)
}

/** CSS glow/shadow string for canvas shadowBlur effect */
export function glowColor(hex: string): string {
  return hex
}

/** All dimension entries as array for legend rendering */
export const DIMENSION_ENTRIES = DIMENSIONS.map((name, index) => ({
  index,
  name,
  color: DIMENSION_COLORS[index],
}))
