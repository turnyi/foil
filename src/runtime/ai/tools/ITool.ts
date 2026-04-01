import type { z } from 'zod'

interface ITool<TParams extends z.ZodType = z.ZodType> {
  name: string
  description: string
  parameters: TParams
  execute: (params: unknown) => Promise<unknown>
}

export type { ITool as default }
