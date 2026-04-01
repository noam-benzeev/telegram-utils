import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";

export interface OffsetStore {
  getOffset: () => number;
  setOffset: (id: number) => void;
}

/**
 * Persist the Telegram update offset in a JSON file.
 * Useful for apps without a database (e.g. JSON-file-based storage).
 *
 * @param filePath - Absolute or relative path to the JSON file.
 * @returns `{ getOffset, setOffset }` compatible with `scaffold.startPolling`.
 */
export function createFileOffsetStore(filePath: string): OffsetStore {
  let cached: number | undefined;

  function ensureDir(): void {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  function getOffset(): number {
    if (cached !== undefined) return cached;
    try {
      const raw = readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as { offset?: number };
      cached = typeof parsed.offset === "number" ? parsed.offset : 0;
    } catch {
      cached = 0;
    }
    return cached;
  }

  function setOffset(id: number): void {
    cached = id;
    ensureDir();
    writeFileSync(filePath, JSON.stringify({ offset: id }), "utf-8");
  }

  return { getOffset, setOffset };
}
