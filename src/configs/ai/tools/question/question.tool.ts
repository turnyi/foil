import { z } from "zod"
import { createInterface } from "readline"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./question.tool.txt", import.meta.url)).text()

const parameters = z.object({
  question: z.string().describe("The question to ask the user"),
  options: z.array(z.string()).optional().describe("Optional list of choices to present to the user"),
})

const questionTool: ITool<typeof parameters> = {
  name: "question",
  description,
  parameters,
  execute: async ({ question, options }) => {
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
  },
}

export default questionTool
