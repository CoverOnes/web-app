// Tweaks panel

const ACCENT_PRESETS = {
  blue:   { accent: "#2563EB", hover: "#1D4ED8", soft: "rgba(37,99,235,0.14)"  },
  indigo: { accent: "#6366F1", hover: "#4F46E5", soft: "rgba(99,102,241,0.14)" },
  teal:   { accent: "#0D9488", hover: "#0F766E", soft: "rgba(13,148,136,0.14)" },
  violet: { accent: "#8B5CF6", hover: "#7C3AED", soft: "rgba(139,92,246,0.14)" },
};

const applyTweaks = (t) => {
  const a = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS.blue;
  document.documentElement.style.setProperty("--accent", a.accent);
  document.documentElement.style.setProperty("--accent-hover", a.hover);
  document.documentElement.style.setProperty("--accent-soft", a.soft);
  document.documentElement.dataset.panel = t.panel;
  document.documentElement.dataset.density = t.density;
};

const TweaksPanel = ({ tweaks, setTweaks, visible }) => {
  if (!visible) return null;

  const update = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    // persist to editmode block
    window.parent?.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
  };

  const row = {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 0", borderBottom: "1px solid var(--main-border)",
  };
  const label = { fontSize: 11, color: "var(--main-text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, flex: 1 };

  const Chip = ({ active, children, onClick, color }) => (
    <button onClick={onClick} style={{
      padding: "4px 10px", borderRadius: 999,
      fontSize: 12, fontWeight: 500,
      background: active ? "var(--accent-soft)" : "transparent",
      border: active ? "1px solid var(--accent)" : "1px solid var(--main-border)",
      color: active ? "var(--main-text)" : "var(--main-text-dim)",
      display: "inline-flex", alignItems: "center", gap: 6,
    }}>
      {color && <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />}
      {children}
    </button>
  );

  return (
    <div style={{
      position: "fixed", right: 16, bottom: 16,
      width: 280,
      background: "var(--main-bg-2)",
      border: "1px solid var(--main-border)",
      borderRadius: 12,
      padding: "12px 14px",
      boxShadow: "var(--shadow-pop)",
      zIndex: 200,
      fontFamily: "inherit",
      color: "var(--main-text)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
        <Icon.Paint size={14} style={{ color: "var(--accent)" }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>Tweaks</div>
      </div>

      <div style={row}>
        <span style={label}>Accent</span>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.entries(ACCENT_PRESETS).map(([k, v]) => (
            <button key={k} onClick={() => update({ accent: k })} title={k} style={{
              width: 22, height: 22, borderRadius: 6,
              background: v.accent,
              border: tweaks.accent === k ? "2px solid #fff" : "2px solid transparent",
              boxShadow: tweaks.accent === k ? `0 0 0 2px ${v.accent}` : "none",
            }} />
          ))}
        </div>
      </div>

      <div style={row}>
        <span style={label}>Panel</span>
        <Chip active={tweaks.panel === "dark"} onClick={() => update({ panel: "dark" })}><Icon.Moon size={11} />Dark</Chip>
        <Chip active={tweaks.panel === "light"} onClick={() => update({ panel: "light" })}><Icon.Sun size={11} />Light</Chip>
      </div>

      <div style={row}>
        <span style={label}>Density</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Chip active={tweaks.density === "compact"} onClick={() => update({ density: "compact" })}>Compact</Chip>
          <Chip active={tweaks.density === "comfortable"} onClick={() => update({ density: "comfortable" })}>Comfy</Chip>
          <Chip active={tweaks.density === "spacious"} onClick={() => update({ density: "spacious" })}>Spacious</Chip>
        </div>
      </div>

      <div style={{ ...row, borderBottom: "none", paddingBottom: 2 }}>
        <span style={label}>View</span>
        <Chip active={tweaks.variant === "desktop"} onClick={() => update({ variant: "desktop" })}><Icon.Monitor size={11} />Desktop</Chip>
        <Chip active={tweaks.variant === "mobile"} onClick={() => update({ variant: "mobile" })}><Icon.Smartphone size={11} />Mobile</Chip>
        <Chip active={tweaks.variant === "both"} onClick={() => update({ variant: "both" })}>Both</Chip>
      </div>
    </div>
  );
};

window.TweaksPanel = TweaksPanel;
window.applyTweaks = applyTweaks;
