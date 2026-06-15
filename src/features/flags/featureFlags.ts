/**
 * Central feature-flag registry.
 *
 * The CoverOnes backend gateway only exposes a subset of endpoints today. Pages
 * that call non-existent APIs must NOT be reachable, or they crash on load.
 * Rather than deleting those components, we gate them behind flags so they can
 * be flipped on the moment the backend ships.
 *
 * KEEP (wired to live APIs)  → flag = true
 * TBD  (no backend yet)      → flag = false  → routed to <ComingSoon />, nav hidden
 *
 * A flag can be overridden at build time via VITE_FF_<KEY>=true (e.g.
 * VITE_FF_CHAT=true) so QA / staging can enable a feature without a code change.
 */

export type FeatureKey =
  // KEEP — backed by the CoverOnes gateway
  | 'auth'
  | 'jobBoard'
  | 'postJob'
  | 'bids'
  | 'contracts'
  | 'notifications'
  // TBD — no backend endpoint exists yet
  | 'kycOnboarding'
  | 'aiMatching'
  | 'chat'
  | 'contacts'
  | 'payments'
  | 'avatarSettings'
  | 'admin';

const DEFAULTS: Record<FeatureKey, boolean> = {
  // ----- KEEP -----
  auth: true,
  jobBoard: true,
  postJob: true,
  bids: true,
  contracts: true,
  // Notifications inbox bell is a passive UI surface (no destructive API call);
  // kept visible per product requirement.
  notifications: true,

  // ----- TBD (gated OFF until backend ships) -----
  kycOnboarding: false,
  aiMatching: false,
  chat: false,
  contacts: false,
  payments: false,
  // Enabled: Settings is now the surface for OAuth social-account binding
  // (社群帳號綁定). The binding section calls live /v1/me/identities endpoints.
  avatarSettings: true,
  admin: false,
};

// Map a feature key to its VITE env override name, e.g. chat → VITE_FF_CHAT.
function envKey(key: FeatureKey): string {
  const snake = key.replace(/([A-Z])/g, '_$1').toUpperCase();
  return `VITE_FF_${snake}`;
}

function resolve(key: FeatureKey): boolean {
  const override = import.meta.env[envKey(key)];
  if (override === 'true') return true;
  if (override === 'false') return false;
  return DEFAULTS[key];
}

/**
 * Returns whether a feature is enabled. Pure + synchronous so it can be called
 * from render, route config, and tests alike.
 */
export function isFeatureEnabled(key: FeatureKey): boolean {
  return resolve(key);
}

/** Convenience flag map snapshot (resolved once at module load). */
export const featureFlags: Record<FeatureKey, boolean> = Object.fromEntries(
  (Object.keys(DEFAULTS) as FeatureKey[]).map((k) => [k, resolve(k)]),
) as Record<FeatureKey, boolean>;
