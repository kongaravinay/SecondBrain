'use client'
// ============================================================
// SECOND BRAIN — NoteList
// Scrollable list of notes in the sidebar
// ============================================================

import type { Note, SearchResult } from '@/types'
import NoteCard from './NoteCard'

interface Props {
  notes: Note[]
  searchResults: SearchResult[] | null
  selectedNoteId: string | null
  onSelectNote: (id: string) => void
  onDeleteNote: (id: string) => void
}

export default function NoteList({
  notes,
  searchResults,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
}: Props) {
  const displayItems = searchResults ?? notes.map(n => ({ note: n, score: undefined }))

  if (displayItems.length === 0) {
    return (
      <div style={styles.empty}>
        {searchResults !== null ? (
          <>
            <div style={styles.emptyIcon}>⊘</div>
            <div>No matching notes found</div>
          </>
        ) : (
          <>
            <div style={styles.emptyIcon}>◎</div>
            <div>No notes yet</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
              Add your first idea below
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {displayItems.map(item => (
        <NoteCard
          key={item.note.id}
          note={item.note}
          isSelected={item.note.id === selectedNoteId}
          searchScore={'score' in item ? item.score : undefined}
          onSelect={() => onSelectNote(item.note.id)}
          onDelete={() => onDeleteNote(item.note.id)}
        />
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
  },
  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#555',
    fontSize: 13,
    padding: 20,
    textAlign: 'center',
    gap: 4,
  },
  emptyIcon: {
    fontSize: 28,
    color: '#333',
    marginBottom: 4,
  },
}
