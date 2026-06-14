import MarkdownIt from 'markdown-it'

// 创建 markdown-it 实例
const md: MarkdownIt = new MarkdownIt({
  html: false,        // 禁用 HTML 标签（安全）
  linkify: true,      // 自动转换 URL 为链接
  typographer: true,  // 启用排版优化
  breaks: true,       // 换行符转换为 <br>
  highlight: (str: string, lang: string): string => {
    // 代码高亮占位（可后续集成 highlight.js）
    return `<pre class="code-block"><code class="language-${lang}">${md.utils.escapeHtml(str)}</code></pre>`
  },
})

/**
 * 将 Markdown 转换为 HTML
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  return md.render(markdown)
}

/**
 * 将 Markdown 转换为纯文本（去除格式）
 */
export function markdownToText(markdown: string): string {
  if (!markdown) return ''
  const html = md.render(markdown)
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * 提取 Markdown 中的标题
 */
export function extractHeadings(markdown: string): Array<{ level: number; text: string }> {
  if (!markdown) return []
  
  const headings: Array<{ level: number; text: string }> = []
  const lines = markdown.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      })
    }
  }
  
  return headings
}

/**
 * 提取 Markdown 中的链接
 */
export function extractLinks(markdown: string): Array<{ text: string; url: string }> {
  if (!markdown) return []
  
  const links: Array<{ text: string; url: string }> = []
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match
  
  while ((match = regex.exec(markdown)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
    })
  }
  
  return links
}

/**
 * 提取 Markdown 中的代码块
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  if (!markdown) return []
  
  const codeBlocks: Array<{ language: string; code: string }> = []
  const regex = /```(\w*)\n([\s\S]*?)```/g
  let match
  
  while ((match = regex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    })
  }
  
  return codeBlocks
}

/**
 * 计算 Markdown 内容的统计信息
 */
export function getMarkdownStats(markdown: string): {
  characters: number
  words: number
  lines: number
  headings: number
  codeBlocks: number
  links: number
} {
  if (!markdown) {
    return { characters: 0, words: 0, lines: 0, headings: 0, codeBlocks: 0, links: 0 }
  }
  
  return {
    characters: markdown.length,
    words: markdown.split(/\s+/).filter(Boolean).length,
    lines: markdown.split('\n').length,
    headings: extractHeadings(markdown).length,
    codeBlocks: extractCodeBlocks(markdown).length,
    links: extractLinks(markdown).length,
  }
}

export default md