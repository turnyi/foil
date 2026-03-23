import { z } from "zod"
import type ITool from "../ITool"
import type { LanguageModel, ToolSet } from "ai"

const description = await Bun.file(new URL("./task.tool.txt", import.meta.url)).text()

const parameters = z.object({
  prompt: z.string().describe("Detailed prompt for the subagent — include all necessary context"),
})

let _model: LanguageModel
let _tools: ToolSet

export function configureTaskTool(model: LanguageModel, tools: ToolSet) {
  _model = model
  _tools = tools
}

const taskTool: ITool<typeof parameters> = {
  name: "task",
  description,
  parameters,
  execute: async ({ prompt }) => {
    if (!_model) throw new Error("Task tool not configured — call configureTaskTool first")

    const { streamText } = await import("ai")

    const stream = streamText({
      model: _model,
      messages: [{ role: "user", content: prompt }],
      tools: _tools,
      stopWhen: () => false,
    })

    let output = ""
    for await (const chunk of stream.textStream) {
      output += chunk
    }

    return { result: output }
  },
}

export default taskTool
