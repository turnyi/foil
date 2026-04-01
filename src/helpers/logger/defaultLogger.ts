import { Logger } from './logger'
import { FileTransport } from './transports/file.transport'

const LOG_PATH = '.foil/foil.log'

export function createLogger(className: string): Logger {
  return new Logger(className, [new FileTransport(LOG_PATH)])
}
