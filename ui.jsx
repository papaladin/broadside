// ═══════════════════════════════════════════════════════════════════
//  ui.jsx — ALL UI PRIMITIVES, THEME TOKENS, AND SHARED COMPONENTS
//  Pure presentational components. No game logic.
//  Exposed as window.UI for global access.
//  Depends on: window.D (for faction colours), window.L (for rep labels)
// ═══════════════════════════════════════════════════════════════════

window.UI = (() => {
  // ── External dependencies (loaded before this file) ────────────
  const { FACTIONS } = window.D;
  const L = window.L;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  THEME TOKENS (T)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const T = {
    // Colors
    bg: "#0a141e",
    bgDeep: "#040c18",
    bgAlt: "#0d1620",
    panel: "#121c28",
    panelAlt: "#0d1620",
    border: "#2a3a4a",
    borderFaint: "#1a2a3a",
    borderBr: "#3a4a5a",
    text: "#e0e0e0",
    textDim: "#a0a0a0",
    textFaint: "#606060",
    gold: "#ffd700",
    goldDim: "#cc9900",
    goldBr: "#ffcc33",
    green: "#4caf50",
    greenBr: "#4caf50",
    greenBg: "#081a10",
    greenDim: "#2e7d32",
    red: "#f44336",
    redBr: "#f44336",
    redBg: "#1a0808",
    redDim: "#c62828",
    blue: "#2196f3",
    blueBr: "#2196f3",
    blueBg: "#080a1a",
    blueDim: "#0d47a1",
    purple: "#9c27b0",
    purpleBr: "#9c27b0",
    purpleBg: "#10081a",
    // Risk colors
    riskColor: {
      low: "#4caf50",
      medium: "#ff9800",
      high: "#f44336"
    },
    // Fonts & layout
    font: "'Courier New', monospace",
    fontSize: 'max(10px, min(1.2vw, 13px))',
    btnMinHeight: 44,
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  STYLE HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const panelStyle = (overrides = {}) => ({
    background: T.panel,
    border: `1px solid ${T.border}`,
    borderRadius: 4,
    padding: 10,
    color: T.text,
    boxSizing: 'border-box',
    ...overrides
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  BASE COMPONENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const Btn = ({ children, onClick, disabled, v = "default", sm = false, style = {} }) => {
    const variants = {
      default: { bg: T.panel, border: T.border, color: T.text },
      gold:    { bg: T.goldDim, border: T.gold, color: "#000" },
      ghost:   { bg: T.panel, border: T.gold, color: T.gold },
      green:   { bg: T.green + "20", border: T.greenBr, color: T.greenBr },
      red:     { bg: T.red + "20", border: T.redBr, color: T.redBr }
    };
    const { bg, border, color } = variants[v] || variants.default;

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          background: bg,
          border: `1px solid ${border}`,
          color: color,
          padding: sm ? "4px 8px" : "6px 12px",
          borderRadius: 3,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: sm ? 10 : 12,
          opacity: disabled ? 0.5 : 1,
          fontFamily: T.font,
          minHeight: T.btnMinHeight,
          touchAction: 'manipulation',
          ...style
        }}
      >
        {children}
      </button>
    );
  };

  const Bar = ({ value, max, color = T.greenBr, h = 10 }) => (
    <div style={{
      width: "100%",
      height: h,
      background: T.borderFaint,
      borderRadius: h / 2,
      overflow: "hidden",
      margin: "4px 0"
    }}>
      <div style={{
        width: `${Math.min(100, (value / max) * 100)}%`,
        height: "100%",
        background: color,
        borderRadius: h / 2,
        transition: "width 0.2s"
      }} />
    </div>
  );

  const Pill = ({ label, color = T.textDim, style = {} }) => (
    <div style={{
      display: "inline-block",
      background: color + "20",
      color: color,
      padding: "2px 6px",
      borderRadius: 3,
      fontSize: 9,
      border: `1px solid ${color}`,
      margin: "2px",
      ...style
    }}>
      {label}
    </div>
  );

  const StatBlock = ({ label, value, color }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: T.textDim, fontSize: 9 }}>{label}</span>
      <span style={{ color: color || T.text, fontSize: 11, fontWeight: "bold" }}>{value}</span>
    </div>
  );

  const SectionTitle = ({ children, action }) => (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      color: T.gold,
      fontSize: 11,
      fontWeight: "bold",
      letterSpacing: "0.1em"
    }}>
      {children}
      {action}
    </div>
  );

  const ScreenHeader = ({ title, onBack }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      marginBottom: 10,
      color: T.gold,
      fontSize: 14,
      fontWeight: "bold"
    }}>
      {onBack && (
        <Btn v="gold" sm onClick={onBack} style={{ marginRight: 10 }}>
          ← Back
        </Btn>
      )}
      {title}
    </div>
  );

  const LogList = ({ entries, maxEntries = 20 }) => (
    <div style={{
      fontSize: 10,
      color: T.textDim,
      lineHeight: 1.4,
      overflowY: "auto",
      flex: 1,
      padding: "4px 0"
    }}>
      {entries.slice(-maxEntries).map((entry, i) => (
        <div key={i} style={{ marginBottom: 4 }}>{entry}</div>
      ))}
    </div>
  );

  const Divider = ({ style = {} }) => (
    <hr style={{ border: `1px solid ${T.borderFaint}`, margin: "8px 0", ...style }} />
  );

  const EmptyState = ({ message, style = {} }) => (
    <div style={{
      textAlign: "center",
      color: T.textFaint,
      fontSize: 10,
      padding: 20,
      ...style
    }}>
      {message}
    </div>
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHARED GAME COMPONENTS
  //  (moved from screens_shared.jsx)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const FactionPill = ({ faction }) => {
    const f = FACTIONS[faction];
    return <Pill label={f?.label ?? faction} color={f?.color ?? T.textDim} />;
  };

  const RepPill = ({ rep }) => {
    const color = rep >= 60 ? T.greenBr : rep >= 30 ? T.gold : T.redBr;
    return <Pill label={`${L.reputationLabel(rep)} (${rep})`} color={color} />;
  };

  const ShipSprite = ({ type, size = 40 }) => {
    const scale = size / 40;
    return (
      <svg width={size} height={size * 0.6} viewBox="0 0 40 24" style={{ display: "block" }}>
        <ellipse cx={20} cy={12} rx={16} ry={6} fill="#3a2a10" stroke={T.goldDim} strokeWidth="1" />
        <path d="M36,12 L42,10 L42,14 Z" fill="#4a3418" transform={`scale(${scale})`} />
        <ellipse cx={20} cy={12} rx={9} ry={4} fill={T.gold} opacity="0.55" />
        <circle cx={20} cy={12} r={2} fill={T.text} />
        <path d="M4,12 Q-2,9 -8,12 Q-2,15 4,12" fill="none" stroke={T.borderFaint} strokeWidth="1.5" />
      </svg>
    );
  };

  // Expose everything globally
  return {
    T,
    panelStyle,
    Btn,
    Bar,
    Pill,
    StatBlock,
    SectionTitle,
    ScreenHeader,
    LogList,
    Divider,
    EmptyState,
    FactionPill,
    RepPill,
    ShipSprite,
  };
})();