import type { z } from "zod"
import type ITool from "./ITool"

abstract class BaseTool<TParams extends z.ZodType = z.ZodType> implements ITool<TParams> {
  abstract readonly name: string
  abstract readonly description: string
  abstract readonly parameters: TParams

  private preloaded = false

  /** Called once before the first execution. Override for lazy initialization. */
  protected async onPreload(): Promise<void> {}

  /** Called before every execution. */
  protected async preExecute(_params: z.infer<TParams>): Promise<void> {}

  /** The main tool logic. Must be implemented. */
  protected abstract run(params: z.infer<TParams>): Promise<unknown>

  /** Called after every execution. Receives params and the result. Return the (optionally modified) result. */
  protected async postExecute(_params: z.infer<TParams>, result: unknown): Promise<unknown> {
    return result
  }

  async execute(params: z.infer<TParams>): Promise<unknown> {
    if (!this.preloaded) {
      await this.onPreload()
      this.preloaded = true
    }
    await this.preExecute(params)
    const result = await this.run(params)
    return await this.postExecute(params, result)
  }
}

export default BaseTool
