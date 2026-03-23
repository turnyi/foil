import { z } from "zod"
import type ITool from "../ITool"

const description = await Bun.file(new URL("./plan.tool.txt", import.meta.url)).text()

const parameters = z.object({
  plan: z.string().describe("The full plan text describing what will be done and how"),
})

const planTool: ITool<typeof parameters> = {
  name: "plan",
  description,
  parameters,
  execute: async ({ plan }) => {
    process.stdout.write(`\n[plan]\n${plan}\n\n`)
    return { acknowledged: true }
  },
}

export default planTool
