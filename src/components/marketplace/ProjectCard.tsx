import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { LogoSquare } from '../ui/LogoSquare';
import { StatusBadge } from '../ui/StatusBadge';
import type { Listing } from '../../lib/api/coverones';

interface ProjectCardProps {
  listing: Listing;
  onClick?: () => void;
}

function isUrgent(createdAt: string): boolean {
  // Treat listings created within 3 days as "urgent" placeholder
  try {
    const diff = Date.now() - new Date(createdAt).getTime();
    return diff < 3 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function ProjectCard({ listing, onClick }: ProjectCardProps) {
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

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    navigate(`/jobs/${listing.id}`);
  };

  const urgent = isUrgent(listing.createdAt);
  const letter = listing.title.charAt(0).toUpperCase();

  return (
    <article
      role="article"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      style={{
        background: 'var(--co-bg-card)',
        border: '1px solid var(--co-line)',
        borderRadius: 12,
        padding: 18,
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
        cursor: 'pointer',
        transition: 'border-color 150ms ease-out',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--co-line)'; }}
    >
      {/* Logo */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        <LogoSquare letter={letter} size={52} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Title + urgency badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--co-text)',
              lineHeight: 1.4,
              flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              margin: 0,
            }}
          >
            {listing.title}
          </h3>
          {urgent && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 10,
                padding: '2px 7px',
                borderRadius: 999,
                background: 'rgba(239,68,68,0.15)',
                color: 'var(--co-red)',
                fontWeight: 600,
                border: '1px solid rgba(239,68,68,0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              New
            </span>
          )}
        </div>

        {/* Meta */}
        <div style={{ fontSize: 12, color: 'var(--co-text-muted)' }}>
          {relativeTime && <span>{relativeTime}</span>}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: 'var(--co-text-dim)',
            lineHeight: 1.55,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            margin: 0,
          }}
        >
          {listing.description}
        </p>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, flexWrap: 'wrap', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--co-green)',
            }}
          >
            {budgetLabel}
          </span>
          <StatusBadge status={listing.status} />
        </div>
      </div>
    </article>
  );
}

export default ProjectCard;
