// screens_shipyard.jsx — Shipyard Screen (Option A: Split Dashboard)
window.S = window.S || {};

(() => {
const { useState, useEffect, useMemo } = React;
const { SHIPS, EQUIPMENT, PORTS } = window.D;
const L = window.L;
const A = window.E.A;
const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, EmptyState, TutorialPopup, BackButton,
    IconShield, IconCannon, IconSailboat, IconSparkles, IconChest, IconHammer, IconCog, IconShip
} = window.UI;
const { shouldShowTutorial, markTutorialSeen } = window.L;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SLOT_LABELS = {
    hull:     { label: "Hull",      Icon: IconShield },
    armament: { label: "Armament",  Icon: IconCannon },
    rigging:  { label: "Rigging",   Icon: IconSailboat },
    special:  { label: "Special",   Icon: IconSparkles },
};

const TABS = { EQUIP: "equip", SHIPS: "ships", LOCKER: "locker" };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STAT PREVIEW HELPER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StatDelta({ label, before, after }) {
    const diff = after - before;
    const arrow = diff > 0 ? " ↑" : diff < 0 ? " ↓" : " =";
    const color = diff > 0 ? T.greenBr : diff < 0 ? T.redBr : T.textDim;
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11, marginBottom: 3, gap: T.spacing.md }}>
            <span style={{ color: T.textDim, minWidth: 70, flexShrink: 0 }}>{label}</span>
            <span style={{ color, textAlign: "right", whiteSpace: "nowrap" }}>
                {before} → {after}{arrow}
            </span>
        </div>
    );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ShipyardScreen({ state, dispatch }) {
    // --- Rep / services check ---
    const perk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
    if (perk.servicesBlocked) {
        return (
            <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
                <BackButton dispatch={dispatch} />
                <EmptyState message="⚔ You are at war with this port. No shipyard services available." />
            </div>
        );
    }

    // --- Core data ---
    const repCost = Math.floor(L.shipRepairCost(state) * (perk.repairMult || 1));
    const currentShip = SHIPS[state.ship.type];
    const effectiveStats = L.getShipStats(state);

    // --- UI state ---
    const [activeTab, setActiveTab] = useState(TABS.SHIPS);
    const [slotFilter, setSlotFilter] = useState("all");
    const [selectedEquip, setSelectedEquip] = useState(null);
    const [selectedShip, setSelectedShip] = useState(null);
    const [showTutorial, setShowTutorial] = useState(() => shouldShowTutorial(state,"shipyard"));

    // --- Responsive ---
    const [isNarrow, setIsNarrow] = useState(window.innerWidth < 700);
    useEffect(() => {
        const h = () => setIsNarrow(window.innerWidth < 700);
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, []);

    // --- Accordion (mobile) ---
    const [equippedOpen, setEquippedOpen] = useState(!isNarrow);

    // Clear selection on tab switch
    const switchTab = (tab) => {
        setActiveTab(tab);
        setSelectedEquip(null);
        setSelectedShip(null);
        setSlotFilter("all");
    };

    // --- Locker items ---
    const lockerItems = useMemo(() => (state.equipmentInventory || []).map(key => {
        const item = EQUIPMENT[key];
        if (!item) return null;
        const validation = L.canInstallEquipment(state, key);
        return { key, ...item, validation, canAfford: state.gold >= item.installFee };
    }).filter(Boolean), [state]);

    const hasLocker = lockerItems.length > 0;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  PREVIEW PANEL (equipment or ship)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const previewEquipStats = (equipmentKey) => {
        const newEquip = { ...state.ship.equipment };
        const item = EQUIPMENT[equipmentKey];
        if (!item) return effectiveStats;
        newEquip[item.slot] = [...(newEquip[item.slot] || []), equipmentKey];
        const tempState = { ...state, ship: { ...state.ship, equipment: newEquip } };
        return L.getShipStats(tempState);
    };

    const renderPreviewPanel = () => {
        // --- Equipment preview ---
        if (selectedEquip) {
            const item = EQUIPMENT[selectedEquip];
            if (!item) return null;
            const after = previewEquipStats(selectedEquip);
            const validation = L.canInstallEquipment(state, selectedEquip);
            const isFromLocker = (state.equipmentInventory || []).includes(selectedEquip);
            const totalCost = isFromLocker ? item.installFee : item.cost + item.installFee;
            const canAfford = state.gold >= totalCost;

            return (
                <div style={panelStyle({ borderColor: T.gold, marginBottom: 10 })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10 }}>
                        <span style={{ color: T.gold, fontSize: 12, fontWeight: "bold" }}>
                            {isFromLocker
                                ? React.createElement(React.Fragment, null,
                                    React.createElement(IconChest, { size: 12, color: T.gold }),
                                    " Install from Locker"
                                  )
                                : React.createElement(React.Fragment, null,
                                    React.createElement(IconHammer, { size: 12, color: T.gold }),
                                    " Preview: Buy & Install"
                                  )
                            }
                        </span>
                        <Btn sm v="ghost" onClick={() => setSelectedEquip(null)} style={{ flexShrink: 0 }}>✕</Btn>
                    </div>
                    <div style={{ color: T.text, fontSize: T.heading3FontSize, fontWeight: "bold", marginBottom: 4 }}>{item.name}</div>
                    <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>
                        {item.desc}{item.downsideDesc ? ` ${item.downsideDesc}` : ""}
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <StatDelta label="Hull"    before={effectiveStats.maxHull}      after={after.maxHull} />
                        <StatDelta label="Cannons" before={effectiveStats.cannons}      after={after.cannons} />
                        <StatDelta label="Speed"   before={effectiveStats.speed}        after={after.speed} />
                        <StatDelta label="Crew"    before={effectiveStats.maxCrew}      after={after.maxCrew} />
                        <StatDelta label="Hold"    before={effectiveStats.holdCapacity} after={after.holdCapacity} />
                        <StatDelta label="Max Days" before={effectiveStats.maxDays}     after={after.maxDays} />
                    </div>

                    {!validation.ok ? (
                        <div style={{ color: T.gold, fontSize: 10 }}>🔒 {validation.reason}</div>
                    ) : !canAfford ? (
                        <div style={{ color: T.redBr, fontSize: 10 }}>Need {totalCost - state.gold}g more</div>
                    ) : (
                        <Btn v="gold" onClick={() => {
                            if (isFromLocker) {
                                dispatch({ type: A.INSTALL_EQUIPMENT, equipmentKey: selectedEquip });
                            } else {
                                dispatch({ type: A.BUY_EQUIPMENT, equipmentKey: selectedEquip });
                            }
                            setSelectedEquip(null);
                        }}>
                            {isFromLocker ? `Install (${item.installFee}g)` : `Buy & Install (${totalCost}g)`}
                        </Btn>
                    )}
                </div>
            );
        }

        // --- Ship comparison preview ---
        if (selectedShip && selectedShip !== state.ship.type) {
            const s = SHIPS[selectedShip];
            const cur = currentShip;
            const shipReq = L.meetsRequirement(state, s);
            const canBuy = shipReq.allowed && state.gold >= s.cost;
            const lack = shipReq.allowed && state.gold < s.cost ? s.cost - state.gold : 0;

            return (
                <div style={panelStyle({ borderColor: T.gold, marginBottom: 10 })}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 10 }}>
                        <span style={{ color: T.gold, fontSize: 12, fontWeight: "bold" }}>
                            <IconShip size={12} color={T.gold} /> Compare: {s.name} vs {cur.name}
                        </span>
                        <Btn sm v="ghost" onClick={() => setSelectedShip(null)} style={{ flexShrink: 0 }}>✕</Btn>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <StatDelta label="Hull"     before={cur.maxHull}      after={s.maxHull} />
                        <StatDelta label="Cannons"  before={cur.cannons}      after={s.cannons} />
                        <StatDelta label="Speed"    before={cur.speed}        after={s.speed} />
                        <StatDelta label="Max Crew"  before={cur.maxCrew}     after={s.maxCrew} />
                        <StatDelta label="Hold"     before={cur.holdCapacity} after={s.holdCapacity} />
                        <StatDelta label="Max Days"  before={cur.maxDays}     after={s.maxDays} />
                    </div>

                    <div style={{ color: T.textDim, fontSize: 10, marginBottom: 8 }}>
                        ⚠ Buying a new ship clears all installed equipment. Remove items to your locker first.
                    </div>

                    {!shipReq.allowed ? (
                        <div style={{ color: T.gold, fontSize: 10 }}>🔒 {shipReq.reason}</div>
                    ) : lack > 0 ? (
                        <div style={{ color: T.redBr, fontSize: 10 }}>Need {lack.toLocaleString()}g more</div>
                    ) : (
                        <Btn v="gold" onClick={() => {
                            dispatch({ type: A.BUY_SHIP, shipType: selectedShip });
                            setSelectedShip(null);
                        }}>
                            Purchase ({s.cost.toLocaleString()}g)
                        </Btn>
                    )}
                </div>
            );
        }

        return null;
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  LEFT PANEL — Ship Stats + Equipped
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const renderLeftPanel = () => (
        <div style={{
            ...(isNarrow ? {} : {
                width: 280, minWidth: 280, maxWidth: 280,
                position: "sticky", top: 44, alignSelf: "flex-start",
            }),
            display: "flex", flexDirection: "column", gap: 10,
        }}>
            {/* Current Vessel Stats */}
            <div style={panelStyle()}>
                <SectionTitle>CURRENT VESSEL — {currentShip.name}</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <StatBlock label="Hull" value={`${state.ship.hull}/${effectiveStats.maxHull}`} />
                    <StatBlock label="Cannons" value={effectiveStats.cannons} />
                    <StatBlock label="Speed" value={effectiveStats.speed} />
                    <StatBlock label="Crew" value={`${state.crew.roster.length}/${effectiveStats.maxCrew}`} />
                    <StatBlock label="Hold" value={effectiveStats.holdCapacity} />
                    <StatBlock label="Max Days" value={effectiveStats.maxDays} />
                </div>
            </div>

            {/* Repair */}
            <div style={panelStyle()}>
                <div style={{ color: T.textDim, fontSize: 10, marginBottom: 4 }}>
                    Hull: {state.ship.hull} / {effectiveStats.maxHull}
                </div>
                <Bar value={state.ship.hull} max={effectiveStats.maxHull}
                color={
                    state.ship.hull / effectiveStats.maxHull >= 0.6 ? T.greenBr :
                    state.ship.hull / effectiveStats.maxHull >= 0.3 ? T.gold :
                    T.redBr
                }
                h={8} />
                <div style={{ marginTop: 6 }}>
                    <Btn sm v="gold"
                        onClick={() => dispatch({ type: A.REPAIR })}
                        disabled={state.ship.hull >= effectiveStats.maxHull || state.gold < repCost}>
                        Full Repair ({repCost}g)
                    </Btn>
                </div>
            </div>

            {/* Equipped Items */}
            <div style={panelStyle()}>
                <div
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: isNarrow ? "pointer" : "default" }}
                    onClick={() => isNarrow && setEquippedOpen(v => !v)}
                >
                    <SectionTitle>EQUIPPED</SectionTitle>
                    {isNarrow && <span style={{ color: T.textDim, fontSize: 12 }}>{equippedOpen ? "▾" : "▸"}</span>}
                </div>

                {(isNarrow ? equippedOpen : true) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {Object.entries(SLOT_LABELS).map(([slotKey, slotInfo]) => {
                            const SlotIcon = slotInfo.Icon;
                            const slotMax = currentShip.slots?.[slotKey] || 0;
                            if (slotMax === 0) return null;
                            const installed = state.ship.equipment?.[slotKey] || [];

                            return (
                                <div key={slotKey}>
                                    <div style={{ color: T.gold, fontSize: 10, fontWeight: "bold", marginBottom: 2, display: "flex", alignItems: "center" }}>
                                        <SlotIcon size={12} color={T.gold} style={{ marginRight: 4 }} />
                                        {slotInfo.label} ({installed.length}/{slotMax})
                                    </div>
                                    {installed.length === 0 ? (
                                        <div style={{ color: T.textFaint, fontSize: 9, fontStyle: "italic", paddingLeft: 4 }}>empty</div>
                                    ) : installed.map(key => {
                                        const item = EQUIPMENT[key];
                                        if (!item) return null;
                                        return (
                                            <div key={key} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                background: T.panelAlt, padding: "4px 6px", borderRadius: 3, marginBottom: 2,
                                            }}>
                                                <div>
                                                    <div style={{ color: T.text, fontSize: 10 }}>
                                                        {item.name}
                                                        {!item.removable && <span style={{ color: T.gold, fontSize: 8, marginLeft: 4 }}>(Struct.)</span>}
                                                    </div>
                                                </div>
                                                {item.removable && (
                                                    <Btn sm v="ghost"
                                                        onClick={() => dispatch({ type: A.REMOVE_EQUIPMENT, equipmentKey: key })}
                                                        disabled={state.gold < item.installFee}
                                                        style={{ fontSize: 9, padding: "2px 5px", minHeight: 24 }}>
                                                        −{item.installFee}g
                                                    </Btn>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  RIGHT PANEL — Tabs, Preview, Grid
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const renderEquipmentTab = () => {
        // Slot filter buttons – using icon components
        const filterButtons = [
            { key: "all", label: "All" },
            ...Object.entries(SLOT_LABELS).map(([k, v]) => ({
                key: k,
                label: React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center' } },
                    React.createElement(v.Icon, { size: 10, color: T.textDim, style: { marginRight: 3 } }),
                    v.label
                )
            })),
        ];

        const shopItems = Object.entries(EQUIPMENT).map(([key, item]) => {
            const validation = L.canInstallEquipment(state, key);
            const totalCost = item.cost + item.installFee;
            const canAfford = state.gold >= totalCost;
            return { key, ...item, validation, canAfford, totalCost };
        }).filter(item => slotFilter === "all" || item.slot === slotFilter);

        return (
            <div>
                {/* Slot filters */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
                    {filterButtons.map(f => (
                        <Btn key={f.key} sm
                            v={slotFilter === f.key ? "gold" : "ghost"}
                            onClick={() => { setSlotFilter(f.key); setSelectedEquip(null); }}>
                            {f.label}
                        </Btn>
                    ))}
                </div>

                {/* Equipment grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: T.spacing.sm,
                    maxHeight: isNarrow ? "none" : 420,
                    overflowY: isNarrow ? "visible" : "auto",
                    paddingRight: isNarrow ? 0 : 4,
                }}>
                    {shopItems.map(item => {
                        const isSelected = selectedEquip === item.key;
                        const SlotIcon = SLOT_LABELS[item.slot] ? SLOT_LABELS[item.slot].Icon : null;
                        return (
                            <div key={item.key}
                                onClick={() => setSelectedEquip(isSelected ? null : item.key)}
                                style={{
                                    ...panelStyle({
                                        background: isSelected ? T.panelAlt : T.panel,
                                        borderColor: isSelected ? T.gold : T.border,
                                        cursor: "pointer",
                                        transition: "border-color 0.15s",
                                    }),
                                    opacity: item.validation.ok ? 1 : 0.55,
                                }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ color: T.text, fontSize: 11, fontWeight: "bold" }}>{item.name}</span>
                                    <span style={{ color: T.gold, fontSize: 10 }}>{item.totalCost}g</span>
                                </div>
                                <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4, lineHeight: 1.4 }}>
                                    {item.desc}{item.downsideDesc ? ` ${item.downsideDesc}` : ""}
                                </div>
                                <div style={{ color: T.textFaint, fontSize: 8, display: 'flex', alignItems: 'center' }}>
                                    {SlotIcon && (
                                        <SlotIcon size={8} color={T.textFaint} style={{ marginRight: 2 }} />
                                    )}
                                    {SLOT_LABELS[item.slot]?.label || item.slot}
                                    {item.requiredFame > 0 || item.requiredHull > 0 ? (
                                        <span> · Fame {item.requiredFame} · Hull {item.requiredHull}+</span>
                                    ) : null}
                                </div>
                                {!item.validation.ok && (
                                    <div style={{ color: T.gold, fontSize: 9, marginTop: 4 }}>🔒 {item.validation.reason}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderShipsTab = () => {
        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                gap: T.spacing.sm,
                maxHeight: isNarrow ? "none" : 500,
                overflowY: isNarrow ? "visible" : "auto",
                paddingRight: isNarrow ? 0 : 4,
            }}>
                {Object.entries(SHIPS).map(([key, s]) => {
                    const isCur = key === state.ship.type;
                    const shipReq = L.meetsRequirement(state, s);
                    const isSelected = selectedShip === key;

                    return (
                        <div key={key}
                            onClick={() => {
                                if (!isCur) setSelectedShip(isSelected ? null : key);
                            }}
                            style={{
                                ...panelStyle({
                                    background: isCur ? T.greenBg : (isSelected ? T.panelAlt : T.panel),
                                    borderColor: isCur ? T.greenBr : (isSelected ? T.gold : T.border),
                                    cursor: isCur ? "default" : "pointer",
                                    transition: "border-color 0.15s",
                                }),
                                opacity: shipReq.allowed ? 1 : 0.55,
                            }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ color: T.text, fontSize: 12, fontWeight: "bold" }}>{s.name}</span>
                                {isCur
                                    ? <Pill label="Current" color={T.greenBr} />
                                    : <span style={{ color: T.gold, fontSize: 10 }}>{s.cost.toLocaleString()}g</span>
                                }
                            </div>
                            <p style={{ color: T.textDim, fontSize: 9, margin: "0 0 6px", lineHeight: 1.4 }}>{s.desc}</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                                {[["Crew", s.maxCrew], ["Guns", s.cannons], ["Spd", s.speed], ["Hull", s.maxHull]].map(([l, v]) =>
                                    <StatBlock key={l} label={l} value={v} />
                                )}
                            </div>
                            {!shipReq.allowed && (
                                <div style={{ color: T.gold, fontSize: 9, marginTop: 4 }}>🔒 {shipReq.reason}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderLockerTab = () => {
        if (lockerItems.length === 0) {
            return <EmptyState message="Your equipment locker is empty." />;
        }

        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                gap: T.spacing.sm,
                maxHeight: isNarrow ? "none" : 420,
                overflowY: isNarrow ? "visible" : "auto",
                paddingRight: isNarrow ? 0 : 4,
            }}>
                {lockerItems.map(item => {
                    const isSelected = selectedEquip === item.key;
                    const SlotIcon = SLOT_LABELS[item.slot] ? SLOT_LABELS[item.slot].Icon : null;
                    return (
                        <div key={item.key}
                            onClick={() => setSelectedEquip(isSelected ? null : item.key)}
                            style={{
                                ...panelStyle({
                                    background: isSelected ? T.panelAlt : T.panel,
                                    borderColor: isSelected ? T.gold : T.border,
                                    cursor: "pointer",
                                    transition: "border-color 0.15s",
                                }),
                                opacity: item.validation.ok ? 1 : 0.55,
                            }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ color: T.text, fontSize: 11, fontWeight: "bold" }}>{item.name}</span>
                                <span style={{ color: T.textDim, fontSize: 9 }}>Install: {item.installFee}g</span>
                            </div>
                            <div style={{ color: T.textDim, fontSize: 9, marginBottom: 4, lineHeight: 1.4 }}>
                                {item.desc}{item.downsideDesc ? ` ${item.downsideDesc}` : ""}
                            </div>
                            <div style={{ color: T.textFaint, fontSize: 8, display: 'flex', alignItems: 'center' }}>
                                {SlotIcon && (
                                    <SlotIcon size={8} color={T.textFaint} style={{ marginRight: 2 }} />
                                )}
                                {SLOT_LABELS[item.slot]?.label || item.slot}
                            </div>
                            {!item.validation.ok && (
                                <div style={{ color: T.gold, fontSize: 9, marginTop: 4 }}>🔒 {item.validation.reason}</div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderRightPanel = () => (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Btn sm v={activeTab === TABS.EQUIP ? "gold" : "ghost"}
                    onClick={() => switchTab(TABS.EQUIP)}><IconCog size={12} color={activeTab === TABS.EQUIP ? T.gold : T.textDim} /> Equipment</Btn>
                <Btn sm v={activeTab === TABS.SHIPS ? "gold" : "ghost"}
                    onClick={() => switchTab(TABS.SHIPS)}><IconShip size={12} color={activeTab === TABS.SHIPS ? T.gold : T.textDim} /> Ships</Btn>
                {hasLocker && (
                    <Btn sm v={activeTab === TABS.LOCKER ? "gold" : "ghost"}
                        onClick={() => switchTab(TABS.LOCKER)}><IconChest size={12} color={activeTab === TABS.LOCKER ? T.gold : T.textDim} /> Locker ({lockerItems.length})</Btn>
                )}
            </div>

            {/* Stat preview panel */}
            {renderPreviewPanel()}

            {/* Tab content */}
            {activeTab === TABS.EQUIP && renderEquipmentTab()}
            {activeTab === TABS.SHIPS && renderShipsTab()}
            {activeTab === TABS.LOCKER && renderLockerTab()}
        </div>
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  ROOT RENDER
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    return (
        <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", flex: 1 }}>
            <BackButton dispatch={dispatch} />

            {/* Tutorial */}
            {showTutorial && (
                <TutorialPopup
                    title="The Shipyard"
                    onDismiss={(disableAll) => {
                        markTutorialSeen("shipyard", disableAll);
                        setShowTutorial(false);
                    }}
                >
                    <p>This is where you upgrade your ship — or buy a new one entirely.</p>
                    <ul style={{ paddingLeft: 16, margin: "8px 0" }}>
                        <li><strong>Left panel</strong> shows your current ship stats and equipped items</li>
                        <li>Use the <strong>tabs</strong> to browse Equipment, Ships, or your Locker</li>
                        <li><strong>Click any item</strong> to see a stat preview before buying</li>
                        <li>Ships are locked behind <strong>fame requirements</strong></li>
                        <li>Buying a new ship <strong>clears all equipment</strong> — remove items first</li>
                    </ul>
                    <p>A bigger ship means more crew, more cargo, more firepower — but also higher wages.</p>
                </TutorialPopup>
            )}

            {/* Main layout */}
            <div style={{
                display: "flex",
                flexDirection: isNarrow ? "column" : "row",
                gap: T.spacing.md,
                alignItems: "stretch",
            }}>
                {renderLeftPanel()}
                {renderRightPanel()}
            </div>
        </div>
    );
}

Object.assign(window.S, { ShipyardScreen });
})();