import { z } from "zod"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./plan.tool.txt"

const parameters = z.object({
  plan: z.string().describe("The full plan text describing what will be done and how"),
})

class PlanTool extends BaseTool<typeof parameters> {
  readonly name = "plan"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ plan }: z.infer<typeof parameters>) {
    process.stdout.write(`\n[plan]\n${plan}\n\n`)
    return { acknowledged: true }
  }
}

export default new PlanTool()
