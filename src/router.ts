import type { TelegramUpdate, TelegramCallbackQuery } from "./types";

export interface UpdateRouterHandlers {
  onCommand: (
    chatId: number,
    command: string,
    args: string[],
    update: TelegramUpdate,
  ) => void | Promise<void>;
  onCallback: (query: TelegramCallbackQuery) => void | Promise<void>;
  /** Called for non-command text messages (e.g. free-text search). */
  onText?: (
    chatId: number,
    text: string,
    update: TelegramUpdate,
  ) => void | Promise<void>;
}

/**
 * Creates an update handler that routes incoming Telegram updates
 * to command, callback, or text handlers.
 *
 * - Strips `@botname` suffixes from commands
 * - Splits command text into command + args
 * - Ignores updates with no actionable content
 */
export function createUpdateRouter(
  handlers: UpdateRouterHandlers,
): (update: TelegramUpdate) => Promise<void> {
  return async (update: TelegramUpdate): Promise<void> => {
    if (update.callback_query) {
      await handlers.onCallback(update.callback_query);
      return;
    }

    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;
    if (!chatId || !text) return;

    if (text.startsWith("/")) {
      const [rawCmd, ...args] = text.split(/\s+/);
      const command = rawCmd.split("@")[0].toLowerCase();
      await handlers.onCommand(chatId, command, args, update);
    } else if (handlers.onText) {
      await handlers.onText(chatId, text, update);
    }
  };
}

export type CallbackHandler = (
  cb: TelegramCallbackQuery,
  chatId: number,
  messageId: number,
  data: string,
) => void | Promise<void>;

export interface CallbackRouterOptions {
  /** Automatically answer "noop" callbacks (default: true). */
  noopHandler?: boolean;
  /** Called when no prefix matches. Receives the raw callback query. */
  fallback?: (cb: TelegramCallbackQuery) => void | Promise<void>;
  /** Called to answer callback queries that match no route and have no fallback. */
  answerCallback?: (callbackQueryId: string, text?: string) => Promise<unknown>;
}

/**
 * Creates a callback query dispatcher that matches `callback_data` by prefix.
 *
 * Routes are checked in insertion order. The first matching prefix wins.
 * Exact-match keys (no trailing colon) are also supported.
 */
export function createCallbackRouter(
  routes: Record<string, CallbackHandler>,
  options?: CallbackRouterOptions,
): (cb: TelegramCallbackQuery) => Promise<void> {
  const handleNoop = options?.noopHandler !== false;
  const prefixes = Object.keys(routes);

  return async (cb: TelegramCallbackQuery): Promise<void> => {
    const chatId = cb.message?.chat?.id;
    const messageId = cb.message?.message_id;
    if (!chatId || messageId === undefined) {
      await options?.answerCallback?.(cb.id);
      return;
    }

    const data = cb.data ?? "";

    if (handleNoop && data === "noop") {
      await options?.answerCallback?.(cb.id);
      return;
    }

    for (const prefix of prefixes) {
      if (data === prefix || data.startsWith(prefix)) {
        await routes[prefix](cb, chatId, messageId, data);
        return;
      }
    }

    if (options?.fallback) {
      await options.fallback(cb);
    } else {
      await options?.answerCallback?.(cb.id);
    }
  };
}

export type CommandHandler = (
  chatId: number,
  args: string[],
  name?: string,
) => void | Promise<void>;

export interface CommandDispatcherConfig {
  commands: Record<string, CommandHandler>;
  ownerCommands?: Record<string, CommandHandler>;
  /** Message sent for unknown commands. Set to empty string to disable. */
  unknownMessage?: string;
  /** Message sent when a non-owner tries an owner command. */
  ownerRejectMessage?: string;
  /** Called on unhandled errors thrown by command handlers. */
  onError?: (chatId: number, command: string, error: unknown) => void | Promise<void>;
  /** Used to check owner status. Typically `bot.isOwner`. */
  isOwner?: (chatId: number) => boolean;
  /** Used to send rejection / unknown-command messages. Typically `bot.send`. */
  sendMessage?: (chatId: number, text: string) => Promise<unknown>;
}

/**
 * Creates a command dispatcher with owner gating, error handling,
 * and unknown-command fallback.
 */
export function createCommandDispatcher(
  config: CommandDispatcherConfig,
): (chatId: number, command: string, args: string[], firstName?: string) => Promise<void> {
  const {
    commands,
    ownerCommands,
    unknownMessage = "❓ Unknown command. Try /help",
    ownerRejectMessage = "⛔ Admin only.",
    onError,
    isOwner,
    sendMessage,
  } = config;

  return async (chatId: number, command: string, args: string[], firstName?: string): Promise<void> => {
    try {
      if (commands[command]) {
        await commands[command](chatId, args, firstName);
        return;
      }

      if (ownerCommands?.[command]) {
        if (isOwner?.(chatId)) {
          await ownerCommands[command](chatId, args, firstName);
        } else if (ownerRejectMessage) {
          await sendMessage?.(chatId, ownerRejectMessage);
        }
        return;
      }

      if (unknownMessage) {
        await sendMessage?.(chatId, unknownMessage);
      }
    } catch (error) {
      if (onError) {
        await onError(chatId, command, error);
      } else {
        throw error;
      }
    }
  };
}
