import { z } from "zod"
import type ITool from "../ITool"

export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled"

export interface TodoItem {
  id: string
  content: string
  status: TodoStatus
}

const todos: TodoItem[] = []

const description = await Bun.file(new URL("./todo.tool.txt", import.meta.url)).text()

const todoItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
})

const writeParameters = z.object({
  todos: z.array(todoItemSchema).describe("The full updated todo list"),
})

const readParameters = z.object({})

export const todoWriteTool: ITool<typeof writeParameters> = {
  name: "todowrite",
  description,
  parameters: writeParameters,
  execute: async ({ todos: updated }) => {
    todos.length = 0
    todos.push(...updated)
    return { todos }
  },
}

export const todoReadTool: ITool<typeof readParameters> = {
  name: "todoread",
  description: "Read the current todo list for this session.",
  parameters: readParameters,
  execute: async () => ({ todos }),
}
