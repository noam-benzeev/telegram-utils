import type { InlineKeyboardButton } from "./types";

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginationOptions {
  /** Current offset (0-based index of the first item shown). */
  offset: number;
  /** Total number of items. */
  total: number;
  /** Items per page. */
  pageSize: number;
  /**
   * Callback data prefix. The offset value is appended directly.
   * Example: "fl:all:::date:" → "fl:all:::date:20"
   */
  callbackPrefix: string;
}

/**
 * Builds a pagination row: `[< Prev] [Page X/Y] [Next >]`.
 *
 * - Always returns all 3 buttons for visual consistency.
 * - Disabled buttons (first/last page) use `callback_data: "noop"`.
 * - Returns an empty array if all items fit on one page.
 */
export function buildPaginationRow(options: PaginationOptions): InlineKeyboardButton[] {
  const { offset, total, pageSize, callbackPrefix } = options;
  if (total <= pageSize) return [];

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.ceil(total / pageSize);

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return [
    {
      text: "⬅️",
      callback_data: canGoPrev
        ? `${callbackPrefix}${Math.max(0, offset - pageSize)}`
        : "noop",
    },
    {
      text: `${currentPage} / ${totalPages}`,
      callback_data: "noop",
    },
    {
      text: "➡️",
      callback_data: canGoNext
        ? `${callbackPrefix}${offset + pageSize}`
        : "noop",
    },
  ];
}

// ---------------------------------------------------------------------------
// Multi-Select
// ---------------------------------------------------------------------------

export interface MultiSelectItem {
  id: string;
  label: string;
  /** Optional grouping key — items with the same group are rendered together under a header. */
  group?: string;
  /** Optional badge shown after the label, e.g. a count: "Athens (5)". */
  badge?: string;
}

export interface MultiSelectOptions {
  items: MultiSelectItem[];
  selectedIds: Set<string>;
  /**
   * Callback prefix for toggling items. The item ID is appended.
   * Example: "sel:dest:" → "sel:dest:ATH"
   */
  callbackPrefix: string;
  /** Buttons per row (default: 2). */
  columns?: number;
  /** Callback data for the confirm button. */
  confirmCallback: string;
  /** Label for the confirm button (default: "Confirm"). Count is appended automatically. */
  confirmLabel?: string;
  /** If provided, a back button is appended. */
  backCallback?: string;
  /** Label for the back button (default: "← Back"). */
  backLabel?: string;
  /** Emoji for selected state (default: "✅"). */
  selectedEmoji?: string;
  /** If provided, an "all" button is rendered at the top before item rows. */
  allOption?: { label: string; callback: string };
  /** Format string for group header labels (default: "── {group} ──"). */
  groupHeaderFormat?: string;
}

/**
 * Builds a multi-select inline keyboard with toggle checkmarks and a confirm button.
 *
 * Each item shows `✅ label` when selected or plain `label` when not.
 * A confirm button at the bottom shows the count of selected items.
 */
export function buildMultiSelectKeyboard(options: MultiSelectOptions): InlineKeyboardButton[][] {
  const {
    items,
    selectedIds,
    callbackPrefix,
    columns = 2,
    confirmCallback,
    confirmLabel = "Confirm",
    backCallback,
    backLabel = "← Back",
    selectedEmoji = "✅",
    allOption,
    groupHeaderFormat = "── {group} ──",
  } = options;

  const keyboard: InlineKeyboardButton[][] = [];

  if (allOption) {
    keyboard.push([{ text: allOption.label, callback_data: allOption.callback }]);
  }

  const hasGroups = items.some((item) => item.group);

  if (hasGroups) {
    const groupOrder: string[] = [];
    const grouped = new Map<string, MultiSelectItem[]>();
    for (const item of items) {
      const g = item.group || "";
      if (!grouped.has(g)) {
        grouped.set(g, []);
        groupOrder.push(g);
      }
      grouped.get(g)!.push(item);
    }

    for (const g of groupOrder) {
      if (g) {
        const headerText = groupHeaderFormat.replace("{group}", g);
        keyboard.push([{ text: headerText, callback_data: "noop" }]);
      }
      const groupItems = grouped.get(g)!;
      const buttons = groupItems.map((item) => itemToButton(item, selectedIds, selectedEmoji, callbackPrefix));
      for (let i = 0; i < buttons.length; i += columns) {
        keyboard.push(buttons.slice(i, i + columns));
      }
    }
  } else {
    const buttons = items.map((item) => itemToButton(item, selectedIds, selectedEmoji, callbackPrefix));
    for (let i = 0; i < buttons.length; i += columns) {
      keyboard.push(buttons.slice(i, i + columns));
    }
  }

  const count = selectedIds.size;
  keyboard.push([
    {
      text: count > 0 ? `${confirmLabel} (${count})` : confirmLabel,
      callback_data: confirmCallback,
    },
  ]);

  if (backCallback) {
    keyboard.push([{ text: backLabel, callback_data: backCallback }]);
  }

  return keyboard;
}

function itemToButton(
  item: MultiSelectItem,
  selectedIds: Set<string>,
  selectedEmoji: string,
  callbackPrefix: string,
): InlineKeyboardButton {
  const isSelected = selectedIds.has(item.id);
  const badgeSuffix = item.badge ? ` (${item.badge})` : "";
  const text = isSelected
    ? `${selectedEmoji} ${item.label}${badgeSuffix}`
    : `${item.label}${badgeSuffix}`;
  return { text, callback_data: `${callbackPrefix}${item.id}` };
}

// ---------------------------------------------------------------------------
// Nested Group
// ---------------------------------------------------------------------------

export interface NestedGroupItem {
  id: string;
  label: string;
  /** Optional badge shown after the label, e.g. a flight count. */
  badge?: string;
}

export interface NestedGroup {
  id: string;
  label: string;
  count?: number;
  items: NestedGroupItem[];
}

export interface NestedGroupOptions {
  groups: NestedGroup[];
  /** ID of the currently expanded group (undefined = show group list). */
  expandedGroupId?: string;
  /**
   * Callback prefix for expanding/collapsing a group. Group ID is appended.
   * Example: "grp:" → "grp:Europe"
   */
  groupCallbackPrefix: string;
  /**
   * Callback prefix for selecting an item within an expanded group. Item ID is appended.
   * Example: "sel:" → "sel:ATH"
   */
  itemCallbackPrefix: string;
  /** Buttons per row for items within an expanded group (default: 2). */
  columns?: number;
  /** Buttons per row for group headers (default: 2). */
  groupColumns?: number;
  /** If provided, a back button is appended. */
  backCallback?: string;
  /** Label for the back button (default: "← Back"). */
  backLabel?: string;
  /** When provided, items show checkmarks for selected state. */
  selectedIds?: Set<string>;
  /** Emoji for selected state (default: "✅"). */
  selectedEmoji?: string;
  /** If provided, an "all" button is rendered at the top before group rows. */
  allOption?: { label: string; callback: string };
  /** If provided, a confirm button is rendered above the back button. Count is appended when > 0. */
  confirmCallback?: string;
  /** Label for the confirm button (default: "Confirm"). */
  confirmLabel?: string;
}

/**
 * Builds a nested group inline keyboard with drill-down navigation.
 *
 * - When no group is expanded: shows group buttons with optional counts.
 * - When a group is expanded: shows only that group's items + a back button
 *   (callback = `groupCallbackPrefix` with no ID appended).
 */
export function buildNestedGroupKeyboard(options: NestedGroupOptions): InlineKeyboardButton[][] {
  const {
    groups,
    expandedGroupId,
    groupCallbackPrefix,
    itemCallbackPrefix,
    columns = 2,
    groupColumns = 2,
    backCallback,
    backLabel = "← Back",
    selectedIds,
    selectedEmoji = "✅",
    allOption,
    confirmCallback,
    confirmLabel = "Confirm",
  } = options;

  const keyboard: InlineKeyboardButton[][] = [];

  if (allOption) {
    keyboard.push([{ text: allOption.label, callback_data: allOption.callback }]);
  }

  const expanded = expandedGroupId
    ? groups.find((g) => g.id === expandedGroupId)
    : undefined;

  if (expanded) {
    const itemButtons: InlineKeyboardButton[] = expanded.items.map((item) => {
      const badgeSuffix = item.badge ? ` (${item.badge})` : "";
      if (selectedIds) {
        const isSelected = selectedIds.has(item.id);
        const text = isSelected
          ? `${selectedEmoji} ${item.label}${badgeSuffix}`
          : `${item.label}${badgeSuffix}`;
        return { text, callback_data: `${itemCallbackPrefix}${item.id}` };
      }
      return {
        text: `${item.label}${badgeSuffix}`,
        callback_data: `${itemCallbackPrefix}${item.id}`,
      };
    });

    for (let i = 0; i < itemButtons.length; i += columns) {
      keyboard.push(itemButtons.slice(i, i + columns));
    }

    keyboard.push([{ text: `← ${expanded.label}`, callback_data: groupCallbackPrefix }]);
  } else {
    const groupButtons: InlineKeyboardButton[] = groups.map((g) => {
      let countSuffix = "";
      if (selectedIds) {
        const selectedInGroup = g.items.filter((item) => selectedIds.has(item.id)).length;
        if (selectedInGroup > 0) countSuffix = ` (${selectedInGroup})`;
      } else if (g.count != null) {
        countSuffix = ` (${g.count})`;
      }
      return {
        text: `${g.label}${countSuffix}`,
        callback_data: `${groupCallbackPrefix}${g.id}`,
      };
    });

    for (let i = 0; i < groupButtons.length; i += groupColumns) {
      keyboard.push(groupButtons.slice(i, i + groupColumns));
    }
  }

  if (confirmCallback) {
    const count = selectedIds?.size ?? 0;
    keyboard.push([{
      text: count > 0 ? `${confirmLabel} (${count})` : confirmLabel,
      callback_data: confirmCallback,
    }]);
  }

  if (backCallback) {
    keyboard.push([{ text: backLabel, callback_data: backCallback }]);
  }

  return keyboard;
}
