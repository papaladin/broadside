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

 
const T = {
    // ── Page background (stays dark blue) ────────────────────
    bg: "#0a141e",           // unchanged — dark navy
    bgDeep: "#040c18",      // unchanged — deepest blue
    bgAlt: "#0d1620",       // unchanged — slightly lighter blue


    // ── Panels (slightly lighter brown — more visible) ───────
    panel: "#1c1610",        // was #161210 — lifted slightly, warmer
    panelAlt: "#141008",     // was #100c08 — lifted slightly

    
  
    // ── Borders (THIS IS THE KEY CHANGE — much brighter gold) 
    border: "#6b5530",       // was #302010 — visible gold-brown frame
    borderFaint: "#4a3820",  // was #2a1a08 — still subtle but present
    borderBr: "#8a6a3a",     // was #5a4020 — bright gold for emphasis/hover


    // ── Text (keep your current warm parchment) ──────────────
    text: "#dcd0b8",
    textDim: "#a09080",      // was #a0a0a0 — warm it slightly to match
    textFaint: "#706050",    // was #606060 — warm it slightly


    // ── Accents (unchanged) ──────────────────────────────────
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

    // Risk colors (unchanged)
    riskColor: {
      low: "#4caf50",
      medium: "#ff9800",
      high: "#f44336"
    },

    // Fonts & layout (unchanged)
    font: "'Courier New', monospace",
    fontSize: 'max(10px, min(1.2vw, 13px))',
    btnMinHeight: 44,
    narrativeFontSize: 11,
    narrativeLineHeight: 1.6,
    metadataFontSize: 10,
    captionFontSize: 9,
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

  // ── Narrative panel component ──────────────────────────────────
const NarrativePanel = ({ title, icon, variant = "neutral", children, style = {} }) => {
  const variants = {
    neutral:  { border: T.border,     titleColor: T.gold,   bg: T.panel },
    gossip:   { border: T.gold,       titleColor: T.gold,   bg: T.bgDeep },
    danger:   { border: T.redBr,      titleColor: T.redBr,  bg: T.panel },
    crew:     { border: T.blueBr,     titleColor: T.blueBr, bg: T.panel },
    discovery:{ border: T.greenBr,    titleColor: T.greenBr,bg: T.panel },
    trade:    { border: T.gold,       titleColor: T.gold,   bg: T.panel },
  };
  const v = variants[variant] || variants.neutral;

  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 4,
      padding: 10,
      marginBottom: 10,
      color: T.text,
      boxSizing: 'border-box',
      ...style,
    }}>
      {title && (
        <div style={{
          color: v.titleColor,
          fontSize: 11,
          fontWeight: 'bold',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

const NarrativeLine = ({ children, style = {} }) => (
  <p style={{
    color: T.textDim,
    fontSize: T.narrativeFontSize,
    lineHeight: T.narrativeLineHeight,
    margin: '0 0 6px 0',
    fontStyle: 'italic',
    ...style,
  }}>
    {children}
  </p>
);

// tutorial 

const TutorialPopup = ({ title, children, onDismiss }) => {
  const [dontShowAgain, setDontShowAgain] = React.useState(false);
  const { T } = window.UI; // re-use the theme from within the module

  return React.createElement('div', {
    style: {
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }
  }, React.createElement('div', {
    style: {
      ...panelStyle({ maxWidth: 460, width: "90%" }),
      borderColor: T.gold,
    }
  },
    React.createElement('div', { style: { color: T.gold, fontSize: 14, fontWeight: "bold", marginBottom: 10 } }, `📖 ${title}`),
    React.createElement('div', { style: { color: T.text, fontSize: 11, lineHeight: 1.6, marginBottom: 16 } }, children),
    React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
      React.createElement('label', { style: { color: T.textDim, fontSize: 10, cursor: "pointer" } },
        React.createElement('input', {
          type: "checkbox",
          checked: dontShowAgain,
          onChange: e => setDontShowAgain(e.target.checked),
          style: { marginRight: 6 }
        }),
        "Don't show tutorial hints again"
      ),
      React.createElement(Btn, { v: "gold", onClick: () => onDismiss(dontShowAgain) }, "Got it!")
    )
  ));
};

// LOGS
const LogList = ({ entries, maxEntries = 20 }) => {
  let lastDay = null;

  return (
    <div style={{
      fontSize: T.narrativeFontSize,
      color: T.textDim,
      lineHeight: T.narrativeLineHeight,
      overflowY: "auto",
      flex: 1,
      padding: "4px 0"
    }}>
      {entries.slice(-maxEntries).map((entry, i) => {
        // Parse day prefix: "[N] message"
        const dayMatch = entry && entry.match(/^\[(\d+)\]\s*(.*)/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : null;
        const text = dayMatch ? dayMatch[2] : entry;
        const showDay = day !== null && day !== lastDay;
        if (day !== null) lastDay = day;

        // Emoji check on the message text (not the prefix)
        const startsWithEmoji = text && /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/u.test(text.trim());
        const category = startsWithEmoji ? { icon: null } : window.L.classifyLogLine(text);

        return (
          <div key={i} style={{ marginBottom: 6, display: "flex", alignItems: "baseline" }}>
            <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "baseline" }}>
              {category.icon && (
                <span style={{ flexShrink: 0, fontSize: T.narrativeFontSize }}>
                  {category.icon}
                </span>
              )}
              <span>{text}</span>
            </div>
            {showDay && (
              <span style={{
                flexShrink: 0,
                marginLeft: 8,
                fontSize: T.captionFontSize,
                color: T.textFaint,
              }}>
                Day {day}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

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

  const BackButton = ({ dispatch, screen = "port", label = "← Back to Port" }) => (
  React.createElement(Btn, {
    v: "ghost",
    onClick: () => dispatch({ type: window.E.A.NAVIGATE, screen }),
    style: { alignSelf: "flex-start", marginBottom: 10 }
  }, label)
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
    TutorialPopup,
    NarrativePanel,
    NarrativeLine,
    LogList,
    Divider,
    EmptyState,
    FactionPill,
    RepPill,
    ShipSprite,
    BackButton,
  };
})();