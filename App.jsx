// ═══════════════════════════════════════════════════════════════════
//  App.jsx — ROOT COMPONENT
//  Initializes the game state, manages the screen router, and renders the HUD.
//  Imports: window.D (data), window.L (logic), window.E (engine), window.UI (UI primitives), window.S (screens)
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
//  ERROR BOUNDARY — Catches render errors, prevents white screen
// ═══════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Broadside render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#0a141e", color: "#e0e0e0",
          fontFamily: "'Courier New', monospace", gap: 16, padding: 20,
        }}>
          <div style={{ color: "#ffd700", fontSize: 18 }}>⚠ Something went wrong</div>
          <div style={{ color: "#a0a0a0", fontSize: 12, maxWidth: 400, textAlign: "center" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ background: "#121c28", border: "1px solid #ffd700", color: "#ffd700",
                padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 3 }}>
              Reload Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (window.L?.hasSave?.()) {
                  setTimeout(() => {
                    document.dispatchEvent(new CustomEvent("broadside:loadSave"));
                  }, 50);
                }
              }}
              style={{ background: "#121c28", border: "1px solid #2a3a4a", color: "#e0e0e0",
                padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 3 }}>
              Try Load Last Save
            </button>
          </div>
          <div style={{ color: "#606060", fontSize: 10 }}>
            Open the browser console for details.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  // 1. Core state
  const [state, dispatch] = React.useReducer(window.E.reducer, window.E.initialState);
  const { T } = window.UI;
  const { PORTS, SHIPS, FACTIONS } = window.D;
  const { screen } = state;

  // 2. Auto-save flash state
  const [savedFlash, setSavedFlash] = React.useState(false);
  React.useEffect(() => {
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 1500);
    return () => clearTimeout(t);
  }, [ state.currentPort, state.missions.length]);

  // Debug mode
  const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
  const [debugOpen, setDebugOpen] = React.useState(false);

  // Console shortcut (debug only)
  if (isDebug) {
    window.__b = {
      gold:   (n) => dispatch({ type: window.E.A.DEBUG_ADD_GOLD, amount: n }),
      fame:   (n) => dispatch({ type: window.E.A.DEBUG_SET_FAME, fame: n }),
      infamy: (n) => dispatch({ type: window.E.A.DEBUG_SET_INFAMY, infamy: n }),
      ship:   (t) => dispatch({ type: window.E.A.DEBUG_SET_SHIP, shipType: t }),
    };
  }

  // --- HUD Component ---
  const HUD = () => {
    if (screen === "start") return null;
    const currentPort = PORTS[state.currentPort];
    const effectiveShipStats = L.getShipStats(state);
    const effectiveMorale = L.getEffectiveMorale(state);
    const [showDetails, setShowDetails] = React.useState(true);

    return (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        background: T.panel + "cc",
        padding: 8,
        borderBottom: `1px solid ${T.border}`,
        fontSize: 11,
        fontFamily: T.font,
        backdropFilter: "blur(4px)",
        gap: 6,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          <span style={{ color: T.gold }}>💰 {state.gold}</span>
          <span style={{ color: T.textDim }}>📅 Day {state.day}</span>
          <button
            onClick={() => setShowDetails(v => !v)}
            style={{
              background: "none", border: "none", color: T.textDim,
              fontSize: 12, cursor: "pointer", padding: "4px 6px",
              fontFamily: T.font, minWidth: 30,
            }}
            title="Toggle details"
          >
            {showDetails ? "📊" : "📊"}
          </button>
          {showDetails && (
            <>
              <span style={{ color: T.textDim }}>👥 {state.crew.roster.length}/{state.crew.max}</span>
              <span style={{ color: T.textDim }}>❤️ {state.ship.hull}/{effectiveShipStats.maxHull}</span>
              <span style={{ color: T.textDim }}>😊 {effectiveMorale}%</span>
              <span style={{ color: T.gold }}>★ {state.fame}</span>
              <span style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint }}>☠ {state.infamy ?? 0}</span>
              {savedFlash && (
                <span style={{ color: T.greenBr, marginLeft: 10, fontSize: 10,
                  transition: "opacity 0.3s", opacity: savedFlash ? 1 : 0 }}>
                  ✓ saved
                </span>
              )}
              <span style={{ color: T.textDim }}>📦 {L.getHoldUsed(state.hold?.items || {})}/{state.hold?.capacity || 0}</span>
              <span style={{ color: (state.hold?.items?.food ?? 0) <= 0 ? T.red : T.textDim }}>🍖 {state.hold?.items?.food ?? 0}</span>
              <span style={{ color: (state.hold?.items?.water ?? 0) <= 0 ? T.red : T.textDim }}>💧 {state.hold?.items?.water ?? 0}</span>
            </>
          )}
          {isDebug && (
            <button onClick={() => setDebugOpen(v => !v)}
              style={{ background: T.panel, border: `1px solid ${T.gold}`, color: T.gold,
                       padding: "2px 6px", borderRadius: 3, cursor: "pointer",
                       fontSize: 11, fontFamily: T.font, marginLeft: 10 }}>
              ⚙
            </button>
          )}
        </div>
        <div>
          {currentPort && (
            <span style={{ color: FACTIONS[currentPort.faction]?.color || T.textDim }}>
              {currentPort.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  // --- Screen Router ---
  const renderScreen = () => {
    const { S } = window;
    switch (state.screen) {
      case "start":      return <S.StartScreen dispatch={dispatch} />;
      case "port":       return <S.PortScreen state={state} dispatch={dispatch} />;
      case "map":        return <S.MapScreen state={state} dispatch={dispatch} />;
      case "sailing":    return <S.SailingScreen state={state} dispatch={dispatch} />;
      case "shipyard":   return <S.ShipyardScreen state={state} dispatch={dispatch} />;
      case "crew":       return <S.CrewScreen state={state} dispatch={dispatch} />;
      case "status":     return <S.StatusScreen state={state} dispatch={dispatch} />;
      case "event":      return <S.EventScreen state={state} dispatch={dispatch} />;
      case "intercept":  return <S.InterceptScreen state={state} dispatch={dispatch} />;
      case "battle":     return <S.BattleScreen state={state} dispatch={dispatch} />;
      case "market":     return <S.MarketScreen state={state} dispatch={dispatch} />;
      default: return <div style={{ color: T.text, padding: 20 }}>Unknown screen: {state.screen}</div>;
    }
  };

  // --- Main Render ---
  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: T.font,
      display: "flex",
      flexDirection: "column",
    }}>
      <HUD />
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 20, minWidth: 0 }}>
        {renderScreen()}
      </div>
      {isDebug && debugOpen && (
        <DebugPanel state={state} dispatch={dispatch} />
      )}
    </div>
  );
};

// --- Debug Panel Component ---
const DebugPanel = ({ state, dispatch }) => {
  const { T } = window.UI;
  const A = window.E.A;
  const btnStyle = {
    background: T.panel, border: `1px solid ${T.border}`, color: T.textDim,
    padding: "3px 6px", borderRadius: 3, cursor: "pointer", fontSize: 10,
    fontFamily: T.font,
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 10, zIndex: 999,
      background: T.panel, border: `1px solid ${T.gold}`,
      padding: 12, borderRadius: 4, fontSize: 11,
      width: 220, fontFamily: T.font,
    }}>
      <div style={{ color: T.gold, marginBottom: 8 }}>⚙ DEBUG PANEL</div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Gold</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[100, 500, 1000, 5000].map(n => (
          <button key={n} onClick={() => dispatch({ type: A.DEBUG_ADD_GOLD, amount: n })}
            style={{ ...btnStyle }}>+{n}</button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Fame</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[50, 100, 200, 350].map(n => (
          <button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_FAME, fame: n })}
            style={{ ...btnStyle }}>★{n}</button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Infamy</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[0, 25, 50, 100].map(n => (
          <button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_INFAMY, infamy: n })}
            style={{ ...btnStyle }}>☠{n}</button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Ship</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {["dinghy","sloop","brigantine","frigate","galleon"].map(t => (
          <button key={t} onClick={() => dispatch({ type: A.DEBUG_SET_SHIP, shipType: t })}
            style={{ ...btnStyle, color: state.ship.type === t ? T.gold : T.textDim }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Rep (current port)</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[10, 50, 65, 85].map(n => (
          <button key={n} onClick={() => dispatch({ type: A.DEBUG_SET_PORT_REP,
            port: state.currentPort, amount: n })}
            style={{ ...btnStyle }}>{n}</button>
        ))}
      </div>

      <button onClick={() => dispatch({ type: A.DEBUG_FILL_HOLD })}
        style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>
        Fill hold (mixed goods)
      </button>

      <button onClick={() => dispatch({ type: A.DEBUG_REPAIR })}
        style={{ ...btnStyle, width: "100%" }}>
        Full repair + provisions
      </button>
    </div>
  );
};

// --- Initialize and Mount the App ---
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);