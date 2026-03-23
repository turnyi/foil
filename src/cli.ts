import { createInterface } from 'readline'
import ModelConfig from './configs/ai/modelConfig'
import ToolsConfig from './configs/ai/tools/toolsConfig'
import PromptMessageHandler from './prompt/promptMessageHandler'

class Cli {
  private handler: PromptMessageHandler
  private rl: ReturnType<typeof createInterface>

  constructor() {
    const modelConfig = new ModelConfig()
    const toolsConfig = new ToolsConfig(modelConfig.model)
    this.handler = new PromptMessageHandler(modelConfig.model, modelConfig.contextWindow, toolsConfig.tools)
    this.rl = createInterface({ input: process.stdin, output: process.stdout })
  }

  private prompt(): Promise<string> {
    return new Promise((resolve) => this.rl.question('you: ', resolve))
  }

  public async start() {
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
