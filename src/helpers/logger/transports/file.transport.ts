import { appendFileSync } from 'node:fs'
import type { LogTransport } from '../types'

export class FileTransport implements LogTransport {
  constructor(private readonly path: string) { }

  write(line: string): void {
    appendFileSync(this.path, line + '\n')
  }
}
