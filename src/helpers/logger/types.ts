export interface LogTransport {
  write(line: string): void
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
