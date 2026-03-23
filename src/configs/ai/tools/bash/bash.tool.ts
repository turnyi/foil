import { z } from "zod"
import { spawn } from "child_process"
import type ITool from "../ITool"

const MAX_OUTPUT_BYTES = 30_000
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000

const descriptionTemplate = await Bun.file(new URL("./bash.tool.txt", import.meta.url)).text()
const description = descriptionTemplate
  .replaceAll("${directory}", process.cwd())
  .replaceAll("${maxBytes}", String(MAX_OUTPUT_BYTES))

const parameters = z.object({
  command: z.string().describe("The command to execute"),
  description: z.string().describe(
    "Clear, concise description of what this command does in 5-10 words. Examples:\nInput: ls\nOutput: Lists files in current directory\n\nInput: git status\nOutput: Shows working tree status"
  ),
  timeout: z.number().optional().describe("Timeout in milliseconds, defaults to 120000"),
  workdir: z.string().optional().describe(`Working directory, defaults to ${process.cwd()}. Use this instead of cd.`),
})

const bashTool: ITool<typeof parameters> = {
  name: "bash",
  description,
  parameters,
  execute: async ({ command, timeout: timeoutMs = DEFAULT_TIMEOUT_MS, workdir }) => {
    if (timeoutMs < 0) throw new Error(`Invalid timeout: ${timeoutMs}. Must be positive.`)

    const cwd = workdir ?? process.cwd()
    const abort = new AbortController()

    const proc = spawn(command, {
      shell: true,
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
      windowsHide: process.platform === "win32",
    })

    let output = ""
    let timedOut = false
    let exited = false

    const append = (chunk: Buffer) => { output += chunk.toString() }
    proc.stdout?.on("data", append)
    proc.stderr?.on("data", append)

    const kill = () => {
      if (exited) return
      try {
        if (process.platform !== "win32" && proc.pid) {
          process.kill(-proc.pid, "SIGTERM")
        } else {
          proc.kill("SIGTERM")
        }
      } catch {}
    }

    const timeoutTimer = setTimeout(() => {
      timedOut = true
      kill()
    }, timeoutMs)

    abort.signal.addEventListener("abort", kill, { once: true })

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      proc.once("exit", (code) => {
        exited = true
        clearTimeout(timeoutTimer)
        resolve(code)
      })
      proc.once("error", (err) => {
        exited = true
        clearTimeout(timeoutTimer)
        reject(err)
      })
    })

    const notes: string[] = []
    if (timedOut) notes.push(`Command timed out after ${timeoutMs}ms`)

    if (notes.length > 0) {
      output += "\n\n<bash_metadata>\n" + notes.join("\n") + "\n</bash_metadata>"
    }

    const truncated = output.length > MAX_OUTPUT_BYTES
      ? output.slice(0, MAX_OUTPUT_BYTES) + "\n\n[output truncated]"
      : output

    return { output: truncated, exitCode, timedOut }
  },
}

export default bashTool
