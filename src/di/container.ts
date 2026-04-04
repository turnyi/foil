import 'reflect-metadata'
import { container } from 'tsyringe'
import { TOKEN } from './tokens'
import { createLogger } from '../helpers/logger'
import { SessionRepository } from '../db/repositories/SessionRepository'
import { MessageRepository } from '../db/repositories/MessageRepository'
import { SessionService } from '../runtime/services/SessionService'
import { MessageService } from '../runtime/services/MessageService'
import PromptHandler from '../runtime/ai/prompt/promptHandler'
import MessageSession from '../runtime/engine/session/messageEngine/message.session.engine'
import Engine from '../runtime/engine'
import ModelConfig from '../runtime/ai/modelConfig'
import ToolsConfig from '../runtime/ai/tools/toolsConfig'

export async function setupContainer(): Promise<typeof container> {
  const modelConfig = new ModelConfig()
  await modelConfig.loadContextWindow()

  const toolsConfig = new ToolsConfig(modelConfig.model)

  const systemPrompt = await Bun.file(
    new URL('../runtime/ai/prompt/system.txt', import.meta.url).pathname,
  ).text()

  container.register(TOKEN.Logger, { useValue: createLogger('App') })

  container.register(TOKEN.LanguageModel, { useValue: modelConfig.model })
  container.register(TOKEN.ContextWindow, { useFactory: () => modelConfig.contextWindow })
  container.register(TOKEN.ToolSet, { useValue: toolsConfig.tools })
  container.register(TOKEN.SystemPrompt, { useValue: systemPrompt })

  container.registerSingleton(SessionRepository)
  container.registerSingleton(MessageRepository)

  container.registerSingleton(SessionService)
  container.registerSingleton(MessageService)

  container.registerSingleton(PromptHandler)
  container.registerSingleton(MessageSession)
  container.registerSingleton(Engine)

  return container
}

export { container }
