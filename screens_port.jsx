// screens_port.jsx — Port-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, UPGRADES, STARTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.S;

  // ── START SCREEN ─────────────────────────────────────────────────────
  function StartScreen({ dispatch }) {
    const hasSave = L.hasSave();
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    const visibleStarts = isDebug ? STARTS : STARTS.filter(s => s.id !== 'debug');

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: 20,
        background: `radial-gradient(ellipse at 50% 60%, #0a1e38 0%, ${T.bg} 70%)`,
      }}>
        <div style={{ color: T.gold, fontSize: 32, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4, textShadow: `0 0 30px ${T.goldDim}` }}>⚓ Broadside</div>
        <div style={{ color: T.textDim, fontSize: 11, letterSpacing: "0.15em", marginBottom: 36 }}>CARIBBEAN · 1695</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(90vw, 280px), 1fr))", gap: 12, maxWidth: 640, width: "100%", marginBottom: 20 }}>
          {visibleStarts.map(s => (
            <div key={s.id}
              onClick={() => dispatch({ type: A.START_GAME, scenarioId: s.id })}
              style={{
                ...panelStyle({ cursor: "pointer", transition: "border-color 0.15s" }),
                borderLeft: `3px solid ${FACTIONS[s.faction]?.color ?? T.gold}`,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.gold}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ color: FACTIONS[s.faction]?.color ?? T.gold, fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
                {FACTIONS[s.faction]?.label?.toUpperCase()} · {s.ship?.toUpperCase()}
              </div>
              <div style={{ color: T.gold, fontSize: 14, fontWeight: "bold", marginBottom: 2 }}>{s.name}</div>
              <div style={{ color: T.textDim, fontSize: 10, fontStyle: "italic", marginBottom: 8 }}>{s.tagline}</div>
              <p style={{ color: T.text, fontSize: 10, marginBottom: 8, lineHeight: 1.5 }}>{s.story}</p>
              {s.starterMission && (
                <div style={{ background: "#081a10", border: `1px solid ${T.greenBr}`, borderRadius: 3, padding: 6, marginBottom: 8 }}>
                  <div style={{ color: T.greenBr, fontSize: 9, marginBottom: 2 }}>OPENING QUEST</div>
                  <div style={{ color: T.text, fontSize: 10, fontWeight: "bold" }}>{s.starterMission.name}</div>
                  <div style={{ color: T.textDim, fontSize: 9 }}>{s.starterMission.description}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 10, color: T.textDim }}>
                <span>💰 {s.gold}g</span>
                <span>👥 {s.crewCount} crew</span>
                <span>🍖 8 food · 💧 8 water</span>
                <span style={{ color: T.greenBr }}>{Object.entries(s.repAdjust || {}).map(([f, d]) => `${f} ${d >= 0 ? '+' : ''}${d}`).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>

        {hasSave && (<Btn v="gold" onClick={() => dispatch({ type: A.LOAD_GAME })}>↩ Continue Saved Game</Btn>)}
      </div>
    );
  }

  // ── PORT SCREEN ──────────────────────────────────────────────────────
  function PortScreen({ state, dispatch }) {
    const port = PORTS[state.currentPort];
    const rep = state.reputation[state.currentPort] ?? 0;
    const perk = L.getRepPerk(rep);
    const repCost = Math.floor(L.shipRepairCost(state) * (perk.repairMult || 1));
    const effectiveShipStats = L.getShipStats(state);
    const canFinish = state.activeMission && (!state.activeMission.targetPort || state.currentPort === state.activeMission.targetPort);

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, padding: 14, overflowY: "auto", flex: 1 }}>
        {/* Port card */}
        <div style={panelStyle()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ color: T.gold, fontSize: 17, fontWeight: "bold" }}>{port.name}</div>
              <div style={{ color: FACTIONS[port.faction]?.color, fontSize: 10, letterSpacing: "0.1em" }}>{FACTIONS[port.faction]?.label.toUpperCase()} PORT</div>
            </div>
            <RepPill rep={rep} />
          </div>
          <p style={{ color: T.textDim, fontSize: 11, margin: "0 0 10px", lineHeight: 1.5 }}>{port.desc}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>{port.services.map(s => <Pill key={s} label={s} />)}</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })}>🗺 World Map</Btn>
            <Btn v="ghost" onClick={() => dispatch({ type: A.NAVIGATE, screen: "status" })}>📊 Status</Btn>
            <Btn onClick={() => dispatch({ type: A.ENTER_MARKET })}>📦 Market</Btn>
          </div>

          {!perk.servicesBlocked && (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {port.services.includes("shipyard") && <Btn v="ghost" onClick={() => dispatch({ type: A.NAVIGATE, screen: "shipyard" })}>⚓ Shipyard</Btn>}
                {port.services.includes("crew") && <Btn v="ghost" onClick={() => dispatch({ type: A.NAVIGATE, screen: "crew" })}>👥 Crew</Btn>}
              </div>
              {port.services.includes("shipyard") && state.ship.hull < SHIPS[state.ship.type].maxHull && (
                <div style={{ marginTop: 10 }}>
                  <Btn v="gold" onClick={() => dispatch({ type: A.REPAIR })} disabled={state.gold < repCost}>Quick Repair ({repCost}g)</Btn>
                </div>
              )}
            </>
          )}
          {perk.servicesBlocked && <EmptyState message="⚔ You are at war with this port. No faction will deal with you here." />}
          <div style={{ marginTop: 10 }}><Btn v="ghost" sm onClick={() => dispatch({ type: A.SAVE_GAME })}>💾 Save Game</Btn></div>
        </div>

        {/* Mission board */}
        <div style={panelStyle({ display: "flex", flexDirection: "column" })}>
          <SectionTitle action={<Btn sm v="ghost" onClick={() => dispatch({ type: A.REFRESH_MISSIONS })}>Refresh</Btn>}>MISSION BOARD</SectionTitle>
          {perk.tier !== "neutral" && (
            <div style={{ color: perk.missionMult > 1 ? T.greenBr : T.gold, fontSize: 10, marginBottom: 8 }}>
              {perk.missionMult > 1 ? `★ ${perk.tier} standing: +${Math.round((perk.missionMult - 1) * 100)}% mission rewards` : `⚠ Hostile standing: −${Math.round((1 - perk.missionMult) * 100)}% mission rewards`}
            </div>
          )}
          {!port.services.includes("missions") ? <EmptyState message="No mission board in this port." /> :
           state.missions.length === 0 ? <EmptyState message="No missions posted. Try refreshing." /> :
           state.missions.map((m, i) => (
             <div key={i} style={{ ...panelStyle({ background: T.panelAlt, marginBottom: 8 }), opacity: state.activeMission ? 0.55 : 1 }}>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                 <span style={{ color: T.text, fontSize: 12, fontWeight: "bold" }}>{m.name}</span>
                 <div style={{ display: "flex", gap: 4 }}>
                   <Pill label={m.faction} color={FACTIONS[m.faction]?.color ?? T.textDim} />
                   <Pill label={m.risk} color={T.riskColor?.[m.risk] ?? T.textDim} />
                 </div>
               </div>
               <p style={{ color: T.textDim, fontSize: 10, margin: "0 0 6px", lineHeight: 1.4 }}>{m.description || m.desc}</p>
               {m.enemy && (
                 <div style={{ color: T.textDim, fontSize: 10, margin: "0 0 6px" }}>
                   Enemy: {m.enemy.name} — {m.enemy.cannons} cannons, hull {m.enemy.hull}, crew {m.enemy.crew}
                 </div>
               )}
               {/* ── Cargo requirement block (trade & smuggle) ── */}
               {(m.requiredGood && m.requiredQty) && (() => {
                 const res = window.D.RESOURCES[m.requiredGood];
                 const inHold = state.hold?.items?.[m.requiredGood] || 0;
                 const alreadyHave = inHold >= m.requiredQty;
                 const partialHave = inHold > 0 && inHold < m.requiredQty;
                 const isIllegal = res?.illegal;
                 const holdFree = (state.hold?.capacity || 0) - L.getHoldUsed(state.hold?.items || {});
                 const canFit = holdFree >= (m.requiredQty - inHold);

                 return (
                   <div style={{
                     margin: "0 0 6px", padding: "5px 8px", borderRadius: 3,
                     background: T.bgDeep,
                     border: `1px solid ${isIllegal ? T.red + "55" : T.border}`,
                   }}>
                     <div style={{ fontSize: 10, color: isIllegal ? T.red : T.textDim, marginBottom: 2 }}>
                       {m.type === "smuggle" ? "⚠ Contraband required" : "Cargo required"}
                     </div>
                     <div style={{ fontSize: 11, color: isIllegal ? T.red : T.text }}>
                       {m.requiredQty} × {res?.name || m.requiredGood}
                       {isIllegal && <span style={{ color: T.red, fontSize: 10 }}> (Illegal)</span>}
                     </div>
                     <div style={{ fontSize: 10, marginTop: 3 }}>
                       {alreadyHave
                         ? <span style={{ color: T.greenBr }}>✓ In hold ({inHold} — ready to deliver)</span>
                         : partialHave
                           ? <span style={{ color: T.gold }}>{inHold}/{m.requiredQty} in hold — need {m.requiredQty - inHold} more</span>
                           : <span style={{ color: T.textDim }}>Not yet sourced — check market or source elsewhere</span>
                       }
                     </div>
                     {!alreadyHave && !canFit && (
                       <div style={{ fontSize: 10, color: T.redBr, marginTop: 2 }}>
                         ⚠ Only {holdFree} hold space free — sell cargo first
                       </div>
                     )}
                     {m.type === "smuggle" && res?.sourceHint && (
                       <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2, fontStyle: "italic" }}>
                         {res.sourceHint}
                       </div>
                     )}
                     {m.type === "trade" && (
                       <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>
                         Est. cost: ~{res?.basePrice * m.requiredQty}g
                         · Payment on delivery: {m.gold}g
                         · Est. profit: ~{m.gold - res?.basePrice * m.requiredQty}g
                       </div>
                     )}
                     {m.type === "smuggle" && (
                       <div style={{ fontSize: 10, color: T.red, marginTop: 2 }}>
                         +{m.infamyGain} infamy on completion
                         {m.requiredGood === "slaves" ? " · +1 infamy on purchase" : ""}
                       </div>
                     )}
                   </div>
                 );
               })()}
               <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                 <span style={{ color: T.gold, fontSize: 11 }}>💰 {m.gold}</span>
                 <span style={{ color: T.blueBr, fontSize: 11 }}>★ {m.fame}</span>
                 <span style={{ color: T.textDim, fontSize: 10 }}>→ {PORTS[m.targetPort]?.name}</span>
                 <Btn sm v="gold" disabled={!!state.activeMission} onClick={() => dispatch({ type: A.TAKE_MISSION, mission: m })}>Accept</Btn>
               </div>
             </div>
           ))
          }
          {state.activeMission && (
            <div style={panelStyle({ background: "#081a10", borderColor: T.greenBr, marginTop: 6 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: T.greenBr, fontSize: 11, fontWeight: "bold" }}>ACTIVE: {state.activeMission.name}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Pill label={state.activeMission.faction} color={FACTIONS[state.activeMission.faction]?.color ?? T.textDim} />
                  <Pill label={state.activeMission.risk} color={T.riskColor?.[state.activeMission.risk] ?? T.textDim} />
                </div>
              </div>
              <div style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Destination: {PORTS[state.activeMission.targetPort]?.name || "At sea"}</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <span style={{ color: T.gold, fontSize: 11 }}>💰 {state.activeMission.gold}</span>
                <span style={{ color: T.blueBr, fontSize: 11 }}>★ {state.activeMission.fame}</span>
              </div>
              {/* ── Cargo status for trade/smuggle ── */}
              {state.activeMission.requiredGood && state.activeMission.requiredQty && (() => {
                const res = window.D.RESOURCES[state.activeMission.requiredGood];
                const inHold = state.hold?.items?.[state.activeMission.requiredGood] || 0;
                const hasGoods = inHold >= state.activeMission.requiredQty;
                const goodName = res?.name || state.activeMission.requiredGood;
                return (
                  <div style={{ marginBottom: 8, fontSize: 10 }}>
                    <div style={{ color: hasGoods ? T.greenBr : T.redBr }}>
                      {hasGoods
                        ? `✓ ${inHold} ${goodName} in hold — ready`
                        : `✗ ${inHold}/${state.activeMission.requiredQty} ${goodName} — visit market`}
                    </div>
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 8 }}>
                {canFinish && (
                  <Btn
                    v="gold"
                    onClick={() => dispatch({ type: A.COMPLETE_MISSION })}
                    disabled={
                      state.activeMission.requiredGood &&
                      (state.hold?.items?.[state.activeMission.requiredGood] || 0) < state.activeMission.requiredQty
                    }
                  >
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

        {/* Ship status */}
        <div style={panelStyle()}>
          <SectionTitle>⚓ {state.ship.name}</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <StatBlock label="Class" value={SHIPS[state.ship.type].name} />
            <StatBlock label="Cannons" value={effectiveShipStats.cannons} />
            <StatBlock label="Speed" value={effectiveShipStats.speed} />
            <StatBlock label="Crew" value={`${state.crew.roster.length}/${state.crew.max}`} />
          </div>
          <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>HULL</div>
          <Bar value={state.ship.hull} max={effectiveShipStats.maxHull} color={state.ship.hull / effectiveShipStats.maxHull < 0.3 ? T.redBr : T.greenBr} h={10} />
          {state.ship.upgrades.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
              {state.ship.upgrades.map(u => <Pill key={u} label={UPGRADES[u]?.name ?? u} color={T.blueBr} />)}
            </div>
          )}
        </div>

        {/* Captain's Log */}
        <div style={panelStyle({ display: "flex", flexDirection: "column", maxHeight: 220, overflow: "auto" })}>
          <SectionTitle>CAPTAIN'S LOG</SectionTitle>
          <LogList entries={state.log} />
        </div>
      </div>
    );
  }

  // ── SHIPYARD SCREEN ──────────────────────────────────────────────────
  function ShipyardScreen({ state, dispatch }) {
    const perk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
    if (perk.servicesBlocked) {
      return (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
          <button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })} style={{ alignSelf: "flex-start", background: T.panel, border: `1px solid ${T.gold}`, color: T.gold, padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>← Back to Port</button>
          <EmptyState message="⚔ You are at war with this port. No shipyard services available." />
        </div>
      );
    }
    const repCost = Math.floor(L.shipRepairCost(state) * (perk.repairMult || 1));
    const currentShip = SHIPS[state.ship.type];
    const effectiveShipStats = L.getShipStats(state);

    // --- new local state for comparison ---
    const [comparing, setComparing] = React.useState(null);

    // --- helper to render stat rows with arrows ---
function renderShipStats(shipType, compareType) {
  const s = SHIPS[shipType];
  const c = compareType ? SHIPS[compareType] : null;
  const stats = [
    ["Hull", s.maxHull],
    ["Cannons", s.cannons],
    ["Crew", s.maxCrew],
    ["Hold", s.holdCapacity],
    ["Speed", s.speed],
    ["Max days at sea", s.maxDays],   // changed
  ];
  return stats.map(([label, val]) => {
    let arrow = "";
    let color = T.text;
    if (c) {
      const diff = val - (
        c[label === "Hull" ? "maxHull" :
          label === "Crew" ? "maxCrew" :
          label === "Hold" ? "holdCapacity" :
          label === "Max days at sea" ? "maxDays" :   // explicit mapping
          label.toLowerCase()]
      );
      if (diff > 0) { arrow = " ↑"; color = T.greenBr; }
      else if (diff < 0) { arrow = " ↓"; color = T.redBr; }
      else { arrow = " ="; color = T.textDim; }
    }
    return (
      <div key={label} style={{ fontSize: 11, color, marginBottom: 2 }}>
        {label}: {val}{arrow}
      </div>
    );
  });
}
    // --- end new helper ---

    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        <button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })} style={{ alignSelf: "flex-start", background: T.panel, border: `1px solid ${T.gold}`, color: T.gold, padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>← Back to Port</button>
        <div style={panelStyle()}>
          <SectionTitle>REPAIR VESSEL</SectionTitle>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Hull: {state.ship.hull} / {effectiveShipStats.maxHull}</div>
              <Bar value={state.ship.hull} max={effectiveShipStats.maxHull} color={T.greenBr} h={10} />
            </div>
            <Btn v="gold" onClick={() => dispatch({ type: A.REPAIR })} disabled={state.ship.hull >= effectiveShipStats.maxHull || state.gold < repCost}>Full Repair ({repCost}g)</Btn>
          </div>
        </div>
        <SectionTitle>SHIPS FOR SALE</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
          {Object.entries(SHIPS).map(([key, s]) => {
            const isCur = key === state.ship.type;
            const shipReq = L.meetsRequirement(state, s);
            const canBuy = !isCur && shipReq.allowed && state.gold >= s.cost;
            const lack = !isCur && shipReq.allowed && state.gold < s.cost ? s.cost - state.gold : 0;
            const isComparing = comparing === key; // highlight selected
            return (
              <div key={key}
                onClick={() => setComparing(isComparing ? null : key)}
                style={{
                  ...panelStyle({
                    background: isCur ? T.greenBg : T.panel,
                    borderColor: isCur ? T.greenBr : (isComparing ? T.gold : T.border),
                  }),
                  opacity: shipReq.allowed ? 1 : 0.55,
                  cursor: 'pointer', // make whole card feel clickable
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: T.text, fontSize: 13, fontWeight: "bold" }}>{s.name}</span>
                  {isCur ? <Pill label="Current" color={T.greenBr} /> : <span style={{ color: T.gold, fontSize: 12 }}>{s.cost.toLocaleString()}g</span>}
                </div>
                <p style={{ color: T.textDim, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{s.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, marginBottom: 8 }}>
                  {[["Crew",s.maxCrew],["Guns",s.cannons],["Spd",s.speed],["Hull",s.maxHull]].map(([l,v]) => <StatBlock key={l} label={l} value={v} />)}
                </div>
                {!shipReq.allowed && <div style={{ color: T.gold, fontSize: 10, marginBottom: 6 }}>🔒 {shipReq.reason}</div>}
                {!isCur && <Btn sm v={canBuy ? "gold" : "ghost"} onClick={(e) => { e.stopPropagation(); dispatch({ type: A.BUY_SHIP, shipType: key }); }} disabled={!canBuy}>{!shipReq.allowed ? "Locked" : lack ? `Need ${lack.toLocaleString()}g more` : "Purchase"}</Btn>}
              </div>
            );
          })}
        </div>

        {/* --- new comparison panel --- */}
        {comparing && (
          <div style={panelStyle({ marginTop: 12 })}>
            <SectionTitle>SHIP COMPARISON</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ color: T.textDim, fontSize: 10, marginBottom: 6 }}>Current: {currentShip.name}</div>
                {renderShipStats(state.ship.type, null)}
              </div>
              <div>
                <div style={{ color: T.gold, fontSize: 10, marginBottom: 6 }}>{SHIPS[comparing].name}</div>
                {renderShipStats(comparing, state.ship.type)}
              </div>
            </div>
            <Btn sm onClick={() => setComparing(null)} style={{ marginTop: 8 }}>Close comparison</Btn>
          </div>
        )}
        {/* --- end comparison panel --- */}

        {PORTS[state.currentPort]?.services.includes("upgrades") && (
          <>
            <SectionTitle>UPGRADES</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {currentShip.upgradeable.map(key => {
                const upg = UPGRADES[key];
                const installed = L.hasUpgrade(state, key);
                const upgradeReq = L.meetsRequirement(state, upg);
                const canBuy = !installed && upgradeReq.allowed && state.gold >= upg.cost;
                return (
                  <div key={key} style={panelStyle({ background: installed ? T.blueBg : T.panel, borderColor: installed ? T.blueBr : T.border, opacity: upgradeReq.allowed ? 1 : 0.55 })}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: T.text, fontSize: 12, fontWeight: "bold" }}>{upg.name}</span>
                      {installed ? <Pill label="Installed" color={T.blueBr} /> : <span style={{ color: T.gold, fontSize: 11 }}>{upg.cost.toLocaleString()}g</span>}
                    </div>
                    <p style={{ color: T.textDim, fontSize: 10, margin: "0 0 8px", lineHeight: 1.4 }}>{upg.desc}</p>
                    {!upgradeReq.allowed && <div style={{ color: T.gold, fontSize: 10, marginBottom: 6 }}>🔒 {upgradeReq.reason}</div>}
                    {!installed && <Btn sm v={canBuy ? "default" : "ghost"} onClick={() => dispatch({ type: A.BUY_UPGRADE, upgradeKey: key })} disabled={!canBuy}>{!upgradeReq.allowed ? "Locked" : state.gold < upg.cost ? `Need ${(upg.cost - state.gold).toLocaleString()}g more` : "Install"}</Btn>}
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
    const perk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
    if (perk.servicesBlocked) {
      return (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
          <button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })} style={{ alignSelf: "flex-start", background: T.panel, border: `1px solid ${T.gold}`, color: T.gold, padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>← Back to Port</button>
          <EmptyState message="⚔ You are at war with this port. No crew services available." />
        </div>
      );
    }
    const open = SHIPS[state.ship.type].maxCrew - state.crew.roster.length;
    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        <button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })} style={{ alignSelf: "flex-start", background: T.panel, border: `1px solid ${T.gold}`, color: T.gold, padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>← Back to Port</button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <div style={panelStyle()}>
            <SectionTitle>ROSTER</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <StatBlock label="Aboard" value={`${state.crew.roster.length}/${state.crew.max}`} />
              <StatBlock label="Berths Free" value={open} />
              <StatBlock label="Morale" value={`${state.crew.morale}%`} color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} />
              <StatBlock label="Daily Wage" value={`${state.crew.roster.length * 2}g`} />
            </div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>MORALE</div>
            <Bar value={state.crew.morale} max={100} color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} h={10} />
            {state.crew.morale < 50 && <div style={{ color: T.redBr, fontSize: 10, marginTop: 6 }}>⚠ Low morale weakens combat effectiveness</div>}
            <div style={{ marginTop: 10 }}>
              <Btn v="green" onClick={() => dispatch({ type: A.RAISE_MORALE })} disabled={state.gold < state.crew.roster.length * 5 || state.crew.morale >= 100}>🍻 Buy Drinks ({state.crew.roster.length * 5}g) +5 Morale</Btn>
            </div>
          </div>
          <div style={panelStyle()}>
            <SectionTitle>HIRE</SectionTitle>
            <p style={{ color: T.textDim, fontSize: 10, marginBottom: 10, lineHeight: 1.5 }}>50g per sailor. Your {SHIPS[state.ship.type].name} holds {state.crew.max}.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 5, 10].map(n => <Btn key={n} v="green" onClick={() => dispatch({ type: A.HIRE_CREW, count: n })} disabled={open < 1 || state.gold < n * 50}>+{n} ({n * 50}g)</Btn>)}
            </div>
            {open === 0 && <EmptyState message="Ship is at full capacity." />}
          </div>
          <div style={{ ...panelStyle(), gridColumn: "1 / -1" }}>
            <SectionTitle>MANIFEST</SectionTitle>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {state.crew.roster.map(member => {
                const roleIcon = { deckhand: "⚓", gunner: "🗡", cook: "🍖", carpenter: "🔧", navigator: "🧭" }[member.role] ?? "👤";
                return (
                  <div key={member.id} title={`${member.firstName} ${member.lastName} · ${member.role} · ${member.faction}`} style={{ width: 26, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, background: T.panelAlt, border: `1px solid ${T.border}`, cursor: "default" }}>
                    {roleIcon}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STATUS SCREEN ────────────────────────────────────────────────────
  function StatusScreen({ state, dispatch }) {
    const portsByFaction = Object.entries(PORTS).reduce((acc, [key, p]) => { if (!acc[p.faction]) acc[p.faction] = []; acc[p.faction].push({ key, ...p }); return acc; }, {});
    return (
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", flex: 1 }}>
        <button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })} style={{ alignSelf: "flex-start", background: T.panel, border: `1px solid ${T.gold}`, color: T.gold, padding: "6px 12px", borderRadius: 3, cursor: "pointer", fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>← Back to Port</button>
        <div style={panelStyle()}>
          <SectionTitle>CAPTAIN'S STANDING</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: T.gold, fontSize: 18 }}>★ {state.fame}</div>
              <div style={{ color: T.textDim, fontSize: 12 }}>{L.getFameLabel(state.fame)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint, fontSize: 18 }}>☠ {state.infamy ?? 0}</div>
              <div style={{ color: T.textDim, fontSize: 12 }}>{L.getInfamyLabel(state.infamy ?? 0)}</div>
              {(state.infamy ?? 0) >= 10 && (
                <div style={{ color: T.textFaint, fontSize: 10, marginTop: 4, maxWidth: 200 }}>
                  {(state.infamy ?? 0) >= 100 ? "Every colonial faction considers you an enemy of civilisation." :
                   (state.infamy ?? 0) >= 50 ? "You cannot bribe your way past patrols." :
                   (state.infamy ?? 0) >= 25 ? "Bribe option will be unavailable above 50 infamy." :
                   "Coastal patrols are watching you more closely."}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={panelStyle()}>
          <SectionTitle>🤝 FACTION RELATIONS</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {Object.entries(FACTIONS).map(([factionKey, fac]) => (
              <div key={factionKey} style={{ background: T.panelAlt, padding: 8, borderRadius: 3, borderLeft: `3px solid ${fac.color}` }}>
                <div style={{ color: fac.color, fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>{fac.label}</div>
                <div style={{ color: T.textDim, fontSize: 10 }}>{fac.rivalFactions?.length ? `Rivals: ${fac.rivalFactions.map(r => FACTIONS[r]?.label ?? r).join(", ")}` : "No known rivals"}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {Object.entries(portsByFaction).map(([faction, ports]) => {
            const fac = FACTIONS[faction];
            const avgRep = Math.round(ports.reduce((s, p) => s + (state.reputation[p.key] ?? 20), 0) / ports.length);
            return (
              <div key={faction} style={panelStyle({ borderColor: fac.color + "60" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: fac.color, fontSize: 13, fontWeight: "bold" }}>{fac.label}</span>
                  <RepPill rep={avgRep} />
                </div>
                <div style={{ color: T.textDim, fontSize: 9, marginTop: 2 }}>
                  {avgRep >= 80 ? "20% repair · +20% missions" : avgRep >= 50 ? "10% repair · +10% missions" : avgRep >= 30 ? "−10% missions" : avgRep >= 10 ? "−25% missions" : "No services"}
                </div>
                {ports.map(p => {
                  const rep = state.reputation[p.key] ?? 20;
                  return (
                    <div key={p.key} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ color: T.text, fontSize: 11 }}>{p.name}</span><span style={{ color: rep >= 60 ? T.greenBr : rep >= 30 ? T.gold : T.redBr, fontSize: 10 }}>{rep}</span></div>
                      <Bar value={rep} max={100} color={rep >= 60 ? T.greenBr : rep >= 30 ? T.gold : T.redBr} h={10} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <p style={{ color: T.textDim, fontSize: 10, lineHeight: 1.6 }}>Reputation decays slowly toward neutral (50) over time. Complete missions, aid distressed ships, or parley with faction vessels to improve standing. Attacking their ships will anger all ports of that faction.</p>
      </div>
    );
  }

  // ── MARKET SCREEN ────────────────────────────────────────────────────
  const MarketScreen = ({ state, dispatch }) => {
    const market = state.portMarket;
    const portName = PORTS[state.currentPort]?.name || "Port";
    const [buyPending, setBuyPending] = useState({});
    const [sellPending, setSellPending] = useState({});

    if (!market) return (
      <div style={{ padding: 14 }}>
        <button onClick={() => dispatch({ type: A.LEAVE_MARKET })} style={{ background:T.panel, border:`1px solid ${T.gold}`, color:T.gold, padding:"6px 12px", borderRadius:3, cursor:"pointer", fontSize:12, fontFamily:T.font, marginBottom:10 }}>← Back to Port</button>
        <EmptyState message="No market data available for this port." />
      </div>
    );

    const holdItems = state.hold?.items || {};
    const capacity = state.hold?.capacity || 0;
    const previewItems = { ...holdItems };
    Object.entries(buyPending).forEach(([good, qty]) => { previewItems[good] = (previewItems[good] || 0) + (qty || 0); });
    Object.entries(sellPending).forEach(([good, qty]) => { previewItems[good] = (previewItems[good] || 0) - (qty || 0); });
    const used = L.getHoldUsed(previewItems);
    const loadPct = L.getHoldLoadPct(previewItems, capacity);
    const speedMult = L.getHoldSpeedMultiplier(loadPct);
    const goldDelta = Object.keys(market.goods).reduce((sum, good) => {
      const pg = market.goods[good];
      if (!pg) return sum;
      return sum + (sellPending[good] || 0) * pg.sellToPort - (buyPending[good] || 0) * pg.buyFromPort;
    }, 0);
    const hasPending = Object.values(buyPending).some(v => (v || 0) > 0) || Object.values(sellPending).some(v => (v || 0) > 0);

    const confirmTrade = () => {
      const buys = {}, sells = {};
      Object.entries(buyPending).forEach(([g, qty]) => { if (qty > 0) buys[g] = qty; });
      Object.entries(sellPending).forEach(([g, qty]) => { if (qty > 0) sells[g] = qty; });
      dispatch({ type: A.CONFIRM_TRADE, buys, sells });
      setBuyPending({}); setSellPending({});
    };

    const adjustBuy = (good, delta) => {
      setBuyPending(prev => {
        const cur = prev[good] || 0;
        const newVal = Math.max(0, cur + delta);
        const pg = market.goods[good];
        if (!pg) return prev;
        const freeSpace = capacity - used + (sellPending[good] || 0);
        const max = Math.min(pg.available, freeSpace + cur);
        return { ...prev, [good]: Math.min(newVal, max) };
      });
    };

    const adjustSell = (good, delta) => {
      setSellPending(prev => {
        const cur = prev[good] || 0;
        const newVal = Math.max(0, cur + delta);
        const max = (holdItems[good] || 0) + (buyPending[good] || 0);
        return { ...prev, [good]: Math.min(newVal, max) };
      });
    };

    // Exclude illegal goods from the main list
    const shownGoods = Object.keys(RESOURCES).filter(good => {
      if (good === "food" || good === "water") return true;
      const res = RESOURCES[good];
      if (res.illegal) return false;   // illegal goods moved to Black Market section
      return market.goods[good] || (holdItems[good] || 0) > 0;
    });

    return (
      <div style={{ padding: 14, overflowY: "auto", flex: 1 }}>
        <button onClick={() => dispatch({ type: A.LEAVE_MARKET })} style={{ background:T.panel, border:`1px solid ${T.gold}`, color:T.gold, padding:"6px 12px", borderRadius:3, cursor:"pointer", fontSize:12, fontFamily:T.font, marginBottom:10 }}>← Back to Port</button>

        <SectionTitle>⚓ MARKET — {portName}</SectionTitle>

        <div style={panelStyle({ marginBottom: 10 })}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textDim, marginBottom:4 }}>
            <span>Hold: {used} / {capacity}</span>
            <span>{Math.round(loadPct * 100)}% full</span>
          </div>
          <Bar value={used} max={capacity} color={loadPct > 0.75 ? T.redBr : T.greenBr} h={10} />
          {speedMult > 1 && (
            <div style={{ color: T.gold, fontSize: 10, marginTop: 4 }}>
              ⚠ Hold over 50% — voyages take {Math.round((speedMult - 1) * 100)}% longer.
            </div>
          )}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {shownGoods.map(good => {
            const res = RESOURCES[good];
            const pg = market.goods[good];
            const inHold = holdItems[good] || 0;
            const buyQty = buyPending[good] || 0;
            const sellQty = sellPending[good] || 0;
            const afterTrade = previewItems[good] || 0;
            const maxBuy = pg ? Math.min(pg.available, capacity - used + sellQty) : 0;
            const maxSell = inHold + buyQty;

            return (
              <div key={good} style={panelStyle({ background: T.panelAlt })}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                  <span style={{ color:T.text, fontSize:12, fontWeight:"bold" }}>
                    {res.name}
                    {res.illegal && <span style={{ color:T.red, fontSize:10, marginLeft:6 }}>(Illegal)</span>}
                  </span>
                  <span style={{ color:T.textDim, fontSize:10 }}>
                    In hold: {inHold} — {pg ? `Base: ${pg.basePrice}g  Buy: ${pg.buyFromPort}g  Sell: ${pg.sellToPort}g  Avail: ${pg.available}` : "Not traded here"}
                  </span>
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ color:T.textDim, fontSize:10, width:120 }}>Buy from port:</span>
                  <div style={{ display:"flex", gap:4, alignItems:"center", flexWrap:"wrap"  }}>
                    <Btn sm v="ghost" onClick={() => adjustBuy(good, -1)} disabled={buyQty <= 0}>-</Btn>
                    <input type="number" value={buyQty}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10) || 0;
                        const pg = market.goods[good];
                        if (!pg) return;
                        const freeSpace = capacity - used + sellQty;
                        const max = Math.min(pg.available, freeSpace);
                        setBuyPending(prev => ({ ...prev, [good]: Math.max(0, Math.min(v, max)) }));
                      }}
                      style={{ width:44, textAlign:"center", background:T.panel, border:`1px solid ${T.border}`, color:T.text, borderRadius:2, fontSize:11, fontFamily:T.font }}
                    />
                    <Btn sm v="ghost" onClick={() => adjustBuy(good, 1)} disabled={buyQty >= maxBuy}>+</Btn>
                  </div>
                  <span style={{ color:T.textDim, fontSize:9, width:80, textAlign:"right" }}>
                    cost: {pg ? pg.buyFromPort * buyQty : 0}g
                  </span>
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ color:T.textDim, fontSize:10, width:120 }}>Sell to port:</span>
                  <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    <Btn sm v="ghost" onClick={() => adjustSell(good, -1)} disabled={sellQty <= 0}>-</Btn>
                    <input type="number" value={sellQty}
                      onChange={e => {
                        const v = parseInt(e.target.value, 10) || 0;
                        const max = (holdItems[good] || 0) + buyQty;
                        setSellPending(prev => ({ ...prev, [good]: Math.max(0, Math.min(v, max)) }));
                      }}
                      style={{ width:44, textAlign:"center", background:T.panel, border:`1px solid ${T.border}`, color:T.text, borderRadius:2, fontSize:11, fontFamily:T.font }}
                    />
                    <Btn sm v="ghost" onClick={() => adjustSell(good, 1)} disabled={sellQty >= maxSell}>+</Btn>
                  </div>
                  <span style={{ color:T.textDim, fontSize:9, width:80, textAlign:"right" }}>
                    revenue: {pg ? pg.sellToPort * sellQty : 0}g
                  </span>
                </div>

                <div style={{ color:T.textDim, fontSize:9, marginTop:2 }}>
                  → After trade: {afterTrade} in hold
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Black Market section ─────────────────────────────────── */}
        {(() => {
          const illegalGoods = Object.keys(RESOURCES).filter(
            g => RESOURCES[g].illegal && (market.goods[g] || (holdItems[g] || 0) > 0)
          );
          if (illegalGoods.length === 0) return null;

          return (
            <div>
              <div style={{
                margin: "12px 0 6px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <div style={{ flex: 1, height: 1, background: T.red + "40" }} />
                <span style={{ color: T.red, fontSize: 10, letterSpacing: "0.1em" }}>
                  ⚠ BLACK MARKET
                </span>
                <div style={{ flex: 1, height: 1, background: T.red + "40" }} />
              </div>
              <div style={{ fontSize: 10, color: T.redBr, marginBottom: 8 }}>
                These goods are illegal. Carrying them risks inspection and seizure.
                {illegalGoods.includes("slaves") &&
                  " Purchasing slaves increases your infamy."}
              </div>
              {illegalGoods.map(good => {
                const res = RESOURCES[good];
                const pg = market.goods[good];
                const inHold = holdItems[good] || 0;
                const pBuy = buyPending[good] || 0;
                const pSell = sellPending[good] || 0;
                const afterTrade = previewItems[good] || 0;
                const maxBuy = pg ? Math.min(pg.available, capacity - used + pSell) : 0;
                const maxSell = inHold + pBuy;

                return (
                  <div key={good} style={panelStyle({ background: T.panelAlt, borderColor: T.red + "40" })}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                      <span style={{ color:T.text, fontSize:12, fontWeight:"bold" }}>
                        {res.name}
                        <span style={{ color:T.red, fontSize:10, marginLeft:6 }}>(Illegal)</span>
                      </span>
                      <span style={{ color:T.textDim, fontSize:10 }}>
                        In hold: {inHold} — {pg ? `Base: ${pg.basePrice}g  Buy: ${pg.buyFromPort}g  Sell: ${pg.sellToPort}g  Avail: ${pg.available}` : "Not traded here"}
                      </span>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ color:T.textDim, fontSize:10, width:120 }}>Buy from port:</span>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        <Btn sm v="ghost" onClick={() => adjustBuy(good, -1)} disabled={(buyPending[good]||0) <= 0}>-</Btn>
                        <input type="number" value={buyPending[good]||0}
                          onChange={e => {
                            const v = parseInt(e.target.value, 10) || 0;
                            const pg = market.goods[good];
                            if (!pg) return;
                            const freeSpace = capacity - used + (sellPending[good]||0);
                            const max = Math.min(pg.available, freeSpace);
                            setBuyPending(prev => ({ ...prev, [good]: Math.max(0, Math.min(v, max)) }));
                          }}
                          style={{ width:44, textAlign:"center", background:T.panel, border:`1px solid ${T.border}`, color:T.text, borderRadius:2, fontSize:11, fontFamily:T.font }}
                        />
                        <Btn sm v="ghost" onClick={() => adjustBuy(good, 1)} disabled={(buyPending[good]||0) >= maxBuy}>+</Btn>
                      </div>
                      <span style={{ color:T.textDim, fontSize:9, width:80, textAlign:"right" }}>
                        cost: {pg ? pg.buyFromPort * (buyPending[good]||0) : 0}g
                      </span>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ color:T.textDim, fontSize:10, width:120 }}>Sell to port:</span>
                      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                        <Btn sm v="ghost" onClick={() => adjustSell(good, -1)} disabled={(sellPending[good]||0) <= 0}>-</Btn>
                        <input type="number" value={sellPending[good]||0}
                          onChange={e => {
                            const v = parseInt(e.target.value, 10) || 0;
                            const max = (holdItems[good]||0) + (buyPending[good]||0);
                            setSellPending(prev => ({ ...prev, [good]: Math.max(0, Math.min(v, max)) }));
                          }}
                          style={{ width:44, textAlign:"center", background:T.panel, border:`1px solid ${T.border}`, color:T.text, borderRadius:2, fontSize:11, fontFamily:T.font }}
                        />
                        <Btn sm v="ghost" onClick={() => adjustSell(good, 1)} disabled={(sellPending[good]||0) >= maxSell}>+</Btn>
                      </div>
                      <span style={{ color:T.textDim, fontSize:9, width:80, textAlign:"right" }}>
                        revenue: {pg ? pg.sellToPort * (sellPending[good]||0) : 0}g
                      </span>
                    </div>

                    <div style={{ color:T.textDim, fontSize:9, marginTop:2 }}>
                      → After trade: {afterTrade} in hold
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {hasPending && (
          <div style={{ ...panelStyle(), marginTop: 10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ color: goldDelta >= 0 ? T.greenBr : T.redBr, fontSize:13 }}>
              {goldDelta >= 0 ? "+" : ""}{goldDelta}g
            </span>
            <div style={{ display:"flex", gap:8 }}>
              <Btn sm v="ghost" onClick={() => { setBuyPending({}); setSellPending({}); }}>Reset</Btn>
              <Btn sm v="gold" onClick={confirmTrade}>Confirm Trade</Btn>
            </div>
          </div>
        )}
      </div>
    );
  };

  Object.assign(window.S, { StartScreen, PortScreen, ShipyardScreen, CrewScreen, StatusScreen, MarketScreen });
})();