import { useState, useCallback, useRef } from 'react'

// 编辑器模式：只读浏览 vs 编辑态
export type EditorMode = 'browsing' | 'editing'

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
  const [mode, setMode] = useState<EditorMode>('browsing')
  const [currentNote, setCurrentNote] = useState<CloudNote | null>(null)
  const [localFilename, setLocalFilename] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState<string>('')
  const originalContent = useRef<string>('')

  // 从云端加载笔记（只读浏览）
  const loadFromCloud = useCallback((note: CloudNote) => {
    setCurrentNote(note)
    setEditedContent(note.content)
    originalContent.current = note.content
    setMode('browsing')
    setLocalFilename(null)
  }, [])

  // 检出到本地编辑
  const checkoutForEdit = useCallback((note: CloudNote, localFile: string, content: string) => {
    setCurrentNote(note)
    setEditedContent(content)
    originalContent.current = content
    setLocalFilename(localFile)
    setMode('editing')
  }, [])

  // 更新编辑内容
  const updateContent = useCallback((content: string) => {
    setEditedContent(content)
  }, [])

  // 退出编辑态，回到只读浏览
  const exitEditMode = useCallback(() => {
    setMode('browsing')
    setLocalFilename(null)
    // 保持 currentNote 不变，继续显示云端内容
  }, [])

  // 清除所有状态（新建笔记时）
  const clearAll = useCallback(() => {
    setMode('editing')
    setCurrentNote(null)
    setLocalFilename(null)
    setEditedContent('')
    originalContent.current = ''
  }, [])

  return {
    mode,
    currentNote,
    localFilename,
    editedContent,
    loadFromCloud,
    checkoutForEdit,
    updateContent,
    exitEditMode,
    clearAll,
  }
}
