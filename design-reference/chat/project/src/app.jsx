// Global styles + app shell

const globalCss = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.94) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}
.typing-dot {
  width: 6px; height: 6px; border-radius: 999px;
  background: var(--main-text-dim);
  animation: typingBounce 1.2s ease-in-out infinite;
  display: inline-block;
}
.msg-hover:hover .reaction-bar {
  opacity: 1 !important;
  transform: translateY(0) !important;
  pointer-events: auto !important;
}
`;
const styleEl = document.createElement("style");
styleEl.textContent = globalCss;
document.head.appendChild(styleEl);

const App = () => {
  const [tweaks, setTweaks] = useState(window.TWEAK_DEFAULTS);
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [rooms, setRooms] = useState(DATA.ROOMS);
  const [activeRoomId, setActiveRoomId] = useState(() => {
    return localStorage.getItem("chatowl.activeRoom") || "r1";
  });
  const [activeNav, setActiveNav] = useState("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { applyTweaks(tweaks); }, [tweaks]);
  useEffect(() => { localStorage.setItem("chatowl.activeRoom", activeRoomId); }, [activeRoomId]);

  // Tweaks toolbar integration
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setTweaksVisible(true);
      if (d.type === "__deactivate_edit_mode") setTweaksVisible(false);
    };
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const filteredRooms = useMemo(() => {
    if (!search.trim()) return rooms;
    const q = search.toLowerCase();
    return rooms.filter(r => {
      const d = roomDisplay(r);
      return (d.title || "").toLowerCase().includes(q) ||
             (d.sub || "").toLowerCase().includes(q) ||
             (r.preview || "").toLowerCase().includes(q);
    });
  }, [rooms, search]);

  const activeRoom = rooms.find(r => r.id === activeRoomId) || rooms[0];

  const sendMessage = (roomId, text) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== roomId) return r;
      const now = new Date();
      const newMsg = {
        id: "n" + Date.now(),
        from: "me",
        text,
        time: { h: now.getHours(), m: now.getMinutes(), day: 0 },
        status: "sent",
      };
      return { ...r, messages: [...r.messages, newMsg], preview: "你: " + text.slice(0, 40), last: newMsg.time, unread: 0 };
    }));
    // simulate delivered → read
    setTimeout(() => {
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r;
        const msgs = [...r.messages];
        const idx = msgs.length - 1;
        if (idx >= 0 && msgs[idx].from === "me") msgs[idx] = { ...msgs[idx], status: "delivered" };
        return { ...r, messages: msgs };
      }));
    }, 700);
    setTimeout(() => {
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r;
        const msgs = [...r.messages];
        const idx = msgs.length - 1;
        if (idx >= 0 && msgs[idx].from === "me") msgs[idx] = { ...msgs[idx], status: "read" };
        return { ...r, messages: msgs };
      }));
    }, 1800);
  };

  const openRoom = (id) => {
    setActiveRoomId(id);
    setRooms(prev => prev.map(r => r.id === id ? { ...r, unread: 0 } : r));
  };

  const createRoom = ({ kind, members, name }) => {
    const id = "n" + Date.now();
    const newRoom = kind === "dm" ? {
      id,
      kind: "dm",
      with: members[0],
      unread: 0,
      last: { h: new Date().getHours(), m: new Date().getMinutes(), day: 0 },
      preview: "新對話已建立 · AES-256-GCM",
      messages: [],
    } : {
      id,
      kind: "group",
      name,
      subtitle: `${members.length + 1} 位成員`,
      members: ["me", ...members],
      unread: 0,
      last: { h: new Date().getHours(), m: new Date().getMinutes(), day: 0 },
      preview: "群組已建立 · 所有訊息使用端對端加密",
      topic: `${members.length + 1} 位成員`,
      messages: [],
    };
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoomId(id);
    setShowCreate(false);
  };

  // Variant rendering
  const renderDesktop = () => (
    <div style={{ display: "flex", height: "100%", background: "var(--main-bg)" }}>
      <Sidebar
        rooms={filteredRooms}
        activeRoomId={activeRoom?.id}
        onSelectRoom={openRoom}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        search={search}
        onSearch={setSearch}
        onOpenCreate={() => setShowCreate(true)}
      />
      {activeRoom ? (
        <ChatView
          room={activeRoom}
          onSend={(text) => sendMessage(activeRoom.id, text)}
          onOpenCreate={() => setShowCreate(true)}
        />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--main-text-dim)" }}>
          選擇一個對話開始
        </div>
      )}
    </div>
  );

  const renderMobile = () => (
    <div style={{
      height: "100%", width: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at center, #0B1220 0%, #000 100%)",
    }}>
      <MobileApp
        rooms={rooms}
        onSendInRoom={sendMessage}
        onCreate={() => setShowCreate(true)}
      />
    </div>
  );

  const renderBoth = () => (
    <div style={{
      height: "100%", width: "100%",
      background: "radial-gradient(ellipse at center, #0B1220 0%, #000 100%)",
      display: "flex",
      overflow: "auto",
    }}>
      <div style={{ display: "flex", gap: 40, padding: 32, margin: "auto", alignItems: "center" }}>
        <div style={{
          width: 1200, height: 780,
          borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
          flexShrink: 0,
        }}>
          {renderDesktop()}
        </div>
        <MobileApp rooms={rooms} onSendInRoom={sendMessage} onCreate={() => setShowCreate(true)} />
      </div>
    </div>
  );

  return (
    <>
      {tweaks.variant === "desktop" && renderDesktop()}
      {tweaks.variant === "mobile" && renderMobile()}
      {tweaks.variant === "both" && renderBoth()}

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={createRoom} />
      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={tweaksVisible} />
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
