import { cloneElement, type ReactElement } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Tooltip } from '../ui/Tooltip';

interface VerifiedActionGateProps {
  /**
   * The write-action control to gate. Receives a `disabled` prop merged with the
   * unverified state. When unverified, the control is force-disabled and wrapped
   * in a tooltip explaining why.
   */
  children: ReactElement<{ disabled?: boolean }>;
  /** Tooltip text shown when the action is blocked. */
  message?: string;
  /**
   * Optional className applied to the Tooltip wrapper so the gate preserves the
   * surrounding layout (e.g. `flex-1` so it stretches like the original button).
   */
  wrapperClassName?: string;
}

/**
 * auth Increment 1: wraps a write-action button (發案/投標/KYC/合約 submit) and
 * disables it with an explanatory tooltip when the logged-in user's email is not
 * yet verified. The backend independently enforces 403 EMAIL_NOT_VERIFIED — this
 * is the proactive UX layer that prevents the user from triggering that error.
 *
 * When the user IS verified (or auth is still hydrating), children render
 * untouched so existing disabled/loading logic is preserved.
 */
export function VerifiedActionGate({
  children,
  message = '請先完成 email 驗證',
  wrapperClassName = '',
}: VerifiedActionGateProps) {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  // While hydrating we don't yet know emailVerified — render untouched to avoid
  // briefly disabling a control for an already-verified user.
  const blocked = !isHydrating && !!user && !user.emailVerified;

  if (!blocked) {
    return children;
  }

  // Force-disable the child control and wrap it in a tooltip.
  return (
    <Tooltip content={message} className={wrapperClassName}>
      {cloneElement(children, { disabled: true })}
    </Tooltip>
  );
}

export default VerifiedActionGate;
