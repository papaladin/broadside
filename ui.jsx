// ui.jsx — ALL UI PRIMITIVES, THEME TOKENS, AND SHARED COMPONENTS
// Pure presentational components. No game logic.
// Exposed as window.UI for global access.
// Depends on: window.D (for faction colours), window.L (for rep labels)

window.UI = (() => {
  const { FACTIONS } = window.D;
  const L = window.L;

const T = {
    bg: "#0a1622",      // deep navy (replaces #14110d)
    bgDeep: "#060e14",  // very dark navy for shadows/gradients (replaces #0e0b08)
    bgAlt: "#0d1824",   // subtle lighter navy for separation (replaces #1a1610)
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
    narrativefontSize: 12, // body text, flavour, mission descriptions
    narrativeLineHeight: 1.55,
    metadataFontSize: 11, // costs, dates, faction labels
    captionFontSize: 10, // fine print, gossip details, small hints
    heading1FontSize: 18,    // screen titles, port name, victory/defeat text
    heading2FontSize: 16,    // section headings, encounter title, battle round
    heading3FontSize: 14,    // enemy name, active mission title, crew member name
    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
    },
};

const panelStyle = (overrides = {}) => {
  const variant = overrides.variant || "default";
  const variantStyles = {
    default: { border: `1px solid ${T.border}` },
    danger:  { border: `1px solid ${T.redBr}` },
    gold:    { border: `1px solid ${T.gold}` },
    subtle:  { border: `1px solid ${T.borderFaint}` },
  };
  const { variant: _, ...rest } = overrides;
  return {
    background: T.panel,
    borderRadius: 2,
    padding: T.spacing.md,
    color: T.text,
    boxSizing: 'border-box',
    ...variantStyles[variant],
    ...rest,
  };
};

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
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    {/* Left barrel */}
    <ellipse cx="6" cy="5" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" fill="none" />
    <line x1="2.5" y1="5" x2="2.5" y2="12" stroke={color} strokeWidth="1.1" />
    <line x1="9.5" y1="5" x2="9.5" y2="12" stroke={color} strokeWidth="1.1" />
    <ellipse cx="6" cy="12" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" fill="none" />
    {/* Right barrel (slightly offset and behind) */}
    <ellipse cx="10" cy="6" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" fill="none" opacity="0.8" />
    <line x1="6.5" y1="6" x2="6.5" y2="13" stroke={color} strokeWidth="1.1" opacity="0.8" />
    <line x1="13.5" y1="6" x2="13.5" y2="13" stroke={color} strokeWidth="1.1" opacity="0.8" />
    <ellipse cx="10" cy="13" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" fill="none" opacity="0.8" />
  </svg>
);

 const IconFood = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    {/* Handle */}
    <line x1="8" y1="2" x2="8" y2="14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    {/* Left tine */}
    <line x1="6" y1="2" x2="6" y2="6" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    {/* Centre tine */}
    <line x1="8" y1="2" x2="8" y2="7" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    {/* Right tine */}
    <line x1="10" y1="2" x2="10" y2="6" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    {/* Crossbar connecting tines */}
    <line x1="6" y1="5" x2="10" y2="5" stroke={color} strokeWidth="1.0" strokeLinecap="round" />
  </svg>
);

  const IconWater = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 2.5C8 2.5 4 7 4 10a4 4 0 108 0c0-3-4-7.5-4-7.5z"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );

const IconGold = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M 3 6 C 3 3 17 3 17 6 C 17 9 3 9 3 6 Z"
          stroke={color} strokeWidth="1.3" fill="none" />
    <path d="M 3 9 C 3 12 17 12 17 9"
          stroke={color} strokeWidth="1.3" fill="none" />
    <path d="M 3 12 C 3 15 17 15 17 12"
          stroke={color} strokeWidth="1.3" fill="none" />
    <path d="M 3 6 L 3 12 M 17 6 L 17 12"
          stroke={color} strokeWidth="1.3" fill="none" />
  </svg>
);

  // ── New icons (19) ───────────────────────────────────────────────────────

  // Barrel — redrawn from source (2 slat lines + 2 hoops replace 4 long bezier paths)
  const IconBarrel = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M3 1.5 C1 4.5 1 11.5 3 14.5 L13 14.5 C15 11.5 15 4.5 13 1.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      <path d="M6.5 1.5 C5.5 4.5 5.5 11.5 6.5 14.5" stroke={color} strokeWidth="0.8" fill="none" />
      <path d="M9.5 1.5 C10.5 4.5 10.5 11.5 9.5 14.5" stroke={color} strokeWidth="0.8" fill="none" />
      <line x1="1.5" y1="5" x2="14.5" y2="5" stroke={color} strokeWidth="1" />
      <line x1="1.5" y1="11" x2="14.5" y2="11" stroke={color} strokeWidth="1" />
    </svg>
  );

  // Coins — two stacked coin columns (replaces 11 arc paths from source)
  const IconCoins = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <ellipse cx="5" cy="4" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" />
      <line x1="1.5" y1="4" x2="1.5" y2="9.5" stroke={color} strokeWidth="1.1" />
      <line x1="8.5" y1="4" x2="8.5" y2="9.5" stroke={color} strokeWidth="1.1" />
      <ellipse cx="5" cy="9.5" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" />
      <path d="M1.5 7 C1.5 8 8.5 8 8.5 7" stroke={color} strokeWidth="0.9" fill="none" />
      <ellipse cx="11" cy="9" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" />
      <line x1="7.5" y1="9" x2="7.5" y2="13.5" stroke={color} strokeWidth="1.1" />
      <line x1="14.5" y1="9" x2="14.5" y2="13.5" stroke={color} strokeWidth="1.1" />
      <ellipse cx="11" cy="13.5" rx="3.5" ry="1.2" stroke={color} strokeWidth="1.1" />
      <path d="M7.5 11.5 C7.5 12.5 14.5 12.5 14.5 11.5" stroke={color} strokeWidth="0.9" fill="none" />
    </svg>
  );

  // Fruit / pear — simplified from source's long bezier path; stem + leaf kept
  const IconFruit = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 5.5 C4.5 5.5 2.5 7.5 2.5 10.5 C2.5 13.5 5 15.5 8 15.5 C11 15.5 13.5 13.5 13.5 10.5 C13.5 7.5 11.5 5.5 8 5.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" />
      <line x1="8" y1="5.5" x2="8" y2="2.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <path d="M8 3.5 C9 2 11.5 2 10.5 4 C9.5 4.5 8 4 8 3.5"
            stroke={color} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
    </svg>
  );

  // Pirate skull — skull with crossed bones (avoids name clash with existing IconSkull)
  const IconPirate = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M4 8.5 C4 4.5 12 4.5 12 8.5 C12 10 10.5 10.5 10.5 12 L5.5 12 C5.5 10.5 4 10 4 8.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      <circle cx="6.5" cy="8" r="0.8" stroke={color} strokeWidth="0.9" />
      <circle cx="9.5" cy="8" r="0.8" stroke={color} strokeWidth="0.9" />
      <line x1="2" y1="15.5" x2="14" y2="11.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="14" y1="15.5" x2="2" y2="11.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );

  // Calendar — redrawn; source used filled rects, this uses strokes only
  const IconCalendar = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="1.5" y="2.5" width="13" height="12" rx="0.5" stroke={color} strokeWidth="1.1" />
      <line x1="1.5" y1="6" x2="14.5" y2="6" stroke={color} strokeWidth="1" />
      <line x1="5" y1="1" x2="5" y2="4" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="11" y1="1" x2="11" y2="4" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="4" y1="9" x2="12" y2="9" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="4" y1="12" x2="9" y2="12" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );

  // Chest — 3 long filled paths in source replaced by simple rects + lines
  const IconChest = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="1.5" y="7.5" width="13" height="7" rx="0.5" stroke={color} strokeWidth="1.1" />
      <path d="M1.5 7.5 L1.5 5 C1.5 3 14.5 3 14.5 5 L14.5 7.5"
            stroke={color} strokeWidth="1.1" fill="none" />
      <line x1="1.5" y1="7.5" x2="14.5" y2="7.5" stroke={color} strokeWidth="1" />
      <rect x="6.5" y="8" width="3" height="2.5" rx="0.4" stroke={color} strokeWidth="0.9" />
      <line x1="1.5" y1="10.5" x2="14.5" y2="10.5" stroke={color} strokeWidth="0.8" />
    </svg>
  );

  // Market / shop — 2 large filled paths in source condensed to simple facade
  const IconMarket = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M1 6 L3.5 2 L12.5 2 L15 6"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="6" x2="15" y2="6" stroke={color} strokeWidth="1" />
      <rect x="1" y="6" width="14" height="9" stroke={color} strokeWidth="1.1" />
      <rect x="6.5" y="10" width="3" height="5" stroke={color} strokeWidth="0.9" />
      <rect x="2.5" y="7.5" width="2.5" height="2" stroke={color} strokeWidth="0.8" />
      <rect x="11" y="7.5" width="2.5" height="2" stroke={color} strokeWidth="0.8" />
    </svg>
  );

  // World map — long fill-rule path replaced by 3 simple polygons
  const IconMap = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <polygon points="1,2 5.5,3 5.5,14 1,13"
               stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
      <polygon points="5.5,3 10.5,2 10.5,13 5.5,14"
               stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
      <polygon points="10.5,2 15,3 15,14 10.5,13"
               stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
    </svg>
  );

  // Floppy disk — long fill-rule path redrawn with primitives
  const IconFloppy = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M2 1.5 L12 1.5 L14.5 4 L14.5 14.5 L1.5 14.5 L1.5 1.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      <rect x="3" y="8.5" width="10" height="5" stroke={color} strokeWidth="0.9" />
      <rect x="9" y="2" width="4" height="4" stroke={color} strokeWidth="0.8" />
      <rect x="9.8" y="3" width="1.5" height="1.5" stroke={color} strokeWidth="0.7" />
    </svg>
  );

  // Journal / book
  const IconJournal = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="3.5" y="2" width="10" height="13" rx="0.5" stroke={color} strokeWidth="1.1" />
      <line x1="5.5" y1="2" x2="5.5" y2="15" stroke={color} strokeWidth="1.3" />
      <line x1="7.5" y1="5.5" x2="12" y2="5.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="7.5" y1="8.5" x2="12" y2="8.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="7.5" y1="11.5" x2="10.5" y2="11.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );

  // Anchor — source paths kept but split into simple primitives
  const IconAnchor = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="8" cy="3.5" r="1.7" stroke={color} strokeWidth="1.1" />
      <line x1="8" y1="5.2" x2="8" y2="13.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="7" x2="11.5" y2="7" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3.5 12 C3 13.5 3.5 14.5 5 15 C6.5 15.5 7.5 14 8 13.5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M12.5 12 C13 13.5 12.5 14.5 11 15 C9.5 15.5 8.5 14 8 13.5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  );

  // Swords + pistol — original had two ~200-char fill paths; redrawn with lines
  const IconSwordsGun = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="1.5" y1="1.5" x2="9" y2="9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3" y1="5.5" x2="5.5" y2="3" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="14.5" y1="1.5" x2="7" y2="9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="5.5" x2="10.5" y2="3" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="3" y1="14" x2="11" y2="14" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9 14 L9 11.5 L11.5 11.5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6.5" y1="14" x2="7" y2="12.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );

  // Crossed swords — original single 300-char path redrawn with 4 lines
  const IconSwords = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="1.5" y1="1.5" x2="14.5" y2="14.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="2.5" y1="6" x2="6" y2="2.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <line x1="14.5" y1="1.5" x2="1.5" y2="14.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13.5" y1="6" x2="10" y2="2.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
    </svg>
  );

  // Sailboat — original had 3 large complex sub-paths; redrawn with lines + a quad curve
  const IconSailboat = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="8" y1="1.5" x2="8" y2="11" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M8 2 L2 11 L8 11 Z" stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
      <path d="M8 4 L8 11 L13 11 Z" stroke={color} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
      <path d="M1 11 Q2.5 14 8 14.5 Q13.5 14 15 11 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    </svg>
  );

  // Wind — source paths lightly simplified (curls redrawn as compact arcs)
  const IconWind = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M1 4.5 L9 4.5 C10.5 4.5 11.5 3.5 11 2 C10.5 1 9 1 8.5 2"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M1 8 L12.5 8 C13.5 8 14.5 7 14 5.5 C13.5 4.5 12 4 11 5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M1 11.5 L8.5 11.5 C10 11.5 11 12.5 10.5 14 C10 15 8.5 15 8 14"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  );

  // Parchment / scroll — source had 2 long fill paths + transforms; redrawn with rect + ellipses
  const IconParchment = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <rect x="3.5" y="3" width="9" height="10.5" stroke={color} strokeWidth="1.1" />
      <ellipse cx="8" cy="3" rx="4.5" ry="1.5" stroke={color} strokeWidth="1" />
      <ellipse cx="8" cy="13.5" rx="4.5" ry="1.5" stroke={color} strokeWidth="1" />
      <line x1="5.5" y1="6" x2="10.5" y2="6" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="5.5" y1="8.5" x2="10.5" y2="8.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="5.5" y1="11" x2="9" y2="11" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );

  // Cloth / fabric — source S-curves kept but simplified to 3 uniform folds
  const IconCloth = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <line x1="1.5" y1="4" x2="14.5" y2="4" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="1.5" y1="13" x2="14.5" y2="13" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M3 4 C1.5 7 4.5 10 3 13" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M8 4 C6.5 7 9.5 10 8 13" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M13 4 C11.5 7 14.5 10 13 13" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );

  // Timber / log — concentric circles (end grain) + 3 lines replace multiple long paths
  const IconTimber = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <circle cx="4.5" cy="10.5" r="4" stroke={color} strokeWidth="1.1" />
      <circle cx="4.5" cy="10.5" r="1.8" stroke={color} strokeWidth="0.9" />
      <line x1="4.5" y1="6.5" x2="14.5" y2="2" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="4.5" y1="14.5" x2="14.5" y2="10" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      <line x1="14.5" y1="2" x2="14.5" y2="10" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );

  // Coffee bean — original had matrix transforms + duplicated 200-char paths; single rotated ellipse
  const IconCoffee = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <ellipse cx="8" cy="8" rx="4" ry="6.5" transform="rotate(30 8 8)"
               stroke={color} strokeWidth="1.1" />
      <path d="M6 12 C7 9 9 7 10 4" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );

   // Rum bottle — source path simplified to cap + neck + shoulders + body
  const IconRhum = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Cap */}
      <rect x="6" y="1" width="4" height="1.5" rx="0.3" stroke={color} strokeWidth="1" />
      {/* Neck */}
      <rect x="6.5" y="2.5" width="3" height="2.5" stroke={color} strokeWidth="0.9" />
      {/* Shoulders + body */}
      <path d="M6.5 5 L4.5 7 L4.5 14.5 L11.5 14.5 L11.5 7 L9.5 5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Label lines */}
      <line x1="4.5" y1="9" x2="11.5" y2="9" stroke={color} strokeWidth="0.8" />
      <line x1="4.5" y1="11.5" x2="11.5" y2="11.5" stroke={color} strokeWidth="0.8" />
    </svg>
  );
 
  // Rum jug / demijohn — source was a 1024-viewBox trophy-vessel; redrawn as round jug
  const IconRhum2 = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Cork */}
      <rect x="6.5" y="1.5" width="3" height="1.5" rx="0.3" stroke={color} strokeWidth="0.9" />
      {/* Neck */}
      <rect x="6" y="3" width="4" height="2.5" stroke={color} strokeWidth="1" />
      {/* Round body */}
      <path d="M5 5.5 C3 5.5 2 8 2 10 C2 12.5 4 15 8 15 C12 15 14 12.5 14 10 C14 8 13 5.5 11 5.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" />
      {/* Handle */}
      <path d="M10 6 C13 6 14.5 8.5 13.5 10" stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </svg>
  );
 
  // Sugar crate — source was a 3D hex-box; redrawn as isometric cube
  const IconSugar = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Top face */}
      <polygon points="8,2 14,5 8,8 2,5"
               stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Left face */}
      <path d="M2 5 L2 11 L8 14 L8 8 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Right face */}
      <path d="M14 5 L14 11 L8 14 L8 8 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    </svg>
  );
 
  // Spice jar — source had 11+ filled circle paths; jar outline + 3 dots
  const IconSpice = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Jar body (tapers toward base) */}
      <path d="M4.5 5.5 C3 6 2.5 8 2.5 10 C2.5 12.5 4 14.5 8 14.5 C12 14.5 13.5 12.5 13.5 10 C13.5 8 13 6 11.5 5.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" />
      {/* Shoulder line */}
      <line x1="4.5" y1="5.5" x2="11.5" y2="5.5" stroke={color} strokeWidth="0.9" />
      {/* Cap */}
      <rect x="5.5" y="2" width="5" height="3.5" rx="0.5" stroke={color} strokeWidth="1" />
      {/* Holes */}
      <circle cx="6.5" cy="9.5" r="0.7" fill={color} />
      <circle cx="9.5" cy="9.5" r="0.7" fill={color} />
      <circle cx="8" cy="11.5" r="0.7" fill={color} />
    </svg>
  );
 
  // Tobacco leaf — source path simplified; diagonal leaf + stem + veins
  const IconTobacco = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Leaf body */}
      <path d="M3 14 C3 14 6.5 13 8.5 10 C10.5 7 13.5 3 14 2 C14 2 13 5 11 8 C9 11 8 13 8 14 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Midrib */}
      <line x1="3" y1="14" x2="14" y2="2" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      {/* Veins */}
      <line x1="10" y1="5" x2="8.5" y2="6.5" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
      <line x1="8.5" y1="8" x2="6.5" y2="9.5" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
      <line x1="7" y1="11" x2="5" y2="12" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
 
  // Silk bolt — source had 6 complex layered-fabric paths in 512 viewBox; bolt of cloth
  const IconSilk = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* End caps */}
      <ellipse cx="3" cy="8" rx="1.5" ry="5" stroke={color} strokeWidth="1.1" />
      <ellipse cx="13" cy="8" rx="1.5" ry="5" stroke={color} strokeWidth="1.1" />
      {/* Top + bottom edges */}
      <line x1="3" y1="3" x2="13" y2="3" stroke={color} strokeWidth="1.1" />
      <line x1="3" y1="13" x2="13" y2="13" stroke={color} strokeWidth="1.1" />
      {/* Diagonal sheen lines */}
      <line x1="5" y1="3" x2="13" y2="8" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
      <line x1="3" y1="8" x2="11" y2="13" stroke={color} strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
 
  // Ship — source paths kept but condensed; mast + two sails + hull + portholes
  const IconShip = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Mast */}
      <line x1="8" y1="1" x2="8" y2="9.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      {/* Main sail (right, triangular) */}
      <path d="M8 1.5 L14 8 L8 9.5 Z" stroke={color} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
      {/* Pennant (left) */}
      <polygon points="8,1.5 5,2.5 6,3.5 8,3.5"
               stroke={color} strokeWidth="0.8" fill="none" strokeLinejoin="round" />
      {/* Deck */}
      <path d="M4 9.5 L5 9 L11 9 L12 9.5"
            stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
      {/* Hull */}
      <path d="M1 9.5 L1 12 C1 13.5 4 14.5 8 14.5 C12 14.5 15 13.5 15 12 L15 9.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Portholes */}
      <line x1="4.5" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="7.5" y1="12" x2="8.5" y2="12" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
      <line x1="10.5" y1="12" x2="11.5" y2="12" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
 
  // Bag of gold — user proposal; drawstring bag + coin mark
  const IconGoldBag = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Bag body */}
      <path d="M8 5.5 C4 5.5 2 7.5 2 10.5 C2 13.5 4.5 15 8 15 C11.5 15 14 13.5 14 10.5 C14 7.5 12 5.5 8 5.5 Z"
            stroke={color} strokeWidth="1.1" fill="none" />
      {/* Neck pinch */}
      <line x1="6" y1="5.5" x2="10" y2="5.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Drawstring knot */}
      <path d="M6 5.5 C6 3.5 7.5 2.5 8 2 C8.5 2.5 10 3.5 10 5.5"
            stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Coin circle */}
      <circle cx="8" cy="10.5" r="2.5" stroke={color} strokeWidth="0.9" />
      {/* $ stroke */}
      <line x1="8" y1="9" x2="8" y2="12" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
 
  // Cocoa pod — user proposal; ridged oval pod (distinct from coffee bean ellipse)
  const IconCocoa = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Pod outline */}
      <ellipse cx="8" cy="8.5" rx="5" ry="6.5" stroke={color} strokeWidth="1.1" />
      {/* Vertical ridges */}
      <path d="M5 3 C4.5 5.5 4.5 11.5 5 14" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M8 2 C7.5 5 7.5 12 8 15" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M11 3 C11.5 5.5 11.5 11.5 11 14" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Stem */}
      <line x1="8" y1="2" x2="8" y2="1" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
 
  // Person silhouette — user proposal for enslaved person icon; neutral human shape
  const IconPerson = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Head */}
      <circle cx="8" cy="4" r="2.5" stroke={color} strokeWidth="1.1" />
      {/* Shoulders */}
      <line x1="4.5" y1="9" x2="11.5" y2="9" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      {/* Body */}
      <path d="M4.5 9 L4 14.5 M11.5 9 L12 14.5 M8 9 L8 14.5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <line x1="8" y1="6.5" x2="8" y2="9" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
 
  // Goblet / silver chalice — user proposal for silver icon
  const IconGoblet = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Cup bowl */}
      <path d="M4 2 L5.5 9 C5.5 11 6.5 12 8 12 C9.5 12 10.5 11 10.5 9 L12 2 Z"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Rim */}
      <line x1="4" y1="2" x2="12" y2="2" stroke={color} strokeWidth="1" strokeLinecap="round" />
      {/* Stem */}
      <line x1="8" y1="12" x2="8" y2="14.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Base */}
      <line x1="5.5" y1="14.5" x2="10.5" y2="14.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      {/* Foot taper */}
      <line x1="7" y1="12.5" x2="6" y2="14.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="9" y1="12.5" x2="10" y2="14.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
 
  // Pistol — user proposal for weapons icon; side-view flintlock/pistol
  const IconPistol = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {/* Barrel */}
      <line x1="1.5" y1="7" x2="8" y2="7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Slide / frame body */}
      <rect x="5.5" y="5.5" width="7.5" height="3" rx="0.5" stroke={color} strokeWidth="1.1" />
      {/* Grip (angled) */}
      <path d="M11 8.5 L11.5 13.5 L13.5 13.5 L13.5 8.5"
            stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
      {/* Trigger guard */}
      <path d="M7.5 8.5 C7.5 11 9 11 9 8.5"
            stroke={color} strokeWidth="0.9" fill="none" />
      {/* Trigger */}
      <line x1="8.2" y1="8.5" x2="8.4" y2="10.5" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );

  // ── Batch 3 icons (15) ───────────────────────────────────────────────────

// Crossed spears — simple weapon icon: two diagonal shafts with triangular
// heads and a small crossguard near each tip
const IconSpear = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <line x1="3" y1="14" x2="12.5" y2="2.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <polygon points="12.5,2.5 9.8,4.3 11.6,5.3" stroke={color} strokeWidth="0.8" fill="none" strokeLinejoin="round" />
    <line x1="11.2" y1="6" x2="9.4" y2="3.6" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    <line x1="13" y1="14" x2="3.5" y2="2.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <polygon points="3.5,2.5 6.2,4.3 4.4,5.3" stroke={color} strokeWidth="0.8" fill="none" strokeLinejoin="round" />
    <line x1="4.8" y1="6" x2="6.6" y2="3.6" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

// Cog — circle body + 8 rotated teeth (array map keeps it short) + center hole
const IconCog = ({ size = 14, color = "currentColor" }) => {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
    <rect key={a} x="7" y="0.4" width="2" height="2.2" rx="0.3" fill={color} transform={`rotate(${a} 8 8)`} />
  ));
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      {teeth}
      <circle cx="8" cy="8" r="4" stroke={color} strokeWidth="1.1" />
      <circle cx="8" cy="8" r="1.6" stroke={color} strokeWidth="0.9" />
    </svg>
  );
};

// Compass — outer ring, N/S needle (filled north, outline south), cardinal ticks
const IconCompass = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="6.3" stroke={color} strokeWidth="1.1" />
    <polygon points="8,3 9.3,8 8,8" fill={color} />
    <polygon points="8,13 6.7,8 8,8" stroke={color} strokeWidth="0.8" fill="none" />
    <circle cx="8" cy="8" r="0.8" fill={color} />
    <line x1="8" y1="1.3" x2="8" y2="2.3" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <line x1="8" y1="13.7" x2="8" y2="14.7" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <line x1="1.3" y1="8" x2="2.3" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" />
    <line x1="13.7" y1="8" x2="14.7" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// Play button — outline ring + filled right-pointing triangle
const IconPlay = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="6.3" stroke={color} strokeWidth="1.1" />
    <polygon points="5.8,5 5.8,11 11.2,8" fill={color} />
  </svg>
);

// Cheers — two tilted mugs with foam + handles, small "clink" sparkle between them
const IconCheers = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(-15 4 12)">
      <rect x="1.5" y="5" width="5" height="7" rx="0.6" stroke={color} strokeWidth="1" />
      <rect x="1.5" y="4" width="5" height="1.4" fill={color} />
      <path d="M6.5 6.5 C8.3 6.5 8.3 9.5 6.5 9.5" stroke={color} strokeWidth="1" fill="none" />
    </g>
    <g transform="rotate(15 12 12)">
      <rect x="9.5" y="5" width="5" height="7" rx="0.6" stroke={color} strokeWidth="1" />
      <rect x="9.5" y="4" width="5" height="1.4" fill={color} />
      <path d="M9.5 6.5 C7.7 6.5 7.7 9.5 9.5 9.5" stroke={color} strokeWidth="1" fill="none" />
    </g>
    <line x1="6.5" y1="1" x2="9.5" y2="3" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    <line x1="9.5" y1="1" x2="6.5" y2="3" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);

// Cannon — barrel + muzzle ring, trapezoid carriage, spoked wheel, fuse
const IconCannon = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="2" y="6" width="9" height="3" rx="1.4" stroke={color} strokeWidth="1.1" />
    <circle cx="11" cy="7.5" r="1.6" stroke={color} strokeWidth="1" />
    <line x1="2.5" y1="6" x2="1.5" y2="3.5" stroke={color} strokeWidth="0.9" strokeLinecap="round" />
    <path d="M5 9 L4.5 12 L8.5 12 L8 9" stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
    <circle cx="6.5" cy="13" r="2" stroke={color} strokeWidth="1" />
    <line x1="4.7" y1="13" x2="8.3" y2="13" stroke={color} strokeWidth="0.8" />
    <line x1="6.5" y1="11" x2="6.5" y2="15" stroke={color} strokeWidth="0.8" />
  </svg>
);

// Chef hat — puffy top (single wavy path) on a banded base
const IconChefHat = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M4 11 C3 9 3.2 6.5 5 5.5 C5 4 6.5 3 8 3 C9.5 3 11 4 11 5.5 C12.8 6.5 13 9 12 11 Z"
          stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    <rect x="4" y="11" width="8" height="3" rx="0.6" stroke={color} strokeWidth="1.1" />
  </svg>
);

// Hammer — head + handle drawn upright, then rotated 45° as a group
const IconHammer = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 8 8)">
      <rect x="5" y="2" width="6" height="3" rx="0.5" stroke={color} strokeWidth="1.1" />
      <rect x="7" y="5" width="2" height="9" rx="0.5" stroke={color} strokeWidth="1.1" />
    </g>
  </svg>
);

// Talking head — side-profile silhouette + 3 nested sound-wave arcs from the mouth
const IconTalking = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M5 14 C3.5 14 3 11.5 3.7 10 C3 8.5 3.3 6.5 4.5 5.3 C5.5 3.7 7.5 3 9 3.5 C9.6 3.7 9.8 4.3 9.4 4.7 C9.9 5 10 5.6 9.6 5.9 C10.1 6.3 9.9 7 9.3 7.1 C9.7 7.8 9.2 8.4 8.6 8.4 C8.8 9.5 7.9 10.2 6.9 10.1 L6.7 14 Z"
          stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    <path d="M10.5 7 Q11.5 7 11.3 6" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M10.8 8.2 Q12.8 8 12 6" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M11 9.5 Q14 9 12.8 5.5" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
  </svg>
);

// Bar chart — baseline + 3 bars of increasing/varied height
const IconBarChart = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <line x1="2" y1="14" x2="14" y2="14" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <rect x="3.5" y="9" width="2.3" height="5" stroke={color} strokeWidth="1" />
    <rect x="7" y="5.5" width="2.3" height="8.5" stroke={color} strokeWidth="1" />
    <rect x="10.5" y="7.5" width="2.3" height="6.5" stroke={color} strokeWidth="1" />
  </svg>
);

// Dice — rounded square with a 5-pip face (4 corners + center)
const IconDice = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke={color} strokeWidth="1.1" />
    <circle cx="5" cy="5" r="1" fill={color} />
    <circle cx="11" cy="5" r="1" fill={color} />
    <circle cx="8" cy="8" r="1" fill={color} />
    <circle cx="5" cy="11" r="1" fill={color} />
    <circle cx="11" cy="11" r="1" fill={color} />
  </svg>
);

// Continue/resume — "enter key" style hook arrow (right, down, then left with arrowhead)
const IconContinue = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M4 5 H12 V10 H8" stroke={color} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <polygon points="8,10 10.5,8.3 10.5,11.7" fill={color} />
  </svg>
);

// Import/export — small document + bidirectional vertical arrow (up & down heads)
const IconFileTransfer = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M1.5 1.5 H6.5 L9 4 V14.5 H1.5 Z" stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    <path d="M6.5 1.5 V4 H9" stroke={color} strokeWidth="1" fill="none" strokeLinejoin="round" />
    <line x1="3.5" y1="8" x2="7.5" y2="8" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    <line x1="3.5" y1="11" x2="7.5" y2="11" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    <line x1="12.5" y1="3" x2="12.5" y2="13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <polygon points="12.5,1.5 11,4 14,4" fill={color} />
    <polygon points="12.5,14.5 11,12 14,12" fill={color} />
  </svg>
);

// Flame — two-layer teardrop (outer body + inner core)
const IconFlame = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M8 1.5 C5 5 4 8.3 4 10.5 C4 12.9 5.8 14.5 8 14.5 C10.2 14.5 12 12.9 12 10.5 C12 8.3 11 5 8 1.5 Z"
          stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    <path d="M8 6.3 C6.8 8.2 6.3 9.6 6.3 10.8 C6.3 12.1 7 13 8 13 C9 13 9.7 12.1 9.7 10.8 C9.7 9.6 9.2 8.2 8 6.3 Z"
          stroke={color} strokeWidth="0.9" fill="none" strokeLinejoin="round" />
  </svg>
);

// Target — 3 concentric rings + filled bullseye
const IconTarget = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="6.3" stroke={color} strokeWidth="1.1" />
    <circle cx="8" cy="8" r="4.2" stroke={color} strokeWidth="1" />
    <circle cx="8" cy="8" r="2.1" stroke={color} strokeWidth="0.9" />
    <circle cx="8" cy="8" r="0.8" fill={color} />
  </svg>
);

  const Btn = ({ children, onClick, disabled, v = "default", sm = false, style = {}, className = ""  }) => {
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
      <button onClick={onClick} disabled={disabled} className={className} style={{
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

window.__pulsedButtons = window.__pulsedButtons || {};

const PulseBtn = ({ visible, children, pulseKey, ...btnProps }) => {
  const [pulse, setPulse] = React.useState(false);
  React.useEffect(() => {
    if (visible && pulseKey && !window.__pulsedButtons[pulseKey]) {
      window.__pulsedButtons[pulseKey] = true;
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1500);
      return () => clearTimeout(t);
    }
  }, [visible, pulseKey]);

  if (!visible) return null;
  return React.createElement(Btn, { ...btnProps, className: pulse ? 'btn-pulse' : '' }, children);
};

  // ── Juice hook: flashes CSS class when value changes ──────────
 const useFlashOnChange = (value, options = {}) => {
    const { direction, customClass, invert = false } = options;
    const prev = React.useRef(value);
    const [flashClass, setFlashClass] = React.useState('');

    React.useEffect(() => {
      if (prev.current !== value) {
        let cls = customClass || '';
        if (!cls) {
          if (direction === 'up') cls = invert ? 'flash-red' : 'flash-green';
          else if (direction === 'down') cls = invert ? 'flash-green' : 'flash-red';
          else if (value > prev.current) cls = invert ? 'flash-red' : 'flash-green';
          else if (value < prev.current) cls = invert ? 'flash-green' : 'flash-red';
        }
        if (cls) {
          setFlashClass(cls);
          const timer = setTimeout(() => setFlashClass(''), 600);
          prev.current = value;
          return () => clearTimeout(timer);
        }
        prev.current = value;
      }
    }, [value]);

    return flashClass;
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
      <span style={{ color: color || T.text, fontSize: T.heading3FontSize, fontWeight: "bold" }}>{value}</span>
    </div>
  );

  const SectionTitle = ({ children, action }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.borderFaint}`,
      color: T.gold, fontSize: T.heading3FontSize, fontWeight: "bold", letterSpacing: "0.08em" }}>
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
      gossip:   { border: T.gold,    titleColor: T.gold,    bg: T.bgDeep, bgStyle: { backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(180,160,120,0.06) 0%, transparent 60%),
      linear-gradient(180deg, rgba(30,24,18,0.4) 0%, transparent 30%, transparent 70%, rgba(30,24,18,0.4) 100%)`,
      },},
      danger:   { border: T.redBr,   titleColor: T.redBr,   bg: T.panel },
      crew:     { border: T.blueBr,  titleColor: T.blueBr,  bg: T.panel },
      discovery:{ border: T.greenBr, titleColor: T.greenBr, bg: T.panel },
      trade:    { border: T.gold,    titleColor: T.gold,    bg: T.panel },
    };
    const v = variants[variant] || variants.neutral;
    return (
      <div style={{
  background: v.bg,
  border: `1px solid ${v.border}`,
  borderRadius: 2,
  padding: 12,
  marginBottom: 10,
  color: T.text,
  boxSizing: 'border-box',
  ...(v.bgStyle || {}),
  ...style,
}}>
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
      React.createElement('div', { style: { color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", marginBottom: 10 } }, "📖 " + title),
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
    <div style={{ textAlign: "center", color: T.textFaint, fontSize: 11, padding: T.spacing.xl, ...style }}>{message}</div>
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

const Tooltip = ({ text, children }) => {
  const [tooltip, setTooltip] = React.useState(null);
  const triggerRef = React.useRef(null);

  const handleMouseEnter = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    // Keep within horizontal viewport
    if (left < 4) left = 4;
    if (left + tooltipWidth > window.innerWidth - 4) left = window.innerWidth - tooltipWidth - 4;
    const top = rect.top - 8; // tooltip will appear above the trigger
    setTooltip({ text, left, top });
  };

  const handleMouseLeave = () => setTooltip(null);

  return React.createElement('div', {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    style: { display: "inline-block" }
  },
    children,
    tooltip && React.createElement('div', {
      style: {
        position: "fixed",
        left: tooltip.left,
        bottom: `calc(100vh - ${tooltip.top}px)`,
        maxWidth: 280,
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 2,
        padding: "4px 8px",
        fontSize: 10,
        color: T.textDim,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        whiteSpace: "normal",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        pointerEvents: "none",
      }
    }, tooltip.text)
  );
};



  return {
    T, panelStyle, Btn, PulseBtn, Bar, Pill, StatBlock, SectionTitle, ScreenHeader,
    TutorialPopup, NarrativePanel, NarrativeLine, LogList, Divider, EmptyState,
    FactionPill, RepPill, ShipSprite, BackButton, useFlashOnChange,
    IconStar, IconSkull, IconShield, IconHeart, IconCrew, IconCrate, IconFood, IconWater, IconGold, Tooltip,
    IconBarrel, IconCoins, IconFruit,IconPirate,IconCalendar,IconChest,IconMarket,IconMap,IconFloppy,IconJournal,IconAnchor,IconSwordsGun,IconSwords,IconSailboat,IconWind,
    IconParchment,IconCloth,IconTimber,IconCoffee,IconRhum,IconRhum2,IconSugar,IconSpice,IconTobacco,IconSilk,IconShip,IconGoldBag,IconCocoa,IconPerson,IconGoblet,IconPistol,
    IconSpear,IconCog,IconCompass,IconPlay,IconCheers ,IconCannon ,IconChefHat,IconHammer ,IconTalking,IconBarChart,IconDice,IconContinue,IconFileTransfer,IconFlame,IconTarget,
  };
})();
