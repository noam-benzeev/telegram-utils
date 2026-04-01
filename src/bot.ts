import {
  sendMessage,
  sendInlineKeyboard,
  editMessageText,
  answerCallbackQuery,
  deleteMessage,
  getMe as getMeApi,
} from "./api";
import { startPolling as startPollingFn } from "./polling";
import type { PollingOptions } from "./polling";
import type {
  InlineKeyboardButton,
  SendMessageOptions,
  TelegramApiResult,
} from "./types";

export interface TelegramBotLogger {
  info?(msg: string, meta?: Record<string, unknown>): void;
  warn?(msg: string, meta?: Record<string, unknown>): void;
  error?(msg: string, meta?: Record<string, unknown>): void;
  debug?(msg: string, meta?: Record<string, unknown>): void;
}

export interface TelegramBotOptions {
  token: string;
  ownerChatId?: string;
  logger?: TelegramBotLogger;
  defaultParseMode?: "HTML" | "Markdown" | "MarkdownV2";
  defaultDisablePreview?: boolean;
}

export class TelegramBot {
  readonly token: string;
  readonly ownerChatId?: string;
  private readonly logger?: TelegramBotLogger;
  private readonly parseMode: SendMessageOptions["parseMode"];
  private readonly disablePreview: boolean;

  constructor(options: TelegramBotOptions) {
    this.token = options.token;
    this.ownerChatId = options.ownerChatId;
    this.logger = options.logger;
    this.parseMode = options.defaultParseMode ?? "HTML";
    this.disablePreview = options.defaultDisablePreview ?? true;
  }

  async send(
    chatId: string | number,
    text: string,
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ): Promise<boolean> {
    try {
      const result = await sendMessage(this.token, chatId, text, {
        parseMode: options?.parseMode ?? this.parseMode,
        disablePreview: options?.disablePreview ?? this.disablePreview,
      });
      if (!result.ok) {
        this.logger?.error?.("Failed to send message", {
          chatId,
          description: result.description,
        });
      }
      return result.ok;
    } catch (err) {
      this.logger?.error?.("Send message exception", { chatId, err });
      return false;
    }
  }

  async sendKeyboard(
    chatId: string | number,
    text: string,
    keyboard: InlineKeyboardButton[][],
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ): Promise<boolean> {
    try {
      const result = await sendInlineKeyboard(
        this.token,
        chatId,
        text,
        keyboard,
        {
          parseMode: options?.parseMode ?? this.parseMode,
          disablePreview: options?.disablePreview ?? this.disablePreview,
        },
      );
      if (!result.ok) {
        this.logger?.error?.("Failed to send inline keyboard", {
          chatId,
          description: result.description,
        });
      }
      return result.ok;
    } catch (err) {
      this.logger?.error?.("Send inline keyboard exception", { chatId, err });
      return false;
    }
  }

  async editMessage(
    chatId: string | number,
    messageId: number,
    text: string,
    keyboard?: InlineKeyboardButton[][],
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ): Promise<boolean> {
    try {
      const result = await editMessageText(
        this.token,
        chatId,
        messageId,
        text,
        keyboard,
        {
          parseMode: options?.parseMode ?? this.parseMode,
          disablePreview: options?.disablePreview ?? this.disablePreview,
        },
      );
      if (!result.ok) {
        this.logger?.error?.("Failed to edit message", {
          chatId,
          messageId,
          description: result.description,
        });
      }
      return result.ok;
    } catch (err) {
      this.logger?.error?.("Edit message exception", {
        chatId,
        messageId,
        err,
      });
      return false;
    }
  }

  async answerCallback(
    callbackQueryId: string,
    text?: string,
  ): Promise<boolean> {
    try {
      const result = await answerCallbackQuery(
        this.token,
        callbackQueryId,
        text,
      );
      if (!result.ok) {
        this.logger?.error?.("Failed to answer callback query", {
          description: result.description,
        });
      }
      return result.ok;
    } catch (err) {
      this.logger?.error?.("Answer callback exception", { err });
      return false;
    }
  }

  async deleteMsg(
    chatId: string | number,
    messageId: number,
  ): Promise<boolean> {
    try {
      const result = await deleteMessage(this.token, chatId, messageId);
      if (!result.ok) {
        this.logger?.error?.("Failed to delete message", {
          chatId,
          messageId,
          description: result.description,
        });
      }
      return result.ok;
    } catch (err) {
      this.logger?.error?.("Delete message exception", {
        chatId,
        messageId,
        err,
      });
      return false;
    }
  }

  async sendToOwner(
    text: string,
    options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
  ): Promise<boolean> {
    if (!this.ownerChatId) {
      this.logger?.warn?.("Cannot send to owner: ownerChatId not set");
      return false;
    }
    return this.send(this.ownerChatId, text, options);
  }

  /** Send without parseMode (plain text). */
  async sendPlain(
    chatId: string | number,
    text: string,
  ): Promise<boolean> {
    try {
      const result = await sendMessage(this.token, chatId, text, {
        disablePreview: this.disablePreview,
      });
      if (!result.ok) {
        this.logger?.error?.("Failed to send plain message", {
          chatId,
          description: result.description,
        });
      }
      return result.ok;
    } catch (err) {
      this.logger?.error?.("Send plain message exception", { chatId, err });
      return false;
    }
  }

  /** Send to multiple chats. Returns the number of successfully sent messages. */
  async sendToMany(
    chatIds: (string | number)[],
    textFn: (chatId: string | number) => string | Promise<string>,
  ): Promise<number> {
    let sent = 0;
    for (const chatId of chatIds) {
      const text = await textFn(chatId);
      const ok = await this.send(chatId, text);
      if (ok) sent++;
    }
    return sent;
  }

  async getMe(): Promise<TelegramApiResult> {
    return getMeApi(this.token);
  }

  /** Send a startup ping to the owner (plain text, no parse mode). */
  async startupPing(text?: string): Promise<boolean> {
    if (!this.ownerChatId) return false;
    const msg = text ?? "Bot is online.";
    return this.sendPlain(this.ownerChatId, msg);
  }

  isOwner(chatId: string | number): boolean {
    return !!this.ownerChatId && String(chatId) === this.ownerChatId;
  }

  startPolling(options: PollingOptions): Promise<void> {
    return startPollingFn(this.token, options);
  }
}
