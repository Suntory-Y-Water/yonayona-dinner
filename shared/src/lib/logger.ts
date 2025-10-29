const loggerName = "yonayona-dinner";

/**
 * Log function that accepts either a message or an object with optional message
 */
type LogFn = {
  (msg: string): void;
  (obj: Record<string, unknown>, msg?: string): void;
};

/**
 * Logger interface compatible with Pino API
 */
type AppLogger = {
  info: LogFn;
  error: LogFn;
  warn: LogFn;
  debug: LogFn;
  trace: LogFn;
  fatal: LogFn;
  child: (bindings: Record<string, unknown>) => AppLogger;
};

/**
 * Log level type
 */
type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Log level ordering for filtering
 */
const logLevelOrder: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

/**
 * Returns order value for log level comparison
 */
function getLevelOrder(level: string): number {
  return logLevelOrder[level as LogLevel] ?? 2;
}

let coreLogger: AppLogger | undefined;

/**
 * Returns the shared application logger instance for emitting structured logs.
 */
export function getLogger(context?: string): AppLogger {
  if (!coreLogger) {
    coreLogger = createLogger({
      name: loggerName,
      level: resolveLogLevel(),
    });
  }

  if (!context) {
    return coreLogger;
  }

  return coreLogger.child({ loggerContext: `-${context}-` });
}

/**
 * Creates a logger instance with specified configuration
 */
function createLogger(config: {
  name: string;
  level: string;
  bindings?: Record<string, unknown>;
}): AppLogger {
  const levelOrder = getLevelOrder(config.level);

  function log(
    level: LogLevel,
    first: string | Record<string, unknown>,
    second?: string,
  ): void {
    if (getLevelOrder(level) < levelOrder) {
      return;
    }

    const obj = typeof first === "object" && first !== null ? first : {};
    const msg = typeof first === "string" ? first : second;

    const processLike = getNodeProcess();
    if (shouldUsePretty(processLike)) {
      const output = formatPretty(level, msg, {
        ...config.bindings,
        ...obj,
      });
      const consoleFn =
        level === "error" || level === "fatal" ? console.error : console.log;
      consoleFn(output);
    } else {
      const logData = {
        level: level.toUpperCase(),
        time: new Date().toISOString(),
        name: config.name,
        msg,
        ...config.bindings,
        ...obj,
      };
      console.log(JSON.stringify(logData));
    }
  }

  const info = ((first, second) => log("info", first, second)) as LogFn;
  const error = ((first, second) => log("error", first, second)) as LogFn;
  const warn = ((first, second) => log("warn", first, second)) as LogFn;
  const debug = ((first, second) => log("debug", first, second)) as LogFn;
  const trace = ((first, second) => log("trace", first, second)) as LogFn;
  const fatal = ((first, second) => log("fatal", first, second)) as LogFn;

  return {
    info,
    error,
    warn,
    debug,
    trace,
    fatal,
    child: (bindings: Record<string, unknown>) =>
      createLogger({
        ...config,
        bindings: { ...config.bindings, ...bindings },
      }),
  };
}

/**
 * Formats log output in pretty format for human readability
 */
function formatPretty(
  level: LogLevel,
  msg: unknown,
  metadata: Record<string, unknown>,
): string {
  const { loggerContext, ...rest } = metadata;

  const processLike = getNodeProcess();
  const useColors = Boolean(processLike?.stdout?.isTTY);

  const formattedLevel = formatLevel(level, useColors);
  const contextValue = formatContextValue(loggerContext);
  const timestamp = formatTimestamp(new Date().toISOString());
  const message =
    typeof msg === "string"
      ? msg
      : msg !== undefined
        ? JSON.stringify(msg)
        : "";

  const segments = [formattedLevel];
  if (contextValue) {
    segments.push(contextValue);
  }
  segments.push(timestamp);
  if (message) {
    segments.push(message);
  }

  const metadataStr =
    Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";

  return `${segments.join(", ")}${metadataStr}`;
}

/**
 * Resolves the log level from environment-aware sources with an info fallback.
 */
type NodeProcessLike = {
  stdout?: { isTTY?: boolean; write?: (chunk: string | Uint8Array) => unknown };
  env?: Record<string, string | undefined>;
};

function getNodeProcess(): NodeProcessLike | undefined {
  const globalContext = globalThis as { process?: NodeProcessLike };
  return globalContext.process;
}

function shouldUsePretty(processLike?: NodeProcessLike): boolean {
  if (!processLike) {
    return false;
  }

  const preference = processLike.env?.PINO_PRETTY;
  if (preference === "false") {
    return false;
  }

  if (preference === "true") {
    return true;
  }

  return Boolean(processLike.stdout?.isTTY);
}

function formatContextValue(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatLevel(level: string, useColors: boolean): string {
  const label = level.toUpperCase();
  if (!useColors) {
    return label;
  }

  const color =
    levelColorMap[level as keyof typeof levelColorMap] ?? "\u001B[37m";
  return `${color}${label}\u001B[0m`;
}

function formatTimestamp(iso: string): string {
  const [datePart] = iso.split("Z");
  return datePart?.split(".")[0] ?? iso;
}

const levelColorMap = {
  trace: "\u001B[90m",
  debug: "\u001B[35m",
  info: "\u001B[36m",
  warn: "\u001B[33m",
  error: "\u001B[31m",
  fatal: "\u001B[41m",
} as const;

function resolveLogLevel(): string {
  const globalContext = globalThis as {
    LOG_LEVEL?: string;
    process?: { env?: Record<string, unknown> };
  };

  const envLevel = globalContext.process?.env?.LOG_LEVEL;
  if (typeof envLevel === "string" && envLevel.length > 0) {
    return envLevel;
  }

  return typeof globalContext.LOG_LEVEL === "string" &&
    globalContext.LOG_LEVEL.length > 0
    ? globalContext.LOG_LEVEL
    : "info";
}
