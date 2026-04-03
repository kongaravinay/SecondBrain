'use client'
// ============================================================
// SECOND BRAIN — NoteInput
// The main input form for adding new notes
// ============================================================

import { useState, useRef, useCallback } from 'react'
import type { NoteAnalysis } from '@/types'
import { getDimensionColor, getDimensionName, DIMENSION_ENTRIES } from '@/lib/colors'

interface Props {
  onAddNote: (content: string) => Promise<void>
  isAnalyzing: boolean
  lastAnalysis: NoteAnalysis | null
  error: string | null
}

export default function NoteInput({ onAddNote, isAnalyzing, lastAnalysis, error }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || isAnalyzing) return
    await onAddNote(text)
    setText('')
    textareaRef.current?.focus()
  }, [text, isAnalyzing, onAddNote])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.inputArea}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a note, idea, concept, or insight… (Ctrl+Enter to analyze)"
          disabled={isAnalyzing}
          style={styles.textarea}
          rows={3}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isAnalyzing}
          style={{
            ...styles.button,
            opacity: !text.trim() || isAnalyzing ? 0.4 : 1,
          }}
        >
          {isAnalyzing ? (
            <span style={styles.loadingText}>
              <span style={styles.spinner} />
              Analyzing…
            </span>
          ) : (
            '+ Add to Brain'
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>
          ⚠ {error}
        </div>
      )}

      {/* AI Analysis Result */}
      {lastAnalysis && !isAnalyzing && (
        <div style={styles.analysisCard}>
          <div style={styles.analysisHeader}>
            AI Analysis
          </div>

          <div style={styles.tags}>
            {lastAnalysis.tags.map(tag => (
              <span key={tag} style={styles.tag}>#{tag}</span>
            ))}
          </div>

          <div style={styles.summaryRow}>
            <span style={styles.label}>Summary</span>
            <span style={styles.value}>{lastAnalysis.summary}</span>
          </div>

          <div style={styles.summaryRow}>
            <span style={styles.label}>Key Insight</span>
            <span style={{ ...styles.value, color: '#a8e6cf', fontStyle: 'italic' }}>
              {lastAnalysis.keyInsight}
            </span>
          </div>

          {/* Vector visualization — mini bar chart */}
          <div style={styles.vectorLabel}>Concept Vector (20 dimensions)</div>
          <div style={styles.vectorGrid}>
            {lastAnalysis.vector.map((val, i) => (
              <div key={i} style={styles.vectorItem} title={`${DIMENSION_ENTRIES[i].name}: ${val.toFixed(2)}`}>
                <div style={styles.vectorBarBg}>
                  <div
                    style={{
                      ...styles.vectorBar,
                      height: `${val * 100}%`,
                      backgroundColor: getDimensionColor(i),
                      boxShadow: val > 0.5 ? `0 0 6px ${getDimensionColor(i)}` : 'none',
                    }}
                  />
                </div>
                <div style={{ ...styles.vectorDimLabel, color: val > 0.5 ? getDimensionColor(i) : '#555' }}>
                  {getDimensionName(i).slice(0, 4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(10,10,20,0.95)',
    padding: '14px 16px',
  },
  inputArea: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#e0e0f0',
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
  },
  button: {
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    height: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.2s',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  spinner: {
    display: 'inline-block',
    width: 12,
    height: 12,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  error: {
    marginTop: 8,
    color: '#f87171',
    fontSize: 12,
    padding: '6px 10px',
    background: 'rgba(239,68,68,0.1)',
    borderRadius: 6,
    border: '1px solid rgba(239,68,68,0.2)',
  },
  analysisCard: {
    marginTop: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '12px 14px',
  },
  analysisHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: '#7c3aed',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    fontSize: 11,
    color: '#a78bfa',
    background: 'rgba(124,58,237,0.12)',
    padding: '2px 8px',
    borderRadius: 20,
    border: '1px solid rgba(124,58,237,0.25)',
  },
  summaryRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: '#666',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  value: {
    fontSize: 12,
    color: '#c0c0d8',
    lineHeight: 1.5,
  },
  vectorLabel: {
    fontSize: 10,
    color: '#555',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  },
  vectorGrid: {
    display: 'flex',
    gap: 3,
    alignItems: 'flex-end',
    height: 50,
  },
  vectorItem: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    height: '100%',
  },
  vectorBarBg: {
    flex: 1,
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  vectorBar: {
    width: '100%',
    borderRadius: 3,
    transition: 'height 0.3s ease',
  },
  vectorDimLabel: {
    fontSize: 7,
    textAlign: 'center',
    lineHeight: 1,
  },
}
