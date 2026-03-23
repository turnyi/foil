import { createMCPClient } from "@ai-sdk/mcp"
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio"
import type { ToolSet } from "ai"

class ToolsConfig {
  public tools: ToolSet = {}
  private clients: Awaited<ReturnType<typeof createMCPClient>>[] = []

  private constructor() {}

  public static async create(): Promise<ToolsConfig> {
    const instance = new ToolsConfig()
    await instance.init()
    return instance
  }

  private async init() {
    const filesystem = await createMCPClient({
      transport: new Experimental_StdioMCPTransport({
        command: "bunx",
        args: ["@modelcontextprotocol/server-filesystem", process.cwd()],
      }),
    })

    this.clients = [filesystem]
    this.tools = await filesystem.tools()
  }

  public async close() {
    await Promise.all(this.clients.map(c => c.close()))
  }
}

export default ToolsConfig
