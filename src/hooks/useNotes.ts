'use client'
// ============================================================
// SECOND BRAIN — useNotes hook (v2)
// Note state: add, delete, search, import, load from storage
// ============================================================

import { useState, useCallback, useEffect } from 'react'
import type { Note, NoteAnalysis, SearchResult } from '@/types'
import { loadNotes, saveNotes } from '@/lib/storage'
import { rankByRelevance } from '@/lib/vectorMath'

function generateId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState<NoteAnalysis | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadNotes()
    if (saved.length > 0) setNotes(saved)
  }, [])

  // Persist on every change
  useEffect(() => {
    saveNotes(notes)
  }, [notes])

  /** Send note to Claude, get analysis, add to state */
  const addNote = useCallback(async (content: string): Promise<Note | null> => {
    if (!content.trim()) return null

    setIsAnalyzing(true)
    setError(null)
    setLastAnalysis(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `Server error ${res.status}`)

      const analysis: NoteAnalysis = data.analysis
      const note: Note = {
        id: generateId(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        analysis,
      }

      setLastAnalysis(analysis)
      setNotes(prev => {
        const next = [note, ...prev]
        saveNotes(next)
        return next
      })

      return note
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze note')
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /** Delete a note by ID */
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id)
      saveNotes(next)
      return next
    })
    setSearchResults(prev => prev?.filter(r => r.note.id !== id) ?? null)
  }, [])

  /** Semantic search: vectorize query via Claude, then rank by cosine similarity */
  const searchNotes = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)

      const ranked = rankByRelevance(data.vector, notes)
      setSearchResults(ranked.filter(r => r.score > 0.25))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults(null)
    } finally {
      setIsSearching(false)
    }
  }, [notes])

  /** Clear search results */
  const clearSearch = useCallback(() => setSearchResults(null), [])

  /** Clear all notes */
  const clearAllNotes = useCallback(() => {
    setNotes([])
    setSearchResults(null)
    saveNotes([])
  }, [])

  /** Add imported notes to state (without re-analyzing) */
  const importNotesList = useCallback((imported: Note[]) => {
    setNotes(prev => {
      const existingIds = new Set(prev.map(n => n.id))
      const newOnes = imported.filter(n => !existingIds.has(n.id))
      const next = [...newOnes, ...prev]
      saveNotes(next)
      return next
    })
  }, [])

  /** RAG: vectorize question, find top notes, ask AI with context */
  const chatWithBrain = useCallback(async (
    question: string,
    currentNotes: Note[]
  ): Promise<{ answer: string; sources: Note[] }> => {
    // Step 1: vectorize the question
    let sources: Note[] = []
    let context: string[] = []

    if (currentNotes.length > 0) {
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question }),
      })
      const searchData = await searchRes.json()
      if (searchData.vector) {
        // Step 2: rank notes by relevance
        const ranked = rankByRelevance(searchData.vector, currentNotes, 5)
        sources = ranked.filter(r => r.score > 0.25).map(r => r.note)
        context = sources.map(n =>
          `${n.content}\n[Tags: ${n.analysis.tags.join(', ')}] [Insight: ${n.analysis.keyInsight}]`
        )
      }
    }

    // Step 3: ask AI with grounded context
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Chat failed')

    return { answer: data.answer, sources }
  }, [])

  return {
    notes,
    isAnalyzing,
    isSearching,
    searchResults,
    error,
    lastAnalysis,
    addNote,
    deleteNote,
    searchNotes,
    clearSearch,
    clearAllNotes,
    importNotesList,
    chatWithBrain,
    setError,
  }
}
