'use client'
// ============================================================
// SECOND BRAIN — NoteCard
// Single note display in the sidebar list
// ============================================================

import { useState, useRef } from 'react'
import type { Note } from '@/types'
import { getDimensionColor, getDimensionName } from '@/lib/colors'
import { dominantDimension } from '@/lib/vectorMath'

interface Props {
  note: Note
  isSelected: boolean
  searchScore?: number
  onSelect: () => void
  onDelete: () => void
  onEdit: (newContent: string) => Promise<boolean>
  isAnalyzing?: boolean
}

export default function NoteCard({ note, isSelected, searchScore, onSelect, onDelete, onEdit, isAnalyzing }: Props) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const editRef = useRef<HTMLTextAreaElement>(null)

  const domDim = dominantDimension(note.analysis.vector)
  const color = getDimensionColor(domDim)
  const category = getDimensionName(domDim)
  const date = new Date(note.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditText(note.content)
    setEditing(true)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(false)
    setEditText(note.content)
  }

  const saveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editText.trim() || editText === note.content) { setEditing(false); return }
    setSaving(true)
    const ok = await onEdit(editText.trim())
    setSaving(false)
    if (ok) setEditing(false)
  }

  if (editing) {
    return (
      <div
        style={{
          padding: '10px 12px',
          marginBottom: 6,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          border: `1px solid ${color}55`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          Editing — {category}
        </div>
        <textarea
          ref={editRef}
          value={editText}
          onChange={e => setEditText(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 7,
            color: '#e0e0f0',
            fontSize: 12,
            padding: '8px 10px',
            fontFamily: 'Inter, system-ui, sans-serif',
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          rows={4}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            onClick={saveEdit}
            disabled={saving || !editText.trim()}
            style={{
              flex: 1,
              background: saving ? 'rgba(124,58,237,0.3)' : 'rgba(124,58,237,0.7)',
              border: '1px solid rgba(124,58,237,0.5)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '5px 0',
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Analyzing…' : 'Save'}
          </button>
          <button
            onClick={cancelEdit}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#888',
              fontSize: 11,
              padding: '5px 0',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

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

      {/* Top row: category badge + date + edit + delete */}
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
            onClick={startEdit}
            disabled={isAnalyzing}
            title="Edit note"
            style={{
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555')}
          >
            ✎
          </button>
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
