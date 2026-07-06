// screens_port.jsx — Port-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS, RESOURCES, QM_DIALOGUE } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, PulseBtn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip, Panel,
  IconMap, IconBarChart, IconMarket, IconJournal, IconAnchor, IconCrew, IconFloppy, IconFileTransfer, IconTalking, IconGold, IconSkull, IconHandshake, IconSearch, PortSilhouette, IconCoins, IconAttention, } = window.UI;
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

  return (
    <div style={{
      display: "flex",
      flexDirection: isNarrow ? "column" : "row",
      gap: T.spacing.md,
      padding: T.spacing.lg,
      //overflowY: "auto",
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
        //overflowY: "auto",
      }}>
        {/* Port header + description + gossip */}
        <Panel>
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
        <SectionTitle action= {
        <Tooltip text="Manage your game and access community links.">
          <Btn v="ghost" onClick={() => setMenuOpen(true)}>Game Menu</Btn>
        </Tooltip> }
  >
        ACTIONS</SectionTitle>
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
        
      
         <div style={{ marginTop: 8 }}>
        </div>
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
                <span style={{ color: T.gold, fontSize: T.metadataFontSize, display: "flex", alignItems: "center", gap: 3 }}>
                  <IconCoins size={12} color={T.gold} /> {state.activeMission.gold}
                </span>
                <span style={{ color: T.blueBr, fontSize: T.metadataFontSize }}>★ {state.activeMission.fame}</span>
              </div>
              {(() => {
                const harmed = getHarmedFaction(state.activeMission);
                if (!harmed) return null;
                const harmedColor = FACTIONS[harmed.faction]?.color || T.redBr;
                return (
                  <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 8, display: "flex", alignItems: "center", gap: 3 }}>
                    <IconAttention size={12} color={harmedColor} />
                    Will impact negatively the {FACTIONS[harmed.faction]?.label || harmed.faction}
                  </div>
                );
              })()}
              {state.activeMission.type === "patrol" && (
                <div style={{ color: T.gold, fontSize: T.captionFontSize, marginBottom: 8 }}>
                  ⚡ Sail near {PORTS[state.activeMission.targetPort]?.name || "the target port"} and advance days. The enemy will appear with time.
                </div>
              )}
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
          {!port.services.includes("missions") ? (
            <EmptyState message="No mission board in this port." />
          ) : state.missions.length === 0 ? (
            <EmptyState message="No missions posted. Try refreshing." />
          ) : (
            <div style={{ overflowY: "auto", flex: 1, padding: "3px"  }}>
              {state.missions.map((m, i) => (
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
                  {m.enemy && (
                    <div style={{ color: T.textDim, fontSize: T.captionFontSize, margin: "0 0 6px" }}>
                      Enemy: {m.enemy.name} ({FACTIONS[m.enemy.faction]?.label || m.enemy.faction}) — {m.enemy.cannons} cannons, hull {m.enemy.hull}, crew {m.enemy.crew}
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
                    <span style={{ color: T.gold, fontSize: T.metadataFontSize, display: "flex", alignItems: "center", gap: 3 }}>
                      <IconCoins size={12} color={T.gold} /> {m.gold}
                    </span>
                    <span style={{ color: T.blueBr, fontSize: T.metadataFontSize }}>★ {m.fame}</span>
                    {(() => {
                      const harmed = getHarmedFaction(m);
                      if (!harmed) return null;
                      const harmedColor = FACTIONS[harmed.faction]?.color || T.redBr;
                      return (
                        <div style={{ color: T.textDim, fontSize: T.captionFontSize, display: "flex", alignItems: "center", gap: 3 }}>
                          <IconAttention size={12} color={harmedColor} />
                          Will impact negatively the {FACTIONS[harmed.faction]?.label || harmed.faction}
                        </div>
                      );
                    })()}
                    {m.type === "patrol" && (
                      <div style={{ color: T.gold, fontSize: T.captionFontSize }}>
                        ⚡ Sail near {PORTS[m.targetPort]?.name || "the target port"} and advance days. The enemy will appear with time.
                      </div>
                    )}
                    <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>→ {PORTS[m.targetPort]?.name}</span>
                    <Tooltip text="Take this mission as your active objective.">
                      <Btn sm v="gold" disabled={!!state.activeMission} onClick={() => dispatch({ type: A.TAKE_MISSION, mission: m })}>Accept</Btn>
                    </Tooltip>
                  </div>
                </Panel>
              ))}
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


  // ── EXPORT ALL SCREENS ──────────────────────────────────────────────
  Object.assign(window.S, {
    PortScreen,
  });
})();