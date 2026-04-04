import type { z } from 'zod'

interface ITool<TParams extends z.ZodType = z.ZodType> {
  name: string
  description: string
  parameters: TParams
  execute: (params: z.infer<TParams>) => Promise<unknown>
}

export type { ITool as default }
