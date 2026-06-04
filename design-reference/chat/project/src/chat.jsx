// Chat room view — header, messages, composer

const chatStyles = {
  root: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    background: "var(--main-bg)",
    color: "var(--main-text)",
  },
  navbar: {
    height: "var(--navbar-h)",
    borderBottom: "1px solid var(--main-border)",
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 20px",
    background: "var(--main-bg-2)",
    flexShrink: 0,
  },
  globalSearch: {
    maxWidth: 420, width: "100%",
    height: 34, borderRadius: 8,
    background: "var(--main-bg)",
    border: "1px solid var(--main-border)",
    display: "flex", alignItems: "center", gap: 8,
    padding: "0 12px",
    color: "var(--main-text-dim)", fontSize: 13,
    margin: "0 auto",
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--main-text-dim)",
    transition: "background 150ms ease-out, color 150ms ease-out",
    position: "relative",
  },
  roomHeader: {
    height: 64,
    borderBottom: "1px solid var(--main-border)",
    display: "flex", alignItems: "center", gap: 12,
    padding: "0 24px",
    flexShrink: 0,
  },
  msgScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "20px 24px 8px 24px",
  },
  daySep: {
    display: "flex", alignItems: "center", gap: 12,
    margin: "18px 0 14px 0",
    fontSize: 11, color: "var(--main-text-dim)", fontWeight: 500,
    letterSpacing: "0.02em",
  },
  daySepLine: { flex: 1, height: 1, background: "var(--main-border)" },
  composer: {
    padding: "10px 24px 18px 24px",
    borderTop: "1px solid var(--main-border)",
    flexShrink: 0,
  },
  composerBox: (focus) => ({
    background: "var(--input-bg)",
    border: `1px solid ${focus ? "var(--accent)" : "var(--main-border)"}`,
    borderRadius: 10,
    padding: "10px 12px",
    transition: "border-color 150ms ease-out, box-shadow 150ms ease-out",
    boxShadow: focus ? "0 0 0 3px var(--accent-soft)" : "none",
  }),
  textarea: {
    width: "100%", background: "transparent", color: "var(--main-text)",
    resize: "none", minHeight: 22, maxHeight: 140, fontSize: 14,
    border: "none", outline: "none", padding: 0, fontFamily: "inherit",
    lineHeight: 1.5,
  },
};

// Message status icons
const StatusDot = ({ status }) => {
  if (status === "sending") {
    return <span style={{
      width: 10, height: 10, borderRadius: 999,
      border: "1.5px solid currentColor",
      opacity: 0.5,
    }} />;
  }
  if (status === "sent") return <Icon.Check size={12} style={{ opacity: 0.6 }} />;
  if (status === "delivered") return <Icon.CheckDouble size={13} style={{ opacity: 0.6 }} />;
  if (status === "read") return <Icon.CheckDouble size={13} style={{ color: "var(--cyan)" }} />;
  return null;
};

const EncryptionBadge = ({ color = "var(--cyan)" }) => (
  <span
    title="AES-256-GCM v2 · end-to-end encrypted"
    style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 10, color, opacity: 0.7,
    }}
  >
    <Icon.LockSmall size={9} />
  </span>
);

// Hover reactions bar
const ReactionBar = ({ own, onReact }) => {
  const reactions = ["👍", "❤️", "🎉", "👀"];
  return (
    <div style={{
      position: "absolute",
      top: -14,
      [own ? "left" : "right"]: 8,
      background: "var(--main-bg-2)",
      border: "1px solid var(--main-border)",
      borderRadius: 999,
      padding: "3px 6px",
      display: "flex", gap: 2,
      boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
      opacity: 0, transform: "translateY(4px)",
      transition: "opacity 150ms ease-out, transform 150ms ease-out",
      pointerEvents: "none",
    }} className="reaction-bar">
      {reactions.map(r => (
        <button key={r} onClick={() => onReact(r)} style={{
          width: 24, height: 24, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, transition: "background 120ms",
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >{r}</button>
      ))}
      <button style={{
        width: 24, height: 24, borderRadius: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--main-text-dim)",
      }}>
        <Icon.Smile size={13} />
      </button>
    </div>
  );
};

const Attachment = ({ attach }) => {
  if (attach.kind === "image") {
    return (
      <div style={{
        marginTop: 6,
        border: "1px solid var(--main-border)",
        borderRadius: 8,
        overflow: "hidden",
        maxWidth: 320,
      }}>
        {/* Placeholder image preview */}
        <div style={{
          height: 140,
          background: `
            repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 8px, transparent 8px 16px),
            linear-gradient(135deg, rgba(37,99,235,0.25), rgba(99,102,241,0.15))
          `,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "JetBrains Mono, monospace", fontSize: 10,
        }}>
          [image preview · drop real asset here]
        </div>
        <div style={{
          padding: "8px 10px",
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(0,0,0,0.15)",
          fontSize: 12,
        }}>
          <Icon.Image size={14} style={{ color: "var(--main-text-dim)" }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attach.name}</span>
          <span style={{ color: "var(--main-text-dim)", fontSize: 11 }}>{attach.meta}</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      marginTop: 6, padding: "10px 12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid var(--main-border)",
      borderRadius: 8,
      display: "flex", alignItems: "center", gap: 10,
      maxWidth: 320,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6,
        background: "var(--accent-soft)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon.File size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attach.name}</div>
        <div style={{ fontSize: 11, color: "var(--main-text-dim)" }}>{attach.meta}</div>
      </div>
    </div>
  );
};

const MessageGroup = ({ msgs, own, from }) => {
  const p = DATA.P[from];
  const first = msgs[0];
  return (
    <div style={{
      display: "flex", gap: 12,
      flexDirection: own ? "row-reverse" : "row",
      marginBottom: 14,
      alignItems: "flex-start",
    }}>
      {!own && <Avatar person={p} size={34} />}
      {own && <div style={{ width: 34 }} />}
      <div style={{ maxWidth: "68%", minWidth: 0, display: "flex", flexDirection: "column", alignItems: own ? "flex-end" : "flex-start" }}>
        {!own && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4, paddingLeft: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--main-text)" }}>{p.zh}</span>
            <span style={{ fontSize: 11, color: "var(--main-text-dim)" }}>{p.name}</span>
            <span style={{ fontSize: 11, color: "var(--main-text-dim)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              · {formatTime(first.time)} <EncryptionBadge />
            </span>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={m.id} className="msg-hover" style={{
            position: "relative",
            marginTop: i === 0 ? 0 : 3,
            maxWidth: "100%",
          }}>
            <div style={{
              padding: "9px 13px",
              borderRadius: 12,
              background: own ? "var(--accent)" : "var(--bubble-other)",
              color: own ? "#fff" : "var(--bubble-other-text)",
              fontSize: 14, lineHeight: 1.5,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              border: own ? "none" : "1px solid var(--main-border)",
              boxShadow: own ? "0 1px 0 rgba(0,0,0,0.1) inset" : "none",
            }}>
              {m.text}
              {m.attach && <Attachment attach={m.attach} />}
            </div>
            {own && (
              <div style={{
                marginTop: 3, paddingRight: 4,
                fontSize: 10.5, color: "var(--main-text-dim)",
                display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end",
              }}>
                <EncryptionBadge />
                {formatTime(m.time)}
                <StatusDot status={m.status || "sent"} />
              </div>
            )}
            <ReactionBar own={own} onReact={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Group consecutive messages by same author, then render
const groupMessages = (msgs) => {
  const groups = [];
  let cur = null;
  for (const m of msgs) {
    if (cur && cur.from === m.from && (!cur.lastTime || (m.time.day === cur.lastTime.day))) {
      cur.msgs.push(m);
      cur.lastTime = m.time;
    } else {
      cur = { from: m.from, msgs: [m], lastTime: m.time };
      groups.push(cur);
    }
  }
  return groups;
};

const Composer = ({ onSend, roomTitle }) => {
  const [val, setVal] = useState("");
  const [focus, setFocus] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const ref = useRef(null);

  const handleSend = () => {
    const v = val.trim();
    if (!v) return;
    onSend(v);
    setVal("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(140, ref.current.scrollHeight) + "px";
    }
  }, [val]);

  return (
    <div style={chatStyles.composer}>
      {attaching && (
        <div style={{
          display: "flex", gap: 8, marginBottom: 8,
          padding: "8px 10px",
          background: "var(--input-bg)",
          border: "1px solid var(--main-border)",
          borderRadius: 8,
          fontSize: 12, alignItems: "center",
        }}>
          <Icon.Image size={14} style={{ color: "var(--accent)" }} />
          <span style={{ flex: 1 }}>screenshot-2026-04-19.png · 1.2MB</span>
          <button onClick={() => setAttaching(false)} style={{ color: "var(--main-text-dim)", display: "flex" }}>
            <Icon.X size={14} />
          </button>
        </div>
      )}
      <div style={chatStyles.composerBox(focus)}>
        <textarea
          ref={ref}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={`傳訊息到 ${roomTitle}...`}
          style={chatStyles.textarea}
          rows={1}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
          <button
            title="附件"
            onClick={() => setAttaching(true)}
            style={{
              width: 28, height: 28, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--main-text-dim)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          ><Icon.Paperclip size={16} /></button>
          <button title="圖片" style={{
            width: 28, height: 28, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--main-text-dim)",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          ><Icon.Image size={16} /></button>
          <button title="表情" style={{
            width: 28, height: 28, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--main-text-dim)",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.12)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          ><Icon.Smile size={16} /></button>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, color: "var(--main-text-dim)", fontSize: 11 }}>
            <Icon.LockSmall size={10} style={{ color: "var(--cyan)" }} />
            <span>AES-256-GCM · end-to-end encrypted</span>
          </div>

          <button
            onClick={handleSend}
            disabled={!val.trim()}
            style={{
              height: 30, padding: "0 12px",
              borderRadius: 8,
              background: val.trim() ? "var(--accent)" : "rgba(148,163,184,0.15)",
              color: val.trim() ? "#fff" : "var(--main-text-dim)",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500,
              transition: "background 150ms ease-out",
            }}
          >
            <Icon.Send size={14} />
            傳送
          </button>
        </div>
      </div>
    </div>
  );
};

const DaySeparator = ({ label }) => (
  <div style={chatStyles.daySep}>
    <div style={chatStyles.daySepLine} />
    <span style={{
      padding: "3px 10px", borderRadius: 999,
      background: "var(--main-bg-2)",
      border: "1px solid var(--main-border)",
    }}>{label}</span>
    <div style={chatStyles.daySepLine} />
  </div>
);

const TopNavbar = ({ onOpenCreate }) => {
  const me = DATA.P.me;
  return (
    <div style={chatStyles.navbar}>
      <div style={chatStyles.globalSearch}>
        <Icon.Search size={14} />
        <span>搜尋訊息、人員或檔案...</span>
        <span style={{
          marginLeft: "auto",
          fontSize: 10.5,
          padding: "1px 6px",
          borderRadius: 4,
          background: "var(--main-bg-2)",
          border: "1px solid var(--main-border)",
          color: "var(--main-text-dim)",
          fontFamily: "JetBrains Mono, monospace",
        }}>⌘K</span>
      </div>
      <button style={{ ...chatStyles.iconBtn }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--main-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <Icon.Bell size={16} />
        <span style={{
          position: "absolute", top: 7, right: 7,
          width: 7, height: 7, borderRadius: 999,
          background: "var(--red)",
          boxShadow: "0 0 0 2px var(--main-bg-2)",
        }} />
      </button>
      <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 6px 4px 4px", borderRadius: 8 }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--main-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        <Avatar person={me} size={28} showDot />
        <Icon.ChevronDown size={14} style={{ color: "var(--main-text-dim)" }} />
      </button>
    </div>
  );
};

const RoomHeader = ({ room }) => {
  const d = roomDisplay(room);
  const memberCount = room.kind === "group" ? room.members?.length : 2;
  return (
    <div style={chatStyles.roomHeader}>
      {room.kind === "dm" ? (
        <Avatar person={d.person} size={38} showDot />
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "linear-gradient(135deg, var(--accent), var(--indigo))",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
        }}>
          <Icon.Hash size={18} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          {d.title}
          <EncryptionBadge />
        </div>
        <div style={{ fontSize: 12, color: "var(--main-text-dim)", marginTop: 1, display: "flex", alignItems: "center", gap: 6 }}>
          {room.kind === "dm" && d.person.status === "online" ? (
            <>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green)" }} />
              線上 · {d.person.name}
            </>
          ) : room.kind === "group" ? (
            <>{room.topic || `${memberCount} 位成員`}</>
          ) : (
            <>{d.person.name}</>
          )}
        </div>
      </div>

      {room.kind === "group" && (
        <div style={{ display: "flex", marginLeft: 20, marginRight: "auto" }}>
          {room.members.slice(0, 5).map((id, i) => (
            <div key={id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar person={DATA.P[id]} size={26} ring />
            </div>
          ))}
          {room.members.length > 5 && (
            <div style={{
              marginLeft: -8,
              width: 26, height: 26, borderRadius: 8,
              background: "var(--main-bg)",
              border: "2px solid var(--main-bg-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 600, color: "var(--main-text-dim)",
            }}>
              +{room.members.length - 5}
            </div>
          )}
        </div>
      )}

      <div style={{ marginLeft: room.kind === "group" ? 0 : "auto", display: "flex", gap: 4 }}>
        <button style={chatStyles.iconBtn} title="語音通話"
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--main-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        ><Icon.Phone size={17} /></button>
        <button style={chatStyles.iconBtn} title="視訊通話"
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--main-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        ><Icon.Video size={17} /></button>
        <button style={chatStyles.iconBtn} title="更多"
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--main-bg)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        ><Icon.MoreH size={17} /></button>
      </div>
    </div>
  );
};

const TypingIndicator = ({ person }) => (
  <div style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-end" }}>
    <Avatar person={person} size={28} />
    <div style={{
      padding: "10px 14px", borderRadius: 12,
      background: "var(--bubble-other)",
      border: "1px solid var(--main-border)",
      display: "flex", gap: 4, alignItems: "center",
    }}>
      <span className="typing-dot" />
      <span className="typing-dot" style={{ animationDelay: "150ms" }} />
      <span className="typing-dot" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

const ChatView = ({ room, onSend, onOpenCreate }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [room.id, room.messages.length]);

  const groups = useMemo(() => groupMessages(room.messages), [room.messages]);
  const hasYesterday = room.messages.some(m => m.time.day === -1);
  const hasToday = room.messages.some(m => m.time.day === 0);

  return (
    <div style={chatStyles.root}>
      <TopNavbar onOpenCreate={onOpenCreate} />
      <RoomHeader room={room} />

      <div ref={scrollRef} style={chatStyles.msgScroll}>
        {/* Encryption notice */}
        <div style={{
          margin: "0 auto 18px auto",
          maxWidth: 480, textAlign: "center",
          padding: "10px 14px",
          borderRadius: 10,
          background: "var(--main-bg-2)",
          border: "1px solid var(--main-border)",
          fontSize: 12, color: "var(--main-text-dim)",
          display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
        }}>
          <Icon.LockSmall size={11} style={{ color: "var(--cyan)" }} />
          此對話使用 <b style={{ color: "var(--main-text)", fontWeight: 500 }}>AES-256-GCM v2</b> 端對端加密，訊息不會離開你的裝置。
        </div>

        {hasYesterday && <DaySeparator label="昨天" />}
        {groups.filter(g => g.msgs[0].time.day === -1).map((g, i) => (
          <MessageGroup key={"y"+i} msgs={g.msgs} own={g.from === "me"} from={g.from} />
        ))}
        {hasToday && hasYesterday && <DaySeparator label="今天" />}
        {!hasYesterday && hasToday && <DaySeparator label="今天" />}
        {groups.filter(g => g.msgs[0].time.day === 0).map((g, i) => (
          <MessageGroup key={"t"+i} msgs={g.msgs} own={g.from === "me"} from={g.from} />
        ))}

        {room.kind === "group" && room.messages.length > 3 && (
          <TypingIndicator person={DATA.P[room.members.find(m => m !== "me")]} />
        )}
      </div>

      <Composer onSend={onSend} roomTitle={roomDisplay(room).title} />
    </div>
  );
};

window.ChatView = ChatView;
