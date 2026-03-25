import { z } from "zod"
import { createInterface } from "readline"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./question.tool.txt"

const parameters = z.object({
  question: z.string().describe("The question to ask the user"),
  options: z.array(z.string()).optional().describe("Optional list of choices to present to the user"),
})

class QuestionTool extends BaseTool<typeof parameters> {
  readonly name = "question"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ question, options }: z.infer<typeof parameters>) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })

    const prompt = options && options.length > 0
      ? `\n[question] ${question}\n${options.map((o, i) => `  ${i + 1}. ${o}`).join("\n")}\nEnter number or type your answer: `
      : `\n[question] ${question}\nYour answer: `

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close()
        const picked = options && /^\d+$/.test(answer.trim())
          ? options[parseInt(answer.trim()) - 1] ?? answer
          : answer
        process.stdout.write("\n")
        resolve({ answer: picked })
      })
    })
  }
}

export default new QuestionTool()
