// ═══════════════════════════════════════════════════════════════════
//  ui.jsx — ALL UI PRIMITIVES AND THEME TOKENS
//  Pure presentational components. No game logic.
//  Exposed as window.UI for global access.
// ═══════════════════════════════════════════════════════════════════

window.UI = (() => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  THEME TOKENS (T)
  //  Colors, fonts, and other design tokens.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const T = {
    // Colors
    bg: "#0a141e",        // Dark blue-gray background
    bgDeep: "#040c18",    // Deeper background (map/sea)
    bgAlt: "#0d1620",     // Alternate background
    panel: "#121c28",     // Panel background
    panelAlt: "#0d1620",  // Alternate panel background
    border: "#2a3a4a",    // Default border
    borderFaint: "#1a2a3a",
    borderBr: "#3a4a5a",  // Brighter border (hover)
    text: "#e0e0e0",      // Primary text
    textDim: "#a0a0a0",    // Dim text
    textFaint: "#606060",
    gold: "#ffd700",      // Gold accent
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
  //  COMPONENTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Button component (FIXED: ghost variant now uses gold for visibility)
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

  // Progress bar component
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

  // Pill component (for labels, tags, etc.)
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

  // Stat block (label + value)
  const StatBlock = ({ label, value, color }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: T.textDim, fontSize: 9 }}>{label}</span>
      <span style={{ color: color || T.text, fontSize: 11, fontWeight: "bold" }}>{value}</span>
    </div>
  );

  // Section title with optional action button
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

  // Screen header with back button (FIXED: Uses visible Btn)
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

  // Log list (for captain's log, battle log, etc.)
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

  // Horizontal divider
  const Divider = ({ style = {} }) => (
    <hr style={{ border: `1px solid ${T.borderFaint}`, margin: "8px 0", ...style }} />
  );

  // Empty state (for empty mission boards, etc.)
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
    EmptyState
  };
})();