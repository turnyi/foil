import { z } from 'zod'
import type { ToolSet } from 'ai'
import BaseTool from '../BaseTool'
import DESCRIPTION from './batch.tool.txt'

const parameters = z.object({
  calls: z
    .array(
      z.object({
        tool: z.string().describe('Tool name'),
        parameters: z.record(z.string(), z.unknown()).describe('Tool parameters'),
      }),
    )
    .min(1)
    .max(25)
    .describe('List of tool calls to execute in parallel'),
})

class BatchTool extends BaseTool<typeof parameters> {
  readonly name = 'batch'
  readonly description = DESCRIPTION
  readonly parameters = parameters

  constructor(private readonly tools: ToolSet) {
    super()
  }

  protected override async run({ calls }: z.infer<typeof parameters>) {
    const results = await Promise.allSettled(
      calls.map(async ({ tool, parameters: params }) => {
        const t = this.tools[tool]
        if (!t || !t.execute) return { error: `Unknown tool: ${tool}` }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (t as any).execute(params)
      }),
    )

    return results.map((r, i) =>
      r.status === 'fulfilled'
        ? { tool: calls[i]!.tool, result: r.value }
        : { tool: calls[i]!.tool, error: r.reason?.message ?? String(r.reason) },
    )
  }
}

export function createBatchTool(tools: ToolSet): BatchTool {
  return new BatchTool(tools)
}
