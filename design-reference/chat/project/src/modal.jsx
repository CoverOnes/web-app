// Create Room modal — Direct / Group tabs

const modalStyles = {
  backdrop: {
    position: "fixed", inset: 0,
    background: "rgba(3,7,18,0.65)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100,
    animation: "fadeIn 180ms ease-out",
  },
  modal: {
    width: 480, maxWidth: "calc(100vw - 32px)",
    maxHeight: "80vh",
    background: "var(--main-bg-2)",
    border: "1px solid var(--main-border)",
    borderRadius: 14,
    boxShadow: "var(--shadow-modal)",
    display: "flex", flexDirection: "column",
    overflow: "hidden",
    animation: "popIn 200ms cubic-bezier(0.2, 0.9, 0.3, 1.2)",
    color: "var(--main-text)",
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid var(--main-border)",
    display: "flex", alignItems: "center", gap: 12,
  },
  title: { fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" },
  sub: { fontSize: 12, color: "var(--main-text-dim)", marginTop: 2 },
  tabs: {
    display: "flex", gap: 0, padding: "0 20px",
    borderBottom: "1px solid var(--main-border)",
  },
  tab: (active) => ({
    padding: "12px 4px", margin: "0 14px 0 0",
    fontSize: 13, fontWeight: 500,
    color: active ? "var(--main-text)" : "var(--main-text-dim)",
    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
    marginBottom: -1,
    display: "inline-flex", alignItems: "center", gap: 6,
    transition: "color 150ms ease-out",
  }),
  body: { padding: 16, overflowY: "auto", flex: 1, minHeight: 0 },
  search: {
    display: "flex", alignItems: "center", gap: 8,
    height: 36, padding: "0 10px",
    background: "var(--input-bg)",
    border: "1px solid var(--main-border)",
    borderRadius: 8,
    marginBottom: 12,
  },
  contactRow: (selected, hover) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "8px 10px", borderRadius: 8,
    background: hover ? "rgba(148,163,184,0.08)" : selected ? "var(--accent-soft)" : "transparent",
    border: selected ? "1px solid var(--accent)" : "1px solid transparent",
    cursor: "pointer",
    transition: "background 120ms ease-out",
  }),
  footer: {
    padding: "12px 20px",
    borderTop: "1px solid var(--main-border)",
    display: "flex", alignItems: "center", gap: 10,
  },
  input: {
    width: "100%",
    height: 38, padding: "0 12px",
    background: "var(--input-bg)",
    border: "1px solid var(--main-border)",
    borderRadius: 8,
    fontSize: 14, color: "var(--main-text)",
    transition: "border-color 150ms, box-shadow 150ms",
  },
};

const ContactRow = ({ person, selected, onToggle, multi }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onToggle}
      style={{ ...modalStyles.contactRow(selected, hover), width: "100%", textAlign: "left" }}
    >
      <Avatar person={person} size={36} showDot />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          {person.zh}
          <span style={{ color: "var(--main-text-dim)", fontWeight: 400, fontSize: 12 }}>· {person.name}</span>
        </div>
        <div style={{ fontSize: 11.5, color: person.status === "online" ? "var(--green)" : "var(--main-text-dim)" }}>
          {person.status === "online" ? "線上" : person.status === "away" ? "離開" : "離線"}
        </div>
      </div>
      {multi ? (
        <div style={{
          width: 18, height: 18, borderRadius: 5,
          border: selected ? "none" : "1.5px solid rgba(148,163,184,0.5)",
          background: selected ? "var(--accent)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff",
        }}>
          {selected && <Icon.Check size={12} />}
        </div>
      ) : selected ? (
        <Icon.Check size={16} style={{ color: "var(--accent)" }} />
      ) : null}
    </button>
  );
};

const CreateModal = ({ open, onClose, onCreate }) => {
  const [tab, setTab] = useState("dm");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (open) {
      setTab("dm"); setQ(""); setSelected([]); setGroupName("");
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const people = DATA.PEOPLE.filter(p => p.id !== "me" &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.zh.includes(q)));

  const toggle = (id) => {
    if (tab === "dm") setSelected([id]);
    else setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const canCreate = tab === "dm"
    ? selected.length === 1
    : selected.length >= 1 && groupName.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate({
      kind: tab === "dm" ? "dm" : "group",
      members: selected,
      name: groupName.trim(),
    });
  };

  return (
    <div style={modalStyles.backdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--accent-soft)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon.Plus size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={modalStyles.title}>新增對話</div>
            <div style={modalStyles.sub}>所有新對話預設啟用端對端加密</div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--main-text-dim)",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.1)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          ><Icon.X size={16} /></button>
        </div>

        <div style={modalStyles.tabs}>
          <button style={modalStyles.tab(tab === "dm")} onClick={() => { setTab("dm"); setSelected([]); }}>
            <Icon.MessageSquare size={14} /> 私訊
          </button>
          <button style={modalStyles.tab(tab === "group")} onClick={() => { setTab("group"); setSelected([]); }}>
            <Icon.UserGroup size={14} /> 群組
          </button>
        </div>

        <div style={modalStyles.body}>
          {tab === "group" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "var(--main-text-dim)", fontWeight: 500, letterSpacing: "0.02em", textTransform: "uppercase" }}>群組名稱</label>
              <input
                autoFocus
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="例如：產品發布小組"
                style={{ ...modalStyles.input, marginTop: 6 }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-soft)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--main-border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              {selected.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selected.map(id => {
                    const p = DATA.P[id];
                    return (
                      <span key={id} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "3px 4px 3px 3px", borderRadius: 999,
                        background: "var(--accent-soft)",
                        border: "1px solid var(--accent)",
                        fontSize: 12, color: "var(--main-text)",
                      }}>
                        <Avatar person={p} size={18} />
                        {p.zh}
                        <button onClick={() => toggle(id)} style={{ color: "var(--main-text-dim)", display: "flex", padding: 2 }}>
                          <Icon.X size={11} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={modalStyles.search}>
            <Icon.Search size={14} style={{ color: "var(--main-text-dim)" }} />
            <input
              autoFocus={tab === "dm"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋聯絡人..."
              style={{ flex: 1, background: "transparent", fontSize: 13, color: "var(--main-text)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {people.map(p => (
              <ContactRow
                key={p.id}
                person={p}
                multi={tab === "group"}
                selected={selected.includes(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
            {people.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "var(--main-text-dim)", fontSize: 13 }}>
                找不到「{q}」
              </div>
            )}
          </div>
        </div>

        <div style={modalStyles.footer}>
          <div style={{ fontSize: 11.5, color: "var(--main-text-dim)", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon.LockSmall size={10} style={{ color: "var(--cyan)" }} />
            AES-256-GCM · end-to-end encrypted
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{
              height: 34, padding: "0 14px", borderRadius: 8,
              background: "transparent", color: "var(--main-text-dim)",
              fontSize: 13, fontWeight: 500,
              border: "1px solid var(--main-border)",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,163,184,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >取消</button>
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              style={{
                height: 34, padding: "0 16px", borderRadius: 8,
                background: canCreate ? "var(--accent)" : "rgba(148,163,184,0.2)",
                color: canCreate ? "#fff" : "var(--main-text-dim)",
                fontSize: 13, fontWeight: 500,
                transition: "background 150ms",
              }}
            >建立{tab === "group" ? "群組" : "私訊"}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CreateModal = CreateModal;
