// ChatOwl shared sidebar + topbar.
// Usage in each page:
//   <body>
//     <div id="chrome-root"></div>
//     <script src="chrome.js"></script>
//     <script>renderChrome({ active: 'projects', searchPlaceholder: '...' });</script>
//     <main class="main"> ... your page content ... </main>

(function(){
  const NAV = [
    { id:'home',     label:'首頁',     href:'Homepage.html', badge:null, count:null,
      svg:'<path d="m3 12 9-9 9 9"/><path d="M5 10v10h14V10"/>' },
    { id:'company',  label:'我的公司', href:'Company.html',  badge:null, count:null,
      svg:'<path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>' },
    { id:'discover', label:'探索企業', href:'Discover.html', badge:null, count:null,
      svg:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>' },
    { id:'projects', label:'專案接案', href:'Projects.html', badge:'12', count:null,
      svg:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6V4h8v2M3 12h18"/>' },
    { id:'bidding',  label:'招標進度', href:'Bidding.html',  badge:null, count:'7',
      svg:'<path d="M3 9h18l-2 11H5L3 9z"/><path d="M8 9V5a4 4 0 0 1 8 0v4"/>' },
    { id:'messages', label:'訊息',     href:'ChatOwl.html',  badge:'5',  count:null,
      svg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    { id:'network',  label:'網路人脈', href:'Network.html',  badge:null, count:'248',
      svg:'<circle cx="9" cy="8" r="4"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M21 20c0-2.5-1.5-4.5-3.5-5.3"/>' },
    { id:'insights', label:'數據洞察', href:'Insights.html', badge:'PRO', count:null,
      svg:'<path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-6"/>' },
    { id:'contracts',label:'合約管理', href:'Contracts.html', badge:null, count:'4',
      svg:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 14h6M9 18h4"/>' },
    { id:'calendar', label:'行事曆',   href:'Calendar.html', badge:null, count:null,
      svg:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
    { id:'saved',    label:'收藏夾',   href:'Saved.html', badge:null, count:'18',
      svg:'<path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>' },
    { id:'reports',  label:'產業報告', href:'Reports.html', badge:'PRO', count:null,
      svg:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>' },
    { id:'pricing',  label:'訂閱方案', href:'Pricing.html', badge:null, count:null,
      svg:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>' },
    { id:'help',     label:'幫助中心', href:'Help.html', badge:null, count:null,
      svg:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>' },
    { id:'notif',    label:'通知',     href:'Notifications.html', badge:'14', count:null,
      svg:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>' },
    { id:'settings', label:'設定',     href:'Settings.html', badge:null, count:null,
      svg:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.65 1.65 0 0 0-1.8-.3 1.65 1.65 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.65 1.65 0 0 0 .3-1.8 1.65 1.65 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.5-1z"/>' },
  ];

  function renderChrome(opts){
    opts = opts || {};
    const active = opts.active || 'home';
    const placeholder = opts.searchPlaceholder || '搜尋專案、公司、關鍵字...';

    const sidebar = `
      <aside class="sb">
        <div class="sb-brand">
          <div class="mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="10" r="2.4" fill="#fff"/>
              <circle cx="15" cy="10" r="2.4" fill="#fff"/>
              <circle cx="9" cy="10" r="1" fill="#0B1220"/>
              <circle cx="15" cy="10" r="1" fill="#0B1220"/>
              <path d="M11 14.5 L12 16 L13 14.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <div>
            <div class="name">ChatOwl</div>
            <div class="sub">B2B 接案媒合</div>
          </div>
        </div>
        <div class="company-switcher">
          <div class="logo">奇</div>
          <div class="info">
            <div class="n">奇點科技</div>
            <div class="t">企業帳號 · 已認證</div>
          </div>
          <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="m8 9 4-4 4 4M8 15l4 4 4-4"/></svg>
        </div>
        <div class="nav-section">主選單</div>
        ${NAV.map(n => `
          <a class="nav-item${n.id===active?' active':''}" href="${n.href}">
            <span class="ico"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${n.svg}</svg></span>
            ${n.label}
            ${n.badge?`<span class="badge">${n.badge}</span>`:''}
            ${n.count?`<span class="count">${n.count}</span>`:''}
          </a>`).join('')}
        <div class="nav-section">收藏</div>
        <a class="nav-item" href="#">
          <span class="ico" style="color: var(--amber)"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3L6.9 14.2l-5-4.9 7-1Z"/></svg></span>
          重要專案
        </a>
        <a class="nav-item" href="#">
          <span class="ico"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/></svg></span>
          AI 應用產業
        </a>
        <div class="sb-footer">
          <div class="av">A</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;">Alex Chen</div>
            <div style="font-size:10.5px;color:var(--green);display:flex;align-items:center;gap:4px;">
              <span style="width:6px;height:6px;border-radius:999px;background:var(--green)"></span>
              產品總監 · 線上
            </div>
          </div>
        </div>
      </aside>`;

    const topbar = `
      <div class="topbar">
        <div class="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          ${placeholder}
          <span class="kbd">⌘K</span>
        </div>
        <div class="top-actions">
          <a class="icon-btn" href="ChatOwl.html" title="訊息"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span class="num">5</span></a>
          <a class="icon-btn" href="Notifications.html" title="通知"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span class="num">14</span></a>
          <div style="width:1px;height:24px;background:var(--line);margin:0 6px;"></div>
          <button class="me-pill">
            <span class="av">A</span>
            <div style="text-align:left;">
              <div class="nm">Alex Chen</div>
              <div class="role">奇點科技 · 產品總監</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="color:var(--text-dim);margin:0 4px 0 2px;"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>
      </div>`;

    const sbHost = document.getElementById('chrome-sidebar');
    const tbHost = document.getElementById('chrome-topbar');
    if (sbHost) sbHost.outerHTML = sidebar;
    if (tbHost) tbHost.outerHTML = topbar;
  }
  window.renderChrome = renderChrome;

  // Auto-run on DOMContentLoaded if window.__active is set
  function autorun(){
    if (typeof window.__active !== 'undefined') {
      renderChrome({ active: window.__active, searchPlaceholder: window.__searchPlaceholder });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autorun);
  } else {
    autorun();
  }
})();
