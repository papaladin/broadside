// icons.jsx — ALL SVG ICON COMPONENTS
// Extends window.UI (must be loaded after ui.jsx)




window.UI = window.UI || {};

(() => {

  const IconStar = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path d="M8 1.5l2 4.1 4.5.6-3.3 3.2.8 4.5L8 11.7 3.9 13.9l.8-4.5L1.5 6.2l4.5-.6z"
        stroke={color} strokeWidth="1.2" fill="none" strokeLinejoin="round" />
    </svg>
  );

const IconSkull = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="m12.5 17-.5-1-.5 1h1z"/>
    <path d="M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"/>
    <circle cx="15" cy="12" r="1"/>
    <circle cx="9" cy="12" r="1"/>
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

const IconFood = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23" />
    <path d="m8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59" />
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

const IconCoins = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" />
    <path d="M15 6h1v4" />
    <path d="m6.134 14.768.866-.5 2 3.464" />
    <circle cx="16" cy="8" r="6" />
  </svg>
);

const IconFruit = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M12 6.528V3a1 1 0 0 1 1-1h0" />
    <path d="M18.237 21A15 15 0 0 0 22 11a6 6 0 0 0-10-4.472A6 6 0 0 0 2 11a15.1 15.1 0 0 0 3.763 10 3 3 0 0 0 3.648.648 5.5 5.5 0 0 1 5.178 0A3 3 0 0 0 18.237 21" />
  </svg>
);

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

const IconMarket = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" />
    <path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244" />
    <path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" />
  </svg>
);

const IconMap = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
    <path d="M15 5.764v15" />
    <path d="M9 3.236v15" />
  </svg>
);

const IconFloppy = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
    <path d="M7 3v4a1 1 0 0 0 1 1h7" />
  </svg>
);

const IconJournal = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" />
    <path d="M2 6h4" />
    <path d="M2 10h4" />
    <path d="M2 14h4" />
    <path d="M2 18h4" />
    <path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
  </svg>
);

const IconAnchor = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M12 6v16" />
    <path d="m19 13 2-1a9 9 0 0 1-18 0l2 1" />
    <path d="M9 11h6" />
    <circle cx="12" cy="4" r="2" />
  </svg>
);


 const IconSwords = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
    <line x1="13" x2="19" y1="19" y2="13" />
    <line x1="16" x2="20" y1="16" y2="20" />
    <line x1="19" x2="21" y1="21" y2="19" />
    <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
    <line x1="5" x2="9" y1="14" y2="18" />
    <line x1="7" x2="4" y1="17" y2="20" />
    <line x1="3" x2="5" y1="19" y2="21" />
  </svg>
);

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

const IconWind = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
    <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
    <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
  </svg>
);

const IconParchment = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
  </svg>
);

const IconCloth = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
    <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
    <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
  </svg>
);

const IconTimber = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" />
    <path d="M12 22v-3" />
  </svg>
);

  const IconCoffee = ({ size = 14, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
         style={{ display: "inline-block", verticalAlign: "middle" }}>
      <ellipse cx="8" cy="8" rx="4" ry="6.5" transform="rotate(30 8 8)"
               stroke={color} strokeWidth="1.1" />
      <path d="M6 12 C7 9 9 7 10 4" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );

 const IconRhum = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M10 3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a6 6 0 0 0 1.2 3.6l.6.8A6 6 0 0 1 17 13v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-8a6 6 0 0 1 1.2-3.6l.6-.8A6 6 0 0 0 10 5z" />
    <path d="M17 13h-4a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h4" />
  </svg>
);
 
 
 
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
 
const IconTobacco = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M2 14 L5 11.3 C6.2 10.4 7.8 10.4 9 9.8" stroke={color} strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 9.8 C8.8 7 10.3 5.3 12.3 5.3 C14 5.3 14.6 7 13.4 8.2 C12.6 9 11 9.6 9 9.8 Z"
          stroke={color} strokeWidth="1.1" fill="none" strokeLinejoin="round" />
    <ellipse cx="11.8" cy="5.6" rx="1.7" ry="0.55" stroke={color} strokeWidth="0.9" />
    <path d="M11.5 4.4 C10.6 3.5 11.8 2.7 11 1.8" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <path d="M13 4.6 C13.9 3.6 12.6 3 13.4 1.6" stroke={color} strokeWidth="0.8" fill="none" strokeLinecap="round" />
  </svg>
);
 
const IconSilk = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M17 13.44 4.442 17.082A2 2 0 0 0 4.982 21H19a2 2 0 0 0 .558-3.921l-1.115-.32A2 2 0 0 1 17 14.837V7.66" />
    <path d="m7 10.56 12.558-3.642A2 2 0 0 0 19.018 3H5a2 2 0 0 0-.558 3.921l1.115.32A2 2 0 0 1 7 9.163v7.178" />
  </svg>
);

 
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
 
const IconGoldBag = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 16 6 6" />
    <circle cx="16" cy="9" r="2.9" />
    <circle cx="6" cy="5" r="3" />
  </svg>
);
 
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
 
  
const IconGrapple = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <g transform="rotate(135 12 12)">
      <path d="M12 6v16" />
      <path d="m19 13 2-1a9 9 0 0 1-18 0l2 1" />
      <circle cx="12" cy="4" r="1" />
      <circle cx="11.4" cy="1.4" r="1" />
      <circle cx="11.2" cy="0" r="1" />
    </g>
  </svg>
);

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

const IconCog = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCompass = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z" />
  </svg>
);

const IconPlay = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const IconCheers = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
    <path d="M9 12v6" />
    <path d="M13 12v6" />
    <path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z" />
    <path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
  </svg>
);

const IconCannon = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <circle cx="11" cy="13" r="9" />
    <path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95" />
    <path d="m22 2-1.5 1.5" />
  </svg>
);

const IconChefHat = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" />
    <path d="M6 17h12" />
  </svg>
);

const IconHammer = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <g transform="rotate(45 8 8)">
      <rect x="5" y="2" width="6" height="3" rx="0.5" stroke={color} strokeWidth="1.1" />
      <rect x="7" y="5" width="2" height="9" rx="0.5" stroke={color} strokeWidth="1.1" />
    </g>
  </svg>
);

const IconTalking = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    <path d="M8 12h.01" />
    <path d="M12 12h.01" />
    <path d="M16 12h.01" />
  </svg>
);

const IconBarChart = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <line x1="2" y1="14" x2="14" y2="14" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    <rect x="3.5" y="9" width="2.3" height="5" stroke={color} strokeWidth="1" />
    <rect x="7" y="5.5" width="2.3" height="8.5" stroke={color} strokeWidth="1" />
    <rect x="10.5" y="7.5" width="2.3" height="6.5" stroke={color} strokeWidth="1" />
  </svg>
);

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

const IconContinue = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    <path d="m9 10-5 5 5 5" />
  </svg>
);

const IconFileTransfer = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5" />
    <path d="M12 10v4h4" />
    <path d="m12 14 1.535-1.605a5 5 0 0 1 8 1.5" />
    <path d="M22 22v-4h-4" />
    <path d="m22 18-1.535 1.605a5 5 0 0 1-8-1.5" />
  </svg>
);

const IconFlame = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
  </svg>
);

const IconTarget = ({ size = 14, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
       style={{ display: "inline-block", verticalAlign: "middle" }}>
    <circle cx="8" cy="8" r="6.3" stroke={color} strokeWidth="1.1" />
    <circle cx="8" cy="8" r="4.2" stroke={color} strokeWidth="1" />
    <circle cx="8" cy="8" r="2.1" stroke={color} strokeWidth="0.9" />
    <circle cx="8" cy="8" r="0.8" fill={color} />
  </svg>
);


const IconHandshake = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="m11 17 2 2a1 1 0 1 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" />
    <path d="m21 3 1 11h-2" />
    <path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" />
    <path d="M3 4h8" />
  </svg>
);

const IconSearch = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconSparkles = ({ size = 14, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "inline-block", verticalAlign: "middle" }}
  >
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </svg>
);



//  identify wich log category will get wich icon
window.UI.LOG_ICONS = {
  arrival:   IconAnchor,
  sailing:   IconSailboat,
  crew:      IconCrew,
  combat:    IconSwords,
  trade:     IconGold,
  mission:   IconParchment,
  discovery: IconMap,
  infamy:    IconSkull,
  warning:   IconTalking,
};


  // ── Attach all icon components to window.UI ──────────────────
  Object.assign(window.UI, {
    IconStar, IconSkull, IconShield, IconHeart, IconCrew, IconFood, IconWater, IconGold,
    IconBarrel, IconCoins, IconFruit, IconPirate, IconCalendar, IconChest, IconMarket, IconMap, IconFloppy, IconJournal, IconAnchor,
    IconSwords, IconSailboat, IconWind, IconParchment, IconCloth, IconTimber, IconCoffee, IconRhum, IconSugar, IconSpice,
    IconTobacco, IconSilk, IconShip, IconGoldBag, IconCocoa, IconPerson, IconGoblet,
    IconGrapple, IconSpear, IconCog, IconCompass, IconPlay, IconCheers, IconCannon, IconChefHat, IconHammer, IconTalking,
    IconBarChart, IconDice, IconContinue, IconFileTransfer, IconFlame, IconTarget,IconHandshake, IconSparkles, IconSearch,
  });
})();