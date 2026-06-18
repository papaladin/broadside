// screens_crew.jsx : Crew Screen
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { SHIPS, FACTIONS, PORTS } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, EmptyState, TutorialPopup, BackButton, Tooltip } = window.UI;
  const G = window.G;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  function CrewScreen({ state, dispatch }) {
    const perk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
    if (perk.servicesBlocked) {
      return (
        <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
          <BackButton dispatch={dispatch} />
          <EmptyState message="⚔ You are at war with this port. No crew services available." />
        </div>
      );
    }
    const open = SHIPS[state.ship.type].maxCrew - state.crew.roster.length;
    const [selectedMember, setSelectedMember] = React.useState(null);
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state,"crew"));

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <BackButton dispatch={dispatch} />
        
        {showTutorial && (
          <TutorialPopup
            title="Your Crew"
            onDismiss={(disableAll) => {
              markTutorialSeen("crew", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>Click any crew member to see their story. Over time, they earn:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li><strong>Scars</strong> from battles and storms they survived</li>
              <li><strong>Traits</strong> that reveal hidden personalities</li>
              <li><strong>Loyalty</strong> status : veterans who've served 200+ days may pledge loyalty</li>
            </ul>
            <p>Watch crew faction alignment. Attacking a crew member's home faction can make them upset and eventually desert.</p>
          </TutorialPopup>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: T.spacing.md }}>
          {/* ── ROSTER PANEL ──────────────────────────────── */}
          <div style={panelStyle()}>
            <SectionTitle>ROSTER</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.spacing.sm, marginBottom: 10 }}>
              <StatBlock label="Aboard" value={`${state.crew.roster.length}/${state.crew.max}`} />
              <StatBlock label="Berths Free" value={open} />
              <StatBlock label="Morale" value={`${state.crew.morale}%`} color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} />
              <StatBlock label="Daily Wage" value={`${state.crew.roster.length * 2}g`} />
            </div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>MORALE</div>
            <Bar value={state.crew.morale} max={100} color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} h={10} />
            {state.crew.morale < 50 && <div style={{ color: T.redBr, fontSize: 10, marginTop: 6 }}>⚠ Low morale weakens combat effectiveness</div>}

            {(() => {
              const counts = {};
              state.crew.roster.forEach(m => {
                counts[m.faction] = (counts[m.faction] || 0) + 1;
              });
              return (
                <div style={{ fontSize: 10, color: T.textDim, marginTop: 10 }}>
                  {Object.entries(counts).map(([faction, count]) => {
                    const fac = FACTIONS[faction];
                    return (
                      <span key={faction} style={{ color: fac?.color || T.textDim, marginRight: 10 }}>
                        {fac?.label || faction}: {count}
                      </span>
                    );
                  })}
                </div>
              );
            })()}

            <div style={{ marginTop: 10 }}>
              <Btn v="green" onClick={() => dispatch({ type: A.RAISE_MORALE })} disabled={state.crew.roster.length === 0 ||  state.gold < state.crew.roster.length * 5 || state.crew.morale >= 100}>🍻 Buy Drinks ({state.crew.roster.length * 5}g) +5 Morale</Btn>
            </div>
          </div>

          {/* ── HIRE PANEL ────────────────────────────────── */}
          <div style={panelStyle()}>
            <SectionTitle>HIRE</SectionTitle>
            <p style={{ color: T.textDim, fontSize: 10, marginBottom: 10, lineHeight: 1.5 }}>50g per sailor. Your {SHIPS[state.ship.type].name} holds {state.crew.max}.</p>
            <div style={{ display: "flex", gap: T.spacing.sm, flexWrap: "wrap" }}>
            {[1, 5, 10].map(n => <Btn key={n} v="green" onClick={() => dispatch({ type: A.HIRE_CREW, count: n })} disabled={open < n || state.gold < n * 50}>+{n} ({n * 50}g)</Btn>)}
            </div>
            {open === 0 && <EmptyState message="Ship is at full capacity." />}
          </div>

          {/* ── CREW DETAIL / LEGEND PANEL ────────────────── */}
          <div style={panelStyle()}>
            <SectionTitle>CREW DETAILS</SectionTitle>
            {selectedMember ? (
              (() => {
                const ALL_ICONS = {
                  seasoned:           { icon: "⭐", label: "Seasoned: halved desertion chance" },
                  veteran:            { icon: "🎖️", label: "Veteran: halved desertion chance" },
                  loyal:              { icon: "👑", label: "Loyal Officer: never deserts" },
                  upset:              { icon: "⚠️", label: "Upset: may desert at next port" },
                  mutineer:           { icon: "⚓", label: "Mutineer: permanent; doubles desertion chance if upset" },
                  scar_battle:        { icon: "⚔️", label: "Battle-Scarred" },
                  scar_storm:         { icon: "🌊", label: "Storm Survivor" },
                  scar_shipwreck:     { icon: "🚢", label: "Shipwreck Survivor" },
                  revealed_drunkard:  { icon: "🍺", label: "Drunkard: drinks the ship's rum" },
                  revealed_coward:    { icon: "🐔", label: "Coward: loses morale on dangerous missions" },
                  revealed_greedy:    { icon: "💰", label: "Greedy: demands a bonus after missions" },
                };
                const visibleTags = (selectedMember.tags || []).filter(t => !t.startsWith("hidden_"));
                const memberIcons = Object.entries(ALL_ICONS).filter(([tag]) => visibleTags.includes(tag));

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: T.gold, fontSize: T.heading3FontSize, fontWeight: "bold" }}>
                        {selectedMember.firstName} {selectedMember.lastName}
                      </span>
                      <Btn sm v="ghost" onClick={() => setSelectedMember(null)}>✕</Btn>
                    </div>
                    <div style={{ fontSize: T.narrativeFontSize, color: T.text }}>
                      <div>Faction: <span style={{ color: FACTIONS[selectedMember.faction]?.color || T.text }}>{FACTIONS[selectedMember.faction]?.label || selectedMember.faction}</span></div>
                      <div>Role: {selectedMember.role}</div>
                      <div>Days aboard: {selectedMember.daysAboard ?? 0}</div>
                      {memberIcons.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {memberIcons.map(([tag, { icon, label }]) => (
                            <span key={tag} title={label} style={{ fontSize: T.heading2FontSize }}>{icon}</span>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: 8, color: T.textDim, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight, fontStyle: "italic" }}>
                        {selectedMember.bio
                          ? selectedMember.bio
                          : typeof G.generateCrewBio === 'function'
                            ? G.generateCrewBio(selectedMember, state)
                            : `${selectedMember.firstName} is a crew member.`}
                      </div>
                      {memberIcons.length > 0 && (
                        <details style={{ fontSize: 10, color: T.textDim, marginTop: 8 }}>
                          <summary style={{ cursor: "pointer", color: T.gold, fontSize: 10, letterSpacing: "0.05em" }}>ICON LEGEND</summary>
                          <div style={{ marginTop: 4, lineHeight: 1.8, paddingLeft: 4 }}>
                            {memberIcons.map(([tag, { icon, label }]) => (
                              <div key={tag} title={label}>{icon} {label}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                      {!L.hasTag(selectedMember, "protected") ? (
                      <Tooltip text="Dismiss this crew member permanently. This cannot be undone.">
                        <Btn sm v="red" style={{ marginTop: 8 }}
                          onClick={() => {
                            dispatch({ type: A.DISMISS_CREW, memberId: selectedMember.id });
                            setSelectedMember(null);
                          }}>
                          ✕ Dismiss
                        </Btn>
                      </Tooltip>
                    ) : (
                      // Placeholder for skip tutorial button (T11)
                      null
                    )}
                  </div>
                );
              })()
            ) : (
              <div style={{ color: T.textDim, fontSize: T.narrativeFontSize, fontStyle: "italic" }}>
                Click on any crew member icon for details.
              </div>
            )}
          </div>
        </div>

        {/* ── MANIFEST ───────────────────────────────────── */}
        <div style={{ ...panelStyle() }}>
          <SectionTitle>MANIFEST</SectionTitle>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {state.crew.roster.map(member => {
              const visibleTags = (member.tags || []).filter(t => !t.startsWith("hidden_"));
              const roleIcon = { deckhand: "⚓", gunner: "🗡", cook: "🍖", carpenter: "🔧", navigator: "🧭" }[member.role] ?? "👤";
              const factionColor = FACTIONS[member.faction]?.color || T.textDim;
              const isMutineer = L.hasTag(member, "mutineer");
              const tagLabels = visibleTags.map(t => {
                if (t === "upset") return "Upset";
                if (t === "mutineer") return "Mutineer";
                if (t === "scar_shipwreck") return "Shipwreck Survivor";
                if (t === "loyal") return "Loyal Officer";
                if (t === "seasoned") return "Seasoned";
                if (t === "veteran") return "Veteran";
                if (t.startsWith("revealed_")) return t.replace("revealed_", "").replace(/_/g, " ");
                return t;
              });
              const tooltipText = `${member.firstName} ${member.lastName} · ${member.role} · ${member.faction} · ${member.daysAboard}d aboard` +
                (tagLabels.length > 0 ? ` · ${tagLabels.join(", ")}` : "");

              return (
                <div
                  key={member.id}
                  title={tooltipText}
                  onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                  style={{
                    width: 34, height: 34, borderRadius: 3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: T.heading2FontSize, cursor: "pointer",
                    background: selectedMember?.id === member.id ? T.panelAlt : T.panel,
                    border: `2px solid ${selectedMember?.id === member.id ? T.gold : T.border}`,
                    position: "relative",
                  }}
                >
                  <span>{roleIcon}</span>
                  <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 8, height: 8, borderRadius: "50%",
                    background: factionColor,
                    border: `1px solid ${T.bgDeep}`,
                  }} />
                  {isMutineer && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      fontSize: 10, color: T.purpleBr,
                    }}>⚠</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window.S, { CrewScreen });
})();