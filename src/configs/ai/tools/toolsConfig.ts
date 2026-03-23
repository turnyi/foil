import { tool } from "ai"
import type { ToolSet } from "ai"
import type ITool from "./ITool"
import bashTool from "./bash/bash.tool"

class ToolsConfig {
  public tools: ToolSet

  constructor() {
    const allTools: ITool[] = [
      bashTool,
    ]

    this.tools = Object.fromEntries(
      allTools.map(t => [t.name, tool(t as any)])
    )
  }
}

export default ToolsConfig
