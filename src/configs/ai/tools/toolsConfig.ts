import { tool } from "ai"
import type { ToolSet } from "ai"
import type ITool from "./ITool"
import bashTool from "./bash/bash.tool"
import readTool from "./read/read.tool"
import writeTool from "./write/write.tool"
import editTool from "./edit/edit.tool"
import multieditTool from "./multiedit/multiedit.tool"
import globTool from "./glob/glob.tool"
import grepTool from "./grep/grep.tool"
import lsTool from "./ls/ls.tool"
import webfetchTool from "./webfetch/webfetch.tool"
import { todoWriteTool, todoReadTool } from "./todo/todo.tool"

class ToolsConfig {
  public tools: ToolSet

  constructor() {
    const allTools: ITool[] = [
      bashTool,
      readTool,
      writeTool,
      editTool,
      multieditTool,
      globTool,
      grepTool,
      lsTool,
      webfetchTool,
      todoWriteTool,
      todoReadTool,
    ]

    this.tools = Object.fromEntries(
      allTools.map(t => [t.name, tool(t as any)])
    )
  }
}

export default ToolsConfig
