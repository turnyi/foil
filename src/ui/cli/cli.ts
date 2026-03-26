import { createInterface } from 'readline'
import Engine from '../../runtime/engine'

class Cli {
  private engine: Engine
  private rl: ReturnType<typeof createInterface>

  constructor() {
    this.engine = new Engine()
    this.rl = createInterface({ input: process.stdin, output: process.stdout })
  }

  private prompt(): Promise<string> {
    return new Promise((resolve) => this.rl.question('you: ', resolve))
  }

  public async start() {
    await this.engine.initialize()

    while (true) {
      const input = (await this.prompt()).trim()
      if (!input) continue

      this.engine.send(input)

      process.stdout.write('\n')
      await this.engine.consume({
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

      const { totalTokens, contextUsagePercent } = await this.engine.getUsage()
      process.stdout.write(`\n[tokens: ${totalTokens} | context: ${contextUsagePercent}%]\n\n`)
    }
  }
}

export default Cli
