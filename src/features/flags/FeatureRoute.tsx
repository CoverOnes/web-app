import type { ReactNode } from 'react';
import { isFeatureEnabled, type FeatureKey } from './featureFlags';
import { ComingSoon } from './ComingSoon';

interface FeatureRouteProps {
  flag: FeatureKey;
  /** Display name for the ComingSoon fallback. */
  feature: string;
  description?: string;
  children: ReactNode;
}

/**
 * Route-level guard: renders `children` only when the feature flag is enabled.
 * When disabled, renders the <ComingSoon /> placeholder instead of the real page
 * so a TBD feature cannot call a non-existent backend API and crash.
 */
export function FeatureRoute({ flag, feature, description, children }: FeatureRouteProps) {
  if (!isFeatureEnabled(flag)) {
    return <ComingSoon feature={feature} description={description} />;
  }
  return <>{children}</>;
}

export default FeatureRoute;
