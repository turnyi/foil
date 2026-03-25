import { createInterface } from 'readline'
import ModelConfig from './configs/ai/modelConfig'
import ToolsConfig from './configs/ai/tools/toolsConfig'
import PromptMessageHandler from './prompt/promptMessageHandler'
import { lspManager } from './configs/lsp/lspManager'

class Cli {
  private handler!: PromptMessageHandler
  private rl: ReturnType<typeof createInterface>

  constructor() {
    this.rl = createInterface({ input: process.stdin, output: process.stdout })
    process.on('exit', () => lspManager.shutdown())
    process.on('SIGINT', () => { lspManager.shutdown(); process.exit(0) })
  }

  private prompt(): Promise<string> {
    return new Promise((resolve) => this.rl.question('you: ', resolve))
  }

  public async start() {
    const modelConfig = new ModelConfig()
    await modelConfig.loadContextWindow()
    const toolsConfig = new ToolsConfig(modelConfig.model)
    this.handler = new PromptMessageHandler(modelConfig.model, modelConfig.contextWindow, toolsConfig.tools)
    while (true) {
      const input = (await this.prompt()).trim()
      if (!input) continue

      this.handler.send(input)

      process.stdout.write('\n')
      await this.handler.consume({
        onText: (text) => process.stdout.write(text),
        onToolCall: (toolName, args) => process.stdout.write(`\n[tool] ${toolName}(${JSON.stringify(args)})\n`),
        onToolResult: (toolName, result) => {
          const out = JSON.stringify(result)
          process.stdout.write(`[result] ${out.length > 200 ? out.slice(0, 200) + '...' : out}\n`)
        },
        onToolError: (toolName, error) => process.stdout.write(`[error:${toolName}] ${error}\n`),
        onError: (error) => process.stdout.write(`[error] ${error}\n`),
        onUnhandled: (part) => {
          console.log("onUnhandled occured")
          console.log(part)
        },
      })

      const { totalTokens, contextUsagePercent } = await this.handler.getResponse()
      process.stdout.write(`\n[tokens: ${totalTokens} | context: ${contextUsagePercent}%]\n\n`)
    }
  }
}

export default Cli
