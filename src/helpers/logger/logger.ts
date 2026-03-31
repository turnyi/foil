import { LEVELS } from './constants'
import type { LogTransport, LogLevel, ILogger } from './types'

export class Logger implements ILogger {
  constructor(
    private readonly className: string,
    private readonly transports: LogTransport[],
    private readonly minLevel: LogLevel = 'info',
  ) { }

  private format(level: LogLevel, message: string): string {
    const date = new Date().toISOString()
    return `[${this.className}] [${date}] [${level.toUpperCase()}] ${message}`
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (LEVELS[level] < LEVELS[this.minLevel]) return
    const extra = args.length ? ' ' + args.map(a => JSON.stringify(a)).join(' ') : ''
    const line = this.format(level, message + extra)
    for (const t of this.transports) t.write(line)
  }

  debug(message: string, ...args: unknown[]) { this.log('debug', message, ...args) }
  info(message: string, ...args: unknown[]) { this.log('info', message, ...args) }
  warn(message: string, ...args: unknown[]) { this.log('warn', message, ...args) }
  error(message: string, ...args: unknown[]) { this.log('error', message, ...args) }

  child(className: string): Logger {
    return new Logger(className, this.transports, this.minLevel)
  }
}
