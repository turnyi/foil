
export interface OllamaModelInfo {
  details: {
    parent_model: string
    format: string
    family: string
    families: string[] | null
    parameter_size: string
    quantization_level: string
  }
  model_info: ModelInfoOllama
  capabilities: string[]
  modified_at: string
  parameters?: string
}

export interface ModelInfoOllama {
  "general.architecture": string,
  "general.parameter_count": number,
  "qwen3.5.context_length": number,
  "qwen3.5.embedding_length": number,
}
