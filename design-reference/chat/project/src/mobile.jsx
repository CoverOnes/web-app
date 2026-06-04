// Mobile (375px) variant — bottom nav, drawer sidebar, full-screen chat

const mobStyles = {
  frame: {
    width: 375, height: 812,
    borderRadius: 44, overflow: "hidden", position: "relative",
    background: "var(--main-bg)",
    boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5), 0 0 0 10px #1a1a1a, 0 0 0 11px #2a2a2a",
  },
  statusBar: {
    height: 44, padding: "0 24px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    color: "var(--main-text)",
    fontSize: 14, fontWeight: 600,
    background: "var(--main-bg-2)",
  },
  notch: {
    position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
    width: 120, height: 28, borderRadius: 20, background: "#000",
    zIndex: 10,
  },
  screenHeader: {
    height: 52, padding: "0 16px",
    display: "flex", alignItems: "center", gap: 12,
    borderBottom: "1px solid var(--main-border)",
    background: "var(--main-bg-2)",
  },
  bottomNav: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: 72, paddingBottom: 16,
    background: "var(--main-bg-2)",
    borderTop: "1px solid var(--main-border)",
    display: "flex",
    zIndex: 5,
  },
  navBtn: (active) => ({
    flex: 1,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 3, padding: "4px 0",
    color: active ? "var(--accent)" : "var(--main-text-dim)",
    fontSize: 10, fontWeight: 500,
  }),
  fab: {
    position: "absolute", right: 16, bottom: 90,
    width: 52, height: 52, borderRadius: 16,
    background: "var(--accent)",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 10px 24px rgba(37,99,235,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
    zIndex: 6,
  },
  listRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px",
    borderBottom: "1px solid var(--main-border)",
  },
  drawer: (open) => ({
    position: "absolute", top: 0, left: 0, bottom: 0,
    width: 300,
    background: "var(--sb-bg)",
    color: "var(--sb-text)",
    transform: open ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 220ms cubic-bezier(0.2,0.9,0.3,1)",
    zIndex: 20,
    display: "flex", flexDirection: "column",
    boxShadow: open ? "0 0 40px rgba(0,0,0,0.5)" : "none",
  }),
  drawerBackdrop: (open) => ({
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.5)",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: "opacity 220ms",
    zIndex: 15,
  }),
};

const StatusBar = () => (
  <div style={mobStyles.statusBar}>
    <span>9:41</span>
    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {/* Signal */}
      <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="7" width="3" height="3" rx="0.5"/><rect x="4" y="5" width="3" height="5" rx="0.5"/><rect x="8" y="3" width="3" height="7" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
      {/* Wifi */}
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 3.5 A9 9 0 0 1 13 3.5"/><path d="M3 5.5 A6 6 0 0 1 11 5.5"/><path d="M5 7.5 A3 3 0 0 1 9 7.5"/><circle cx="7" cy="9" r="0.7" fill="currentColor"/></svg>
      {/* Battery */}
      <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor"/><rect x="2" y="2" width="17" height="7" rx="1" fill="currentColor"/><rect x="21" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor"/></svg>
    </span>
  </div>
);

const MobileListScreen = ({ rooms, onOpen, onOpenDrawer, onOpenCreate, tab, onTab }) => (
  <>
    <div style={mobStyles.screenHeader}>
      <button onClick={onOpenDrawer} style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text)" }}>
        <Icon.Menu size={20} />
      </button>
      <div style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>
        {tab === "chats" ? "聊天" : tab === "contacts" ? "聯絡人" : tab === "groups" ? "群組" : tab === "notif" ? "通知" : "設定"}
      </div>
      <button style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text)" }}>
        <Icon.Search size={18} />
      </button>
    </div>
    <div style={{ flex: 1, overflowY: "auto" }}>
      {tab === "chats" && rooms.map(r => {
        const d = roomDisplay(r);
        return (
          <button key={r.id} onClick={() => onOpen(r.id)}
            style={{ ...mobStyles.listRow, width: "100%", textAlign: "left", background: "transparent", color: "var(--main-text)" }}>
            {r.kind === "dm" ? <Avatar person={d.person} size={44} showDot /> : (
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, var(--accent), var(--indigo))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon.Hash size={18} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: r.unread > 0 ? 600 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</span>
                <span style={{ fontSize: 11, color: "var(--main-text-dim)", flexShrink: 0 }}>{formatTime(r.last)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: r.unread > 0 ? "var(--main-text)" : "var(--main-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.preview}</span>
                {r.unread > 0 && (
                  <span style={{ fontSize: 10.5, fontWeight: 600, padding: "0 6px", height: 18, lineHeight: "18px", borderRadius: 999, background: "var(--red)", color: "#fff", minWidth: 18, textAlign: "center" }}>
                    {r.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {tab !== "chats" && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--main-text-dim)", fontSize: 13 }}>
          {tab === "contacts" ? "聯絡人列表" : tab === "groups" ? "群組列表" : tab === "notif" ? "通知" : "設定"} · 示範畫面
        </div>
      )}
    </div>
  </>
);

const MobileChatScreen = ({ room, onBack, onSend }) => {
  const d = roomDisplay(room);
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [room.id, room.messages.length]);

  return (
    <>
      <div style={{ ...mobStyles.screenHeader, height: 56 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text)" }}>
          <Icon.ArrowLeft size={20} />
        </button>
        {room.kind === "dm" ? <Avatar person={d.person} size={34} showDot /> : (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), var(--indigo))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon.Hash size={15} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            {d.title}
            <Icon.LockSmall size={9} style={{ color: "var(--cyan)", opacity: 0.7 }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--main-text-dim)" }}>
            {room.kind === "group" ? `${room.members.length} 位成員` : d.person.status === "online" ? "線上" : "離線"}
          </div>
        </div>
        <button style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text-dim)" }}>
          <Icon.Phone size={17} />
        </button>
        <button style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text-dim)" }}>
          <Icon.Video size={17} />
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px 6px 12px" }}>
        {groupMessages(room.messages).map((g, i) => {
          const own = g.from === "me";
          const p = DATA.P[g.from];
          return (
            <div key={i} style={{ display: "flex", gap: 8, flexDirection: own ? "row-reverse" : "row", marginBottom: 10 }}>
              {!own && <Avatar person={p} size={28} />}
              <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start" }}>
                {!own && room.kind === "group" && (
                  <div style={{ fontSize: 11, color: "var(--main-text-dim)", marginBottom: 2, paddingLeft: 4 }}>{p.zh}</div>
                )}
                {g.msgs.map((m, j) => (
                  <div key={m.id} style={{
                    marginTop: j === 0 ? 0 : 2,
                    padding: "8px 12px",
                    borderRadius: 12,
                    background: own ? "var(--accent)" : "var(--bubble-other)",
                    color: own ? "#fff" : "var(--bubble-other-text)",
                    fontSize: 13.5, lineHeight: 1.45,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    border: own ? "none" : "1px solid var(--main-border)",
                  }}>
                    {m.text}
                  </div>
                ))}
                <div style={{ fontSize: 10, color: "var(--main-text-dim)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon.LockSmall size={8} style={{ color: "var(--cyan)", opacity: 0.7 }} />
                  {formatTime(g.msgs[g.msgs.length-1].time)}
                  {own && <Icon.CheckDouble size={11} style={{ color: "var(--cyan)" }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <MobileComposer onSend={onSend} />
    </>
  );
};

const MobileComposer = ({ onSend }) => {
  const [val, setVal] = useState("");
  const send = () => { const v = val.trim(); if (!v) return; onSend(v); setVal(""); };
  return (
    <div style={{ padding: "8px 12px 12px 12px", borderTop: "1px solid var(--main-border)", background: "var(--main-bg-2)", display: "flex", gap: 8, alignItems: "flex-end" }}>
      <button style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text-dim)" }}>
        <Icon.Paperclip size={18} />
      </button>
      <div style={{ flex: 1, background: "var(--input-bg)", border: "1px solid var(--main-border)", borderRadius: 20, padding: "8px 14px", display: "flex", alignItems: "center" }}>
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="訊息..." style={{ flex: 1, fontSize: 14, color: "var(--main-text)" }} />
      </div>
      <button onClick={send} style={{ width: 36, height: 36, borderRadius: 999, background: val.trim() ? "var(--accent)" : "rgba(148,163,184,0.2)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon.Send size={16} />
      </button>
    </div>
  );
};

const MobileDrawer = ({ open, onClose, onOpenCreate, rooms, onSelectRoom }) => {
  const me = DATA.P.me;
  return (
    <>
      <div style={mobStyles.drawerBackdrop(open)} onClick={onClose} />
      <div style={mobStyles.drawer(open)}>
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--sb-border)" }}>
          <Icon.Owl size={28} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>ChatOwl</div>
            <div style={{ fontSize: 10.5, color: "var(--sb-text-dim)" }}>加密即時通訊</div>
          </div>
          <button onClick={onClose} style={{ color: "var(--sb-text-dim)", padding: 6 }}>
            <Icon.X size={16} />
          </button>
        </div>
        <div style={{ padding: 8 }}>
          {DATA.NAV_ITEMS.map(n => {
            const IconC = Icon[n.icon];
            return (
              <button key={n.id} style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, borderRadius: 8, color: "var(--sb-text)", fontSize: 13.5 }}>
                <IconC size={16} style={{ color: "var(--sb-text-dim)" }} />
                <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>
                {n.count != null && <span style={{ fontSize: 11, color: "var(--sb-text-dim)" }}>{n.count}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "10px 16px 6px 16px", fontSize: 10.5, color: "var(--sb-text-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>在線上</div>
        <div style={{ padding: "0 8px", flex: 1, overflowY: "auto" }}>
          {DATA.PEOPLE.filter(p => p.id !== "me" && p.status === "online").map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 8 }}>
              <Avatar person={p} size={26} showDot />
              <span style={{ fontSize: 12.5 }}>{p.zh}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid var(--sb-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar person={me} size={30} showDot ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>你 · Alex Chen</div>
            <div style={{ fontSize: 10.5, color: "var(--green)" }}>線上</div>
          </div>
          <button style={{ color: "var(--sb-text-dim)", padding: 6 }}><Icon.Settings size={15} /></button>
        </div>
      </div>
    </>
  );
};

const MobileBottomNav = ({ tab, onTab }) => {
  const items = [
    { id: "chats", label: "聊天", icon: "MessageSquare", badge: 16 },
    { id: "contacts", label: "聯絡人", icon: "Users" },
    { id: "groups", label: "群組", icon: "UserGroup" },
    { id: "notif", label: "通知", icon: "Bell", badge: 3 },
    { id: "settings", label: "設定", icon: "Settings" },
  ];
  return (
    <div style={mobStyles.bottomNav}>
      {items.map(i => {
        const IconC = Icon[i.icon];
        const active = tab === i.id;
        return (
          <button key={i.id} onClick={() => onTab(i.id)} style={mobStyles.navBtn(active)}>
            <div style={{ position: "relative" }}>
              <IconC size={20} />
              {i.badge && (
                <span style={{
                  position: "absolute", top: -4, right: -8,
                  fontSize: 9.5, fontWeight: 600, padding: "0 4px", minWidth: 14, height: 14, lineHeight: "14px",
                  borderRadius: 999, background: "var(--red)", color: "#fff", textAlign: "center",
                  boxShadow: "0 0 0 2px var(--main-bg-2)",
                }}>{i.badge}</span>
              )}
            </div>
            <span>{i.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const MobileApp = ({ rooms, onSendInRoom, onCreate }) => {
  const [tab, setTab] = useState("chats");
  const [openRoomId, setOpenRoomId] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [touchX, setTouchX] = useState(null);

  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (dx > 50 && touchX < 40) setDrawer(true);
    if (dx < -50 && drawer) setDrawer(false);
    setTouchX(null);
  };

  const room = rooms.find(r => r.id === openRoomId);

  return (
    <div style={mobStyles.frame} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={mobStyles.notch} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <StatusBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: room ? 0 : 72 }}>
          {room ? (
            <MobileChatScreen
              room={room}
              onBack={() => setOpenRoomId(null)}
              onSend={(text) => onSendInRoom(room.id, text)}
            />
          ) : (
            <MobileListScreen
              rooms={rooms}
              tab={tab}
              onTab={setTab}
              onOpen={setOpenRoomId}
              onOpenDrawer={() => setDrawer(true)}
              onOpenCreate={onCreate}
            />
          )}
        </div>
        {!room && (
          <>
            <button style={mobStyles.fab} onClick={onCreate}>
              <Icon.Plus size={24} />
            </button>
            <MobileBottomNav tab={tab} onTab={setTab} />
          </>
        )}
        <MobileDrawer open={drawer} onClose={() => setDrawer(false)} rooms={rooms} />
      </div>
    </div>
  );
};

window.MobileApp = MobileApp;
