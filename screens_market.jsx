// screens_market.jsx : Market Screen
window.S = window.S || {};

(() => {
  const { useState, useMemo } = React;
  const { PORTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, SectionTitle, EmptyState, TutorialPopup, BackButton,
    IconAnchor,
    IconFood, IconWater, IconRhum, IconSugar, IconTimber, IconCloth,
    IconSpice, IconSilk, IconCoffee, IconCocoa, IconSpear, IconTobacco,
    IconGoblet, IconPerson,TransferLayout,
  } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // Map good keys to their icon components (use IconSpear for weapons, IconPerson for slaves)
  const GOOD_ICONS = {
    food: IconFood,
    water: IconWater,
    rum: IconRhum,
    sugar: IconSugar,
    timber: IconTimber,
    cloth: IconCloth,
    spices: IconSpice,
    silk: IconSilk,
    coffee: IconCoffee,
    cocoa: IconCocoa,
    tobacco: IconTobacco,
    weapons: IconSpear,
    silver: IconGoblet,
    slaves: IconPerson,
  };

  const getGoodIcon = (good) => {
    const IconComponent = GOOD_ICONS[good];
    if (!IconComponent) return null;
    return React.createElement(IconComponent, { size: 14, color: T.textDim, style: { marginRight: 8 } });
  };

  // ── Sort helper: groups legal goods first, illegal goods last.
  // Array.prototype.sort is stable in modern JS, so within each group
  // the original colOrder is preserved.
  const sortLegalFirst = (a, b) => {
    const aIllegal = RESOURCES[a]?.illegal ? 1 : 0;
    const bIllegal = RESOURCES[b]?.illegal ? 1 : 0;
    return aIllegal - bIllegal;
  };

const MarketScreen = ({ state, dispatch }) => {
    const market = state.portMarket;
    const portName = PORTS[state.currentPort]?.name || "Port";
    const [buyPending, setBuyPending] = useState({});
    const [sellPending, setSellPending] = useState({});
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state,"market"));

    if (!market) return (
      <div style={{ padding: T.spacing.lg }}>
        <BackButton dispatch={dispatch} />
        <EmptyState message="No market data available for this port." />
      </div>
    );

    const flavourLines = useMemo(
      () => G.generateMarketFlavour(state, state.currentPort),
      [state.currentPort]
    );

    const holdItems = state.hold?.items || {};
    const capacity = L.getHoldCapacity(state) || 0;
    const previewItems = { ...holdItems };
    Object.entries(buyPending).forEach(([good, qty]) => { previewItems[good] = (previewItems[good] || 0) + (qty || 0); });
    Object.entries(sellPending).forEach(([good, qty]) => { previewItems[good] = (previewItems[good] || 0) - (qty || 0); });
    const used = L.getHoldUsed(previewItems);
    const loadPct = L.getHoldLoadPct(previewItems, capacity);
    const speedMult = L.getHoldSpeedMultiplier(loadPct);

    // ── Gold delta: iterate from pending sets (not market.goods) ──
    // After the generator fix, market.goods has all 14 goods with real prices,
    // so selling a good the port doesn't stock now contributes correctly.
    const goldDelta = (() => {
      let total = 0;
      Object.entries(sellPending).forEach(([good, qty]) => {
        if (!qty || qty <= 0) return;
        const pg = market.goods[good];
        if (!pg) return;
        total += qty * pg.sellToPort;
      });
      Object.entries(buyPending).forEach(([good, qty]) => {
        if (!qty || qty <= 0) return;
        const pg = market.goods[good];
        if (!pg) return;
        total -= qty * pg.buyFromPort;
      });
      return total;
    })();

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

    // ── Top summary: list of goods in pending trade ───────────────
    const pendingBuyGoods = Object.keys(buyPending).filter(g => (buyPending[g]||0) > 0);
    const pendingSellGoods = Object.keys(sellPending).filter(g => (sellPending[g]||0) > 0);

    return (
      <div style={{ padding: T.spacing.lg, overflowY: "auto", flex: 1 }}>
        <BackButton dispatch={dispatch} />
        {showTutorial && (
          <TutorialPopup
            title="The Market"
            onDismiss={(disableAll) => {
              markTutorialSeen("market", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>Buy goods to trade at other ports for profit. A few things to know:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>Prices vary between ports. Buy where it's cheap, sell where it's rare</li>
              <li>Loading your hold above 50% <strong>slows your ship</strong></li>
              <li>Goods marked <strong>illegal</strong> risk confiscation by patrol inspection at sea</li>
            </ul>
            <p>Check the port gossips for hints about good deals to be made.</p>
          </TutorialPopup>
        )}

        <SectionTitle><><IconAnchor size={18} color={T.gold} />  MARKET — {portName}</></SectionTitle>
        {flavourLines.length > 0 && (
          <div style={{
            fontSize: T.narrativeFontSize,
            color: T.textDim,
            fontStyle: "italic",
            marginBottom: 10,
            lineHeight: T.narrativeLineHeight,
          }}>
            {flavourLines.join(" ")}
          </div>
        )}

        {/* ── Top summary panel ──────────────────────────────────── */}
        <div style={panelStyle({ marginBottom: 10 })}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textDim, marginBottom:4 }}>
            <span>Hold: {used} / {capacity}</span>
            <span>{Math.round(loadPct * 100)}% full</span>
          </div>
          <Bar value={used} max={capacity} color={loadPct > 0.75 ? T.redBr : T.greenBr} h={10} />
          {speedMult > 1 && (
            <div style={{ color: T.gold, fontSize: T.captionFontSize, marginTop: 4 }}>
              ⚠ Hold over 50% : voyages take {Math.round((speedMult - 1) * 100)}% longer.
            </div>
          )}

          {/* Pending trade summary */}
          {(pendingBuyGoods.length > 0 || pendingSellGoods.length > 0) && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {pendingBuyGoods.map(good => (
                <span key={good} style={{ color: T.text, fontSize: T.metadataFontSize, display: "flex", alignItems: "center", gap: 2 }}>
                  {getGoodIcon(good, { size: 12, style: { marginRight: 2 } })}
                  +{buyPending[good]} {window.D.RESOURCES[good]?.name || good}
                </span>
              ))}
              {pendingSellGoods.map(good => (
                <span key={good} style={{ color: T.text, fontSize: 11, display: "flex", alignItems: "center", gap: 2 }}>
                  {getGoodIcon(good, { size: 12, style: { marginRight: 2 } })}
                  -{sellPending[good]} {window.D.RESOURCES[good]?.name || good}
                </span>
              ))}
              <span style={{ color: goldDelta >= 0 ? T.greenBr : T.redBr, fontSize: T.narrativeFontSize, fontWeight: "bold", marginLeft: 8 }}>
                {goldDelta >= 0 ? "+" : ""}{goldDelta}g
              </span>
            </div>
          )}

          {/* Reset / Confirm */}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <Btn sm v="ghost" onClick={() => { setBuyPending({}); setSellPending({}); }} disabled={!hasPending}>Reset</Btn>
            <Btn sm v="gold" onClick={confirmTrade} disabled={!hasPending}>Confirm Trade</Btn>
          </div>
        </div>

        {/* ── Two‑column transfer layout ────────────────────────── */}
        <TransferLayout
          leftTitle="YOUR HOLD"
          leftContent={
            Object.keys(holdItems).filter(good => (holdItems[good]||0) > 0 || (sellPending[good]||0) > 0).length === 0 ? (
              <EmptyState message="Your hold is empty." />
            ) : (
              <div>
                {Object.keys(holdItems)
                  .filter(good => (holdItems[good]||0) > 0 || (sellPending[good]||0) > 0)
                  .sort(sortLegalFirst)
                  .map(good => {
                    const pg = market.goods[good];
                    // After generator fix, pg always exists for any of the 14 goods.
                    // The fallback is defensive only.
                    const price = pg ? pg.sellToPort : 0;
                    const inHold = holdItems[good] || 0;
                    const pending = sellPending[good] || 0;
                    const max = inHold + (buyPending[good] || 0);

                    return (
                      <div key={good} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 6, flexWrap:"wrap" }}>
                        <span style={{ color: T.text, fontSize: T.narrativeFontSize, display:"flex", alignItems:"center" }}>
                          {getGoodIcon(good, { size: 12, style: { marginRight: 4 } })}
                          {window.D.RESOURCES[good]?.name || good}
                          <span style={{ color: T.textDim, marginLeft: 6 }}>×{inHold}</span>
                        </span>
                        <div style={{ display:"flex", gap: 4, alignItems:"center" }}>
                          <Btn sm v="ghost" onClick={() => adjustSell(good, -1)} disabled={(sellPending[good]||0) <= 0}>-</Btn>
                          <input type="number" value={sellPending[good]||0}
                            onChange={e => {
                              const v = parseInt(e.target.value, 10) || 0;
                              setSellPending(prev => ({ ...prev, [good]: Math.max(0, Math.min(v, max)) }));
                            }}
                            style={{ width:40, textAlign:"center", background:T.panel, border:`1px solid ${T.border}`, color:T.text, borderRadius:2, fontSize:11, fontFamily:T.font, minHeight: 32 }}
                          />
                          <Btn sm v="ghost" onClick={() => adjustSell(good, 1)} disabled={(sellPending[good]||0) >= max}>+</Btn>
                          <span style={{ color: T.gold, fontSize: T.captionFontSize, minWidth: 48, textAlign:"right" }}>
                          {price}g
                          <div style={{ color: T.textFaint, fontSize: 8 }}>
                            (Base: {window.D.RESOURCES[good]?.basePrice || 0}g)
                          </div>
                        </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          }
          rightTitle="PORT MARKET"
                    rightContent={
            Object.keys(market.goods).filter(g => market.goods[g].available > 0).length === 0 ? (
              <EmptyState message="No goods available for purchase." />
            ) : (
              (() => {
                let illegalDividerShown = false;
                // Filter to only goods the port actually has stock of.
                // After the generator fix, all 14 goods are in market.goods,
                // but many have available: 0 (port doesn't trade them).
                // Sort puts illegal goods last so the divider correctly separates them.
                return Object.keys(market.goods)
                  .filter(good => market.goods[good].available > 0)
                  .sort(sortLegalFirst)
                  .map(good => {
                  const pg = market.goods[good];
                  const price = pg.buyFromPort;
                  const available = pg.available;
                  const pending = buyPending[good] || 0;
                  const freeSpace = capacity - used + (sellPending[good] || 0);
                  const max = Math.min(available, freeSpace + pending);
                  const isIllegal = RESOURCES[good]?.illegal;
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
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 6, flexWrap:"wrap" }}>
                        <span style={{ color: T.text, fontSize: T.narrativeFontSize, display:"flex", alignItems:"center" }}>
                          {getGoodIcon(good, { size: 12, style: { marginRight: 4 } })}
                          {RESOURCES[good]?.name || good}
                          {isIllegal && <span style={{ color: T.red, marginLeft: 4, fontSize: T.captionFontSize }}>(Illegal)</span>}
                          <span style={{ color: T.textDim, marginLeft: 6 }}>×{available}</span>
                        </span>
                        {/* buy controls unchanged */}
                        <div style={{ display:"flex", gap: 4, alignItems:"center" }}>
                          <Btn sm v="ghost" onClick={() => adjustBuy(good, -1)} disabled={(buyPending[good]||0) <= 0}>-</Btn>
                          <input type="number" value={buyPending[good]||0}
                            onChange={e => {
                              const v = parseInt(e.target.value, 10) || 0;
                              setBuyPending(prev => ({ ...prev, [good]: Math.max(0, Math.min(v, max)) }));
                            }}
                            style={{ width:40, textAlign:"center", background:T.panel, border:`1px solid ${T.border}`, color:T.text, borderRadius:2, fontSize:11, fontFamily:T.font, minHeight: 32 }}
                          />
                          <Btn sm v="ghost" onClick={() => adjustBuy(good, 1)} disabled={(buyPending[good]||0) >= max}>+</Btn>
                          <span style={{ color: T.gold, fontSize: T.captionFontSize, minWidth: 48, textAlign:"right" }}>
                            {price}g
                            <div style={{ color: T.textFaint, fontSize: 8 }}>
                              (Base: {pg.basePrice}g)
                            </div>
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )
          }
        />


        {/* ── Bottom confirm panel ───────────────────────────────── */}
        <div style={{ ...panelStyle(), marginTop: 10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color: goldDelta >= 0 ? T.greenBr : T.redBr, fontSize:13 }}>
            {goldDelta >= 0 ? "+" : ""}{goldDelta}g
          </span>
          <div style={{ display:"flex", gap:8 }}>
            <Btn sm v="ghost" onClick={() => { setBuyPending({}); setSellPending({}); }} disabled={!hasPending}>Reset</Btn>
            <Btn sm v="gold" onClick={confirmTrade} disabled={!hasPending}>Confirm Trade</Btn>
          </div>
        </div>
      </div>
    );
};

  Object.assign(window.S, { MarketScreen });
})();