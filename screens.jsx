// ═══════════════════════════════════════════════════════════════════
//  screens.jsx — ALL GAME SCREENS WITH EXPLICIT BACK BUTTONS
//  React components only. Reads state, calls dispatch.
//  No business logic — that lives in logic.js.
//  Imports: window.D (data), window.L (logic helpers for display),
//           window.E (action constants), window.UI (primitives).
//  Exposed as window.S.
// ═══════════════════════════════════════════════════════════════════

window.S = (() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, UPGRADES, STARTS } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState } = window.UI;

  // ── SHARED MICRO-COMPONENTS ─────────────────────────────────────────

  function FactionPill({ faction }) {
    const f = FACTIONS[faction];
    return <Pill label={f?.label ?? faction} color={f?.color ?? T.textDim} />;
  }

  function RepPill({ rep }) {
    const color = rep >= 60 ? T.greenBr : rep >= 30 ? T.gold : T.redBr;
    return <Pill label={`${L.reputationLabel(rep)} (${rep})`} color={color} />;
  }

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

  // ── START SCREEN ─────────────────────────────────────────────────────
  function StartScreen({ dispatch }) {
    const hasSave = L.hasSave();
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 20,
        background: `radial-gradient(ellipse at 50% 60%, #0a1e38 0%, ${T.bg} 70%)`,
      }}>
        <div style={{
          color: T.gold,
          fontSize: 32,
          fontWeight: "bold",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 4,
          textShadow: `0 0 30px ${T.goldDim}`,
        }}>⚓ Broadside</div>
        <div style={{ color: T.textDim, fontSize: 11, letterSpacing: "0.15em", marginBottom: 36 }}>
          CARIBBEAN · 1695
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 540, width: "100%", marginBottom: 20 }}>
          {STARTS.map(s => (
            <div key={s.id}
              onClick={() => dispatch({ type: A.START_GAME, scenarioId: s.id })}
              style={{
                ...panelStyle({ cursor: "pointer", transition: "border-color 0.15s" }),
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ color: T.gold, fontSize: 13, fontWeight: "bold", marginBottom: 4 }}>{s.name}</div>
              <p style={{ color: T.textDim, fontSize: 10, marginBottom: 8, lineHeight: 1.5 }}>{s.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {s.bonuses.map((b, i) => (
                  <div key={i} style={{ color: T.greenBr, fontSize: 10 }}>✓ {b}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {hasSave && (
          <Btn v="gold" onClick={() => dispatch({ type: A.LOAD_GAME })}>
            ↩ Continue Saved Game
          </Btn>
        )}
      </div>
    );
  }

  // ── PORT SCREEN ──────────────────────────────────────────────────────
  function PortScreen({ state, dispatch }) {
    const port = PORTS[state.currentPort];
    const rep = state.reputation[state.currentPort] ?? 0;
    const repCost = L.shipRepairCost(state);
    const effectiveShipStats = L.getShipStats(state); 
    const canFinish = state.activeMission &&
  (!state.activeMission.targetPort || state.currentPort === state.activeMission.targetPort);

    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        padding: 14,
        overflowY: "auto",
        flex: 1,
      }}>
        {/* ── Port card ── */}
        <div style={panelStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ color: T.gold, fontSize: 17, fontWeight: "bold" }}>{port.name}</div>
              <div style={{ color: FACTIONS[port.faction]?.color, fontSize: 10, letterSpacing: "0.1em" }}>
                {FACTIONS[port.faction]?.label.toUpperCase()} PORT
              </div>
            </div>
            <RepPill rep={rep} />
          </div>

          <p style={{ color: T.textDim, fontSize: 11, margin: "0 0 10px", lineHeight: 1.5 }}>{port.desc}</p>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {port.services.map(s => <Pill key={s} label={s} />)}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })}>🗺 World Map</Btn>
            {port.services.includes("shipyard") &&
              <Btn v="ghost" onClick={() => dispatch({ type: A.NAVIGATE, screen: "shipyard" })}>⚓ Shipyard</Btn>}
            {port.services.includes("crew") &&
              <Btn v="ghost" onClick={() => dispatch({ type: A.NAVIGATE, screen: "crew" })}>👥 Crew</Btn>}
            <Btn v="ghost" onClick={() => dispatch({ type: A.NAVIGATE, screen: "factions" })}>🏴 Factions</Btn>
          </div>

          {port.services.includes("shipyard") && state.ship.hull < SHIPS[state.ship.type].maxHull && (
            <div style={{ marginTop: 10 }}>
              <Btn v="gold"
                onClick={() => dispatch({ type: A.REPAIR })}
                disabled={state.gold < repCost}
              >
                Quick Repair ({repCost}g)
              </Btn>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <Btn v="ghost" sm onClick={() => dispatch({ type: A.SAVE_GAME })}>💾 Save Game</Btn>
          </div>
        </div>

        {/* ── Mission board ── */}
        <div style={panelStyle({ display: "flex", flexDirection: "column" })}>
          <SectionTitle action={
            <Btn sm v="ghost" onClick={() => dispatch({ type: A.REFRESH_MISSIONS })}>Refresh</Btn>
          }>
            MISSION BOARD
          </SectionTitle>

          {!port.services.includes("missions")
            ? <EmptyState message="No mission board in this port." />
            : state.missions.length === 0
              ? <EmptyState message="No missions posted. Try refreshing." />
              : state.missions.map(m => (
                  <div key={m.id} style={{
                    ...panelStyle({ background: T.panelAlt, marginBottom: 8 }),
                    opacity: state.activeMission ? 0.55 : 1,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ color: T.text, fontSize: 12, fontWeight: "bold" }}>{m.name}</span>
                      <Pill label={m.risk} color={T.riskColor?.[m.risk] ?? T.textDim} />
                    </div>
                    <p style={{ color: T.textDim, fontSize: 10, margin: "0 0 6px", lineHeight: 1.4 }}>{m.desc}</p>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: T.gold, fontSize: 11 }}>💰 {m.gold}</span>
                      <span style={{ color: T.blueBr, fontSize: 11 }}>★ {m.fame}</span>
                      <span style={{ color: T.textDim, fontSize: 10 }}>→ {PORTS[m.targetPort]?.name}</span>
                      <Btn sm v="gold"
                        disabled={!!state.activeMission}
                        onClick={() => dispatch({ type: A.TAKE_MISSION, mission: m })}
                      >Accept</Btn>
                    </div>
                  </div>
                ))
          }

          {state.activeMission && (
            <div style={panelStyle({ background: "#081a10", borderColor: T.greenBr, marginTop: 6 })}>
              <div style={{ color: T.greenBr, fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>
                ACTIVE: {state.activeMission.name}
              </div>
              <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>
                Destination: {PORTS[state.activeMission.targetPort]?.name}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {canFinish && (
                  <Btn v="green" onClick={() => dispatch({ type: A.COMPLETE_MISSION })}>
                    Complete Mission
                  </Btn>
                )}
                <Btn v="ghost" sm onClick={() => dispatch({ type: A.ABANDON_MISSION })}>
                  Abandon
                </Btn>
              </div>
              {!canFinish && (
                <div style={{ color: T.textDim, fontSize: 10, marginTop: 6 }}>
                  Sail to {PORTS[state.activeMission.targetPort]?.name} to complete.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Ship status ── */}
        <div style={panelStyle()}>
          <SectionTitle>⚓ {state.ship.name}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <StatBlock label="Class" value={SHIPS[state.ship.type].name} />
            <StatBlock label="Cannons" value={effectiveShipStats.cannons} /> {/* Use effective cannons */}
            <StatBlock label="Speed" value={effectiveShipStats.speed} /> {/* Use effective speed */}
            <StatBlock label="Crew" value={`${state.crew.current}/${state.crew.max}`} />
          </div>
          <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>HULL</div>
          <Bar value={state.ship.hull} max={effectiveShipStats.maxHull}
            color={state.ship.hull / effectiveShipStats.maxHull < 0.3 ? T.redBr : T.greenBr} h={10} />
          {state.ship.upgrades.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
              {state.ship.upgrades.map(u => (
                <Pill key={u} label={UPGRADES[u]?.name ?? u} color={T.blueBr} />
              ))}
            </div>
          )}
        </div>

        {/* ── Log ── */}
        <div style={panelStyle({ display: "flex", flexDirection: "column", maxHeight: 220, overflow: "auto" })}>
          <SectionTitle>CAPTAIN'S LOG</SectionTitle>
          <LogList entries={state.log} />
        </div>
      </div>
    );
  }

  // ── MAP SCREEN ───────────────────────────────────────────────────────
  function MapScreen({ state, dispatch }) {
    const [hov, setHov] = useState(null);
    const W = 760, H = 460;

    return (
      <div style={{
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        overflow: "hidden",
        minHeight: "100%"
      }}>
        {/* EXPLICIT BACK BUTTON (plain HTML, no dependencies) */}
        <button
          onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })}
          style={{
            alignSelf: "flex-start",
            background: T.panel,
            border: `1px solid ${T.gold}`,
            color: T.gold,
            padding: "6px 12px",
            borderRadius: 3,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: T.font,
            marginBottom: 10
          }}
        >
          ← Back to Port
        </button>

        <div style={{
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          overflow: "hidden",
          flex: 1,
          minHeight: 400
        }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{
            width: "100%",
            height: "100%",
            display: "block",
            background: T.bgDeep,
            minHeight: 400
          }}>
            <defs>
              <pattern id="seaGrid" width="50" height="25" patternUnits="userSpaceOnUse">
                <path d="M0 12 Q12 7 25 12 Q38 17 50 12" stroke="#080f1a" strokeWidth="0.8" fill="none" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#seaGrid)" />

            {/* Connections */}
            {Object.entries(PORTS).map(([k, p]) =>
              Object.entries(PORTS).filter(([k2]) => k2 > k).map(([k2, p2]) => {
                const d = Math.hypot(p.x - p2.x, p.y - p2.y);
                return d < 230
                  ? <line key={k+k2} x1={p.x} y1={p.y} x2={p2.x} y2={p2.y} stroke="#0d1e2e" strokeWidth="0.8" />
                  : null;
              })
            )}

            {/* Active mission route */}
            {state.activeMission && (() => {
              const fr = PORTS[state.currentPort];
              const to = PORTS[state.activeMission.targetPort];
              return fr && to
                ? <line x1={fr.x} y1={fr.y} x2={to.x} y2={to.y}
                    stroke={T.gold} strokeWidth="1" strokeDasharray="6,4" opacity="0.35" />
                : null;
            })()}

            {/* Port markers */}
            {Object.entries(PORTS).map(([key, p]) => {
              const isCur = key === state.currentPort;
              const isHov = hov === key;
              const fColor = FACTIONS[p.faction]?.color ?? T.textDim;
              const days = L.travelDays(state.currentPort, key, state);
              const rep = state.reputation[key] ?? 20;
              return (
                <g key={key}
                  onClick={() => !isCur && dispatch({ type: A.SAIL_TO, port: key })}
                  onMouseEnter={() => setHov(key)}
                  onMouseLeave={() => setHov(null)}
                  style={{ cursor: isCur ? "default" : "pointer" }}
                >
                  {(isCur || isHov) && (
                    <circle cx={p.x} cy={p.y} r={20} fill={isCur ? T.gold : fColor} opacity="0.10" />
                  )}
                  {isCur && (
                    <circle cx={p.x} cy={p.y} r={14} fill="none"
                      stroke={T.gold} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />
                  )}
                  <circle cx={p.x} cy={p.y} r={isCur ? 8 : 5}
                    fill={isCur ? T.gold : fColor} stroke={T.bgDeep} strokeWidth="2" />
                  {isCur && (
                    <text x={p.x} y={p.y - 18} textAnchor="middle" fontSize="12" fill={T.gold}>⚓</text>
                  )}
                  <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize="8"
                    fill={isCur || isHov ? T.text : T.textDim} fontFamily={T.font}>
                    {p.name.toUpperCase()}
                  </text>
                  {isHov && !isCur && (
                    <>
                      <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize="8"
                        fill={T.gold} fontFamily={T.font}>{days} day{days !== 1 ? "s" : ""}</text>
                      <text x={p.x} y={p.y + 36} textAnchor="middle" fontSize="7"
                        fill={rep >= 40 ? T.greenBr : T.redBr} fontFamily={T.font}>
                        {L.reputationLabel(rep)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Wind rose */}
            <g transform="translate(724, 36)">
              <circle cx={0} cy={0} r={22} fill="#040c18" stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => (
                <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7"
                  fill={T.textDim} fontFamily={T.font}>{d}</text>
              ))}
              <g transform={`rotate(${state.wind.angle})`}>
                <line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" />
                <polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} />
              </g>
              <text x={0} y={32} textAnchor="middle" fontSize="7"
                fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(FACTIONS).map(([k, f]) => (
            <div key={k} style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.color }} />
              <span style={{ color: T.textDim, fontSize: 11 }}>{f.label}</span>
            </div>
          ))}
          <span style={{ color: T.textFaint, fontSize: 10, marginLeft: "auto" }}>
            Click a port to sail there · Hover to see distance & standing
          </span>
        </div>
      </div>
    );
  }

  // ── SAILING SCREEN ───────────────────────────────────────────────────
  function SailingScreen({ state, dispatch }) {
    const from = PORTS[state.currentPort] ?? { x: 380, y: 230 };
    const to = PORTS[state.destination] ?? { x: 380, y: 230 };
    const progress = state.sailingDaysTotal > 0
      ? 1 - (state.sailingDaysLeft / state.sailingDaysTotal) : 0;
    const shipX = from.x + (to.x - from.x) * progress;
    const shipY = from.y + (to.y - from.y) * progress;
    const hdgDeg = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const arrived = state.sailingDaysLeft <= 0;
    const W = 760, H = 460;

    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: T.gold, fontSize: 14 }}>
            ⛵ En route to{" "}
            <span style={{ color: T.text, fontWeight: "bold" }}>{PORTS[state.destination]?.name}</span>
          </div>
          <div style={{ color: T.textDim, fontSize: 12 }}>
            {arrived ? "Arrived — ready to dock" : `${state.sailingDaysLeft} day${state.sailingDaysLeft !== 1 ? "s" : ""} remaining`}
          </div>
        </div>

        {/* Top-down SVG view */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", flex: 1 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block", background: T.bgDeep }}>
            <defs>
              <pattern id="sailWaves" width="60" height="30" patternUnits="userSpaceOnUse">
                <path d="M0 15 Q15 8 30 15 Q45 22 60 15" stroke="#091520" strokeWidth="1" fill="none" />
                <path d="M0 26 Q15 20 30 26 Q45 32 60 26" stroke="#060e18" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#sailWaves)" />

            {/* Route */}
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={T.border} strokeWidth="1.5" strokeDasharray="8,6" />
            <line x1={from.x} y1={from.y} x2={shipX} y2={shipY}
              stroke={T.blueBr} strokeWidth="1" opacity="0.3" />

            {/* Origin */}
            <circle cx={from.x} cy={from.y} r={4} fill={T.textDim} />
            <text x={from.x} y={from.y - 10} textAnchor="middle" fontSize="8"
              fill={T.textDim} fontFamily={T.font}>
              {PORTS[state.currentPort]?.name?.toUpperCase()}
            </text>

            {/* Destination flag */}
            <circle cx={to.x} cy={to.y} r={7} fill="none" stroke={T.gold} strokeWidth="1.5" strokeDasharray="3,2" />
            <circle cx={to.x} cy={to.y} r={3} fill={T.gold} />
            <line x1={to.x} y1={to.y - 5} x2={to.x} y2={to.y - 22} stroke={T.gold} strokeWidth="1.5" />
            <polygon points={`${to.x},${to.y-22} ${to.x+10},${to.y-18} ${to.x},${to.y-14}`}
              fill={T.gold} opacity="0.85" />
            <text x={to.x} y={to.y + 16} textAnchor="middle" fontSize="8"
              fill={T.gold} fontFamily={T.font}>
              {PORTS[state.destination]?.name?.toUpperCase()}
            </text>

            {/* Ship sprite */}
            <g transform={`translate(${shipX},${shipY}) rotate(${hdgDeg})`}>
              <ellipse cx={0} cy={0} rx={20} ry={20} fill={T.gold} opacity="0.06" />
              <ellipse cx={0} cy={0} rx={13} ry={5} fill="#3a2a10" stroke={T.goldDim} strokeWidth="1" />
              <path d="M13,0 L19,-2 L19,2 Z" fill="#4a3418" />
              <ellipse cx={0} cy={0} rx={7} ry={3.5} fill={T.gold} opacity="0.6" />
              <circle cx={0} cy={0} r={1.8} fill={T.text} />
              <path d="M-13,0 Q-20,-3 -26,0 Q-20,3 -13,0"
                fill="none" stroke="#0d2840" strokeWidth="1.2" opacity="0.7" />
            </g>

            {/* Wind rose */}
            <g transform="translate(724, 40)">
              <circle cx={0} cy={0} r={22} fill="#040c18" stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => (
                <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7"
                  fill={T.textDim} fontFamily={T.font}>{d}</text>
              ))}
              <g transform={`rotate(${state.wind.angle})`}>
                <line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" />
                <polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} />
              </g>
              <text x={0} y={32} textAnchor="middle" fontSize="7"
                fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Btn
            onClick={() => dispatch({ type: A.ADVANCE_DAY })}
            disabled={arrived}
          >
            ▶ Advance Day
          </Btn>
          <Btn
            v="gold"
            onClick={() => dispatch({ type: A.ENTER_PORT })}
            disabled={!arrived}
          >
            ⚓ Enter Port
          </Btn>
          <span style={{ color: T.textDim, fontSize: 11 }}>
            {arrived
              ? `Anchored off ${PORTS[state.destination]?.name} — ready to dock`
              : `Wind ${state.wind.speed}kt at ${state.wind.angle}°${state.activeMission ? ` · Mission: ${state.activeMission.name}` : ""}`
            }
          </span>
        </div>
      </div>
    );
  }

  // ── SHIPYARD SCREEN ──────────────────────────────────────────────────
  function ShipyardScreen({ state, dispatch }) {
    const repCost = L.shipRepairCost(state);
    const currentShip = SHIPS[state.ship.type];
    const effectiveShipStats = L.getShipStats(state); // Get effective stats (includes upgrades)

    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        {/* EXPLICIT BACK BUTTON (plain HTML, no dependencies) */}
        <button
          onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })}
          style={{
            alignSelf: "flex-start",
            background: T.panel,
            border: `1px solid ${T.gold}`,
            color: T.gold,
            padding: "6px 12px",
            borderRadius: 3,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: T.font,
            marginBottom: 10
          }}
        >
          ← Back to Port
        </button>

        {/* Repair */}
        <div style={panelStyle()}>
          <SectionTitle>REPAIR VESSEL</SectionTitle>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>
                Hull: {state.ship.hull} / {effectiveShipStats.maxHull} {/* Use effective maxHull */}
              </div>
              <Bar value={state.ship.hull} max={effectiveShipStats.maxHull} color={T.greenBr} h={10} />
            </div>
            <Btn v="gold"
              onClick={() => dispatch({ type: A.REPAIR })}
              disabled={state.ship.hull >= effectiveShipStats.maxHull || state.gold < repCost}
            >
              Full Repair ({repCost}g)
            </Btn>
          </div>
        </div>

        {/* Ships for sale */}
        <SectionTitle>SHIPS FOR SALE</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {Object.entries(SHIPS).map(([key, s]) => {
            const isCur = key === state.ship.type;
            const canBuy = !isCur && state.gold >= s.cost;
            const lack = !isCur && state.gold < s.cost ? s.cost - state.gold : 0;
            return (
              <div key={key} style={panelStyle({
                background: isCur ? T.greenBg : T.panel,
                borderColor: isCur ? T.greenBr : T.border,
              })}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: T.text, fontSize: 13, fontWeight: "bold" }}>{s.name}</span>
                  {isCur ? <Pill label="Current" color={T.greenBr} />
                         : <span style={{ color: T.gold, fontSize: 12 }}>{s.cost.toLocaleString()}g</span>}
                </div>
                <p style={{ color: T.textDim, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{s.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>
                  {[["Crew",s.maxCrew],["Guns",s.cannons],["Spd",s.speed],["Hull",s.maxHull]].map(([l,v]) => (
                    <StatBlock key={l} label={l} value={v} />
                  ))}
                </div>
                {!isCur && (
                  <Btn sm v={canBuy ? "gold" : "ghost"}
                    onClick={() => dispatch({ type: A.BUY_SHIP, shipType: key })}
                    disabled={!canBuy}
                  >
                    {lack ? `Need ${lack.toLocaleString()}g more` : "Purchase"}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>

        {/* Upgrades */}
        {PORTS[state.currentPort]?.services.includes("upgrades") && (
          <>
            <SectionTitle>UPGRADES</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {currentShip.upgradeable.map(key => {
                const upg = UPGRADES[key];
                const installed = L.hasUpgrade(state, key);
                const canBuy = !installed && state.gold >= upg.cost;
                return (
                  <div key={key} style={panelStyle({
                    background: installed ? T.blueBg : T.panel,
                    borderColor: installed ? T.blueBr : T.border,
                  })}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: T.text, fontSize: 12, fontWeight: "bold" }}>{upg.name}</span>
                      {installed ? <Pill label="Installed" color={T.blueBr} />
                                 : <span style={{ color: T.gold, fontSize: 11 }}>{upg.cost.toLocaleString()}g</span>}
                    </div>
                    <p style={{ color: T.textDim, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{upg.desc}</p>
                    {!installed && (
                      <Btn sm v={canBuy ? "default" : "ghost"}
                        onClick={() => dispatch({ type: A.BUY_UPGRADE, upgradeKey: key })}
                        disabled={!canBuy}
                      >
                        {state.gold < upg.cost ? `Need ${(upg.cost - state.gold).toLocaleString()}g more` : "Install"}
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── CREW SCREEN ──────────────────────────────────────────────────────
  function CrewScreen({ state, dispatch }) {
    const open = SHIPS[state.ship.type].maxCrew - state.crew.current;
    const happy = Math.round(state.crew.current * state.crew.morale / 100);

    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        {/* EXPLICIT BACK BUTTON (plain HTML, no dependencies) */}
        <button
          onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })}
          style={{
            alignSelf: "flex-start",
            background: T.panel,
            border: `1px solid ${T.gold}`,
            color: T.gold,
            padding: "6px 12px",
            borderRadius: 3,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: T.font,
            marginBottom: 10
          }}
        >
          ← Back to Port
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Stats */}
          <div style={panelStyle()}>
            <SectionTitle>ROSTER</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <StatBlock label="Aboard" value={`${state.crew.current}/${state.crew.max}`} />
              <StatBlock label="Berths Free" value={open} />
              <StatBlock label="Morale" value={`${state.crew.morale}%`}
                color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} />
              <StatBlock label="Daily Wage" value={`${state.crew.current * 2}g`} />
            </div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>MORALE</div>
            <Bar value={state.crew.morale} max={100}
              color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} h={10} />
            {state.crew.morale < 50 && (
              <div style={{ color: T.redBr, fontSize: 10, marginTop: 6 }}>
                ⚠ Low morale weakens combat effectiveness
              </div>
            )}
            <div style={{ marginTop: 10 }}>
              <Btn
                v="green"
                onClick={() => dispatch({ type: A.RAISE_MORALE })}
                disabled={state.gold < state.crew.current * 5 || state.crew.morale >= 100}
              >
                🍻 Buy Drinks ({state.crew.current * 5}g) +5 Morale
              </Btn>
            </div>
          </div>

          {/* Hire */}
          <div style={panelStyle()}>
            <SectionTitle>HIRE</SectionTitle>
            <p style={{ color: T.textDim, fontSize: 10, marginBottom: 10, lineHeight: 1.5 }}>
              50g per sailor. Your {SHIPS[state.ship.type].name} holds {state.crew.max}.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 5, 10].map(n => (
                <Btn key={n} v="green"
                  onClick={() => dispatch({ type: A.HIRE_CREW, count: n })}
                  disabled={open < 1 || state.gold < n * 50}
                >
                  +{n} ({n * 50}g)
                </Btn>
              ))}
            </div>
            {open === 0 && <EmptyState message="Ship is at full capacity." />}
          </div>

          {/* Manifest */}
          <div style={{ ...panelStyle(), gridColumn: "1 / -1" }}>
            <SectionTitle>MANIFEST</SectionTitle>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {Array.from({ length: Math.min(state.crew.current, 60) }).map((_, i) => (
                <div key={i} style={{
                  width: 26, height: 26, borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                  background: i < happy ? T.greenBg : "#1e1008",
                  border: `1px solid ${i < happy ? T.green : T.red}`,
                }}>
                  {["⚓","🗡","🔧","🍖"][i % 4]}
                </div>
              ))}
              {state.crew.current > 60 && (
                <div style={{ color: T.textDim, fontSize: 10, alignSelf: "center" }}>
                  +{state.crew.current - 60} more
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FACTIONS SCREEN ──────────────────────────────────────────────────
  function FactionsScreen({ state, dispatch }) {
    const portsByFaction = Object.entries(PORTS).reduce((acc, [key, p]) => {
      if (!acc[p.faction]) acc[p.faction] = [];
      acc[p.faction].push({ key, ...p });
      return acc;
    }, {});

    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        {/* EXPLICIT BACK BUTTON (plain HTML, no dependencies) */}
        <button
          onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })}
          style={{
            alignSelf: "flex-start",
            background: T.panel,
            border: `1px solid ${T.gold}`,
            color: T.gold,
            padding: "6px 12px",
            borderRadius: 3,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: T.font,
            marginBottom: 10
          }}
        >
          ← Back to Port
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {Object.entries(portsByFaction).map(([faction, ports]) => {
            const fac = FACTIONS[faction];
            const avgRep = Math.round(ports.reduce((s, p) => s + (state.reputation[p.key] ?? 20), 0) / ports.length);
            return (
              <div key={faction} style={panelStyle({ borderColor: fac.color + "60" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: fac.color, fontSize: 13, fontWeight: "bold" }}>{fac.label}</span>
                  <RepPill rep={avgRep} />
                </div>
                {ports.map(p => {
                  const rep = state.reputation[p.key] ?? 20;
                  const repColor = rep >= 60 ? T.greenBr : rep >= 30 ? T.gold : T.redBr;
                  return (
                    <div key={p.key} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: T.text, fontSize: 11 }}>{p.name}</span>
                        <span style={{ color: repColor, fontSize: 10 }}>{rep}</span>
                      </div>
                      <Bar value={rep} max={100} color={repColor} h={5} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1.6 }}>
          Reputation decays slowly toward neutral over time. Complete missions, aid distressed
          ships, or parley with faction vessels to improve standing. Attacking their ships
          will anger all ports of that faction.
        </p>
      </div>
    );
  }

  // ── EVENT SCREEN ─────────────────────────────────────────────────────
  function EventScreen({ state, dispatch }) {
    const ev = state.activeEvent;
    if (!ev) return null;

    const typeColor = {
      hazard: T.redBr,
      choice: T.gold,
      reward: T.greenBr,
      crew: T.blueBr,
      faction: T.purpleBr,
    };

    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        flex: 1, padding: 20,
        background: `radial-gradient(ellipse at 50% 40%, #0a1828 0%, ${T.bg} 70%)`,
      }}>
        <div style={{ ...panelStyle({ maxWidth: 500, width: "100%" }), borderColor: typeColor[ev.type] ?? T.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Pill label={ev.type} color={typeColor[ev.type] ?? T.textDim} />
            <span style={{ color: T.textDim, fontSize: 10 }}>Day {state.day}</span>
          </div>
          <div style={{ color: T.gold, fontSize: 17, fontWeight: "bold", marginBottom: 8 }}>
            {ev.title}
          </div>
          <p style={{ color: T.text, fontSize: 12, marginBottom: 20, lineHeight: 1.6 }}>
            {ev.desc}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ev.choices.map((c, i) => (
              <div key={i}
                onClick={() => dispatch({ type: A.RESOLVE_EVENT, choiceIndex: i })}
                style={{
                  ...panelStyle({ background: T.panelAlt, cursor: "pointer", transition: "border-color 0.15s" }),
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.borderBr}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <div style={{ color: T.text, fontSize: 12, fontWeight: "bold", marginBottom: 3 }}>
                  {c.label}
                </div>
                <div style={{ color: T.textDim, fontSize: 10 }}>{c.outcome.log}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── BATTLE SCREEN ────────────────────────────────────────────────────

const InterceptScreen = ({ state, dispatch }) => {
  const { T, Btn, Bar, panelStyle } = window.UI;
  const { SHIPS } = window.D;
  const { A } = window.E;
  const ctx = state.encounterContext;

  if (!ctx) return null;

  const { enemy, flavourText, options } = ctx;
  const enemyShip = SHIPS[enemy.ship] || {};

  const Option = ({ actionType, label, sublabel, reason, available, v = "default" }) => (
    <div style={{ marginBottom: 8 }}>
      <Btn
        v={available ? v : "ghost"}
        disabled={!available}
        onClick={() => dispatch({ type: actionType })}
        style={{ width: "100%", textAlign: "left", opacity: available ? 1 : 0.45 }}
      >
        {label}
        {sublabel && (
          <span style={{ color: T.gold, marginLeft: 8, fontSize: 10 }}>{sublabel}</span>
        )}
      </Btn>
      {!available && reason && (
        <div style={{ color: T.textFaint, fontSize: 10, marginTop: 2, marginLeft: 4 }}>
          ✗ {reason}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      padding: 20,
      maxWidth: 560,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 14,
    }}>
      <div style={{ color: T.gold, fontSize: 16, fontWeight: "bold", letterSpacing: "0.08em" }}>
        ⚠ ENCOUNTER
      </div>

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
        <div style={{ display: "flex", gap: 16 }}>
          {[
            ["Hull",    `${enemy.hull}/${enemy.maxHull || enemy.hull}`],
            ["Cannons", enemy.cannons],
            ["Crew",    enemy.crew],
            ["Speed",   enemyShip.speed ?? "?"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ color: T.textDim, fontSize: 9 }}>{label}</div>
              <div style={{ color: T.text,    fontSize: 13 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <Bar value={enemy.hull} max={enemy.maxHull || enemy.hull} color={T.redBr} h={6} />
        </div>
      </div>

      <div style={panelStyle()}>
        <div style={{ color: T.textDim, fontSize: 10, marginBottom: 10, letterSpacing: "0.08em" }}>
          CHOOSE YOUR RESPONSE:
        </div>

        <Option
          actionType={A.INTERCEPT_FIGHT}
          label="⚔  Engage"
          available={true}
          reason={null}
          v="red"
        />
        <Option
          actionType={A.INTERCEPT_FLEE}
          label="💨  Attempt to Flee"
          sublabel={options.flee.available
            ? `Speed check: you ${options.flee.speedCheck.player} vs ${options.flee.speedCheck.enemy}`
            : null}
          available={options.flee.available}
          reason={options.flee.reason}
        />
        <Option
          actionType={A.INTERCEPT_PARLEY}
          label="🤝  Parley"
          sublabel={options.parley.available ? `Rep: ${state.reputation[state.destination ?? state.currentPort] ?? 0}` : null}
          available={options.parley.available}
          reason={options.parley.reason}
        />
        <Option
          actionType={A.INTERCEPT_BRIBE}
          label="💰  Bribe"
          sublabel={options.bribe.available ? `Cost: ${options.bribe.cost}g` : null}
          available={options.bribe.available}
          reason={options.bribe.reason}
          v="gold"
        />
        <Option
          actionType={A.INTERCEPT_SURRENDER}
          label="🏳  Surrender"
          available={options.surrender.available}
          reason={options.surrender.reason}
          v="ghost"
        />
      </div>
    </div>
  );
};


  function BattleScreen({ state, dispatch }) {
    const bs = state.battleState;
    if (!bs) return null;
    const done = ["victory","defeat","fled"].includes(bs.phase);
    const playerPct = bs.playerHull / SHIPS[state.ship.type].maxHull;
    const enemyPct = bs.enemyHull / bs.enemy.hull;

    return (
      <div style={{
        padding: 14, maxWidth: 680, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: 12,
        overflowY: "auto", flex: 1,
      }}>
        <div style={{
          textAlign: "center", color: T.redBr, fontSize: 16,
          fontWeight: "bold", letterSpacing: "0.1em",
        }}>
          ⚔ NAVAL BATTLE — ROUND {bs.round}
        </div>

        {/* VS bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 10, alignItems: "center" }}>
          <div style={panelStyle({ borderColor: T.blueBr })}>
            <div style={{ color: T.blueBr, fontSize: 10, marginBottom: 4 }}>{state.ship.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>
              Hull: {bs.playerHull} / {SHIPS[state.ship.type].maxHull}
            </div>
            <Bar value={bs.playerHull} max={SHIPS[state.ship.type].maxHull}
              color={playerPct < 0.3 ? T.redBr : T.greenBr} h={10} />
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>
              {state.crew.current} crew · {L.getShipStats(state).cannons}  cannons
            </div>
            {state.ship.upgrades.length > 0 && (
              <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {state.ship.upgrades.map(u => <Pill key={u} label={UPGRADES[u]?.name ?? u} color={T.blueBr} />)}
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", color: T.redBr, fontSize: 22 }}>⚡</div>

          <div style={panelStyle({ borderColor: T.red })}>
            <div style={{ color: T.redBr, fontSize: 10, marginBottom: 4 }}>{bs.enemy.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>
              Hull: {bs.enemyHull} / {bs.enemy.hull}
            </div>
            <Bar value={bs.enemyHull} max={bs.enemy.hull} color={T.redBr} h={10} />
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>
              {bs.enemyCrew} crew · {bs.enemy.cannons} cannons
            </div>
            <div style={{ marginTop: 5 }}>
              <FactionPill faction={bs.enemy.faction} />
            </div>
          </div>
        </div>

        {/* Battle log */}
        <div style={{ ...panelStyle({ background: T.bgDeep, maxHeight: 130, overflowY: "auto" }) }}>
          {[...bs.log].reverse().map((e, i) => (
            <div key={i} style={{ color: i === 0 ? T.text : T.textDim, fontSize: 11, marginBottom: 3, lineHeight: 1.4 }}>
              {e}
            </div>
          ))}
        </div>

        {/* Actions */}
        {!done ? (
          <div>
            <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>CHOOSE YOUR ACTION:</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { a: "broadside", label: "🔥 Broadside", desc: "Full cannon volley. Reliable damage." },
                { a: "precision", label: "🎯 Precision", desc: "Aimed shot. Miss or massive damage." },
                { a: "grapple", label: "⚔ Grapple", desc: "Board them. Requires crew advantage." },
                { a: "evade", label: "💨 Evade", desc: "Flee if faster. Reduced incoming fire." },
              ].map(({ a, label, desc }) => (
                <div key={a}
                  onClick={() => dispatch({ type: A.BATTLE_ACTION, action: a })}
                  style={{ ...panelStyle({ background: T.panelAlt, cursor: "pointer", transition: "border-color 0.15s" }) }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.borderBr}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                >
                  <div style={{ color: T.text, fontSize: 12, fontWeight: "bold", marginBottom: 2 }}>{label}</div>
                  <div style={{ color: T.textDim, fontSize: 10 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{
              color: bs.phase === "victory" ? T.greenBr : bs.phase === "fled" ? T.gold : T.redBr,
              fontSize: 20, fontWeight: "bold", marginBottom: 8, letterSpacing: "0.08em",
            }}>
              {bs.phase === "victory" ? "⚓ VICTORY!" : bs.phase === "fled" ? "🌊 ESCAPED" : "💀 DEFEATED"}
            </div>
            {bs.phase === "victory" && (
              <div style={{ color: T.gold, fontSize: 13, marginBottom: 14 }}>
                {bs.goldReward > 0 && <span style={{ color: T.gold, fontSize: 13, marginBottom: 14 }}>+{bs.goldReward} gold</span>}
              </div>
            )}
            <Btn v="gold" onClick={() => dispatch({ type: A.DISMISS_BATTLE })}>
              {bs.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
                ? "Continue Voyage"
                : bs.returnScreen === "arrive" && state.destination
                  ? "Enter Port"
                  : "Return to Port"}
            </Btn>
          </div>
        )}
      </div>
    );
  }

  return {
    StartScreen,
    PortScreen,
    MapScreen,
    SailingScreen,
    ShipyardScreen,
    CrewScreen,
    FactionsScreen,
    EventScreen,
    InterceptScreen,
    BattleScreen,
  };
})();