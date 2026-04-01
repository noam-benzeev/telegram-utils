import { TelegramBot } from "./bot";
import type { TelegramBotLogger } from "./bot";
import type {
  InlineKeyboardButton,
  SendMessageOptions,
  TelegramUpdate,
} from "./types";
import { isTruthyEnv } from "./env";

export interface BotScaffoldOptions {
  /** Env var name for the bot token (default: "TELEGRAM_BOT_TOKEN"). */
  envTokenKey?: string;
  /** Env var name for the owner chat ID (default: "TELEGRAM_OWNER_CHAT_ID"). */
  envOwnerKey?: string;
  logger?: TelegramBotLogger;
  /** If set, polling only starts when this env var is truthy. */
  pollGateEnv?: string;
}

export interface BotScaffold {
  getBot: () => TelegramBot | undefined;
  startPolling: (handlers: {
    onUpdate: (update: TelegramUpdate) => void | Promise<void>;
    getOffset: () => number | Promise<number>;
    setOffset: (id: number) => void | Promise<void>;
  }) => Promise<void>;
  stopPolling: () => void;

  send: (
    chatId: string | number,
    text: string,
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ) => Promise<boolean>;
  sendKeyboard: (
    chatId: string | number,
    text: string,
    keyboard: InlineKeyboardButton[][],
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ) => Promise<boolean>;
  editMessage: (
    chatId: string | number,
    messageId: number,
    text: string,
    keyboard?: InlineKeyboardButton[][],
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ) => Promise<boolean>;
  answerCallback: (
    callbackQueryId: string,
    text?: string,
  ) => Promise<boolean>;
  deleteMsg: (
    chatId: string | number,
    messageId: number,
  ) => Promise<boolean>;
  sendToOwner: (
    text: string,
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ) => Promise<boolean>;
  sendPlain: (chatId: string | number, text: string) => Promise<boolean>;
  sendToMany: (
    chatIds: (string | number)[],
    textFn: (chatId: string | number) => string | Promise<string>,
  ) => Promise<number>;
  isOwner: (chatId: string | number) => boolean;

  /**
   * Send a startup ping if the env var is truthy.
   * @param message - Text to send to the owner.
   * @param envName - Env var to check (default: "TELEGRAM_PING_ON_START").
   */
  pingIfEnabled: (message: string, envName?: string) => Promise<boolean>;

  /**
   * Wire SIGTERM + SIGINT to stop polling and run an optional cleanup callback.
   */
  onShutdown: (callback?: () => void) => void;
}

/**
 * Creates a lazy-singleton bot with managed polling lifecycle.
 *
 * Provides null-safe delegate methods so consumers never need to
 * write `getBot()?.method() ?? false` wrappers.
 */
export function createBotScaffold(options?: BotScaffoldOptions): BotScaffold {
  const tokenKey = options?.envTokenKey ?? "TELEGRAM_BOT_TOKEN";
  const ownerKey = options?.envOwnerKey ?? "TELEGRAM_OWNER_CHAT_ID";
  const logger = options?.logger;
  const pollGateEnv = options?.pollGateEnv;

  let bot: TelegramBot | undefined;
  let pollingController: AbortController | null = null;

  function getBot(): TelegramBot | undefined {
    if (bot) return bot;
    const token = process.env[tokenKey]?.trim();
    if (!token) return undefined;
    bot = new TelegramBot({
      token,
      ownerChatId: process.env[ownerKey]?.trim(),
      logger,
    });
    return bot;
  }

  async function startPolling(handlers: {
    onUpdate: (update: TelegramUpdate) => void | Promise<void>;
    getOffset: () => number | Promise<number>;
    setOffset: (id: number) => void | Promise<void>;
  }): Promise<void> {
    if (pollGateEnv && !process.env[pollGateEnv]) return;

    const instance = getBot();
    if (!instance) return;

    pollingController = new AbortController();

    logger?.info?.("Telegram long polling started");

    await instance.startPolling({
      onUpdate: handlers.onUpdate,
      getOffset: handlers.getOffset,
      setOffset: handlers.setOffset,
      signal: pollingController.signal,
      timeout: 25,
      errorBackoffMs: 4000,
    });
  }

  function stopPolling(): void {
    pollingController?.abort();
    pollingController = null;
    logger?.info?.("Telegram polling stopped");
  }

  // -- Null-safe delegates --------------------------------------------------

  const send: BotScaffold["send"] = (chatId, text, opts) =>
    getBot()?.send(chatId, text, opts) ?? Promise.resolve(false);

  const sendKeyboard: BotScaffold["sendKeyboard"] = (chatId, text, keyboard, opts) =>
    getBot()?.sendKeyboard(chatId, text, keyboard, opts) ?? Promise.resolve(false);

  const editMessage: BotScaffold["editMessage"] = (chatId, messageId, text, keyboard, opts) =>
    getBot()?.editMessage(chatId, messageId, text, keyboard, opts) ?? Promise.resolve(false);

  const answerCallback: BotScaffold["answerCallback"] = (callbackQueryId, text) =>
    getBot()?.answerCallback(callbackQueryId, text) ?? Promise.resolve(false);

  const deleteMsg: BotScaffold["deleteMsg"] = (chatId, messageId) =>
    getBot()?.deleteMsg(chatId, messageId) ?? Promise.resolve(false);

  const sendToOwner: BotScaffold["sendToOwner"] = (text, opts) =>
    getBot()?.sendToOwner(text, opts) ?? Promise.resolve(false);

  const sendPlain: BotScaffold["sendPlain"] = (chatId, text) =>
    getBot()?.sendPlain(chatId, text) ?? Promise.resolve(false);

  const sendToMany: BotScaffold["sendToMany"] = (chatIds, textFn) =>
    getBot()?.sendToMany(chatIds, textFn) ?? Promise.resolve(0);

  const isOwner: BotScaffold["isOwner"] = (chatId) =>
    getBot()?.isOwner(chatId) ?? false;

  // -- Lifecycle helpers ----------------------------------------------------

  async function pingIfEnabled(
    message: string,
    envName = "TELEGRAM_PING_ON_START",
  ): Promise<boolean> {
    if (!isTruthyEnv(envName)) return false;
    const instance = getBot();
    if (!instance) return false;
    return instance.startupPing(message);
  }

  function onShutdown(callback?: () => void): void {
    const handler = () => {
      logger?.info?.("Shutting down...");
      stopPolling();
      callback?.();
      process.exit(0);
    };
    process.on("SIGTERM", handler);
    process.on("SIGINT", handler);
  }

  return {
    getBot,
    startPolling,
    stopPolling,
    send,
    sendKeyboard,
    editMessage,
    answerCallback,
    deleteMsg,
    sendToOwner,
    sendPlain,
    sendToMany,
    isOwner,
    pingIfEnabled,
    onShutdown,
  };
}
