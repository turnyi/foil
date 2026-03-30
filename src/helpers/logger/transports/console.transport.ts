import type { LogTransport } from '../types'

export class ConsoleTransport implements LogTransport {
  write(line: string): void {
    process.stderr.write(line + '\n')
  }
}
