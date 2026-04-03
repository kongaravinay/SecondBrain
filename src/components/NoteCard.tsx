'use client'
// ============================================================
// SECOND BRAIN — NoteCard
// Single note display in the sidebar list
// ============================================================

import type { Note } from '@/types'
import { getDimensionColor, getDimensionName } from '@/lib/colors'
import { dominantDimension } from '@/lib/vectorMath'

interface Props {
  note: Note
  isSelected: boolean
  searchScore?: number
  onSelect: () => void
  onDelete: () => void
}

export default function NoteCard({ note, isSelected, searchScore, onSelect, onDelete }: Props) {
  const domDim = dominantDimension(note.analysis.vector)
  const color = getDimensionColor(domDim)
  const category = getDimensionName(domDim)
  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 12px',
        marginBottom: 6,
        borderRadius: 10,
        cursor: 'pointer',
        background: isSelected
          ? `linear-gradient(135deg, ${color}18, ${color}08)`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isSelected ? color + '55' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      {/* Color strip on left */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '20%',
          height: '60%',
          width: 3,
          borderRadius: '0 3px 3px 0',
          background: color,
          opacity: 0.7,
        }}
      />

      {/* Top row: category badge + date + delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, paddingLeft: 6 }}>
        <span style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {searchScore !== undefined && (
            <span style={{ fontSize: 9, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: 4 }}>
              {Math.round(searchScore * 100)}%
            </span>
          )}
          <span style={{ fontSize: 9, color: '#555' }}>{date}</span>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            ×
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 12, color: '#c0c0d8', lineHeight: 1.4, paddingLeft: 6, marginBottom: 5 }}>
        {note.analysis.summary}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 6 }}>
        {note.analysis.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            style={{
              fontSize: 9,
              color: '#888',
              background: 'rgba(255,255,255,0.05)',
              padding: '1px 6px',
              borderRadius: 20,
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}
