// screens_core.jsx — Title, New Game & Centralised Onboarding QM Popup
window.S = window.S || {};

(() => {
  const { useState, useEffect, useMemo } = React;
  const { PORTS, FACTIONS, STARTS, CREW_FIRST_NAMES, CREW_LAST_NAMES, QM_DIALOGUE } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, ScreenHeader, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip,
    IconAnchor,IconPlay,IconContinue,IconFileTransfer,IconDice,IconSailboat, IconJournal  } = window.UI;

  // ── TITLE SCREEN (moved from screens_port.jsx) ───────────────────
function TitleScreen({ dispatch }) {
  const hasSave = L.hasSave();
  const importRef = React.useRef(null);
  const localStorageWarning = React.useMemo(() => !L.checkLocalStorageAvailable(), []);

  // Changelog popup state
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelogContent, setChangelogContent] = useState(null);
  const handleShowChangelog = () => {
    setShowChangelog(true);
    if (!changelogContent) {
      fetch("docs/changelog.md")
        .then(r => r.text())
        .then(md => setChangelogContent(md))
        .catch(() => setChangelogContent("*Changelog not available.*"));
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => dispatch({ type: A.IMPORT_SAVE, fileContent: reader.result });
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Hero section ─────────────────────────────────────── */}
      <div style={{
        height: "25vh", minHeight: 220,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: T.spacing.xl,
        background: `linear-gradient(180deg, ${T.bg} 0%, #1c3450 100%)`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div className="title-font" style={{
          color: T.gold,
          fontSize: 42,
          fontWeight: "normal",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 4,
          textShadow: `0 0 30px ${T.goldDim}`,
          fontFamily: "'IMFellEnglishSC', Georgia, serif",
          lineHeight: 1.1,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <IconAnchor size={32} color={T.gold} />
          Broadside
          <IconAnchor size={32} color={T.gold} />
        </div>
        <div style={{
          color: T.textDim,
          fontSize: T.metadataFontSize,
          letterSpacing: "0.15em",
          marginBottom: 24,
          fontFamily: "'IMFellEnglishSC', Georgia, serif",
        }}>
          CARIBBEAN · 1695
        </div>

        {/* Wave SVG with floating animation */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "auto",
            maxHeight: "120px",
            animation: "waveFloat 4s ease-in-out infinite alternate",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,40 C240,100 480,0 720,60 C960,120 1200,20 1440,60 L1440,120 L0,120 Z"
            fill={T.panelAlt}
          />
        </svg>
      </div>

      {/* ── Actions section ──────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: T.panelAlt,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${T.spacing.xl}px ${T.spacing.xl}px 40px`,
        gap: T.spacing.md,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: T.spacing.md, width: 280 }}>
          <Tooltip text="Begin a new adventure. Choose your captain and ship.">
            <Btn v="gold" style={{ width: "100%" }} onClick={() => dispatch({ type: A.NAVIGATE, screen: "newgame" })}>
              <IconPlay size={12} color={T.gold} /> New Game
            </Btn>
          </Tooltip>

          {hasSave && (
            <Tooltip text="Continue your most recent voyage from where you left off.">
              <Btn v="ghost" style={{ width: "100%" }} onClick={() => dispatch({ type: A.LOAD_GAME })}>
                <IconContinue size={12} color={T.gold} /> Continue
              </Btn>
            </Tooltip>
          )}

          <input type="file" accept=".broadside" ref={importRef} style={{ display: "none" }} onChange={handleImport} />
          <Tooltip text="Load an adventure from a saved file.">
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => importRef.current?.click()}>
              <IconFileTransfer size={12} color={T.gold} /> Import Save
            </Btn>
          </Tooltip>

          <Tooltip text="See what's new in this version.">
            <Btn v="ghost" style={{ width: "100%" }} onClick={handleShowChangelog}>
              <IconJournal size={12} color={T.gold} /> Changelog
            </Btn>
          </Tooltip>

          {localStorageWarning && (
            <div style={{ color: T.redBr, fontSize: 9, textAlign: "center", marginTop: 8 }}>
              Browser storage is blocked. Use Import/Export Save to keep your progress.
            </div>
          )}
        </div>
      </div>

      {/* ── Changelog popup ──────────────────────────────────── */}
      {showChangelog && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowChangelog(false)}>
          <div style={{
            background: T.panel,
            border: `1px solid ${T.gold}`,
            borderRadius: 2,
            padding: T.spacing.lg,
            width: 420,
            maxWidth: "95vw",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", marginBottom: 16 }}>
              Changelog
            </div>
            <NarrativePanel variant="neutral">
              {changelogContent
                ? (() => {
                    const lines = changelogContent.split("\n");
                    const elements = [];
                    let i = 0;
                    while (i < lines.length) {
                      const line = lines[i];
                      if (/^###\s/.test(line)) {
                        elements.push(
                          <div key={i} style={{ color: T.gold, fontSize: T.heading3FontSize, fontWeight: "bold", marginTop: 12, marginBottom: 4 }}>
                            {line.replace(/^###\s+/, "")}
                          </div>
                        );
                        i++;
                        continue;
                      }
                      if (line.trim() === "") { i++; continue; }
                      const processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                      elements.push(
                        <div key={i} style={{ color: T.textDim, fontSize: T.captionFontSize, lineHeight: 1.5, marginBottom: 4 }}
                          dangerouslySetInnerHTML={{ __html: processed }} />
                      );
                      i++;
                    }
                    return elements;
                  })()
                : <div style={{ color: T.textDim }}>Loading…</div>}
            </NarrativePanel>
            <div style={{ marginTop: 12, textAlign: "right" }}>
              <Btn sm v="gold" onClick={() => setShowChangelog(false)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Hero section (blue gradient + wave) ──────────────── */}
      <div style={{
        height: "25vh", minHeight: 220,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        padding: `0 ${T.spacing.xl}px`,
        background: `linear-gradient(180deg, ${T.bg} 0%, #1c3450 100%)`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div className="title-font" style={{
          color: T.gold,
          fontSize: 42,
          fontWeight: "normal",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          marginBottom: 4,
          textShadow: `0 0 30px ${T.goldDim}`,
          lineHeight: 1.1,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <IconAnchor size={32} color={T.gold} />
          Broadside
          <IconAnchor size={32} color={T.gold} />
        </div>
        <div className="title-font" style={{
          color: T.textDim,
          fontSize: T.metadataFontSize,
          letterSpacing: "0.15em",
          marginBottom: 40,
        }}>
          CARIBBEAN · 1695
        </div>

        {/* Wave SVG */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "auto",
            maxHeight: "120px",
            animation: "waveFloat 4s ease-in-out infinite alternate",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,40 C240,100 480,0 720,60 C960,120 1200,20 1440,60 L1440,120 L0,120 Z"
            fill={T.panelAlt}
          />
        </svg>
      </div>

      {/* ── Form section (brown background) ──────────────────── */}
      <div style={{
        flex: 1,
        background: T.panelAlt,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: `${T.spacing.xl}px ${T.spacing.xl}px 40px`,
      }}>
        <div style={{ width: 380, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: T.spacing.lg }}>
          {/* Captain Name */}
          <div>
            <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Captain's Name</div>
            <div style={{ display: "flex", gap: T.spacing.sm }}>
              <input type="text" value={captainName} onChange={e => setCaptainName(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", background: T.panel, border: `1px solid ${T.border}`, color: T.text, fontSize: 15, fontFamily: T.font, borderRadius: 2, outline: "none" }} />
              <Btn sm v="ghost" onClick={handleRandomName}><IconDice size={12} color={T.gold} /> Random</Btn>
            </div>
          </div>

          {/* Faction Selection */}
          <div>
            <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Choose your allegiance</div>
            <div style={{ display: "flex", gap: T.spacing.sm }}>
              {Object.entries(FACTIONS).map(([key, fac]) => (
                <div key={key} onClick={() => setSelectedFaction(key)}
                  style={{ flex: 1, padding: "10px 6px", textAlign: "center", cursor: "pointer",
                    background: selectedFaction === key ? (fac.color + "20") : T.panel,
                    border: `2px solid ${selectedFaction === key ? fac.color : T.border}`,
                    borderRadius: 2, transition: "border-color 0.15s" }}>
                  <div style={{ color: fac.color, fontSize: T.captionFontSize, fontWeight: "bold", letterSpacing: "0.05em" }}>{fac.label.substring(0,3).toUpperCase()}</div>
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

          {/* Tutorial choice */}
          <div>
            <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
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
                    <div style={{ color: T.text, fontSize: T.narrativeFontSize, fontWeight: "bold" }}>{opt.label}</div>
                    <div style={{ color: T.textDim, fontSize: 9 }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Set Sail */}
          <Btn v="gold" onClick={handleSetSail} disabled={!captainName.trim() || !selectedFaction} style={{ fontSize: 16, padding: "14px" }}>
            <IconSailboat size={16} color={T.gold} /> Set Sail
          </Btn>
        </div>
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
    React.createElement('div', { style: { flex: 1 } },
      React.createElement('div', { style: { color: T.gold, fontSize: 11, fontWeight: "bold", marginBottom: 4 } }, qmName),
      React.createElement('div', { style: { color: T.textDim, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight } }, message),
      React.createElement('div', { style: { marginTop: 8, display: "flex", gap: 12 } },
        React.createElement(Btn, { sm: true, v: "gold", onClick: onDismiss }, "Got it"),
        React.createElement('div', {
          onClick: onSkip,
          style: { color: T.textFaint, fontSize: T.captionFontSize, cursor: "pointer", textDecoration: "underline", alignSelf: "center" }
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
    if (getMessage?.key) {
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