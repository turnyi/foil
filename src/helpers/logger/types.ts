export interface LogTransport {
  write(line: string): void
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface ILogger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
  child(className: string): ILogger
}
