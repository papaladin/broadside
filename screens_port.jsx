// screens_port.jsx — Port-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, PulseBtn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip, QMPopup,
  IconMap, IconBarChart, IconMarket, IconJournal, IconAnchor, IconCrew, IconFloppy, IconFileTransfer, IconTalking, IconGold, IconSkull, IconHandshake, IconSearch, PortSilhouette } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;


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

  const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state,"port"));

  const [isNarrow, setIsNarrow] = React.useState(window.innerWidth < 700);
  React.useEffect(() => {
    const handleResize = () => setIsNarrow(window.innerWidth < 700);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Feature unlocking gates ──────────────────────────────────────
  const canContracts = true; // always available
  const canMarket = L.isFeatureUnlocked(state, 'market');
  const canNavigation = L.isFeatureUnlocked(state, 'navigation');
  const canCrew = L.isFeatureUnlocked(state, 'crew');
  const canShipyard = L.isFeatureUnlocked(state, 'shipyard');
  const canJournal = L.isFeatureUnlocked(state, 'journal');

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
              <div style={{ color: FACTIONS[port.faction]?.color, fontSize: T.captionFontSize, letterSpacing: "0.1em" }}>
                {FACTIONS[port.faction]?.label.toUpperCase()} PORT
              </div>
            </div>
            <RepPill rep={rep} />
          </div>
          <PortSilhouette portKey={state.currentPort} />

          <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, margin: "0 0 10px", lineHeight: T.narrativeLineHeight }}>
            {port.desc}
          </p>

          {state.portGossip?.length > 0 && (
<NarrativePanel title={<><IconTalking size={14} color={T.gold} /> WORD ON THE DOCKS</>} variant="gossip">              {state.portGossip.map((line, i) => (
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
          {canNavigation && (
            <Tooltip text="Open your chart and choose your next destination.">
              <PulseBtn visible={canNavigation} pulseKey="navigation" onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })}><IconMap size={12} color={T.text} /> World Map</PulseBtn>
            </Tooltip>
          )}
          <Tooltip text="Review your standing with the factions of the Caribbean.">
            <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "status" })}><IconBarChart size={12} color={T.text} /> Status</Btn>
          </Tooltip>
          {canMarket && (
            <Tooltip text="Buy, sell, and trade goods in the port market.">
              <PulseBtn visible={canMarket} pulseKey="market"  onClick={() => dispatch({ type: A.NAVIGATE, screen: "market" })}><IconMarket size={12} color={T.text} /> Market</PulseBtn>
            </Tooltip>
          )}
          {canJournal && (
            <Tooltip text="Read the log of your voyages, battles, and discoveries.">
              <PulseBtn visible={canJournal} pulseKey="journal" onClick={() => dispatch({ type: A.NAVIGATE, screen: "journal" })}><IconJournal size={12} color={T.text} /> Journal</PulseBtn>
            </Tooltip>
          )}
        </div>
        {!perk.servicesBlocked && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {port.services.includes("shipyard") && (
                <Tooltip text="Repair, upgrade, or purchase a new vessel.">
                  <PulseBtn visible={canShipyard} pulseKey="shipyard" onClick={() => dispatch({ type: A.NAVIGATE, screen: "shipyard" })}><IconAnchor size={12} color={T.text} /> Shipyard</PulseBtn>
                </Tooltip>
              )}
              {port.services.includes("crew") && (
                <Tooltip text="Hire new hands or boost morale with a round of drinks.">
                  <PulseBtn visible={canCrew} pulseKey="crew" onClick={() => dispatch({ type: A.NAVIGATE, screen: "crew" })}><IconCrew size={12} color={T.text} /> Crew</PulseBtn>
                </Tooltip>
              )}
            </div>
            {port.services.includes("shipyard") && state.ship.hull < L.getShipStats(state).maxHull && (
              <Tooltip text="Patch up your hull before the next voyage.">
                <PulseBtn visible={canShipyard} pulseKey="repair"  v="gold" onClick={() => dispatch({ type: A.REPAIR })} disabled={state.gold < repCost}>
                  Quick Repair ({repCost}g)
                </PulseBtn>
              </Tooltip>
            )}
          </>
        )}
        {/* Save/Load/Export/Import — not gated, normal Btn */}
        <div style={{ marginTop: 8 }}>
          <Tooltip text="Record your progress against the perils of the sea.">
            <Btn v="ghost" sm onClick={() => dispatch({ type: A.SAVE_GAME })}><IconFloppy size={12} color={T.text} /> Save Game</Btn>
          </Tooltip>
        </div>
        {L.hasSave() && (
          <Tooltip text="Return to a previous record of your journey.">
            <Btn v="ghost" sm onClick={() => dispatch({ type: A.LOAD_GAME })} style={{ marginTop: 4 }}>
              <IconFloppy size={12} color={T.text} /> Load Game
            </Btn>
          </Tooltip>
        )}
        <div style={{ marginTop: 8 }}>
          <Tooltip text="Save your adventure to a file for safekeeping.">
            <Btn v="ghost" sm onClick={() => dispatch({ type: A.EXPORT_SAVE })}><IconFileTransfer size={12} color={T.text} /> Export Save</Btn>
          </Tooltip>
          <Tooltip text="Load an adventure from a file.">
            <Btn v="ghost" sm onClick={() => importRef.current?.click()}><IconFileTransfer size={12} color={T.text} /> Import Save</Btn>
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
            <div style={{ color: perk.missionMult > 1 ? T.greenBr : T.gold, fontSize: T.captionFontSize, marginBottom: 8 }}>
              {perk.missionMult > 1
                ? `★ ${perk.tier} standing: +${Math.round((perk.missionMult - 1) * 100)}% mission rewards`
                : `⚠ Hostile standing: −${Math.round((1 - perk.missionMult) * 100)}% mission rewards`}
            </div>
          )}
          {state.activeMission && (
            <div style={panelStyle({ background: "T.greenBg", borderColor: T.greenBr, marginTop: 6 })}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: T.greenBr, fontSize: T.metadataFontSize, fontWeight: "bold" }}>ACTIVE: {state.activeMission.name}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  <Pill label={state.activeMission.faction} color={FACTIONS[state.activeMission.faction]?.color ?? T.textDim} />
                  <Pill label={state.activeMission.risk} color={T.riskColor?.[state.activeMission.risk] ?? T.textDim} />
                </div>
              </div>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 8, lineHeight: 1.4 }}>
                {state.activeMission.description}
              </div>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 4 }}>Destination: {PORTS[state.activeMission.targetPort]?.name || "At sea"}</div>
              <div style={{ display: "flex", gap: T.spacing.md, marginBottom: 8 }}>
                <span style={{ color: T.gold, fontSize: T.metadataFontSize }}>💰 {state.activeMission.gold}</span>
                <span style={{ color: T.blueBr, fontSize: T.metadataFontSize }}>★ {state.activeMission.fame}</span>
              </div>
              {state.activeMission.requiredGood && state.activeMission.requiredQty && (() => {
                const res = window.D.RESOURCES[state.activeMission.requiredGood];
                const inHold = state.hold?.items?.[state.activeMission.requiredGood] || 0;
                const hasGoods = inHold >= state.activeMission.requiredQty;
                const goodName = res?.name || state.activeMission.requiredGood;
                return (
                  <div style={{ marginBottom: 8, fontSize: T.captionFontSize }}>
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
                <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginTop: 6 }}>
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
                    <span style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold" }}>{m.name}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Pill label={m.faction} color={FACTIONS[m.faction]?.color ?? T.textDim} />
                      <Pill label={m.risk} color={T.riskColor?.[m.risk] ?? T.textDim} />
                    </div>
                  </div>
                  <p style={{ color: T.textDim, fontSize: T.captionFontSize, margin: "0 0 6px", lineHeight: 1.4 }}>{m.description || m.desc}</p>
                  {m.enemy && (
                    <div style={{ color: T.textDim, fontSize: T.captionFontSize, margin: "0 0 6px" }}>
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
                        <div style={{ fontSize: T.captionFontSize, color: isIllegal ? T.red : T.textDim, marginBottom: 2 }}>
                          {m.type === "smuggle" ? "⚠ Contraband required" : "Cargo required"}
                        </div>
                        <div style={{ fontSize: T.metadataFontSize, color: isIllegal ? T.red : T.text }}>
                          {m.requiredQty} × {res?.name || m.requiredGood}
                          {isIllegal && <span style={{ color: T.red, fontSize: T.captionFontSize }}> (Illegal)</span>}
                        </div>
                        <div style={{ fontSize: T.captionFontSize, marginTop: 3 }}>
                          {alreadyHave
                            ? <span style={{ color: T.greenBr }}>✓ In hold ({inHold} — ready to deliver)</span>
                            : partialHave
                              ? <span style={{ color: T.gold }}>{inHold}/{m.requiredQty} in hold — need {m.requiredQty - inHold} more</span>
                              : <span style={{ color: T.textDim }}>Not yet sourced — check market or source elsewhere</span>
                          }
                        </div>
                        {!alreadyHave && !canFit && (
                          <div style={{ fontSize: T.captionFontSize, color: T.redBr, marginTop: 2 }}>
                            ⚠ Only {holdFree} hold space free — sell cargo first
                          </div>
                        )}
                        {m.type === "smuggle" && res?.sourceHint && (
                          <div style={{ fontSize: T.captionFontSize, color: T.textFaint, marginTop: 2, fontStyle: "italic" }}>
                            {res.sourceHint}
                          </div>
                        )}
                        {m.type === "trade" && (
                          <div style={{ fontSize: T.captionFontSize, color: T.textFaint, marginTop: 2 }}>
                            Est. cost: ~{res?.basePrice * m.requiredQty}g
                            · Payment on delivery: {m.gold}g
                            · Est. profit: ~{m.gold - res?.basePrice * m.requiredQty}g
                          </div>
                        )}
                        {m.type === "smuggle" && (
                          <div style={{ fontSize: T.captionFontSize, color: T.red, marginTop: 2 }}>
                            +{m.infamyGain} infamy on completion
                            {m.requiredGood === "slaves" ? " · +1 infamy on purchase" : ""}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: T.gold, fontSize: T.metadataFontSize }}>💰 {m.gold}</span>
                    <span style={{ color: T.blueBr, fontSize: T.metadataFontSize }}>★ {m.fame}</span>
                    <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>→ {PORTS[m.targetPort]?.name}</span>
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
 // ── STATUS SCREEN ────────────────────────────────────────────────────
  function StatusScreen({ state, dispatch }) {
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state, "status"));
    const [showFullLedger, setShowFullLedger] = React.useState(false);
    const [isNarrowStatus, setIsNarrowStatus] = React.useState(window.innerWidth < 700);

    React.useEffect(() => {
      const handle = () => setIsNarrowStatus(window.innerWidth < 700);
      window.addEventListener("resize", handle);
      return () => window.removeEventListener("resize", handle);
    }, []);

    // ── Derived values ─────────────────────────────────────────────
    const career = state.career || {};
    const daysSurvived = state.day;
    const portsTotal = Object.keys(PORTS).length;
    const portsVisitedCount = (career.portsVisited || []).length;
    const totalBattles = (career.battles?.won || 0) + (career.battles?.lost || 0) + (career.battles?.fled || 0);
    const totalCrewLost = (career.crewLost?.inBattle || 0) + (career.crewLost?.inStorm || 0)
                       + (career.crewLost?.deserted || 0) + (career.crewLost?.other || 0);

    // Headline identity tag
    const getCaptainTag = () => {
      const fame = state.fame || 0;
      const infamy = state.infamy || 0;
      if (infamy >= 100) return { text: "Legendary Outlaw of the Caribbean", color: T.redBr };
      if (infamy >= 50)  return { text: "Notorious Across the Caribbean", color: T.redBr };
      if (fame >= 200)   return { text: "A Legend of the Caribbean", color: T.gold };
      if (fame >= 100)   return { text: "A Notorious Captain", color: T.gold };
      if (fame >= 50)    return { text: "A Recognised Captain", color: T.gold };
      if (infamy >= 25)  return { text: "Wanted by the Law", color: T.redBr };
      if (infamy >= 10)  return { text: "A Suspect in Several Ports", color: T.gold };
      return { text: "An Unknown Captain", color: T.textDim };
    };
    const captainTag = getCaptainTag();

    // ── Career narrative highlights ────────────────────────────────
    const getHighlights = () => {
      const lines = [];

      // Sea time
      lines.push(`You have sailed for ${daysSurvived} day${daysSurvived === 1 ? "" : "s"}.`);

      // Combat summary
      if (totalBattles > 0) {
        const won = career.battles?.won || 0;
        const lost = career.battles?.lost || 0;
        const fled = career.battles?.fled || 0;

        const parts = [];
        if (won > 0) parts.push(`won ${won}`);
        if (lost > 0) parts.push(`lost ${lost}`);
        if (fled > 0) parts.push(`fled ${fled}`);

        lines.push(
          `Across ${totalBattles} battle${totalBattles === 1 ? "" : "s"}, you have ${parts.join(", ")}.`
        );

        const sunk = career.shipsSunk || 0;
        const plundered = career.shipsPlundered || 0;
        
        if (sunk > 0 || plundered > 0) {
          const detailParts = [];
          if (sunk > 0) detailParts.push(`sunk ${sunk}`);
          if (plundered > 0) detailParts.push(`boarded and plundered ${plundered}`);
          lines.push(`Of those, you ${detailParts.join(" and ")}.`);
        }
      }

      // Crew losses (the human cost)
      if (totalCrewLost > 0) {
        const inBattle = career.crewLost?.inBattle || 0;
        const inStorm = career.crewLost?.inStorm || 0;
        const deserted = career.crewLost?.deserted || 0;
        const parts = [];
        if (inBattle > 0) parts.push(`${inBattle} to combat`);
        if (inStorm > 0) parts.push(`${inStorm} to the storms`);
        if (deserted > 0) parts.push(`${deserted} who walked away`);
        if (parts.length > 0) {
          lines.push(`You have lost ${totalCrewLost} crew: ${parts.join(", ")}.`);
        }
      }

      // Longest tenure
      if (career.longestCrewTenure && career.longestCrewTenure >= 50) {
        lines.push(`Your longest-serving crew member sailed with you for ${career.longestCrewTenure} days.`);
      }

      // Exploration
      if (portsVisitedCount > 0) {
        lines.push(`You have made landfall at ${portsVisitedCount} of ${portsTotal} ports across the Caribbean.`);
      }

      // Economic
      const earned = career.goldEarned || 0;
      const spent = career.goldSpent || 0;
      if (earned > 0 || spent > 0) {
        lines.push(`You have earned ${earned.toLocaleString()}g and spent ${spent.toLocaleString()}g.`);
      }

      // Storms
      if (career.stormsSurvived > 0) {
        lines.push(`You have weathered ${career.stormsSurvived} storm${career.stormsSurvived === 1 ? "" : "s"}.`);
      }

      // Ships
      const ships = (career.shipsOwned || []).length;
      if (ships > 1) {
        lines.push(`You have commanded ${ships} ship${ships === 1 ? "" : "s"} over your career.`);
      }

      // Contraband caught
      if (career.contrabandSeized > 0) {
        lines.push(`You have been caught smuggling contraband ${career.contrabandSeized} time${career.contrabandSeized === 1 ? "" : "s"}.`);
      }

      return lines;
    };
    const highlights = getHighlights();

    // ── Per-faction summary ────────────────────────────────────────
    const getFactionSummary = (factionKey) => {
      const ports = Object.entries(PORTS).filter(([_, p]) => p.faction === factionKey);
      if (ports.length === 0) return null;
      const avgRep = Math.round(
        ports.reduce((sum, [k]) => sum + (state.reputation[k] ?? 50), 0) / ports.length
      );
      const repLabel = L.reputationLabel(avgRep);
      const heat = state.factionAlerts?.[factionKey] || 0;
      const heatLabel = L.getHeatLabel(heat);

      // Crew alignment
      const crewOfFaction = (state.crew?.roster || []).filter(m => m.faction === factionKey).length;
      const totalCrew = (state.crew?.roster || []).length;
      const crewPct = totalCrew > 0 ? Math.round((crewOfFaction / totalCrew) * 100) : 0;

      return { avgRep, repLabel, heat, heatLabel, crewOfFaction, totalCrew, crewPct };
    };

    // Service description from rep
    const getServiceNote = (rep) => {
      if (rep >= 80) return "−20% repair · +20% missions";
      if (rep >= 50) return "−10% repair · +10% missions";
      if (rep >= 30) return "Standard prices";
      if (rep >= 10) return "−25% missions";
      return "No services available";
    };

    // ── Render ─────────────────────────────────────────────────────
    return (
      <div style={{
        padding: T.spacing.lg,
        display: "flex",
        flexDirection: "column",
        gap: T.spacing.md,
        overflowY: "auto",
        flex: 1
      }}>
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
            <p>This is where your career is tracked — your identity, your deeds, and your standing with the powers of the Caribbean.</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li><strong>Fame</strong> — earned through missions. Gates better ships, equipment, and hidden ports.</li>
              <li><strong>Infamy</strong> — earned through crime. High infamy blocks bribes and attracts bounty hunters.</li>
              <li><strong>Career</strong> — what you've actually done at sea.</li>
              <li><strong>Factions</strong> — how each rival power sees you, and how your crew aligns.</li>
            </ul>
            <p>The Caribbean keeps a ledger. Your name is written in it.</p>
          </TutorialPopup>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: CAPTAIN IDENTITY (Hero panel)                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div style={panelStyle({ borderColor: T.gold })}>
          <div style={{ display: "flex", flexDirection: isNarrowStatus ? "column" : "row", gap: T.spacing.md, alignItems: isNarrowStatus ? "flex-start" : "center" }}>

            {/* Left: Captain name + faction + tag */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Captain
              </div>
              <div style={{ color: T.text, fontSize: 22, fontWeight: "bold", marginTop: 2 }}>
                {state.captainName || "Unknown"}
              </div>
              <div style={{
                color: FACTIONS[state.faction]?.color || T.textDim,
                fontSize: T.metadataFontSize,
                marginTop: 4,
                letterSpacing: "0.06em"
              }}>
                {FACTIONS[state.faction]?.label || "No faction"}
              </div>
              <div style={{ color: captainTag.color, fontSize: 13, marginTop: 8, fontStyle: "italic" }}>
                {captainTag.text}
              </div>
            </div>

            {/* Right: Fame / Infamy / Days */}
            <div style={{
              display: "flex",
              gap: T.spacing.lg,
              flexWrap: "wrap",
              justifyContent: isNarrowStatus ? "flex-start" : "flex-end",
              alignItems: "flex-start",
            }}>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ color: T.gold, fontSize: 22, fontWeight: "bold" }}>★ {state.fame}</div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{L.getFameInfo(state.fame).label}</div>
                <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>Fame</div>
              </div>

              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint, fontSize: 22, fontWeight: "bold" }}>
                  <IconSkull size={18} color={(state.infamy ?? 0) > 0 ? T.red : T.textFaint} /> {state.infamy ?? 0}
                </div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{L.getInfamyLabel(state.infamy ?? 0)}</div>
                <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>Infamy</div>
              </div>

              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ color: T.text, fontSize: 22, fontWeight: "bold" }}>{daysSurvived}</div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>days at sea</div>
                <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>Tenure</div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: CAREER HIGHLIGHTS (Narrative)                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div style={panelStyle()}>
          <SectionTitle>CAREER</SectionTitle>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {highlights.map((line, i) => (
              <div key={i} style={{
                color: T.text,
                fontSize: T.narrativeFontSize,
                lineHeight: T.narrativeLineHeight,
                paddingLeft: 10,
                borderLeft: `2px solid ${T.borderFaint}`,
              }}>
                {line}
              </div>
            ))}
          </div>

          {/* Toggle for full ledger */}
          <div
            onClick={() => setShowFullLedger(v => !v)}
            style={{
              color: T.textFaint,
              fontSize: T.captionFontSize,
              cursor: "pointer",
              marginTop: 4,
              padding: 4,
              borderTop: `1px solid ${T.borderFaint}`,
            }}
          >
            {showFullLedger ? "▾ Hide full ledger" : "▸ Show full ledger"}
          </div>

          {showFullLedger && (
            <div style={{ marginTop: 10, padding: 8, background: T.bgDeep, borderRadius: 3 }}>
              {/* Economic */}
              <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Economic
              </div>
              <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 10 }}>
                <StatBlock label="Gold Earned" value={`${(career.goldEarned || 0).toLocaleString()}g`} color={T.gold} />
                <StatBlock label="Gold Spent"  value={`${(career.goldSpent || 0).toLocaleString()}g`} color={T.redBr} />
                <StatBlock label="Storms Survived" value={career.stormsSurvived || 0} />
                <StatBlock label="Contraband Seized" value={career.contrabandSeized || 0} color={T.redBr} />
              </div>

              {/* Combat */}
              <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Combat
              </div>
              <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 10 }}>
                <StatBlock label="Battles Won"  value={career.battles?.won || 0} color={T.greenBr} />
                <StatBlock label="Battles Lost" value={career.battles?.lost || 0} color={T.redBr} />
                <StatBlock label="Battles Fled" value={career.battles?.fled || 0} color={T.textDim} />
                <StatBlock label="Ships Sunk"   value={career.shipsSunk || 0} />
                <StatBlock label="Ships Plundered" value={career.shipsPlundered || 0} color={T.gold} />
              </div>

              {/* Crew */}
              <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                Crew
              </div>
              <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 10 }}>
                <StatBlock label="Hired"     value={career.crewHired || 0} color={T.greenBr} />
                <StatBlock label="Dismissed" value={career.crewDismissed || 0} />
                <StatBlock label="Lost in Battle" value={career.crewLost?.inBattle || 0} color={T.redBr} />
                <StatBlock label="Lost in Storm"  value={career.crewLost?.inStorm || 0} color={T.redBr} />
                <StatBlock label="Deserted"       value={career.crewLost?.deserted || 0} color={T.redBr} />
                <StatBlock label="Other Losses"   value={career.crewLost?.other || 0} color={T.redBr} />
                <StatBlock label="Longest Tenure" value={`${career.longestCrewTenure || 0}d`} color={T.blueBr} />
              </div>

              {/* World */}
              <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                World
              </div>
              <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap" }}>
                <StatBlock label="Ports Visited" value={`${portsVisitedCount} / ${portsTotal}`} />
                <StatBlock label="Ships Owned"   value={(career.shipsOwned || []).length} />
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SECTION 3: THE WORLD'S VIEW (Per-faction unified)                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div style={panelStyle()}>
          <SectionTitle>
            <IconHandshake size={14} color={T.gold} /> THE WORLD'S VIEW
          </SectionTitle>
          <p style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic", marginBottom: 10 }}>
            How each faction sees you, and how your crew aligns with them.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: isNarrowStatus ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: T.spacing.md,
          }}>
            {Object.entries(FACTIONS).map(([factionKey, fac]) => {
              const summary = getFactionSummary(factionKey);
              if (!summary) return null;
              const { avgRep, repLabel, heat, heatLabel, crewOfFaction, totalCrew, crewPct } = summary;
              const repColor = avgRep >= 60 ? T.greenBr : avgRep >= 30 ? T.gold : T.redBr;

              return (
                <div key={factionKey} style={panelStyle({
                  background: T.panelAlt,
                  borderLeft: `3px solid ${fac.color}`,
                  padding: T.spacing.md,
                })}>
                  {/* Header: faction name + rivals */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ color: fac.color, fontSize: T.heading3FontSize, fontWeight: "bold" }}>
                        {fac.label}
                      </div>
                      <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>
                        {fac.rivalFactions?.length
                          ? `Rivals: ${fac.rivalFactions.map(r => FACTIONS[r]?.label ?? r).join(", ")}`
                          : "No known rivals"}
                      </div>
                    </div>
                    <RepPill rep={avgRep} />
                  </div>

                  {/* Reputation bar */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>Standing</span>
                      <span style={{ color: repColor, fontSize: T.captionFontSize, fontWeight: "bold" }}>
                        {repLabel} ({avgRep})
                      </span>
                    </div>
                    <Bar value={avgRep} max={100} color={repColor} h={8} />
                    <div style={{ color: T.textFaint, fontSize: 9, marginTop: 3 }}>
                      {getServiceNote(avgRep)}
                    </div>
                  </div>

                  {/* Heat (only if non-zero) */}
                  {heat > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>Heat</span>
                        <span style={{ color: T.redBr, fontSize: T.captionFontSize, fontWeight: "bold" }}>
                          {heatLabel} ({heat}/10)
                        </span>
                      </div>
                      <Bar value={heat} max={10} color={T.redBr} h={6} />
                    </div>
                  )}

                  {/* Crew alignment */}
                  {totalCrew > 0 && (
                    <div style={{ color: T.textFaint, fontSize: 9, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.borderFaint}` }}>
                      {crewOfFaction === 0
                        ? `None of your crew are ${fac.label}.`
                        : crewOfFaction === totalCrew
                          ? `Your entire crew is ${fac.label}.`
                          : `${crewOfFaction} of ${totalCrew} crew (${crewPct}%) are ${fac.label}.`
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ color: T.textDim, fontSize: T.captionFontSize, lineHeight: 1.6, marginTop: 10 }}>
            Reputation decays slowly toward neutral (50) over time. Complete missions, aid distressed ships, or parley with faction vessels to improve standing. Attacking their ships will anger all ports of that faction. Heat decays naturally as you stay clear of trouble.
          </p>
        </div>
      </div>
    );
  }

  // ── JOURNAL SCREEN ──────────────────────────────────────────────────
  function JournalScreen({ state, dispatch }) {
    const [filterTab, setFilterTab] = useState("all");
    const [search, setSearch] = useState("");
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state,"journal"));

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

        <SectionTitle><IconJournal size={16} color={T.gold} />  CAPTAIN'S JOURNAL</SectionTitle>
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
            placeholder=" Search journal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 10px",
              background: T.panel,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 3,
              fontSize: T.metadataFontSize,
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
                    
{(() => {
  const categoryKey = L.classifyLogLine(entry.text);
  const LOG_ICONS = window.UI.LOG_ICONS || {};
  const IconComponent = categoryKey ? LOG_ICONS[categoryKey] : null;
  return IconComponent ? (
    <IconComponent size={12} color={T.textDim}
      style={{ marginRight: 6, flexShrink: 0, verticalAlign: "middle" }} />
  ) : null;
})()}

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
    PortScreen,
    StatusScreen,
    JournalScreen,
  });
})();