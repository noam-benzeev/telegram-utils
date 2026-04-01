import type { OffsetStore } from "./file-offset";

interface KVStoreLike {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

/**
 * Create a polling-compatible OffsetStore backed by any KVStore from @noambz/app-utils.
 * @param kv - A KVStore (SQLite, JSON file, or any implementation).
 * @param key - The key name to store the offset under. Default: "telegram_offset".
 */
export function createKVOffsetStore(
  kv: KVStoreLike,
  key = "telegram_offset",
): OffsetStore {
  return {
    getOffset(): number {
      const val = kv.get(key);
      return val ? parseInt(val, 10) || 0 : 0;
    },
    setOffset(id: number): void {
      kv.set(key, String(id));
    },
  };
}
