import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCreateListing } from '../lib/query';
import { TierGuard } from '../components/auth/TierGuard';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import type { AxiosError } from 'axios';

const CURRENCY_OPTIONS = [
  { value: 'TWD', label: 'TWD' },
  { value: 'USD', label: 'USD' },
];

const PostJobPage = () => {
  const navigate = useNavigate();
  const kycTier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const createListing = useCreateListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [currency, setCurrency] = useState('TWD');
  const [error, setError] = useState('');

  if (kycTier < 2) {
    return <TierGuard requiredTier={2} fullPage>{null}</TierGuard>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!description.trim()) { setError('Description is required.'); return; }
    setError('');

    try {
      const listing = await createListing.mutateAsync({
        title,
        description,
        budgetMin: budgetMin || undefined,
        budgetMax: budgetMax || undefined,
        currency,
      });
      navigate(`/jobs/${listing.id}`, { replace: true });
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(axErr.response?.data?.message ?? 'Failed to create listing.');
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 672, width: '100%' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-main-text)', marginBottom: 24, letterSpacing: '-0.02em' }}>
          Post a Job
        </h1>

        <div
          style={{
            background: 'var(--color-main-bg-2)',
            border: '1px solid var(--color-main-border)',
            borderRadius: 16,
            padding: 28,
          }}
        >
          {error && (
            <div
              role="alert"
              style={{
                padding: '10px 14px', marginBottom: 18,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, fontSize: 13, color: '#FCA5A5',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input
              label="Job Title"
              id="post-title"
              placeholder="e.g. React developer for e-commerce project"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              label="Description"
              id="post-description"
              placeholder="Describe the project requirements, timeline, and deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 12 }}>
              <Input
                label="Budget Min"
                id="post-budgetMin"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
              <Input
                label="Budget Max"
                id="post-budgetMax"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
              <Select
                label="Currency"
                id="post-currency"
                options={CURRENCY_OPTIONS}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={createListing.isPending}
              className="w-full"
            >
              Publish Job
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJobPage;
