import { render } from 'ink'
import { createElement } from 'react'
import App from './ui/app'
import { EngineProvider } from './ui/context/EngineContext'

const { waitUntilExit } = render(
  createElement(EngineProvider, null, createElement(App)),
  { patchConsole: false }
)
await waitUntilExit()
process.stdout.write('\x1b[2J\x1b[H')
process.exit(0)
