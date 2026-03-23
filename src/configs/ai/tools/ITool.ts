import type { z } from "zod"

interface ITool<TParams extends z.ZodType = z.ZodType> {
  name: string
  description: string
  parameters: TParams
  execute: (params: any) => Promise<unknown>
}

export default ITool
