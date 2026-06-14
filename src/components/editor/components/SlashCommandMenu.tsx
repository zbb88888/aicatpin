import { useState, useEffect, useCallback, useRef } from 'react'
import { Editor, Range } from '@tiptap/core'
import { cn } from '@/lib/utils'
import { getFilteredCommands, SlashCommandOption } from '../extensions/SlashCommand'

interface SlashCommandMenuProps {
  editor: Editor
  range: Range
  query: string
  items: SlashCommandOption[]
  command: (item: SlashCommandOption) => void
}

export function SlashCommandMenu({
  editor,
  range,
  query,
  items,
  command,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  // 过滤命令
  const filteredItems = getFilteredCommands(query, items)

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // 滚动到选中项
  useEffect(() => {
    if (menuRef.current) {
      const selectedElement = menuRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [selectedIndex])

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1))
        return true
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0))
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const item = filteredItems[selectedIndex]
        if (item) {
          command(item)
        }
        return true
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        // 取消斜杠命令
        editor.chain().focus().deleteRange(range).run()
        return true
      }

      return false
    },
    [editor, range, filteredItems, selectedIndex, command]
  )

  // 注册键盘事件
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  // 如果没有匹配项，显示空状态
  if (filteredItems.length === 0) {
    return (
      <div className="slash-command-menu">
        <div className="slash-command-empty">
          <p>没有找到匹配的命令</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="slash-command-menu"
      role="listbox"
      aria-label="斜杠命令菜单"
    >
      <div className="slash-command-header">
        <span className="text-xs text-cyan-400/60">斜杠命令</span>
      </div>
      
      <div className="slash-command-list">
        {filteredItems.map((item, index) => (
          <button
            key={item.title}
            className={cn(
              'slash-command-item',
              index === selectedIndex && 'slash-command-item-selected'
            )}
            onClick={() => command(item)}
            onMouseEnter={() => setSelectedIndex(index)}
            role="option"
            aria-selected={index === selectedIndex}
            data-index={index}
          >
            <div className="slash-command-icon">
              {item.icon}
            </div>
            <div className="slash-command-content">
              <div className="slash-command-title">{item.title}</div>
              <div className="slash-command-description">
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="slash-command-footer">
        <div className="flex items-center gap-2 text-xs text-cyan-400/40">
          <kbd className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            ↑↓
          </kbd>
          <span>导航</span>
          <kbd className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            Enter
          </kbd>
          <span>选择</span>
          <kbd className="px-1 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
            Esc
          </kbd>
          <span>取消</span>
        </div>
      </div>
    </div>
  )
}