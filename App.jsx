// ═══════════════════════════════════════════════════════════════════
//  App.jsx — ROOT COMPONENT (FIXED: NO OVERLAP WITH HUD)
//  Initializes the game state, manages the screen router, and renders the HUD.
//  Imports: window.D (data), window.L (logic), window.E (engine), window.UI (UI primitives), window.S (screens)
// ═══════════════════════════════════════════════════════════════════

const App = () => {
  const [state, dispatch] = React.useReducer(window.E.reducer, window.E.initialState);
  const { T } = window.UI;
  const { PORTS, SHIPS, FACTIONS } = window.D;
  const { screen } = state;

  // --- HUD Component ---
  const HUD = () => {
    if (screen === "start") return null;
    const currentPort = PORTS[state.currentPort];
    const effectiveShipStats = L.getShipStats(state); // <-- Get effective stats (includes upgrades)
    const effectiveMorale = L.getEffectiveMorale(state); // Add this line at the top of HUD


    return (
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        background: T.panel + "cc",
        padding: 8,
        borderRadius: 4,
        border: `1px solid ${T.border}`,
        fontSize: 11,
        backdropFilter: "blur(4px)",
      }}>
        <div>
          <span style={{ color: T.gold }}>💰 {state.gold}</span>
          <span style={{ color: (state.hold?.items?.food ?? 0) <= 0 ? T.red : T.textDim, marginLeft: 10 }}>
            🍖 {state.hold?.items?.food ?? 0}
          </span>
          <span style={{ color: (state.hold?.items?.water ?? 0) <= 0 ? T.red : T.textDim, marginLeft: 10 }}>
            💧 {state.hold?.items?.water ?? 0}
          </span>
          <span style={{ color: T.textDim, marginLeft: 10 }}>📅 Day {state.day}</span>
          <span style={{ color: T.textDim, marginLeft: 10 }}>👥 {state.crew.roster.length}/{state.crew.max}</span>
          <span style={{ color: T.textDim, marginLeft: 10 }}>❤️ {state.ship.hull}/{effectiveShipStats.maxHull}</span>
          <span style={{ color: T.textDim, marginLeft: 10 }}>😊 {effectiveMorale}%</span>
          <span style={{ color: T.gold, marginLeft: 10 }}>★ {state.fame}</span>
          <span style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint, marginLeft: 10 }}>☠ {state.infamy ?? 0}</span>        </div>
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
      case "start": return <S.StartScreen dispatch={dispatch} />;
      case "port": return <S.PortScreen state={state} dispatch={dispatch} />;
      case "map": return <S.MapScreen state={state} dispatch={dispatch} />;
      case "sailing": return <S.SailingScreen state={state} dispatch={dispatch} />;
      case "shipyard": return <S.ShipyardScreen state={state} dispatch={dispatch} />;
      case "crew": return <S.CrewScreen state={state} dispatch={dispatch} />;
      case "market": return <S.MarketScreen state={state} dispatch={dispatch} />;
      case "status": return <S.StatusScreen state={state} dispatch={dispatch} />;
      case "event": return <S.EventScreen state={state} dispatch={dispatch} />;
      case "intercept": return <S.InterceptScreen state={state} dispatch={dispatch} />;
      case "battle": return <S.BattleScreen state={state} dispatch={dispatch} />;
      default: return <div style={{ color: T.text, padding: 20 }}>Unknown screen: {state.screen}</div>;
    }
  };

  // --- Main Render ---
  return (
    <div style={{
      height: "100vh",
      background: T.bg,
      color: T.text,
      fontFamily: T.font,
      display: "flex",
      flexDirection: "column",
    }}>
      <HUD />
      {/* FIX: Add padding to the top of the screen container to avoid HUD overlap */}
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 20 }}>
        {renderScreen()}
      </div>
    </div>
  );
};

// --- Initialize and Mount the App ---
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);