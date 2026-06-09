// ui.jsx — ALL UI PRIMITIVES, THEME TOKENS, AND SHARED COMPONENTS
// Pure presentational components. No game logic.
// Exposed as window.UI for global access.
// Depends on: window.D (for faction colours), window.L (for rep labels)

window.UI = (() => {
  const { FACTIONS } = window.D;
  const L = window.L;

const T = {
    bg: "#14110d",
    bgDeep: "#0e0b08",
    bgAlt: "#1a1610",
    panel: "#221d16",
    panelAlt: "#1a1510",
    border: "#5a4a32",
    borderFaint: "#3e3222",
    borderBr: "#7a6440",
    text: "#e2d6be",
    textDim: "#b0a48c",
    textFaint: "#706050",
    gold: "#c9aa6e",
    goldDim: "#96784a",
    goldBr: "#dfc080",
    green: "#6a9a5a",
    greenBr: "#7ab868",
    greenBg: "#0e1a0c",
    greenDim: "#4a7a3e",
    red: "#b85a4a",
    redBr: "#d06a58",
    redBg: "#1a0c08",
    redDim: "#8a3a2a",
    blue: "#5a8aaa",
    blueBr: "#6a9aba",
    blueBg: "#0c1420",
    blueDim: "#3a6a8a",
    purple: "#8a5a9a",
    purpleBr: "#9a6aaa",
    purpleBg: "#14081a",
    yellow: "#c8a840",
    yellowBr: "#d8b850",
    riskColor: { low: "#6a9a5a", medium: "#c8a840", high: "#b85a4a" },
    font: "Georgia, 'Times New Roman', serif",
    fontMono: "'Courier New', monospace",
    fontSize: 'max(11px, min(1.2vw, 14px))',
    btnMinHeight: 44,
    narrativeFontSize: 13,
    narrativeLineHeight: 1.55,
    metadataFontSize: 11,
    captionFontSize: 10,
};

  const panelStyle = (overrides = {}) => ({
    background: T.panel,
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    padding: 12,
    color: T.text,
    boxSizing: 'border-box',
    ...overrides
  });

  const IconStar = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.7 3.9 13.9l.8-4.5L1.5 6.2l4.5-.6z"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );

  const IconSkull = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="8" cy="7" r="5" stroke={color} strokeWidth="1.2" fill="none" />
      <circle cx="6.2" cy="6.4" r="1.1" stroke={color} strokeWidth="0.9" fill="none" />
      <circle cx="9.8" cy="6.4" r="1.1" stroke={color} strokeWidth="0.9" fill="none" />
      <path d="M6.5 10 L7.2 12 L8 10.8 L8.8 12 L9.5 10" stroke={color} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
    </svg>
  );

  const IconShield = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 1.5L3 4v4c0 3.2 2.2 5.8 5 6.5 2.8-.7 5-3.3 5-6.5V4z"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );

  const IconHeart = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 13.5C6 12 2 9 2 5.5A3 3 0 018 3.5a3 3 0 016 2c0 3.5-4 6.5-6 8z"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );

  const IconCrew = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="6" cy="5" r="2.2" stroke={color} strokeWidth="1.1" fill="none" />
      <path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke={color} strokeWidth="1.1" fill="none" />
      <circle cx="11" cy="5.5" r="1.6" stroke={color} strokeWidth="0.9" fill="none" />
      <path d="M10 13c0-1.7 1-3 2.5-3.5" stroke={color} strokeWidth="0.9" fill="none" />
    </svg>
  );

  const IconCrate = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="2.5" y="4.5" width="11" height="8" rx="0.5" stroke={color} strokeWidth="1.1" fill="none" />
      <path d="M2.5 7.5h11M8 4.5v8" stroke={color} strokeWidth="0.8" fill="none" />
    </svg>
  );

  const IconFood = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M4 3v4.5c0 1.4 1.1 2.5 2.5 2.5h.5v4M10 3v2M12 3v2M11 5v2c0 1-1 2-2 2v4"
        stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  );

  const IconWater = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 2.5C8 2.5 4 7 4 10a4 4 0 108 0c0-3-4-7.5-4-7.5z"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );

  const Btn = ({ children, onClick, disabled, v = "default", sm = false, style = {} }) => {
    const variants = {
      default: { bg: "linear-gradient(180deg, #3a3024, #2a221a)", border: T.border, color: T.text },
      gold:    { bg: "linear-gradient(180deg, #4a3926, #32271c)", border: T.gold, color: T.gold },
      ghost:   { bg: T.panel, border: T.gold, color: T.gold },
      green:   { bg: "linear-gradient(180deg, #2a3a22, #1e2a18)", border: T.greenBr, color: T.greenBr },
      red:     { bg: "linear-gradient(180deg, #3a2220, #2a1a18)", border: T.redBr, color: T.redBr },
      blue:    { bg: "linear-gradient(180deg, #243948, #1d2d38)", border: T.blueBr, color: T.blueBr },
    };
    const { bg, border, color } = variants[v] || variants.default;
    return (
      <button onClick={onClick} disabled={disabled} style={{
        background: bg, border: `1px solid ${border}`, color: color,
        padding: sm ? "4px 8px" : "8px 12px", borderRadius: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: sm ? 11 : 13, opacity: disabled ? 0.5 : 1,
        fontFamily: T.font, minHeight: T.btnMinHeight,
        touchAction: 'manipulation',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        letterSpacing: '0.2px', ...style
      }}>{children}</button>
    );
  };

  const Bar = ({ value, max, color = T.greenBr, h = 7 }) => (
    <div style={{ width: "100%", height: h, background: "#181411",
      border: `1px solid ${T.borderFaint}`, overflow: "hidden", margin: "3px 0" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`,
        height: "100%", background: color, transition: "width 0.2s" }} />
    </div>
  );

  const Pill = ({ label, color = T.textDim, style = {} }) => (
    <div style={{ display: "inline-block", background: color + "18", color: color,
      padding: "3px 7px", borderRadius: 2, fontSize: 10,
      border: `1px solid ${color}40`, margin: "2px",
      letterSpacing: '0.5px', textTransform: 'uppercase', ...style }}>
      {label}
    </div>
  );

  const StatBlock = ({ label, value, color }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: T.textDim, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
      <span style={{ color: color || T.text, fontSize: 13, fontWeight: "bold" }}>{value}</span>
    </div>
  );

  const SectionTitle = ({ children, action }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.borderFaint}`,
      color: T.gold, fontSize: 13, fontWeight: "bold", letterSpacing: "0.08em" }}>
      {children}{action}
    </div>
  );

  const ScreenHeader = ({ title, onBack }) => (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 12,
      color: T.gold, fontSize: 16, fontWeight: "bold" }}>
      {onBack && <Btn v="gold" sm onClick={onBack} style={{ marginRight: 10 }}>← Back</Btn>}
      {title}
    </div>
  );

  const NarrativePanel = ({ title, icon, variant = "neutral", children, style = {} }) => {
    const variants = {
      neutral:  { border: T.border,  titleColor: T.gold,    bg: T.panel },
      gossip:   { border: T.gold,    titleColor: T.gold,    bg: T.bgDeep },
      danger:   { border: T.redBr,   titleColor: T.redBr,   bg: T.panel },
      crew:     { border: T.blueBr,  titleColor: T.blueBr,  bg: T.panel },
      discovery:{ border: T.greenBr, titleColor: T.greenBr, bg: T.panel },
      trade:    { border: T.gold,    titleColor: T.gold,    bg: T.panel },
    };
    const v = variants[variant] || variants.neutral;
    return (
      <div style={{ background: v.bg, border: `1px solid ${v.border}`,
        borderRadius: 2, padding: 12, marginBottom: 10, color: T.text, boxSizing: 'border-box', ...style }}>
        {title && <div style={{ color: v.titleColor, fontSize: 12, fontWeight: 'bold',
          letterSpacing: '0.08em', marginBottom: 8 }}>
          {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{title}
        </div>}
        {children}
      </div>
    );
  };

  const NarrativeLine = ({ children, style = {} }) => (
    <p style={{ color: T.textDim, fontSize: T.narrativeFontSize,
      lineHeight: T.narrativeLineHeight, margin: '0 0 6px 0',
      fontStyle: 'italic', ...style }}>{children}</p>
  );

  const TutorialPopup = ({ title, children, onDismiss }) => {
    const [dontShowAgain, setDontShowAgain] = React.useState(false);
    return React.createElement('div', {
      style: { position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center" }
    }, React.createElement('div', {
      style: { ...panelStyle({ maxWidth: 460, width: "90%" }), borderColor: T.gold }
    },
      React.createElement('div', { style: { color: T.gold, fontSize: 15, fontWeight: "bold", marginBottom: 10 } }, "📖 " + title),
      React.createElement('div', { style: { color: T.text, fontSize: 12, lineHeight: 1.6, marginBottom: 16 } }, children),
      React.createElement('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
        React.createElement('label', { style: { color: T.textDim, fontSize: 11, cursor: "pointer" } },
          React.createElement('input', { type: "checkbox", checked: dontShowAgain,
            onChange: e => setDontShowAgain(e.target.checked), style: { marginRight: 6 } }),
          "Don't show tutorial hints again"
        ),
        React.createElement(Btn, { v: "gold", onClick: () => onDismiss(dontShowAgain) }, "Got it!")
      )
    ));
  };

  const LogList = ({ entries, maxEntries = 20 }) => {
    let lastDay = null;
    return (
      <div style={{ fontSize: T.narrativeFontSize, color: T.textDim,
        lineHeight: T.narrativeLineHeight, overflowY: "auto", flex: 1, padding: "4px 0" }}>
        {entries.slice(-maxEntries).map((entry, i) => {
          const dayMatch = entry && entry.match(/^\[(\d+)\]\s*(.*)/);
          const day = dayMatch ? parseInt(dayMatch[1], 10) : null;
          const text = dayMatch ? dayMatch[2] : entry;
          const showDay = day !== null && day !== lastDay;
          if (day !== null) lastDay = day;
          const startsWithEmoji = text && /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/u.test(text.trim());
          const category = startsWithEmoji ? { icon: null } : window.L.classifyLogLine(text);
          return (
            <div key={i} style={{ marginBottom: 6, display: "flex", alignItems: "baseline" }}>
              <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "baseline" }}>
                {category.icon && <span style={{ flexShrink: 0, fontSize: T.narrativeFontSize }}>{category.icon}</span>}
                <span>{text}</span>
              </div>
              {showDay && <span style={{ flexShrink: 0, marginLeft: 8, fontSize: T.captionFontSize, color: T.textFaint }}>Day {day}</span>}
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
    <div style={{ textAlign: "center", color: T.textFaint, fontSize: 11, padding: 20, ...style }}>{message}</div>
  );

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

  return {
    T, panelStyle, Btn, Bar, Pill, StatBlock, SectionTitle, ScreenHeader,
    TutorialPopup, NarrativePanel, NarrativeLine, LogList, Divider, EmptyState,
    FactionPill, RepPill, ShipSprite, BackButton,
    IconStar, IconSkull, IconShield, IconHeart, IconCrew, IconCrate, IconFood, IconWater,
  };
})();