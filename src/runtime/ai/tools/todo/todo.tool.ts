import { z } from "zod"
import BaseTool from "../BaseTool"
import DESCRIPTION from "./todo.tool.txt"

export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled"

export interface TodoItem {
  id: string
  content: string
  status: TodoStatus
}

const todos: TodoItem[] = []

const todoItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
})

const writeParameters = z.object({
  todos: z.array(todoItemSchema).describe("The full updated todo list"),
})

const readParameters = z.object({})

class TodoWriteTool extends BaseTool<typeof writeParameters> {
  readonly name = "todowrite"
  readonly description = DESCRIPTION
  readonly parameters = writeParameters

  protected override async run({ todos: updated }: z.infer<typeof writeParameters>) {
    todos.length = 0
    todos.push(...updated)
    return { todos }
  }
}

class TodoReadTool extends BaseTool<typeof readParameters> {
  readonly name = "todoread"
  readonly description = "Read the current todo list for this session."
  readonly parameters = readParameters

  protected override async run(_params: z.infer<typeof readParameters>) {
    return { todos }
  }
}

export const todoWriteTool = new TodoWriteTool()
export const todoReadTool = new TodoReadTool()
