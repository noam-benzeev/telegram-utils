import type {
  InlineKeyboardButton,
  SendMessageOptions,
  TelegramApiResult,
} from "./types";

const TELEGRAM_API = "https://api.telegram.org";

async function callApi(
  token: string,
  method: string,
  body: Record<string, unknown>,
): Promise<TelegramApiResult> {
  const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as TelegramApiResult;
}

export async function sendMessage(
  token: string,
  chatId: string | number,
  text: string,
  options?: SendMessageOptions,
): Promise<TelegramApiResult> {
  const body: Record<string, unknown> = { chat_id: chatId, text };
  if (options?.parseMode) body.parse_mode = options.parseMode;
  if (options?.disablePreview) body.disable_web_page_preview = true;
  if (options?.replyMarkup) body.reply_markup = options.replyMarkup;
  return callApi(token, "sendMessage", body);
}

export async function sendInlineKeyboard(
  token: string,
  chatId: string | number,
  text: string,
  keyboard: InlineKeyboardButton[][],
  options?: Omit<SendMessageOptions, "replyMarkup">,
): Promise<TelegramApiResult> {
  return sendMessage(token, chatId, text, {
    ...options,
    disablePreview: options?.disablePreview ?? true,
    replyMarkup: { inline_keyboard: keyboard },
  });
}

export async function editMessageText(
  token: string,
  chatId: string | number,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboardButton[][],
  options?: Pick<SendMessageOptions, "parseMode" | "disablePreview">,
): Promise<TelegramApiResult> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    message_id: messageId,
    text,
  };
  if (options?.parseMode) body.parse_mode = options.parseMode;
  if (options?.disablePreview !== false) body.disable_web_page_preview = true;
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  return callApi(token, "editMessageText", body);
}

export async function answerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string,
): Promise<TelegramApiResult> {
  const body: Record<string, unknown> = { callback_query_id: callbackQueryId };
  if (text) body.text = text;
  return callApi(token, "answerCallbackQuery", body);
}

export async function deleteMessage(
  token: string,
  chatId: string | number,
  messageId: number,
): Promise<TelegramApiResult> {
  return callApi(token, "deleteMessage", {
    chat_id: chatId,
    message_id: messageId,
  });
}

export async function getMe(
  token: string,
): Promise<TelegramApiResult> {
  return callApi(token, "getMe", {});
}

export async function setWebhook(
  token: string,
  url: string,
  options?: { secretToken?: string; allowedUpdates?: string[] },
): Promise<TelegramApiResult> {
  const body: Record<string, unknown> = { url };
  if (options?.secretToken) body.secret_token = options.secretToken;
  if (options?.allowedUpdates) body.allowed_updates = options.allowedUpdates;
  return callApi(token, "setWebhook", body);
}
