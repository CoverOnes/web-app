import { cloneElement, type MouseEvent, type ReactElement } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Tooltip } from '../ui/Tooltip';

interface GatedControlProps {
  disabled?: boolean;
  'aria-disabled'?: boolean | 'true' | 'false';
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  className?: string;
}

interface VerifiedActionGateProps {
  /**
   * The write-action control to gate. When blocked it is rendered with
   * aria-disabled (NOT the native `disabled` attribute) and its onClick is
   * suppressed, then wrapped in a tooltip explaining why.
   */
  children: ReactElement<GatedControlProps>;
  /** Tooltip text shown when the action is blocked. */
  message?: string;
  /**
   * Optional className applied to the Tooltip wrapper so the gate preserves the
   * surrounding layout (e.g. `flex-1` so it stretches like the original button).
   */
  wrapperClassName?: string;
}

/**
 * auth Increment 1 / Inc2: wraps a write-action button (發案/投標/KYC submit) and
 * blocks it with an explanatory tooltip when the logged-in user's email is not
 * yet verified. The backend independently enforces 403 EMAIL_NOT_VERIFIED — this
 * is the proactive UX layer that prevents the user from triggering that error.
 *
 * FIX B: the native `disabled` attribute combined with the Button's
 * `disabled:pointer-events-none` swallowed hover/focus events, so the tooltip
 * never appeared — the user saw a dead button with no reason. We now use
 * `aria-disabled` + a suppressed onClick instead. The control stays
 * hover/focus-able (so the tooltip shows and screen readers announce the
 * disabled state) while the action itself is still prevented.
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

  // aria-disabled instead of native disabled: keeps the control focus/hover-able
  // so the tooltip reason actually shows, while we hard-suppress the click and
  // dim it visually via the gate's own class.
  const blockClassName = [
    children.props.className ?? '',
    'opacity-50 cursor-not-allowed',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tooltip content={message} className={wrapperClassName}>
      {cloneElement(children, {
        'aria-disabled': true,
        className: blockClassName,
        onClick: (e: MouseEvent<HTMLElement>) => {
          // Prevent the gated action without relying on the native disabled
          // attribute (which would suppress the tooltip's hover events).
          e.preventDefault();
          e.stopPropagation();
        },
      })}
    </Tooltip>
  );
}

export default VerifiedActionGate;
