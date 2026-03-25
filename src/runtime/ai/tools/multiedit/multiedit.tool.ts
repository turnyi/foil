import { z } from "zod"
import BaseTool from "../BaseTool"
import { lspManager } from "../../../../runtime/lsp/lspManager"
import DESCRIPTION from "./multiedit.tool.txt"

const parameters = z.object({
  path: z.string().describe("Path to the file to edit"),
  edits: z.array(z.object({
    oldString: z.string().describe("The exact string to replace"),
    newString: z.string().describe("The string to replace it with"),
    replaceAll: z.boolean().optional().describe("Replace all occurrences, defaults to false"),
  })).describe("List of edits to apply sequentially"),
})

class MultiEditTool extends BaseTool<typeof parameters> {
  readonly name = "multiedit"
  readonly description = DESCRIPTION
  readonly parameters = parameters

  private applyEdit(content: string, oldString: string, newString: string, replaceAll = false): string {
    if (replaceAll) return content.replaceAll(oldString, newString)

    const count = content.split(oldString).length - 1
    if (count === 0) throw new Error(`String not found in file: ${JSON.stringify(oldString)}`)
    if (count > 1) throw new Error(`String found ${count} times — provide more context to make it unique`)

    return content.replace(oldString, newString)
  }

  protected override async run({ path, edits }: z.infer<typeof parameters>) {
    const file = Bun.file(path)
    if (!await file.exists()) return { error: `File not found: ${path}` }

    let content = await file.text()
    for (const edit of edits) {
      content = this.applyEdit(content, edit.oldString, edit.newString, edit.replaceAll ?? false)
    }
    await Bun.write(path, content)

    return { success: true, path, editsApplied: edits.length }
  }

  protected override async postExecute({ path }: z.infer<typeof parameters>, result: unknown) {
    if (typeof result === 'object' && result !== null && 'error' in result) return result

    const diagnostics = await lspManager.touchFile(path)
    const issues = lspManager.formatDiagnostics(path, diagnostics)
    return { ...(result as object), ...(issues ? { diagnostics: issues } : {}) }
  }
}

export default new MultiEditTool()
