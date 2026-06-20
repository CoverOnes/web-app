import type { WizardStep } from '../../pages/KycPage';

/** Given kycMe state, derive the first step the user should land on */
export function deriveStartStep(opts: {
  currentTier: number;
  emailVerified: boolean;
  phoneVerified: boolean;
}): WizardStep {
  if (opts.currentTier >= 2) return 5;
  if (opts.currentTier >= 1) return 4;
  if (opts.emailVerified && opts.phoneVerified) return 4;
  if (opts.emailVerified) return 3;
  return 1;
}

/** Derive the highest "completed up to" step for the indicator */
export function deriveCompletedUpTo(opts: {
  currentTier: number;
  emailVerified: boolean;
  phoneVerified: boolean;
}): WizardStep {
  if (opts.currentTier >= 2) return 5;
  if (opts.currentTier >= 1) return 4;
  if (opts.emailVerified && opts.phoneVerified) return 4;
  if (opts.emailVerified) return 3;
  return 1;
}
