import { z } from 'zod'
import BaseTool from '../BaseTool'
import DESCRIPTION from './codesearch.tool.txt'

const parameters = z.object({
  query: z.string().describe('The code search query'),
  numTokens: z
    .number()
    .min(1000)
    .max(50000)
    .optional()
    .default(5000)
    .describe('Max tokens to return'),
})

class CodeSearchTool extends BaseTool<typeof parameters> {
  readonly name = 'codesearch'
  readonly description = DESCRIPTION
  readonly parameters = parameters

  private async callExaMCP(tool: string, args: Record<string, unknown>) {
    const apiKey = process.env.EXA_API_KEY
    if (!apiKey) throw new Error('EXA_API_KEY environment variable is not set')

    const res = await fetch('https://mcp.exa.ai/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: tool, arguments: args },
      }),
    })

    if (!res.ok) throw new Error(`Exa MCP error: ${res.status} ${res.statusText}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any
    if (data.error) throw new Error(`Exa error: ${data.error.message}`)
    return data.result
  }

  protected override async run({ query, numTokens = 5000 }: z.infer<typeof parameters>) {
    return this.callExaMCP('get_code_context_exa', { query, numTokens })
  }
}

export default new CodeSearchTool()
