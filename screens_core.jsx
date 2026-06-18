// screens_core.jsx — Title, New Game & Centralised Onboarding QM Popup
window.S = window.S || {};

(() => {
  const { useState, useEffect, useMemo } = React;
  const { PORTS, FACTIONS, STARTS, CREW_FIRST_NAMES, CREW_LAST_NAMES, QM_DIALOGUE } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip } = window.UI;

  // ── TITLE SCREEN (moved from screens_port.jsx) ───────────────────
  function TitleScreen({ dispatch }) {
    const hasSave = L.hasSave();
    const importRef = React.useRef(null);
    const [tutorialEnabled, setTutorialEnabled] = React.useState(() => L.loadTutorialState().enabled);
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    const localStorageWarning = React.useMemo(() => !L.checkLocalStorageAvailable(), []);

    const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => dispatch({ type: A.IMPORT_SAVE, fileContent: reader.result });
      reader.readAsText(file);
      e.target.value = "";
    };

    const toggleTutorial = (checked) => {
      setTutorialEnabled(checked);
      const ts = L.loadTutorialState();
      ts.enabled = checked;
      if (checked) {
        ts.seen = { ...L.getDefaultTutorialState().seen };
      }
      L.saveTutorialState(ts);
    };

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: T.spacing.xl,
        background: `radial-gradient(ellipse at 50% 60%, #0a1e38 0%, ${T.bg} 70%)`,
      }}>
        <div style={{ color: T.gold, fontSize: 32, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4, textShadow: `0 0 30px ${T.goldDim}` }}>⚓ Broadside</div>
        <div style={{ color: T.textDim, fontSize: 11, letterSpacing: "0.15em", marginBottom: 36 }}>CARIBBEAN · 1695</div>

        <div style={{ display: "flex", flexDirection: "column", gap: T.spacing.md, width: 280 }}>
          <Tooltip text="Begin a new adventure. Choose your captain and ship.">
            <Btn v="gold" style={{ width: "100%" }} onClick={() => dispatch({ type: A.NAVIGATE, screen: "newgame" })}>▶ New Game</Btn>
          </Tooltip>

          {hasSave && (
            <Tooltip text="Continue your most recent voyage from where you left off.">
              <Btn v="ghost"  style={{ width: "100%" }} onClick={() => dispatch({ type: A.LOAD_GAME })}>↩ Continue</Btn>
            </Tooltip>
          )}

          <input type="file" accept=".broadside" ref={importRef} style={{ display: "none" }} onChange={handleImport} />
          <Tooltip text="Load an adventure from a saved file.">
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => importRef.current?.click()}>📂 Import Save</Btn>
          </Tooltip>

          {localStorageWarning && (
            <div style={{ color: T.redBr, fontSize: 9, textAlign: "center", marginTop: 8 }}>
              Browser storage is blocked. Use Import/Export Save to keep your progress.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── NEW GAME SCREEN (moved from screens_port.jsx) ────────────────
  function NewGameScreen({ dispatch }) {
    const { FACTIONS, STARTS, CREW_FIRST_NAMES, CREW_LAST_NAMES } = window.D;
    const L = window.L;
    const A = window.E.A;
    const { T, panelStyle, Btn } = window.UI;

    const [captainName, setCaptainName] = useState(() => {
      const first = CREW_FIRST_NAMES?.english || ["William"];
      const last = CREW_LAST_NAMES?.english || ["Hartley"];
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      return `${pick(first)} ${pick(last)}`;
    });
    const [selectedFaction, setSelectedFaction] = useState(null);
    const [tutorialMode, setTutorialMode] = useState("full");

    const handleRandomName = () => {
      const faction = selectedFaction || "english";
      const first = CREW_FIRST_NAMES?.[faction] || ["Captain"];
      const last = CREW_LAST_NAMES?.[faction] || ["Unknown"];
      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
      setCaptainName(`${pick(first)} ${pick(last)}`);
    };

    const handleSetSail = () => {
      if (!captainName.trim()) return;
      if (!selectedFaction) return;
      dispatch({
        type: A.START_GAME,
        captainName: captainName.trim(),
        faction: selectedFaction,
        tutorialMode,   
      });
    };

    const backstory = selectedFaction ? STARTS.factionBackstory?.[selectedFaction] : null;
    const startPort = selectedFaction ? (window.D.PORTS[STARTS.factionPorts?.[selectedFaction]]?.name || "") : "";

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: T.spacing.xl,
        background: `radial-gradient(ellipse at 50% 60%, #0a1e38 0%, ${T.bg} 70%)`,
      }}>
        <div style={{ color: T.gold, fontSize: 32, fontWeight: "bold", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4, textShadow: `0 0 30px ${T.goldDim}` }}>⚓ Broadside</div>
        <div style={{ color: T.textDim, fontSize: 11, letterSpacing: "0.15em", marginBottom: 36 }}>CARIBBEAN · 1695</div>

        <div style={{ width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: T.spacing.lg }}>
          {/* Captain Name */}
          <div>
            <div style={{ color: T.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Captain's Name</div>
            <div style={{ display: "flex", gap: T.spacing.sm }}>
              <input type="text" value={captainName} onChange={e => setCaptainName(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 15, fontFamily: T.font, borderRadius: 2, outline: "none" }} />
              <Btn sm v="ghost" onClick={handleRandomName}>🎲 Random</Btn>
            </div>
          </div>

          {/* Faction Selection */}
          <div>
            <div style={{ color: T.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Choose your allegiance</div>
            <div style={{ display: "flex", gap: T.spacing.sm }}>
              {Object.entries(FACTIONS).map(([key, fac]) => (
                <div key={key} onClick={() => setSelectedFaction(key)}
                  style={{ flex: 1, padding: "10px 6px", textAlign: "center", cursor: "pointer",
                    background: selectedFaction === key ? (fac.color + "20") : T.panel,
                    border: `2px solid ${selectedFaction === key ? fac.color : T.border}`,
                    borderRadius: 2, transition: "border-color 0.15s" }}>
                  <div style={{ color: fac.color, fontSize: 10, fontWeight: "bold", letterSpacing: "0.05em" }}>{fac.label.substring(0,3).toUpperCase()}</div>
                  <div style={{ color: T.textDim, fontSize: 8 }}>{fac.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Backstory */}
          {backstory && (
            <div style={panelStyle({ background: T.bgDeep, borderColor: T.borderFaint })}>
              <p style={{ color: T.text, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight, margin: "0 0 6px" }}>
                You arrived in <strong>{startPort}</strong> with {backstory.hook}.
              </p>
              <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight, margin: 0, fontStyle: "italic" }}>
                {backstory.flavour}
              </p>
              <p style={{ color: T.textFaint, fontSize: T.captionFontSize, marginTop: 8 }}>
                Your adventure begins in <strong>{startPort}</strong>.
              </p>
            </div>
          )}

          {/* Onboarding toggle */}
          {/* Tutorial choice */}
<div>
  <div style={{ color: T.textDim, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
    Tutorial style
  </div>
  <div style={{ display: "flex", flexDirection: "column", gap: T.spacing.sm }}>
    {[
      { value: "full",  label: "Guided (Quartermaster)", desc: "A crewmate guides you step by step." },
      { value: "light", label: "Hints only",             desc: "Help popups on your first visit to each screen." },
      { value: "none",  label: "None",                   desc: "No guidance – you're on your own." },
    ].map(opt => (
      <label key={opt.value}
        style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          padding: "6px 8px", borderRadius: 3,
          background: tutorialMode === opt.value ? T.panelAlt : T.panel,
          border: `2px solid ${tutorialMode === opt.value ? T.gold : T.border}`,
          transition: "border-color 0.15s",
        }}>
        <input
          type="radio"
          name="tutorialMode"
          value={opt.value}
          checked={tutorialMode === opt.value}
          onChange={() => setTutorialMode(opt.value)}
          style={{ accentColor: T.gold }}
        />
        <div>
          <div style={{ color: T.text, fontSize: 12, fontWeight: "bold" }}>{opt.label}</div>
          <div style={{ color: T.textDim, fontSize: 9 }}>{opt.desc}</div>
        </div>
      </label>
    ))}
  </div>
</div>

          {/* Set Sail */}
          <Btn v="gold" onClick={handleSetSail} disabled={!captainName.trim() || !selectedFaction} style={{ fontSize: 16, padding: "14px" }}>
            ⛵ Set Sail
          </Btn>
        </div>
      </div>
    );
  }

  // ── ONBOARDING POPUP (global QM dialogue) ────────────────────────
  
  const QMPopup = ({ qmName, message, onDismiss, onSkip }) => {
  if (!message) return null;
  return React.createElement('div', {
    style: {
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      maxWidth: 560, width: "90%", zIndex: 500,
      background: T.panel, border: `1px solid ${T.gold}`, borderRadius: 2,
      padding: 12, display: "flex", alignItems: "flex-start", gap: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      animation: "qmSlideIn 0.3s ease-out",
    }
  },
    React.createElement('div', { style: { fontSize: 20, flexShrink: 0 } }, '⚓'),
    React.createElement('div', { style: { flex: 1 } },
      React.createElement('div', { style: { color: T.gold, fontSize: 11, fontWeight: "bold", marginBottom: 4 } }, qmName),
      React.createElement('div', { style: { color: T.textDim, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight } }, message),
      React.createElement('div', { style: { marginTop: 8, display: "flex", gap: 12 } },
        React.createElement(Btn, { sm: true, v: "gold", onClick: onDismiss }, "Got it"),
        React.createElement('div', {
          onClick: onSkip,
          style: { color: T.textFaint, fontSize: 10, cursor: "pointer", textDecoration: "underline", alignSelf: "center" }
        }, "I'll take it from here"),
      ),
    ),
  );
};
  
  
  function OnboardingPopup({ state, dispatch }) {
    const onboarding = state.onboarding;
    if (!onboarding?.enabled || onboarding?.completed) return null;

    const qm = state.crew?.roster?.find(m => (m.tags || []).includes('quartermaster'));
    const qmName = qm ? `${qm.firstName} ${qm.lastName}` : 'Quartermaster';

    // ── Helper that picks the next unseen message ──────────────────
    const getMessage = useMemo(() => {
      const seen = onboarding.qmMessagesSeen || {};
      const steps = onboarding.stepsCompleted || {};
      const screen = state.screen;

      // Ordered list of conditions → dialogue keys → message text
      const msgSteps = [
        // Step 0: Welcome
        { key: 'welcome', condition: !steps.firstArrival, screen: 'port',
          text: () => QM_DIALOGUE.step0_welcome(qmName, PORTS[state.currentPort]?.name) },
        // Step 1: Contract accepted
        { key: 'contractAccepted', condition: steps.firstContractAccepted && !steps.marketOpened, screen: null,
          text: () => QM_DIALOGUE.step1_contractAccepted(qmName) },
        // Step 2: Market open
        { key: 'marketOpen', condition: steps.marketOpened && !steps.provisionsAndGoodsBought, screen: 'market',
          text: () => QM_DIALOGUE.step2_marketOpen(qmName) },
        // Step 3: Goods bought
        { key: 'stocked', condition: steps.provisionsAndGoodsBought && !steps.mapOpened, screen: null,
          text: () => QM_DIALOGUE.step2_stocked(qmName) },
        // Step 4: Map open
        { key: 'mapOpen', condition: steps.mapOpened && !steps.firstVoyageStarted, screen: 'map',
          text: () => QM_DIALOGUE.step3_mapOpen(qmName) },
        // Step 5: Sailing
        { key: 'sailing', condition: steps.firstVoyageStarted && !steps.firstArrival, screen: 'sailing',
          text: () => QM_DIALOGUE.step4_sailing(qmName) },
        // Step 6: Arrival
        { key: 'arrival', condition: steps.firstArrival && !steps.firstContractDelivered, screen: 'port',
          text: () => QM_DIALOGUE.step5_arrival(qmName) },
        // Step 7: Contract delivered
        { key: 'delivered', condition: steps.firstContractDelivered && !steps.crewOpened, screen: 'port',
          text: () => QM_DIALOGUE.step5_delivered(qmName) },
        // Step 8: Crew open
        { key: 'crewOpen', condition: steps.crewOpened && !steps.firstCrewHired, screen: 'crew',
          text: () => QM_DIALOGUE.step6_crewOpen(qmName) },
        // Step 9: Crew hired
        { key: 'crewHired', condition: steps.firstCrewHired && !steps.tutorialHuntAccepted, screen: 'port',
          text: () => QM_DIALOGUE.step6_hired(qmName) },
        // Step 10: Tutorial hunt accepted
        { key: 'huntAccepted', condition: steps.tutorialHuntAccepted && !steps.tutorialHuntCompleted, screen: 'port',
          text: () => QM_DIALOGUE.step6b_huntAccepted(qmName) },
        // Step 11: Tutorial hunt victory
        { key: 'huntVictory', condition: steps.tutorialHuntCompleted && !steps.shipyardOpened, screen: 'port',
          text: () => QM_DIALOGUE.step6b_victory(qmName) },
        // Step 12: Shipyard open
        { key: 'shipyardOpen', condition: steps.shipyardOpened && !steps.shipRepaired, screen: 'shipyard',
          text: () => QM_DIALOGUE.step7_shipyardOpen(qmName) },
        // Step 13: Ship repaired
        { key: 'repaired', condition: steps.shipRepaired && !steps.journalOpened, screen: 'port',
          text: () => QM_DIALOGUE.step7_repaired(qmName) },
        // Step 14: Journal open
        { key: 'journalOpen', condition: steps.journalOpened, screen: 'journal',
          text: () => QM_DIALOGUE.step8_journalOpen(qmName) },
        // Step 15: Back to port after journal : farewell & onboarding completion
         { key: 'departure',
            condition: steps.journalOpened && !onboarding.completed,
            screen: 'port',
            text: () => QM_DIALOGUE.step9_departure(qmName) }, 
      ];

      for (const step of msgSteps) {
        if (!step.condition) continue;
        if (step.screen && screen !== step.screen) continue;  // wait for the right screen
        if (seen[step.key]) continue;                         // already shown
        return { key: step.key, text: step.text() };
      }

      return null;
    }, [state]);  // react to any state change

 const handleDismiss = () => {
    console.log('handleDismiss called, getMessage:', getMessage);
    if (getMessage?.key) {
        console.log('Dispatching QM_SEEN for', getMessage.key);
        dispatch({ type: A.ONBOARDING_QM_SEEN, messageKey: getMessage.key });
        if (getMessage.key === 'departure') {
            dispatch({ type: A.ONBOARDING_COMPLETE });
        }
    }
};

    const handleSkip = () => {
      dispatch({ type: A.ONBOARDING_SKIP });
    };

    return (
      <QMPopup
        qmName={qmName}
        message={getMessage?.text || null}
        onDismiss={handleDismiss}
        onSkip={handleSkip}
      />
    );
  }

  // ── EXPORTS ─────────────────────────────────────────────────────
  Object.assign(window.S, {
    TitleScreen,
    NewGameScreen,
    OnboardingPopup,
  });
})();