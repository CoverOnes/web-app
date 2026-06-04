// Shared avatar + helpers
const { useState, useEffect, useMemo, useRef, useCallback } = React;

const initials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Avatar = ({ person, size = 36, showDot = false, ring = false }) => {
  if (!person) return null;
  const [c1, c2] = person.color || ["#475569", "#1E293B"];
  const fontSize = Math.round(size * 0.38);
  const dotSize = Math.max(8, Math.round(size * 0.28));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size,
        borderRadius: size >= 40 ? 12 : 10,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 600, fontSize, letterSpacing: "-0.02em",
        boxShadow: ring ? `0 0 0 2px var(--sb-bg)` : "none",
      }}>
        {initials(person.name)}
      </div>
      {showDot && person.status !== "offline" && (
        <div style={{
          position: "absolute", right: -2, bottom: -2,
          width: dotSize, height: dotSize, borderRadius: 999,
          background: person.status === "online" ? "var(--green)" : "var(--amber)",
          boxShadow: person.status === "online"
            ? `0 0 0 2px var(--sb-bg), 0 0 0 3px rgba(5,150,105,0.25)`
            : `0 0 0 2px var(--sb-bg)`,
        }} />
      )}
    </div>
  );
};

const sbStyles = {
  root: {
    width: "var(--sidebar-w)",
    height: "100%",
    background: "var(--sb-bg)",
    borderRight: "1px solid var(--sb-border)",
    display: "flex",
    flexDirection: "column",
    color: "var(--sb-text)",
    flexShrink: 0,
  },
  brand: {
    padding: "14px 16px",
    display: "flex", alignItems: "center", gap: 10,
    borderBottom: "1px solid var(--sb-border)",
  },
  brandName: { fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" },
  brandSub: { fontSize: 11, color: "var(--sb-text-dim)", marginTop: 1 },
  plusBtn: {
    marginLeft: "auto",
    width: 30, height: 30, borderRadius: 8,
    background: "var(--accent)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 150ms ease-out, transform 150ms ease-out",
  },
  searchWrap: {
    padding: "12px 12px 4px 12px",
  },
  searchBox: {
    display: "flex", alignItems: "center", gap: 8,
    height: 34, padding: "0 10px",
    background: "var(--sb-tint)",
    border: "1px solid var(--sb-border)",
    borderRadius: 8,
    color: "var(--sb-text-dim)",
    transition: "border-color 150ms ease-out, background 150ms ease-out",
  },
  searchInput: {
    flex: 1, background: "transparent", color: "var(--sb-text)",
    fontSize: 13,
  },
  navWrap: { padding: "8px 8px 0 8px" },
  navItem: (active) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "7px 10px",
    borderRadius: 8,
    fontSize: 13, fontWeight: 500,
    color: active ? "var(--sb-text)" : "var(--sb-text-dim)",
    background: active ? "var(--sb-active)" : "transparent",
    transition: "background 150ms ease-out, color 150ms ease-out",
    cursor: "pointer",
    width: "100%",
  }),
  section: {
    padding: "14px 16px 6px 16px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
    color: "var(--sb-text-dim)", textTransform: "uppercase",
  },
  roomRow: (active, unread) => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 12px",
    margin: "0 8px",
    borderRadius: 10,
    cursor: "pointer",
    background: active ? "var(--sb-active)" : "transparent",
    transition: "background 150ms ease-out",
    position: "relative",
  }),
  roomBar: {
    position: "absolute", left: 0, top: 8, bottom: 8, width: 3,
    borderRadius: 2, background: "var(--accent)",
  },
  presenceList: {
    padding: "2px 8px 10px 8px",
    display: "flex", flexDirection: "column", gap: 1,
  },
  presenceItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "6px 10px", borderRadius: 8,
    fontSize: 13, color: "var(--sb-text)",
    cursor: "pointer",
    transition: "background 150ms ease-out",
  },
  footer: {
    marginTop: "auto",
    padding: "10px 12px",
    borderTop: "1px solid var(--sb-border)",
    display: "flex", alignItems: "center", gap: 10,
  },
};

const SidebarSearchInput = ({ value, onChange, placeholder = "搜尋對話..." }) => {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      ...sbStyles.searchBox,
      borderColor: focus ? "var(--accent)" : "var(--sb-border)",
      background: focus ? "var(--accent-soft)" : "var(--sb-tint)",
    }}>
      <Icon.Search size={14} />
      <input
        style={sbStyles.searchInput}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      {value && (
        <button onClick={() => onChange("")} style={{ color: "var(--sb-text-dim)", display: "flex" }}>
          <Icon.X size={14} />
        </button>
      )}
    </div>
  );
};

const NavItem = ({ icon, label, count, active, onClick }) => {
  const IconC = Icon[icon];
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...sbStyles.navItem(active),
        background: active ? "var(--sb-active)" : hover ? "var(--sb-hover)" : "transparent",
      }}
    >
      <IconC size={16} style={{ color: active ? "var(--accent)" : "currentColor" }} />
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      {count != null && (
        <span style={{
          fontSize: 11, padding: "1px 7px", borderRadius: 999,
          background: "var(--sb-tint-2)",
          color: "var(--sb-text-dim)", fontWeight: 500,
        }}>{count}</span>
      )}
    </button>
  );
};

const formatTime = (t) => {
  if (!t) return "";
  if (t.day === -1) return "昨天";
  return `${String(t.h).padStart(2,"0")}:${String(t.m).padStart(2,"0")}`;
};

const roomDisplay = (room) => {
  if (room.kind === "dm") {
    const p = DATA.P[room.with];
    return { title: p?.zh || p?.name, sub: p?.name, person: p };
  }
  return { title: room.name, sub: room.subtitle, person: null };
};

const RoomRow = ({ room, active, onClick }) => {
  const [hover, setHover] = useState(false);
  const d = roomDisplay(room);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        ...sbStyles.roomRow(active, room.unread > 0),
        background: active ? "var(--sb-active)" : hover ? "var(--sb-hover)" : "transparent",
        width: "calc(100% - 16px)",
        textAlign: "left",
      }}
    >
      {active && <div style={sbStyles.roomBar} />}
      {room.kind === "dm" ? (
        <Avatar person={d.person} size={34} showDot ring />
      ) : (
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(99,102,241,0.2))",
          border: "1px solid rgba(37,99,235,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent)", flexShrink: 0,
        }}>
          <Icon.Hash size={16} />
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontSize: 13, fontWeight: room.unread > 0 ? 600 : 500,
            color: room.unread > 0 ? "#fff" : "var(--sb-text)",
          }}>
            {d.title}
            {room.pinned && <Icon.Pin size={10} style={{ marginLeft: 4, opacity: 0.5, verticalAlign: "middle" }} />}
          </span>
          <span style={{
            fontSize: 10.5, color: "var(--sb-text-dim)",
            fontWeight: room.unread > 0 ? 600 : 400,
          }}>
            {formatTime(room.last)}
          </span>
        </div>
        <div style={{
          fontSize: 12, color: room.unread > 0 ? "var(--sb-text)" : "var(--sb-text-dim)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginTop: 2,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {room.preview}
          </span>
          {room.unread > 0 && (
            <span style={{
              fontSize: 10.5, fontWeight: 600,
              padding: "0 6px", height: 16, lineHeight: "16px",
              borderRadius: 999, background: "var(--red)", color: "#fff",
              minWidth: 16, textAlign: "center",
            }}>
              {room.unread > 99 ? "99+" : room.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const PresenceItem = ({ person, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        ...sbStyles.presenceItem,
        background: hover ? "var(--sb-hover)" : "transparent",
        width: "100%",
        textAlign: "left",
      }}>
      <Avatar person={person} size={24} showDot />
      <span style={{ flex: 1, fontSize: 12.5 }}>{person.zh}</span>
      <span style={{ fontSize: 11, color: "var(--sb-text-dim)" }}>{person.name.split(" ")[0]}</span>
    </button>
  );
};

const Sidebar = ({
  activeRoomId, onSelectRoom,
  activeNav, onSelectNav,
  rooms, search, onSearch,
  onOpenCreate,
}) => {
  const online = DATA.PEOPLE.filter(p => p.id !== "me" && p.status === "online");
  const me = DATA.P.me;

  return (
    <aside style={sbStyles.root}>
      {/* Brand */}
      <div style={sbStyles.brand}>
        <Icon.Owl size={30} />
        <div>
          <div style={sbStyles.brandName}>ChatOwl</div>
          <div style={sbStyles.brandSub}>加密即時通訊</div>
        </div>
        <button
          title="新增對話"
          onClick={onOpenCreate}
          style={sbStyles.plusBtn}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "var(--accent)"}
        >
          <Icon.Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div style={sbStyles.searchWrap}>
        <SidebarSearchInput value={search} onChange={onSearch} />
      </div>

      {/* Nav */}
      <div style={sbStyles.navWrap}>
        {DATA.NAV_ITEMS.map(n => (
          <NavItem
            key={n.id}
            icon={n.icon}
            label={n.label}
            count={n.count}
            active={activeNav === n.id}
            onClick={() => onSelectNav(n.id)}
          />
        ))}
      </div>

      {/* Rooms */}
      <div style={sbStyles.section}>
        <span>對話</span>
        <span style={{ textTransform: "none", fontSize: 11, color: "var(--sb-text-dim)" }}>{rooms.length}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: 8 }}>
        {rooms.map(r => (
          <RoomRow
            key={r.id}
            room={r}
            active={r.id === activeRoomId}
            onClick={() => onSelectRoom(r.id)}
          />
        ))}
        {rooms.length === 0 && (
          <div style={{ padding: "24px 20px", color: "var(--sb-text-dim)", fontSize: 12.5, textAlign: "center" }}>
            找不到符合「{search}」的對話
          </div>
        )}

        {/* Online presence */}
        <div style={sbStyles.section}>
          <span>在線上 ({online.length})</span>
        </div>
        <div style={sbStyles.presenceList}>
          {online.map(p => (
            <PresenceItem key={p.id} person={p} />
          ))}
        </div>
      </div>

      {/* Footer / me */}
      <div style={sbStyles.footer}>
        <Avatar person={me} size={32} showDot ring />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>你 · Alex Chen</div>
          <div style={{ fontSize: 11, color: "var(--green)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green)", boxShadow: "0 0 6px rgba(5,150,105,0.6)" }} />
            線上 · End-to-end encrypted
          </div>
        </div>
        <button style={{ color: "var(--sb-text-dim)", padding: 6, borderRadius: 6 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--sb-hover)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          <Icon.Settings size={16} />
        </button>
      </div>
    </aside>
  );
};

window.Sidebar = Sidebar;
window.Avatar = Avatar;
window.initials = initials;
window.formatTime = formatTime;
window.roomDisplay = roomDisplay;
