/**
 * Verify the Telegram webhook secret token header.
 * Returns true if the header matches the expected secret,
 * or if no secret is configured (expectedSecret is falsy).
 */
export function verifyWebhookSecret(
  headerValue: string | null | undefined,
  expectedSecret: string | undefined,
): boolean {
  if (!expectedSecret) return true;
  return headerValue === expectedSecret;
}
