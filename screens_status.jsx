// screens_status.jsx — Status & Journal screens
window.S = window.S || {};

(() => {
  const { useState } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS, RESOURCES } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, LogList, Divider, EmptyState, NarrativePanel, NarrativeLine, TutorialPopup, BackButton, Tooltip,
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

    const getCaptainTag = () => {
      const fame = state.fame || 0;
      const infamy = state.infamy || 0;
      if (infamy >= 100) return { text: "Legendary Outlaw of the Caribbean", color: T.redBr };
      if (infamy >= 50)  return { text: "Notorious Across the Caribbean", color: T.redBr };
      if (fame >= 200)   return { text: "A Legend of the Caribbean", color: T.gold };
      if (fame >= 100)   return { text: "A Notorious Captain", color: T.gold };
      if (fame >= 50)    return { text: "A Recognised Captain", color: T.gold };
      if (infamy >= 25)  return { text: "Wanted by the Law", color: T.redBr };
      if (infamy >= 10)  return { text: "A Suspect in Several Ports", color: T.gold };
      return { text: "An Unknown Captain", color: T.textDim };
    };
    const captainTag = getCaptainTag();

    const getHighlights = () => {
      const lines = [];
      lines.push(`You have sailed for ${daysSurvived} day${daysSurvived === 1 ? "" : "s"}.`);

      if (totalBattles > 0) {
        const won = career.battles?.won || 0;
        const lost = career.battles?.lost || 0;
        const fled = career.battles?.fled || 0;
        const parts = [];
        if (won > 0) parts.push(`won ${won}`);
        if (lost > 0) parts.push(`lost ${lost}`);
        if (fled > 0) parts.push(`fled ${fled}`);
        lines.push(`Across ${totalBattles} battle${totalBattles === 1 ? "" : "s"}, you have ${parts.join(", ")}.`);
        const sunk = career.shipsSunk || 0;
        const plundered = career.shipsPlundered || 0;
        if (sunk > 0 || plundered > 0) {
          const detailParts = [];
          if (sunk > 0) detailParts.push(`sunk ${sunk}`);
          if (plundered > 0) detailParts.push(`boarded and plundered ${plundered}`);
          lines.push(`Of those, you ${detailParts.join(" and ")}.`);
        }
      }

      if (totalCrewLost > 0) {
        const inBattle = career.crewLost?.inBattle || 0;
        const inStorm = career.crewLost?.inStorm || 0;
        const deserted = career.crewLost?.deserted || 0;
        const parts = [];
        if (inBattle > 0) parts.push(`${inBattle} to combat`);
        if (inStorm > 0) parts.push(`${inStorm} to the storms`);
        if (deserted > 0) parts.push(`${deserted} who walked away`);
        if (parts.length > 0) {
          lines.push(`You have lost ${totalCrewLost} crew: ${parts.join(", ")}.`);
        }
      }

      if (career.longestCrewTenure && career.longestCrewTenure >= 50) {
        lines.push(`Your longest-serving crew member sailed with you for ${career.longestCrewTenure} days.`);
      }

      if (portsVisitedCount > 0) {
        lines.push(`You have made landfall at ${portsVisitedCount} of ${portsTotal} ports across the Caribbean.`);
      }

      const earned = career.goldEarned || 0;
      const spent = career.goldSpent || 0;
      if (earned > 0 || spent > 0) {
        lines.push(`You have earned ${earned.toLocaleString()}g and spent ${spent.toLocaleString()}g.`);
      }

      if (career.stormsSurvived > 0) {
        lines.push(`You have weathered ${career.stormsSurvived} storm${career.stormsSurvived === 1 ? "" : "s"}.`);
      }

      const ships = (career.shipsOwned || []).length;
      if (ships > 1) {
        lines.push(`You have commanded ${ships} ship${ships === 1 ? "" : "s"} over your career.`);
      }

      if (career.contrabandSeized > 0) {
        lines.push(`You have been caught smuggling contraband ${career.contrabandSeized} time${career.contrabandSeized === 1 ? "" : "s"}.`);
      }

      return lines;
    };
    const highlights = getHighlights();

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

    const getServiceNote = (rep) => {
      if (rep >= 80) return "−20% repair · +20% missions";
      if (rep >= 50) return "−10% repair · +10% missions";
      if (rep >= 30) return "Standard prices";
      if (rep >= 10) return "−25% missions";
      return "No services available";
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
        <div style={panelStyle({ borderColor: T.gold })}>
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
        </div>

        {/* Section 2: Career Highlights */}
        <div style={panelStyle()}>
          <SectionTitle>CAREER</SectionTitle>
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
        </div>

        {/* Section 3: The World's View */}
        <div style={panelStyle()}>
          <SectionTitle><IconHandshake size={14} color={T.gold} /> THE WORLD'S VIEW</SectionTitle>
          <p style={{ color: T.textFaint, fontSize: T.captionFontSize, fontStyle: "italic", marginBottom: 10 }}>How each faction sees you, and how your crew aligns with them.</p>
          <div style={{ display: "grid", gridTemplateColumns: isNarrowStatus ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: T.spacing.md }}>
            {Object.entries(FACTIONS).map(([factionKey, fac]) => {
              const summary = getFactionSummary(factionKey);
              if (!summary) return null;
              const { avgRep, repLabel, heat, heatLabel, crewOfFaction, totalCrew, crewPct } = summary;
              const repColor = avgRep >= 60 ? T.greenBr : avgRep >= 30 ? T.gold : T.redBr;
              return (
                <div key={factionKey} style={panelStyle({ background: T.panelAlt, borderLeft: `3px solid ${fac.color}`, padding: T.spacing.md })}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ color: fac.color, fontSize: T.heading3FontSize, fontWeight: "bold" }}>{fac.label}</div>
                      <div style={{ color: T.textFaint, fontSize: 9, marginTop: 2 }}>
                        {fac.rivalFactions?.length ? `Rivals: ${fac.rivalFactions.map(r => FACTIONS[r]?.label ?? r).join(", ")}` : "No known rivals"}
                      </div>
                    </div>
                    <RepPill rep={avgRep} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>Standing</span>
                      <span style={{ color: repColor, fontSize: T.captionFontSize, fontWeight: "bold" }}>{repLabel} ({avgRep})</span>
                    </div>
                    <Bar value={avgRep} max={100} color={repColor} h={8} />
                    <div style={{ color: T.textFaint, fontSize: 9, marginTop: 3 }}>{getServiceNote(avgRep)}</div>
                  </div>
                  {heat > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: T.textDim, fontSize: T.captionFontSize }}>Heat</span>
                        <span style={{ color: T.redBr, fontSize: T.captionFontSize, fontWeight: "bold" }}>{heatLabel} ({heat}/10)</span>
                      </div>
                      <Bar value={heat} max={10} color={T.redBr} h={6} />
                    </div>
                  )}
                  {totalCrew > 0 && (
                    <div style={{ color: T.textFaint, fontSize: 9, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.borderFaint}` }}>
                      {crewOfFaction === 0 ? `None of your crew are ${fac.label}.` :
                       crewOfFaction === totalCrew ? `Your entire crew is ${fac.label}.` :
                       `${crewOfFaction} of ${totalCrew} crew (${crewPct}%) are ${fac.label}.`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ color: T.textDim, fontSize: T.captionFontSize, lineHeight: 1.6, marginTop: 10 }}>
            Reputation decays slowly toward neutral (50) over time. Complete missions, aid distressed ships, or parley with faction vessels to improve standing. Attacking their ships will anger all ports of that faction. Heat decays naturally as you stay clear of trouble.
          </p>
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
        <div style={{ ...panelStyle(), flex: 1, overflowY: "auto" }}>
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
      </div>
    );
  }

  // ── EXPORTS ──────────────────────────────────────────────────────────
  Object.assign(window.S, {
    StatusScreen,
    JournalScreen,
  });
})();