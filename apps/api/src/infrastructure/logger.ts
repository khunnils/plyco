import { type FastifyServerOptions } from "fastify"

const colors = {
  gray: "\u001b[90m",
  green: "\u001b[32m",
  red: "\u001b[31m",
  reset: "\u001b[0m",
  yellow: "\u001b[33m",
}

type LogRecord = {
  err?: {
    message?: string
    stack?: string
  }
  level?: number
  method?: string
  msg?: string
  req?: {
    method?: string
    url?: string
  }
  reqId?: string
  res?: {
    statusCode?: number
  }
  responseTime?: number
  time?: number
  url?: string
}

type RequestSummary = {
  method: string
  url: string
}

export function createApiLogger(): FastifyServerOptions["logger"] {
  if (process.env.NODE_ENV === "production") {
    return true
  }

  return {
    stream: new LocalLogStream(),
  }
}

class LocalLogStream {
  private requestsById = new Map<string, RequestSummary>()

  write(chunk: string) {
    const record = parseLogRecord(chunk)

    if (!record) {
      process.stdout.write(chunk)
      return
    }

    process.stdout.write(`${this.format(record)}\n`)
  }

  private format(record: LogRecord) {
    const time = friendlyTime(record.time)

    if (record.msg === "incoming request" && record.req) {
      const request = requestSummary(record.req.method, record.req.url)

      if (record.reqId) {
        this.requestsById.set(record.reqId, request)
      }

      return `${colors.gray}${time} -> ${request.method} ${request.url}${colors.reset}`
    }

    if (record.msg === "request completed") {
      const request = record.reqId
        ? this.requestsById.get(record.reqId)
        : undefined

      if (record.reqId) {
        this.requestsById.delete(record.reqId)
      }

      const statusCode = record.res?.statusCode ?? 0
      const status = colorStatus(statusCode)
      const responseTime = formatDuration(record.responseTime)
      const route = request ? `${request.method} ${request.url}` : "request"

      return `${time} ${status} ${route} ${colors.gray}${responseTime}${colors.reset}`
    }

    if (record.msg === "request failed") {
      const request = requestSummary(record.method, record.url)
      const error = record.err?.message ?? "unknown error"
      const stack = record.err?.stack
        ? `\n${colors.gray}${record.err.stack}${colors.reset}`
        : ""

      return `${colors.red}${time} ${request.method} ${request.url} failed: ${error}${colors.reset}${stack}`
    }

    const message = record.msg ?? JSON.stringify(record)
    const color = levelColor(record.level)

    return color ? `${color}${time} ${message}${colors.reset}` : `${time} ${message}`
  }
}

function parseLogRecord(chunk: string): LogRecord | null {
  try {
    return JSON.parse(chunk) as LogRecord
  } catch {
    return null
  }
}

function friendlyTime(value: number | undefined) {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function requestSummary(method: string | undefined, url: string | undefined) {
  return {
    method: method ?? "REQUEST",
    url: url ?? "/",
  }
}

function formatDuration(value: number | undefined) {
  if (typeof value !== "number") {
    return ""
  }

  return `${Math.round(value)}ms`
}

function colorStatus(statusCode: number) {
  const color =
    statusCode >= 500
      ? colors.red
      : statusCode >= 400
        ? colors.yellow
        : colors.green

  return `${color}${statusCode}${colors.reset}`
}

function levelColor(level: number | undefined) {
  if (!level) {
    return null
  }

  if (level >= 50) {
    return colors.red
  }

  if (level >= 40) {
    return colors.yellow
  }

  return null
}
