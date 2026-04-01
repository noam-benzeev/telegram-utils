export interface TelegramTableColumn {
  /** Column header text (omit to skip the header row). */
  header?: string;
  /** Text alignment within the column. Default: "left". */
  align?: "left" | "right";
  /** Fixed column width in characters. Auto-calculated from data if omitted. */
  width?: number;
}

export interface TelegramTableOptions {
  columns: TelegramTableColumn[];
  /** Each row is an array of cell values matching the columns. */
  rows: string[][];
  /** String between columns. Default: "  " (2 spaces). */
  columnSeparator?: string;
}

/**
 * Build an aligned monospace text table for use inside Telegram `<pre>` blocks.
 *
 * Returns the table body as a plain string (without `<pre>` tags) so the
 * caller can wrap or combine it as needed.
 */
export function buildTelegramTable(options: TelegramTableOptions): string {
  const { columns, rows, columnSeparator = "  " } = options;

  const widths = columns.map((col, i) => {
    if (col.width != null) return col.width;
    let max = col.header?.length ?? 0;
    for (const row of rows) {
      const cell = row[i] ?? "";
      if (cell.length > max) max = cell.length;
    }
    return max;
  });

  function formatRow(cells: string[]): string {
    return columns
      .map((col, i) => {
        const cell = cells[i] ?? "";
        const w = widths[i];
        return (col.align === "right") ? cell.padStart(w) : cell.padEnd(w);
      })
      .join(columnSeparator);
  }

  const lines: string[] = [];

  const hasHeaders = columns.some((c) => c.header != null);
  if (hasHeaders) {
    lines.push(formatRow(columns.map((c) => c.header ?? "")));
  }

  for (const row of rows) {
    lines.push(formatRow(row));
  }

  return lines.join("\n");
}
