import type { InlineKeyboardButton } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MONTH_NAMES_HE: Record<number, string> = {
  1: "ינואר", 2: "פברואר", 3: "מרץ", 4: "אפריל",
  5: "מאי", 6: "יוני", 7: "יולי", 8: "אוגוסט",
  9: "ספטמבר", 10: "אוקטובר", 11: "נובמבר", 12: "דצמבר",
};

const MONTH_NAMES_SHORT: Record<number, string> = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr",
  5: "May", 6: "Jun", 7: "Jul", 8: "Aug",
  9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec",
};

const DEFAULT_TZ = "Asia/Jerusalem";

// ---------------------------------------------------------------------------
// Date utilities
// ---------------------------------------------------------------------------

export function getMonthNameHe(month: number): string {
  return MONTH_NAMES_HE[month] ?? "";
}

export function getMonthNameShort(month: number): string {
  return MONTH_NAMES_SHORT[month] ?? "";
}

export function getCalendarTitle(year: number, month: number): string {
  return `📅 ${MONTH_NAMES_HE[month]} ${year}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Monday=0 ... Sunday=6 (ISO weekday) */
function isoWeekday(year: number, month: number, day: number): number {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 ? 6 : d - 1;
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastDayISO(year: number, month: number): string {
  return toISO(year, month, daysInMonth(year, month));
}

export function todayISO(timezone: string = DEFAULT_TZ): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
}

export function addDaysISO(days: number, timezone: string = DEFAULT_TZ): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA", { timeZone: timezone });
}

export function parseYearMonth(ym: string): { year: number; month: number } {
  const [y, m] = ym.split("-").map(Number);
  return { year: y, month: m };
}

export function nextYearMonth(ym: string): string {
  let { year, month } = parseYearMonth(ym);
  month++;
  if (month > 12) { month = 1; year++; }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function prevYearMonth(ym: string): string {
  let { year, month } = parseYearMonth(ym);
  month--;
  if (month < 1) { month = 12; year--; }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthFirstDay(yearMonth: string): string {
  return `${yearMonth}-01`;
}

export function monthLastDay(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return lastDayISO(y, m);
}

// ---------------------------------------------------------------------------
// 1. buildDatePicker -- single date calendar
// ---------------------------------------------------------------------------

export interface DatePickerOptions {
  year: number;
  month: number;
  /** Day selection callback: prefix + "YYYY-MM-DD". */
  callbackPrefix: string;
  /** Disable days before this date (YYYY-MM-DD). */
  minDate?: string;
  /** Disable days after this date (YYYY-MM-DD). */
  maxDate?: string;
  /** Highlight a selected date with a checkmark. */
  selectedDate?: string;
  /** Show a "Select whole month" button. */
  showWholeMonth?: boolean;
  wholeMonthCallback?: string;
  /** Previous month navigation callback. */
  navPrevCallback?: string;
  /** Next month navigation callback. */
  navNextCallback?: string;
  backCallback?: string;
  backLabel?: string;
  /** Column headers. Default: ["Mo","Tu","We","Th","Fr","Sa","Su"]. */
  dayHeaders?: string[];
}

/**
 * Builds an inline keyboard calendar grid for picking a single date.
 *
 * Days outside [minDate, maxDate] are disabled (shown as "·").
 * If `selectedDate` matches a day, it is shown with a checkmark prefix.
 */
export function buildDatePicker(options: DatePickerOptions): InlineKeyboardButton[][] {
  const {
    year, month, callbackPrefix,
    minDate, maxDate, selectedDate,
    showWholeMonth, wholeMonthCallback,
    navPrevCallback, navNextCallback,
    backCallback, backLabel = "← חזרה",
    dayHeaders = DEFAULT_DAY_HEADERS,
  } = options;

  const rows: InlineKeyboardButton[][] = [];

  rows.push(dayHeaders.map((h) => ({ text: h, callback_data: "noop" })));

  const totalDays = daysInMonth(year, month);
  const firstWeekday = isoWeekday(year, month, 1);

  let currentRow: InlineKeyboardButton[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    currentRow.push({ text: " ", callback_data: "noop" });
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = toISO(year, month, day);
    const tooEarly = minDate ? dateStr < minDate : false;
    const tooLate = maxDate ? dateStr > maxDate : false;

    if (tooEarly || tooLate) {
      currentRow.push({ text: "·", callback_data: "noop" });
    } else if (selectedDate && dateStr === selectedDate) {
      currentRow.push({ text: `✓${day}`, callback_data: `${callbackPrefix}${dateStr}` });
    } else {
      currentRow.push({ text: String(day), callback_data: `${callbackPrefix}${dateStr}` });
    }

    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }

  if (currentRow.length > 0) {
    while (currentRow.length < 7) {
      currentRow.push({ text: " ", callback_data: "noop" });
    }
    rows.push(currentRow);
  }

  if (showWholeMonth && wholeMonthCallback) {
    rows.push([{ text: `📅 כל ${MONTH_NAMES_HE[month]}`, callback_data: wholeMonthCallback }]);
  }

  const footerRow: InlineKeyboardButton[] = [];
  if (navPrevCallback) {
    footerRow.push({ text: "◂ חודש קודם", callback_data: navPrevCallback });
  }
  if (navNextCallback) {
    footerRow.push({ text: "חודש הבא ▸", callback_data: navNextCallback });
  }
  if (footerRow.length > 0) {
    rows.push(footerRow);
  }
  if (backCallback) {
    rows.push([{ text: backLabel, callback_data: backCallback }]);
  }

  return rows;
}

/**
 * @deprecated Use `buildDatePicker` instead.
 */
export function buildCalendarKeyboard(
  year: number,
  month: number,
  callbackPrefix: string,
  options?: {
    minDate?: string;
    showWholeMonth?: boolean;
    wholeMonthCallback?: string;
    backCallback?: string;
    navNextCallback?: string;
  }
): InlineKeyboardButton[][] {
  return buildDatePicker({
    year,
    month,
    callbackPrefix,
    minDate: options?.minDate,
    showWholeMonth: options?.showWholeMonth,
    wholeMonthCallback: options?.wholeMonthCallback,
    navNextCallback: options?.navNextCallback,
    backCallback: options?.backCallback,
  });
}

// ---------------------------------------------------------------------------
// Month picker
// ---------------------------------------------------------------------------

export function buildMonthPickerRows(
  callbackPrefix: string,
  monthCount: number = 5,
): InlineKeyboardButton[][] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const buttons: InlineKeyboardButton[] = [];
  for (let i = 0; i < monthCount; i++) {
    let m = currentMonth + i;
    let y = currentYear;
    if (m > 12) { m -= 12; y += 1; }
    buttons.push({ text: MONTH_NAMES_SHORT[m]!, callback_data: `${callbackPrefix}${y}-${String(m).padStart(2, "0")}` });
  }

  const rows: InlineKeyboardButton[][] = [];
  for (let i = 0; i < buttons.length; i += 3) {
    rows.push(buttons.slice(i, i + 3));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 2. buildDateRangePicker -- from-date / to-date
// ---------------------------------------------------------------------------

export interface DateRangePickerOptions {
  phase: "from" | "to";
  year: number;
  month: number;
  /** The selected from-date. Required when phase is "to" (used as minDate). */
  fromDate?: string;
  /** Callback prefix for from-date selection: prefix + "YYYY-MM-DD". */
  fromCallbackPrefix: string;
  /** Callback prefix for to-date selection: prefix + "YYYY-MM-DD". */
  toCallbackPrefix: string;
  /** Callback prefix for month navigation: prefix + "{from|to}:{YYYY-MM}". */
  navCallbackPrefix: string;
  /** Back callback for the current phase. */
  backCallback: string;
  /** Title for the from-date phase. Default: "Select start date". */
  fromTitle?: string;
  /** Title for the to-date phase. Default: "Select end date". */
  toTitle?: string;
  /** Formats a date for display (e.g. "From: 28.03.2026"). */
  formatDate?: (iso: string) => string;
  /** Show a "Select whole month" shortcut. */
  showWholeMonth?: boolean;
  /** Whole-month callback prefix: prefix + "YYYY-MM". */
  wholeMonthCallbackPrefix?: string;
  /** "End of month" shortcut label builder. Receives month number. */
  endOfMonthLabel?: (month: number) => string;
  /** Callback for end-of-month shortcut. */
  endOfMonthCallback?: string;
}

/**
 * Builds a date range picker (from/to phases) wrapping `buildDatePicker`.
 *
 * Returns a title string and the keyboard rows. The consumer is responsible
 * for showing the title in the message text and handling the callbacks.
 */
export function buildDateRangePicker(options: DateRangePickerOptions): {
  title: string;
  keyboard: InlineKeyboardButton[][];
} {
  const {
    phase, year, month, fromDate,
    fromCallbackPrefix, toCallbackPrefix, navCallbackPrefix,
    backCallback,
    fromTitle, toTitle,
    formatDate = (d) => d,
    showWholeMonth, wholeMonthCallbackPrefix,
    endOfMonthLabel, endOfMonthCallback,
  } = options;

  const ym = `${year}-${String(month).padStart(2, "0")}`;
  const nextYm = nextYearMonth(ym);

  const isFromPhase = phase === "from";
  const callbackPrefix = isFromPhase ? fromCallbackPrefix : toCallbackPrefix;
  const minDate = isFromPhase ? todayISO() : (fromDate || todayISO());

  const keyboard = buildDatePicker({
    year,
    month,
    callbackPrefix,
    minDate,
    showWholeMonth: isFromPhase && showWholeMonth,
    wholeMonthCallback: isFromPhase && wholeMonthCallbackPrefix
      ? `${wholeMonthCallbackPrefix}${ym}`
      : undefined,
    navNextCallback: `${navCallbackPrefix}${phase}:${nextYm}`,
    backCallback,
  });

  if (!isFromPhase && endOfMonthLabel && endOfMonthCallback) {
    const backRow = keyboard[keyboard.length - 1];
    keyboard.splice(keyboard.length - 1, 0, [
      { text: endOfMonthLabel(month), callback_data: endOfMonthCallback },
    ]);
    if (!backRow) keyboard.push([]);
  }

  const baseTitle = isFromPhase
    ? (fromTitle || "Select start date")
    : (toTitle || "Select end date");

  const calTitle = getCalendarTitle(year, month);
  let title = `${baseTitle} — ${calTitle}`;
  if (!isFromPhase && fromDate) {
    title += `\nמ: ${formatDate(fromDate)}`;
  }

  return { title, keyboard };
}

// ---------------------------------------------------------------------------
// 3. buildRelativeRangePicker -- preset buttons
// ---------------------------------------------------------------------------

export interface RelativeRangePreset {
  key: string;
  label: string;
  days: number;
}

export interface RelativeRangePickerOptions {
  presets: RelativeRangePreset[];
  /** Show checkmark on the active preset (toggle off if clicked again). */
  activePresetKey?: string;
  /** Callback prefix: prefix + preset.key. */
  callbackPrefix: string;
  /** If set, appends a button to open an exact date picker. */
  calendarCallback?: string;
  /** Label for the calendar button. Default: "📅 Dates". */
  calendarLabel?: string;
  /** When a custom range is active, replaces the calendar button with this label. */
  customRange?: { label: string };
  /** Callback when clicking the active custom range (to clear it). */
  clearRangeCallback?: string;
}

/**
 * Builds a row of relative date preset buttons (e.g. "7 days", "14 days", "30 days")
 * with optional toggle state and an optional calendar/clear button at the end.
 */
export function buildRelativeRangePicker(options: RelativeRangePickerOptions): InlineKeyboardButton[] {
  const {
    presets, activePresetKey, callbackPrefix,
    calendarCallback, calendarLabel = "📅 Dates",
    customRange, clearRangeCallback,
  } = options;

  const row: InlineKeyboardButton[] = presets.map((p) => {
    const isActive = activePresetKey === p.key;
    return {
      text: isActive ? `✅ ${p.label}` : p.label,
      callback_data: `${callbackPrefix}${p.key}`,
    };
  });

  if (customRange && clearRangeCallback) {
    row.push({ text: `✅ ${customRange.label}`, callback_data: clearRangeCallback });
  } else if (calendarCallback) {
    row.push({ text: calendarLabel, callback_data: calendarCallback });
  }

  return row;
}

/**
 * Resolves a relative range preset to absolute `{dateFrom, dateTo}` dates.
 */
export function resolveRelativeRange(
  preset: RelativeRangePreset,
  options?: { timezone?: string },
): { dateFrom: string; dateTo: string } {
  const tz = options?.timezone || DEFAULT_TZ;
  const dateFrom = todayISO(tz);
  const dateTo = addDaysISO(preset.days, tz);
  return { dateFrom, dateTo };
}
