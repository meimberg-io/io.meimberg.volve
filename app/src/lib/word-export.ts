import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx'
import type { TaskListItem } from '@/types'

const HEADING_MAP: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6,
}

interface InlineToken {
  text: string
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
  code?: boolean
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`)/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({ text: text.slice(lastIdx, match.index) })
    }
    if (match[2]) tokens.push({ text: match[2], bold: true, italic: true })
    else if (match[3]) tokens.push({ text: match[3], bold: true })
    else if (match[4]) tokens.push({ text: match[4], italic: true })
    else if (match[5]) tokens.push({ text: match[5], strikethrough: true })
    else if (match[6]) tokens.push({ text: match[6], code: true })
    lastIdx = match.index + match[0].length
  }
  if (lastIdx < text.length) {
    tokens.push({ text: text.slice(lastIdx) })
  }
  return tokens.length ? tokens : [{ text }]
}

function toRuns(tokens: InlineToken[]): TextRun[] {
  return tokens.map((t) =>
    new TextRun({
      text: t.text,
      bold: t.bold || undefined,
      italics: t.italic || undefined,
      strike: t.strikethrough || undefined,
      font: t.code ? { name: 'Courier New' } : undefined,
    })
  )
}

function markdownLineToParagraph(line: string): Paragraph {
  const headingMatch = line.match(/^(#{1,6})\s+(.*)/)
  if (headingMatch) {
    const level = headingMatch[1].length
    return new Paragraph({
      heading: HEADING_MAP[level],
      children: toRuns(parseInline(headingMatch[2])),
    })
  }

  const bulletMatch = line.match(/^[-*+]\s+(.*)/)
  if (bulletMatch) {
    return new Paragraph({
      bullet: { level: 0 },
      children: toRuns(parseInline(bulletMatch[1])),
    })
  }

  const orderedMatch = line.match(/^\d+\.\s+(.*)/)
  if (orderedMatch) {
    return new Paragraph({
      numbering: { reference: 'default-numbering', level: 0 },
      children: toRuns(parseInline(orderedMatch[1])),
    })
  }

  const quoteMatch = line.match(/^>\s?(.*)/)
  if (quoteMatch) {
    return new Paragraph({
      indent: { left: convertInchesToTwip(0.5) },
      children: [
        new TextRun({ text: quoteMatch[1], italics: true, color: '666666' }),
      ],
    })
  }

  if (line.match(/^---+$/) || line.match(/^\*\*\*+$/) || line.match(/^___+$/)) {
    return new Paragraph({
      thematicBreak: true,
    })
  }

  return new Paragraph({
    children: toRuns(parseInline(line)),
  })
}

function markdownToDocxParagraphs(md: string): Paragraph[] {
  if (!md?.trim()) return []
  const lines = md.split('\n')
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ children: [] }))
      continue
    }
    paragraphs.push(markdownLineToParagraph(line))
  }
  return paragraphs
}

function taskListToDocxParagraphs(items: TaskListItem[]): Paragraph[] {
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
  const paragraphs: Paragraph[] = []

  for (const item of sorted) {
    const done = item.status === 'done'
    const skipped = item.status === 'wont_do'
    const prefix = done ? '☑ ' : skipped ? '☒ ' : '☐ '
    const runs: TextRun[] = [
      new TextRun({ text: prefix }),
      new TextRun({ text: item.title, bold: true }),
    ]
    if (item.type === 'delegated') {
      runs.push(new TextRun({ text: ' (delegiert)', italics: true }))
    }
    paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: runs }))

    if (item.notes?.trim()) {
      paragraphs.push(new Paragraph({
        indent: { left: convertInchesToTwip(0.5) },
        children: [new TextRun({ text: item.notes.trim(), color: '666666' })],
      }))
    }
    if (item.result?.trim()) {
      paragraphs.push(new Paragraph({
        indent: { left: convertInchesToTwip(0.5) },
        children: [
          new TextRun({ text: 'Ergebnis: ', bold: true, color: '444444' }),
          new TextRun({ text: item.result.trim(), color: '444444' }),
        ],
      }))
    }
  }
  return paragraphs
}

export interface DossierSection {
  stage_name: string
  step_name: string
  field_name: string
  field_type: string
  content: string | null
  task_items?: TaskListItem[]
}

export function buildDossierDocx(
  title: string,
  sections: DossierSection[]
): Document {
  const children: Paragraph[] = []
  let lastStage = ''
  let lastStep = ''

  for (const section of sections) {
    if (section.stage_name !== lastStage) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.stage_name })],
      }))
      lastStage = section.stage_name
      lastStep = ''
    }
    if (section.step_name !== lastStep) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.step_name })],
      }))
      lastStep = section.step_name
    }
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun({ text: section.field_name })],
    }))

    if (section.field_type === 'task_list' && section.task_items) {
      children.push(...taskListToDocxParagraphs(section.task_items))
    } else if (section.content?.trim()) {
      const shifted = section.field_type === 'text'
        ? section.content.trim()
        : shiftHeadingsForDocx(section.content.trim())
      children.push(...markdownToDocxParagraphs(shifted))
    }

    children.push(new Paragraph({ children: [] }))
  }

  return new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: 'decimal',
          text: '%1.',
          alignment: AlignmentType.START,
        }],
      }],
    },
    sections: [{
      properties: {},
      children,
    }],
  })
}

function shiftHeadingsForDocx(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      const match = line.match(/^(#{1,6})\s/)
      if (!match) return line
      const depth = match[1].length
      if (depth === 1) return null
      const newDepth = Math.min(depth + 1, 6)
      return '#'.repeat(newDepth) + line.slice(depth)
    })
    .filter((line): line is string => line !== null)
    .join('\n')
}

export async function triggerDocxDownload(doc: Document, filename: string): Promise<void> {
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
