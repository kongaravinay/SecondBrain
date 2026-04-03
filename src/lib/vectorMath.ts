// ============================================================
// SECOND BRAIN — Vector Math Engine (v2)
// Real ML / linear algebra operations in pure JavaScript
// ============================================================

import type { Note, SearchResult } from '@/types'

/**
 * Dot product: sum of element-wise products
 *   dot(a, b) = Σ a[i] * b[i]
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vector length mismatch')
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i]
  return sum
}

/**
 * Euclidean magnitude (L2 norm)
 *   |v| = sqrt( Σ v[i]^2 )
 */
export function magnitude(v: number[]): number {
  let sum = 0
  for (const x of v) sum += x * x
  return Math.sqrt(sum)
}

/**
 * Cosine similarity — measures angle between vectors
 *   sim(a,b) = dot(a,b) / (|a| * |b|)
 *
 *   1.0 = identical  |  0.0 = unrelated  |  -1.0 = opposite
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0
  const magProduct = magnitude(a) * magnitude(b)
  if (magProduct === 0) return 0
  return Math.max(-1, Math.min(1, dotProduct(a, b) / magProduct))
}

/**
 * Normalize vector to unit length (L2 normalization)
 */
export function normalize(v: number[]): number[] {
  if (v.length === 0) return []
  const mag = magnitude(v)
  if (mag === 0) return v.map(() => 0)
  return v.map(x => x / mag)
}

/**
 * Index of the highest-value dimension — the dominant concept
 */
export function dominantDimension(vector: number[]): number {
  if (vector.length === 0) return 19 // default to 'Other'
  let maxIdx = 0
  let maxVal = vector[0]
  for (let i = 1; i < vector.length; i++) {
    if (vector[i] > maxVal) {
      maxVal = vector[i]
      maxIdx = i
    }
  }
  return maxIdx
}

/**
 * Compute pairwise cosine similarity for all note pairs.
 * Returns Map keyed "id1:id2" → similarity, only for pairs above threshold.
 * O(n²) — acceptable for personal knowledge bases (< 10k notes).
 */
export function computeSimilarityMatrix(
  notes: Note[],
  threshold = 0.4
): Map<string, number> {
  const matrix = new Map<string, number>()
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const sim = cosineSimilarity(
        notes[i].analysis.vector,
        notes[j].analysis.vector
      )
      if (sim >= threshold) {
        matrix.set(`${notes[i].id}:${notes[j].id}`, sim)
      }
    }
  }
  return matrix
}

/**
 * Incremental similarity: compute edges for a single new note vs all existing.
 * More efficient than full recompute when adding one note.
 */
export function computeNewNoteEdges(
  newNote: Note,
  existingNotes: Note[],
  threshold = 0.4
): Array<{ sourceId: string; targetId: string; similarity: number }> {
  const edges = []
  for (const note of existingNotes) {
    const sim = cosineSimilarity(newNote.analysis.vector, note.analysis.vector)
    if (sim >= threshold) {
      edges.push({ sourceId: newNote.id, targetId: note.id, similarity: sim })
    }
  }
  return edges
}

/**
 * Rank notes by cosine similarity to a query vector — semantic search.
 */
export function rankByRelevance(
  queryVector: number[],
  notes: Note[],
  topK = 50
): SearchResult[] {
  if (queryVector.length === 0 || notes.length === 0) return []
  const results: SearchResult[] = notes.map(note => ({
    note,
    score: cosineSimilarity(queryVector, note.analysis.vector),
  }))
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, topK)
}

/**
 * Weighted average of vectors (centroid computation)
 */
export function weightedAverage(vectors: number[][], weights?: number[]): number[] {
  if (vectors.length === 0) return []
  const size = vectors[0].length
  const result = new Array<number>(size).fill(0)
  const w = weights ?? vectors.map(() => 1)
  const totalWeight = w.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return result
  for (let i = 0; i < vectors.length; i++) {
    for (let j = 0; j < size; j++) result[j] += vectors[i][j] * w[i]
  }
  return result.map(x => x / totalWeight)
}

/**
 * Euclidean distance between vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Get the top-N dimensions of a vector with their names and values
 */
export function topDimensions(
  vector: number[],
  n = 5
): Array<{ index: number; value: number }> {
  return vector
    .map((value, index) => ({ index, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
}
