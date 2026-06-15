import { useState, useCallback, useRef } from 'react'

// Tauri API 动态导入
const getTauriAPI = async () => {
  try {
    const core = await import('@tauri-apps/api/core')
    const dialog = await import('@tauri-apps/plugin-dialog')
    const fs = await import('@tauri-apps/plugin-fs')
    const path = await import('@tauri-apps/api/path')
    return {
      invoke: core.invoke,
      open: dialog.open,
      writeTextFile: fs.writeTextFile,
      readTextFile: fs.readTextFile,
      removeFile: fs.remove,
      exists: fs.exists,
      appDataDir: path.appDataDir,
      join: path.join
    }
  } catch {
    return null
  }
}

interface WorkspaceConfig {
  workspaceDir: string
  lastUsed: number
}

interface LocalDraft {
  filename: string
  content: string
  timestamp: number
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'syncing' | 'synced' | 'error'

export function useLocalWorkspace() {
  const [workspaceDir, setWorkspaceDir] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [currentDraft, setCurrentDraft] = useState<LocalDraft | null>(null)
  const configLoaded = useRef(false)

  // 加载工作区配置
  const loadWorkspaceConfig = useCallback(async (): Promise<string | null> => {
    const api = await getTauriAPI()
    if (!api) return null

    try {
      const dataDir = await api.appDataDir()
      const configPath = await api.join(dataDir, 'workspace.json')
      
      if (await api.exists(configPath)) {
        const configStr = await api.readTextFile(configPath)
        const config: WorkspaceConfig = JSON.parse(configStr)
        setWorkspaceDir(config.workspaceDir)
        configLoaded.current = true
        return config.workspaceDir
      }
    } catch (e) {
      console.error('加载工作区配置失败:', e)
    }
    
    configLoaded.current = true
    return null
  }, [])

  // 保存工作区配置
  const saveWorkspaceConfig = useCallback(async (dir: string) => {
    const api = await getTauriAPI()
    if (!api) return

    try {
      const dataDir = await api.appDataDir()
      const configPath = await api.join(dataDir, 'workspace.json')
      const config: WorkspaceConfig = { workspaceDir: dir, lastUsed: Date.now() }
      await api.writeTextFile(configPath, JSON.stringify(config, null, 2))
      setWorkspaceDir(dir)
    } catch (e) {
      console.error('保存工作区配置失败:', e)
    }
  }, [])

  // JIT 触发目录选取
  const ensureWorkspace = useCallback(async (): Promise<string | null> => {
    // 如果已有工作区，直接返回
    if (workspaceDir) return workspaceDir

    // 尝试加载配置
    const savedDir = await loadWorkspaceConfig()
    if (savedDir) return savedDir

    // 触发目录选取对话框
    const api = await getTauriAPI()
    if (!api) {
      console.warn('Tauri API 不可用，无法选取目录')
      return null
    }

    try {
      const selected = await api.open({
        directory: true,
        title: '选择草稿暂存区',
        defaultPath: await api.appDataDir(),
      })

      if (selected && typeof selected === 'string') {
        await saveWorkspaceConfig(selected)
        return selected
      }
    } catch (e) {
      console.error('目录选取失败:', e)
    }

    return null
  }, [workspaceDir, loadWorkspaceConfig, saveWorkspaceConfig])

  // 保存本地草稿 (JIT 触发)
  const saveLocalDraft = useCallback(async (content: string, filename?: string): Promise<boolean> => {
    setSaveStatus('saving')

    const dir = await ensureWorkspace()
    if (!dir) {
      setSaveStatus('error')
      return false
    }

    const api = await getTauriAPI()
    if (!api) {
      setSaveStatus('error')
      return false
    }

    try {
      // 生成文件名：使用第一行作为文件名，或使用时间戳
      const firstLine = content.split('\n')[0]?.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 50) || ''
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      const name = filename || (firstLine ? `${firstLine}_${timestamp}.md` : `draft_${timestamp}.md`)
      
      const filePath = await api.join(dir, name)
      await api.writeTextFile(filePath, content)

      setCurrentDraft({ filename: name, content, timestamp: Date.now() })
      setSaveStatus('saved')
      
      // 2秒后重置状态
      setTimeout(() => setSaveStatus('idle'), 2000)
      return true
    } catch (e) {
      console.error('保存本地草稿失败:', e)
      setSaveStatus('error')
      return false
    }
  }, [ensureWorkspace])

  // 读取本地草稿
  const readLocalDraft = useCallback(async (filename: string): Promise<string | null> => {
    if (!workspaceDir) return null

    const api = await getTauriAPI()
    if (!api) return null

    try {
      const filePath = await api.join(workspaceDir, filename)
      if (await api.exists(filePath)) {
        return await api.readTextFile(filePath)
      }
    } catch (e) {
      console.error('读取本地草稿失败:', e)
    }
    return null
  }, [workspaceDir])

  // 删除本地草稿
  const deleteLocalDraft = useCallback(async (filename: string): Promise<boolean> => {
    if (!workspaceDir) return false

    const api = await getTauriAPI()
    if (!api) return false

    try {
      const filePath = await api.join(workspaceDir, filename)
      if (await api.exists(filePath)) {
        await api.removeFile(filePath)
        setCurrentDraft(null)
        return true
      }
    } catch (e) {
      console.error('删除本地草稿失败:', e)
    }
    return false
  }, [workspaceDir])

  return {
    workspaceDir,
    saveStatus,
    currentDraft,
    loadWorkspaceConfig,
    ensureWorkspace,
    saveLocalDraft,
    readLocalDraft,
    deleteLocalDraft,
  }
}
