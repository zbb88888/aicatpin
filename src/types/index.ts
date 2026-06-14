export type SaveStatus = 'idle' | 'extracting' | 'embedding' | 'saving' | 'syncing' | 'success' | 'error'

export interface SaveResult {
  success: boolean
  id?: string
  error?: string
  metadata?: { title: string; category: string; tags: string[]; summary: string }
}
