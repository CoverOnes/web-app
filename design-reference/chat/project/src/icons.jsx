// Lucide-style stroke icons. 1.75 weight, currentColor.
const IconBase = ({ children, size = 18, style, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
    {...rest}
  >
    {children}
  </svg>
);

const Icon = {
  Owl: ({ size = 22, ...p }) => (
    // Original geometric owl mark
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...p}>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#owlg)" />
      <defs>
        <linearGradient id="owlg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--indigo)" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="14" r="3.2" fill="#fff" />
      <circle cx="20" cy="14" r="3.2" fill="#fff" />
      <circle cx="12" cy="14" r="1.4" fill="#0B1220" />
      <circle cx="20" cy="14" r="1.4" fill="#0B1220" />
      <path d="M14.5 19.2 L16 21 L17.5 19.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M16 8 L18 10 M16 8 L14 10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Plus: (p) => <IconBase {...p}><path d="M12 5v14M5 12h14" /></IconBase>,
  Search: (p) => <IconBase {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></IconBase>,
  Bell: (p) => <IconBase {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></IconBase>,
  ChevronDown: (p) => <IconBase {...p}><path d="m6 9 6 6 6-6" /></IconBase>,
  MessageSquare: (p) => <IconBase {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></IconBase>,
  Users: (p) => <IconBase {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconBase>,
  UserGroup: (p) => <IconBase {...p}><circle cx="9" cy="8" r="4" /><path d="M17 11a3 3 0 1 0 0-6" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M21 20c0-2.5-1.5-4.5-3.5-5.3" /></IconBase>,
  Star: (p) => <IconBase {...p}><path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3L6.9 14.2l-5-4.9 7-1Z" /></IconBase>,
  Hash: (p) => <IconBase {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" /></IconBase>,
  Lock: (p) => <IconBase {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></IconBase>,
  LockSmall: ({ size = 10, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...p}>
      <rect x="2" y="5.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4 5.5V4a2 2 0 1 1 4 0v1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
    </svg>
  ),
  Send: (p) => <IconBase {...p}><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4Z" /></IconBase>,
  Paperclip: (p) => <IconBase {...p}><path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 1 1-3-3L16 7" /></IconBase>,
  Smile: (p) => <IconBase {...p}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></IconBase>,
  Phone: (p) => <IconBase {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7 13 13 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5 13 13 0 0 0 2.8.7 2 2 0 0 1 1.7 2Z" /></IconBase>,
  Video: (p) => <IconBase {...p}><path d="M16 10l5.5-3.5v11L16 14M4 6h12v12H4z" /></IconBase>,
  MoreH: (p) => <IconBase {...p}><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></IconBase>,
  MoreV: (p) => <IconBase {...p}><circle cx="12" cy="5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="19" r="1.2" fill="currentColor" /></IconBase>,
  Check: (p) => <IconBase {...p}><path d="M5 12.5 10 17l9-10" /></IconBase>,
  CheckDouble: (p) => <IconBase {...p}><path d="m2 12.5 4 4 8-9" /><path d="m10 16.5 2 2 9-10" /></IconBase>,
  Settings: (p) => <IconBase {...p}><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /><circle cx="12" cy="12" r="3" /></IconBase>,
  Menu: (p) => <IconBase {...p}><path d="M3 6h18M3 12h18M3 18h18" /></IconBase>,
  X: (p) => <IconBase {...p}><path d="m18 6-12 12M6 6l12 12" /></IconBase>,
  ArrowLeft: (p) => <IconBase {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></IconBase>,
  Paint: (p) => <IconBase {...p}><circle cx="12" cy="12" r="9" /><circle cx="7.5" cy="10.5" r="1" fill="currentColor" /><circle cx="12" cy="7.5" r="1" fill="currentColor" /><circle cx="16.5" cy="10.5" r="1" fill="currentColor" /><path d="M12 21a3 3 0 0 1 0-6 2 2 0 0 0 1-3.7" /></IconBase>,
  Sun: (p) => <IconBase {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></IconBase>,
  Moon: (p) => <IconBase {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" /></IconBase>,
  Smartphone: (p) => <IconBase {...p}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></IconBase>,
  Monitor: (p) => <IconBase {...p}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></IconBase>,
  Image: (p) => <IconBase {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></IconBase>,
  File: (p) => <IconBase {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></IconBase>,
  Pin: (p) => <IconBase {...p}><path d="M12 17v5" /><path d="M9 10.76V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4.76a2 2 0 0 0 1.11 1.79L18 14H6l1.89-1.45A2 2 0 0 0 9 10.76Z" /></IconBase>,
  Reply: (p) => <IconBase {...p}><path d="M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4" /></IconBase>,
  Heart: (p) => <IconBase {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8Z" /></IconBase>,
};

window.Icon = Icon;
window.IconBase = IconBase;
