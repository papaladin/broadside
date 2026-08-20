// screens_port.jsx — Port-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS, RESOURCES, QM_DIALOGUE } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { 
    T, panelStyle, Bar, Pill, Btn, PulseBtn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip, Panel,
    IconMap, IconBarChart, IconMarket, IconJournal, IconAnchor, IconCrew, IconFloppy, IconFileTransfer, IconTalking, IconGold, IconSkull, IconHandshake, IconSearch, PortSilhouette, IconCoins, IconAttention, IconSailboat,
    SubPanel
  } = window.UI;
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
    const [qmPopupMessage, setQmPopupMessage] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state,"port"));

    const [isNarrow, setIsNarrow] = React.useState(window.innerWidth < 700);
    React.useEffect(() => {
      const handleResize = () => setIsNarrow(window.innerWidth < 700);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ── Sailing & mission acceptance gates ──────────────────────────────
    const FIGHT_TYPES = ["combat", "patrol", "assault", "escort"];
    const isDinghy = state.ship.type === "dinghy";
    const minCrew = L.getMinViableCrew(state.ship.type);
    const isHullBlocked = state.ship.hull === 0;
    const isCrewBlocked = !isDinghy && state.crew.roster.length < minCrew;
    const sailDisabled = isHullBlocked || isCrewBlocked;

    let sailTooltip = "";
    if (isHullBlocked) sailTooltip = "Hull is destroyed – repair needed.";
    else if (isCrewBlocked) sailTooltip = `Need at least ${minCrew} crew to sail.`;

    // ── Feature unlocking gates ──────────────────────────────────────
    const canContracts = true; // always available
    const canMarket = L.isFeatureUnlocked(state, 'market');
    const canNavigation = L.isFeatureUnlocked(state, 'navigation');
    const canCrew = L.isFeatureUnlocked(state, 'crew');
    const canShipyard = L.isFeatureUnlocked(state, 'shipyard');
    const canJournal = L.isFeatureUnlocked(state, 'journal');

    // ── Helper: find the most negatively impacted faction ────────────
    const getHarmedFaction = (mission) => {
      const repImpact = mission.repImpact || {};
      let worstFaction = null;
      let worstDelta = 0;
      for (const [faction, delta] of Object.entries(repImpact)) {
        if (delta < worstDelta) {
          worstDelta = delta;
          worstFaction = faction;
        }
      }
      return worstFaction ? { faction: worstFaction, delta: worstDelta } : null;
    };

    // ── Helper to render the mission details box (used by both active and listed missions) ──
    const renderMissionDetailsBox = (mission) => {
      const res = mission.requiredGood ? window.D.RESOURCES[mission.requiredGood] : null;
      const inHold = state.hold?.items?.[mission.requiredGood] || 0;
      const hasGoods = inHold >= mission.requiredQty;
      const partialHave = inHold > 0 && inHold < mission.requiredQty;
      const isIllegal = res?.illegal;
      const holdFree = (L.getHoldCapacity(state) || 0) - L.getHoldUsed(state.hold?.items || {});
      const canFit = holdFree >= (mission.requiredQty - inHold);
      const harmed = getHarmedFaction(mission);
      const harmedColor = FACTIONS[harmed?.faction]?.color || T.redBr;

      // ── Already hunted message ──────────────────────────────────────────────
      if (mission.type === "combat" && state.completedCombatThisVisit) {
        return (
          <SubPanel color={T.redBr} style={{ margin: "0 0 6px" }}>
            {mission.requiredGood && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: T.captionFontSize, color: isIllegal ? T.red : T.textDim, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  {isIllegal ? <IconAttention size={12} color={T.red} /> : null}
                  {mission.type === "smuggle" ? "Contraband required" : "Cargo required"}
                </div>
                <div style={{ fontSize: T.metadataFontSize, color: isIllegal ? T.red : T.text }}>
                  {mission.requiredQty} × {res?.name || mission.requiredGood}
                  {isIllegal && <span style={{ color: T.red, fontSize: T.captionFontSize }}> (Illegal)</span>}
                </div>
                <div style={{ fontSize: T.captionFontSize, marginTop: 3 }}>
                  {hasGoods
                    ? <span style={{ color: T.greenBr }}>✓ In hold ({inHold} — ready)</span>
                    : partialHave
                      ? <span style={{ color: T.gold }}>{inHold}/{mission.requiredQty} in hold — need {mission.requiredQty - inHold} more</span>
                      : <span style={{ color: T.textDim }}>Not yet sourced — check market or source elsewhere</span>
                  }
                </div>
                {!hasGoods && !canFit && (
                  <div style={{ fontSize: T.captionFontSize, color: T.redBr, marginTop: 2 }}>
                    ⚠ Only {holdFree} hold space free — sell cargo first
                  </div>
                )}
                {mission.type === "smuggle" && res?.sourceHint && (
                  <div style={{ fontSize: T.captionFontSize, color: T.textFaint, marginTop: 2, fontStyle: "italic" }}>
                    {res.sourceHint}
                  </div>
                )}
                {mission.type === "trade" && (
                  <div style={{ fontSize: T.captionFontSize, color: T.textFaint, marginTop: 2 }}>
                    Est. cost: ~{res?.basePrice * mission.requiredQty}g · Payment on delivery: {mission.gold}g · Est. profit: ~{mission.gold - res?.basePrice * mission.requiredQty}g
                  </div>
                )}
                {mission.type === "smuggle" && (
                  <div style={{ fontSize: T.captionFontSize, color: T.red, marginTop: 2 }}>
                    +{mission.infamyGain} infamy on completion
                    {mission.requiredGood === "slaves" ? " · +1 infamy on purchase" : ""}
                  </div>
                )}
              </div>
            )}
            {mission.enemy && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: T.captionFontSize, color: T.textDim, marginBottom: 2 }}>Enemy</div>
                <div style={{ fontSize: T.metadataFontSize, color: T.text }}>
                  {mission.enemy.name} ({FACTIONS[mission.enemy.faction]?.label || mission.enemy.faction}) — {mission.enemy.cannons} cannons, hull {mission.enemy.hull}, crew {mission.enemy.crew}
                </div>
              </div>
            )}
            {harmed && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: harmed && mission.type === "patrol" ? 4 : 0 }}>
                <IconAttention size={12} color={harmedColor} />
                <span style={{ fontSize: T.captionFontSize, color: T.textDim }}>Will impact negatively the {FACTIONS[harmed.faction]?.label || harmed.faction}</span>
              </div>
            )}
            {mission.type === "patrol" && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IconSailboat size={12} color={T.gold} />
                <span style={{ fontSize: T.captionFontSize, color: T.textDim }}>
                  Sail near {PORTS[mission.targetPort]?.name || "the target port"} and advance days. The enemy will appear with time.
                </span>
              </div>
            )}
            <div style={{ color: T.redBr, fontSize: T.captionFontSize, marginTop: 4 }}>
              ✗ You have already hunted here. Sail to another port for new prey.
            </div>
          </SubPanel>
        );
      }

      // ── Normal mission details (no "already hunted" message) ─────────────────
      if (!mission.enemy && !mission.requiredGood && !harmed && mission.type !== "patrol") return null;

      return (
        <SubPanel
          color={isIllegal ? T.redBr : T.gold}
          style={{ margin: "0 0 6px" }}
        >
          {mission.requiredGood && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: T.captionFontSize, color: isIllegal ? T.red : T.textDim, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                {isIllegal ? <IconAttention size={12} color={T.red} /> : null}
                {mission.type === "smuggle" ? "Contraband required" : "Cargo required"}
              </div>
              <div style={{ fontSize: T.metadataFontSize, color: isIllegal ? T.red : T.text }}>
                {mission.requiredQty} × {res?.name || mission.requiredGood}
                {isIllegal && <span style={{ color: T.red, fontSize: T.captionFontSize }}> (Illegal)</span>}
              </div>
              <div style={{ fontSize: T.captionFontSize, marginTop: 3 }}>
                {hasGoods
                  ? <span style={{ color: T.greenBr }}>✓ In hold ({inHold} — ready)</span>
                  : partialHave
                    ? <span style={{ color: T.gold }}>{inHold}/{mission.requiredQty} in hold — need {mission.requiredQty - inHold} more</span>
                    : <span style={{ color: T.textDim }}>Not yet sourced — check market or source elsewhere</span>
                }
              </div>
              {!hasGoods && !canFit && (
                <div style={{ fontSize: T.captionFontSize, color: T.redBr, marginTop: 2 }}>
                  ⚠ Only {holdFree} hold space free — sell cargo first
                </div>
              )}
              {mission.type === "smuggle" && res?.sourceHint && (
                <div style={{ fontSize: T.captionFontSize, color: T.textFaint, marginTop: 2, fontStyle: "italic" }}>
                  {res.sourceHint}
                </div>
              )}
              {mission.type === "trade" && (
                <div style={{ fontSize: T.captionFontSize, color: T.textFaint, marginTop: 2 }}>
                  Est. cost: ~{res?.basePrice * mission.requiredQty}g · Payment on delivery: {mission.gold}g · Est. profit: ~{mission.gold - res?.basePrice * mission.requiredQty}g
                </div>
              )}
              {mission.type === "smuggle" && (
                <div style={{ fontSize: T.captionFontSize, color: T.red, marginTop: 2 }}>
                  +{mission.infamyGain} infamy on completion
                  {mission.requiredGood === "slaves" ? " · +1 infamy on purchase" : ""}
                </div>
              )}
            </div>
          )}

          {mission.enemy && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: T.captionFontSize, color: T.textDim, marginBottom: 2 }}>Enemy</div>
              <div style={{ fontSize: T.metadataFontSize, color: T.text }}>
                {mission.enemy.name} ({FACTIONS[mission.enemy.faction]?.label || mission.enemy.faction}) — {mission.enemy.cannons} cannons, hull {mission.enemy.hull}, crew {mission.enemy.crew}
              </div>
            </div>
          )}

          {harmed && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: harmed && mission.type === "patrol" ? 4 : 0 }}>
              <IconAttention size={12} color={harmedColor} />
              <span style={{ fontSize: T.captionFontSize, color: T.textDim }}>Will impact negatively the {FACTIONS[harmed.faction]?.label || harmed.faction}</span>
            </div>
          )}

          {mission.type === "patrol" && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <IconSailboat size={12} color={T.gold} />
              <span style={{ fontSize: T.captionFontSize, color: T.textDim }}>
                Sail near {PORTS[mission.targetPort]?.name || "the target port"} and advance days. The enemy will appear with time.
              </span>
            </div>
          )}
        </SubPanel>
      );
    };

    return (
      <div style={{
        display: "flex",
        flexDirection: isNarrow ? "column" : "row",
        gap: T.spacing.md,
        padding: T.spacing.lg,
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
        }}>
          {/* Port header + description + gossip */}
          <Panel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ color: T.gold, fontSize: 28, fontWeight: "bold" }}>{port.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: T.spacing.sm }}>
                <FactionPill faction={port.faction} />
                <RepPill rep={rep} />
              </div>
            </div>
            <PortSilhouette portKey={state.currentPort} />

            <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, margin: "0 0 10px", lineHeight: T.narrativeLineHeight }}>
              {port.desc}
            </p>

            {state.portGossip?.length > 0 && (
              <NarrativePanel title={<><IconTalking size={14} color={T.gold} /> WORD ON THE DOCKS</>} variant="gossip">
                {state.portGossip.map((line, i) => (
                  <NarrativeLine key={i}>{line}</NarrativeLine>
                ))}
              </NarrativePanel>
            )}

            {perk.servicesBlocked && (
              <EmptyState message="⚔ You are at war with this port. No faction will deal with you here." />
            )}
          </Panel>

          {/* Action buttons */}
          <Panel>
            <SectionTitle action={
              <Tooltip text="Manage your game and access community links.">
                <Btn v="ghost" onClick={() => setMenuOpen(true)}>Game Menu</Btn>
              </Tooltip>
            }>
              ACTIONS
            </SectionTitle>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {canNavigation && (
                <Tooltip text={sailDisabled ? sailTooltip : "Open your chart and choose your next destination."}>
                  <PulseBtn visible={canNavigation} pulseKey="navigation" onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })} disabled={sailDisabled}>
                    <IconMap size={12} color={T.text} /> World Map
                  </PulseBtn>
                </Tooltip>
              )}
              <Tooltip text="Review your standing with the factions of the Caribbean.">
                <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "status" })}>
                  <IconBarChart size={12} color={T.text} /> Status
                </Btn>
              </Tooltip>
              {canMarket && (
                <Tooltip text="Buy, sell, and trade goods in the port market.">
                  <PulseBtn visible={canMarket} pulseKey="market" onClick={() => dispatch({ type: A.NAVIGATE, screen: "market" })}>
                    <IconMarket size={12} color={T.text} /> Market
                  </PulseBtn>
                </Tooltip>
              )}
              {canJournal && (
                <Tooltip text="Read the log of your voyages, battles, and discoveries.">
                  <PulseBtn visible={canJournal} pulseKey="journal" onClick={() => dispatch({ type: A.NAVIGATE, screen: "journal" })}>
                    <IconJournal size={12} color={T.text} /> Journal
                  </PulseBtn>
                </Tooltip>
              )}
            </div>
            {!perk.servicesBlocked && (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <Tooltip text="Repair, upgrade, or purchase a new vessel.">
                    <PulseBtn visible={canShipyard} pulseKey="shipyard" onClick={() => dispatch({ type: A.NAVIGATE, screen: "shipyard" })}>
                      <IconAnchor size={12} color={T.text} /> Shipyard
                    </PulseBtn>
                  </Tooltip>
                  <Tooltip text="Hire new hands or boost morale with a round of drinks.">
                    <PulseBtn visible={canCrew} pulseKey="crew" onClick={() => dispatch({ type: A.NAVIGATE, screen: "crew" })}>
                      <IconCrew size={12} color={T.text} /> Crew
                    </PulseBtn>
                  </Tooltip>
                </div>
                {state.ship.hull < L.getShipStats(state).maxHull && (
                  <Tooltip text="Patch up your hull before the next voyage.">
                    <PulseBtn visible={canShipyard} pulseKey="repair" v="gold" onClick={() => dispatch({ type: A.REPAIR })} disabled={state.gold < repCost}>
                      Quick Repair ({repCost}g)
                    </PulseBtn>
                  </Tooltip>
                )}
              </>
            )}
            <div style={{ marginTop: 8 }} />
          </Panel>

          {/* Mission board */}
          <Panel style={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
              <Panel color={T.greenBr} style={{ background: T.greenBg, marginTop: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: T.greenBr, fontSize: T.metadataFontSize, fontWeight: "bold" }}>ACTIVE: {state.activeMission.name}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <Pill label={state.activeMission.faction} color={FACTIONS[state.activeMission.faction]?.color ?? T.textDim} />
                    <Tooltip text={
                      state.activeMission.type === "trade" ? "Buy and deliver goods for profit." :
                      state.activeMission.type === "smuggle" ? "Deliver illegal goods. Patrols may inspect you." :
                      state.activeMission.type === "combat" ? "Hunt down an enemy ship." :
                      state.activeMission.type === "patrol" ? "Patrol the waters near the target port until the enemy appears." :
                      state.activeMission.type === "escort" ? "Protect a convoy to its destination." :
                      state.activeMission.type === "assault" ? "Attack a port's garrison by force." : ""
                    }>
                      <Pill label={state.activeMission.risk} color={T.riskColor?.[state.activeMission.risk] ?? T.textDim} />
                    </Tooltip>
                  </div>
                </div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 8, lineHeight: 1.4 }}>
                  {state.activeMission.description}
                </div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 4 }}>Destination: {PORTS[state.activeMission.targetPort]?.name || "At sea"}</div>
                <div style={{ display: "flex", gap: T.spacing.md, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ color: T.gold, fontSize: T.heading2FontSize, display: "flex", alignItems: "center", gap: 3 }}>
                    <IconCoins size={14} color={T.gold} /> {state.activeMission.gold}
                  </span>
                  <span style={{ color: T.blueBr, fontSize: T.heading2FontSize }}>★ {state.activeMission.fame}</span>
                </div>

                {/* Unified details box */}
                {renderMissionDetailsBox(state.activeMission)}

                <div style={{ display: "flex", gap: T.spacing.sm }}>
                  {canFinish && (
                    <Tooltip text="Complete the mission and claim your reward.">
                      <Btn v="gold" onClick={() => dispatch({ type: A.COMPLETE_MISSION })}
                        disabled={state.activeMission.requiredGood && (state.hold?.items?.[state.activeMission.requiredGood] || 0) < state.activeMission.requiredQty}>
                        Complete Mission
                      </Btn>
                    </Tooltip>
                  )}
                  <Tooltip text={state.activeMission?.tutorial ? "You must complete this mission to continue." : "Abandon your current mission. You will lose reputation with the issuing faction."}>
                    <Btn v="ghost" sm onClick={() => {
                      if (state.activeMission?.tutorial && state.onboarding?.enabled && !state.onboarding?.completed) {
                        const qm = state.crew?.roster?.find(m => (m.tags || []).includes('quartermaster'));
                        const qmName = qm ? `${qm.firstName} ${qm.lastName}` : 'Quartermaster';
                        const msg = QM_DIALOGUE?.tutorialAbandonRefuse
                          ? QM_DIALOGUE.tutorialAbandonRefuse(qmName)
                          : `${qmName} tells you firmly that you can't abandon the opening contract.`;
                        setQmPopupMessage(msg);
                      } else {
                        dispatch({ type: A.ABANDON_MISSION });
                      }
                    }}>Abandon</Btn>
                  </Tooltip>
                </div>
                {!canFinish && (
                  <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginTop: 6 }}>
                    Sail to {PORTS[state.activeMission.targetPort]?.name} to complete.
                  </div>
                )}
              </Panel>
            )}

            {/* Mission board is now always available (no service check) */}
            {state.missions.length === 0 ? (
              <EmptyState message="No missions posted. Try refreshing." />
            ) : (
              <div style={{ overflowY: "auto", flex: 1, padding: "3px" }}>
                {state.missions.map((m, i) => {
                  const isFight = FIGHT_TYPES.includes(m.type);
                  const alreadyHuntedHere = m.type === "combat" && state.completedCombatThisVisit;
                  const acceptDisabled = !!state.activeMission || (state.ship.hull === 0 && isFight) || alreadyHuntedHere;
                  const acceptTooltip = acceptDisabled 
                    ? (state.ship.hull === 0 && isFight ? "Your ship is unfit for a fight." :
                       alreadyHuntedHere ? "You've already hunted here. Sail to another port to find new prey." :
                       "You already have an active mission.")
                    : "Take this mission as your active objective.";

                  return (
                    <Panel key={i} style={{ background: T.panelAlt, marginBottom: 8, opacity: state.activeMission ? 0.55 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold" }}>{m.name}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Pill label={m.faction} color={FACTIONS[m.faction]?.color ?? T.textDim} />
                          <Tooltip text={
                            m.type === "trade" ? "Buy and deliver goods for profit." :
                            m.type === "smuggle" ? "Deliver illegal goods. Patrols may inspect you." :
                            m.type === "combat" ? "Hunt down an enemy ship." :
                            m.type === "patrol" ? "Patrol the waters near the target port until the enemy appears." :
                            m.type === "escort" ? "Protect a convoy to its destination." :
                            m.type === "assault" ? "Attack a port's garrison by force." : ""
                          }>
                            <Pill label={m.risk} color={T.riskColor?.[m.risk] ?? T.textDim} />
                          </Tooltip>
                        </div>
                      </div>
                      <p style={{ color: T.textDim, fontSize: T.captionFontSize, margin: "0 0 6px", lineHeight: 1.4 }}>{m.description || m.desc}</p>

                      {/* Unified details box */}
                      {renderMissionDetailsBox(m)}

                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ color: T.gold, fontSize: T.heading2FontSize, display: "flex", alignItems: "center", gap: 3 }}>
                          <IconCoins size={14} color={T.gold} /> {m.gold}
                        </span>
                        <span style={{ color: T.blueBr, fontSize: T.heading2FontSize }}>★ {m.fame}</span>
                        <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>→ {PORTS[m.targetPort]?.name}</span>
                        <Tooltip text={acceptTooltip}>
                          <Btn sm v="gold" disabled={acceptDisabled} onClick={() => dispatch({ type: A.TAKE_MISSION, mission: m })}>
                            Accept
                          </Btn>
                        </Tooltip>
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* ── Column 2: Captain's Log ──────────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 240,
        }}>
          <Panel style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <SectionTitle>CAPTAIN'S LOG</SectionTitle>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <LogList entries={state.log} />
            </div>
          </Panel>
        </div>

        {/* ── QM Popup for tutorial abandon refusal ───────────────── */}
        {qmPopupMessage && (
          <div style={{
            position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
            maxWidth: 560, width: "90%", zIndex: 500,
            background: T.panel, border: `1px solid ${T.gold}`, borderRadius: 2,
            padding: 12, display: "flex", alignItems: "flex-start", gap: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            animation: "qmSlideIn 0.3s ease-out",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.gold, fontSize: 11, fontWeight: "bold", marginBottom: 4 }}>
                {state.crew?.roster?.find(m => (m.tags || []).includes('quartermaster'))?.firstName + " " + state.crew?.roster?.find(m => (m.tags || []).includes('quartermaster'))?.lastName || "Quartermaster"}
              </div>
              <div style={{ color: T.textDim, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight }}>
                {qmPopupMessage}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                <Btn sm v="gold" onClick={() => setQmPopupMessage(null)}>Got it</Btn>
                <div onClick={() => setQmPopupMessage(null)}
                  style={{ color: T.textFaint, fontSize: T.captionFontSize, cursor: "pointer", textDecoration: "underline", alignSelf: "center" }}>
                  I'll take it from here
                </div>
              </div>
            </div>
          </div>
        )}

        {menuOpen && (
          <window.S.MenuModal state={state} dispatch={dispatch} onClose={() => setMenuOpen(false)} />
        )}
      </div>
    );
  }

  Object.assign(window.S, { PortScreen });
})();