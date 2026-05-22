# N1.1 — Starting Scenarios Redesign
## Design Document & Implementation Specification

---

## Design Decisions

**All personas:**
- Ship: **Dinghy** (holdCapacity 20, maxDays 5, maxCrew 5)
- Hold on start: **8 food + 8 water** = 16 hold units, 64g base value, 4 units free
- Starting fame: **0**
- Starting infamy: **0**
- Default rep at all ports: **50** (Neutral), then adjusted by persona

**Gold equivalency formula:** `gold + holdValue + (crewCount × 15g) = 270g`

| Persona | Crew | Crew val | Gold | Hold val | Total |
|---------|------|----------|------|----------|-------|
| English | 1 | 15g | 191g | 64g | 270g |
| Spanish | 0 | 0 | 206g | 64g | 270g |
| French | 1 | 15g | 191g | 64g | 270g |
| Dutch | 0 | 0 | 206g | 64g | 270g |
| Pirate | 1 | 15g | 191g | 64g | 270g |

*191g and 206g are odd numbers — round to 190g and 205g in data.js.*
*Difference of 1-2g is irrelevant to balance; clean numbers are better.*

**Rep structure:** Each persona gets +10 at all home faction ports, −5 at one rival faction's ports.
Total absolute rep impact: 15 per persona (same for all).

| Persona | Home +10 | Rival −5 |
|---------|----------|----------|
| English | english | pirate |
| Spanish | spanish | english |
| French | french | english |
| Dutch | dutch | spanish |
| Pirate | pirate | spanish |

The rival faction's ports stay at 45 (still Neutral) — no service blocks, no hard punishment.
Home faction ports go to 60 (Friendly) — +10% mission rewards from day one.

---

## The Five Personas

---

### 1 — English: "The Forged Commission"
*"You carry papers you did not earn. The signature at the bottom belongs to a man who died last winter — but no one in Port Royal knows that yet."*

William Calder spent four years as clerk to the harbormaster of Kingston, copying orders, stamping manifests, and watching captains with real commissions sail in and out. When his employer died of fever and left no heir, William made a decision. He forged a letter of commission — clean work, passable ink, a seal he pressed himself. It granted him the rank of Sailing Master and the right to operate under English crown authority. He used the last of his savings to buy a dinghy and hired James Okafor, an indebted deckhand who doesn't ask about paperwork.

The forgery isn't perfect. William knows this. He needs to become the kind of captain who doesn't need the letter before someone in an official office looks closely enough to notice.

- **Start port:** Port Royal
- **Crew:** 1 — James Okafor (English, deckhand. Knows William's papers are thin. Says nothing.)
- **Gold:** 190g
- **Hold:** 8 food, 8 water
- **Rep:** English +10; Pirate −5
- **Opening log:**
  - *"Cleared Port Royal on a borrowed tide. The harbormaster stamped my commission without reading it. He never reads them."*
  - *"Okafor is useful and incurious. I paid his debt to get him. Worth every coin."*
  - *"I need a real reputation before someone calls my bluff. That means work. English work, legal work — at least for now."*
- **Starter mission — "Carry the Dispatch to Kingston":**
  An official packet needs to reach the governor's secretary at Kingston. The harbormaster was very clear it should arrive sealed. It's routine paperwork — or it would be, if you were a real Sailing Master.
  *(Type: escort, target: Kingston, risk: low, gold: 240g, fame: 1, repImpact: english +2)*

---

### 2 — Spanish: "The Governor's Errand"
*"Don Luis gave you the boat and a vague instruction: make yourself useful. He didn't say to whom, or for what, or what happens if you don't."*

Elena Vargas grew up in Havana in the household of Don Luis Montoya, colonial administrator and collector of obligations. When her father's debts became Don Luis's property, he called it settled — in exchange for services rendered. He handed her a dinghy, a letter of introduction to two port officials she has never met, and a sealed crate already in the hold. He did not explain the crate. He did not explain what would happen if she opened it. He smiled when he said goodbye, which was worse than a threat.

Elena has no crew. She prefers it that way. Fewer people know she exists. Fewer people know where she's going.

- **Start port:** Havana
- **Crew:** 0 — sailing alone
- **Gold:** 205g
- **Hold:** 8 food, 8 water, and one sealed crate occupying 4 hold units (item: plot, no market value)
- **Rep:** Spanish +10; English −5
- **Opening log:**
  - *"Don Luis watched the harbour from his window this morning. I did not look back when I cast off."*
  - *"The crate makes no sound. It's heavier than it looks. I've decided not to think about it."*
  - *"First delivery: Santiago de Cuba. After that, I'll know if I have a choice in any of this."*
  - *"Sailing alone is harder than I expected. I'll need crew. Someone who doesn't ask questions."*
- **Starter mission — "The Package for Santiago":**
  Don Luis's crate must reach a contact in Santiago de Cuba. No questions. No inspection. A sealed delivery, prompt and quiet.
  *(Type: smuggle-flavoured escort — mechanically clean delivery with no contraband flag; the mystery is narrative only. Target: Santiago de Cuba, risk: low, gold: 280g, fame: 1, repImpact: spanish +3)*

> **Implementation note:** The sealed crate is a narrative device only — it occupies 4 hold units as a `plot_item` that cannot be sold or jettisoned (just remove it on COMPLETE_MISSION). It does not trigger navy_patrol contraband checks. This flavour does not require any new system.

---

### 3 — French: "The Cartographer's Debt"
*"Your master left you his boat, his charts, and a debt he forgot to mention in the will."*

Luc Fontaine spent three years as assistant to Henri Deschamps, the finest independent cartographer in the French Caribbean. Together they sailed between islands updating thirty-year-old charts, adding new shoals, correcting wrong headings, recording currents that no official map acknowledged. When Deschamps died of fever in Martinique, Luc inherited his dinghy, his instruments, and — he discovered three days later, when the naval officer arrived — six months of charting work under crown contract that Deschamps had been paid for in advance and had not completed.

The officer was polite. He explained that the dinghy would become crown property unless the charts were delivered by the agreed date. Luc prefers the dinghy.

Marie-Ange Desroches, Deschamps's former cook and occasional rigger, agreed to stay on. She is more competent than Luc at most sailing tasks and less diplomatic about saying so.

- **Start port:** Martinique
- **Crew:** 1 — Marie-Ange Desroches (French, deckhand. Has been on this boat longer than Luc. Treats it that way.)
- **Gold:** 190g
- **Hold:** 8 food, 8 water
- **Rep:** French +10; English −5
- **Opening log:**
  - *"Deschamps's charts are better than anything the navy has. That's why they want them finished. That's also why I have leverage, if I'm careful."*
  - *"Desroches says I navigate like I'm reading someone else's handwriting. She is not wrong."*
  - *"The naval officer said 'by the agreed date' twice. The date is in six months. I have time — if I keep moving."*
  - *"There is a note in Deschamps's margin on the passage to Port-de-Paix. Something that doesn't appear on any official chart. I'll look when I'm there."*
- **Starter mission — "Chart the Northern Passage":**
  The French naval office wants updated soundings on the route between Martinique and Port-de-Paix. Sail the passage and return. Deschamps's notes mention something interesting near the northern end that no official chart acknowledges.
  *(Type: patrol, target: Port-de-Paix, risk: low, gold: 220g, fame: 1, repImpact: french +2)*

---

### 4 — Dutch: "The Company's Ledger"
*"The Dutch West India Company gave you the boat, the freedom, and a quota. The freedom, you have learned, is the trap."*

Pieter van Houten was a junior factor on Curaçao — the man who inventoried incoming cargoes, verified weights, and recorded discrepancies. He recorded one discrepancy too many: a shortfall in a senior partner's account that the senior partner had not reported because the senior partner had stolen it. He was, within a week, "promoted" to independent trade contractor. His own vessel. His own routes. A quarterly gold quota owed to the Company. No cargo provided. No questions asked about method. Plenty of implied understanding about consequences.

Pieter has no crew. The Company said this was cheaper. Pieter suspects it means fewer people can testify to what he carries.

- **Start port:** Curaçao
- **Crew:** 0 — alone
- **Gold:** 205g
- **Hold:** 8 food, 8 water
- **Rep:** Dutch +10; Spanish −5
- **Opening log:**
  - *"The Company gave me a list of contacts. Portobelo is on it. I did not expect Portobelo."*
  - *"First quarter quota: 1,200 gold delivered to Company warehouses. Thirty days. I'd better start."*
  - *"The freedom is real enough. It's the accounting that isn't free."*
  - *"I'll need crew. A one-man dinghy in these waters is a statement of either poverty or arrogance. I can't afford either."*
- **Starter mission — "The Consignment for Sint Eustatius":**
  A Dutch merchant factor on Sint Eustatius is waiting for a consignment order Pieter is to collect from Curaçao's company warehouse and deliver. The manifest is signed by someone Pieter recognises from the discrepancy he recorded. He chooses not to think about that.
  *(Type: escort, target: Sint Eustatius, risk: low, gold: 250g, fame: 1, repImpact: dutch +3)*

---

### 5 — Pirate: "The Survivor"
*"The Marguerite is at the bottom of the sea. You and Cacao are the only ones left. You have five days of food, a dinghy, and two years of watching the Caribbean from the wrong side of a cannon."*

Rosa Esperanza came to the Caribbean as a cook on a merchant vessel. When the ship was boarded off Hispaniola, she made a calculation: fight and probably die, or stay quiet and possibly live. She stayed quiet. She was not mistreated. She noticed everything. She spent two years on Captain Félix Bouchard's ship, the Marguerite — learning which colonial ports ran real patrols and which ran theater, which governors accepted bribes and which were genuinely principled, which shipping lanes were profitable and which were traps. Bouchard was brutal but not stupid, and Rosa learned to tell the difference.

When a storm took the Marguerite north of Hispaniola, Rosa and Cacao Santos — a Cuban gunner who had been on the Marguerite since its first voyage — survived on a dinghy for four days. They made Tortuga on the fifth. Everyone else is gone. Rosa has a boat, a friend, two years of knowledge, and no particular loyalty to anyone who isn't standing next to her.

- **Start port:** Tortuga
- **Crew:** 1 — Cacao Santos (pirate, gunner's mate. Has been in worse situations. Doesn't say which ones.)
- **Gold:** 190g
- **Hold:** 8 food, 8 water
- **Rep:** Pirate +10; Spanish −5
- **Opening log:**
  - *"Tortuga smells like rum and bad decisions. I've missed it."*
  - *"Cacao says we should find a crew and a real ship before we do anything else. He's right, as usual."*
  - *"Bouchard knew every useful person in the Caribbean. I know who they are. He kept the introductions to himself. Time to make my own."*
  - *"Two years of watching from the deck. I know the routes. I know the prices. I know the mistakes people make. Now I find out if knowing is enough."*
- **Starter mission — "Find Renard in Nassau":**
  A message from Tortuga's port master needs to reach Captain Renard, last seen in Nassau. Renard is someone Bouchard dealt with — Rosa knows the name but not the face. Delivering the message is a way to introduce herself to the network Bouchard left behind.
  *(Type: patrol/courier, target: Nassau, risk: low, gold: 200g, fame: 1, repImpact: pirate +3)*

---

## Required Data Structure Changes

The current `STARTS` uses a `bonuses: string[]` format that cannot express starting port, crew count, hold contents, opening log, or a starter mission. The START_GAME reducer must be rewritten around a structured format.

### New STARTS entry shape

```js
{
  id: "english_william",
  name: "The Forged Commission",
  faction: "english",
  tagline: "You carry papers you did not earn.",   // one line for StartScreen card
  story: "William Calder...",                       // 2–3 sentences for StartScreen detail
  startPort: "portRoyal",
  ship: "dinghy",
  gold: 190,
  crewCount: 1,           // 0 or 1
  crewFaction: "english",
  hold: {                 // overrides the default hold initialisation
    food: 8, water: 8,
    // all other goods implicitly 0
  },
  repAdjust: {            // delta applied ON TOP of the default 50 at all matching faction ports
    english: +10,
    pirate: -5,
  },
  openingLog: [           // prepended to state.log before the player acts
    "Cleared Port Royal on a borrowed tide...",
    "Okafor asks no questions...",
    "I need a real commission...",
  ],
  starterMission: {       // inserted into state.missions at game start (player chooses to take it)
    type: "escort",
    name: "Carry the Dispatch to Kingston",
    description: "An official packet needs to reach...",
    faction: "english",
    targetPort: "kingston",
    risk: "low",
    gold: 240,
    fame: 1,
    infamyGain: 0,
    repImpact: { english: 2 },
    enemy: null,
    starter: true,        // flag so the UI can display it differently (e.g., "Opening Quest")
  },
}
```

### Required changes to START_GAME reducer (engine.js)

Replace the `start.bonuses.forEach` loop with structured reads:

```js
case A.START_GAME: {
  const start = STARTS.find(s => s.id === action.scenarioId);
  if (!start) return { ...initialState, screen: "start" };

  // 1. Base state
  const newState = {
    ...initialState,
    screen: "port",
    day: 1,
    infamy: 0,
    fame: 0,
    gold: start.gold,
    currentPort: start.startPort,
    portMarket: null,
    log: [...(start.openingLog || [])],
  };

  // 2. Ship and hold
  const shipData = SHIPS[start.ship];
  newState.ship = {
    type: start.ship,
    name: shipData.name,
    hull: shipData.maxHull,
    cannons: shipData.cannons,
    upgrades: [],
  };
  newState.hold = {
    capacity: shipData.holdCapacity,
    items: {
      food: 0, water: 0, rum: 0, sugar: 0, timber: 0, cloth: 0,
      spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0,
      tobacco: 0, silver: 0, slaves: 0,
      ...(start.hold || {}),
    },
  };
  newState.crew = {
    ...newState.crew,
    max: shipData.maxCrew,
    roster: start.crewCount > 0
      ? G.generateRoster(start.crewCount, start.crewFaction || start.faction)
      : [],
    morale: 80,
  };

  // 3. Reputation: start all ports at 50, then apply faction deltas
  const rep = {};
  Object.keys(PORTS).forEach(portKey => { rep[portKey] = 50; });
  Object.entries(start.repAdjust || {}).forEach(([faction, delta]) => {
    Object.keys(PORTS).forEach(portKey => {
      if (PORTS[portKey].faction === faction) {
        rep[portKey] = Math.max(0, Math.min(100, 50 + delta));
      }
    });
  });
  newState.reputation = rep;

  // 4. Market and missions for starting port
  newState.portMarket = G.generatePortMarket(start.startPort);
  const generatedMissions = G.generateMissions(start.startPort, newState);

  // 5. Starter mission: prepend to mission list, flagged as starter
  const missions = start.starterMission
    ? [start.starterMission, ...generatedMissions]
    : generatedMissions;
  newState.missions = missions;

  return newState;
}
```

### StartScreen UI changes

The StartScreen should be updated to:
- Show one card per persona with: name, tagline, faction colour, faction label
- On hover/tap, expand to show the `story` paragraph and opening log preview
- Starter mission previewed with `"Opening Quest: {mission.name}"` label
- Show starting conditions summary: ship name, gold, crew count, faction rep bonus

The "DEBUG" persona (see below) is only rendered when `new URLSearchParams(window.location.search).get('debug') === '1'`.

---

## Testing & Cheating: Recommendation

Two complementary tools. Use them together.

---

### Tool 1 — Debug Persona (for testing starting states)

Add a 6th entry to STARTS:

```js
{
  id: "debug",
  name: "⚙ Developer Mode",
  faction: "english",
  tagline: "Skip the early game. Test what you need to test.",
  story: "Start at fame 100 with 5,000 gold. All ports Friendly. Sloop. Full hold of trade goods.",
  startPort: "portRoyal",
  ship: "sloop",
  gold: 5000,
  crewCount: 20,
  crewFaction: "pirate",  // mixed crew from the pirate faction word list for variety
  hold: { food: 20, water: 20, rum: 10, spices: 5, silk: 3 },
  repAdjust: {
    english: +30, spanish: +15, french: +15, dutch: +15, pirate: +10,
    // All ports become Friendly (65) or above — no At War, no service blocks
  },
  openingLog: [
    "DEBUG MODE: Gold 5000, Fame 100. All ports at minimum Friendly standing.",
    "Use Shift+G / Shift+F / Shift+R in any screen for quick adjustments.",
  ],
  starterMission: null,
  debugStartFame: 100,   // special field read by START_GAME to set fame directly
}
```

In START_GAME, add one special read after building `newState`:
```js
if (start.debugStartFame !== undefined) {
  newState.fame = start.debugStartFame;
}
```

The debug persona is only shown in StartScreen when the URL contains `?debug=1`:
```jsx
const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
const visibleStarts = isDebug ? D.STARTS : D.STARTS.filter(s => s.id !== 'debug');
```

---

### Tool 2 — Live Debug Panel (for testing from any game state)

A debug panel that can be opened at any time during a running game, without resetting. This is the most useful tool — it lets you test mid-game features (high infamy consequences, ship upgrades, post-storm recovery) from any state.

**Activation:** URL parameter `?debug=1` adds a small `[⚙]` button to the HUD. Clicking it opens a floating panel.

**In App.jsx:**
```jsx
const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

// In HUD, after infamy span:
{isDebug && (
  <button onClick={() => setDebugOpen(v => !v)}
    style={{ ... }}>⚙</button>
)}

// Debug panel (renders over game content when open):
{isDebug && debugOpen && (
  <DebugPanel state={state} dispatch={dispatch} />
)}
```

**DebugPanel component (in App.jsx or screens_shared.jsx):**

```jsx
const DebugPanel = ({ state, dispatch }) => {
  const { T } = window.UI;
  const A = window.E.A;
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
          <button key={n}
            onClick={() => dispatch({ type: A.DEBUG_ADD_GOLD, amount: n })}
            style={{ ...btnStyle }}>+{n}</button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Fame</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[50, 100, 200, 350].map(n => (
          <button key={n}
            onClick={() => dispatch({ type: A.DEBUG_SET_FAME, fame: n })}
            style={{ ...btnStyle }}>★{n}</button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Infamy</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[0, 25, 50, 100].map(n => (
          <button key={n}
            onClick={() => dispatch({ type: A.DEBUG_SET_INFAMY, infamy: n })}
            style={{ ...btnStyle }}>☠{n}</button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Ship</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {["dinghy","sloop","brigantine","frigate","galleon"].map(t => (
          <button key={t}
            onClick={() => dispatch({ type: A.DEBUG_SET_SHIP, shipType: t })}
            style={{ ...btnStyle,
              color: state.ship.type === t ? T.gold : T.textDim }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ color: T.textDim, marginBottom: 4 }}>Rep (current port)</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[10, 50, 65, 85].map(n => (
          <button key={n}
            onClick={() => dispatch({ type: A.DEBUG_SET_PORT_REP,
              port: state.currentPort, amount: n })}
            style={{ ...btnStyle }}>{n}</button>
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: A.DEBUG_FILL_HOLD })}
        style={{ ...btnStyle, width: "100%", marginBottom: 4 }}>
        Fill hold (mixed goods)
      </button>

      <button
        onClick={() => dispatch({ type: A.DEBUG_REPAIR })}
        style={{ ...btnStyle, width: "100%" }}>
        Full repair + provisions
      </button>
    </div>
  );
};
```

**New actions in engine.js A constants:**
```js
A.DEBUG_ADD_GOLD     = "DEBUG_ADD_GOLD";
A.DEBUG_SET_FAME     = "DEBUG_SET_FAME";
A.DEBUG_SET_INFAMY   = "DEBUG_SET_INFAMY";
A.DEBUG_SET_SHIP     = "DEBUG_SET_SHIP";
A.DEBUG_SET_PORT_REP = "DEBUG_SET_PORT_REP";
A.DEBUG_FILL_HOLD    = "DEBUG_FILL_HOLD";
A.DEBUG_REPAIR       = "DEBUG_REPAIR";
```

**Reducer cases (simple, no test coverage needed — debug only):**
```js
case A.DEBUG_ADD_GOLD:
  return { ...state, gold: state.gold + action.amount };

case A.DEBUG_SET_FAME:
  return { ...state, fame: action.fame };

case A.DEBUG_SET_INFAMY:
  return { ...state, infamy: action.infamy };

case A.DEBUG_SET_SHIP: {
  const s = D.SHIPS[action.shipType];
  if (!s) return state;
  return { ...state,
    ship: { type: action.shipType, name: s.name,
            hull: s.maxHull, cannons: s.cannons, upgrades: [] },
    hold: { ...state.hold, capacity: s.holdCapacity },
    crew: { ...state.crew, max: s.maxCrew },
  };
}

case A.DEBUG_SET_PORT_REP: {
  return { ...state,
    reputation: { ...state.reputation, [action.port]: action.amount }
  };
}

case A.DEBUG_FILL_HOLD:
  return { ...state, hold: { ...state.hold, items: {
    food: 20, water: 20, rum: 10, sugar: 8, spices: 4,
    silk: 3, cloth: 6, weapons: 5, coffee: 5, cocoa: 4,
    timber: 0, tobacco: 3, silver: 2, slaves: 0,
  }}};

case A.DEBUG_REPAIR: {
  const stats = L.getShipStats(state);
  return { ...state,
    ship: { ...state.ship, hull: stats.maxHull },
    hold: { ...state.hold, items: {
      ...state.hold.items,
      food: Math.ceil(state.crew.roster.length / 10) * 10,
      water: Math.ceil(state.crew.roster.length / 10) * 10,
    }},
  };
}
```

---

### Tool 3 — Console shortcut (optional, one-liner)

If you don't want to open the panel, expose a shortcut in `App.jsx` when debug mode is on:

```js
if (isDebug) {
  window.__b = {
    gold: (n)   => dispatch({ type: E.A.DEBUG_ADD_GOLD, amount: n }),
    fame: (n)   => dispatch({ type: E.A.DEBUG_SET_FAME, fame: n }),
    infamy: (n) => dispatch({ type: E.A.DEBUG_SET_INFAMY, infamy: n }),
    ship: (t)   => dispatch({ type: E.A.DEBUG_SET_SHIP, shipType: t }),
  };
  console.log('%c Broadside debug active. Use window.__b.gold(1000), .fame(100), .ship("frigate") etc.', 'color:#ffd700');
}
```

Usage in browser console:
```js
__b.gold(5000)      // add 5000 gold
__b.fame(100)       // set fame to 100 (unlocks frigates, high-risk missions)
__b.infamy(50)      // test bribe block
__b.ship("galleon") // switch to galleon immediately
```

---

## Summary of What Needs to Change

| File | Change |
|------|--------|
| `data.js` | Replace old STARTS array with 5 new structured personas + 1 debug persona |
| `engine.js` | Rewrite START_GAME to read structured STARTS (not bonus strings); add 6 DEBUG_ actions and their cases |
| `screens_port.jsx` | Update StartScreen to render new persona cards with tagline, story, and opening quest preview |
| `App.jsx` | Add `isDebug` flag from URL params; add `[⚙]` HUD button and `DebugPanel` component when active |

**Not needed:** No changes to logic.js, generators.js, or test files (debug actions intentionally untested — they are dev tooling, not game logic).