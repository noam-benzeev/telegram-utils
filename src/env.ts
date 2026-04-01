const TRUTHY = new Set(["true", "1", "yes"]);

/**
 * Returns true when `process.env[name]` is set to a truthy string
 * ("true", "1", or "yes", case-insensitive, trimmed).
 */
export function isTruthyEnv(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw !== undefined && TRUTHY.has(raw);
}
