'use client'
// ============================================================
// SECOND BRAIN — DimensionLegend
// Shows all 20 knowledge dimensions with color swatches
// ============================================================

import { useState } from 'react'
import { DIMENSION_ENTRIES } from '@/lib/colors'
import type { Note } from '@/types'
import { dominantDimension } from '@/lib/vectorMath'

interface Props {
  notes: Note[]
}

export default function DimensionLegend({ notes }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  // Count notes per dimension
  const counts = new Array(20).fill(0)
  for (const note of notes) {
    counts[dominantDimension(note.analysis.vector)]++
  }

  const maxCount = Math.max(...counts, 1)

  return (
    <div style={styles.container}>
      <button onClick={() => setCollapsed(c => !c)} style={styles.toggle}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Dimensions
        </span>
        <span style={{ color: '#555', fontSize: 10 }}>{collapsed ? '▶' : '▼'}</span>
      </button>

      {!collapsed && (
        <div style={styles.grid}>
          {DIMENSION_ENTRIES.map(({ index, name, color }) => (
            <div
              key={index}
              style={{
                ...styles.entry,
                opacity: counts[index] === 0 ? 0.35 : 1,
              }}
              title={`${name}: ${counts[index]} note${counts[index] !== 1 ? 's' : ''}`}
            >
              <div
                style={{
                  ...styles.dot,
                  background: color,
                  boxShadow: counts[index] > 0 ? `0 0 6px ${color}88` : 'none',
                }}
              />
              <span style={{ ...styles.name, color: counts[index] > 0 ? '#bbb' : '#555' }}>
                {name}
              </span>
              {counts[index] > 0 && (
                <div style={styles.barBg}>
                  <div
                    style={{
                      ...styles.bar,
                      width: `${(counts[index] / maxCount) * 100}%`,
                      background: color,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '6px 10px',
  },
  toggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 0 4px',
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'opacity 0.2s',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  name: {
    fontSize: 10,
    flex: 1,
  },
  barBg: {
    width: 40,
    height: 3,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s',
  },
}
