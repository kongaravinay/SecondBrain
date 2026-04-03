'use client'
// ============================================================
// SECOND BRAIN — NodeDetail (v2)
// Floating panel: full note details + connected notes
// ============================================================

import type { GraphNode, GraphEdge, Note } from '@/types'
import { getDimensionColor, getDimensionName, DIMENSION_ENTRIES } from '@/lib/colors'
import { cosineSimilarity } from '@/lib/vectorMath'

interface Props {
  node: GraphNode | null
  edges: GraphEdge[]
  allNotes: Note[]
  onClose: () => void
  onDelete: (id: string) => void
  onSelectNote: (id: string) => void
}

export default function NodeDetail({
  node,
  edges,
  allNotes,
  onClose,
  onDelete,
  onSelectNote,
}: Props) {
  if (!node) return null

  const { note } = node
  const color = getDimensionColor(node.dominantDim)
  const category = getDimensionName(node.dominantDim)
  const date = new Date(note.createdAt).toLocaleString()

  // Find connected notes (edges that include this node)
  const connectedNoteIds = new Set<string>()
  for (const edge of edges) {
    if (edge.sourceId === note.id) connectedNoteIds.add(edge.targetId)
    if (edge.targetId === note.id) connectedNoteIds.add(edge.sourceId)
  }

  const connectedNotes = allNotes
    .filter(n => connectedNoteIds.has(n.id))
    .map(n => ({
      note: n,
      similarity: cosineSimilarity(note.analysis.vector, n.analysis.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)

  // Top 5 dimensions
  const topDims = [...note.analysis.vector]
    .map((val, i) => ({ val, i }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 5)

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.panel, borderColor: `${color}40` }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...styles.badge, background: `${color}22`, color }}>{category}</div>
            <span style={styles.date}>{date}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => { onDelete(note.id); onClose() }}
              style={{ ...styles.iconBtn, color: '#ef4444' }}
              title="Delete note"
            >
              🗑
            </button>
            <button onClick={onClose} style={styles.iconBtn} title="Close">✕</button>
          </div>
        </div>

        <div style={styles.scrollArea}>
          {/* Tags */}
          <div style={styles.tags}>
            {note.analysis.tags.map(tag => (
              <span key={tag} style={{ ...styles.tag, borderColor: `${color}44`, color }}>
                #{tag}
              </span>
            ))}
          </div>

          {/* Key Insight */}
          <div style={styles.insight}>
            <span style={styles.insightIcon}>💡</span>
            <span style={styles.insightText}>{note.analysis.keyInsight}</span>
          </div>

          {/* Two-column layout for summary + dims */}
          <div style={styles.twoCol}>
            <div style={{ flex: 1 }}>
              <div style={styles.sectionLabel}>Summary</div>
              <div style={styles.summary}>{note.analysis.summary}</div>

              <div style={styles.sectionLabel}>Note</div>
              <div style={styles.content}>{note.content}</div>
            </div>

            <div style={{ width: 140, flexShrink: 0 }}>
              <div style={styles.sectionLabel}>Top Dimensions</div>
              {topDims.map(({ val, i }) => (
                <div key={i} style={styles.dimRow}>
                  <span style={{ ...styles.dimName, color: getDimensionColor(i) }}>
                    {DIMENSION_ENTRIES[i].name.slice(0, 10)}
                  </span>
                  <div style={styles.dimBarBg}>
                    <div
                      style={{
                        ...styles.dimBar,
                        width: `${val * 100}%`,
                        background: getDimensionColor(i),
                      }}
                    />
                  </div>
                  <span style={styles.dimVal}>{val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Notes */}
          {connectedNotes.length > 0 && (
            <>
              <div style={{ ...styles.sectionLabel, marginTop: 10 }}>
                Connected Notes ({connectedNotes.length})
              </div>
              <div style={styles.connections}>
                {connectedNotes.map(({ note: cn, similarity }) => {
                  const cnColor = getDimensionColor(
                    [...cn.analysis.vector].indexOf(Math.max(...cn.analysis.vector))
                  )
                  return (
                    <button
                      key={cn.id}
                      onClick={() => { onSelectNote(cn.id); }}
                      style={styles.connectionBtn}
                    >
                      <div style={{ ...styles.connectionDot, background: cnColor }} />
                      <span style={styles.connectionText}>{cn.analysis.summary.slice(0, 50)}…</span>
                      <span style={{ ...styles.connectionScore, color: cnColor }}>
                        {Math.round(similarity * 100)}%
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'calc(100% - 40px)',
    maxWidth: 640,
    zIndex: 50,
    pointerEvents: 'all',
    animation: 'fadeInUp 0.2s ease',
  },
  panel: {
    background: 'rgba(10,10,20,0.98)',
    border: '1px solid',
    borderRadius: 14,
    padding: '12px 14px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
    backdropFilter: 'blur(16px)',
    maxHeight: '55vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexShrink: 0,
  },
  badge: {
    fontSize: 9,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  date: { fontSize: 10, color: '#555' },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666',
    fontSize: 13,
    padding: '3px 5px',
    borderRadius: 5,
  },
  scrollArea: {
    overflowY: 'auto',
    flex: 1,
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
  },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  tag: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 20,
    border: '1px solid',
    background: 'rgba(255,255,255,0.03)',
  },
  insight: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    padding: '7px 10px',
    marginBottom: 10,
  },
  insightIcon: { fontSize: 13, flexShrink: 0 },
  insightText: { fontSize: 12, color: '#a8e6cf', lineHeight: 1.5, fontStyle: 'italic' },
  twoCol: { display: 'flex', gap: 14 },
  sectionLabel: {
    fontSize: 9,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
    marginBottom: 3,
  },
  summary: { fontSize: 12, color: '#c0c0d8', lineHeight: 1.5, marginBottom: 8 },
  content: {
    fontSize: 11,
    color: '#666',
    lineHeight: 1.6,
    maxHeight: 60,
    overflowY: 'auto',
    padding: '5px 7px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 5,
    border: '1px solid rgba(255,255,255,0.05)',
    whiteSpace: 'pre-wrap',
  },
  dimRow: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 },
  dimName: { fontSize: 9, width: 56, flexShrink: 0, fontWeight: 600 },
  dimBarBg: { flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' },
  dimBar: { height: '100%', borderRadius: 2 },
  dimVal: { fontSize: 9, color: '#555', width: 26, textAlign: 'right' },
  connections: { display: 'flex', flexDirection: 'column', gap: 3 },
  connectionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 7,
    padding: '5px 8px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'background 0.15s',
  },
  connectionDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  connectionText: { flex: 1, fontSize: 11, color: '#999' },
  connectionScore: { fontSize: 10, fontWeight: 700, flexShrink: 0 },
}
