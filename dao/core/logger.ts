/**
 * Structured Logger
 *
 * In production: replace the console transport with a real
 * provider such as Pino + Axiom, Datadog, or Logtail.
 *
 * All logs follow the format:
 *   { level, timestamp, message, ...meta }
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MIN_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) ??
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) return

  const entry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(meta ?? {}),
  }

  // Production: emit as JSON for log aggregation pipelines
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](JSON.stringify(entry))
  } else {
    const colour = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    }[level]
    const reset = '\x1b[0m'
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](
      `${colour}[${level.toUpperCase()}]${reset} ${entry.timestamp} — ${message}`,
      meta ?? '',
    )
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
}
