import type { TelegramUpdate } from "./types";

export interface PollingOptions {
  onUpdate: (update: TelegramUpdate) => void | Promise<void>;
  getOffset: () => number | Promise<number>;
  setOffset: (id: number) => void | Promise<void>;
  signal?: AbortSignal;
  /** Long-poll timeout in seconds (default 25) */
  timeout?: number;
  /** Backoff delay in ms after errors (default 4000) */
  errorBackoffMs?: number;
}

export async function startPolling(
  token: string,
  options: PollingOptions,
): Promise<void> {
  const timeout = options.timeout ?? 25;
  const errorBackoffMs = options.errorBackoffMs ?? 4000;
  const signal = options.signal;

  while (!signal?.aborted) {
    try {
      const offset = await options.getOffset();
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${offset + 1}&timeout=${timeout}`;

      const res = await fetch(url, { signal });
      if (!res.ok) {
        await sleep(errorBackoffMs);
        continue;
      }

      const data = (await res.json()) as {
        ok: boolean;
        result?: TelegramUpdate[];
      };

      if (!data.ok || !Array.isArray(data.result)) {
        await sleep(errorBackoffMs);
        continue;
      }

      for (const update of data.result) {
        await options.setOffset(update.update_id);
        await options.onUpdate(update);
      }
    } catch (err: unknown) {
      if (signal?.aborted) break;
      if (isAbortError(err)) break;
      await sleep(errorBackoffMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
