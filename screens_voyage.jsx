// screens_voyage.jsx — Voyage-zone screens
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, UPGRADES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, LogList, EmptyState } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.S;

  // ── MAP SCREEN ───────────────────────────────────────────────────────
  function MapScreen({ state, dispatch }) {
    const [hov, setHov] = useState(null);
    const W = 760, H = 460;
    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1, overflow: "hidden", minHeight: "100%" }}>
        <button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })} style={{ alignSelf: "flex-start", background: T.panel, border: `1px solid ${T.gold}`, color: T.gold, padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>← Back to Port</button>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", flex: 1, minHeight: 400 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block", background: T.bgDeep, minHeight: 400 }}>
            <defs>
              <pattern id="seaGrid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path d="M0 12 Q12 7 25 12 Q38 17 50 12" stroke="#080f1a" strokeWidth="0.8" fill="none" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#seaGrid)" />
            <g opacity="0.75">
              <path d="M 0 110 Q 18 175 38 258 L 92 252 L 148 248 Q 185 240 210 212 Q 224 195 222 182 Q 220 205 206 238 Q 192 270 178 300 Q 166 330 162 366 Q 170 395 214 418 Q 270 438 355 430 Q 398 423 440 415 Q 478 406 515 410 Q 540 396 558 390 Q 575 386 590 388 Q 620 392 672 415 Q 690 425 700 440 Q 715 452 760 458 L 760 460 L 0 460 Z" fill="#0d1e2e" stroke="#1a2e42" strokeWidth="0.8" />
              <path d="M 325 0 Q 332 34 338 72 Q 344 108 342 138 Q 340 154 332 160 Q 322 165 312 160 Q 304 148 304 122 Q 308 90 314 54 Q 320 24 325 0 Z" fill="#0d1e2e" stroke="#1a2e42" strokeWidth="0.8" />
              <path d="M 278 205 Q 292 188 310 190 Q 360 180 405 190 Q 435 200 445 218 Q 440 236 415 238 Q 370 248 328 244 Q 292 230 278 205 Z" fill="#0d1e2e" stroke="#1a2e42" strokeWidth="0.8" />
              <path d="M 458 262 Q 460 256 466 252 Q 470 240 476 228 Q 482 240 488 248 Q 494 252 518 242 Q 548 228 572 245 Q 578 262 576 278 Q 568 284 545 268 Q 515 282 488 280 Q 468 278 460 270 Q 452 268 458 262 Z" fill="#0d1e2e" stroke="#1a2e42" strokeWidth="0.8" />
            </g>
            {state.activeMission && (() => { const fr = PORTS[state.currentPort]; const to = PORTS[state.activeMission.targetPort]; return fr && to ? <line x1={fr.x} y1={fr.y} x2={to.x} y2={to.y} stroke={T.gold} strokeWidth="1" strokeDasharray="6,4" opacity="0.35" /> : null; })()}
            {Object.entries(PORTS).map(([key, p]) => {
              const isCur = key === state.currentPort;
              const isHov = hov === key;
              const fColor = FACTIONS[p.faction]?.color ?? T.textDim;
              const days = L.travelDays(state.currentPort, key, state);
              const rep = state.reputation[key] ?? 20;
              return (
                <g key={key} onClick={() => !isCur && dispatch({ type: A.SAIL_TO, port: key })} onMouseEnter={() => setHov(key)} onMouseLeave={() => setHov(null)} style={{ cursor: isCur ? "default" : "pointer" }}>
                  {(isCur || isHov) && <circle cx={p.x} cy={p.y} r={20} fill={isCur ? T.gold : fColor} opacity="0.10" />}
                  {isCur && <circle cx={p.x} cy={p.y} r={14} fill="none" stroke={T.gold} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />}
                  <circle cx={p.x} cy={p.y} r={isCur ? 8 : 5} fill={isCur ? T.gold : fColor} stroke={T.bgDeep} strokeWidth="2" />
                  {isCur && <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize="12" fill={T.gold}>⚓</text>}
                  <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize="8" fill={isCur || isHov ? T.text : T.textDim} fontFamily={T.font}>{p.name.toUpperCase()}</text>
                  {isHov && !isCur && <>
                    <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize="8" fill={T.gold} fontFamily={T.font}>{days} day{days !== 1 ? "s" : ""}</text>
                    <text x={p.x} y={p.y + 36} textAnchor="middle" fontSize="7" fill={rep >= 40 ? T.greenBr : T.redBr} fontFamily={T.font}>{L.reputationLabel(rep)}</text>
                  </>}
                </g>
              );
            })}
            <g transform="translate(724, 36)">
              <circle cx={0} cy={0} r={22} fill="#040c18" stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{d}</text>)}
              <g transform={`rotate(${state.wind.angle})`}><line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" /><polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} /></g>
              <text x={0} y={32} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(FACTIONS).map(([k, f]) => <div key={k} style={{ display: "flex", gap: 5, alignItems: "center" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: f.color }} /><span style={{ color: T.textDim, fontSize: 11 }}>{f.label}</span></div>)}
          <span style={{ color: T.textFaint, fontSize: 10, marginLeft: "auto" }}>Click a port to sail there · Hover to see distance & standing</span>
        </div>
      </div>
    );
  }

  // ── SAILING SCREEN ───────────────────────────────────────────────────
  function SailingScreen({ state, dispatch }) {
    const from = PORTS[state.currentPort] ?? { x: 380, y: 230 };
    const to = PORTS[state.destination] ?? { x: 380, y: 230 };
    const progress = state.sailingDaysTotal > 0 ? 1 - (state.sailingDaysLeft / state.sailingDaysTotal) : 0;
    const shipX = from.x + (to.x - from.x) * progress;
    const shipY = from.y + (to.y - from.y) * progress;
    const hdgDeg = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const arrived = state.sailingDaysLeft <= 0;
    const W = 760, H = 460;
    const consumption = L.getProvisionConsumptionPerDay(state);
    const daysLeft = L.getDaysOfProvisions(state.hold?.items || {}, consumption);
    return (
      <div style={{ padding: 14, display: "flex", gap: 12, flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 2, display: "flex", flexDirection: "column", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", minHeight: 400 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block", background: T.bgDeep }}>
            <defs><pattern id="sailWaves" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 15 Q15 8 30 15 Q45 22 60 15" stroke="#091520" strokeWidth="1" fill="none" /><path d="M0 26 Q15 20 30 26 Q45 32 60 26" stroke="#060e18" strokeWidth="0.5" fill="none" /></pattern></defs>
            <rect width={W} height={H} fill="url(#sailWaves)" />
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={T.border} strokeWidth="1.5" strokeDasharray="8,6" />
            <line x1={from.x} y1={from.y} x2={shipX} y2={shipY} stroke={T.blueBr} strokeWidth="1" opacity="0.3" />
            <circle cx={from.x} cy={from.y} r={4} fill={T.textDim} />
            <text x={from.x} y={from.y - 10} textAnchor="middle" fontSize="8" fill={T.textDim} fontFamily={T.font}>{PORTS[state.currentPort]?.name?.toUpperCase()}</text>
            <circle cx={to.x} cy={to.y} r={7} fill="none" stroke={T.gold} strokeWidth="1.5" strokeDasharray="3,2" />
            <circle cx={to.x} cy={to.y} r={3} fill={T.gold} />
            <line x1={to.x} y1={to.y - 5} x2={to.x} y2={to.y - 22} stroke={T.gold} strokeWidth="1.5" />
            <polygon points={`${to.x},${to.y-22} ${to.x+10},${to.y-18} ${to.x},${to.y-14}`} fill={T.gold} opacity="0.85" />
            <text x={to.x} y={to.y + 16} textAnchor="middle" fontSize="8" fill={T.gold} fontFamily={T.font}>{PORTS[state.destination]?.name?.toUpperCase()}</text>
            <g transform={`translate(${shipX},${shipY}) rotate(${hdgDeg})`}>
              <ellipse cx={0} cy={0} rx={20} ry={20} fill={T.gold} opacity="0.06" />
              <ellipse cx={0} cy={0} rx={13} ry={5} fill="#3a2a10" stroke={T.goldDim} strokeWidth="1" />
              <path d="M13,0 L19,-2 L19,2 Z" fill="#4a3418" />
              <ellipse cx={0} cy={0} rx={7} ry={3.5} fill={T.gold} opacity="0.6" />
              <circle cx={0} cy={0} r={1.8} fill={T.text} />
              <path d="M-13,0 Q-20,-3 -26,0 Q-20,3 -13,0" fill="none" stroke="#0d2840" strokeWidth="1.2" opacity="0.7" />
            </g>
            <g transform="translate(724, 40)">
              <circle cx={0} cy={0} r={22} fill="#040c18" stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{d}</text>)}
              <g transform={`rotate(${state.wind.angle})`}><line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" /><polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} /></g>
              <text x={0} y={32} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 220, maxWidth: 320, overflowY: "auto" }}>
          <div style={{ color: T.gold, fontSize: 14, textAlign: "center" }}>⛵ En route to <span style={{ color: T.text, fontWeight: "bold" }}>{PORTS[state.destination]?.name}</span></div>
          <div style={{ color: T.textDim, fontSize: 12, textAlign: "center" }}>{arrived ? "Arrived — ready to dock" : `${state.sailingDaysLeft} day${state.sailingDaysLeft !== 1 ? "s" : ""} remaining`}</div>
          <div style={panelStyle()}>
            <SectionTitle>PROVISIONS</SectionTitle>
            <div style={{ fontSize: 11, color: T.text }}>
              <div style={{ marginBottom: 4 }}><span style={{ color: (state.hold?.items?.food || 0) < 3 * consumption.food ? T.red : T.gold }}>🍖 Food: {state.hold?.items?.food ?? 0}</span><span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>({daysLeft.food} days)</span></div>
              <div style={{ marginBottom: 4 }}><span style={{ color: (state.hold?.items?.water || 0) < 3 * consumption.water ? T.red : T.gold }}>💧 Water: {state.hold?.items?.water ?? 0}</span><span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>({daysLeft.water} days)</span></div>
              <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>Crew consumes {consumption.food} food + {consumption.water} water / day</div>
            </div>
          </div>
          <div style={{ ...panelStyle(), flex: 1, display: "flex", flexDirection: "column", minHeight: 120 }}>
            <SectionTitle>CAPTAIN'S LOG</SectionTitle>
            <LogList entries={state.log} maxEntries={15} />
          </div>
          <div style={panelStyle()}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Btn onClick={() => dispatch({ type: A.ADVANCE_DAY })} disabled={arrived}>▶ Advance Day</Btn>
              <Btn v="gold" onClick={() => dispatch({ type: A.ENTER_PORT })} disabled={!arrived}>⚓ Enter Port</Btn>
            </div>
            <div style={{ color: T.textDim, fontSize: 10 }}>Wind {state.wind.speed}kt at {state.wind.angle}°{state.activeMission ? ` · Mission: ${state.activeMission.name}` : ""}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── EVENT SCREEN ─────────────────────────────────────────────────────
  function EventScreen({ state, dispatch }) {
    const ev = state.activeEvent;
    if (!ev) return null;
    const typeColor = { hazard: T.redBr, choice: T.gold, reward: T.greenBr, crew: T.blueBr, faction: T.purpleBr };
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: 20, background: `radial-gradient(ellipse at 50% 40%, #0a1828 0%, ${T.bg} 70%)` }}>
        <div style={{ ...panelStyle({ maxWidth: 500, width: "100%" }), borderColor: typeColor[ev.type] ?? T.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><Pill label={ev.type} color={typeColor[ev.type] ?? T.textDim} /><span style={{ color: T.textDim, fontSize: 10 }}>Day {state.day}</span></div>
          <div style={{ color: T.gold, fontSize: 17, fontWeight: "bold", marginBottom: 8 }}>{ev.title}</div>
          <p style={{ color: T.text, fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>{ev.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ev.choices.map((c, i) => (
              <div key={i} onClick={() => dispatch({ type: A.RESOLVE_EVENT, choiceIndex: i })} style={{ ...panelStyle({ background: T.panelAlt, cursor: "pointer", transition: "border-color 0.15s" }) }} onMouseEnter={e => e.currentTarget.style.borderColor = T.borderBr} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ color: T.text, fontSize: 12, fontWeight: "bold", marginBottom: 3 }}>{c.label}</div>
                <div style={{ color: T.textDim, fontSize: 10 }}>{c.outcome.log}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── INTERCEPT SCREEN ──────────────────────────────────────────────────
  const InterceptScreen = ({ state, dispatch }) => {
    const ctx = state.encounterContext;
    if (!ctx) return null;
    const { enemy, flavourText, options } = ctx;
    const enemyShip = SHIPS[enemy.ship] || {};
    const Option = ({ actionType, label, sublabel, reason, available, v = "default" }) => (
      <div style={{ marginBottom: 8 }}>
        <Btn v={available ? v : "ghost"} disabled={!available} onClick={() => dispatch({ type: actionType })} style={{ width: "100%", textAlign: "left", opacity: available ? 1 : 0.45 }}>{label}{sublabel && <span style={{ color: T.gold, marginLeft: 8, fontSize: 10 }}>{sublabel}</span>}</Btn>
        {!available && reason && <div style={{ color: T.textFaint, fontSize: 10, marginTop: 2, marginLeft: 4 }}>✗ {reason}</div>}
      </div>
    );
    return (
      <div style={{ padding: 20, maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: T.gold, fontSize: 16, fontWeight: "bold", letterSpacing: "0.08em" }}>⚠ ENCOUNTER</div>
        <div style={panelStyle({ borderColor: T.borderBr })}><p style={{ color: T.text, fontSize: 12, lineHeight: 1.6 }}>{flavourText}</p></div>
        <div style={panelStyle()}>
          <div style={{ color: T.redBr, fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>{enemy.name}<span style={{ color: T.textDim, fontWeight: "normal", marginLeft: 8, fontSize: 10 }}>{enemyShip.name ?? enemy.ship}</span></div>
          <div style={{ display: "flex", gap: 16 }}>
            {[["Hull",`${enemy.hull}/${enemy.maxHull||enemy.hull}`],["Cannons",enemy.cannons],["Crew",enemy.crew],["Speed",enemyShip.speed??"?"]].map(([l,v])=><div key={l}><div style={{color:T.textDim,fontSize:9}}>{l}</div><div style={{color:T.text,fontSize:13}}>{v}</div></div>)}
          </div>
          <div style={{ marginTop: 8 }}><Bar value={enemy.hull} max={enemy.maxHull||enemy.hull} color={T.redBr} h={6} /></div>
        </div>
        <div style={panelStyle()}>
          <div style={{ color: T.textDim, fontSize: 10, marginBottom: 10, letterSpacing: "0.08em" }}>CHOOSE YOUR RESPONSE:</div>
          <Option actionType={A.INTERCEPT_FIGHT} label="⚔  Engage" available={true} reason={null} v="red" />
          <Option actionType={A.INTERCEPT_FLEE} label="💨  Attempt to Flee" sublabel={options.flee.available ? `Speed check: you ${options.flee.speedCheck.player} vs ${options.flee.speedCheck.enemy}` : null} available={options.flee.available} reason={options.flee.reason} />
          <Option actionType={A.INTERCEPT_PARLEY} label="🤝  Parley" sublabel={options.parley.available ? `Rep: ${state.reputation[state.destination ?? state.currentPort] ?? 0}` : null} available={options.parley.available} reason={options.parley.reason} />
          <Option actionType={A.INTERCEPT_BRIBE} label="💰  Bribe" sublabel={options.bribe.available ? `Cost: ${options.bribe.cost}g` : null} available={options.bribe.available} reason={options.bribe.reason} v="gold" />
          <Option actionType={A.INTERCEPT_SURRENDER} label="🏳  Surrender" available={options.surrender.available} reason={options.surrender.reason} v="ghost" />
        </div>
      </div>
    );
  };

  // ── BATTLE SCREEN ────────────────────────────────────────────────────
  function BattleScreen({ state, dispatch }) {
    const bs = state.battleState;
    if (!bs) return null;
    const done = ["victory","defeat","fled"].includes(bs.phase);
    const playerPct = bs.playerHull / SHIPS[state.ship.type].maxHull;
    const enemyPct = bs.enemyHull / bs.enemy.hull;
    return (
      <div style={{ padding: 14, maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        <div style={{ textAlign: "center", color: T.redBr, fontSize: 16, fontWeight: "bold", letterSpacing: "0.1em" }}>⚔ NAVAL BATTLE — ROUND {bs.round}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 10, alignItems: "center" }}>
          <div style={panelStyle({ borderColor: T.blueBr })}>
            <div style={{ color: T.blueBr, fontSize: 10, marginBottom: 4 }}>{state.ship.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>Hull: {bs.playerHull} / {SHIPS[state.ship.type].maxHull}</div>
            <Bar value={bs.playerHull} max={SHIPS[state.ship.type].maxHull} color={playerPct < 0.3 ? T.redBr : T.greenBr} h={10} />
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>{state.crew.roster.length} crew · {L.getShipStats(state).cannons} cannons</div>
            {state.ship.upgrades.length > 0 && <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>{state.ship.upgrades.map(u => <Pill key={u} label={UPGRADES[u]?.name ?? u} color={T.blueBr} />)}</div>}
          </div>
          <div style={{ textAlign: "center", color: T.redBr, fontSize: 22 }}>⚡</div>
          <div style={panelStyle({ borderColor: T.red })}>
            <div style={{ color: T.redBr, fontSize: 10, marginBottom: 4 }}>{bs.enemy.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>Hull: {bs.enemyHull} / {bs.enemy.hull}</div>
            <Bar value={bs.enemyHull} max={bs.enemy.hull} color={T.redBr} h={10} />
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>{bs.enemyCrew} crew · {bs.enemy.cannons} cannons</div>
            <div style={{ marginTop: 5 }}><FactionPill faction={bs.enemy.faction} /></div>
          </div>
        </div>
        <div style={{ ...panelStyle({ background: T.bgDeep, height: 130, overflowY: "auto" }) }}>
          {[...bs.log].reverse().map((e, i) => <div key={i} style={{ color: i === 0 ? T.text : T.textDim, fontSize: 11, marginBottom: 3, lineHeight: 1.4 }}>{e}</div>)}
        </div>
        {!done ? (
          <div>
            <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>CHOOSE YOUR ACTION:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[{ a: "broadside", label: "🔥 Broadside", desc: "Full cannon volley. Reliable damage." },{ a: "precision", label: "🎯 Precision", desc: "Aimed shot. Miss or massive damage." },{ a: "grapple", label: "⚔ Grapple", desc: "Board them. Requires crew advantage." },{ a: "evade", label: "💨 Evade", desc: "Flee if faster. Reduced incoming fire." }].map(({ a, label, desc }) => (
                <div key={a} onClick={() => dispatch({ type: A.BATTLE_ACTION, action: a })} style={{ ...panelStyle({ background: T.panelAlt, cursor: "pointer", transition: "border-color 0.15s" }) }} onMouseEnter={e => e.currentTarget.style.borderColor = T.borderBr} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{ color: T.text, fontSize: 12, fontWeight: "bold", marginBottom: 2 }}>{label}</div>
                  <div style={{ color: T.textDim, fontSize: 10 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ color: bs.phase === "victory" ? T.greenBr : bs.phase === "fled" ? T.gold : T.redBr, fontSize: 20, fontWeight: "bold", marginBottom: 8, letterSpacing: "0.08em" }}>{bs.phase === "victory" ? "⚓ VICTORY!" : bs.phase === "fled" ? "🌊 ESCAPED" : "💀 DEFEATED"}</div>
            {bs.phase === "victory" && <div style={{ color: T.gold, fontSize: 13, marginBottom: 14 }}>{bs.goldReward > 0 && <span style={{ color: T.gold, fontSize: 13, marginBottom: 14 }}>+{bs.goldReward} gold</span>}</div>}
            <Btn v="gold" onClick={() => dispatch({ type: A.DISMISS_BATTLE })}>{bs.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0 ? "Continue Voyage" : bs.returnScreen === "arrive" && state.destination ? "Enter Port" : "Return to Port"}</Btn>
          </div>
        )}
      </div>
    );
  }

  Object.assign(window.S, { MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen });
})();