'use client'
// ============================================================
// SECOND BRAIN — Header (v2)
// Top bar: title, stats, threshold, import/export
// ============================================================

interface Props {
  noteCount: number
  edgeCount: number
  similarityThreshold: number
  onThresholdChange: (val: number) => void
  onClearAll: () => void
  onExport: () => void
  onImport: (file: File) => void
}

export default function Header({
  noteCount,
  edgeCount,
  similarityThreshold,
  onThresholdChange,
  onClearAll,
  onExport,
  onImport,
}: Props) {
  const handleImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) onImport(file)
    }
    input.click()
  }

  return (
    <header style={styles.header}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.logo}>◈</div>
        <div>
          <div style={styles.title}>Second Brain</div>
          <div style={styles.subtitle}>AI Knowledge Graph</div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <Stat label="Notes" value={noteCount} color="#a855f7" />
        <Stat label="Connections" value={edgeCount} color="#3b82f6" />
      </div>

      {/* Threshold */}
      <div style={styles.control}>
        <label style={styles.controlLabel}>
          Edge threshold&nbsp;
          <span style={{ color: '#a855f7' }}>{similarityThreshold.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0.2}
          max={0.95}
          step={0.05}
          value={similarityThreshold}
          onChange={e => onThresholdChange(parseFloat(e.target.value))}
          style={styles.slider}
          title="Only show connections above this similarity score"
        />
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button onClick={handleImportClick} style={styles.btn} title="Import notes from JSON">
          ↓ Import
        </button>
        <button onClick={onExport} style={styles.btn} title="Export notes as JSON">
          ↑ Export
        </button>
        <button
          onClick={() => {
            if (confirm('Delete all notes? This cannot be undone.')) onClearAll()
          }}
          style={{ ...styles.btn, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
        >
          Clear
        </button>
      </div>
    </header>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 40 }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 56,
    background: 'rgba(8,8,16,0.98)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 20,
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 22,
    color: '#7c3aed',
    lineHeight: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e0e0f0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: 9,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  stats: {
    display: 'flex',
    gap: 20,
    marginLeft: 8,
  },
  control: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginLeft: 'auto',
  },
  controlLabel: {
    fontSize: 9,
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 600,
  },
  slider: {
    width: 110,
    accentColor: '#7c3aed',
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  btn: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 7,
    color: '#888',
    fontSize: 11,
    fontWeight: 600,
    padding: '5px 11px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
}
