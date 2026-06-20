import type { WizardStep } from '../../pages/KycPage';

interface KycStepIndicatorProps {
  currentStep: WizardStep;
  completedUpTo: WizardStep;
}

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: '基本資訊' },
  { step: 2, label: 'Email 驗證' },
  { step: 3, label: '手機驗證' },
  { step: 4, label: '身分認證' },
  { step: 5, label: '完成' },
];

export function KycStepIndicator({ currentStep, completedUpTo }: KycStepIndicatorProps) {
  return (
    <nav aria-label="KYC 進度" style={{ marginBottom: 24 }}>
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          padding: 0,
          margin: 0,
          listStyle: 'none',
          overflowX: 'auto',
        }}
      >
        {STEPS.map(({ step, label }, idx) => {
          const isDone = step < completedUpTo || (step < currentStep && step <= completedUpTo);
          const isActive = step === currentStep;

          let dotColor: string;
          let dotBg: string;
          let labelColor: string;

          if (isDone) {
            dotColor = 'var(--co-green)';
            dotBg = 'rgba(16,185,129,0.18)';
            labelColor = 'var(--co-green)';
          } else if (isActive) {
            dotColor = 'var(--co-accent)';
            dotBg = 'rgba(99,102,241,0.18)';
            labelColor = 'var(--co-accent)';
          } else {
            dotColor = 'var(--co-text-muted)';
            dotBg = 'rgba(148,163,184,0.08)';
            labelColor = 'var(--co-text-muted)';
          }

          return (
            <li
              key={step}
              style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : undefined }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 48 }}>
                <div
                  aria-current={isActive ? 'step' : undefined}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: dotBg,
                    border: `2px solid ${dotColor}`,
                    color: dotColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: 'background 200ms, border-color 200ms',
                  }}
                >
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: labelColor,
                    fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap',
                    transition: 'color 200ms',
                  }}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  style={{
                    flex: 1,
                    height: 1,
                    background: isDone ? 'var(--co-green)' : 'var(--co-line)',
                    marginBottom: 18,
                    transition: 'background 200ms',
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default KycStepIndicator;
