// ============================================================
// SECOND BRAIN — LocalStorage Persistence
// Notes survive page refreshes — your brain never forgets
// ============================================================

import type { Note } from '@/types'

const NOTES_KEY = 'second-brain:notes'
const VERSION_KEY = 'second-brain:version'
const CURRENT_VERSION = '1'

export function loadNotes(): Note[] {
  if (typeof window === 'undefined') return []
  try {
    const version = localStorage.getItem(VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      // Future: run migrations here
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
    }
    const raw = localStorage.getItem(NOTES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Note[]
  } catch {
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  } catch (e) {
    console.warn('Failed to persist notes:', e)
  }
}

export function clearNotes(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(NOTES_KEY)
}

export function exportNotes(notes: Note[]): void {
  const json = JSON.stringify(notes, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `second-brain-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importNotes(file: File): Promise<Note[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const notes = JSON.parse(e.target?.result as string) as Note[]
        resolve(notes)
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}
