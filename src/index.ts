export {
  sendMessage,
  sendInlineKeyboard,
  editMessageText,
  answerCallbackQuery,
  deleteMessage,
  getMe,
  setWebhook,
} from "./api";

export { startPolling } from "./polling";
export type { PollingOptions } from "./polling";

export { escapeTelegramHtml } from "./html";

export { verifyWebhookSecret } from "./webhook";

export { TelegramBot } from "./bot";
export type { TelegramBotOptions, TelegramBotLogger } from "./bot";

export {
  createUpdateRouter,
  createCallbackRouter,
  createCommandDispatcher,
} from "./router";
export type {
  UpdateRouterHandlers,
  CallbackHandler,
  CallbackRouterOptions,
  CommandHandler,
  CommandDispatcherConfig,
} from "./router";

export { createBotScaffold } from "./scaffold";
export type { BotScaffoldOptions, BotScaffold } from "./scaffold";

export { isTruthyEnv } from "./env";

export { pinoLoggerAdapter } from "./pino-adapter";
export type { PinoLike } from "./pino-adapter";

export { createFileOffsetStore } from "./file-offset";
export type { OffsetStore } from "./file-offset";

export { createKVOffsetStore } from "./kv-offset";

export { buildHelpMessage } from "./help";
export type { HelpCommand, HelpMessageOptions } from "./help";

export {
  buildPaginationRow,
  buildMultiSelectKeyboard,
  buildNestedGroupKeyboard,
} from "./ui";
export type {
  PaginationOptions,
  MultiSelectItem,
  MultiSelectOptions,
  NestedGroupItem,
  NestedGroup,
  NestedGroupOptions,
} from "./ui";

export {
  buildDatePicker,
  buildCalendarKeyboard,
  buildDateRangePicker,
  buildRelativeRangePicker,
  resolveRelativeRange,
  buildMonthPickerRows,
  getCalendarTitle,
  getMonthNameHe,
  getMonthNameShort,
  todayISO,
  addDaysISO,
  parseYearMonth,
  nextYearMonth,
  prevYearMonth,
  monthFirstDay,
  monthLastDay,
} from "./calendar";
export type {
  DatePickerOptions,
  DateRangePickerOptions,
  RelativeRangePreset,
  RelativeRangePickerOptions,
} from "./calendar";

export { buildTelegramTable } from "./table";
export type {
  TelegramTableColumn,
  TelegramTableOptions,
} from "./table";

export type {
  InlineKeyboardButton,
  TelegramChat,
  TelegramMessage,
  TelegramCallbackQuery,
  TelegramUpdate,
  SendMessageOptions,
  TelegramApiResult,
} from "./types";
