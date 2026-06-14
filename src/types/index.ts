export type SaveStatus = 'idle' | 'extracting' | 'embedding' | 'saving' | 'syncing' | 'success' | 'error'

export interface SaveResult {
  success: boolean
  id?: string
  error?: string
  metadata?: {
    title: string
    category: string
    tags: string[]
    summary: string
  }
}

export interface Note {
  id: string
  title: string
  content?: string
  category: string
  tags: string[]
  summary?: string
  created_at: string
  updated_at: string
}
