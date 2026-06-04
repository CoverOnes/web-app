import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
        textAlign: 'center',
        gap: 16,
        color: 'var(--co-text)',
      }}
    >
      {/* 404 number */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, var(--co-accent), var(--co-accent-2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        aria-hidden="true"
      >
        404
      </div>

      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        找不到頁面
      </div>

      <p
        style={{
          fontSize: 14,
          color: 'var(--co-text-dim)',
          maxWidth: 320,
          lineHeight: 1.6,
        }}
      >
        您所尋找的頁面不存在，或已被移動到其他位置。
      </p>

      <button
        type="button"
        onClick={() => navigate('/jobs')}
        style={{
          marginTop: 8,
          padding: '10px 24px',
          borderRadius: 'var(--co-btn-r)',
          background: 'linear-gradient(135deg, var(--co-btn-primary-from), var(--co-btn-primary-to))',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
        }}
      >
        回到案件看板
      </button>
    </div>
  );
};

export default NotFoundPage;
