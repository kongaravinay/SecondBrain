'use client'
// ============================================================
// SECOND BRAIN — RAG Chat Panel
// Ask questions, get answers grounded in your own notes
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Note } from '@/types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Note[]
  isLoading?: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onAsk: (question: string) => Promise<{ answer: string; sources: Note[] }>
  noteCount: number
}

export default function ChatPanel({ isOpen, onClose, onAsk, noteCount }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const handleSubmit = useCallback(async () => {
    const q = input.trim()
    if (!q || isLoading) return

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: q,
    }
    const loadingMsg: ChatMessage = {
      id: `loading_${Date.now()}`,
      role: 'assistant',
      content: '',
      isLoading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInput('')
    setIsLoading(true)

    try {
      const { answer, sources } = await onAsk(q)
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          id: `ans_${Date.now()}`,
          role: 'assistant',
          content: answer,
          sources,
        },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.isLoading),
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, onAsk])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerIcon}>🧠</span>
            <div>
              <div style={styles.headerTitle}>Ask Your Brain</div>
              <div style={styles.headerSub}>{noteCount} note{noteCount !== 1 ? 's' : ''} in memory</div>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>💬</div>
              <div style={styles.emptyTitle}>Ask anything about your notes</div>
              <div style={styles.emptyHint}>
                {noteCount === 0
                  ? 'Add some notes first, then ask questions about them.'
                  : 'The AI will search your notes and answer using your own knowledge.'}
              </div>
              {noteCount > 0 && (
                <div style={styles.suggestions}>
                  {['What have I learned about AI?', 'Summarize my key insights', 'What connects my notes?'].map(s => (
                    <button key={s} style={styles.suggestionBtn} onClick={() => { setInput(s); inputRef.current?.focus() }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
              {msg.role === 'assistant' && (
                <div style={styles.aiLabel}>🧠 Brain</div>
              )}

              {msg.isLoading ? (
                <div style={styles.loadingDots}>
                  <span style={{ ...styles.dot, animationDelay: '0ms' }} />
                  <span style={{ ...styles.dot, animationDelay: '150ms' }} />
                  <span style={{ ...styles.dot, animationDelay: '300ms' }} />
                </div>
              ) : (
                <div style={styles.msgContent}>{msg.content}</div>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div style={styles.sources}>
                  <div style={styles.sourcesLabel}>Sources used:</div>
                  {msg.sources.map((note, i) => (
                    <div key={note.id} style={styles.sourceItem}>
                      <span style={styles.sourceNum}>{i + 1}</span>
                      <span style={styles.sourceText}>
                        {note.content.length > 80 ? note.content.slice(0, 80) + '…' : note.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your brain anything…"
            style={styles.textarea}
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            style={{
              ...styles.sendBtn,
              opacity: !input.trim() || isLoading ? 0.4 : 1,
            }}
          >
            ↑
          </button>
        </div>
        <div style={styles.inputHint}>Enter to send · Shift+Enter for newline</div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 380,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'none',
  },
  panel: {
    position: 'absolute',
    top: 12,
    right: 12,
    bottom: 12,
    width: 360,
    background: 'rgba(10,10,20,0.97)',
    border: '1px solid rgba(124,58,237,0.3)',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)',
    pointerEvents: 'all',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    color: '#e0e0f0',
    fontSize: 14,
    fontWeight: 600,
  },
  headerSub: {
    color: '#555',
    fontSize: 10,
    marginTop: 1,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: 22,
    lineHeight: 1,
    padding: '0 2px',
    transition: 'color 0.15s',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
    padding: '20px 10px',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#a0a0c0',
    fontSize: 14,
    fontWeight: 500,
  },
  emptyHint: {
    color: '#555',
    fontSize: 11,
    lineHeight: 1.5,
    maxWidth: 240,
  },
  suggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 8,
    width: '100%',
  },
  suggestionBtn: {
    background: 'rgba(124,58,237,0.12)',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 8,
    color: '#a78bfa',
    fontSize: 11,
    padding: '7px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.15s',
  },
  userMsg: {
    alignSelf: 'flex-end',
    background: 'rgba(124,58,237,0.25)',
    border: '1px solid rgba(124,58,237,0.35)',
    borderRadius: '12px 12px 4px 12px',
    padding: '9px 13px',
    maxWidth: '85%',
  },
  aiMsg: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px 12px 12px 4px',
    padding: '9px 13px',
    maxWidth: '92%',
  },
  aiLabel: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  msgContent: {
    color: '#d0d0e8',
    fontSize: 12,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  loadingDots: {
    display: 'flex',
    gap: 5,
    padding: '4px 2px',
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#7c3aed',
    display: 'inline-block',
    animation: 'bounce 1.2s infinite ease-in-out',
  },
  sources: {
    marginTop: 10,
    borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingTop: 8,
  },
  sourcesLabel: {
    color: '#555',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  sourceItem: {
    display: 'flex',
    gap: 6,
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sourceNum: {
    background: 'rgba(124,58,237,0.3)',
    color: '#a78bfa',
    borderRadius: 4,
    fontSize: 9,
    padding: '1px 5px',
    flexShrink: 0,
    marginTop: 1,
  },
  sourceText: {
    color: '#666',
    fontSize: 10,
    lineHeight: 1.4,
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '10px 14px 6px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#e0e0f0',
    padding: '8px 12px',
    fontSize: 12,
    fontFamily: 'Inter, system-ui, sans-serif',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
  },
  sendBtn: {
    background: 'rgba(124,58,237,0.5)',
    border: '1px solid rgba(124,58,237,0.6)',
    borderRadius: 10,
    color: '#e0e0f0',
    width: 36,
    height: 36,
    fontSize: 16,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s',
  },
  inputHint: {
    color: '#333',
    fontSize: 9,
    textAlign: 'center',
    paddingBottom: 8,
  },
}
