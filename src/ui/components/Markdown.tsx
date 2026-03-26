import { Box, Text } from 'ink'

// ── inline formatting ────────────────────────────────────────────────────────

type Span = { text: string; bold?: boolean; italic?: boolean; code?: boolean; dim?: boolean }

function parseInline(raw: string): Span[] {
  const spans: Span[] = []
  // combined regex: **bold**, *italic*, `code`
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) spans.push({ text: raw.slice(last, m.index) })
    if (m[0].startsWith('**'))   spans.push({ text: m[2], bold: true })
    else if (m[0].startsWith('*')) spans.push({ text: m[3], italic: true, dim: true })
    else                           spans.push({ text: m[4], code: true })
    last = m.index + m[0].length
  }
  if (last < raw.length) spans.push({ text: raw.slice(last) })
  return spans
}

function InlineSpans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) =>
        s.code
          ? <Text key={i} color="cyan" backgroundColor="gray"> {s.text} </Text>
          : s.bold
            ? <Text key={i} bold>{s.text}</Text>
            : s.italic
              ? <Text key={i} dimColor>{s.text}</Text>
              : <Text key={i}>{s.text}</Text>
      )}
    </>
  )
}

// ── syntax highlight (best-effort, no deps) ─────────────────────────────────

const KEYWORDS = /\b(const|let|var|function|return|if|else|for|while|import|export|from|default|class|new|this|typeof|async|await|try|catch|throw|type|interface|extends|implements|true|false|null|undefined|void|break|continue|switch|case|in|of|=>)\b/g
const STRINGS  = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g
const COMMENTS = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g
const NUMBERS  = /\b(\d+\.?\d*)\b/g

function highlightCode(code: string): string {
  // We can't do rich coloring per-character easily in Ink without wrapping each token.
  // Return as-is; color is applied uniformly via Text color="cyan" for code blocks.
  return code
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const lines = code.split('\n')
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      marginY={1}
      paddingX={1}
    >
      {lang && (
        <Box marginBottom={1}>
          <Text color="gray" dimColor>{lang}</Text>
        </Box>
      )}
      {lines.map((line, i) => (
        <Text key={i} color="cyan">{line}</Text>
      ))}
    </Box>
  )
}

// ── block parsing ────────────────────────────────────────────────────────────

type Block =
  | { kind: 'code';    lang: string; code: string }
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'rule' }
  | { kind: 'list';    items: string[]; ordered: boolean }
  | { kind: 'para';    text: string }
  | { kind: 'blank' }

function parseBlocks(md: string): Block[] {
  const blocks: Block[] = []
  const lines = md.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) { code.push(lines[i]); i++ }
      i++ // closing ```
      blocks.push({ kind: 'code', lang, code: code.join('\n') })
      continue
    }

    // heading
    const hm = line.match(/^(#{1,3})\s+(.+)/)
    if (hm) {
      blocks.push({ kind: 'heading', level: hm[1].length, text: hm[2] })
      i++; continue
    }

    // horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ kind: 'rule' })
      i++; continue
    }

    // list
    if (/^(\s*[-*+]|\s*\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^(\s*[-*+]|\s*\d+\.)\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
        i++
      }
      blocks.push({ kind: 'list', items, ordered })
      continue
    }

    // blank
    if (line.trim() === '') {
      blocks.push({ kind: 'blank' })
      i++; continue
    }

    // paragraph — accumulate consecutive non-special lines
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim()) &&
      !/^(\s*[-*+]|\s*\d+\.)\s/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    blocks.push({ kind: 'para', text: para.join(' ') })
  }

  return blocks
}

// ── main component ───────────────────────────────────────────────────────────

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text)

  return (
    <Box flexDirection="column">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'code':
            return <CodeBlock key={i} code={block.code} lang={block.lang} />

          case 'heading': {
            const colors: Record<number, string> = { 1: 'white', 2: 'white', 3: 'white' }
            return (
              <Box key={i} marginBottom={1}>
                <Text bold color={colors[block.level] ?? 'white'}>
                  {block.level === 1 ? '# ' : block.level === 2 ? '## ' : '### '}
                  {block.text}
                </Text>
              </Box>
            )
          }

          case 'rule':
            return <Box key={i} marginY={1}><Text color="gray">{'─'.repeat(40)}</Text></Box>

          case 'list':
            return (
              <Box key={i} flexDirection="column" marginBottom={1}>
                {block.items.map((item, j) => (
                  <Box key={j}>
                    <Text color="gray">{block.ordered ? `${j + 1}. ` : '• '}</Text>
                    <InlineSpans spans={parseInline(item)} />
                  </Box>
                ))}
              </Box>
            )

          case 'para':
            return (
              <Box key={i} marginBottom={1} flexWrap="wrap">
                <InlineSpans spans={parseInline(block.text)} />
              </Box>
            )

          case 'blank':
            return null
        }
      })}
    </Box>
  )
}
