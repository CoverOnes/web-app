interface StatItem {
  num: string;
  lbl: string;
}

interface AuthHeroPanelProps {
  title: string;
  subtitle: string;
  stats?: StatItem[];
  badge?: string;
}

const DEFAULT_STATS: StatItem[] = [
  { num: '8,200+', lbl: 'Verified Freelancers' },
  { num: '3,400', lbl: 'Active Listings' },
  { num: 'NT$ 1.2B', lbl: 'Total Contract Value' },
  { num: '97.4%', lbl: 'Completion Rate' },
];

export function AuthHeroPanel({
  title,
  subtitle,
  stats = DEFAULT_STATS,
  badge = 'Taiwan Freelance Marketplace',
}: AuthHeroPanelProps) {
  return (
    <section
      style={{
        position: 'relative',
        padding: '36px 56px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 12h6M9 16h6M12 8V6M7 20h10a2 2 0 0 0 2-2V8l-4-4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: '#E5E7EB' }}>
            CoverOnes
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1, letterSpacing: '0.02em' }}>
            Professional Freelance Platform
          </div>
        </div>
      </div>

      {/* Hero body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 640,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 11px 5px 6px',
            borderRadius: 999,
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            fontSize: 12,
            color: '#C7D2FE',
            width: 'fit-content',
            marginBottom: 22,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            KYC
          </span>
          <span>{badge}</span>
        </div>

        {/* Tagline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            margin: '0 0 20px 0',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #C7D2FE 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: '#94A3B8',
            maxWidth: 480,
            margin: '0 0 36px 0',
            fontWeight: 400,
          }}
        >
          {subtitle}
        </p>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            gap: 36,
            marginTop: 16,
            paddingTop: 28,
            borderTop: '1px solid rgba(148,163,184,0.12)',
          }}
        >
          {stats.map((s) => (
            <div key={s.lbl}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(180deg, #fff, #C7D2FE)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {s.num}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2, letterSpacing: '0.02em' }}>
                {s.lbl}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AuthHeroPanel;
