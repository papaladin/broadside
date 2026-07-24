// screens_status.jsx — Status & Journal screens
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip, Panel,
    IconMap, IconBarChart, IconMarket, IconJournal, IconAnchor, IconCrew, IconFloppy, IconFileTransfer, IconTalking, IconGold, IconSkull, IconHandshake, IconSearch, PortSilhouette } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // ── STATUS SCREEN ────────────────────────────────────────────────────
  function StatusScreen({ state, dispatch }) {
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state, "status"));
    const [showFullLedger, setShowFullLedger] = React.useState(false);
    const [isNarrowStatus, setIsNarrowStatus] = React.useState(window.innerWidth < 700);

    React.useEffect(() => {
      const handle = () => setIsNarrowStatus(window.innerWidth < 700);
      window.addEventListener("resize", handle);
      return () => window.removeEventListener("resize", handle);
    }, []);

    const career = state.career || {};
    const daysSurvived = state.day;
    const portsTotal = Object.keys(PORTS).length;
    const portsVisitedCount = (career.portsVisited || []).length;
    const totalBattles = (career.battles?.won || 0) + (career.battles?.lost || 0) + (career.battles?.fled || 0);
    const totalCrewLost = (career.crewLost?.inBattle || 0) + (career.crewLost?.inStorm || 0)
                         + (career.crewLost?.deserted || 0) + (career.crewLost?.other || 0);

    const captainTag = L.getCaptainTag(state);
    const highlights = L.getCareerHighlights(state);

    const getFactionSummary = (factionKey) => {
      const ports = Object.entries(PORTS).filter(([_, p]) => p.faction === factionKey);
      if (ports.length === 0) return null;
      const avgRep = Math.round(
        ports.reduce((sum, [k]) => sum + (state.reputation[k] ?? 50), 0) / ports.length
      );
      const repLabel = L.reputationLabel(avgRep);
      const heat = state.factionAlerts?.[factionKey] || 0;
      const heatLabel = L.getHeatLabel(heat);
      const crewOfFaction = (state.crew?.roster || []).filter(m => m.faction === factionKey).length;
      const totalCrew = (state.crew?.roster || []).length;
      const crewPct = totalCrew > 0 ? Math.round((crewOfFaction / totalCrew) * 100) : 0;
      return { avgRep, repLabel, heat, heatLabel, crewOfFaction, totalCrew, crewPct };
    };

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <Tooltip text="Return to the harbour.">
          <BackButton dispatch={dispatch} />
        </Tooltip>

        {showTutorial && (
          <TutorialPopup title="Your Standing" onDismiss={(disableAll) => { markTutorialSeen("status", disableAll); setShowTutorial(false); }}>
            <p>This is where your career is tracked — your identity, your deeds, and your standing with the powers of the Caribbean.</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li><strong>Fame</strong> — earned through missions. Gates better ships, equipment, and hidden ports.</li>
              <li><strong>Infamy</strong> — earned through crime. High infamy blocks bribes and attracts bounty hunters.</li>
              <li><strong>Career</strong> — what you've actually done at sea.</li>
              <li><strong>Factions</strong> — how each rival power sees you, and how your crew aligns.</li>
            </ul>
            <p>The Caribbean keeps a ledger. Your name is written in it.</p>
          </TutorialPopup>
        )}

        {/* Section 1: Captain Identity */}
        <Panel color={T.gold}>
          <div style={{ display: "flex", flexDirection: isNarrowStatus ? "column" : "row", gap: T.spacing.md, alignItems: isNarrowStatus ? "flex-start" : "center" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: T.textDim, fontSize: T.captionFontSize, textTransform: "uppercase", letterSpacing: "0.08em" }}>Captain</div>
              <div style={{ color: T.text, fontSize: 22, fontWeight: "bold", marginTop: 2 }}>{state.captainName || "Unknown"}</div>
              <div style={{ color: FACTIONS[state.faction]?.color || T.textDim, fontSize: T.metadataFontSize, marginTop: 4, letterSpacing: "0.06em" }}>{FACTIONS[state.faction]?.label || "No faction"}</div>
              <div style={{ color: captainTag.color, fontSize: 13, marginTop: 8, fontStyle: "italic" }}>{captainTag.text}</div>
            </div>
            <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", justifyContent: isNarrowStatus ? "flex-start" : "flex-end", alignItems: "flex-start" }}>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ color: T.gold, fontSize: 22, fontWeight: "bold" }}>★ {state.fame}</div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{L.getFameInfo(state.fame).label}</div>
                <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>Fame</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint, fontSize: 22, fontWeight: "bold" }}>
                  <IconSkull size={18} color={(state.infamy ?? 0) > 0 ? T.red : T.textFaint} /> {state.infamy ?? 0}
                </div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>{L.getInfamyLabel(state.infamy ?? 0)}</div>
                <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>Infamy</div>
              </div>
              <div style={{ textAlign: "center", minWidth: 60 }}>
                <div style={{ color: T.text, fontSize: 22, fontWeight: "bold" }}>{daysSurvived}</div>
                <div style={{ color: T.textDim, fontSize: T.captionFontSize }}>days at sea</div>
                <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>Tenure</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Section 2: Career – title OUTSIDE the panel */}
        <div>
          <SectionTitle>CAREER</SectionTitle>
          <Panel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {highlights.map((line, i) => (
                <div key={i} style={{ color: T.text, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight, paddingLeft: 10, borderLeft: `2px solid ${T.borderFaint}` }}>{line}</div>
              ))}
            </div>
            <div onClick={() => setShowFullLedger(v => !v)} style={{ color: T.textFaint, fontSize: T.captionFontSize, cursor: "pointer", marginTop: 4, padding: 4, borderTop: `1px solid ${T.borderFaint}` }}>
              {showFullLedger ? "▾ Hide full ledger" : "▸ Show full ledger"}
            </div>
            {showFullLedger && (
              <div style={{ marginTop: 10, padding: 8, background: T.bgDeep, borderRadius: 3 }}>
                <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Economic</div>
                <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 10 }}>
                  <StatBlock label="Gold Earned" value={`${(career.goldEarned || 0).toLocaleString()}g`} color={T.gold} />
                  <StatBlock label="Gold Spent"  value={`${(career.goldSpent || 0).toLocaleString()}g`} color={T.redBr} />
                  <StatBlock label="Storms Survived" value={career.stormsSurvived || 0} />
                  <StatBlock label="Contraband Seized" value={career.contrabandSeized || 0} color={T.redBr} />
                </div>
                <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Combat</div>
                <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 10 }}>
                  <StatBlock label="Battles Won"  value={career.battles?.won || 0} color={T.greenBr} />
                  <StatBlock label="Battles Lost" value={career.battles?.lost || 0} color={T.redBr} />
                  <StatBlock label="Battles Fled" value={career.battles?.fled || 0} color={T.textDim} />
                  <StatBlock label="Ships Sunk"   value={career.shipsSunk || 0} />
                  <StatBlock label="Ships Plundered" value={career.shipsPlundered || 0} color={T.gold} />
                </div>
                <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Crew</div>
                <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 10 }}>
                  <StatBlock label="Hired"     value={career.crewHired || 0} color={T.greenBr} />
                  <StatBlock label="Dismissed" value={career.crewDismissed || 0} />
                  <StatBlock label="Lost in Battle" value={career.crewLost?.inBattle || 0} color={T.redBr} />
                  <StatBlock label="Lost in Storm"  value={career.crewLost?.inStorm || 0} color={T.redBr} />
                  <StatBlock label="Deserted"       value={career.crewLost?.deserted || 0} color={T.redBr} />
                  <StatBlock label="Other Losses"   value={career.crewLost?.other || 0} color={T.redBr} />
                  <StatBlock label="Longest Tenure" value={`${career.longestCrewTenure || 0}d`} color={T.blueBr} />
                </div>
                <div style={{ color: T.textFaint, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>World</div>
                <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap" }}>
                  <StatBlock label="Ports Visited" value={`${portsVisitedCount} / ${portsTotal}`} />
                  <StatBlock label="Ships Owned"   value={(career.shipsOwned || []).length} />
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Section 3: The World's View – title OUTSIDE the panel, left-aligned */}
        <div>
          <SectionTitle style={{ justifyContent: "flex-start" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <IconHandshake size={14} color={T.gold} />
              THE WORLD'S VIEW
            </span>
          </SectionTitle>
          <Panel>
            <p style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic", marginBottom: 10 }}>
              How each faction sees you, and how your crew aligns with them.
            </p>

            {Object.entries(FACTIONS).map(([factionKey, fac]) => {
              const summary = getFactionSummary(factionKey);
              if (!summary) return null;
              const { avgRep, repLabel, heat, heatLabel, crewOfFaction, totalCrew } = summary;
              const repColor = avgRep >= 60 ? T.greenBr : avgRep >= 30 ? T.gold : T.redBr;
              const isOwnFaction = factionKey === state.faction;

              // Build sentence – colorize faction name inline
              const repTier = repLabel.toLowerCase();
              const heatTier = heat >= 7 ? "hunted" : heat >= 3 ? "watched" : "clean";
              const templateKey = `${repTier}_${heatTier}`;
              const template = window.D.FACTION_RELATIONSHIP_TEMPLATES?.[templateKey];
              let sentence = template
                ? template(fac.label, avgRep)
                : `The ${fac.label} regard you with ${repTier} standing.`;

              // If own faction, replace initial "The [Faction] " with "Your people, the [Faction], "
              if (isOwnFaction) {
                sentence = sentence.replace(new RegExp(`^The ${fac.label} `, 'i'), `Your people, the ${fac.label}, `);
              }

              // Insert colored span around the faction label in the sentence
              const coloredFaction = `<span style="color:${fac.color};font-weight:bold">${fac.label}</span>`;
              const htmlSentence = sentence.replace(new RegExp(fac.label, 'g'), coloredFaction);

              return (
                <div key={factionKey} style={{ marginBottom: 16, paddingLeft: 10, borderLeft: `2px solid ${fac.color}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    {/* Prose – left side, same style as career sentences */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: T.text, fontSize: T.narrativeFontSize, lineHeight: T.narrativeLineHeight, margin: "4px 0 2px 0", paddingLeft: 2 }}
                         dangerouslySetInnerHTML={{ __html: htmlSentence }} />
                    </div>

                    {/* Stats – right side, stacked vertically */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, fontSize: T.captionFontSize, color: T.textFaint }}>
                      <span>
                        Rep: <span style={{ color: repColor, fontWeight: "bold" }}>{avgRep}</span> ({repLabel})
                      </span>
                      {heat > 0 && (
                        <span>
                          Heat: <span style={{ color: T.redBr, fontWeight: "bold" }}>{heat}</span> ({heatLabel})
                        </span>
                      )}
                      {totalCrew > 0 && (
                        <span>
                          Crew: <span style={{ color: T.text }}>{crewOfFaction}</span> / {totalCrew}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <p style={{ color: T.textDim, fontSize: T.captionFontSize, lineHeight: 1.6, marginTop: 10 }}>
              Reputation decays slowly toward neutral (50) over time. Complete missions, aid distressed ships, or parley with faction vessels to improve standing. Attacking their ships will anger all ports of that faction. Heat decays naturally as you stay clear of trouble.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  // ── JOURNAL SCREEN ──────────────────────────────────────────────────
  function JournalScreen({ state, dispatch }) {
    const [filterTab, setFilterTab] = useState("all");
    const [search, setSearch] = useState("");
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state,"journal"));

    const parsed = state.log.map(entry => {
      const match = entry.match(/^\[(\d+)\]\s*(.*)/);
      const day = match ? parseInt(match[1], 10) : null;
      const text = match ? match[2] : entry;
      return { day, text, raw: entry, tab: L.getLogTabCategory(text) };
    });

    let filtered = parsed;
    if (filterTab !== "all") filtered = filtered.filter(e => e.tab === filterTab);
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(e => e.text.toLowerCase().includes(query));
    }
    filtered = [...filtered].reverse();

    let lastDay = null;
    const tabs = [
      { key: "all", label: "All" },
      { key: "crew", label: "Crew" },
      { key: "combat", label: "Combat" },
      { key: "ports", label: "Ports" },
      { key: "missions", label: "Missions" },
      { key: "trade", label: "Trade" },
    ];

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <Tooltip text="Return to the harbour.">
          <BackButton dispatch={dispatch} />
        </Tooltip>
        {showTutorial && (
          <TutorialPopup title="Your Captain's Journal" onDismiss={(disableAll) => { markTutorialSeen("journal", disableAll); setShowTutorial(false); }}>
            <p>Everything that has happened on this voyage is recorded here — battles, arrivals, crew events, trades, and discoveries.</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>Use the <strong>tabs</strong> to filter by category: Crew, Combat, Ports, Missions, or Trade.</li>
              <li>Use the <strong>search bar</strong> to find a specific crew member, port, or event by name.</li>
              <li>Entries are <strong>grouped by day</strong> — scroll back to relive the story of your run.</li>
            </ul>
            <p>The journal is the story of your career. The longer you sail, the richer it becomes.</p>
          </TutorialPopup>
        )}

        <SectionTitle><IconJournal size={16} color={T.gold} />  CAPTAIN'S JOURNAL</SectionTitle>
        <p style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic", marginBottom: 8 }}>
          Every storm, every battle, every whispered secret—recorded here for posterity.
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {tabs.map(tab => (
            <Btn key={tab.key} sm v={filterTab === tab.key ? "gold" : "ghost"} onClick={() => setFilterTab(tab.key)}>{tab.label}</Btn>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <input type="text" placeholder=" Search journal..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", background: T.panel, border: `1px solid ${T.border}`, color: T.text, borderRadius: 3, fontSize: T.metadataFontSize, fontFamily: T.font, outline: "none" }}
          />
          {search && <div style={{ color: T.textFaint, fontSize: 9, marginTop: 4, textAlign: "right" }}>{filtered.length} entr{filtered.length === 1 ? "y" : "ies"} found</div>}
        </div>
        <Panel style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? <EmptyState message="No entries found." /> : (
              filtered.map((entry, i) => {
                const showDay = entry.day !== null && entry.day !== lastDay;
                lastDay = entry.day;
                return (
                  <React.Fragment key={i}>
                    {showDay && <div style={{ color: T.textFaint, fontSize: 9, borderBottom: `1px solid ${T.borderFaint}`, marginTop: 12, marginBottom: 6, paddingBottom: 2 }}>Day {entry.day}</div>}
                    <div style={{ fontSize: T.narrativeFontSize, color: T.textDim, lineHeight: T.narrativeLineHeight, marginBottom: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
                      {(() => {
                        const categoryKey = L.classifyLogLine(entry.text);
                        const LOG_ICONS = window.UI.LOG_ICONS || {};
                        const IconComponent = categoryKey ? LOG_ICONS[categoryKey] : null;
                        return IconComponent ? <IconComponent size={12} color={T.textDim} style={{ marginRight: 6, flexShrink: 0, verticalAlign: "middle" }} /> : null;
                      })()}
                      <span>{entry.text}</span>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </Panel>
      </div>
    );
  }

  // ── EXPORTS ──────────────────────────────────────────────────────────
  Object.assign(window.S, {
    StatusScreen,
    JournalScreen,
  });
})();