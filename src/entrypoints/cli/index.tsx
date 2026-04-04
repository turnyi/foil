import 'reflect-metadata'
import { render } from 'ink'
import { setupContainer } from '../../di/container'
import { initEngine } from './store/engineStore'
import App from './App'
import Engine from '../../runtime/engine'

async function main() {
  const container = await setupContainer()
  const engine = container.resolve(Engine)
  const modelName = engine.getModelId()

  initEngine(engine, modelName)

  process.stdout.write('\x1b[2J\x1b[H')
  render(<App />)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
