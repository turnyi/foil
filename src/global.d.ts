declare module "*.txt" {
  const content: string
  export default content
}

declare module 'marked-terminal' {
  import type { MarkedExtension } from 'marked'

  interface TerminalRendererOptions {
    code?: (code: string, lang: string) => string
    blockquote?: (quote: string) => string
    heading?: (text: string, level: number) => string
    [key: string]: unknown
  }

  export function markedTerminal(options?: TerminalRendererOptions): MarkedExtension
  export default markedTerminal
}
