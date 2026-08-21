// screens_combat.jsx — Combat & resolution screens
// Event, Intercept, Battle, Plunder — the screens where the world acts on you
// and you must resolve the current situation before navigating freely.
//
// Depends on: window.D, window.L, window.E, window.UI, window.S
// Exposes:    EventScreen, InterceptScreen, BattleScreen, PlunderScreen on window.S
//
// Loaded after screens_voyage.jsx so it can pick up MapScreen/SailingScreen
// dependencies if needed (currently none — fully self-contained).

window.S = window.S || {};
(() => {
  const { useState, useRef, useEffect, useMemo } = React;
  const { PORTS, SHIPS, FACTIONS } = window.D;
  const L = window.L;
  const A = window.E.A;
  const {
    T, panelStyle, Bar, Pill, Btn, SectionTitle, EmptyState,
    TutorialPopup, BackButton, Panel,
    IconSailboat, IconAnchor, IconSwords, IconCannon, IconTarget,
    IconGrapple, IconWind, IconSkull,
    getGoodIcon, useFlashOnChange,
    TransferLayout, ShipSideSprite,
    FactionPill, ShipSprite,
  } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // Import distance-based action lookup
  const { LEGAL_ACTIONS_BY_DISTANCE } = window.D;

  // ── Action preview helper ──────────────────────────────────────────────
  function getActionPreview(state, action, distance, enemy, battle = null) {
    const shipStats = L.getShipStats(state);
    const cannons = shipStats.cannons;
    const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS[action]?.[distance] || 1.0;
    const hullDmgPct = L.getEquipmentEffect(state, "hullDmgPct") || 0;
    const crewDmgPct = L.getEquipmentEffect(state, "crewDmgPct") || 0;

    // Broadside: cannons * (0.8–1.2) * mult
    if (action === "broadside") {
      const baseMin = cannons * 0.8 * mult;
      const baseMax = cannons * 1.2 * mult;
      const hullMin = Math.max(1, Math.floor(baseMin * 0.6 * (1 + hullDmgPct)));
      const hullMax = Math.max(1, Math.floor(baseMax * 0.6 * (1 + hullDmgPct)));
      const crewMin = Math.floor(baseMin * 0.4 / 3 * (1 + crewDmgPct));
      const crewMax = Math.floor(baseMax * 0.4 / 3 * (1 + crewDmgPct));
      return {
        description: "Full cannon volley. Reliable damage.",
        hullRange: [hullMin, hullMax],
        crewRange: [crewMin, crewMax],
        hitChance: 1.0,
      };
    }

    // Precision: cannons * (1.2–1.8) * mult  (fixed)
    if (action === "precision") {
      const hitChance = Math.min(1, 0.7 + (L.getEquipmentEffect(state, "precisionHitPct") || 0));
      const baseMin = cannons * 1.2 * mult;
      const baseMax = cannons * 1.8 * mult;
      const hullMin = Math.max(1, Math.floor(baseMin * 0.9 * (1 + hullDmgPct)));
      const hullMax = Math.max(1, Math.floor(baseMax * 0.9 * (1 + hullDmgPct)));
      const crewMin = Math.floor(baseMin * 0.1 / 3 * (1 + crewDmgPct));
      const crewMax = Math.floor(baseMax * 0.1 / 3 * (1 + crewDmgPct));
      return {
        description: "Aimed shot. High damage if it hits.",
        hullRange: [hullMin, hullMax],
        crewRange: [crewMin, crewMax],
        hitChance,
      };
    }

    // Continue Fighting – deterministic (fixed)
    if (action === "continue_fighting" && battle) {
      const ratio = L.getBoardingRatio(state, battle, enemy);
      const crew = battle.playerCrew;
      const enemyCrew = battle.enemyCrew;
      const playerLoss = Math.ceil(crew * 0.15 * (1 - ratio));
      const enemyLoss = Math.ceil(enemyCrew * 0.15 * ratio);
      return {
        description: "Press the attack in boarding.",
        crewLossPlayer: playerLoss,
        crewLossEnemy: enemyLoss,
        advantage: Math.round(ratio * 100),
        hitChance: null,
      };
    }

    // All other actions (static descriptions)
    const staticDescriptions = {
      grapple: "Board the enemy ship. Requires Close range.",
      evade: "Attempt to flee. Speed check.",
      close_distance: "Move closer to the enemy.",
      open_distance: "Move further away.",
      fall_back: "Return to naval combat. Costs crew.",
      demand_surrender: "Force them to yield (requires advantage).",
      surrender: "Yield to the enemy.",
    };
    return {
      description: staticDescriptions[action] || "",
      hullRange: null,
      crewRange: null,
      hitChance: null,
    };
  }

  // ── Detect if the player's action missed or failed ──────────────────
  const MISS_PHRASES = [
    "splashes harmlessly",
    "goes wide",
    "overcorrect and miss",
    "flies past the enemy",
    "Your grapple fails",
    "repels your boarders",
    "thrown back",
  ];
  const isPlayerMissOrFail = (text) => {
    if (!text) return false;
    return MISS_PHRASES.some(phrase => text.includes(phrase));
  };

  // Equipment that has visual representation on the ship sprite
  const VISUAL_EQUIPMENT = ["war_pennants", "extra_sails", "lateen_rig"];

  const getVisualEquipment = (state) => {
    const allEquipped = [
      ...(state.ship.equipment?.hull || []),
      ...(state.ship.equipment?.armament || []),
      ...(state.ship.equipment?.rigging || []),
      ...(state.ship.equipment?.special || []),
    ];
    return allEquipped.filter(key => VISUAL_EQUIPMENT.includes(key));
  };

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
        flex: 1, padding: T.spacing.xl,
        background: `radial-gradient(ellipse at 50% 40%, #0a1828 0%, ${T.bg} 70%)`,
      }}>
        <Panel color={typeColor[ev.type] ?? T.border} style={{ maxWidth: 500, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Pill label={ev.type} color={typeColor[ev.type] ?? T.textDim} />
            <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>Day {state.day}</span>
          </div>
          <div style={{
            color: T.gold, fontSize: T.heading1FontSize, fontWeight: "bold", marginBottom: 8,
          }}>{ev.title}</div>
          <p style={{
            color: T.text, fontSize: T.narrativeFontSize, marginBottom: 20,
            lineHeight: T.narrativeLineHeight,
          }}>{ev.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: T.spacing.sm }}>
            {ev.choices.map((c, i) => (
              <Panel
                key={i}
                style={{ background: T.panelAlt, cursor: "pointer", transition: "border-color 0.15s" }}
                onClick={() => dispatch({ type: A.RESOLVE_EVENT, choiceIndex: i })}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.borderBr}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <div style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold", marginBottom: 3 }}>{c.label}</div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{c.outcome.log}</div>
              </Panel>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  // ── INTERCEPT SCREEN ──────────────────────────────────────────────────
  const InterceptScreen = ({ state, dispatch }) => {
    const session = state.encounterSession;
    if (!session || session.phase !== "intercept") return null;
    const { enemy, intercept } = session;
    const enemyShip = SHIPS[enemy.shipType || L.guessShipType(enemy)] || {};

    return (
      <div style={{ padding: T.spacing.xl, maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", letterSpacing: "0.08em" }}>
          ⚠ ENCOUNTER
        </div>

        <Panel color={T.borderBr}>
          <p style={{ color: T.text, fontSize: T.narrativeFontSize, lineHeight: 1.6 }}>{intercept.flavourText}</p>
        </Panel>

        <Panel>
          <div style={{ color: T.redBr, fontSize: T.heading1FontSize, fontWeight: "bold", marginBottom: 8 }}>
            {enemy.name}
            <span style={{ color: T.textDim, fontWeight: "normal", marginLeft: 8, fontSize: T.narrativeFontSize }}>
              {enemyShip.name ?? enemy.shipType ?? enemy.ship}
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
        </Panel>

        <Panel>
          <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 10, letterSpacing: "0.08em" }}>
            CHOOSE YOUR RESPONSE:
          </div>
          {intercept.options.map(opt => (
            <div key={opt.id} style={{ marginBottom: 8 }}>
              <Btn
                v={opt.available
                  ? opt.id === "fight" ? "red"
                    : opt.id === "inspect" ? "default"
                    : "default"
                  : "ghost"}
                disabled={!opt.available}
                onClick={() => opt.available && dispatch(opt.action)}
                style={{ width: "100%", textAlign: "left", opacity: opt.available ? 1 : 0.45 }}
              >
                {opt.label}
              </Btn>
              {!opt.available && opt.reason && (
                <div style={{ color: T.textFaint, fontSize: T.captionFontSize, marginTop: 2, marginLeft: 4 }}>
                  ✗ {opt.reason}
                </div>
              )}
              {opt.id === "flee" && opt.available && opt.speedCheck && (
                <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginTop: 2, paddingLeft: 4 }}>
                  Speed check: your {opt.speedCheck.player} vs their {opt.speedCheck.enemy}
                </div>
              )}
            </div>
          ))}
        </Panel>
      </div>
    );
  };

    // ── BATTLE SCREEN ─────────────────────────────────────────────────────
  function BattleScreen({ state, dispatch }) {
    const session = state.encounterSession;
    if (!session || session.phase !== "battle" || !session.battle) return null;
    const battle = session.battle;
    const enemy = session.enemy;
    const done = ["victory", "defeat", "fled"].includes(battle.phase);
    const isBoarding = battle.subPhase === "boarding";
    const playerPct = battle.playerHull / SHIPS[state.ship.type].maxHull;
    const enemyPct = battle.enemyHull / enemy.hull;
    const [showTutorial, setShowTutorial] = React.useState(
      () => shouldShowTutorial(state, "battle")
    );
    const [pulsedAction, setPulsedAction] = useState(null);

    // ── Boarding ratio (now using the same function as the resolver) ──
    const ratio = L.getBoardingRatio(state, battle, enemy);
    const playerRatioPct = Math.round(ratio * 100);
    const enemyRatioPct = 100 - playerRatioPct;

    // ── Boarding action availability ──────────────────────────────
    const canDemandSurrender = isBoarding && ratio >= 0.65;
    const demandSurrenderTooltip = !isBoarding
      ? "Not in boarding phase"
      : ratio < 0.65
        ? `Need a clear advantage (${Math.round(ratio * 100)}% / 65% required)`
        : "";

    // ── Action previews ──────────────────────────────────────────────
    const actionPreviews = useMemo(() => {
      const previews = {};
      const actions = ["broadside", "precision", "grapple", "evade", "close_distance", "open_distance"];
      if (isBoarding) {
        actions.push("continue_fighting", "fall_back", "demand_surrender", "surrender");
      }
      actions.forEach(a => {
        if (isBoarding && ["broadside", "precision", "grapple", "evade", "close_distance", "open_distance"].includes(a)) {
          previews[a] = { description: "Not available in boarding.", hullRange: null, crewRange: null, hitChance: null };
        } else {
          previews[a] = getActionPreview(state, a, battle.distance, enemy, isBoarding ? battle : null);
        }
      });
      return previews;
    }, [state, battle.distance, enemy, isBoarding, battle]);

    const [missFlash, setMissFlash] = useState(false);
    const prevLogLen = useRef(battle.log?.length || 0);

    useEffect(() => {
      if (!battle) return;
      const newLen = battle.log.length;
      if (newLen > prevLogLen.current) {
        const latest = battle.log[newLen - 1] || "";
        if (isPlayerMissOrFail(latest)) {
          setMissFlash(true);
          const timer = setTimeout(() => setMissFlash(false), 600);
          return () => clearTimeout(timer);
        }
      }
      prevLogLen.current = newLen;
    }, [battle?.log?.length]);

    const [isNarrowBattle, setIsNarrowBattle] = React.useState(window.innerWidth < 700);
    React.useEffect(() => {
      const handle = () => setIsNarrowBattle(window.innerWidth < 700);
      window.addEventListener("resize", handle);
      return () => window.removeEventListener("resize", handle);
    }, []);

    // ── Distance gating (naval only) ──────────────────────────────
    const legalActions = LEGAL_ACTIONS_BY_DISTANCE[battle.distance] || [];
    const isActionLegal = (action) => legalActions.includes(action);

    // ── Tooltip with crew check for Grapple ────────────────────────
    const getActionTooltip = (action) => {
      if (action === "grapple") {
        const messages = [];
        const legal = isActionLegal(action);
        const isCrewZero = battle.playerCrew === 0;
        if (!legal) messages.push("Grapple requires Close distance.");
        if (isCrewZero) messages.push("No crew left to board with.");
        return messages.length > 0 ? messages.join(" ") : null;
      }
      if (isActionLegal(action)) return null;
      const map = {
        broadside: "Broadside is available at all distances",
        precision: "Precision is available at all distances",
        close_distance: "Close Distance requires Far or Medium distance",
        open_distance: "Open Distance requires Medium or Close distance",
        evade: "Evade requires Far distance",
      };
      return map[action] || "Not available at this distance";
    };

    // ── Distance indicator component ────────────────────────────────
    const DistanceIndicator = () => {
      const distances = ["far", "medium", "close"];
      const labels = ["Far", "Medium", "Close"];
      const currentIndex = distances.indexOf(battle.distance);

      return (
        <Panel style={{ padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <span style={{ color: T.textDim, fontSize: T.metadataFontSize }}>
            Distance: <span style={{ color: T.gold, fontWeight: "bold", fontSize: T.heading3FontSize }}>
              {battle.distance.toUpperCase()}
            </span>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {distances.map((d, i) => {
              const isActive = i === currentIndex;
              const isPast = i < currentIndex;
              const dotColor = isActive ? T.gold : isPast ? T.goldDim : T.textFaint;
              return (
                <div key={d} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: dotColor,
                    border: isActive ? `2px solid ${T.gold}` : "none",
                    boxShadow: isActive ? `0 0 8px ${T.gold}55` : "none",
                    transition: "all 0.2s",
                  }} />
                  {i < distances.length - 1 && (
                    <div style={{
                      width: 16,
                      height: 2,
                      background: isPast ? T.goldDim : T.textFaint,
                      opacity: isPast ? 0.6 : 0.3,
                      margin: "0 2px",
                      transition: "all 0.2s",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <span style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic" }}>
            {battle.distance === "far" && "Long range – cannons at full spread"}
            {battle.distance === "medium" && "Standard engagement range"}
            {battle.distance === "close" && "Point-blank – boarding range"}
          </span>
        </Panel>
      );
    };

    // ── Advantage Bar (boarding phase) ──────────────────────────────
    const AdvantageBar = () => {
      if (!isBoarding) return null;

      // Use the same ratio as the resolver
      const pPct = Math.round(ratio * 100);
      const ePct = 100 - pPct;

      // For display: effective crew counts (same as resolver)
      const playerEffective = Math.round(battle.playerCrew * (0.5 + state.crew.morale / 200));
      const enemyMoraleStandin = { low: 50, medium: 65, high: 80, assault: 90 }[enemy.risk] ?? 60;
      const enemyEffective = Math.round(battle.enemyCrew * (0.5 + enemyMoraleStandin / 200));

      return (
        <Panel style={{ marginBottom: 8 }}>
          <div style={{ position: "relative", height: 24, borderRadius: 2, overflow: "hidden", background: T.bgDeep }}>
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${pPct}%`,
              background: T.greenBr,
              transition: "width 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                color: "#000",
                fontWeight: "bold",
                fontSize: T.metadataFontSize,
                textShadow: "0 0 4px rgba(255,255,255,0.3)",
              }}>
                {pPct}%
              </span>
            </div>

            <div style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: `${ePct}%`,
              background: T.redBr,
              transition: "width 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{
                color: "#000",
                fontWeight: "bold",
                fontSize: T.metadataFontSize,
                textShadow: "0 0 4px rgba(255,255,255,0.3)",
              }}>
                {ePct}%
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: T.metadataFontSize }}>
            <div style={{ color: T.greenBr }}>
              <span style={{ color: T.text }}>Your crew: {battle.playerCrew}</span>
              <span style={{ color: T.textDim, marginLeft: 8 }}>Morale: {state.crew.morale}%</span>
              <span style={{ color: T.textDim, marginLeft: 8 }}>Effective: {playerEffective}</span>
            </div>
            <div style={{ color: T.redBr, textAlign: "right" }}>
              <span style={{ color: T.text }}>Enemy crew: {battle.enemyCrew}</span>
              <span style={{ color: T.textDim, marginLeft: 8 }}>Morale: {enemyMoraleStandin}%</span>
              <span style={{ color: T.textDim, marginLeft: 8 }}>Effective: {enemyEffective}</span>
            </div>
          </div>
        </Panel>
      );
    };

    // ── Color maps for action buttons ──────────────────────────────────
    const navalColors = {
      broadside: T.redBr,
      precision: T.yellow,
      grapple: T.blueBr,
      evade: T.greenBr,
      open_distance: T.greenBr,
      close_distance: T.greenBr,
    };

    const boardingColors = {
      continue_fighting: T.greenBr,
      fall_back: T.goldDim,
      demand_surrender: T.blueBr,
      surrender: T.redBr,
    };

    return (
      <div style={{
        padding: T.spacing.lg, maxWidth: 680, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: T.spacing.md,
        overflowY: "auto", flex: 1,
      }}>
        {showTutorial && (
          <TutorialPopup
            title={isBoarding ? "Boarding Phase" : "Naval Combat"}
            onDismiss={(disableAll) => {
              markTutorialSeen("battle", disableAll);
              setShowTutorial(false);
            }}
          >
            {isBoarding ? (
              <>
                <p>You've grappled the enemy ship! Choose your action:</p>
                <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
                  <li><strong>Continue Fighting</strong> — keep pressing the attack</li>
                  <li><strong>Fall Back</strong> — retreat and return to naval combat</li>
                  <li><strong>Demand Surrender</strong> — force them to yield (requires clear advantage)</li>
                  <li><strong>Surrender</strong> — yield to the enemy</li>
                </ul>
                <p>The advantage bar shows your relative boarding strength based on crew count and morale.</p>
              </>
            ) : (
              <>
                <p>Choose an action each round:</p>
                <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
                  <li><strong>Broadside</strong> — reliable cannon volley</li>
                  <li><strong>Precision</strong> — risky but devastating if it hits</li>
                  <li><strong>Close Distance</strong> — move closer to the enemy</li>
                  <li><strong>Open Distance</strong> — move further away</li>
                  <li><strong>Grapple</strong> — board the enemy and move to Boarding phase of the combat.</li>
                  <li><strong>Evade</strong> — attempt to flee the battle, depend on your ship speed.</li>
                </ul>
                <p>Watch your hull and crew. If your hull reaches zero, you lose. Loosing all crew results in capture.</p>
              </>
            )}
          </TutorialPopup>
        )}

        <div style={{
          textAlign: "center", color: isBoarding ? T.blueBr : T.redBr,
          fontSize: T.heading2FontSize,
          fontWeight: "bold", letterSpacing: "0.1em",
        }}>
          {isBoarding ? (
            <><IconSwords size={22} color={T.blueBr} /> BOARDING ACTION — ROUND {battle.round}</>
          ) : (
            <><IconSwords size={22} color={T.redBr} /> NAVAL BATTLE — ROUND {battle.round}</>
          )}
        </div>

        {/* ── Ship panels (naval only) ────────────────────────────── */}
        {!isBoarding && (
          (() => {
            const playerType = state.ship.type;
            const enemyType = L.guessShipType(enemy);
            const playerVisual = window.D.SHIP_VISUALS?.[playerType];
            const enemyVisual = window.D.SHIP_VISUALS?.[enemyType];

            const playerLen = playerVisual?.hullLength || 400;
            const enemyLen = enemyVisual?.hullLength || 400;
            const maxLen = Math.max(playerLen, enemyLen);
            const playerSize = playerLen / maxLen;
            const enemySize = enemyLen / maxLen;

            const baseW = isNarrowBattle ? 150 : 270;
            const baseH = isNarrowBattle ? 100 : 175;

            return (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 26px 1fr", gap: 4, alignItems: "stretch" }}>
                {/* Player ship panel */}
                <Panel color={T.blueBr} style={{ padding: 8 }}>
                  <div style={{
                    background: T.bgDeep,
                    borderRadius: 3,
                    border: `1px solid ${T.borderFaint}`,
                    padding: 4,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: baseH + 8,
                  }}>
                    <ShipSideSprite
                      type={playerType}
                      faction={null}
                      equipment={getVisualEquipment(state)}
                      width={Math.round(baseW * playerSize)}
                      height={Math.round(baseH * playerSize)}
                      facing="right"
                    />
                  </div>
                  <div style={{ color: T.blueBr, fontSize: T.heading1FontSize, marginBottom: 4 }}>{state.ship.name}</div>
                  <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>Hull: {battle.playerHull} / {SHIPS[state.ship.type].maxHull}</div>
                  <Bar value={battle.playerHull} max={SHIPS[state.ship.type].maxHull} color={playerPct >= 0.6 ? T.greenBr : playerPct >= 0.3 ? T.gold : T.redBr} h={10} />
                  {battle.convoyHull !== undefined && (
                    <>
                      <div style={{ color: T.textDim, fontSize: 9, marginTop: 6 }}>Convoy Hull: {battle.convoyHull} / 50</div>
                      <Bar value={battle.convoyHull} max={50} color={battle.convoyHull / 50 >= 0.6 ? T.greenBr : battle.convoyHull / 50 >= 0.3 ? T.gold : T.redBr} h={8} />
                    </>
                  )}
                  <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>{state.crew.roster.length} crew · {L.getShipStats(state).cannons} cannons</div>
                </Panel>

                <div style={{ textAlign: "center", color: T.redBr, fontSize: 22 }}>⚡</div>

                {/* Enemy ship panel */}
                <Panel color={T.red} style={{ padding: 8 }}>
                  <div style={{
                    background: T.bgDeep,
                    borderRadius: 3,
                    border: `1px solid ${T.borderFaint}`,
                    padding: 4,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: baseH + 8,
                  }}>
                    <ShipSideSprite
                      type={enemyType}
                      faction={enemy.faction}
                      equipment={[]}
                      width={Math.round(baseW * enemySize)}
                      height={Math.round(baseH * enemySize)}
                      facing="left"
                    />
                  </div>
                  <div style={{ color: T.redBr, fontSize: T.heading1FontSize, marginBottom: 4 }}>{enemy.name}</div>
                  <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>Hull: {battle.enemyHull} / {enemy.hull}</div>
                  <Bar value={battle.enemyHull} max={enemy.hull} color={enemyPct >= 0.6 ? T.greenBr : enemyPct >= 0.3 ? T.gold : T.redBr} h={10} />
                  <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>{battle.enemyCrew} crew · {enemy.cannons} cannons</div>
                  <div style={{ marginTop: 5 }}><FactionPill faction={enemy.faction} /></div>
                </Panel>
              </div>
            );
          })()
        )}

        {/* ── Boarding: Advantage Bar ────────────────────────────── */}
        {isBoarding && <AdvantageBar />}

        {/* ── Distance indicator (naval only) ────────────────────── */}
        {!isBoarding && <DistanceIndicator />}

        {isNarrowBattle && window.innerWidth < 400 && !isBoarding && (
          <div style={{
            fontSize: 9,
            color: T.textFaint,
            textAlign: "center",
            fontStyle: "italic",
            margin: "2px 0 6px"
          }}>
            Tip: rotate your phone to landscape for a better battle view
          </div>
        )}

        {/* ── Log panel ──────────────────────────────────────────── */}
        <div className={missFlash ? 'miss-flash-border' : ''}>
          <Panel style={{ background: T.bgDeep, display: "flex", flexDirection: "column" }}>
            <div style={{ height: 130, overflowY: "auto" }}>
              {[...battle.log].reverse().map((e, i) => {
                const isLatest = i === 0;
                const isMissFlash = isLatest && missFlash && isPlayerMissOrFail(e);
                return (
                  <div key={i} className={isMissFlash ? 'flash-red' : ''} style={{
                    color: isLatest ? T.text : T.textDim,
                    fontSize: T.narrativeFontSize,
                    marginBottom: 3,
                    lineHeight: T.narrativeLineHeight,
                  }}>{e}</div>
                );
              })}
            </div>
          </Panel>
        </div>

        {!done ? (
          <div>
            {isBoarding ? (
              // ── Boarding Actions ──────────────────────────────────
              <div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 8 }}>
                  BOARDING ACTIONS — {playerRatioPct}% advantage
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isNarrowBattle ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                  gap: T.spacing.sm,
                }}>
                  {[
                    { a: "continue_fighting", label: "Continue Fighting", desc: actionPreviews.continue_fighting?.description || "Press the attack" },
                    { a: "fall_back", label: "Fall Back", desc: actionPreviews.fall_back?.description || "Return to naval combat" },
                    { a: "demand_surrender", label: "Demand Surrender", desc: actionPreviews.demand_surrender?.description || "Force them to yield", disabled: !canDemandSurrender, tooltip: demandSurrenderTooltip },
                    { a: "surrender", label: "Surrender", desc: actionPreviews.surrender?.description || "Yield to the enemy" },
                  ].map(({ a, label, desc, disabled = false, tooltip = "" }) => {
                    const preview = actionPreviews[a] || {};
                    const playerLoss = preview.crewLossPlayer; 
                    const enemyLoss = preview.crewLossEnemy; 
                    const adv = preview.advantage !== undefined ? `Advantage: ${preview.advantage}%` : "";
                    const info = a === "continue_fighting"
                      ? `You lose: ${playerLoss} crew · Enemy loses: ${enemyLoss}  crew ${adv ? ` · ${adv}` : ''}`
                      : a === "fall_back"
                        ? `You lose: ${playerLoss} crew`
                        : "";
                    return (
                      <Panel
                        key={a}
                        color={disabled ? T.borderFaint : boardingColors[a]}   // <-- color applied here
                        className={`combat-btn ${pulsedAction === a ? 'clicked' : ''}`}
                        style={{
                          background: T.panelAlt,
                          cursor: disabled ? "not-allowed" : "pointer",
                          transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.15s",
                          opacity: disabled ? 0.5 : 1,
                        }}
                        onClick={() => {
                          if (disabled) return;
                          dispatch({ type: A.BATTLE_ACTION, action: a });
                          setPulsedAction(a);
                          setTimeout(() => setPulsedAction(null), 150);
                        }}
                        onMouseEnter={e => {
                          if (disabled) return;
                          const color = boardingColors[a];
                          e.currentTarget.style.borderColor = color;
                          e.currentTarget.style.boxShadow = `0 0 14px ${color}55`;
                          e.currentTarget.style.transform = "scale(1.03)";
                        }}
                        onMouseLeave={e => {
                          if (disabled) return;
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title={tooltip || ""}
                      >
                        <div style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold", marginBottom: 2 }}>
                          {label}
                        </div>
                        <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{desc}</div>
                        {info && (
                          <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>{info}</div>
                        )}
                        {disabled && tooltip && (
                          <div style={{ color: T.redBr, fontSize: 9, marginTop: 2 }}>✗ {tooltip}</div>
                        )}
                      </Panel>
                    );
                  })}
                </div>
              </div>
            ) : (
              // ── Naval Actions ────────────────────────────────────
              <div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 8 }}>CHOOSE YOUR ACTION:</div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: T.spacing.sm,
                  marginBottom: T.spacing.sm,
                }}>
                  {[  
                    { a: "broadside", label: <IconCannon size={14} color={T.redBr} />, lbl: " Broadside", desc: actionPreviews.broadside?.description || "Full cannon volley" },
                    { a: "precision", label: <IconTarget size={14} color={T.yellow} />, lbl: " Precision", desc: actionPreviews.precision?.description || "Aimed shot" },
                    { a: "grapple", label: <IconGrapple size={14} color={T.blueBr} />, lbl: " Grapple", desc: actionPreviews.grapple?.description || "Board the enemy" },
                  ].map(({ a, label, lbl, desc }) => {
                    const legal = isActionLegal(a);
                    const isCrewZero = a === "grapple" && battle.playerCrew === 0;
                    const disabled = !legal || isCrewZero;

                    // Determine the tooltip and inline message
                    let tooltip = null;
                    if (disabled) {
                      const messages = [];
                      if (!legal) messages.push("Grapple requires Close distance.");
                      if (isCrewZero) messages.push("No crew left to board with.");
                      tooltip = messages.join(" ");
                    }

                    const preview = actionPreviews[a] || {};
                    const hull = preview.hullRange ? `${preview.hullRange[0]}–${preview.hullRange[1]}` : null;
                    const crew = preview.crewRange ? `${preview.crewRange[0]}–${preview.crewRange[1]}` : null;
                    const hit = preview.hitChance !== null && preview.hitChance < 1 ? `Hit: ${Math.round(preview.hitChance*100)}%` : null;
                    const infoParts = [hull ? `Hull: ${hull}` : null, crew ? `Crew: ${crew}` : null, hit].filter(Boolean);
                    const info = infoParts.join(' · ');

                    return (
                      <Panel
                        key={a}
                        color={disabled ? T.borderFaint : navalColors[a]}
                        className={`combat-btn ${pulsedAction === a ? 'clicked' : ''}`}
                        style={{
                          background: T.panelAlt,
                          cursor: disabled ? "not-allowed" : "pointer",
                          transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.15s",
                          opacity: disabled ? 0.5 : 1,
                        }}
                        onClick={() => {
                          if (disabled) return;
                          dispatch({ type: A.BATTLE_ACTION, action: a });
                          setPulsedAction(a);
                          setTimeout(() => setPulsedAction(null), 150);
                        }}
                        onMouseEnter={e => {
                          if (disabled) return;
                          const color = navalColors[a];
                          e.currentTarget.style.borderColor = color;
                          e.currentTarget.style.boxShadow = `0 0 14px ${color}55`;
                          e.currentTarget.style.transform = "scale(1.03)";
                        }}
                        onMouseLeave={e => {
                          if (disabled) return;
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title={tooltip || ""}
                      >
                        <div style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold", marginBottom: 2 }}>
                          {label}{lbl}
                        </div>
                        <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{desc}</div>
                        {info && (
                          <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>{info}</div>
                        )}
                        {disabled && tooltip && (
                          <div style={{ color: T.redBr, fontSize: 9, marginTop: 2 }}>✗ {tooltip}</div>
                        )}
                      </Panel>
                    );
                  })}
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: T.spacing.sm,
                }}>
                  {[
                    { a: "evade", label: <IconWind size={14} color={T.greenBr} />, lbl: " Evade", desc: actionPreviews.evade?.description || "Flee if faster" },
                    { a: "open_distance", label: <IconWind size={14} color={T.greenBr} />, lbl: " Open Distance", desc: actionPreviews.open_distance?.description || "Move further away" },
                    { a: "close_distance", label: <IconGrapple size={14} color={T.greenBr} />, lbl: " Close Distance", desc: actionPreviews.close_distance?.description || "Move closer" },
                  ].map(({ a, label, lbl, desc }) => {
                    const legal = isActionLegal(a);
                    const tooltip = !legal ? (() => {
                      const map = {
                        close_distance: "Close Distance requires Far or Medium distance",
                        open_distance: "Open Distance requires Medium or Close distance",
                        evade: "Evade requires Far distance",
                      };
                      return map[a] || "Not available at this distance";
                    })() : null;
                    const preview = actionPreviews[a] || {};
                    return (
                      <Panel
                        key={a}
                        color={legal ? navalColors[a] : T.borderFaint}   // <-- color applied here
                        className={`combat-btn ${pulsedAction === a ? 'clicked' : ''}`}
                        style={{
                          background: T.panelAlt,
                          cursor: legal ? "pointer" : "not-allowed",
                          transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.15s",
                          opacity: legal ? 1 : 0.5,
                        }}
                        onClick={() => {
                          if (!legal) return;
                          dispatch({ type: A.BATTLE_ACTION, action: a });
                          setPulsedAction(a);
                          setTimeout(() => setPulsedAction(null), 150);
                        }}
                        onMouseEnter={e => {
                          if (!legal) return;
                          const color = navalColors[a];
                          e.currentTarget.style.borderColor = color;
                          e.currentTarget.style.boxShadow = `0 0 14px ${color}55`;
                          e.currentTarget.style.transform = "scale(1.03)";
                        }}
                        onMouseLeave={e => {
                          if (!legal) return;
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                        title={tooltip || ""}
                      >
                        <div style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold", marginBottom: 2 }}>
                          {label}{lbl}
                        </div>
                        <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{desc}</div>
                        {!legal && tooltip && (
                          <div style={{ color: T.redBr, fontSize: 9, marginTop: 2 }}>✗ {tooltip}</div>
                        )}
                      </Panel>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          // ── Victory / Defeat / Fled ──────────────────────────────
          <div style={{ textAlign: "center" }}>
            <div style={{
              color: battle.phase === "victory" ? T.greenBr : battle.phase === "fled" ? T.gold : T.redBr,
              fontSize: T.heading1FontSize,
              fontWeight: "bold",
              marginBottom: 8,
              letterSpacing: "0.08em",
            }}>
              {battle.phase === "victory" && (<><IconAnchor size={24} color={T.greenBr} /> VICTORY!</>)}
              {battle.phase === "fled" && (<><IconWind size={24} color={T.gold} /> ESCAPED</>)}
              {battle.phase === "defeat" && (<><IconSkull size={24} color={T.redBr} /> DEFEATED</>)}
            </div>
            {battle.phase === "victory" && battle.canPlunder ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
                <Btn v="gold" onClick={() => dispatch({ type: A.NAVIGATE, screen: "plunder" })}>
                  <IconAnchor size={12} color={T.gold} /> Plunder the Ship
                </Btn>
                <Btn onClick={() => dispatch({ type: A.DISMISS_BATTLE })}>
                  <IconSailboat size={12} color={T.text} /> Sail Away
                </Btn>
              </div>
            ) : (
              <>
                {battle.phase === "victory" && battle.goldReward > 0 && (
                  <div style={{ color: T.gold, fontSize: T.heading3FontSize, marginBottom: 14 }}>
                    +{battle.goldReward} gold
                  </div>
                )}
                <Btn v="gold" onClick={() => dispatch({ type: A.DISMISS_BATTLE })}>
                  {session.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
                    ? "Continue Voyage"
                    : session.returnScreen === "arrive" && state.destination
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

  // ── PLUNDER SCREEN ────────────────────────────────────────────────────
  function PlunderScreen({ state, dispatch }) {
    const session = state.encounterSession;
    if (!session || session.phase !== "plunder") return null;

    const battle = session.battle;
    if (!battle || !battle.canPlunder) return null;

    const enemyCargo = battle.enemyCargo || {};
    const goldReward = battle.goldReward || 0;
    const holdCapacity = L.getHoldCapacity(state) || 200;

    const [playerItems, setPlayerItems] = React.useState({ ...(state.hold?.items || {}) });
    const [enemyItems, setEnemyItems] = React.useState({ ...enemyCargo });

    const used = Object.values(playerItems).reduce((s, q) => s + q, 0);
    const free = Math.max(0, holdCapacity - used);

    const goodsValue = Object.entries(enemyItems).reduce((sum, [good, qty]) => {
      const res = window.D.RESOURCES[good];
      const price = res?.basePrice ?? 0;
      return sum + price * (qty || 0);
    }, 0);
    const totalValue = goldReward + goodsValue;

    const totalFlash = useFlashOnChange(totalValue, { direction: 'up' });

    const hasIllegal = Object.keys(enemyItems).some(
      g => window.D.RESOURCES[g]?.illegal
    );

    const enemyTotal = Object.values(enemyItems).reduce((s, q) => s + q, 0);

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

    const takeAll = () => {
      const priority = Object.entries(enemyItems)
        .map(([good, qty]) => ({ good, qty, price: window.D.RESOURCES[good]?.basePrice ?? 0 }))
        .filter(g => g.qty > 0)
        .sort((a, b) => b.price - a.price);

      let remainingFree = free;
      const newPlayer = { ...playerItems };

      for (const { good, qty } of priority) {
        const takeQty = Math.min(qty, remainingFree);
        if (takeQty > 0) {
          newPlayer[good] = (newPlayer[good] || 0) + takeQty;
          remainingFree -= takeQty;
        }
      }

      dispatch({ type: window.E.A.TAKE_PLUNDER, holdItems: newPlayer });
    };

    const handleConfirm = () => {
      dispatch({ type: window.E.A.TAKE_PLUNDER, holdItems: playerItems });
    };

    return (
      <div style={{ padding: T.spacing.xl, maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: T.gold, fontSize: T.heading1FontSize, fontWeight: "bold", textAlign: "center" }}>
          <IconAnchor size={24} color={T.gold} /> Plunder the <span style={{ color: T.redBr }}>{session.enemy.name}</span>
        </div>

        {/* ── Top summary panel ──────────────────────────────────── */}
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase" }}>Plunder gold</div>
              <div style={{ color: T.gold, fontSize: T.heading3FontSize }}>+{goldReward}g</div>
            </div>
            <div>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase" }}>Cargo value</div>
              <div style={{ color: T.text, fontSize: T.heading3FontSize }}>{goodsValue}g</div>
            </div>
            <div>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase" }}>Total haul</div>
              <div className={totalFlash} style={{ color: T.goldBr, fontSize: T.heading3FontSize, fontWeight: "bold" }}>
                {totalValue}g
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Btn v="gold" onClick={takeAll} disabled={free < 1 || enemyTotal === 0}>
                Take All
              </Btn>
            </div>
          </div>
          {hasIllegal && (
            <div style={{ marginTop: 8, color: T.red, fontSize: T.captionFontSize }}>
              ⚠ Illegal goods detected — patrols may inspect
            </div>
          )}
        </Panel>

        {/* ── Two‑column transfer layout ─────────────────────────── */}
        <TransferLayout
          leftTitle={`YOUR HOLD (${used}/${holdCapacity})`}
          leftContent={
            <div>
              <Bar value={used} max={holdCapacity} color={used > holdCapacity * 0.8 ? T.redBr : T.greenBr} h={8} />
              <div style={{ marginTop: 8 }}>
                {Object.keys(playerItems).length === 0 ? (
                  <EmptyState message="Your hold is empty." />
                ) : (
                  Object.entries(playerItems).map(([good, qty]) => (
                    <div key={good} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: T.text, fontSize: T.narrativeFontSize }}>
                        {getGoodIcon(good)}
                        {window.D.RESOURCES[good]?.name || good}
                        <span style={{ color: T.textDim }}> ×{qty}</span>
                      </span>
                      <Btn sm v="ghost" onClick={() => moveToEnemy(good)}>Jettison</Btn>
                    </div>
                  ))
                )}
              </div>
            </div>
          }
          rightTitle="ENEMY CARGO"
          rightContent={
            Object.keys(enemyItems).length === 0 ? (
              <EmptyState message="No cargo remaining." />
            ) : (
              (() => {
                let illegalDividerShown = false;
                return Object.entries(enemyItems).map(([good, qty]) => {
                  const isIllegal = window.D.RESOURCES[good]?.illegal;
                  const showDivider = isIllegal && !illegalDividerShown;
                  if (showDivider) illegalDividerShown = true;

                  return (
                    <React.Fragment key={good}>
                      {showDivider && (
                        <div style={{
                          borderTop: `1px solid ${T.redBr}`,
                          margin: "4px 0",
                          opacity: 0.5,
                        }} />
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ color: T.text, fontSize: T.narrativeFontSize }}>
                          {getGoodIcon(good)}
                          {window.D.RESOURCES[good]?.name || good}
                          {isIllegal && <span style={{ color: T.redBr }}> ⚠</span>}
                          <span style={{ color: T.textDim, marginLeft: 6 }}>×{qty}</span>
                        </span>
                        <Btn sm onClick={() => moveToPlayer(good)} disabled={free < 1}>+ Take</Btn>
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )
          }
        />

        {/* ── Confirm ────────────────────────────────────────────── */}
        <Panel style={{ textAlign: "center" }}>
          <div style={{ color: T.gold, fontSize: T.heading3FontSize, marginBottom: 10 }}>
            Plunder gold: +{goldReward}g
          </div>
          <Btn v="gold" onClick={handleConfirm} style={{ fontSize: T.heading3FontSize, padding: "8px 20px" }}>
            Confirm Plunder
          </Btn>
        </Panel>
      </div>
    );
  }

  Object.assign(window.S, { EventScreen, InterceptScreen, BattleScreen, PlunderScreen });
})();