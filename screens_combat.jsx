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
  const { useState, useRef, useEffect } = React;
  const { PORTS, SHIPS, FACTIONS } = window.D;
  const L = window.L;
  const A = window.E.A;
  const {
    T, panelStyle, Bar, Pill, Btn, SectionTitle, EmptyState,
    TutorialPopup, BackButton,
    IconSailboat, IconAnchor, IconSwords, IconCannon, IconTarget,
    IconGrapple, IconWind, IconSkull,
    getGoodIcon, useFlashOnChange,TransferLayout,
  } = window.UI;
  const { FactionPill, ShipSprite } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

// -- HELPERS ----------------

// Detect if the player's action missed or failed
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
        <div style={{
          ...panelStyle({ maxWidth: 500, width: "100%" }),
          borderColor: typeColor[ev.type] ?? T.border,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Pill label={ev.type} color={typeColor[ev.type] ?? T.textDim} />
            <span style={{ color: T.textDim, fontSize: 10 }}>Day {state.day}</span>
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
              <div
                key={i}
                onClick={() => dispatch({ type: A.RESOLVE_EVENT, choiceIndex: i })}
                style={{ ...panelStyle({ background: T.panelAlt, cursor: "pointer", transition: "border-color 0.15s" }) }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.borderBr}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
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

    return (
      <div style={{ padding: T.spacing.xl, maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", letterSpacing: "0.08em" }}>
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

  // ── BATTLE SCREEN ─────────────────────────────────────────────────────
  function BattleScreen({ state, dispatch }) {
    const bs = state.battleState;
    if (!bs) return null;
    const done = ["victory", "defeat", "fled"].includes(bs.phase);
    const playerPct = bs.playerHull / SHIPS[state.ship.type].maxHull;
    const enemyPct = bs.enemyHull / bs.enemy.hull;
    const [showTutorial, setShowTutorial] = React.useState(
      () => shouldShowTutorial(state, "battle")
    );
    const [pulsedAction, setPulsedAction] = useState(null);

    const [missFlash, setMissFlash] = useState(false);
    const prevLogLen = useRef(state.battleState?.log?.length || 0);

    useEffect(() => {
      const bs = state.battleState;
      if (!bs) return;
      const newLen = bs.log.length;
      if (newLen > prevLogLen.current) {
        const latest = bs.log[newLen - 1] || "";
        if (isPlayerMissOrFail(latest)) {
          setMissFlash(true);
          const timer = setTimeout(() => setMissFlash(false), 600);
          return () => clearTimeout(timer);
        }
      }
      prevLogLen.current = newLen;
    }, [state.battleState?.log?.length]);


    return (
      <div style={{
        padding: T.spacing.lg, maxWidth: 680, margin: "0 auto",
        display: "flex", flexDirection: "column", gap: T.spacing.md,
        overflowY: "auto", flex: 1,
      }}>
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

        <div style={{
          textAlign: "center", color: T.redBr, fontSize: T.heading2FontSize,
          fontWeight: "bold", letterSpacing: "0.1em",
        }}>
          <IconSwords size={22} color={T.redBr} /> NAVAL BATTLE — ROUND {bs.round}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 36px 1fr", gap: 10, alignItems: "center" }}>
          <div style={panelStyle({ borderColor: T.blueBr })}>
            <div style={{ color: T.blueBr, fontSize: 10, marginBottom: 4 }}>{state.ship.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>
              Hull: {bs.playerHull} / {SHIPS[state.ship.type].maxHull}
            </div>
            <Bar
              value={bs.playerHull}
              max={SHIPS[state.ship.type].maxHull}
              color={playerPct >= 0.6 ? T.greenBr : playerPct >= 0.3 ? T.gold : T.redBr}
              h={10}
            />
            {bs.convoyHull !== undefined && (
              <>
                <div style={{ color: T.textDim, fontSize: 9, marginTop: 6 }}>Convoy Hull: {bs.convoyHull} / 50</div>
                <Bar
                  value={bs.convoyHull}
                  max={50}
                  color={bs.convoyHull / 50 >= 0.6 ? T.greenBr : bs.convoyHull / 50 >= 0.3 ? T.gold : T.redBr}
                  h={8}
                />
              </>
            )}
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>
              {state.crew.roster.length} crew · {L.getShipStats(state).cannons} cannons
            </div>
          </div>

          <div style={{ textAlign: "center", color: T.redBr, fontSize: 22 }}>⚡</div>

          <div style={panelStyle({ borderColor: T.red })}>
            <div style={{ color: T.redBr, fontSize: 10, marginBottom: 4 }}>{bs.enemy.name}</div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>
              Hull: {bs.enemyHull} / {bs.enemy.hull}
            </div>
            <Bar
              value={bs.enemyHull}
              max={bs.enemy.hull}
              color={enemyPct >= 0.6 ? T.greenBr : enemyPct >= 0.3 ? T.gold : T.redBr}
              h={10}
            />
            <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>
              {bs.enemyCrew} crew · {bs.enemy.cannons} cannons
            </div>
            <div style={{ marginTop: 5 }}><FactionPill faction={bs.enemy.faction} /></div>
          </div>
        </div>

        <div className={missFlash ? 'miss-flash-border' : ''} style={{
          ...panelStyle({ background: T.bgDeep, height: 130, overflowY: "auto" }),
        }}>
          {[...bs.log].reverse().map((e, i) => {
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

        {!done ? (
          <div>
            <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>CHOOSE YOUR ACTION:</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth < 480 ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
              gap: T.spacing.sm,
            }}>
              {[
                { a: "broadside", label: React.createElement(IconCannon, { size: 14, color: T.redBr }), lbl: " Broadside", desc: "Full cannon volley. Reliable damage.", glow: T.redBr },
                { a: "precision", label: React.createElement(IconTarget, { size: 14, color: T.yellow }), lbl: " Precision", desc: "Aimed shot. Miss or massive damage.", glow: T.yellow },
                { a: "grapple",   label: React.createElement(IconGrapple, { size: 14, color: T.blueBr }), lbl: " Grapple",   desc: "Board them. Requires crew advantage.", glow: T.blueBr },
                { a: "evade",     label: React.createElement(IconWind, { size: 14, color: T.greenBr }), lbl: " Evade",     desc: "Flee if faster. Reduced incoming fire.", glow: T.greenBr },
              ].map(({ a, label, lbl, desc, glow }) => (
                <div
                  key={a}
                  className={`combat-btn ${pulsedAction === a ? 'clicked' : ''}`}
                  onClick={() => {
                    dispatch({ type: A.BATTLE_ACTION, action: a });
                    setPulsedAction(a);
                    setTimeout(() => setPulsedAction(null), 150);
                  }}
                  style={{
                    ...panelStyle({ background: T.panelAlt, cursor: "pointer", transition: "transform 0.12s ease, box-shadow 0.12s ease, border-color 0.15s" }),
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.borderBr;
                    e.currentTarget.style.boxShadow = `0 0 14px ${glow}55`;   // 33% opacity
                    e.currentTarget.style.transform = "scale(1.03)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <div style={{ color: T.text, fontSize: 12, fontWeight: "bold", marginBottom: 2 }}>
                    {label}{lbl}
                  </div>
                  <div style={{ color: T.textDim, fontSize: 10 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{
              color: bs.phase === "victory" ? T.greenBr : bs.phase === "fled" ? T.gold : T.redBr,
              fontSize: T.heading1FontSize,
              fontWeight: "bold",
              marginBottom: 8,
              letterSpacing: "0.08em",
            }}>
              {bs.phase === "victory" && (<><IconAnchor size={24} color={T.greenBr} /> VICTORY!</>)}
              {bs.phase === "fled" && (<><IconWind size={24} color={T.gold} /> ESCAPED</>)}
              {bs.phase === "defeat" && (<><IconSkull size={24} color={T.redBr} /> DEFEATED</>)}
            </div>
            {bs.phase === "victory" && bs.canPlunder ? (
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
                {bs.phase === "victory" && bs.goldReward > 0 && (
                  <div style={{ color: T.gold, fontSize: T.heading3FontSize, marginBottom: 14 }}>
                    +{bs.goldReward} gold
                  </div>
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

  // ── PLUNDER SCREEN ────────────────────────────────────────────────────
function PlunderScreen({ state, dispatch }) {
  const bs = state.battleState;
  if (!bs || !bs.canPlunder) return null;

  const enemyCargo = bs.enemyCargo || {};
  const goldReward = bs.goldReward || 0;
  const holdCapacity = L.getHoldCapacity(state) || 200;

  const [playerItems, setPlayerItems] = React.useState({ ...(state.hold?.items || {}) });
  const [enemyItems, setEnemyItems] = React.useState({ ...enemyCargo });

  const used = Object.values(playerItems).reduce((s, q) => s + q, 0);
  const free = Math.max(0, holdCapacity - used);

  // ── Compute total value ───────────────────────────────────────
  const goodsValue = Object.entries(enemyItems).reduce((sum, [good, qty]) => {
    const res = window.D.RESOURCES[good];
    const price = res?.basePrice ?? 0;
    return sum + price * (qty || 0);
  }, 0);
  const totalValue = goldReward + goodsValue;

  const totalFlash = useFlashOnChange(totalValue, { direction: 'up' });

  // Illegal goods warning
  const hasIllegal = Object.keys(enemyItems).some(
    g => window.D.RESOURCES[g]?.illegal
  );

  const enemyTotal = Object.values(enemyItems).reduce((s, q) => s + q, 0);

  // ── Move helpers ──────────────────────────────────────────────
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

  // ── Take All (best value first, then confirm) ─────────────────
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

  // ── Confirm plunder ───────────────────────────────────────────
  const handleConfirm = () => {
    dispatch({ type: window.E.A.TAKE_PLUNDER, holdItems: playerItems });
  };

  return (
    <div style={{ padding: T.spacing.xl, maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* ── Heading ────────────────────────────────────────────── */}
      <div style={{ color: T.gold, fontSize: T.heading1FontSize, fontWeight: "bold", textAlign: "center" }}>
        <IconAnchor size={24} color={T.gold} /> Plunder the <span style={{ color: T.redBr }}>{bs.enemy.name}</span>
      </div>

      {/* ── Top summary panel ──────────────────────────────────── */}
      <div style={panelStyle()}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: T.textDim, fontSize: 10, textTransform: "uppercase" }}>Plunder gold</div>
            <div style={{ color: T.gold, fontSize: T.heading3FontSize }}>+{goldReward}g</div>
          </div>
          <div>
            <div style={{ color: T.textDim, fontSize: 10, textTransform: "uppercase" }}>Cargo value</div>
            <div style={{ color: T.text, fontSize: T.heading3FontSize }}>{goodsValue}g</div>
          </div>
          <div>
            <div style={{ color: T.textDim, fontSize: 10, textTransform: "uppercase" }}>Total haul</div>
            <div className={totalFlash} style={{ color: T.goldBr, fontSize: T.heading3FontSize, fontWeight: "bold" }}>
              {totalValue}g
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Btn v="gold" onClick={takeAll} disabled={free < 1 || enemyTotal === 0}>
               Take All and Sail Away
            </Btn>
          </div>
        </div>
        {hasIllegal && (
          <div style={{ marginTop: 8, color: T.red, fontSize: 10 }}>
            ⚠ Illegal goods detected — patrols may inspect
          </div>
        )}
      </div>

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
                    <span style={{ color: T.text, fontSize: 12 }}>
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
                      <span style={{ color: T.text, fontSize: 12 }}>
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
      <div style={panelStyle({ textAlign: "center" })}>
        <div style={{ color: T.gold, fontSize: T.heading3FontSize, marginBottom: 10 }}>
          Plunder gold: +{goldReward}g
        </div>
        <Btn v="gold" onClick={handleConfirm} style={{ fontSize: T.heading3FontSize, padding: "8px 20px" }}>
          Confirm Plunder
        </Btn>
      </div>
    </div>
  );
}

  Object.assign(window.S, { EventScreen, InterceptScreen, BattleScreen, PlunderScreen });
})();