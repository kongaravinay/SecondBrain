'use client'
// ============================================================
// SECOND BRAIN — Main Page (v3)
// Orchestrates the full application
// ============================================================

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Header from '@/components/Header'
import NoteInput from '@/components/NoteInput'
import NoteList from '@/components/NoteList'
import SearchBar from '@/components/SearchBar'
import KnowledgeGraph from '@/components/KnowledgeGraph'
import NodeDetail from '@/components/NodeDetail'
import DimensionLegend from '@/components/DimensionLegend'
import ChatPanel from '@/components/ChatPanel'
import { useNotes } from '@/hooks/useNotes'
import { useForceGraph } from '@/hooks/useForceGraph'
import { exportNotes, importNotes } from '@/lib/storage'
import type { Note } from '@/types'

export default function Page() {
  const mainRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [graphSize, setGraphSize] = useState({ width: 800, height: 600 })
  const [chatOpen, setChatOpen] = useState(false)
  const hasSynced = useRef(false)

  // Undo delete state
  const [undoNote, setUndoNote] = useState<Note | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Must mount client-side before rendering canvas / reading localStorage
  useEffect(() => setMounted(true), [])

  // Measure graph container
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setGraphSize({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        })
      }
    })
    observer.observe(el)
    setGraphSize({ width: el.clientWidth, height: el.clientHeight })
    return () => observer.disconnect()
  }, [])

  // ---- Notes state ----
  const {
    notes,
    isAnalyzing,
    isSearching,
    searchResults,
    error,
    lastAnalysis,
    addNote,
    deleteNote,
    editNote,
    searchNotes,
    clearSearch,
    clearAllNotes,
    importNotesList,
    chatWithBrain,
  } = useNotes()

  // ---- Graph state ----
  const {
    nodes,
    edges,
    selectedNode,
    selectedNodeId,
    hoveredNodeId,
    similarityThreshold,
    addNoteToGraph,
    removeNodeFromGraph,
    updateNodeInGraph,
    syncWithNotes,
    updateThreshold,
    setSelectedNodeId,
    setHoveredNodeId,
    pinNode,
    unpinNode,
  } = useForceGraph(graphSize.width, graphSize.height)

  // One-time sync when notes load from localStorage
  useEffect(() => {
    if (notes.length > 0 && !hasSynced.current) {
      hasSynced.current = true
      syncWithNotes(notes)
    }
  }, [notes, syncWithNotes])

  // ---- Search highlight IDs for graph ----
  const highlightedNodeIds = useMemo(
    () => new Set(searchResults?.map(r => r.note.id) ?? []),
    [searchResults]
  )

  // ---- Add note ----
  const handleAddNote = useCallback(
    async (content: string) => {
      const note = await addNote(content)
      if (note) addNoteToGraph(note)
    },
    [addNote, addNoteToGraph]
  )

  // ---- Edit note ----
  const handleEditNote = useCallback(
    async (id: string, newContent: string): Promise<boolean> => {
      const updated = await editNote(id, newContent)
      if (updated) updateNodeInGraph(updated)
      return !!updated
    },
    [editNote, updateNodeInGraph]
  )

  // ---- Delete note with undo ----
  const handleDeleteNote = useCallback(
    (id: string) => {
      const note = notes.find(n => n.id === id)
      if (!note) return

      // Remove from graph immediately
      removeNodeFromGraph(id)
      if (selectedNodeId === id) setSelectedNodeId(null)

      // Clear any previous pending undo
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current)
        // Commit the previous pending delete
        if (undoNote) deleteNote(undoNote.id)
      }

      // Show undo toast
      setUndoNote(note)

      // Commit delete after 5 seconds
      undoTimerRef.current = setTimeout(() => {
        deleteNote(id)
        setUndoNote(null)
        undoTimerRef.current = null
      }, 5000)
    },
    [notes, deleteNote, removeNodeFromGraph, selectedNodeId, setSelectedNodeId, undoNote]
  )

  const handleUndoDelete = useCallback(() => {
    if (!undoNote || !undoTimerRef.current) return
    clearTimeout(undoTimerRef.current)
    undoTimerRef.current = null
    addNoteToGraph(undoNote)
    setUndoNote(null)
  }, [undoNote, addNoteToGraph])

  // ---- Select note ----
  const handleSelectNote = useCallback(
    (id: string) => {
      setSelectedNodeId(prev => (prev === id ? null : id))
    },
    [setSelectedNodeId]
  )

  // ---- Import JSON ----
  const handleImport = useCallback(
    async (file: File) => {
      try {
        const imported = await importNotes(file)
        const existing = new Set(notes.map(n => n.id))
        const newNotes = imported.filter(n => !existing.has(n.id))
        if (newNotes.length === 0) {
          alert('No new notes to import (all IDs already exist).')
          return
        }
        importNotesList(newNotes)
        syncWithNotes([...notes, ...newNotes])
        alert(`Imported ${newNotes.length} note${newNotes.length !== 1 ? 's' : ''}.`)
      } catch {
        alert('Failed to import: invalid JSON file.')
      }
    },
    [notes, importNotesList, syncWithNotes]
  )

  // ---- Clear all ----
  const handleClearAll = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current)
      undoTimerRef.current = null
    }
    setUndoNote(null)
    clearAllNotes()
    syncWithNotes([])
    setSelectedNodeId(null)
  }, [clearAllNotes, syncWithNotes, setSelectedNodeId, undoNote])

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      switch (e.key) {
        case 'n':
        case 'N':
          document.querySelector<HTMLTextAreaElement>('[data-note-input]')?.focus()
          break
        case '/':
          e.preventDefault()
          document.querySelector<HTMLInputElement>('[data-search-input]')?.focus()
          break
        case 'c':
        case 'C':
          setChatOpen(prev => !prev)
          break
        case 'Escape':
          setChatOpen(false)
          setSelectedNodeId(null)
          clearSearch()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clearSearch, setSelectedNodeId])

  if (!mounted) {
    return (
      <div style={{ ...styles.root, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#555', fontSize: 13 }}>Loading Second Brain…</div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <Header
        noteCount={notes.length}
        edgeCount={edges.length}
        similarityThreshold={similarityThreshold}
        onThresholdChange={updateThreshold}
        onClearAll={handleClearAll}
        onExport={() => exportNotes(notes)}
        onImport={handleImport}
      />

      {/* BODY */}
      <div style={styles.body}>
        {/* Left sidebar */}
        <div style={styles.sidebar}>
          <SearchBar
            onSearch={searchNotes}
            onClear={clearSearch}
            isSearching={isSearching}
            hasResults={searchResults !== null}
            resultCount={searchResults?.length ?? 0}
          />
          <NoteList
            notes={notes}
            searchResults={searchResults}
            selectedNoteId={selectedNodeId}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleEditNote}
            isAnalyzing={isAnalyzing}
          />
          <DimensionLegend notes={notes} />
        </div>

        {/* Graph canvas */}
        <div ref={mainRef} style={styles.main}>
          {graphSize.width > 0 && (
            <KnowledgeGraph
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              highlightedNodeIds={highlightedNodeIds}
              onSelectNode={setSelectedNodeId}
              onHoverNode={setHoveredNodeId}
              onPinNode={pinNode}
              onUnpinNode={unpinNode}
              width={graphSize.width}
              height={graphSize.height}
            />
          )}

          {/* Selected node detail panel */}
          <NodeDetail
            node={selectedNode}
            edges={edges}
            allNotes={notes}
            onClose={() => setSelectedNodeId(null)}
            onDelete={handleDeleteNote}
            onSelectNote={handleSelectNote}
          />

          {/* Chat toggle button */}
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              style={styles.chatFab}
              title="Ask your brain (C)"
            >
              <span style={{ fontSize: 20 }}>🧠</span>
              <span style={styles.chatFabLabel}>Ask</span>
            </button>
          )}

          {/* RAG Chat Panel */}
          <ChatPanel
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            onAsk={(q) => chatWithBrain(q, notes)}
            noteCount={notes.length}
          />

          {/* Keyboard shortcut hint */}
          <div style={styles.shortcuts}>
            <span>N — new note</span>
            <span style={styles.shortcutDot}>·</span>
            <span>/ — search</span>
            <span style={styles.shortcutDot}>·</span>
            <span>C — chat</span>
            <span style={styles.shortcutDot}>·</span>
            <span>Esc — clear</span>
          </div>
        </div>
      </div>

      {/* BOTTOM: Note input */}
      <NoteInput
        onAddNote={handleAddNote}
        isAnalyzing={isAnalyzing}
        lastAnalysis={lastAnalysis}
        error={error}
      />

      {/* UNDO DELETE TOAST */}
      {undoNote && (
        <div style={styles.undoToast}>
          <span style={styles.undoText}>Note deleted</span>
          <button onClick={handleUndoDelete} style={styles.undoBtn}>
            Undo
          </button>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#0a0a12',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    width: 300,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(8,8,16,0.8)',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    background: '#0a0a12',
  },
  chatFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    background: 'rgba(124,58,237,0.85)',
    border: '1px solid rgba(124,58,237,0.6)',
    borderRadius: 50,
    color: '#fff',
    padding: '10px 18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    zIndex: 40,
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  chatFabLabel: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  shortcuts: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10,
    color: 'rgba(255,255,255,0.18)',
    pointerEvents: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  shortcutDot: {
    color: 'rgba(255,255,255,0.1)',
  },
  undoToast: {
    position: 'fixed',
    bottom: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(20,20,35,0.97)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    zIndex: 100,
    animation: 'slideUp 0.2s ease',
  },
  undoText: {
    color: '#a0a0c0',
    fontSize: 13,
  },
  undoBtn: {
    background: 'rgba(124,58,237,0.25)',
    border: '1px solid rgba(124,58,237,0.5)',
    borderRadius: 6,
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 12px',
    cursor: 'pointer',
  },
}
