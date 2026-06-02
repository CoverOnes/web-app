import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useListings } from '../lib/query';
import { ListingCard } from '../components/marketplace/ListingCard';
import { Button } from '../components/ui/Button';
import { Tooltip } from '../components/ui/Tooltip';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';

const JobBoardPage = () => {
  const navigate = useNavigate();
  const kycTier = useAuthStore((s) => s.user?.kycTier ?? 0);
  const { data: listings, isLoading, isError } = useListings({ status: 'OPEN' });

  const canPost = kycTier >= 2;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-main-text)', letterSpacing: '-0.02em' }}>
          Job Board
        </h1>
        {canPost ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/jobs/new')}
            aria-label="Post a job"
          >
            Post a Job
          </Button>
        ) : (
          <Tooltip content="KYC Tier 2 required. Complete verification to post jobs.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="primary" size="md" disabled aria-label="Post a job (KYC required)">
                Post a Job
              </Button>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: '#fef3c7',
                  color: '#d97706',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                <Icon.Lock size={11} />
                Tier 2 required
              </span>
            </div>
          </Tooltip>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          <LoadingSkeleton count={6} height="h-36" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Icon.X size={48} />}
          title="Failed to load listings"
          description="Something went wrong. Please refresh to try again."
        />
      ) : !listings || listings.length === 0 ? (
        <EmptyState
          icon={<Icon.MessageSquare size={48} />}
          title="No open listings"
          description="Be the first to post a job and find great talent."
          ctaLabel={canPost ? 'Post a Job' : undefined}
          onCta={canPost ? () => navigate('/jobs/new') : undefined}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobBoardPage;
