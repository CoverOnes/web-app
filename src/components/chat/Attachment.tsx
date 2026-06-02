import { Icon } from '../ui/Icon';

type AttachKind = 'image' | 'file';

interface AttachmentProps {
  attach: {
    kind: AttachKind;
    name: string;
    meta: string;
    url?: string;
  };
}

const Attachment = ({ attach }: AttachmentProps) => {
  if (attach.kind === 'image') {
    return (
      <div style={{
        marginTop: 6,
        border: '1px solid var(--color-main-border)',
        borderRadius: 8,
        overflow: 'hidden',
        maxWidth: 320,
      }}>
        <div style={{
          height: 140,
          background: `
            repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 8px, transparent 8px 16px),
            linear-gradient(135deg, rgba(37,99,235,0.25), rgba(99,102,241,0.15))
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
        }}>
          {attach.url ? (
            <img src={attach.url} alt={attach.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            '[image preview]'
          )}
        </div>
        <div style={{
          padding: '8px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(0,0,0,0.15)',
          fontSize: 12,
        }}>
          <Icon.Image size={14} style={{ color: 'var(--color-main-text-dim)', flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {attach.name}
          </span>
          <span style={{ color: 'var(--color-main-text-dim)', fontSize: 11 }}>{attach.meta}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 6,
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid var(--color-main-border)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      maxWidth: 320,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        background: 'var(--color-accent-soft)',
        color: 'var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon.File size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attach.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-main-text-dim)' }}>{attach.meta}</div>
      </div>
    </div>
  );
};

export default Attachment;
