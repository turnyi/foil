import { z } from "zod"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./codesearch.tool.txt", import.meta.url)).text()

const parameters = z.object({
  query: z.string().describe("The code search query"),
  numTokens: z.number().min(1000).max(50000).optional().default(5000).describe("Max tokens to return"),
})

async function callExaMCP(tool: string, args: Record<string, unknown>) {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) throw new Error("EXA_API_KEY environment variable is not set")

  const res = await fetch("https://mcp.exa.ai/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: tool, arguments: args },
    }),
  })

  if (!res.ok) throw new Error(`Exa MCP error: ${res.status} ${res.statusText}`)

  const data = await res.json() as any
  if (data.error) throw new Error(`Exa error: ${data.error.message}`)
  return data.result
}

const codesearchTool: ITool<typeof parameters> = {
  name: "codesearch",
  description,
  parameters,
  execute: async ({ query, numTokens = 5000 }) => {
    const result = await callExaMCP("get_code_context_exa", { query, numTokens })
    return result
  },
}

export default codesearchTool
