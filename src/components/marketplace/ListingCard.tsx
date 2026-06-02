import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import type { Listing } from '../../lib/api/coverones';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const navigate = useNavigate();

  const budgetLabel = (() => {
    if (listing.budgetMin && listing.budgetMax) {
      return `${listing.currency} ${listing.budgetMin} – ${listing.budgetMax}`;
    }
    if (listing.budgetMin) return `${listing.currency} ${listing.budgetMin}+`;
    if (listing.budgetMax) return `Up to ${listing.currency} ${listing.budgetMax}`;
    return 'Budget TBD';
  })();

  const relativeTime = (() => {
    try {
      return formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  })();

  return (
    <article
      role="article"
      tabIndex={0}
      onClick={() => navigate(`/jobs/${listing.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/jobs/${listing.id}`);
      }}
      style={{
        background: 'var(--color-main-bg-2)',
        border: '1px solid var(--color-main-border)',
        borderRadius: 'var(--radius-card)',
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 hover:border-accent-500/40"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-main-text)',
            lineHeight: 1.4,
            flex: 1,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {listing.title}
        </h3>
        <StatusBadge status={listing.status} />
      </div>

      <p
        style={{
          fontSize: 13,
          color: 'var(--color-main-text-dim)',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {listing.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)' }}>
          {budgetLabel}
        </span>
        {relativeTime && (
          <span style={{ fontSize: 11, color: 'var(--color-main-text-dim)' }}>
            {relativeTime}
          </span>
        )}
      </div>
    </article>
  );
}

export default ListingCard;
