// screens_voyage.jsx — Voyage-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT} = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, LogList, EmptyState, TutorialPopup, BackButton, Tooltip } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // ── MAP SCREEN ───────────────────────────────────────────────────────
function MapScreen({ state, dispatch }) {
  const [hov, setHov] = useState(null);
  const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("map"));
  const W = 760, H = 460;

  // At-sea detection
  const atSea = state.route && state.route.totalDays > 0 && state.sailingDaysLeft > 0;
  const seaPos = atSea ? L.getSeaPosition(state.route) : null;
  const remainingEndurance = atSea ? state.route.enduranceBudget - state.route.enduranceSpent : 0;
  const playerPos = atSea ? seaPos : (state.currentPort ? PORTS[state.currentPort] : null);

  // Helper for unreachable reason when at sea
  const getAtSeaUnreachableReason = (portKey, days) => {
    const port = PORTS[portKey];
    if (!port) return null;
    if (port.hidden && !state.discoveredPorts?.includes(portKey)) return null;
    if (port.minHull) {
      const baseHull = SHIPS[state.ship?.type]?.maxHull ?? 0;
      if (baseHull < port.minHull) return `Requires a heavier vessel`;
    }
    if (days > remainingEndurance) return `Out of range (${days} days, only ${remainingEndurance} remaining)`;
    return null;
  };

  return (
    <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: 10, flex: 1, overflow: "hidden", minHeight: "100%" }}>
      <BackButton dispatch={dispatch} />
      {/* Tutorial Popup */}
      {showTutorial && (
        <TutorialPopup
          title="The Caribbean"
          onDismiss={(disableAll) => {
            markTutorialSeen("map", disableAll);
            setShowTutorial(false);
          }}
        >
          <p>Click any port to set sail. Hover to see:</p>
          <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
            <li>How many days the voyage will take</li>
            <li>Your reputation at that port</li>
          </ul>
          <p>Grey ports are out of range — you'll need a bigger ship. Upgrade at a Shipyard when you can afford it.</p>
        </TutorialPopup>
      )}

      <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", flex: 1, minHeight: 400 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block", background: T.bgDeep, minHeight: 400 }}>
          <defs>
            {/* Sea gradient — radial highlight at top‑right */}
            <radialGradient id="seaGlow" cx="72%" cy="18%" r="50%">
              <stop offset="0%" stopColor="rgba(90,138,170,0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#102030" />
              <stop offset="100%" stopColor="#0a141e" />
            </linearGradient>

            {/* Grid lines — subtle gold, every 95px X / 92px Y */}
            <pattern id="seaGrid" width="95" height="92" patternUnits="userSpaceOnUse">
              <path d="M 95 0 L 95 92 M 0 92 L 95 92" stroke="rgba(201,170,110,0.07)" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          {/* Background: gradient with glow, then grid overlay */}
          <rect width={W} height={H} fill="url(#seaGrad)" />
          <rect width={W} height={H} fill="url(#seaGlow)" />
          <rect width={W} height={H} fill="url(#seaGrid)" />
          <image href="map.svg" x="0" y="0" width="760" height="460" />
          {state.activeMission && (() => { const fr = PORTS[state.currentPort]; const to = PORTS[state.activeMission.targetPort]; return fr && to ? <line x1={fr.x} y1={fr.y} x2={to.x} y2={to.y} stroke={T.gold} strokeWidth="1" strokeDasharray="6,4" opacity="0.35" /> : null; })()}
          {Object.entries(PORTS).filter(([key]) => state.discoveredPorts?.includes(key)).map(([key, p]) => {
            const isHov = hov === key;
            const fColor = FACTIONS[p.faction]?.color ?? T.textDim;
            const rep = state.reputation[key] ?? 20;

            let days, reachable;
            if (atSea) {
              days = L.travelDaysFromPosition(seaPos, key, state);
              reachable = L.canReachFromPosition(seaPos, key, state, remainingEndurance) && key !== state.route.destinationPort;
            } else {
              days = L.travelDays(state.currentPort, key, state);
              reachable = L.canReach(state, key) && key !== state.currentPort;
            }

            return (
              <g key={key}
                 onClick={() => reachable && dispatch({ type: A.SAIL_TO, port: key })}
                 onMouseEnter={() => setHov(key)}
                 onMouseLeave={() => setHov(null)}
                 style={{ cursor: reachable ? "pointer" : "default" }}>
                {isHov && <circle cx={p.x} cy={p.y} r={22} fill={fColor} opacity="0.10" />}
                <circle cx={p.x} cy={p.y} r={7}
                  fill={reachable ? fColor : T.textFaint}
                  stroke={T.bgDeep} strokeWidth="2"
                  opacity={reachable ? 1 : 0.4} />
                <text x={p.x} y={p.y + 18} textAnchor="middle" fontSize="8" fill={isHov ? T.text : T.textDim} fontFamily={T.font}>{p.name.toUpperCase()}</text>
                {isHov && (
                  reachable ? (
                    <>
                      <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize="8" fill={T.gold} fontFamily={T.font}>{days} day{days !== 1 ? "s" : ""}</text>
                      <text x={p.x} y={p.y + 38} textAnchor="middle" fontSize="7" fill={rep >= 40 ? T.greenBr : T.redBr} fontFamily={T.font}>{L.reputationLabel(rep)}</text>
                    </>
                  ) : (
                    <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize="8" fill={T.redBr} fontFamily={T.font}>
                      {atSea ? getAtSeaUnreachableReason(key, days) : (L.getUnreachableReason(state, key) || `Out of range — ${days} day${days !== 1 ? "s" : ""}`)}
                    </text>
                  )
                )}
                {isHov && (() => {
                  const alertLevel = state.factionAlerts?.[p.faction] || 0;
                  if (alertLevel > 0) {
                    return (<text x={p.x} y={p.y + 48} textAnchor="middle" fontSize="7" fill={T.redBr} fontFamily={T.font}>⚠ Heat {alertLevel}</text>);
                  }
                  return null;
                })()}
              </g>
            );
          })}
          {/* Ship marker at player position — centered */}
          {playerPos && (
            <g transform={`translate(${playerPos.x}, ${playerPos.y})`}>
              <g transform="translate(-14, -14)">
                <ShipSprite type={state.ship.type} size={28} />
              </g>
            </g>
          )}
          <g transform="translate(724, 36)">
            <circle cx={0} cy={0} r={22} fill="T.bgDeep" stroke={T.border} strokeWidth="1" />
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

  // ── SAILING SCREEN (responsive single‑column on narrow) ────────
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
    const loadPct = L.getHoldLoadPct(state.hold?.items, L.getHoldCapacity(state));
    const speedMult = L.getHoldSpeedMultiplier(loadPct);

    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("sailing"));

    // Rerouting availability
    const reachableFromSea = L.getReachablePortsFromSea(state);
    const canChangeCourse = reachableFromSea.length > 0;

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", gap: T.spacing.md, flex: 1, overflow: "hidden", flexWrap: "wrap",flexDirection: window.innerWidth < 480 ? "column" : "row" }}>
        {/* Tutorial Popup */}
        {showTutorial && (
          <TutorialPopup
            title="At Sea"
            onDismiss={(disableAll) => {
              markTutorialSeen("sailing", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>Click <strong>Advance Day</strong> to sail toward your destination. Each day:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>Your crew consumes food and water</li>
              <li>Crew wages are deducted</li>
              <li>Random events may happen — storms, encounters, opportunities</li>
            </ul>
            <p>When you arrive, click <strong>Enter Port</strong> to dock.</p>
          </TutorialPopup>
        )}

        <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", minHeight: 400 }}>
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
              <g transform="translate(-15, -15)">
                <ShipSprite type={state.ship.type} size={30} />
              </g>
            </g>
            <g transform="translate(724, 40)">
              <circle cx={0} cy={0} r={22} fill="T.bgDeep" stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{d}</text>)}
              <g transform={`rotate(${state.wind.angle})`}><line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" /><polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} /></g>
              <text x={0} y={32} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>
                <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 10, minWidth: 220, overflowY: "auto" }}>
          <div style={{ color: T.gold, fontSize: T.heading3FontSize, textAlign: "center" }}>⛵ En route to <span style={{ color: T.text, fontWeight: "bold" }}>{PORTS[state.destination]?.name}</span></div>
          <div style={{ color: T.textDim, fontSize: 12, textAlign: "center" }}>{arrived ? "Arrived — ready to dock" : `${state.sailingDaysLeft} day${state.sailingDaysLeft !== 1 ? "s" : ""} remaining`}</div>

          {/* Controls come first so they're never hidden on narrow screens */}
          <div style={panelStyle()}>
            <div style={{ display: "flex", gap: T.spacing.sm, marginBottom: 8 }}>
              <Tooltip text="Order the crew to sail one day further. Provisions will be consumed.">
                <Btn onClick={() => dispatch({ type: A.ADVANCE_DAY })} disabled={arrived}>▶ Advance Day</Btn>
              </Tooltip>
            <Tooltip text="Drop anchor and go ashore. Trade, rest, or recruit here.">
            <Btn v="gold" onClick={() => dispatch({ type: A.ENTER_PORT })} disabled={!arrived}>⚓ Enter Port</Btn>
          </Tooltip>
            </div>
            {/* Change Course — only available while still sailing */}
            {!arrived && (
              <div style={{ marginTop: 8 }}>
                <Tooltip text="Plot a new heading from your current position, if your ship can reach it.">
                  <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })} disabled={!canChangeCourse}>
                    🧭 Change Course
                  </Btn>
                </Tooltip>
                {!canChangeCourse && (
                  <div style={{ color: T.textFaint, fontSize: 10, marginTop: 4 }}>
                    No alternate port is reachable from your current position under present conditions.
                  </div>
                )}
              </div>
            )}
            <div style={{ color: T.textDim, fontSize: 10, marginTop: 8 }}>
              Wind {state.wind.speed}kt at {state.wind.angle}°
              {state.activeMission ? ` · Mission: ${state.activeMission.name}` : ""}
              {speedMult > 1 && (
                <span style={{ color: T.gold }}>
                  {' '}— {speedMult >= 1.33 ? "very heavy load" : "heavy load"}
                </span>
              )}
            </div>

            
          </div>

          {/* Provisions panel */}
          <div style={panelStyle()}>
            <SectionTitle>PROVISIONS</SectionTitle>
            <div style={{ fontSize: 11, color: T.text }}>
              <div style={{ marginBottom: 4 }}><span style={{ color: (state.hold?.items?.food || 0) < 3 * consumption.food ? T.red : T.gold }}>🍖 Food: {state.hold?.items?.food ?? 0}</span><span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>({daysLeft.food} days)</span></div>
              <div style={{ marginBottom: 4 }}><span style={{ color: (state.hold?.items?.water || 0) < 3 * consumption.water ? T.red : T.gold }}>💧 Water: {state.hold?.items?.water ?? 0}</span><span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>({daysLeft.water} days)</span></div>
              <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>Crew consumes {consumption.food} food + {consumption.water} water / day</div>
            </div>
          </div>

          {/* Captain's Log (can grow, so keep at bottom) */}
          <div style={{ ...panelStyle(), flex: 1, display: "flex", flexDirection: "column", minHeight: 120 }}>
            <SectionTitle>CAPTAIN'S LOG</SectionTitle>
            <LogList entries={state.log} maxEntries={15} />
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, padding: T.spacing.xl, background: `radial-gradient(ellipse at 50% 40%, #0a1828 0%, ${T.bg} 70%)` }}>
        <div style={{ ...panelStyle({ maxWidth: 500, width: "100%" }), borderColor: typeColor[ev.type] ?? T.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><Pill label={ev.type} color={typeColor[ev.type] ?? T.textDim} /><span style={{ color: T.textDim, fontSize: 10 }}>Day {state.day}</span></div>
          <div style={{ color: T.gold, fontSize: T.heading1FontSize, fontWeight: "bold", marginBottom: 8 }}>{ev.title}</div>
          <p style={{ color: T.text, fontSize: T.narrativeFontSize, marginBottom: 20, lineHeight: T.narrativeLineHeight }}>{ev.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: T.spacing.sm }}>
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

  // ── INTERCEPT SCREEN (data‑driven from options array) ──────────────
const InterceptScreen = ({ state, dispatch }) => {
  const ctx = state.encounterContext;
  if (!ctx) return null;
  const { enemy, flavourText, options } = ctx;
  const enemyShip = SHIPS[enemy.ship] || {};

  return (
    <div style={{ padding: T.spacing.xl, maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", letterSpacing: "0.08em" }}>⚠ ENCOUNTER</div>
      <div style={panelStyle({ borderColor: T.borderBr })}>
        <p style={{ color: T.text, fontSize: 12, lineHeight: 1.6 }}>{flavourText}</p>
      </div>
      <div style={panelStyle()}>
        <div style={{ color: T.redBr, fontSize: 12, fontWeight: "bold", marginBottom: 8 }}>
          {enemy.name}
          <span style={{ color: T.textDim, fontWeight: "normal", marginLeft: 8, fontSize: 10 }}>
            {enemyShip.name ?? enemy.ship}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            ["Hull", `${enemy.hull}/${enemy.maxHull || enemy.hull}`],
            ["Cannons", enemy.cannons],
            ["Crew", enemy.crew],
            ["Speed", enemyShip.speed ?? "?"],
          ].map(([l, v]) => (
            <div key={l}>
              <div style={{ color: T.textDim, fontSize: 9 }}>{l}</div>
              <div style={{ color: T.text, fontSize: T.heading3FontSize }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <Bar value={enemy.hull} max={enemy.maxHull || enemy.hull} color={T.redBr} h={10} />
        </div>
      </div>
      <div style={panelStyle()}>
        <div style={{ color: T.textDim, fontSize: 10, marginBottom: 10, letterSpacing: "0.08em" }}>
          CHOOSE YOUR RESPONSE:
        </div>
        {options.map(opt => (
          <div key={opt.id} style={{ marginBottom: 8 }}>
            <Btn
              v={
                opt.available
                  ? opt.id === "fight" ? "red"
                  : opt.id === "inspect" ? "default"
                  : "default"
                  : "ghost"
              }
              disabled={!opt.available}
              onClick={() => opt.available && dispatch(opt.action)}
              style={{ width: "100%", textAlign: "left", opacity: opt.available ? 1 : 0.45 }}
            >
              {opt.label}
            </Btn>
            {!opt.available && opt.reason && (
              <div style={{ color: T.textFaint, fontSize: 10, marginTop: 2, marginLeft: 4 }}>
                ✗ {opt.reason}
              </div>
            )}
            {opt.id === "flee" && opt.available && opt.speedCheck && (
              <div style={{ color: T.textDim, fontSize: 10, marginTop: 2, paddingLeft: 4 }}>
                Speed check: your {opt.speedCheck.player} vs their {opt.speedCheck.enemy}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};  

  // ── BATTLE SCREEN (actions stack vertically on narrow) ──────────
  function BattleScreen({ state, dispatch }) {
    const bs = state.battleState;
    if (!bs) return null;
    const done = ["victory","defeat","fled"].includes(bs.phase);
    const playerPct = bs.playerHull / SHIPS[state.ship.type].maxHull;
    const enemyPct = bs.enemyHull / bs.enemy.hull;

    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("battle"));

    return (
      <div style={{ padding: T.spacing.lg, maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        {/* Tutorial Popup */}
        {showTutorial && (
          <TutorialPopup
            title="Naval Combat"
            onDismiss={(disableAll) => {
              markTutorialSeen("battle", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>Choose an action each round:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li><strong>Broadside</strong> — reliable cannon volley</li>
              <li><strong>Precision</strong> — risky but devastating if it hits</li>
              <li><strong>Grapple</strong> — board the enemy. High risk, instant victory if successful. Depends on your crew size advantage and morale.</li>
              <li><strong>Evade</strong> — attempt to flee the battle, depend on your ship speed.</li>
            </ul>
            <p>Watch your hull and crew. If your hull reaches zero, you lose.</p>
          </TutorialPopup>
        )}

        <div style={{ textAlign: "center", color: T.redBr, fontSize: T.heading2FontSize, fontWeight: "bold", letterSpacing: "0.1em" }}>⚔ NAVAL BATTLE — ROUND {bs.round}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 10, alignItems: "center" }}>
          <div style={panelStyle({ borderColor: T.blueBr })}>
            <div style={{ color: T.blueBr, fontSize: 10, marginBottom: 4 }}>{state.ship.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>Hull: {bs.playerHull} / {SHIPS[state.ship.type].maxHull}</div>
            <Bar value={bs.playerHull} max={SHIPS[state.ship.type].maxHull} color={playerPct < 0.3 ? T.redBr : T.greenBr} h={10} />
            {bs.convoyHull !== undefined && (
              <>
                <div style={{ color: T.textDim, fontSize: 9, marginTop: 6 }}>Convoy Hull: {bs.convoyHull} / 50</div>
                <Bar value={bs.convoyHull} max={50} color={bs.convoyHull < 15 ? T.redBr : T.gold} h={8} />
              </>
            )}
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>{state.crew.roster.length} crew · {L.getShipStats(state).cannons} cannons</div>
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
          {[...bs.log].reverse().map((e, i) => <div key={i} style={{ color: i === 0 ? T.text : T.textDim, fontSize: T.narrativeFontSize, marginBottom: 3, lineHeight: T.narrativeLineHeight }}>{e}</div>)}
        </div>
        {!done ? (
  <div>
    <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>CHOOSE YOUR ACTION:</div>
    <div style={{ display: "grid",  gridTemplateColumns: window.innerWidth < 480? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: T.spacing.sm }}>
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
    <div style={{ color: bs.phase === "victory" ? T.greenBr : bs.phase === "fled" ? T.gold : T.redBr, fontSize: T.heading1FontSize, fontWeight: "bold", marginBottom: 8, letterSpacing: "0.08em" }}>
      {bs.phase === "victory" ? "⚓ VICTORY!" : bs.phase === "fled" ? "🌊 ESCAPED" : "💀 DEFEATED"}
    </div>
    {bs.phase === "victory" && bs.canPlunder ? (
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
        <Btn v="gold" onClick={() => dispatch({ type: A.NAVIGATE, screen: "plunder" })}>
          ⚓ Plunder the Ship
        </Btn>
        <Btn onClick={() => dispatch({ type: A.DISMISS_BATTLE })}>
          ⛵ Sail Away
        </Btn>
      </div>
    ) : (
      <>
        {bs.phase === "victory" && bs.goldReward > 0 && (
          <div style={{ color: T.gold, fontSize: T.heading3FontSize, marginBottom: 14 }}>+{bs.goldReward} gold</div>
        )}
        <Btn v="gold" onClick={() => dispatch({ type: A.DISMISS_BATTLE })}>
          {bs.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
            ? "Continue Voyage"
            : bs.returnScreen === "arrive" && state.destination
              ? "Enter Port"
              : "Return to Port"}
        </Btn>
      </>
    )}
  </div>
)}
      </div>
    );
  }

  // ── PLUNDER SCREEN ──────────────────────────────────────────────
function PlunderScreen({ state, dispatch }) {
  const bs = state.battleState;
  if (!bs || !bs.canPlunder) return null;

  const enemyCargo = bs.enemyCargo || {};
  const goldReward = bs.goldReward || 0;
  const holdCapacity = L.getHoldCapacity(state) || 200;
  // Local state: player's hold items (starting from current hold)
  const [playerItems, setPlayerItems] = React.useState({ ...(state.hold?.items || {}) });
  // Local state: enemy cargo (what's still available to take)
  const [enemyItems, setEnemyItems] = React.useState({ ...enemyCargo });

  const used = Object.values(playerItems).reduce((s, q) => s + q, 0);
  const free = Math.max(0, holdCapacity - used);

  const moveToPlayer = (good) => {
    const available = enemyItems[good] || 0;
    if (available <= 0 || free < 1) return;
    setEnemyItems(prev => ({ ...prev, [good]: prev[good] - 1 }));
    setPlayerItems(prev => ({ ...prev, [good]: (prev[good] || 0) + 1 }));
  };

  const moveToEnemy = (good) => {
    const available = playerItems[good] || 0;
    if (available <= 0) return;
    setPlayerItems(prev => ({ ...prev, [good]: prev[good] - 1 }));
    setEnemyItems(prev => ({ ...prev, [good]: (prev[good] || 0) + 1 }));
  };

  const handleConfirm = () => {
    dispatch({
      type: window.E.A.TAKE_PLUNDER,
      holdItems: playerItems,
    });
  };

  return (
    <div style={{ padding: T.spacing.xl, maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: T.gold, fontSize: T.heading1FontSize, fontWeight: "bold", textAlign: "center" }}>
        ⚓ Plunder the <span style={{ color: T.redBr }}>{bs.enemy.name}</span>
      </div>

      {/* Enemy cargo */}
      <div style={panelStyle()}>
        <SectionTitle>ENEMY CARGO</SectionTitle>
        {Object.keys(enemyItems).length === 0 ? (
        <EmptyState message="No cargo remaining." />
) : (
          Object.entries(enemyItems).map(([good, qty]) => (
            <div key={good} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: T.text, fontSize: 12 }}>
                {window.D.RESOURCES[good]?.name || good}
                {window.D.RESOURCES[good]?.illegal && <span style={{ color: T.redBr }}> ⚠</span>}
                <span style={{ color: T.textDim, marginLeft: 6 }}>×{qty}</span>
              </span>
              <Btn sm onClick={() => moveToPlayer(good)} disabled={free < 1}>+ Take</Btn>
            </div>
          ))
        )}
      </div>

      {/* Player hold */}
      <div style={panelStyle()}>
        <SectionTitle>YOUR HOLD ({used}/{holdCapacity})</SectionTitle>
        <Bar value={used} max={holdCapacity} color={used > holdCapacity * 0.8 ? T.redBr : T.greenBr} h={10} />
        <div style={{ marginTop: 8 }}>
          {Object.keys(playerItems).length === 0 ? (
            <EmptyState message="Your hold is empty." />
          ) : (
            Object.entries(playerItems).map(([good, qty]) => (
              <div key={good} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: T.text, fontSize: 12 }}>
                  {window.D.RESOURCES[good]?.name || good}
                  <span style={{ color: T.textDim }}> ×{qty}</span>
                </span>
                <Btn sm v="ghost" onClick={() => moveToEnemy(good)}>Jettison</Btn>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gold and confirm */}
      <div style={panelStyle({ textAlign: "center" })}>
        <div style={{ color: T.gold, fontSize: T.heading3FontSize, marginBottom: 10 }}>Plunder gold: +{goldReward}g</div>
        <Btn v="gold" onClick={handleConfirm} style={{ fontSize: T.heading3FontSize, padding: "8px 20px" }}>
          Confirm Plunder
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window.S, { MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen, PlunderScreen });
})();