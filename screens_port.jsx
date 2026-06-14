// screens_port.jsx — Port-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip  } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // ---- TITLE SCREEN -----------------------------------------------------------------------

  function TitleScreen({ dispatch }) {
    const hasSave = L.hasSave();
    const importRef = React.useRef(null);
    const [tutorialEnabled, setTutorialEnabled] = React.useState(() => L.loadTutorialState().enabled);
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    const localStorageWarning = React.useMemo(() => !L.checkLocalStorageAvailable(), []);

    const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => dispatch({ type: A.IMPORT_SAVE, fileContent: reader.result });
      reader.readAsText(file);
      e.target.value = "";
    };

    const toggleTutorial = (checked) => {
      setTutorialEnabled(checked);
      const ts = L.loadTutorialState();
      ts.enabled = checked;
      if (checked) {
        ts.seen = { ...L.getDefaultTutorialState().seen };
      }
      L.saveTutorialState(ts);
    };

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: T.spacing.xl,
        background: `radial-gradient(ellipse at 50% 60%, #0a1e38 0%, ${T.bg} 70%)`,
      }}>
        <div style={{ color: T.gold, fontSize: 32, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4, textShadow: `0 0 30px ${T.goldDim}` }}>⚓ Broadside</div>
        <div style={{ color: T.textDim, fontSize: 11, letterSpacing: "0.15em", marginBottom: 36 }}>CARIBBEAN · 1695</div>

        <div style={{ display: "flex", flexDirection: "column", gap: T.spacing.md, width: 280 }}>

          <Tooltip text="Begin a new adventure. Choose your captain and ship.">
            <Btn v="gold" style={{ width: "100%" }} onClick={() => dispatch({ type: A.NAVIGATE, screen: "start" })}>▶ New Game</Btn>
          </Tooltip>

          {hasSave && (
            <Tooltip text="Continue your most recent voyage from where you left off.">
              <Btn v="ghost"  style={{ width: "100%" }} onClick={() => dispatch({ type: A.LOAD_GAME })}>↩ Continue</Btn>
            </Tooltip>
          )}

          <input
            type="file"
            accept=".broadside"
            ref={importRef}
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <Tooltip text="Load an adventure from a saved file.">
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => importRef.current?.click()}>📂 Import Save</Btn>
          </Tooltip>
          <label style={{ color: T.textDim, fontSize: 10, marginTop: 16, textAlign: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={tutorialEnabled} onChange={e => toggleTutorial(e.target.checked)} style={{ marginRight: 6 }} />
            Show tutorial hints
          </label>

          {localStorageWarning && (
            <div style={{ color: T.redBr, fontSize: 9, textAlign: "center", marginTop: 8 }}>
              Browser storage is blocked. Use Import/Export Save to keep your progress.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SCENARIO SCREEN ─────────────────────────────────────────────────────
  function ScenarioScreen({ dispatch }) {
    const hasSave = L.hasSave();
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    const visibleStarts = isDebug ? STARTS : STARTS.filter(s => s.id !== 'debug');

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: T.spacing.xl,
        background: `radial-gradient(ellipse at 50% 60%, #0a1e38 0%, ${T.bg} 70%)`,
      }}>
        <div style={{ color: T.gold, fontSize: 32, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4, textShadow: `0 0 30px ${T.goldDim}` }}>⚓ Broadside</div>
        <div style={{ color: T.textDim, fontSize: 11, letterSpacing: "0.15em", marginBottom: 36 }}>CARIBBEAN · 1695</div>


        <p style={{ color: T.textDim, fontSize: 12, fontStyle: "italic", marginBottom: 20, textAlign: "center" }}>
          Every story begins with a choice. What kind of captain will you be?
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(90vw, 280px), 1fr))", gap: T.spacing.md, maxWidth: 640, width: "100%", marginBottom: 20 }}>
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
              <div style={{ color: T.gold, fontSize: T.heading3FontSize, fontWeight: "bold", marginBottom: 2 }}>{s.name}</div>
              <div style={{ color: T.textDim, fontSize: 10, fontStyle: "italic", marginBottom: 8 }}>{s.tagline}</div>
              <p style={{ color: T.text, fontSize: 10, marginBottom: 8, lineHeight: 1.5 }}>{s.story}</p>
              {s.starterMission && (
                  <div style={panelStyle({ background: "T.greenBg", borderColor: T.greenBr, padding: 6, marginBottom: 8 })}>
                  <div style={{ color: T.greenBr, fontSize: 9, marginBottom: 2 }}>OPENING QUEST</div>
                  <div style={{ color: T.text, fontSize: 10, fontWeight: "bold" }}>{s.starterMission.name}</div>
                  <div style={{ color: T.textDim, fontSize: 9 }}>{s.starterMission.description}</div>
                </div>
              )}
              <div style={{ display: "flex", gap: T.spacing.md, flexWrap: "wrap", fontSize: 10, color: T.textDim }}>
                <span>💰 {s.gold}g</span>
                <span>👥 {s.crewCount} crew</span>
                <span>🍖 8 food · 💧 8 water</span>
                <span style={{ color: T.greenBr }}>{Object.entries(s.repAdjust || {}).map(([f, d]) => `${f} ${d >= 0 ? '+' : ''}${d}`).join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PORT SCREEN ──────────────────────────────────────────────────────
  function PortScreen({ state, dispatch }) {
    const port = PORTS[state.currentPort];
    const rep = state.reputation[state.currentPort] ?? 0;
    const perk = L.getRepPerk(rep);
    const repCost = Math.floor(L.shipRepairCost(state) * (perk.repairMult || 1));
    const canFinish = state.activeMission && (!state.activeMission.targetPort || state.currentPort === state.activeMission.targetPort);
    const importRef = React.useRef(null);

    const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => dispatch({ type: A.IMPORT_SAVE, fileContent: reader.result });
      reader.readAsText(file);
      e.target.value = "";
    };

    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("port"));

    const [isNarrow, setIsNarrow] = React.useState(window.innerWidth < 700);
    React.useEffect(() => {
      const handleResize = () => setIsNarrow(window.innerWidth < 700);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
      <div style={{
        display: "flex",
        flexDirection: isNarrow ? "column" : "row",
        gap: T.spacing.md,
        padding: T.spacing.lg,
        overflowY: "auto",
        flex: 1,
        alignItems: "stretch",
      }}>
        {showTutorial && (
          <TutorialPopup
            title="Welcome to Port"
            onDismiss={(disableAll) => {
              markTutorialSeen("port", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>This is where you'll plan your next move. From here you can:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>Accept missions from the <strong>Mission Board</strong> — they pay gold and build your fame</li>
              <li>Buy and sell goods at the <strong>Market</strong> — buy cheap, sell dear</li>
              <li><strong>Hire crew</strong> and buy them drinks to keep morale up</li>
              <li><strong>Repair your ship</strong> at the Shipyard</li>
              <li>Read the <strong>gossip</strong> — the locals know more than they let on</li>
            </ul>
            <p>Your first mission is already accepted. Open the <strong>Map</strong> to set sail.</p>
          </TutorialPopup>
        )}

        {/* ── Column 1: Atmosphere, Actions & Missions ─────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: T.spacing.md,
          minWidth: 280,
          overflowY: "auto",
        }}>
          {/* Port header + description + gossip */}
          <div style={panelStyle()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ color: T.gold, fontSize: T.heading1FontSize, fontWeight: "bold" }}>{port.name}</div>
                <div style={{ color: FACTIONS[port.faction]?.color, fontSize: 10, letterSpacing: "0.1em" }}>
                  {FACTIONS[port.faction]?.label.toUpperCase()} PORT
                </div>
              </div>
              <RepPill rep={rep} />
            </div>

            <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, margin: "0 0 10px", lineHeight: T.narrativeLineHeight }}>
              {port.desc}
            </p>

            {state.portGossip?.length > 0 && (
              <NarrativePanel title="🗣 WORD ON THE DOCKS" variant="gossip">
                {state.portGossip.map((line, i) => (
                  <NarrativeLine key={i}>{line}</NarrativeLine>
                ))}
              </NarrativePanel>
            )}

            {perk.servicesBlocked && (
              <EmptyState message="⚔ You are at war with this port. No faction will deal with you here." />
            )}
          </div>

          {/* Action buttons */}
          <div style={panelStyle()}>
  <SectionTitle>ACTIONS</SectionTitle>
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
    <Tooltip text="Open your chart and choose your next destination.">
      <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })}>🗺 World Map</Btn>
    </Tooltip>
    <Tooltip text="Review your standing with the factions of the Caribbean.">
      <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "status" })}>📊 Status</Btn>
    </Tooltip>
    <Tooltip text="Buy, sell, and trade goods in the port market.">
      <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "market" })}>📦 Market</Btn>
    </Tooltip>
    <Tooltip text="Read the log of your voyages, battles, and discoveries.">
      <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "journal" })}>📖 Journal</Btn>
    </Tooltip>
  </div>
  {!perk.servicesBlocked && (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {port.services.includes("shipyard") && (
          <Tooltip text="Repair, upgrade, or purchase a new vessel.">
            <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "shipyard" })}>⚓ Shipyard</Btn>
          </Tooltip>
        )}
        {port.services.includes("crew") && (
          <Tooltip text="Hire new hands or boost morale with a round of drinks.">
            <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "crew" })}>👥 Crew</Btn>
          </Tooltip>
        )}
      </div>
      {port.services.includes("shipyard") && state.ship.hull < L.getShipStats(state).maxHull && (
        <Tooltip text="Patch up your hull before the next voyage.">
          <Btn v="gold" onClick={() => dispatch({ type: A.REPAIR })} disabled={state.gold < repCost}>
            Quick Repair ({repCost}g)
          </Btn>
        </Tooltip>
      )}
    </>
  )}
  <div style={{ marginTop: 8 }}>
    <Tooltip text="Record your progress against the perils of the sea.">
      <Btn v="ghost" sm onClick={() => dispatch({ type: A.SAVE_GAME })}>💾 Save Game</Btn>
    </Tooltip>
  </div>
  {L.hasSave() && (
    <Tooltip text="Return to a previous record of your journey.">
      <Btn v="ghost" sm onClick={() => dispatch({ type: A.LOAD_GAME })} style={{ marginTop: 4 }}>
        💾 Load Game
      </Btn>
    </Tooltip>
  )}
  <div style={{ marginTop: 8 }}>
    <Tooltip text="Save your adventure to a file for safekeeping.">
      <Btn v="ghost" sm onClick={() => dispatch({ type: A.EXPORT_SAVE })}>📤 Export Save</Btn>
    </Tooltip>
    <Tooltip text="Load an adventure from a file.">
      <Btn v="ghost" sm onClick={() => importRef.current?.click()}>📥 Import Save</Btn>
    </Tooltip>
  </div>
  <input
    type="file"
    accept=".broadside"
    ref={importRef}
    style={{ display: "none" }}
    onChange={handleImport}
  />
  <div style={{ marginTop: 8 }}>
    
  </div>
</div>

          {/* Mission board */}
          <div style={panelStyle({ display: "flex", flexDirection: "column", flex: 1 })}>
            <SectionTitle action={
              <Tooltip text="Check for new missions posted at this port.">
                <Btn sm v="ghost" onClick={() => dispatch({ type: A.REFRESH_MISSIONS })}>Refresh</Btn>
              </Tooltip>
            }>
              MISSION BOARD
            </SectionTitle>
            {perk.tier !== "neutral" && (
              <div style={{ color: perk.missionMult > 1 ? T.greenBr : T.gold, fontSize: 10, marginBottom: 8 }}>
                {perk.missionMult > 1
                  ? `★ ${perk.tier} standing: +${Math.round((perk.missionMult - 1) * 100)}% mission rewards`
                  : `⚠ Hostile standing: −${Math.round((1 - perk.missionMult) * 100)}% mission rewards`}
              </div>
            )}
            {state.activeMission && (
              <div style={panelStyle({ background: "T.greenBg", borderColor: T.greenBr, marginTop: 6 })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: T.greenBr, fontSize: 11, fontWeight: "bold" }}>ACTIVE: {state.activeMission.name}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Pill label={state.activeMission.faction} color={FACTIONS[state.activeMission.faction]?.color ?? T.textDim} />
                    <Pill label={state.activeMission.risk} color={T.riskColor?.[state.activeMission.risk] ?? T.textDim} />
                  </div>
                </div>
                <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>
                {state.activeMission.description}
              </div>
                <div style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>Destination: {PORTS[state.activeMission.targetPort]?.name || "At sea"}</div>
                <div style={{ display: "flex", gap: T.spacing.md, marginBottom: 8 }}>
                  <span style={{ color: T.gold, fontSize: 11 }}>💰 {state.activeMission.gold}</span>
                  <span style={{ color: T.blueBr, fontSize: 11 }}>★ {state.activeMission.fame}</span>
                </div>
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
                <div style={{ display: "flex", gap: T.spacing.sm }}>
                  {canFinish && (
                    <Tooltip text="Complete the mission and claim your reward.">
                      <Btn v="gold" onClick={() => dispatch({ type: A.COMPLETE_MISSION })}
                        disabled={state.activeMission.requiredGood && (state.hold?.items?.[state.activeMission.requiredGood] || 0) < state.activeMission.requiredQty}>
                        Complete Mission
                      </Btn>
                    </Tooltip>
                  )}
                  <Tooltip text="Abandon your current mission. You will lose reputation with the issuing faction.">
                  <Btn v="ghost" sm onClick={() => dispatch({ type: A.ABANDON_MISSION })}>Abandon</Btn>
                </Tooltip>
                </div>
                {!canFinish && (
                  <div style={{ color: T.textDim, fontSize: 10, marginTop: 6 }}>
                    Sail to {PORTS[state.activeMission.targetPort]?.name} to complete.
                  </div>
                )}
              </div>
            )}
            {!port.services.includes("missions") ? (
              <EmptyState message="No mission board in this port." />
            ) : state.missions.length === 0 ? (
              <EmptyState message="No missions posted. Try refreshing." />
            ) : (
              <div style={{ overflowY: "auto", flex: 1 }}>
                {state.missions.map((m, i) => (
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
                    {(m.requiredGood && m.requiredQty) && (() => {
                      const res = window.D.RESOURCES[m.requiredGood];
                      const inHold = state.hold?.items?.[m.requiredGood] || 0;
                      const alreadyHave = inHold >= m.requiredQty;
                      const partialHave = inHold > 0 && inHold < m.requiredQty;
                      const isIllegal = res?.illegal;
                      const holdFree = (L.getHoldCapacity(state) || 0) - L.getHoldUsed(state.hold?.items || {});
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
                      <Tooltip text="Take this mission as your active objective.">
                      <Btn sm v="gold" disabled={!!state.activeMission} onClick={() => dispatch({ type: A.TAKE_MISSION, mission: m })}>Accept</Btn>
                    </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>

        {/* ── Column 2: Captain's Log ──────────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 240,
        }}>
          <div style={panelStyle({ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" })}>
            <SectionTitle>CAPTAIN'S LOG</SectionTitle>
            <LogList entries={state.log} />
          </div>
        </div>
      </div>
    );
  }


  // ── STATUS SCREEN ────────────────────────────────────────────────────
  function StatusScreen({ state, dispatch }) {
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("status"));
    const portsByFaction = Object.entries(PORTS).reduce((acc, [key, p]) => { if (!acc[p.faction]) acc[p.faction] = []; acc[p.faction].push({ key, ...p }); return acc; }, {});
    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <Tooltip text="Return to the harbour.">
        <BackButton dispatch={dispatch} />
        </Tooltip>
        {showTutorial && (
          <TutorialPopup
            title="Your Standing"
            onDismiss={(disableAll) => {
              markTutorialSeen("status", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>This is where your reputation is tracked — with factions, ports, and the law.</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li><strong>Fame</strong> — earned through missions. Gates better ships, equipments, and hidden port discoveries.</li>
              <li><strong>Infamy</strong> — earned through crime. High infamy blocks bribes and attracts bounty hunters.</li>
              <li><strong>Faction Alerts</strong> — short‑term heat from combat and smuggling. Decays over time.</li>
              <li><strong>Port Reputation</strong> — per‑port standing from Allied to At War. Affects prices and services.</li>
            </ul>
            <p>The Caribbean remembers what you do.</p>
          </TutorialPopup>
        )}
        <div style={panelStyle()}>
          <SectionTitle>CAPTAIN'S STANDING</SectionTitle>
          <p style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic", marginBottom: 8 }}>
            The Caribbean keeps a ledger. Your name is written in it—for better or worse.
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: T.gold, fontSize: T.heading1FontSize }}>★ {state.fame}</div>
              <div style={{ color: T.textDim, fontSize: 12 }}>{L.getFameInfo(state.fame).label}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint, fontSize: T.heading1FontSize }}>☠ {state.infamy ?? 0}</div>
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
                <div key={factionKey} style={panelStyle({ background: T.panelAlt, padding: T.spacing.sm, borderLeft: `3px solid ${fac.color}` })}>
                <div style={{ color: fac.color, fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>{fac.label}</div>
                <div style={{ color: T.textDim, fontSize: 10 }}>{fac.rivalFactions?.length ? `Rivals: ${fac.rivalFactions.map(r => FACTIONS[r]?.label ?? r).join(", ")}` : "No known rivals"}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={panelStyle()}>
          <SectionTitle>⚠ FACTION ALERT STATUS</SectionTitle>
          {Object.entries(FACTIONS).map(([factionKey, fac]) => {
            const level = state.factionAlerts?.[factionKey] || 0;
            if (level === 0) return null;
            const label = L.getHeatLabel(level);
            return (
              <div key={factionKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: fac.color, fontSize: 12 }}>
                  {fac.label}
                </span>
                <span style={{ color: T.redBr, fontSize: 12, fontWeight: "bold" }}>
                  {label} ({level}/10)
                </span>
                <div style={{ flex: 1, marginLeft: 10 }}>
                  <Bar value={level} max={10} color={fac.color} h={8} />
                </div>
              </div>
            );
          })}
          {Object.values(state.factionAlerts || {}).every(v => v === 0) && (
            <div style={{ color: T.textDim, fontSize: 11 }}>No factions are actively hunting you.</div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: T.spacing.md }}>
          {Object.entries(portsByFaction).map(([faction, ports]) => {
            const fac = FACTIONS[faction];
            const avgRep = Math.round(ports.reduce((s, p) => s + (state.reputation[p.key] ?? 20), 0) / ports.length);
            return (
              <div key={faction} style={panelStyle({ borderColor: fac.color + "60" })}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: fac.color, fontSize: T.heading3FontSize, fontWeight: "bold" }}>{fac.label}</span>
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

  // ── JOURNAL SCREEN ──────────────────────────────────────────────────
  function JournalScreen({ state, dispatch }) {
    const [filterTab, setFilterTab] = useState("all");
    const [search, setSearch] = useState("");
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("journal"));

    // Parse log entries
    const parsed = state.log.map(entry => {
      const match = entry.match(/^\[(\d+)\]\s*(.*)/);
      const day = match ? parseInt(match[1], 10) : null;
      const text = match ? match[2] : entry;
      return { day, text, raw: entry, tab: L.getLogTabCategory(text) };
    });

    // Apply category filter
    let filtered = parsed;
    if (filterTab !== "all") {
      filtered = filtered.filter(e => e.tab === filterTab);
    }

    // Apply search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(e => e.text.toLowerCase().includes(query));
    }

    // Reverse chronological order (most recent first)
    filtered = [...filtered].reverse();

    // Group by day for rendering
    let lastDay = null;

    const tabs = [
      { key: "all", label: "All" },
      { key: "crew", label: "Crew" },
      { key: "combat", label: "Combat" },
      { key: "ports", label: "Ports" },
      { key: "missions", label: "Missions" },
      { key: "trade", label: "Trade" },
    ];

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <Tooltip text="Return to the harbour.">
          <BackButton dispatch={dispatch} />
        </Tooltip>
        {showTutorial && (
          <TutorialPopup
            title="Your Captain's Journal"
            onDismiss={(disableAll) => {
              markTutorialSeen("journal", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>Everything that has happened on this voyage is recorded here — battles, arrivals, crew events, trades, and discoveries.</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>Use the <strong>tabs</strong> to filter by category: Crew, Combat, Ports, Missions, or Trade.</li>
              <li>Use the <strong>search bar</strong> to find a specific crew member, port, or event by name.</li>
              <li>Entries are <strong>grouped by day</strong> — scroll back to relive the story of your run.</li>
            </ul>
            <p>The journal is the story of your career. The longer you sail, the richer it becomes.</p>
          </TutorialPopup>
        )}

        <SectionTitle>📖 CAPTAIN'S JOURNAL</SectionTitle>
        <p style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic", marginBottom: 8 }}>
        Every storm, every battle, every whispered secret—recorded here for posterity.
      </p>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {tabs.map(tab => (
            <Btn
              key={tab.key}
              sm
              v={filterTab === tab.key ? "gold" : "ghost"}
              onClick={() => setFilterTab(tab.key)}
            >
              {tab.label}
            </Btn>
          ))}
        </div>

        {/* Search bar */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="🔍 Search journal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              background: T.panel,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 3,
              fontSize: 11,
              fontFamily: T.font,
              outline: "none",
            }}
          />
          {search && (
            <div style={{ color: T.textFaint, fontSize: 9, marginTop: 4, textAlign: "right" }}>
              {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} found
            </div>
          )}
        </div>

        {/* Entries */}
        <div style={{ ...panelStyle(), flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <EmptyState message="No entries found." />
          ) : (
            filtered.map((entry, i) => {
              const showDay = entry.day !== null && entry.day !== lastDay;
              lastDay = entry.day;
              return (
                <React.Fragment key={i}>
                  {showDay && (
                    <div style={{
                      color: T.textFaint,
                      fontSize: 9,
                      borderBottom: `1px solid ${T.borderFaint}`,
                      marginTop: 12,
                      marginBottom: 6,
                      paddingBottom: 2,
                    }}>
                      Day {entry.day}
                    </div>
                  )}
                  <div style={{
                    fontSize: T.narrativeFontSize,
                    color: T.textDim,
                    lineHeight: T.narrativeLineHeight,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                  }}>
                    <span>{entry.text}</span>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── EXPORT ALL SCREENS ──────────────────────────────────────────────
  Object.assign(window.S, {
    TitleScreen,
    ScenarioScreen,
    PortScreen,
    StatusScreen,
    JournalScreen,
  });
})();