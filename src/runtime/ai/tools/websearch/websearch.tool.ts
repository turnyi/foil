import { z } from 'zod'
import BaseTool from '../BaseTool'
import DESCRIPTION from './websearch.tool.txt'

const parameters = z.object({
  query: z.string().describe('The search query'),
  numResults: z.number().optional().default(5).describe('Number of results to return'),
  livecrawl: z
    .enum(['fallback', 'preferred'])
    .optional()
    .default('fallback')
    .describe('Live crawl mode'),
  type: z.enum(['auto', 'fast', 'deep']).optional().default('auto').describe('Search type'),
})

class WebSearchTool extends BaseTool<typeof parameters> {
  readonly name = 'websearch'
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({
    query,
    numResults = 5,
    livecrawl = 'fallback',
    type = 'auto',
  }: z.infer<typeof parameters>) {
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
        params: {
          name: 'web_search_exa',
          arguments: { query, numResults, livecrawl, type },
        },
      }),
    })

    if (!res.ok) throw new Error(`Exa MCP error: ${res.status} ${res.statusText}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await res.json()) as any
    if (data.error) throw new Error(`Exa error: ${data.error.message}`)
    return data.result
  }
}

export default new WebSearchTool()
