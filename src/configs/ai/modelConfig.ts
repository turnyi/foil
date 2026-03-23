import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

class ModelConfig {
  private url = 'http://localhost:11434/v1'
  private apiKey = 'ollama'
  public model: LanguageModel
  public contextWindow = 32768
  private modelKey = "qwen3.5:cloud"

  constructor() {
    const init = createOpenAI({
      baseURL: this.url,
      apiKey: this.apiKey,
    })
    this.model = init.chat(this.modelKey)
  }
}

export default ModelConfig
