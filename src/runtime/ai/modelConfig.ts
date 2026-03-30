import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"
import type { OllamaModelInfo } from "./types/modelTypes"

class ModelConfig {
  private url = 'http://localhost:11434/v1'
  private apiKey = 'ollama'
  public model: LanguageModel
  public contextWindow?: number
  private modelKey = "qwen3.5:cloud"

  constructor() {
    const init = createOpenAI({
      baseURL: this.url,
      apiKey: this.apiKey,
    })
    this.model = init.chat(this.modelKey)
  }

  async loadContextWindow(): Promise<void> {
    try {
      const base = this.url.replace(/\/v1\/?$/, '')
      const res = await fetch(`${base}/api/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.modelKey }),
      })
      if (!res.ok) return

      const data = await res.json() as OllamaModelInfo
      const { model_info: modelInfo } = data
      const entry = Object.entries(modelInfo).find(([key]) => key.includes('context_length'))
      const contextWindow = entry?.[1]
      if (contextWindow && Number.isFinite(contextWindow))
        this.contextWindow = contextWindow

    } catch { }
  }
}

export default ModelConfig
