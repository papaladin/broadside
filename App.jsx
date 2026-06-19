// App.jsx — ROOT COMPONENT

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Broadside render error:", error, info); }
  render() {
    if (this.state.hasError) {
      const { T } = window.UI;
      return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: T.bg, color: T.text, fontFamily: T.font, gap: 16, padding: 20 }}>
          <div style={{ color: T.gold, fontSize: T.heading1FontSize }}>⚠ Something went wrong</div>
          <div style={{ color: T.textDim, fontSize: T.heading3FontSize, maxWidth: 400, textAlign: "center" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <div style={{ display: "flex", gap: T.spacing.md }}>
            <button onClick={() => window.location.reload()}
              style={{ background: T.panel, border: `1px solid ${T.gold}`, color: T.gold,
                padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 2 }}>
              Reload Page
            </button>
            <button onClick={() => {
                this.setState({ hasError: false, error: null });
                if (window.L?.hasSave?.()) {
                  setTimeout(() => { document.dispatchEvent(new CustomEvent("broadside:loadSave")); }, 50);
                }
              }}
              style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text,
                padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 2 }}>
              Try Load Last Save
            </button>
          </div>
          <div style={{ color: T.textFaint, fontSize: 11 }}>Open the browser console for details.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── HUD COMPONENT (separate so flash hook works) ─────────────────
const HUD = ({ state, dispatch, debugOpen, setDebugOpen, isDebug }) => {
  const { T, Bar, useFlashOnChange, IconStar, IconSkull, IconShield, IconHeart, IconCrew, IconCrate, IconFood, IconWater, IconGold, Tooltip, IconBarrel, IconCalendar, IconPirate } = window.UI;
  const L = window.L;
  const { PORTS, FACTIONS } = window.D;
  const { screen } = state;

  if (screen === "newgame" || screen === "title") return null;

  const currentPort = PORTS[state.currentPort];
  const stats = L.getShipStats(state);
  const morale = L.getEffectiveMorale(state);
  const holdUsed = Object.values(state.hold?.items || {}).reduce((s, q) => s + q, 0);
  const holdCap = L.getHoldCapacity(state);
  const food = state.hold?.items?.food ?? 0;
  const water = state.hold?.items?.water ?? 0;
  const alerts = state.factionAlerts || {};
  const topHeat = Object.entries(alerts).reduce((best, [f, lv]) =>
    lv > best.level ? { faction: f, level: lv } : best, { faction: null, level: 0 });

  const start = state.startDate || { day: 1, month: 6, year: 1695 };
  const calendarDate = new Date(start.year, start.month - 1, start.day + state.day - 1)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatGold = (g) => g >= 1000000 ? (g / 1000000).toFixed(3) + "M g" : g.toLocaleString() + "g";
  const goldFlash = useFlashOnChange(state.gold, { direction: null }); // auto detect
  const moraleFlash   = useFlashOnChange(morale, { direction: null });
  const fameFlash     = useFlashOnChange(state.fame, { direction: null });
  const infamyFlash   = useFlashOnChange(state.infamy ?? 0, { invert: true });
  const crewFlash     = useFlashOnChange(state.crew.roster.length, { direction: null });
  const hullFlash     = useFlashOnChange(state.ship.hull, { direction: null });
  const foodFlash     = useFlashOnChange(food, { direction: null });
  const waterFlash    = useFlashOnChange(water, { direction: null });
  const holdUsedFlash = useFlashOnChange(holdUsed, { direction: null });


  // ── Responsive HUD breakpoint ──────────────────────────────
  const [isNarrowHUD, setIsNarrowHUD] = React.useState(window.innerWidth < 600);
  React.useEffect(() => {
    const handle = () => setIsNarrowHUD(window.innerWidth < 600);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const Cell = ({ label, tip, children }) => (
    <div title={tip} style={{ border: `1px solid ${T.borderFaint}`, background: "rgba(255,255,255,0.015)",
      padding: "4px 6px 5px", minWidth: 0 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.7px",
        color: T.textDim, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden" }}>{label}</div>
      {children}
    </div>
  );
  const Val = ({ children, color, small, className = "" }) => (
  <div className={className} style={{ fontSize: small ? 12 : 14, fontWeight: 700, color: color || T.text, lineHeight: 1 }}>{children}</div>
);

  const TOOLTIPS = {
    gold: "Your gold. Spent on repairs, crew wages, provisions, and equipment.",
    day: "Days elapsed since campaign start.",
    crew: "Crew aboard / maximum. More crew = higher wages and faster combat.",
    hull: "Hull integrity / maximum. Reaches 0 = defeat.",
    morale: "Crew morale. Below 50 slows travel. Below 30 increases wages. At 0 crew desert.",
    fame: "Fame — your permanent reputation. Gates ships, equipment, and missions.",
    infamy: "Infamy — your criminal notoriety. Reaches 50 = bribe blocked.",
    hold: "Cargo hold: used / capacity. Over 50% full slows your ship.",
    food: "Food in hold. Crew consumes food daily at sea. Runs out = morale drops.",
    water: "Water in hold. Consumed daily at sea alongside food.",
    heat: "Faction Alert Level. High heat means more patrols. Decays every 2 days.",
  };

  const cells = [
    { label: <span><IconGold size={9} color={T.textDim} /> Gold</span>,  tip: TOOLTIPS.gold,   content: <Val color={T.gold}><span className={goldFlash}>{formatGold(state.gold)}</span></Val> },
    { label: <span><IconCalendar size={9} color={T.textDim} /> Day</span>,  tip: TOOLTIPS.day,    content: <><Val>{state.day}</Val><div style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{calendarDate}</div></> },
    { label: <span><IconCrew size={9} color={T.textDim} /> Crew</span>,  tip: TOOLTIPS.crew,   content: <><Val small className={crewFlash}>{state.crew.roster.length}/{state.crew.max}</Val><Bar value={state.crew.roster.length} max={state.crew.max} color={T.blueBr} h={4} /></> },
    { label: <span><IconShield size={9} color={T.textDim} /> Hull</span>,tip: TOOLTIPS.hull,   content: <><Val small className={hullFlash}>{state.ship.hull}/{stats.maxHull}</Val><Bar value={state.ship.hull} max={stats.maxHull}color={state.ship.hull / stats.maxHull >= 0.6 ? T.greenBr :state.ship.hull / stats.maxHull >= 0.3 ? T.gold :T.redBr} h={4} /></> },
    { label: <span><IconHeart size={9} color={T.textDim} /> Morale</span>,tip: TOOLTIPS.morale, content: <><Val small className={moraleFlash}>{morale}%</Val><Bar value={morale} max={100} color={T.blueBr} h={4} /></> },
    { label: <span><IconStar size={9} color={T.textDim} /> Fame</span>,  tip: TOOLTIPS.fame,   content: <><Val small className={fameFlash}>{state.fame}</Val><div style={{ fontSize: 9, color: T.textDim, marginTop: 1 }}>{L.getFameInfo(state.fame).label}</div></> },
    { label: <span><IconPirate size={9} color={T.textDim} /> Infamy</span>,     tip: TOOLTIPS.infamy, content: <><Val small color={(state.infamy ?? 0) > 0 ? T.redBr : T.textFaint} className={infamyFlash}>{state.infamy ?? 0}</Val><div style={{ fontSize: 9, color: T.textDim, marginTop: 1 }}>{L.getInfamyLabel(state.infamy ?? 0)}</div></> },
    { label: <span><IconBarrel size={9} color={T.textDim} /> Hold</span>,  tip: TOOLTIPS.hold,   content: <><Val small className={holdUsedFlash}>{holdUsed}/{holdCap}</Val><Bar value={holdUsed} max={holdCap} color={T.blueBr} h={4} /></> },
    { label: <span><IconFood size={9} color={T.textDim} /> Food</span>,  tip: TOOLTIPS.food,   content: <Val small color={food <= 0 ? T.redBr : T.text} className={foodFlash}>{food}</Val> },
    { label: <span><IconWater size={9} color={T.textDim} /> Water</span>,tip: TOOLTIPS.water,  content: <Val small color={water <= 0 ? T.redBr : T.text} className={waterFlash}>{water}</Val> },
  ];
  if (topHeat.level > 0) {
    cells.push({
      label: "Heat", tip: TOOLTIPS.heat,
      content: <Val small color={FACTIONS[topHeat.faction]?.color || T.textDim}>
        {FACTIONS[topHeat.faction]?.label?.substring(0,3) || "?"} {topHeat.level}
      </Val>
    });
  }

  const renderCellRow = (cellSlice, columns) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4, marginTop: 4 }}>
      {cellSlice.map((c, i) => <Cell key={i} label={c.label} tip={c.tip}>{c.content}</Cell>)}
    </div>
  );

  const wideGridStyle = {
    display: "grid",
    gridTemplateColumns: topHeat.level > 0
      ? (isDebug ? "1fr 1.1fr .75fr .75fr .7fr .7fr .7fr .75fr .55fr .55fr .6fr auto" : "1fr 1.1fr .75fr .75fr .7fr .7fr .7fr .75fr .55fr .55fr .6fr")
      : (isDebug ? "1fr 1.1fr .8fr .8fr .75fr .75fr .75fr .8fr .6fr .6fr auto" : "1fr 1.1fr .8fr .8fr .75fr .75fr .75fr .8fr .6fr .6fr"),
    gap: 4,
  };

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100,
      background: "linear-gradient(180deg, #1e1812, #161210)",
      borderBottom: `1px solid ${T.border}`, padding: "5px 8px",
      fontFamily: T.font, boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }}>

      {isNarrowHUD ? (
        <>
          {renderCellRow(cells.slice(0, 5), 5)}
          {renderCellRow(cells.slice(5), cells.length - 5)}
          {isDebug && (
            <div style={{ textAlign: "right", marginTop: 4 }}>
              <button onClick={() => setDebugOpen(v => !v)}
                style={{ background: T.panel, border: `1px solid ${T.gold}`, color: T.gold,
                  padding: "2px 6px", borderRadius: 2, cursor: "pointer",
                  fontSize: 10, fontFamily: T.fontMono }}>
                ⚙
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={wideGridStyle}>
          {cells.map((c, i) => (
            <Cell key={i} label={c.label} tip={c.tip}>{c.content}</Cell>
          ))}
          {isDebug && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <button onClick={() => setDebugOpen(v => !v)}
                style={{ background: T.panel, border: `1px solid ${T.gold}`, color: T.gold,
                  padding: "2px 6px", borderRadius: 2, cursor: "pointer",
                  fontSize: 10, fontFamily: T.fontMono, width: "100%", height: "100%" }}>
                ⚙
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginTop: 3, fontSize: 10, color: T.textDim, paddingLeft: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: T.spacing.sm }}>
          {currentPort && (
            <span style={{ color: FACTIONS[currentPort.faction]?.color || T.textDim, fontWeight: 700 }}>
              {currentPort.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── APP COMPONENT ──────────────────────────────────────────────────
const App = () => {
  const [state, dispatch] = React.useReducer(window.E.reducer, window.E.initialState);
  const { T } = window.UI;
  const { screen } = state;
  const { OnboardingPopup } = window.S;

  const [savedFlash, setSavedFlash] = React.useState(false);
  React.useEffect(() => {
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 1500);
    return () => clearTimeout(t);
  }, [state.currentPort, state.missions.length]);

  const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
  const [debugOpen, setDebugOpen] = React.useState(false);

  if (isDebug) {
    window.__b = {
      gold:   (n) => dispatch({ type: window.E.A.DEBUG_ADD_GOLD, amount: n }),
      fame:   (n) => dispatch({ type: window.E.A.DEBUG_SET_FAME, fame: n }),
      infamy: (n) => dispatch({ type: window.E.A.DEBUG_SET_INFAMY, infamy: n }),
      ship:   (t) => dispatch({ type: window.E.A.DEBUG_SET_SHIP, shipType: t }),
    };
  }

  const renderScreen = () => {
    const { S } = window;
    switch (state.screen) {
      case "title": return <S.TitleScreen dispatch={dispatch} />;
      case "newgame": return <S.NewGameScreen dispatch={dispatch} />;
      case "port": return <S.PortScreen state={state} dispatch={dispatch} />;
      case "map": return <S.MapScreen state={state} dispatch={dispatch} />;
      case "sailing": return <S.SailingScreen state={state} dispatch={dispatch} />;
      case "shipyard": return <S.ShipyardScreen state={state} dispatch={dispatch} />;
      case "crew": return <S.CrewScreen state={state} dispatch={dispatch} />;
      case "status": return <S.StatusScreen state={state} dispatch={dispatch} />;
      case "event": return <S.EventScreen state={state} dispatch={dispatch} />;
      case "intercept": return <S.InterceptScreen state={state} dispatch={dispatch} />;
      case "battle": return <S.BattleScreen state={state} dispatch={dispatch} />;
      case "plunder": return <S.PlunderScreen state={state} dispatch={dispatch} />;
      case "market": return <S.MarketScreen state={state} dispatch={dispatch} />;
      case "journal": return <S.JournalScreen state={state} dispatch={dispatch} />;
      default: return <div style={{ color: T.text, padding: 20 }}>Unknown screen: {state.screen}</div>;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text,
      fontFamily: T.font, display: "flex", flexDirection: "column" }}>
      <HUD state={state} dispatch={dispatch} debugOpen={debugOpen} setDebugOpen={setDebugOpen} isDebug={isDebug} />
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 20, minWidth: 0 }}>
        {renderScreen()}
      </div>
      <OnboardingPopup state={state} dispatch={dispatch} />
      {isDebug && debugOpen && <DebugPanel state={state} dispatch={dispatch} />}
    </div>
  );
};

// ── DEBUG PANEL ──────────────────────────────────────────────────
const DebugPanel = ({ state, dispatch }) => {
  const { T, panelStyle } = window.UI;
  const A = window.E.A;
  const { FACTIONS } = window.D;
  const btnStyle = {
    background: T.panel, border: `1px solid ${T.border}`, color: T.textDim,
    padding: "3px 6px", borderRadius: 2, cursor: "pointer", fontSize: 10, fontFamily: T.fontMono,
  };
  return (
      <div style={{
        position: "fixed", top: 40, right: 10, zIndex: 999,
        width: 250, fontSize: 11, fontFamily: T.fontMono,
        maxHeight: "calc(100vh - 60px)",
        overflowY: "auto",
        ...panelStyle({ variant: "gold" })
      }}>
      <div style={{ color: T.gold, marginBottom: 8 }}>⚙ DEBUG PANEL</div>
      <div style={{ color: T.textDim, marginBottom: 4 }}>Gold</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[1000, 10000, 100000, 1000000].map(n => (<button key={n} onClick={() => dispatch({ type: A.DEBUG_ADD_GOLD, amount: n })} style={btnStyle}>+{n >= 1000 ? (n/1000)+'k' : n}</button>))}
      </div>
      <div style={{ color: T.textDim, marginBottom: 4 }}>Fame</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[50, 100, 200, 350].map(n => (<button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_FAME, fame: n })} style={btnStyle}>★{n}</button>))}
      </div>
      <div style={{ color: T.textDim, marginBottom: 4 }}>Infamy</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[0, 25, 50, 100].map(n => (<button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_INFAMY, infamy: n })} style={btnStyle}>☠{n}</button>))}
      </div>
      <div style={{ color: T.textDim, marginBottom: 4 }}>Ship</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {["dinghy","sloop","brigantine","frigate","galleon"].map(t => (<button key={t} onClick={() => dispatch({ type: A.DEBUG_SET_SHIP, shipType: t })} style={{ ...btnStyle, color: state.ship.type === t ? T.gold : T.textDim }}>{t}</button>))}
      </div>
      <div style={{ color: T.textDim, marginBottom: 4 }}>Rep (current port)</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[5, 10, 50, 65, 85].map(n => (<button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_PORT_REP, port: state.currentPort, amount: n })} style={btnStyle}>{n}</button>))}
      </div>
      <div style={{ color: T.textDim, marginBottom: 4 }}>Heat (per faction)</div>
      {["english","spanish","french","dutch"].map(faction => {
        const fac = FACTIONS[faction];
        return (
          <div key={faction} style={{ display: "flex", gap: 4, marginBottom: 6, alignItems: "center" }}>
            <span style={{ color: fac?.color || T.textDim, fontSize: 10, width: 50 }}>{fac?.label || faction}</span>
            {[5, 10].map(n => (<button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_HEAT, faction, amount: n })} style={btnStyle}>{n}</button>))}
          </div>);
      })}
      <button onClick={() => dispatch({ type: A.DEBUG_FILL_HOLD })} style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>Fill hold</button>
      <button onClick={() => dispatch({ type: A.DEBUG_REPAIR })} style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>Full repair + provisions</button>
      <div style={{ color: T.textDim, marginBottom: 4, marginTop: 8 }}>Morale</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[10, 50, 80, 100].map(n => (<button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_MORALE, morale: n })} style={btnStyle}>😊{n}</button>))}
      </div>
      <button onClick={() => dispatch({ type: A.DEBUG_UNLOCK_HIDDEN_PORTS })} style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>🗺 Unlock hidden ports</button>
      <button onClick={() => dispatch({ type: A.DEBUG_MAX_CREW })} style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>👥 Fill crew to max</button>
      <button onClick={() => dispatch({ type: A.DEBUG_COMPLETE_MISSION })} style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>✅ Complete mission</button>
      <button onClick={() => dispatch({ type: A.DEBUG_AGE_CREW })} style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>📅 +50 days aboard</button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ErrorBoundary><App /></ErrorBoundary>);