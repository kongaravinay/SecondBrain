'use client'
// ============================================================
// SECOND BRAIN — Main Page (v2)
// Orchestrates the full application
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react'
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

export default function Page() {
  const mainRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [graphSize, setGraphSize] = useState({ width: 800, height: 600 })
  const [chatOpen, setChatOpen] = useState(false)
  const hasSynced = useRef(false)

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

  // ---- Add note ----
  const handleAddNote = useCallback(
    async (content: string) => {
      const note = await addNote(content)
      if (note) addNoteToGraph(note)
    },
    [addNote, addNoteToGraph]
  )

  // ---- Delete note ----
  const handleDeleteNote = useCallback(
    (id: string) => {
      deleteNote(id)
      removeNodeFromGraph(id)
      if (selectedNodeId === id) setSelectedNodeId(null)
    },
    [deleteNote, removeNodeFromGraph, selectedNodeId, setSelectedNodeId]
  )

  // ---- Select note: highlights both list and graph node ----
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
    clearAllNotes()
    syncWithNotes([])
    setSelectedNodeId(null)
  }, [clearAllNotes, syncWithNotes, setSelectedNodeId])

  // Don't render anything until client has mounted — prevents SSR/hydration mismatch
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
              title="Ask your brain"
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
        </div>
      </div>

      {/* BOTTOM: Note input */}
      <NoteInput
        onAddNote={handleAddNote}
        isAnalyzing={isAnalyzing}
        lastAnalysis={lastAnalysis}
        error={error}
      />
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
}
