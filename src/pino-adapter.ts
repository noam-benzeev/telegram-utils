import type { TelegramBotLogger } from "./bot";

export interface PinoLike {
  error(bindings: Record<string, unknown>, msg: string): void;
  warn(bindings: Record<string, unknown>, msg: string): void;
  info?(bindings: Record<string, unknown>, msg: string): void;
  debug?(bindings: Record<string, unknown>, msg: string): void;
}

/**
 * Wrap a pino-style logger into the TelegramBotLogger interface.
 * Reverses the (msg, meta) → (bindings, msg) argument order
 * and injects a `source` tag into every log line.
 */
export function pinoLoggerAdapter(
  pinoLogger: PinoLike,
  source = "telegram",
): TelegramBotLogger {
  return {
    error: (msg, meta) => pinoLogger.error({ source, ...meta }, msg),
    warn: (msg, meta) => pinoLogger.warn({ source, ...meta }, msg),
    info: pinoLogger.info
      ? (msg, meta) => pinoLogger.info!({ source, ...meta }, msg)
      : undefined,
    debug: pinoLogger.debug
      ? (msg, meta) => pinoLogger.debug!({ source, ...meta }, msg)
      : undefined,
  };
}
