// screens_market.jsx — Market Screen
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, SectionTitle, EmptyState, TutorialPopup, BackButton } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  const MarketScreen = ({ state, dispatch }) => {
    const market = state.portMarket;
    const portName = PORTS[state.currentPort]?.name || "Port";
    const [buyPending, setBuyPending] = useState({});
    const [sellPending, setSellPending] = useState({});
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("market"));

    if (!market) return (
      <div style={{ padding: T.spacing.lg }}>
        <BackButton dispatch={dispatch} />
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

    const shownGoods = Object.keys(RESOURCES).filter(good => {
      if (good === "food" || good === "water") return true;
      const res = RESOURCES[good];
      if (res.illegal) return false;
      return market.goods[good] || (holdItems[good] || 0) > 0;
    });

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
              <li>Prices vary between ports — buy where it's cheap, sell where it's rare</li>
              <li>Loading your hold above 50% <strong>slows your ship</strong></li>
              <li>Goods marked <strong>illegal</strong> risk confiscation by patrol inspection at sea</li>
            </ul>
            <p>Check the port gossips for hints about good deals to be made.</p>
          </TutorialPopup>
        )}

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
                display: "flex", alignItems: "center", gap: T.spacing.sm,
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
                  <div key={good} style={panelStyle({ variant: "danger", background: T.panelAlt })}>
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

  Object.assign(window.S, { MarketScreen });
})();