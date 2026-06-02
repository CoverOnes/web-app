interface SignatureStatusChipProps {
  role: 'Client' | 'Freelancer';
  signed: boolean;
}

const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ClockIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export function SignatureStatusChip({ role, signed }: SignatureStatusChipProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: signed ? '#dcfce7' : '#fef3c7',
        color: signed ? '#16a34a' : '#d97706',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {signed ? <CheckIcon /> : <ClockIcon />}
      <span>{role}</span>
      <span>{signed ? 'Signed' : 'Pending'}</span>
    </div>
  );
}

export default SignatureStatusChip;
