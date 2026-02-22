import type { TaskListItem } from '@/types'

/**
 * Shift all markdown headings down by `levels` (e.g. ## -> ###).
 * Removes H1 headings entirely (they duplicate the field title).
 */
export function shiftHeadings(md: string, levels = 1): string {
  return md
    .split('\n')
    .map((line) => {
      const match = line.match(/^(#{1,6})\s/)
      if (!match) return line
      const depth = match[1].length
      if (depth === 1) return null
      const newDepth = Math.min(depth + levels, 6)
      return '#'.repeat(newDepth) + line.slice(depth)
    })
    .filter((line): line is string => line !== null)
    .join('\n')
}

export function taskListToMarkdown(items: TaskListItem[]): string {
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
  return sorted
    .map((item) => {
      const done = item.status === 'done'
      const skipped = item.status === 'wont_do'
      const checkbox = done ? '[x]' : skipped ? '[-]' : '[ ]'
      const typeTag = item.type === 'delegated' ? ' *(delegiert)*' : ''
      let line = `- ${checkbox} **${item.title}**${typeTag}`
      if (item.notes?.trim()) {
        line += `\n  ${item.notes.trim().replace(/\n/g, '\n  ')}`
      }
      if (item.result?.trim()) {
        line += `\n  > Ergebnis: ${item.result.trim().replace(/\n/g, '\n  > ')}`
      }
      return line
    })
    .join('\n')
}

export function fieldContentToMarkdown(
  content: string | null,
  fieldType: string
): string {
  if (!content?.trim()) return ''
  if (fieldType === 'text') return content.trim()
  return shiftHeadings(content.trim())
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\s_-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
}

export function triggerMarkdownDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
