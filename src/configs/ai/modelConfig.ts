import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

class ModelConfig {
  private url = 'http://localhost:11434/v1'
  private apiKey = 'ollama'
  public model: LanguageModel
  public contextWindow = 32768
  private modelKey = "qwen2.5-coder:7b-instruct"

  constructor() {
    const init = createOpenAI({
      baseURL: this.url,
      apiKey: this.apiKey
    })
    this.model = init(this.modelKey)
  }
}

export default ModelConfig
