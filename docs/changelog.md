### 2026‑07‑01
- **Gameplay balance**: Combat missions can no longer be chained in the same port without sailing. Starvation and thirst finally kill crew after prolonged neglect — water runs out faster than food.
- **Economy scaling**: port market stock and trade/smuggle mission quantities now grow with your fame, making large‑ship trading viable. Repair costs scale with ship size — fixing a Ship of the Line is a real investment.
- **Ship identity**: name your vessel when you buy it. The name appears in the Shipyard and during battle.
- **Crew & exploration**: pirate crew names now mix nationalities for diversity. Hidden port discovery now shows a popup on any screen, so you'll never miss a new harbour.
- **Mission clarity & UI polish**: mission cards now show harmed faction, and patrol instructions. Surrender consequences are logged in detail. Numerous small fixes (map zoom, market layout, crew over‑capacity, equipment hull unlocking, tutorial‑abandon softlock). 

### 2026‑06‑29
- **Grapple rebalance**: boarding always costs crew, scaled by crew ratio. No more bloodless victories.
- **Small UI improvements** and documentation updates.

### 2026‑06‑25
- **Crew biographies** no longer refresh every time you open the crew screen: they stay stable during a port visit.

### 2026‑06‑24
- **Port illustrations**: each faction's ports now have a unique silhouette on the port screen.
- **Minor bugfix**: hold capacity now updates correctly when you buy a new ship.

### 2026‑06‑23
- **Career tracking and Status screen revamp**: lifetime stats (battles, gold, crew, etc.) now displayed in a dedicated career panel.
- **Ship sprites** shown in Shipyard and during combat, with equipment visually reflected (extra sails, copper plating, etc.).
- **Market flavour**: atmosphere lines about your gold, hold fullness, and extreme prices.

### 2026‑06‑22
- **Onboarding refactoring**: Quartermaster tutorial moved to its own engine, more robust.
- **Screen split**: combat and event screens separated into their own files.

### 2026‑06‑21
- **Icon overhaul**: emojis replaced with a full set of SVG icons for all goods, stats, and actions.

### 2026‑06‑19
- **HUD juice**: gold, morale, crew, and hull now flash green or red when they change.

### 2026‑06‑18
- **New Game screen**: choose between Guided (Quartermaster), Hints, or No Tutorial.
- **Onboarding refinements**: Quartermaster guides you through first contract, market, voyage, combat, and shipyard.
- **Port features gated** during tutorial to avoid overwhelming new players.

### 2026‑06‑15
- **Starter delivery mission**: each faction has a unique opening quest to deliver goods to a nearby port.
- **Captain name generator** on New Game screen, with faction‑appropriate name pools.
- **Crew dismiss**, **combat log templates**, and **market flavour text** added.

### 2026‑06‑14
- **Combat log**: battles now use narrative templates for each action, reading like a story.
- **HUD responsiveness**: stat bar collapses into two rows on narrow screens.

### 2026‑06‑12
- **Sailing screen** fixed for narrow phone displays.
- **Test tools** created for economy balance, crew lifecycle, and equipment combos.

### 2026‑06‑11
- **Ship prices rebalanced**: larger ships significantly more expensive.
- **Button tooltips** added across port and map screens.
- **Map zoom and pan** controls added (mouse wheel and pinch).
- **Panel styling** standardised across all screens.

### 2026‑06‑10
- **Real‑world SVG map** of the Caribbean replaces the old abstract map.
- **Gridlines and background gradient** added for a nautical feel.

### 2026‑06‑09
- **Mid‑voyage course change**: reroute to a different port while at sea.
- **UI revamp**: warm gold/brown colour scheme.

### 2026‑06‑08
- **Equipment system**: 17 items across hull, armament, rigging, and special slots. Buy, install, remove, and store in your locker. Replaces the old upgrades.
- **Documentation refresh** for all specs and architecture.

### 2026‑06‑05
- **Captain's Journal** screen with category filtering, search, and day grouping.
- **Save/load/export/import**: file export, hash integrity checks, and migration support.
- **Tutorial overlay system**: per‑screen dismissible hints.

### 2026‑06‑04
- **Crew bios and traits**: hidden traits (drunkard, coward, greedy) revealed over time; scars from storms and battles; long‑term progression (seasoned → veteran → loyal).
- **Reputation and gossip**: dynamic gossip based on your fame, infamy, heat, and market prices.

### 2026‑06‑02
- **Faction heat system**: aggressive actions raise alert level, causing more patrols. Heat decays over time.
- **Random events**: shipwrecks, marooned sailors, storms, mutinies, and more at sea.

### 2026‑06‑01
- **Engine split**: monolithic engine broken into domain modules (port, voyage, combat, onboarding).
- **Wiki and documentation** synced with new architecture.

### 2026‑05‑29
- **Debug panel** (accessible with `?debug=1`).
- **Starting ports** fixed for each faction.

### 2026‑05‑28
- **Plunder screen**: after boarding victory, transfer cargo from enemy hold to your own.
- **Distressed merchant encounters**: choose to help or plunder.
- **Gold rebalance** to better match mission risk and ship prices.

### 2026‑05‑27
- **Intercept screen** rework: pre‑battle options (fight, flee, parley, bribe, surrender) now data‑driven.
- **UI refactoring**: shared components moved to `ui.jsx`.

### 2026‑05‑26
- **Random patrol encounters** while sailing.
- **Autosave** on port entry and mission completion.
- **State migration**: old saves automatically upgraded when game structure changes.
- **Remote and hidden ports**: some ports require a larger ship or special conditions to reach.

### 2026‑05‑25
- **Automated tests** for balance, flows, and logic.

### 2026‑05‑24
- **Trade and smuggling missions** with procedural generation.

### 2026‑05‑23
- **Phone UI** improvements: responsive breakpoints and touch targets.
- **Ship range**: each vessel now has a maximum travel distance, encouraging more hops with smaller ships.

### 2026‑05‑22
- **New game starts**: 5 faction‑based backstories with unique opening flavour.
- **GitHub Pages fix**: game runs correctly on hosted version.
- **AGPLv3 licence** and **Ko‑fi** link added.

### 2026‑05‑21
- **Commerce and resource consumption**: crew eats and drinks daily; you must buy provisions.
- **Cargo display on HUD**.
- **Automated test suite** set up.

### 2026‑05‑20
- **Parametric mission generation**: missions scale with your fame tier.
- **Resource backend** for hold and market.

### 2026‑05‑19
- **Fame, infamy, and reputation perks**: your standing affects repair costs, mission rewards, and service availability.

### 2026‑05‑18
- **Fame and infamy** visible on HUD.
- **Map fixes** and test improvements.

### 2026‑05‑17
- **New ports** and first attempt at a continent outline on the map.

### 2026‑05‑16
- **Named crew**: every sailor has a first name, last name, and faction.
- **Assault missions** fixed; return‑port after defeat now correctly uses previous harbour.

### 2026‑05‑15
- **Encounter screen**: before every battle, a dedicated "intercept" screen with options (fight, flee, parley, etc.).

### 2026‑05‑14
- **Reputation decay** toward neutral (50) over time.
- **Crew drinks**: buy a round to boost morale by 5.
- **Wind** fixed; crew loss during combat corrected.

### 2026‑05‑13
- **First public commit**: core loop (sail, trade, fight, upgrade). Basic navigation, market, combat, and port systems.