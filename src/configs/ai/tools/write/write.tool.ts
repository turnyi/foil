import { z } from "zod"
import { mkdir } from "fs/promises"
import { dirname } from "path"
import BaseTool from "../BaseTool"
import { lspManager } from "../../../../configs/lsp/lspManager"
import DESCRIPTION from "./write.tool.txt"

const parameters = z.object({
  path: z.string().describe("Absolute or relative path to write the file to"),
  content: z.string().describe("The content to write"),
})

class WriteTool extends BaseTool<typeof parameters> {
  readonly name = "write"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  protected override async run({ path, content }: z.infer<typeof parameters>) {
    await mkdir(dirname(path), { recursive: true })
    await Bun.write(path, content)
    return { success: true, path }
  }

  protected override async postExecute({ path }: z.infer<typeof parameters>, result: unknown) {
    if (typeof result === 'object' && result !== null && 'error' in result) return result

    const diagnostics = await lspManager.touchFile(path)
    const issues = lspManager.formatDiagnostics(path, diagnostics)
    return { ...(result as object), ...(issues ? { diagnostics: issues } : {}) }
  }
}

export default new WriteTool()
