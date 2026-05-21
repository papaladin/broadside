// screens_shared.jsx — Shared micro-components and window.S initialisation
window.S = window.S || {};

(() => {
  const { T, Pill } = window.UI;
  const { FACTIONS } = window.D;
  const L = window.L;

  // ── FactionPill ────────────────────────────────────────────────
  function FactionPill({ faction }) {
    const f = FACTIONS[faction];
    return <Pill label={f?.label ?? faction} color={f?.color ?? T.textDim} />;
  }

  // ── RepPill ────────────────────────────────────────────────────
  function RepPill({ rep }) {
    const color = rep >= 60 ? T.greenBr : rep >= 30 ? T.gold : T.redBr;
    return <Pill label={`${L.reputationLabel(rep)} (${rep})`} color={color} />;
  }

  // ── ShipSprite ─────────────────────────────────────────────────
  function ShipSprite({ type, size = 40 }) {
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
  }

  Object.assign(window.S, { FactionPill, RepPill, ShipSprite });
})();