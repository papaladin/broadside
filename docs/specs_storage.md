# Storage Module Specification

**Broadside Save/Load & Tutorial State**
*Last Updated: August 27, 2026*

---

## 1. Overview

| File | Namespace | Contents |
|---|---|---|
| `storage.js` | extends `window.L` | Save/load encoding, tutorial state management, localStorage I/O, persistence helpers |

**Core Principles:**

- **Pure I/O helpers**: No game logic, no side effects beyond localStorage.
- **Immutable state**: All functions return new objects or primitives; never mutate inputs.
- **Tutorial state separation**: Tutorial progress is stored separately from game saves.
- **Error resilience**: Graceful fallbacks for localStorage failures (e.g., private browsing, iframe restrictions).
- **No dependencies on Engine/UI**: Only reads `window.D` and `window.L` (for hash utilities).
- **Single ownership**: All browser persistence (game saves, tutorial state, discovery flags) now flows through this module.

**Note**: This file **extends `window.L`** (loaded immediately after logic files). All functions are attached to the same `window.L` namespace.

---

## 2. Save/Load Functions

### hasSave()

- **Purpose**: Checks if a saved game exists in localStorage.
- **Signature**: `() => boolean`
- **Output**: `true` if `localStorage.getItem("BroadsideGameSave")` exists and is non-empty, else `false`.
- **Fallback**: Also checks the legacy key `"piratesSave"` for backward compatibility.
- **Usage**:
  ```javascript
  if (L.hasSave()) { /* Show "Continue" button */ }
  ```

---

### saveToLocalStorage(state)

- **Purpose**: Persists a game state to localStorage.
- **Signature**: `(state: Object) => void`
- **Side Effect**: Writes to `localStorage.setItem("BroadsideGameSave", JSON.stringify(state))`.
- **Error Handling**: Catches exceptions and logs a warning without blocking.
- **Usage**:
  ```javascript
  // Called by engine_core.js autoSave, SAVE_GAME action, and App.jsx beforeunload
  L.saveToLocalStorage(state);
  ```

---

### loadFromLocalStorage()

- **Purpose**: Loads a game state from localStorage.
- **Signature**: `() => Object | null`
- **Output**: Parsed state object, or `null` if no save exists or parsing fails.
- **Fallback**: Migrates from legacy `"piratesSave"` key if present (copies to new key, removes old).
- **Error Handling**: Returns `null` on parse failure or storage access error.
- **Usage**:
  ```javascript
  const state = L.loadFromLocalStorage();
  if (state) { /* Continue game */ }
  ```

---

### clearLocalStorage()

- **Purpose**: Removes the game save from localStorage.
- **Signature**: `() => void`
- **Side Effect**: Removes both `"BroadsideGameSave"` and `"piratesSave"`.
- **Usage**:
  ```javascript
  L.clearLocalStorage(); // e.g., before starting a new game
  ```

---

### encodeSave(state)

- **Purpose**: Encodes the game state for **file export** (not localStorage).
- **Signature**: `(state: Object) => string`
- **Input**: Full game `state` object.
- **Output**: Base64-encoded string with format:
  ```
  [header]:[payload]:[hash]
  ```
  - `header`: Version + metadata (e.g., `"v1"`).
  - `payload`: `JSON.stringify(state)` (compressed if large).
  - `hash`: SHA-1 hash of `header:payload` (for tamper detection).
- **Usage**:
  ```javascript
  const encoded = L.encodeSave(state);
  // Trigger download via <a download="broadside.broadside" href="data:text/plain;base64,ENCODED">
  ```
- **Example Output**:
  ```
  v1:eyJday:1,...:a1b2c3d4e5...
  ```

---

### decodeSave(fileContent)

- **Purpose**: Decodes and validates an exported save file.
- **Signature**: `(fileContent: string) => { state: Object | null, tampered: boolean, error: string | null }`
- **Input**: Base64-encoded string (from `encodeSave` or user upload).
- **Output**:
  - `state`: Parsed and validated state object (or `null` if invalid).
  - `tampered`: `true` if hash verification fails.
  - `error`: Human-readable error message (or `null`).
- **Validation Steps**:
  1. Split input by `:` (must have 3 parts: header, payload, hash).
  2. Verify hash matches `SHA-1(header:payload)`.
  3. Parse `payload` as JSON.
  4. Return `{ state, tampered: false, error: null }` on success.
- **Usage**:
  ```javascript
  const fileInput = event.target.files[0];
  const content = await fileInput.text();
  const { state, tampered, error } = L.decodeSave(content);
  if (error) { /* Show error to user */ }
  if (tampered) { state.log.push("⚠ This save file appears to have been modified."); }
  ```

---

### checkLocalStorageAvailable()

- **Purpose**: Tests if localStorage is usable (e.g., not blocked in private mode or iframes).
- **Signature**: `() => boolean`
- **Logic**:
  1. Attempts to `localStorage.setItem("__test__", "1")`.
  2. Attempts to `localStorage.getItem("__test__")`.
  3. Attempts to `localStorage.removeItem("__test__")`.
  4. Returns `true` if all steps succeed, else `false`.
- **Usage**:
  ```javascript
  if (!L.checkLocalStorageAvailable()) {
    // Fall back to in-memory save or warn user
  }
  ```

---

### simpleHash(str)

- **Purpose**: Generates a simple hash for save integrity checking.
- **Signature**: `(str: string) => number`
- **Output**: Absolute integer hash value (not cryptographically secure).
- **Usage**: Used internally by `encodeSave`/`decodeSave`.

---

## 3. Hidden Port Discovery Persistence

### getSeenDiscoveries()

- **Purpose**: Loads the list of hidden port names that have already been "charted" (seen in popup).
- **Signature**: `() => string[]`
- **Storage Key**: `"BroadsideSeenDiscoveries"`
- **Output**: Array of port names (e.g., `["Roatán", "Dry Tortugas"]`).
- **Fallback**: Returns `[]` if no data or parse fails.
- **Usage**:
  ```javascript
  const seen = L.getSeenDiscoveries();
  ```

---

### setSeenDiscovery(portName)

- **Purpose**: Marks a hidden port name as charted.
- **Signature**: `(portName: string) => void`
- **Side Effect**: Reads current list, appends if not present, writes back to localStorage.
- **Usage**:
  ```javascript
  // Called when player clicks "Chart it" on discovery popup
  L.setSeenDiscovery("Roatán");
  ```

---

## 4. Tutorial State Functions

### getDefaultTutorialState()

- **Purpose**: Returns the initial tutorial state for a new game.
- **Signature**: `() => Object`
- **Output**:
  ```javascript
  {
    enabled: true,
    seen: {
      port: false, map: false, sailing: false, battle: false,
      market: false, crew: false, shipyard: false, journal: false, status: false,
    }
  }
  ```

---

### loadTutorialState()

- **Purpose**: Loads the tutorial progress state from localStorage.
- **Signature**: `() => Object`
- **Storage Key**: `"broadside_tutorial"`
- **Output**: Merges default state with stored state (so new screens default to unseen).
- **Fallback**: If no stored state, returns `getDefaultTutorialState()`.

---

### saveTutorialState(tutState)

- **Purpose**: Saves the tutorial progress state to localStorage.
- **Signature**: `(tutState: Object) => void`
- **Side Effect**: Writes to `localStorage.setItem("broadside_tutorial", JSON.stringify(tutState))`.

---

### shouldShowTutorial(state, screenName)

- **Purpose**: Checks if a tutorial should be shown for a specific screen.
- **Signature**: `(state: Object, screenName: string) => boolean`
- **Logic**:
  1. Returns `false` if `state.tutorialMode === "none"`.
  2. Returns `false` if `state.tutorialMode === "full"` (QM mode handles tutorials).
  3. Returns `false` if `screenName` is already `seen` in the tutorial state.
  4. Returns `true` otherwise.

---

### markTutorialSeen(screenName, disableAll = false)

- **Purpose**: Marks a tutorial as seen and optionally disables all future tutorials.
- **Signature**: `(screenName: string, disableAll?: boolean) => void`
- **Logic**:
  1. Loads current `tutState` via `loadTutorialState()`.
  2. Sets `tutState.seen[screenName] = true`.
  3. Sets `tutState.enabled = false` if `disableAll` is `true`.
  4. Saves updated state via `saveTutorialState(tutState)`.

---

## 5. Tutorial Mode Integration

Broadside supports **three tutorial modes**, set during new game creation (`state.tutorialMode`):

| Mode | Value | Behavior |
|------|-------|----------|
| **Guided (QM)** | `"full"` | Quartermaster character guides the player; tutorials are handled by `engine_onboarding.js`. `shouldShowTutorial` always returns `false`. |
| **Hints Only** | `"light"` | Per-screen popups appear until dismissed. Uses `shouldShowTutorial`/`markTutorialSeen`. |
| **None** | `"none"` | No tutorials or popups. `shouldShowTutorial` always returns `false`. |

**Note**: The `seen` object in tutorial state **only applies to `"light"` mode**. In `"full"` mode, the Quartermaster (QM) system in `engine_onboarding.js` manages all onboarding.

---

## 6. Save File Format

### LocalStorage Save (`BroadsideGameSave`)

- **Key**: `"BroadsideGameSave"`
- **Format**: Raw `JSON.stringify(state)`
- **Legacy Key**: `"piratesSave"` (still checked by `hasSave()` and `loadFromLocalStorage()` for backward compatibility)
- **Example**:
  ```json
  {
    "version": 2,
    "screen": "port",
    "day": 42,
    "gold": 15000,
    "ship": { "type": "sloop", "hull": 85, ... },
    ...
  }
  ```

### Exported Save File

- **Format**: Base64-encoded string with structure:
  ```
  [version]:[payload]:[hash]
  ```
- **Example**:
  ```
  v1:eyJ2ZXJzaW9uIjoyLCJzY3JlZW4iOiJwb3J0IiwiZGF5IjoyNywiZ29sZCI6MTUwMDB9:5d41402abc4b2a76b9719d911017c592
  ```
- **Components**:
  - **Version**: `"v1"` (current version).
  - **Payload**: Base64-encoded `JSON.stringify(state)`.
  - **Hash**: SHA-1 hash of `version:payload` (for integrity checks).

---

## 7. Dependencies

| Reads | Used For | May NOT Call |
|---|---|---|
| `window.D` | None (storage.js does not read data constants) | Engine, Generators, UI |
| `window.L` | None (storage.js extends `window.L` but does not call its functions) | Engine, Generators, UI |
| `localStorage` | Save/load game state, tutorial progress, seen discoveries | — |

**Load Order Constraint**:
- Must load **after `logic.js`** (to extend `window.L`).
- Must load **before any file that calls persistence functions** (e.g., `engine_core.js`, `App.jsx`).

---

## 8. Exposed Functions Summary

### From `storage.js` (extends `window.L`)

| Category | Functions | Side Effects |
|----------|-----------|---------------|
| **Save/Load** | `hasSave`, `saveToLocalStorage`, `loadFromLocalStorage`, `clearLocalStorage`, `encodeSave`, `decodeSave`, `checkLocalStorageAvailable`, `simpleHash` | `localStorage` access (except `encodeSave`, which is pure) |
| **Tutorial** | `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen` | `localStorage` access |
| **Discovery** | `getSeenDiscoveries`, `setSeenDiscovery` | `localStorage` access |

---

## 9. Usage Rules

1. **No Game Logic**: `storage.js` contains **only I/O helpers**. All game rules live in `logic_*.js` or `engine_*.js`.
2. **Immutable State**: Never mutate the input `state` in any function. Always return new objects.
3. **Error Handling**: Functions that interact with `localStorage` (e.g., `decodeSave`) must handle errors gracefully (e.g., return `{ state: null, error: "..." }`).
4. **Tutorial State Isolation**: Tutorial progress (`broadside_tutorial`) is **separate** from game saves (`BroadsideGameSave`). Do not mix them.
5. **Versioning**: Always include a `version` field in saved states for migration compatibility (handled by `E.migrateState` in `engine_core.js`).

---

## 10. Migration Notes

- **Version 1 → 2**:
  - Added `factionAlerts`, `portGossip`, `crew.tags`, `startDate`, `scenarioId`, `ship.equipment`, `equipmentInventory`, `onboarding`, `previewPortMarket`, `career`, etc.
  - Handled by `E.migrateState` in `engine_core.js`.
- **Tutorial State**: No migration needed. Missing fields default to `getDefaultTutorialState()`.
- **Save Key Migration**: Old saves using the legacy `"piratesSave"` key are automatically migrated to `"BroadsideGameSave"` on load.

---

## 11. Example Workflows

### Saving a Game
```javascript
// In engine_core.js (SAVE_GAME action)
case A.SAVE_GAME:
  window.L.saveToLocalStorage(state);
  return { ...state };
```

### Loading a Game
```javascript
// In engine_core.js (LOAD_GAME action)
case A.LOAD_GAME: {
  try {
    const raw = window.L.loadFromLocalStorage();
    if (!raw) return { ...state, log: [...state.log, "No saved game found."] };
    const loaded = window.E.migrateState(raw);
    const currentPort = loaded.currentPort || "portRoyal";
    return {
      ...loaded,
      screen: "port",
      activeEvent: null,
      portMarket: G.generatePortMarket(currentPort),
      missions: G.generateMissions(currentPort, loaded),
    };
  } catch (e) {
    return { ...state, log: [...state.log, "Failed to load save. Corrupted data."] };
  }
}
```

### Exporting a Save File
```javascript
// In a UI handler (e.g., screens_port.jsx)
const encoded = L.encodeSave(state);
const blob = new Blob([encoded], { type: "text/plain" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `broadside-${state.captainName}-day${state.day}.broadside`;
a.click();
URL.revokeObjectURL(url);
```

### Importing a Save File
```javascript
// In a UI handler (e.g., App.jsx)
const file = event.target.files[0];
const reader = new FileReader();
reader.onload = (e) => {
  const { state: loaded, tampered, error } = L.decodeSave(e.target.result);
  if (error) { /* Show error */ }
  if (tampered) loaded.log.push("⚠ This save file appears to have been modified.");
  const migrated = E.migrateState(loaded);
  dispatch({ type: A.IMPORT_SAVE, fileContent: e.target.result });
};
reader.readAsText(file);
```

---

## 12. Storage Key Reference

| Purpose | Key | Format |
|---|---|---|
| Game save (current) | `"BroadsideGameSave"` | `JSON.stringify(state)` |
| Game save (legacy) | `"piratesSave"` | `JSON.stringify(state)` (fallback only) |
| Tutorial state | `"broadside_tutorial"` | `JSON.stringify({ enabled, seen })` |
| Discovery seen list | `"BroadsideSeenDiscoveries"` | `JSON.stringify(string[])` |

---

## 13. Recent Refactors

- **Persistence ownership centralized**: All direct `localStorage` calls removed from `engine_core.js` and `App.jsx`. They now delegate to `L.saveToLocalStorage`, `L.loadFromLocalStorage`, `L.clearLocalStorage`, `L.getSeenDiscoveries`, and `L.setSeenDiscovery`.
- **`loadFromLocalStorage`** handles legacy key migration internally.
- **`saveToLocalStorage`** and `clearLocalStorage` added for completeness.
- **Discovery persistence** moved from `App.jsx` to `storage.js`.