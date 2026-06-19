/**
 * Shared deterministic gradient colour palette for avatar backgrounds.
 *
 * Consumers: MessageList, RoomHeader, RoomRow, Sidebar.
 * NOTE: RoomHeader / RoomRow / Sidebar still carry their own inline copy of
 * this constant (follow-up: replace those with this import once their files
 * are in scope).
 */
export const GRADIENT_PALETTE: [string, string][] = [
  ['#2563EB', '#6366F1'],
  ['#059669', '#0D9488'],
  ['#D97706', '#DC2626'],
  ['#7C3AED', '#DB2777'],
  ['#0891B2', '#0D9488'],
  ['#B45309', '#92400E'],
  ['#065F46', '#0F766E'],
];

/** Deterministic gradient pair for a given userId. */
export function getPersonColor(userId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTE[Math.abs(hash) % GRADIENT_PALETTE.length];
}
