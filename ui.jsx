// ui.jsx — ALL UI PRIMITIVES, THEME TOKENS, AND SHARED COMPONENTS
// Pure presentational components. No game logic.
// Exposed as window.UI for global access.
// Depends on: window.D (for faction colours), window.L (for rep labels)

window.UI = window.UI || {};

(() => {
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
    narrativeLineHeight: 1.55,
    captionFontSize: 10, // fine print, gossip details, small hints
    metadataFontSize: 11, // costs, dates, faction labels
    narrativefontSize: 12, // body text, flavour, mission descriptions
    heading3FontSize: 14,    // enemy name, active mission title, crew member name
    heading2FontSize: 16,    // section headings, encounter title, battle round
    heading1FontSize: 18,    // screen titles, port name, victory/defeat text
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
    default: { border: `1px solid ${T.borderBr}` },
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
    //filter: "url(#rough-l2)", 
    ...variantStyles[variant],
    ...rest,
  };
};

const Btn = ({ children, onClick, disabled, v = "default", sm = false, style = {}, className = "", glowColor, ...rest }) => {
  const variants = {
    default: { bg: "linear-gradient(180deg, #3a3024, #2a221a)", border: T.border, color: T.text },
    gold:    { bg: "linear-gradient(180deg, #4a3926, #32271c)", border: T.gold, color: T.gold },
    ghost:   { bg: T.panel, border: T.gold, color: T.gold },
    green:   { bg: "linear-gradient(180deg, #2a3a22, #1e2a18)", border: T.greenBr, color: T.greenBr },
    red:     { bg: "linear-gradient(180deg, #3a2220, #2a1a18)", border: T.redBr, color: T.redBr },
    blue:    { bg: "linear-gradient(180deg, #243948, #1d2d38)", border: T.blueBr, color: T.blueBr },
  };
  const { bg, border, color } = variants[v] || variants.default;
  const glow = glowColor || T.gold;

  // ── Rough border (single‑stroke, like Pill) ──────────────────────
  const [dims, setDims] = React.useState({ w: 0, h: 0 });
  const ref = React.useRef(null);
  const jitter = React.useRef(null);
  if (!jitter.current) {
    jitter.current = Array.from({ length: 8 }, () => (Math.random() - 0.5) * 2.2);
  }
  const j = (i) => jitter.current[i];

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setDims({ w: el.offsetWidth, h: el.offsetHeight });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { w, h } = dims;
  const path = w > 0 && h > 0 ? [
    `M ${j(0)} ${j(1)}`,
    `L ${w + j(2)} ${j(3)}`,
    `L ${w + j(4)} ${h + j(5)}`,
    `L ${j(6)} ${h + j(7)}`,
    `Z`
  ].join(' ') : '';

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={`${className} btn-hover-glow btn-click-pulse`}
      style={{
        position: "relative",
        background: bg,
        border: "none",               // CSS border removed – SVG does the job
        color: color,
        padding: sm ? "4px 8px" : "8px 12px",
        borderRadius: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: sm ? 11 : 13,
        opacity: disabled ? 0.5 : 1,
        fontFamily: T.font,
        minHeight: T.btnMinHeight,
        touchAction: "manipulation",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        letterSpacing: "0.2px",
        "--btn-glow": `rgba(${parseInt(glow.slice(1,3),16)}, ${parseInt(glow.slice(3,5),16)}, ${parseInt(glow.slice(5,7),16)}, 0.4)`,
        ...style,
      }}
      {...rest}
    >
      {path && (
        <svg
          style={{
            position: "absolute",
            top: -2, left: -2,
            width: w + 4, height: h + 4,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <g transform="translate(2, 2)">
            <path d={path} fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </button>
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

// Line-Edged Pill (Square, All-Side Borders Matching Text Color)
const Pill = ({ label, color = T.textDim, style = {} }) => {
  const { useState, useRef, useLayoutEffect } = React;
  const jitter = useRef(null);
  if (!jitter.current) {
    // 8 values: 4 corners × 2 coords, each offset within ±3px (range 0..6 after scaling)
    jitter.current = Array.from({ length: 8 }, () => (Math.random() - 0.5) * 3);
  }
  const j = (i) => jitter.current[i];
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const ref = useRef(null);
  const rafRef = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDims({ w: el.offsetWidth, h: el.offsetHeight });
      });
    });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, []);

  const { w, h } = dims;
  let path = "";
  if (w > 0 && h > 0) {
    // Corner offsets — subtle, at most ±1.5px from true corner
    const tl = { x: j(0) * 0.5, y: j(1) * 0.5 };
    const tr = { x: w + j(2) * 0.5, y: j(3) * 0.5 };
    const br = { x: w + j(4) * 0.5, y: h + j(5) * 0.5 };
    const bl = { x: j(6) * 0.5, y: h + j(7) * 0.5 };

    // Midpoints — barely deviated, used only to smooth the curve
    const top1  = { x: w * 0.35 + j(0) * 0.2, y: j(1) * 0.2 };
    const top2  = { x: w * 0.65 + j(2) * 0.2, y: j(3) * 0.2 };
    const right1 = { x: w + j(2) * 0.2, y: h * 0.35 + j(3) * 0.2 };
    const right2 = { x: w + j(4) * 0.2, y: h * 0.65 + j(5) * 0.2 };
    const bottom1 = { x: w * 0.65 + j(4) * 0.2, y: h + j(5) * 0.2 };
    const bottom2 = { x: w * 0.35 + j(6) * 0.2, y: h + j(7) * 0.2 };
    const left1 = { x: j(6) * 0.2, y: h * 0.65 + j(7) * 0.2 };
    const left2 = { x: j(0) * 0.2, y: h * 0.35 + j(1) * 0.2 };

    path = [
      `M ${tl.x} ${tl.y}`,
      `C ${top1.x} ${top1.y} ${top2.x} ${top2.y} ${tr.x} ${tr.y}`,
      `C ${right1.x} ${right1.y} ${right2.x} ${right2.y} ${br.x} ${br.y}`,
      `C ${bottom1.x} ${bottom1.y} ${bottom2.x} ${bottom2.y} ${bl.x} ${bl.y}`,
      `C ${left1.x} ${left1.y} ${left2.x} ${left2.y} ${tl.x} ${tl.y}`,
      `Z`,
    ].join(" ");
  }

  return (
    <div ref={ref} style={{
      position: "relative",
      display: "inline-block",
      background: T.panelAlt,
      color: color,
      padding: "4px 8px",
      fontSize: T.metadataFontSize,
      margin: "2px",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      ...style,
    }}>
      {path && (
        <svg style={{
          position: "absolute",
          top: 0, left: 0,
          width: w, height: h,
          overflow: "visible", pointerEvents: "none",
          zIndex: 0,
        }}>
          <path d={path} fill="none" stroke={color}
            strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </div>
  );
};

const Panel = ({
  children,
  color,
  variant,          // "default" | "danger" | "gold" | "subtle"
  padding,
  style = {},
  className = "",
  ...rest            // ← forwards onClick, onMouseEnter, etc.
}) => {
  const { useState, useRef, useLayoutEffect } = React;

  // Resolve border color from variant (same logic as panelStyle)
  const borderColor = color || {
    danger: T.redBr, gold: T.gold, subtle: T.borderFaint,
  }[variant] || T.border;

  // Two independent jitter arrays for double‑stroke effect
  const jitter1 = useRef(null);
  const jitter2 = useRef(null);
  if (!jitter1.current) {
    jitter1.current = Array.from({ length: 16 }, () => (Math.random() - 0.5) * 10);
    jitter2.current = Array.from({ length: 16 }, () => (Math.random() - 0.5) * 10);
  }
  const j1 = (i) => jitter1.current[i];
  const j2 = (i) => jitter2.current[i];

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDims({ w: el.offsetWidth, h: el.offsetHeight });
      });
    });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, []);

  const { w, h } = dims;

  // Build a smooth cubic‑Bézier path with gentle corner offsets and mid‑side control points.
  const buildPath = (w, h, j) => {
    if (w <= 0 || h <= 0) return "";
    const tl = { x: j(0) * 0.4,  y: j(1) * 0.4 };
    const tr = { x: w + j(2) * 0.4, y: j(3) * 0.4 };
    const br = { x: w + j(4) * 0.4, y: h + j(5) * 0.4 };
    const bl = { x: j(6) * 0.4,     y: h + j(7) * 0.4 };

    const top1  = { x: w * 0.35 + j(8) * 0.25,  y: j(9) * 0.25 };
    const top2  = { x: w * 0.65 + j(10) * 0.25, y: j(11) * 0.25 };
    const right1 = { x: w + j(10) * 0.25,        y: h * 0.35 + j(9) * 0.25 };
    const right2 = { x: w + j(12) * 0.25,        y: h * 0.65 + j(13) * 0.25 };
    const bottom1 = { x: w * 0.65 + j(12) * 0.25, y: h + j(13) * 0.25 };
    const bottom2 = { x: w * 0.35 + j(14) * 0.25, y: h + j(15) * 0.25 };
    const left1 = { x: j(14) * 0.25,              y: h * 0.65 + j(15) * 0.25 };
    const left2 = { x: j(8) * 0.25,               y: h * 0.35 + j(9) * 0.25 };

    return [
      `M ${tl.x} ${tl.y}`,
      `C ${top1.x} ${top1.y} ${top2.x} ${top2.y} ${tr.x} ${tr.y}`,
      `C ${right1.x} ${right1.y} ${right2.x} ${right2.y} ${br.x} ${br.y}`,
      `C ${bottom1.x} ${bottom1.y} ${bottom2.x} ${bottom2.y} ${bl.x} ${bl.y}`,
      `C ${left1.x} ${left1.y} ${left2.x} ${left2.y} ${tl.x} ${tl.y}`,
      `Z`,
    ].join(" ");
  };

  const path1 = buildPath(w, h, j1);
  const path2 = buildPath(w, h, j2);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        background: T.panel,
        padding: padding ?? T.spacing.md,
        color: T.text,
        boxSizing: "border-box",
        ...style,
      }}
      {...rest}   // ← onClick, onMouseEnter, etc. forwarded here
    >
      {(path1 || path2) && (
        <svg
          style={{
            position: "absolute",
            top: -2,
            left: -2,
            width: w + 4,
            height: h + 4,
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <g transform="translate(2, 2)">
            {path1 && (
              <path
                d={path1}
                fill="none"
                stroke={borderColor}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="1"
              />
            )}
            {path2 && (
              <path
                d={path2}
                fill="none"
                stroke={borderColor}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="1"
                transform="translate(1, 0.6)"
              />
            )}
          </g>
        </svg>
      )}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

  const StatBlock = ({ label, value, color }) => (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
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
      <Panel variant={variant} style={{
  background: v.bg,
  //border: `1px solid ${v.border}`,
  //borderRadius: 2,
  padding: 12,
  marginBottom: 10,
  color: T.text,
  boxSizing: 'border-box',
  ...(v.bgStyle || {}),
  ...style,
}}>
        {title && <div style={{ color: v.titleColor, fontSize: T.narrativeFontSize, fontWeight: 'bold',
          letterSpacing: '0.08em', marginBottom: 8 }}>
          {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{title}
        </div>}
        {children}
      </Panel>
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
  }, React.createElement(Panel, {
    variant: "gold",
    style: { maxWidth: 460, width: "90%" }
  },
    React.createElement('div', { style: { color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", marginBottom: 10 } }, title),
    React.createElement('div', { style: { color: T.text, fontSize: T.narrativeFontSize, lineHeight: 1.6, marginBottom: 16 } }, children),
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
  const LOG_ICONS = window.UI.LOG_ICONS || {};

  // Strip a leading emoji + whitespace (covers ⚓ ⚔ 💨 ☠ ⚠ 👥 etc.)
  const stripLeadingEmoji = (s) =>
    s.replace(/^[\u2600-\u27BF\u2B00-\u2BFF\uD83C-\uDBFF\uDC00-\uDFFF\uFE0F]+\s*/, '');

  return (
    <div style={{ /* ... */ }}>
      {entries.slice(-maxEntries).map((entry, i) => {
        const dayMatch = entry && entry.match(/^\[(\d+)\]\s*(.*)/);
        const day = dayMatch ? parseInt(dayMatch[1], 10) : null;
        const rawText = dayMatch ? dayMatch[2] : entry;
        const showDay = day !== null && day !== lastDay;
        if (day !== null) lastDay = day;

        const categoryKey = window.L.classifyLogLine(rawText);
        const IconComponent = categoryKey ? LOG_ICONS[categoryKey] : null;
        const displayText = stripLeadingEmoji(rawText);

        return (
          <div key={i} style={{ marginBottom: 6, display: "flex", alignItems: "baseline" }}>
            <div style={{ flex: 1, display: "flex", gap: 6, alignItems: "baseline" }}>
              {IconComponent && (
                <IconComponent size={12} color={T.textDim}
                  style={{ flexShrink: 0, verticalAlign: "middle" }} />
              )}
              <span>{displayText}</span>
            </div>
            {showDay && (
              <span style={{ flexShrink: 0, marginLeft: 8, fontSize: T.captionFontSize, color: T.textFaint }}>
                Day {day}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};


// ── Good icon lookup ──────────────────────────────────────
  // Maps a resource key (e.g. "rum", "sugar") to the corresponding icon component.
  // Built lazily because icons.jsx loads after ui.jsx — at IIFE execution time
  // the Icon components don't exist yet, so we resolve them on demand.
  const GOOD_ICON_KEYS = {
    food:    'IconFood',
    water:   'IconWater',
    rum:     'IconRhum',
    sugar:   'IconSugar',
    timber:  'IconTimber',
    cloth:   'IconCloth',
    spices:  'IconSpice',
    silk:    'IconSilk',
    coffee:  'IconCoffee',
    cocoa:   'IconCocoa',
    tobacco: 'IconTobacco',
    weapons: 'IconSpear',
    silver:  'IconGoblet',
    slaves:  'IconPerson',
  };

  const getGoodIcon = (good, opts = {}) => {
    const iconName = GOOD_ICON_KEYS[good];
    if (!iconName) return null;
    const IconComponent = window.UI[iconName];
    if (!IconComponent) return null;
    return React.createElement(IconComponent, {
      size: opts.size ?? 14,
      color: opts.color ?? T.textDim,
      style: opts.style ?? { marginRight: 6 },
    });
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

  const ShipSideSprite = ({
  type,
  faction = null,
  equipment = [],
  width = 300,
  height = 210,
  facing = "left",
}) => {
  const containerRef = React.useRef(null);

  // Stringify equipment array for stable dependency comparison
  const equipKey = Array.isArray(equipment) ? equipment.join(",") : "";

  React.useEffect(() => {
    if (!containerRef.current) return;
    if (!window.ShipSprite || typeof window.ShipSprite.render !== "function") {
      containerRef.current.innerHTML = "";
      return;
    }
    const svg = window.ShipSprite.render(type, {
      faction,
      equipment: Array.isArray(equipment) ? equipment : [],
      width,
      height,
      facing,
    });
    containerRef.current.innerHTML = "";
    if (svg) {
      containerRef.current.appendChild(svg);
    }
  }, [type, faction, equipKey, width, height, facing]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: "inline-block",
      }}
    />
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

const TransferLayout = ({ 
  leftTitle, leftContent, leftFooter,
  rightTitle, rightContent, rightFooter,
  style = {}
}) => (
  <div style={{ display: "flex", gap: T.spacing.md, alignItems: "stretch", ...style }}>
    {/* Left panel */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Panel style={{ display: "flex", flexDirection: "column", flex: 1}}>
          {leftTitle && <SectionTitle>{leftTitle}</SectionTitle>}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
          {leftContent}
        </div>
        {leftFooter}
      </Panel>
    </div>

    {/* Right panel */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Panel style={{ display: "flex", flexDirection: "column", flex: 1}}>
        {rightTitle && <SectionTitle>{rightTitle}</SectionTitle>}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
          {rightContent}
        </div>
        {rightFooter}
      </Panel>
    </div>
  </div>
);

const PortSilhouette = ({ portKey }) => {
  const port = window.D.PORTS?.[portKey];
  const factionKey = port?.faction;
  
  if (!factionKey) return null;
  
const src = `port-${factionKey}.svg`;
  
  return (
    <div style={{
      width: "100%",
      maxHeight: 280,
      overflow: "hidden",
      borderRadius: 3,
      marginBottom: T.spacing.md,
      lineHeight: 0,
    }}>
      <img
        src={src}
        alt={`${port?.name || "Port"} silhouette`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
};

  // ── Attach all public primitives to window.UI (icons live in icons.jsx) ──
  Object.assign(window.UI, {
    T, panelStyle, Btn, PulseBtn, Bar, Pill, Panel, StatBlock, SectionTitle, ScreenHeader,
    TutorialPopup, NarrativePanel, NarrativeLine, LogList, Divider, EmptyState,
    FactionPill, RepPill, ShipSprite, ShipSideSprite, BackButton, useFlashOnChange,
    Tooltip,getGoodIcon,TransferLayout,PortSilhouette,
  });
})();