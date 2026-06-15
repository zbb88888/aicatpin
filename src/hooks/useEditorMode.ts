import { useState, useCallback } from 'react'

// 云端笔记元数据
export interface CloudNote {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: string
  created_at: string
  updated_at: string
}

export function useEditorMode() {
  const [currentNote, setCurrentNote] = useState<CloudNote | null>(null)
  const [localFilename, setLocalFilename] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<string>('')

  // 从云端加载笔记
  const loadFromCloud = useCallback((note: CloudNote) => {
    setCurrentNote(note)
    setEditedContent(note.content)
    setLocalFilename(null)
  }, [])

  // 更新编辑内容
  const updateContent = useCallback((content: string) => {
    setEditedContent(content)
  }, [])

  // 清除本地文件名（同步入库后调用）
  const clearLocalFilename = useCallback(() => {
    setLocalFilename(null)
  }, [])

  // 清除所有状态（新建笔记时）
  const clearAll = useCallback(() => {
    setCurrentNote(null)
    setLocalFilename(null)
    setEditedContent('')
  }, [])

  return {
    currentNote,
    localFilename,
    editedContent,
    loadFromCloud,
    updateContent,
    clearLocalFilename,
    clearAll,
  }
}
