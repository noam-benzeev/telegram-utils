export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
  copy_text?: { text: string };
  /** Button color style (API 9.4+): "danger" (red), "success" (green), "primary" (blue). */
  style?: "danger" | "success" | "primary";
  /** Custom emoji icon on the button (API 9.4+, requires bot owned by Premium user). */
  icon_custom_emoji_id?: string;
};

export interface TelegramChat {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  type: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface SendMessageOptions {
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  disablePreview?: boolean;
  replyMarkup?: Record<string, unknown>;
}

export interface TelegramApiResult {
  ok: boolean;
  result?: unknown;
  description?: string;
}
