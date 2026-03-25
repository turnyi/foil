import { resolve, dirname, extname } from "path"
import { existsSync } from "fs"

export async function findRoot(file: string, markers: string[]): Promise<string> {
  let dir = extname(file) ? dirname(file) : file
  while (true) {
    for (const marker of markers) {
      if (existsSync(resolve(dir, marker))) return dir
    }
    const parent = dirname(dir)
    if (parent === dir) return process.cwd()
    dir = parent
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ])
}
