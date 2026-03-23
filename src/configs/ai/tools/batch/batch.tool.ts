import { z } from "zod"
import type { ToolSet } from "ai"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./batch.tool.txt", import.meta.url)).text()

const parameters = z.object({
  calls: z.array(z.object({
    tool: z.string().describe("Tool name"),
    parameters: z.record(z.unknown()).describe("Tool parameters"),
  })).min(1).max(25).describe("List of tool calls to execute in parallel"),
})

export function createBatchTool(tools: ToolSet): ITool<typeof parameters> {
  return {
    name: "batch",
    description,
    parameters,
    execute: async ({ calls }) => {
      const results = await Promise.allSettled(
        calls.map(async ({ tool, parameters: params }) => {
          const t = tools[tool]
          if (!t) return { error: `Unknown tool: ${tool}` }
          return (t as any).execute(params)
        })
      )

      return results.map((r, i) =>
        r.status === "fulfilled"
          ? { tool: calls[i].tool, result: r.value }
          : { tool: calls[i].tool, error: r.reason?.message ?? String(r.reason) }
      )
    },
  }
}
