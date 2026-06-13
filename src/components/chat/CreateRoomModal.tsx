import React from 'react';

interface CreateRoomModalProps {
  onClose: () => void;
}

const CreateRoomModal = ({ onClose }: CreateRoomModalProps) => {
  const btnBase: React.CSSProperties = {
    padding: '10px 24px', border: 'none', borderRadius: 8,
    cursor: 'pointer', fontWeight: 600, fontSize: 15, transition: 'all 150ms',
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 'var(--z-modal)' as React.CSSProperties['zIndex'], animation: 'fadeIn 200ms ease',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-main-bg-2)', borderRadius: 12,
          width: '90%', maxWidth: 500, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)', border: '1px solid var(--color-main-border)',
          color: 'var(--color-main-text)',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-main-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 id="create-room-modal-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-main-text)' }}>創建群組</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            style={{ background: 'var(--color-sb-hover)', border: 'none', fontSize: 24, color: 'var(--color-main-text-dim)', cursor: 'pointer', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
        </div>

        <div style={{ padding: '40px 24px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: 'var(--color-main-text)' }}>尚無可選聯絡人</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-main-text-dim)', lineHeight: 1.5 }}>
              聯絡人功能即將推出，屆時可在此建立群組對話。
            </p>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-main-border)', display: 'flex', gap: 12, justifyContent: 'flex-end', background: 'var(--color-main-bg)' }}>
          <button type="button" onClick={onClose} style={{ ...btnBase, background: 'var(--color-sb-tint)', color: 'var(--color-main-text)' }}>關閉</button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;

