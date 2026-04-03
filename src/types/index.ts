// ============================================================
// SECOND BRAIN — Core Type Definitions
// ============================================================

export const DIMENSIONS = [
  'AI/ML',
  'Programming',
  'Mathematics',
  'Science',
  'Business',
  'Health',
  'Philosophy',
  'Art',
  'History',
  'Psychology',
  'Physics',
  'Biology',
  'Society',
  'Education',
  'Technology',
  'Personal',
  'Language',
  'Systems',
  'Data',
  'Other',
] as const

export type Dimension = (typeof DIMENSIONS)[number]
export const VECTOR_SIZE = 20

export interface NoteAnalysis {
  tags: string[]
  summary: string
  keyInsight: string
  vector: number[] // 20 floats representing concept dimensions
}

export interface Note {
  id: string
  content: string
  createdAt: string // ISO string (JSON-serializable)
  analysis: NoteAnalysis
}

// ---- Graph Types ----

export interface GraphNode {
  id: string
  x: number
  y: number
  vx: number // velocity x
  vy: number // velocity y
  note: Note
  dominantDim: number // index of highest vector dimension
  radius: number
  pinned: boolean // true when user is dragging
}

export interface GraphEdge {
  sourceId: string
  targetId: string
  similarity: number // 0.0 to 1.0
}

// ---- Search ----

export interface SearchResult {
  note: Note
  score: number // cosine similarity
}

// ---- API ----

export interface AnalyzeRequest {
  content: string
}

export interface AnalyzeResponse {
  analysis?: NoteAnalysis
  error?: string
}

export interface SearchRequest {
  query: string
}

export interface SearchResponse {
  vector?: number[]
  error?: string
}
