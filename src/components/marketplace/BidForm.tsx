import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { KycRequiredBanner } from '../auth/KycRequiredBanner';
import { VerifiedActionGate } from '../auth/VerifiedActionGate';
import { useAuthStore } from '../../store/authStore';
import type { CreateBidRequest } from '../../lib/api/coverones';

interface BidFormProps {
  onSubmit: (data: CreateBidRequest) => void;
  isSubmitting: boolean;
  error?: string;
}

const CURRENCY_OPTIONS = [
  { value: 'TWD', label: 'TWD' },
  { value: 'USD', label: 'USD' },
];

export function BidForm({ onSubmit, isSubmitting, error }: BidFormProps) {
  const kycTier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TWD');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  if (kycTier < 1) {
    return (
      <KycRequiredBanner
        requiredTier={1}
        message="KYC Tier 1 required to place bids. Complete basic identity verification to unlock bidding."
      />
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount.trim()) {
      setFormError('Amount is required');
      return;
    }
    setFormError('');
    onSubmit({ amount, currency, message });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--co-text)', marginBottom: 4 }}>
        Place a Bid
      </h3>

      {(error || formError) && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            fontSize: 13,
            color: '#FCA5A5',
          }}
        >
          {error ?? formError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Input
          label="Amount"
          id="bid-amount"
          type="number"
          min="0"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          containerClassName="flex-1"
        />
        <Select
          label="Currency"
          id="bid-currency"
          options={CURRENCY_OPTIONS}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          containerClassName="w-28"
        />
      </div>

      <Textarea
        label="Message"
        id="bid-message"
        placeholder="Describe your proposal..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
      />

      <VerifiedActionGate wrapperClassName="w-full">
        <Button type="submit" variant="primary" size="md" loading={isSubmitting} className="w-full">
          Submit Bid
        </Button>
      </VerifiedActionGate>
    </form>
  );
}

export default BidForm;
