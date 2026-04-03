'use client'
// ============================================================
// SECOND BRAIN — SearchBar
// Semantic vector search powered by Claude
// ============================================================

import { useState, useCallback } from 'react'

interface Props {
  onSearch: (query: string) => Promise<void>
  onClear: () => void
  isSearching: boolean
  hasResults: boolean
  resultCount: number
}

export default function SearchBar({ onSearch, onClear, isSearching, hasResults, resultCount }: Props) {
  const [query, setQuery] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return
    await onSearch(query.trim())
  }, [query, isSearching, onSearch])

  const handleClear = () => {
    setQuery('')
    onClear()
  }

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputWrapper}>
          <span style={styles.searchIcon}>⌕</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Semantic search…"
            style={styles.input}
            disabled={isSearching}
          />
          {(query || hasResults) && (
            <button type="button" onClick={handleClear} style={styles.clearBtn}>×</button>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          style={{
            ...styles.searchBtn,
            opacity: !query.trim() || isSearching ? 0.4 : 1,
          }}
        >
          {isSearching ? '…' : '↵'}
        </button>
      </form>

      {hasResults && (
        <div style={styles.hint}>
          {resultCount} result{resultCount !== 1 ? 's' : ''} ranked by semantic similarity
        </div>
      )}

      {!hasResults && !isSearching && (
        <div style={styles.hint}>Uses vector cosine similarity to find related notes</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '10px 12px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  form: {
    display: 'flex',
    gap: 6,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 8,
    color: '#555',
    fontSize: 16,
    pointerEvents: 'none',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#e0e0f0',
    padding: '6px 28px 6px 28px',
    fontSize: 12,
    fontFamily: 'Inter, system-ui, sans-serif',
    outline: 'none',
    width: '100%',
  },
  clearBtn: {
    position: 'absolute',
    right: 6,
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
    lineHeight: 1,
  },
  searchBtn: {
    background: 'rgba(124,58,237,0.3)',
    border: '1px solid rgba(124,58,237,0.4)',
    borderRadius: 8,
    color: '#a78bfa',
    width: 34,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 9,
    color: '#444',
    marginTop: 4,
    paddingLeft: 2,
  },
}
