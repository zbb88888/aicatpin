export interface Namespace {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content?: string
  namespace_id: string
  tags: string[]
  summary?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}
