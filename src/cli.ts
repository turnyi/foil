import { createInterface } from 'readline'
import ModelConfig from './configs/ai/modelConfig'
import ToolsConfig from './configs/ai/toolsConfig'
import PromptMessageHandler from './prompt/promptMessageHandler'

class Cli {
  private handler: PromptMessageHandler
  private toolsConfig: ToolsConfig
  private rl: ReturnType<typeof createInterface>

  private constructor(handler: PromptMessageHandler, toolsConfig: ToolsConfig) {
    this.handler = handler
    this.toolsConfig = toolsConfig
    this.rl = createInterface({ input: process.stdin, output: process.stdout })
  }

  public static async create(): Promise<Cli> {
    const modelConfig = new ModelConfig()
    const toolsConfig = await ToolsConfig.create()
    const handler = new PromptMessageHandler(modelConfig.model, modelConfig.contextWindow, toolsConfig.tools)
    return new Cli(handler, toolsConfig)
  }

  private prompt(): Promise<string> {
    return new Promise((resolve) => this.rl.question('you: ', resolve))
  }

  public async start() {
    process.on('exit', () => this.toolsConfig.close())

    while (true) {
      const input = (await this.prompt()).trim()
      if (!input) continue

      this.handler.send(input)

      process.stdout.write('\nassistant: ')
      for await (const chunk of this.handler.textStream) {
        process.stdout.write(chunk)
      }

      const { totalTokens, contextUsagePercent } = await this.handler.getResponse()
      process.stdout.write(`\n[tokens: ${totalTokens} | context: ${contextUsagePercent}%]\n\n`)
    }
  }
}

export default Cli
