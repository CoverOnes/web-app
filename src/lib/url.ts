/**
 * URL sink hardening for public-facing pages.
 *
 * Attacker-controlled profile fields (coverUrl / avatarUrl) are rendered on a
 * PUBLIC page; any viewer would otherwise trigger an outbound fetch to whatever
 * URL the attacker stored (tracking pixel / SSRF-from-victim). Only allow
 * `https:` URLs to be used as image/background sinks — reject `javascript:`,
 * `data:`, plain `http:`, and anything that fails URL parsing.
 *
 * @returns the original string iff it parses as an `https:` URL, else undefined.
 */
export function httpsUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    return new URL(raw).protocol === 'https:' ? raw : undefined;
  } catch {
    return undefined;
  }
}
