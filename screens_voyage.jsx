// screens_voyage.jsx — Voyage-zone screens (responsive)
window.S = window.S || {};

(() => {
  const { useState, useRef, useEffect } = React;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT } = window.D;
  const L = window.L;
  const A = window.E.A;
  const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, LogList, EmptyState, TutorialPopup, BackButton, Tooltip,
    IconSailboat, IconPlay, IconAnchor, IconCompass, IconFood, IconWater,
  } = window.UI;
  const { FactionPill, RepPill, ShipSprite } = window.UI;
  const { shouldShowTutorial, markTutorialSeen } = window.L;

  // ── MAP SCREEN ───────────────────────────────────────────────────────
  function MapScreen({ state, dispatch }) {
    const [hov, setHov] = useState(null);
    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state, "map"));
    const W = 760, H = 460;

    // ── Zoom / Pan state ───────────────────────────────────────
    const mapRef = useRef(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
    const lastPinchDist = useRef(0);

    // ── Map size responsive to viewport ────────────────────────
    const [mapSize, setMapSize] = useState({ width: 760, height: 460 });
    useEffect(() => {
      const computeSize = () => {
        const hudHeight = 150;
        const controlsHeight = 60;
        const padding = 40;
        const maxHeight = window.innerHeight - hudHeight - controlsHeight - padding;
        const maxWidth = window.innerWidth - padding * 2;
        const aspect = 760 / 460;
        let w, h;
        if (maxWidth / maxHeight > aspect) {
          h = maxHeight;
          w = h * aspect;
        } else {
          w = maxWidth;
          h = w / aspect;
        }
        setMapSize({ width: Math.floor(w), height: Math.floor(h) });
      };
      computeSize();
      window.addEventListener("resize", computeSize);
      return () => window.removeEventListener("resize", computeSize);
    }, []);

    // At-sea detection
    const atSea = state.route && state.route.totalDays > 0 && state.sailingDaysLeft > 0;
    const seaPos = atSea ? L.getSeaPosition(state.route) : null;
    const remainingEndurance = atSea ? state.route.enduranceBudget - state.route.enduranceSpent : 0;
    const playerPos = atSea ? seaPos : (state.currentPort ? PORTS[state.currentPort] : null);

    const getAtSeaUnreachableReason = (portKey, days) => {
      const port = PORTS[portKey];
      if (!port) return null;
      if (port.hidden && !state.discoveredPorts?.includes(portKey)) return null;
      if (port.minHull) {
        const effectiveHull = L.getShipStats(state).maxHull;
        if (effectiveHull < port.minHull) return `Requires a heavier vessel`;
      }
      if (days > remainingEndurance) return `Out of range (${days} days, only ${remainingEndurance} remaining)`;
      return null;
    };

    // ── Wheel zoom (desktop) ────────────────────────────────────
    const handleWheel = (e) => {
      e.preventDefault();
      const rect = mapRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const direction = e.deltaY > 0 ? -1 : 1;
      const factor = 1.15;
      const newScale = Math.max(1, Math.min(3, transform.scale * (direction > 0 ? factor : 1 / factor)));
      const scaleChange = newScale / transform.scale;
      setTransform(prev => ({
        scale: newScale,
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange,
      }));
    };

    // ── Attach non‑passive wheel listener to prevent page scroll ──
    useEffect(() => {
      const el = mapRef.current;
      if (!el) return;
      const onWheel = (e) => {
        e.preventDefault();
        handleWheel(e);
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }, [transform]);

    // ── Pan (mouse) ─────────────────────────────────────────────
    const handleMouseDown = (e) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      dragStart.current = { x: transform.x, y: transform.y, mouseX: e.clientX, mouseY: e.clientY };
      e.preventDefault();
    };
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setTransform(prev => ({ ...prev, x: dragStart.current.x + dx, y: dragStart.current.y + dy }));
    };
    const handleMouseUp = () => setIsDragging(false);

    // ── Touch pan / pinch ───────────────────────────────────────
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        setIsDragging(true);
        dragStart.current = { x: transform.x, y: transform.y, mouseX: e.touches[0].clientX, mouseY: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        lastPinchDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };
    const handleTouchMove = (e) => {
      if (isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - dragStart.current.mouseX;
        const dy = e.touches[0].clientY - dragStart.current.mouseY;
        setTransform(prev => ({ ...prev, x: dragStart.current.x + dx, y: dragStart.current.y + dy }));
      } else if (e.touches.length === 2 && lastPinchDist.current > 0) {
        const newDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = newDist / lastPinchDist.current;
        const newScale = Math.max(1, Math.min(3, transform.scale * factor));
        const scaleChange = newScale / transform.scale;
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = mapRef.current.getBoundingClientRect();
        const mx = cx - rect.left, my = cy - rect.top;
        setTransform(prev => ({
          scale: newScale,
          x: mx - (mx - prev.x) * scaleChange,
          y: my - (my - prev.y) * scaleChange,
        }));
        lastPinchDist.current = newDist;
      }
    };
    const handleTouchEnd = () => { setIsDragging(false); lastPinchDist.current = 0; };

    return (
      <div style={{
        padding: T.spacing.lg,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        overflow: "hidden",
      }}>
        <BackButton dispatch={dispatch} />
        {showTutorial && (
          <TutorialPopup title="The Caribbean" onDismiss={(disableAll) => { markTutorialSeen("map", disableAll); setShowTutorial(false); }}>
            <p>Click any port to set sail. Hover to see:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>How many days the voyage will take</li>
              <li>Your reputation at that port</li>
            </ul>
            <p>Grey ports are out of range — you'll need a bigger ship. Upgrade at a Shipyard when you can afford it.</p>
          </TutorialPopup>
        )}

        <div
          ref={mapRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            overflow: "hidden",
            width: mapSize.width,
            height: mapSize.height,
            margin: "0 auto",
            position: "relative",
            cursor: isDragging ? "grabbing" : "grab",
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block", background: T.bgDeep }}>
            <defs>
              <radialGradient id="seaGlow" cx="72%" cy="18%" r="50%">
                <stop offset="0%" stopColor="rgba(90,138,170,0.08)" /><stop offset="100%" stopColor="transparent" />
              </radialGradient>
              <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#102030" /><stop offset="100%" stopColor="#0a141e" />
              </linearGradient>
              <pattern id="seaGrid" width="95" height="92" patternUnits="userSpaceOnUse">
                <path d="M 95 0 L 95 92 M 0 92 L 95 92" stroke="rgba(201,170,110,0.07)" strokeWidth="1" fill="none" />
              </pattern>
            </defs>

            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              <rect width={W} height={H} fill="url(#seaGrad)" />
              <rect width={W} height={H} fill="url(#seaGlow)" />
              <rect width={W} height={H} fill="url(#seaGrid)" />
              <image href="map.svg" x="0" y="0" width="760" height="460" />

              {state.activeMission && (() => { const fr = PORTS[state.currentPort]; const to = PORTS[state.activeMission.targetPort]; return fr && to ? <line x1={fr.x} y1={fr.y} x2={to.x} y2={to.y} stroke={T.gold} strokeWidth="1" strokeDasharray="6,4" opacity="0.35" /> : null; })()}

              {/* Ports */}
              {Object.entries(PORTS).filter(([key]) => state.discoveredPorts?.includes(key)).map(([key, p]) => {
                const isHov = hov === key;
                const isMissionTarget = state.activeMission?.targetPort === key;
                const fColor = FACTIONS[p.faction]?.color ?? T.textDim;
                const rep = state.reputation[key] ?? 20;
                let days, reachable;
                if (atSea) {
                  days = L.travelDaysFromPosition(seaPos, key, state);
                  reachable = L.canReachFromPosition(seaPos, key, state, remainingEndurance) && key !== state.route.destinationPort;
                } else {
                  days = L.travelDays(state.currentPort, key, state);
                  reachable = L.canReach(state, key) && key !== state.currentPort;
                }
                return (
                  <g key={key} onClick={() => reachable && dispatch({ type: A.SAIL_TO, port: key })} onMouseEnter={() => setHov(key)} onMouseLeave={() => setHov(null)} style={{ cursor: reachable ? "pointer" : "default" }}>
                    <circle cx={p.x} cy={p.y} r={24} fill="transparent" />
                    {isMissionTarget && (
                      <circle cx={p.x} cy={p.y} r={11} fill="none" stroke={T.gold} strokeWidth="2" opacity="0.9" />
                    )}
                    {isHov && <circle cx={p.x} cy={p.y} r={22} fill={fColor} opacity="0.10" />}
                    <circle cx={p.x} cy={p.y} r={7} fill={reachable ? fColor : T.textFaint} stroke={T.bgDeep} strokeWidth="2" opacity={reachable ? 1 : 0.4} />
                    <g transform={`translate(${p.x}, ${p.y + 18}) scale(${1 / transform.scale})`}>
                      <text x="0" y="0" textAnchor="middle" fontSize="10" fill={isMissionTarget ? T.gold : (isHov ? T.text : T.textDim)} fontFamily={T.font}>
                        {p.name.toUpperCase()}
                      </text>
                    </g>
                    {isHov && (reachable ? (<>
                      <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize="8" fill={T.gold} fontFamily={T.font}>{days} day{days !== 1 ? "s" : ""}</text>
                      <text x={p.x} y={p.y + 38} textAnchor="middle" fontSize="7" fill={rep >= 40 ? T.greenBr : T.redBr} fontFamily={T.font}>{L.reputationLabel(rep)}</text>
                    </>) : (
                      <text x={p.x} y={p.y + 28} textAnchor="middle" fontSize="8" fill={T.redBr} fontFamily={T.font}>
                        {atSea ? getAtSeaUnreachableReason(key, days) : (L.getUnreachableReason(state, key) || `Out of range — ${days} day${days !== 1 ? "s" : ""}`)}
                      </text>
                    ))}
                    {isHov && (() => { const alertLevel = state.factionAlerts?.[p.faction] || 0; if (alertLevel > 0) return (<text x={p.x} y={p.y + 48} textAnchor="middle" fontSize="7" fill={T.redBr} fontFamily={T.font}>⚠ Heat {alertLevel}</text>); return null; })()}
                  </g>
                );
              })}

              {/* Ship marker */}
              {playerPos && (
                <g transform={`translate(${playerPos.x}, ${playerPos.y})`}>
                  <g transform="translate(-14, -14)"><ShipSprite type={state.ship.type} size={28} /></g>
                </g>
              )}
            </g>

            {/* Fixed wind compass */}
            <g transform="translate(724, 36)">
              <circle cx={0} cy={0} r={22} fill={T.bgDeep} stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{d}</text>)}
              <g transform={`rotate(${state.wind.angle})`}><line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" /><polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} /></g>
              <text x={0} y={32} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <Btn sm onClick={() => setTransform(p => ({ ...p, scale: Math.max(1, p.scale / 1.2) }))}>−</Btn>
            <Btn sm onClick={() => setTransform(p => ({ ...p, scale: Math.min(3, p.scale * 1.2) }))}>+</Btn>
          </div>
          {Object.entries(FACTIONS).map(([k, f]) => (
            <div key={k} style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.color }} />
              <span style={{ color: T.textDim, fontSize: T.metadataFontSize }}>{f.label}</span>
            </div>
          ))}
          <span style={{ color: T.textFaint, fontSize: T.captionFontSize, marginLeft: "auto" }}>Click a port to sail there · Hover to see distance & standing</span>
        </div>
      </div>
    );
  }

  // ── SAILING SCREEN (responsive single‑column on narrow) ────────
  function SailingScreen({ state, dispatch }) {
    const from = PORTS[state.currentPort] ?? { x: 380, y: 230 };
    const to = PORTS[state.destination] ?? { x: 380, y: 230 };
    const progress = state.sailingDaysTotal > 0 ? 1 - (state.sailingDaysLeft / state.sailingDaysTotal) : 0;
    const shipX = from.x + (to.x - from.x) * progress;
    const shipY = from.y + (to.y - from.y) * progress;
    const hdgDeg = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
    const arrived = state.sailingDaysLeft <= 0;
    const W = 760, H = 460;
    const consumption = L.getProvisionConsumptionPerDay(state);
    const daysLeft = L.getDaysOfProvisions(state.hold?.items || {}, consumption);
    const loadPct = L.getHoldLoadPct(state.hold?.items, L.getHoldCapacity(state));
    const speedMult = L.getHoldSpeedMultiplier(loadPct);

    const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial(state, "sailing"));

    const reachableFromSea = L.getReachablePortsFromSea(state);
    const canChangeCourse = reachableFromSea.length > 0;

    const [isNarrow, setIsNarrow] = React.useState(window.innerWidth < 640);
    React.useEffect(() => {
      const handle = () => setIsNarrow(window.innerWidth < 640);
      window.addEventListener("resize", handle);
      return () => window.removeEventListener("resize", handle);
    }, []);

    return (
      <div style={{
        padding: T.spacing.lg,
        display: "flex",
        gap: T.spacing.md,
        flex: 1,
        overflowY: "auto",
        flexDirection: isNarrow ? "column" : "row",
        maxWidth: "100%",
        boxSizing: "border-box",
        minHeight: 0,
      }}>
        {showTutorial && (
          <TutorialPopup
            title="At Sea"
            onDismiss={(disableAll) => {
              markTutorialSeen("sailing", disableAll);
              setShowTutorial(false);
            }}
          >
            <p>Click <strong>Advance Day</strong> to sail toward your destination. Each day:</p>
            <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
              <li>Your crew consumes food and water</li>
              <li>Crew wages are deducted</li>
              <li>Random events may happen — storms, encounters, opportunities</li>
            </ul>
            <p>When you arrive, click <strong>Enter Port</strong> to dock.</p>
          </TutorialPopup>
        )}

        <div style={{
          flex: isNarrow ? "0 0 auto" : "2 1 0",
          width: isNarrow ? "100%" : undefined,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${T.border}`,
          borderRadius: 4,
          overflow: "hidden",
          aspectRatio: "760 / 460",
        }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block", background: T.bgDeep }}>
            <defs><pattern id="sailWaves" width="60" height="30" patternUnits="userSpaceOnUse"><path d="M0 15 Q15 8 30 15 Q45 22 60 15" stroke="#091520" strokeWidth="1" fill="none" /><path d="M0 26 Q15 20 30 26 Q45 32 60 26" stroke="#060e18" strokeWidth="0.5" fill="none" /></pattern></defs>
            <rect width={W} height={H} fill="url(#sailWaves)" />
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={T.border} strokeWidth="1.5" strokeDasharray="8,6" />
            <line x1={from.x} y1={from.y} x2={shipX} y2={shipY} stroke={T.blueBr} strokeWidth="1" opacity="0.3" />
            <circle cx={from.x} cy={from.y} r={4} fill={T.textDim} />
            <text x={from.x} y={from.y - 10} textAnchor="middle" fontSize="8" fill={T.textDim} fontFamily={T.font}>{PORTS[state.currentPort]?.name?.toUpperCase()}</text>
            <circle cx={to.x} cy={to.y} r={7} fill="none" stroke={T.gold} strokeWidth="1.5" strokeDasharray="3,2" />
            <circle cx={to.x} cy={to.y} r={3} fill={T.gold} />
            <line x1={to.x} y1={to.y - 5} x2={to.x} y2={to.y - 22} stroke={T.gold} strokeWidth="1.5" />
            <polygon points={`${to.x},${to.y-22} ${to.x+10},${to.y-18} ${to.x},${to.y-14}`} fill={T.gold} opacity="0.85" />
            <text x={to.x} y={to.y + 16} textAnchor="middle" fontSize="8" fill={T.gold} fontFamily={T.font}>{PORTS[state.destination]?.name?.toUpperCase()}</text>
            <g transform={`translate(${shipX},${shipY}) rotate(${hdgDeg})`}>
              <ellipse cx={0} cy={0} rx={20} ry={20} fill={T.gold} opacity="0.06" />
              <g transform="translate(-15, -15)">
                <ShipSprite type={state.ship.type} size={30} />
              </g>
            </g>
            <g transform="translate(724, 40)">
              <circle cx={0} cy={0} r={22} fill={T.bgDeep} stroke={T.border} strokeWidth="1" />
              {[["N",0,-15],["E",15,4],["S",0,18],["W",-15,4]].map(([d,dx,dy]) => <text key={d} x={dx} y={dy} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{d}</text>)}
              <g transform={`rotate(${state.wind.angle})`}><line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" strokeLinecap="round" /><polygon points="0,-14 -3,-9 3,-9" fill={T.blueBr} /></g>
              <text x={0} y={32} textAnchor="middle" fontSize="7" fill={T.textDim} fontFamily={T.font}>{state.wind.speed}KT</text>
            </g>
          </svg>
        </div>

        <div style={{
          flex: isNarrow ? "0 0 auto" : "1 1 240px",
          minWidth: isNarrow ? 0 : 220,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          <div style={{ color: T.gold, fontSize: T.heading3FontSize, textAlign: "center" }}>
            <IconSailboat size={18} color={T.gold} /> En route to <span style={{ color: T.text, fontWeight: "bold" }}>{PORTS[state.destination]?.name}</span>
          </div>
          <div style={{ color: T.textDim, fontSize: T.narrativeFontSize, textAlign: "center" }}>
            {arrived ? "Arrived — ready to dock" : `${state.sailingDaysLeft} day${state.sailingDaysLeft !== 1 ? "s" : ""} remaining`}
          </div>

          <div style={panelStyle()}>
            <div style={{ display: "flex", gap: T.spacing.sm, marginBottom: 8, flexWrap: "wrap" }}>
              <Tooltip text="Order the crew to sail one day further. Provisions will be consumed.">
                <Btn onClick={() => dispatch({ type: A.ADVANCE_DAY })} disabled={arrived}><IconPlay size={12} color={T.text} /> Advance Day</Btn>
              </Tooltip>
              <Tooltip text="Drop anchor and go ashore. Trade, rest, or recruit here.">
                <Btn v="gold" onClick={() => dispatch({ type: A.ENTER_PORT })} disabled={!arrived}><IconAnchor size={12} color={T.gold} /> Enter Port</Btn>
              </Tooltip>
            </div>
            {!arrived && (
              <div style={{ marginTop: 8 }}>
                <Tooltip text="Plot a new heading from your current position, if your ship can reach it.">
                  <Btn onClick={() => dispatch({ type: A.NAVIGATE, screen: "map" })} disabled={!canChangeCourse}>
                    <IconCompass size={12} color={T.text} /> Change Course
                  </Btn>
                </Tooltip>
                {!canChangeCourse && (
                  <div style={{ color: T.textFaint, fontSize: T.captionFontSize, marginTop: 4 }}>
                    No alternate port is reachable from your current position under present conditions.
                  </div>
                )}
              </div>
            )}
            <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginTop: 8 }}>
              Wind {state.wind.speed}kt at {state.wind.angle}°
              {state.activeMission ? ` · Mission: ${state.activeMission.name}` : ""}
              {speedMult > 1 && (
                <span style={{ color: T.gold }}>
                  {' '}— {speedMult >= 1.33 ? "very heavy load" : "heavy load"}
                </span>
              )}
            </div>
          </div>

          <div style={panelStyle()}>
            <SectionTitle>PROVISIONS</SectionTitle>
            <div style={{ fontSize: T.metadataFontSize, color: T.text }}>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: (state.hold?.items?.food || 0) < 3 * consumption.food ? T.red : T.gold }}>
                  <IconFood size={12} color={(state.hold?.items?.food || 0) < 3 * consumption.food ? T.red : T.gold} /> Food: {state.hold?.items?.food ?? 0}
                </span>
                <span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>({daysLeft.food} days)</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: (state.hold?.items?.water || 0) < 3 * consumption.water ? T.red : T.gold }}>
                  <IconWater size={12} color={(state.hold?.items?.water || 0) < 3 * consumption.water ? T.red : T.gold} /> Water: {state.hold?.items?.water ?? 0}
                </span>
                <span style={{ color: T.textDim, fontSize: 9, marginLeft: 8 }}>({daysLeft.water} days)</span>
              </div>
              <div style={{ color: T.textDim, fontSize: 9, marginTop: 4 }}>Crew consumes {consumption.food} food + {consumption.water} water / day</div>
            </div>
          </div>

          <div style={{ ...panelStyle(), flex: isNarrow ? "0 0 auto" : 1, display: "flex", flexDirection: "column", minHeight: isNarrow ? 120 : 0 }}>
            <SectionTitle>CAPTAIN'S LOG</SectionTitle>
            <LogList entries={state.log} maxEntries={15} />
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window.S, { MapScreen, SailingScreen });
})();