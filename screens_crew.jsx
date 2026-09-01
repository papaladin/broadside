// screens_crew.jsx : Crew Screen
window.S = window.S || {};

(() => {
  const { useState, useMemo, useRef, useEffect } = React;
  const { SHIPS, FACTIONS, PORTS } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, EmptyState, TutorialPopup, BackButton, Tooltip, Panel,
    IconCheers,IconAnchor, IconCannon, IconHammer, IconChefHat, IconCompass, IconShield } = window.UI;
  const G = window.G;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // Helper: returns an SVG icon element for the given crew role
  const getRoleIcon = (role) => {
    const iconProps = { size: 14, color: T.text };
    switch (role) {
      case "deckhand":     return <IconAnchor {...iconProps} />;
      case "gunner":       return <IconCannon {...iconProps} />;
      case "cook":         return <IconChefHat {...iconProps} />;
      case "carpenter":    return <IconHammer {...iconProps} />;
      case "navigator":    return <IconCompass {...iconProps} />;
      case "quartermaster":return <IconShield {...iconProps} />;
      default:             return <span>👤</span>;
    }
  };

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
    const [selectedMember, setSelectedMember] = useState(null);
    const [showTutorial, setShowTutorial] = useState(() => shouldShowTutorial(state, "crew"));

    // ── Filter & Sort state ────────────────────────────────────────────
    const [filterFaction, setFilterFaction] = useState("all");
    const [sortBy, setSortBy] = useState("name");      // "name" | "days"
    const [sortAsc, setSortAsc] = useState(true);

    const bioCache = useRef({});
    useEffect(() => {
      bioCache.current = {};
    }, [state.currentPort]);

    const getCrewBio = (member) => {
      if (!member) return "";
      if (member.bio) return member.bio;
      if (bioCache.current[member.id]) return bioCache.current[member.id];
      if (typeof G.generateCrewBio === 'function') {
        const newBio = G.generateCrewBio(member, state);
        bioCache.current[member.id] = newBio;
        return newBio;
      }
      return `${member.firstName} is a crew member.`;
    };

    // ── Filter & sort roster ────────────────────────────────────────────
    const filteredRoster = useMemo(() => {
      let result = [...state.crew.roster];

      // Filter by faction
      if (filterFaction !== "all") {
        result = result.filter(m => m.faction === filterFaction);
      }

      // Sort
      if (sortBy === "name") {
        result.sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          return sortAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        });
      } else if (sortBy === "days") {
        result.sort((a, b) => {
          const daysA = a.daysAboard || 0;
          const daysB = b.daysAboard || 0;
          return sortAsc ? daysA - daysB : daysB - daysA;
        });
      }

      return result;
    }, [state.crew.roster, filterFaction, sortBy, sortAsc]);

    // ── Build faction options for dropdown ──────────────────────────────
    const factionOptions = [
      { key: "all", label: "Show All" },
      ...Object.entries(FACTIONS).map(([key, f]) => ({ key, label: f.label, color: f.color })),
    ];

    const toggleSort = (field) => {
      if (sortBy === field) {
        setSortAsc(!sortAsc);
      } else {
        setSortBy(field);
        setSortAsc(true);
      }
    };

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
          <Panel>
            <SectionTitle>ROSTER</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.spacing.sm, marginBottom: 10 }}>
              <StatBlock label="Aboard" value={`${state.crew.roster.length}/${state.crew.max}`} />
              <StatBlock label="Berths Free" value={open} />
              <StatBlock label="Morale" value={`${state.crew.morale}%`} color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} />
              <StatBlock label="Daily Wage" value={`${state.crew.roster.length * 2}g`} />
            </div>
            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4 }}>MORALE</div>
            <Bar value={state.crew.morale} max={100} color={state.crew.morale > 60 ? T.greenBr : state.crew.morale > 30 ? T.gold : T.redBr} h={10} />
            {state.crew.morale < 50 && <div style={{ color: T.redBr, fontSize: T.captionFontSize, marginTop: 6 }}>⚠ Low morale weakens combat effectiveness</div>}

            {(() => {
              const counts = {};
              state.crew.roster.forEach(m => {
                counts[m.faction] = (counts[m.faction] || 0) + 1;
              });
              return (
                <div style={{ fontSize: T.captionFontSize, color: T.textDim, marginTop: 10 }}>
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
              <Btn v="green" onClick={() => dispatch({ type: A.RAISE_MORALE })} disabled={state.crew.roster.length === 0 || state.gold < state.crew.roster.length * 5 || state.crew.morale >= 100}>
                <IconCheers size={12} color={T.greenBr} /> Buy Drinks ({state.crew.roster.length * 5}g) +5 Morale
              </Btn>
            </div>
          </Panel>

          {/* ── HIRE PANEL ────────────────────────────────── */}
          <Panel>
            <SectionTitle>HIRE</SectionTitle>

            {/* Spanish birth info */}
            {state.faction === 'spanish' && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: T.gold, fontSize: T.captionFontSize }}>
                  ⚓ Spanish crew: <strong>40g</strong> (normally 50g)
                </div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>
                  You can only recruit at <strong>Spanish ports</strong>.
                </div>
                {window.D.PORTS[state.currentPort]?.faction !== 'spanish' && (
                  <div style={{ color: T.redBr, fontSize: T.captionFontSize, marginTop: 4 }}>
                    ⚠ You are at a non-Spanish port — hire is unavailable.
                  </div>
                )}
              </div>
            )}

            <p style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 10, lineHeight: 1.5 }}>
              {state.faction === 'spanish' ? `40g per Spanish sailor.` : `50g per sailor.`}
              Your {SHIPS[state.ship.type].name} holds {state.crew.max}.
            </p>

            <div style={{ display: "flex", gap: T.spacing.sm, flexWrap: "wrap" }}>
              {[1, 5, 10].map(n => {
                const isSpanishBlocked = state.faction === 'spanish' &&
                  window.D.PORTS[state.currentPort]?.faction !== 'spanish';
                const costPer = state.faction === 'spanish' ? 40 : 50;
                const totalCost = n * costPer;
                const disabled = open < n || state.gold < totalCost || isSpanishBlocked;

                let tooltip = "";
                if (isSpanishBlocked) tooltip = "Spanish captains can only hire at Spanish ports.";
                else if (open < n) tooltip = "Not enough berths.";
                else if (state.gold < totalCost) tooltip = `Need ${totalCost - state.gold}g more.`;

                return (
                  <Tooltip key={n} text={tooltip}>
                    <Btn
                      v="green"
                      onClick={() => dispatch({ type: A.HIRE_CREW, count: n })}
                      disabled={disabled}
                    >
                      +{n} ({totalCost}g)
                    </Btn>
                  </Tooltip>
                );
              })}
            </div>

            {open === 0 && <EmptyState message="Ship is at full capacity." />}
          </Panel>

          {/* ── CREW DETAIL / LEGEND PANEL ────────────────── */}
          <Panel>
            <SectionTitle>CREW DETAILS</SectionTitle>
            {selectedMember ? (
              (() => {
                const visibleTags = (selectedMember.tags || []).filter(t => !t.startsWith("hidden_"));
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
                      {visibleTags.length > 0 && (
                        <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {visibleTags.map(tag => {
                            const positiveTraits = ["loyal", "seasoned", "veteran"];
                            const isPositive = positiveTraits.includes(tag);
                            const color = isPositive ? T.greenBr : T.redBr;
                            const displayLabels = {
                              loyal: "Loyal Officer",
                              scar_battle: "Battle Scarred",
                              scar_storm: "Storm Survivor",
                              scar_shipwreck: "Shipwrecked",
                              seasoned: "Seasoned",
                              veteran: "Veteran",
                              mutineer: "Mutineer",
                              upset: "Upset",
                              revealed_drunkard: "Drunkard",
                              revealed_coward: "Coward",
                              revealed_greedy: "Greedy",
                            };
                            const label = displayLabels[tag] || tag
                              .replace("revealed_", "")
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, c => c.toUpperCase());
                            return <Pill key={tag} label={label} color={color} />;
                          })}
                        </div>
                      )}
                      <div style={{ marginTop: 8, color: T.textDim, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight, fontStyle: "italic" }}>
                        {getCrewBio(selectedMember)}
                      </div>
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
                    ) : null}
                  </div>
                );
              })()
            ) : (
              <div style={{ color: T.textDim, fontSize: T.narrativeFontSize, fontStyle: "italic" }}>
                Click on any crew member icon for details.
              </div>
            )}
          </Panel>
        </div>

        {/* ── MANIFEST with Filter & Sort ────────────────── */}
        <Panel>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            <SectionTitle style={{ marginBottom: 0 }}>MANIFEST</SectionTitle>

            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {/* Faction Filter Dropdown */}
              <select
                value={filterFaction}
                onChange={(e) => setFilterFaction(e.target.value)}
                style={{
                  background: T.panel,
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 2,
                  padding: "4px 8px",
                  fontSize: T.metadataFontSize,
                  fontFamily: T.font,
                  cursor: "pointer",
                  minHeight: 32,
                  outline: "none",
                }}
              >
                {factionOptions.map(f => (
                  <option key={f.key} value={f.key} style={{ color: f.color || T.text }}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Sort buttons */}
              <div style={{ display: "flex", gap: 4 }}>
                <Btn
                  sm
                  v={sortBy === "name" ? "gold" : "ghost"}
                  onClick={() => toggleSort("name")}
                  style={{ fontSize: T.captionFontSize, minHeight: 28, padding: "2px 10px" }}
                >
                  Name {sortBy === "name" && (sortAsc ? "↑" : "↓")}
                </Btn>
                <Btn
                  sm
                  v={sortBy === "days" ? "gold" : "ghost"}
                  onClick={() => toggleSort("days")}
                  style={{ fontSize: T.captionFontSize, minHeight: 28, padding: "2px 10px" }}
                >
                  Days {sortBy === "days" && (sortAsc ? "↑" : "↓")}
                </Btn>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {filteredRoster.map(member => {
              const visibleTags = (member.tags || []).filter(t => !t.startsWith("hidden_"));
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
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getRoleIcon(member.role)}
                  </span>
                  <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 8, height: 8, borderRadius: "50%",
                    background: factionColor,
                    border: `1px solid ${T.bgDeep}`,
                  }} />
                  {isMutineer && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      fontSize: T.captionFontSize, color: T.purpleBr,
                    }}>⚠</span>
                  )}
                </div>
              );
            })}
          </div>

          {filteredRoster.length === 0 && (
            <div style={{ color: T.textDim, fontSize: T.narrativeFontSize, textAlign: "center", padding: 16 }}>
              No crew members match the selected filter.
            </div>
          )}
        </Panel>
      </div>
    );
  }

  Object.assign(window.S, { CrewScreen });
})();