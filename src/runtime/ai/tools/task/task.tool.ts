import { z } from "zod"
import BaseTool from "../BaseTool"
import type { LanguageModel, ToolSet } from "ai"
import DESCRIPTION from "./task.tool.txt"

const parameters = z.object({
  prompt: z.string().describe("Detailed prompt for the subagent — include all necessary context"),
})

class TaskTool extends BaseTool<typeof parameters> {
  readonly name = "task"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  private model: LanguageModel | null = null
  private tools: ToolSet | null = null

  configure(model: LanguageModel, tools: ToolSet) {
    this.model = model
    this.tools = tools
  }

  protected override async run({ prompt }: z.infer<typeof parameters>) {
    if (!this.model) throw new Error("Task tool not configured — call configure first")

    const { streamText } = await import("ai")

    const stream = streamText({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      tools: this.tools!,
      stopWhen: () => false,
    })

    let output = ""
    for await (const chunk of stream.textStream) {
      output += chunk
    }

    return { result: output }
  }
}

const taskTool = new TaskTool()

export function configureTaskTool(model: LanguageModel, tools: ToolSet) {
  taskTool.configure(model, tools)
}

export default taskTool
