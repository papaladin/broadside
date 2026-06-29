
# Storage Module Specification

**Broadside Save/Load & Tutorial State**
*Last Updated: June 27, 2026*

---

## 1. Overview

| File | Namespace | Contents |
|---|---|---|
| `storage.js` | extends `window.L` | Save/load encoding, tutorial state management, localStorage I/O |

**Core Principles:**

- **Pure I/O helpers**: No game logic, no side effects beyond localStorage.
- **Immutable state**: All functions return new objects or primitives; never mutate inputs.
- **Tutorial state separation**: Tutorial progress is stored separately from game saves.
- **Error resilience**: Graceful fallbacks for localStorage failures (e.g., private browsing, iframe restrictions).
- **No dependencies on Engine/UI**: Only reads `window.D` and `window.L` (for hash utilities).

**Note**: This file **extends `window.L`** (loaded immediately after `logic.js`). All functions are attached to the same `window.L` namespace as `logic.js`.

---

## 2. Save/Load Functions

### hasSave()

- **Purpose**: Checks if a saved game exists in localStorage.
- **Signature**: `() => boolean`
- **Output**: `true` if `localStorage.getItem("piratesSave")` exists and is non-empty, else `false`.
- **Usage**:
  ```javascript
  if (L.hasSave()) { /* Show "Continue" button */ }
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
## 3. Tutorial State Functions

### loadTutorialState()

- **Purpose**: Loads the tutorial progress state from localStorage.
- **Signature**: `() => Object`
- **Storage Key**: `"broadside_tutorial"`
- **Output Shape**:
  ```javascript
  {
    seenScreens: string[],    // e.g., ["port", "map", "crew"]
    disableAll: boolean,      // true if user opted out of all tutorials
    currentStep: number,      // (Legacy, unused in current version)
    stepsCompleted: Object   // (Legacy, unused in current version)
  }
  ```
- **Fallback**: If no state exists, returns `getDefaultTutorialState()`.
- **Usage**:
  ```javascript
  const tutState = L.loadTutorialState();
  if (tutState.seenScreens.includes("port")) { /* Skip port tutorial */ }
  ```

---
### saveTutorialState(tutState)

- **Purpose**: Saves the tutorial progress state to localStorage.
- **Signature**: `(tutState: Object) => void`
- **Input**: Tutorial state object (same shape as `loadTutorialState` output).
- **Side Effect**: Writes to `localStorage.setItem("broadside_tutorial", JSON.stringify(tutState))`.
- **Usage**:
  ```javascript
  L.saveTutorialState({ ...tutState, seenScreens: [...tutState.seenScreens, "port"] });
  ```

---
### getDefaultTutorialState()

- **Purpose**: Returns the initial tutorial state for a new game.
- **Signature**: `() => Object`
- **Output**:
  ```javascript
  {
    seenScreens: [],
    disableAll: false
  }
  ```

---
### shouldShowTutorial(screenName)

- **Purpose**: Checks if a tutorial should be shown for a specific screen.
- **Signature**: `(screenName: string) => boolean`
- **Logic**:
  1. Returns `false` if `state.tutorialMode === "full"` (QM mode handles tutorials internally).
  2. Returns `false` if `state.tutorialMode === "none"` (tutorials disabled).
  3. Returns `false` if `screenName` is in `tutState.seenScreens`.
  4. Returns `true` otherwise.
- **Dependencies**: Reads `state.tutorialMode` and `tutState` from `loadTutorialState()`.
- **Usage**:
  ```javascript
  if (L.shouldShowTutorial("port")) {
    // Show tutorial popup for port screen
  }
  ```

---
### markTutorialSeen(screenName, disableAll = false)

- **Purpose**: Marks a tutorial as seen and optionally disables all future tutorials.
- **Signature**: `(screenName: string, disableAll?: boolean) => void`
- **Logic**:
  1. Loads current `tutState` via `loadTutorialState()`.
  2. Adds `screenName` to `tutState.seenScreens` (if not already present).
  3. Sets `tutState.disableAll = true` if `disableAll` is `true`.
  4. Saves updated state via `saveTutorialState(tutState)`.
- **Usage**:
  ```javascript
  // User clicked "Got it" on port tutorial
  L.markTutorialSeen("port");

  // User clicked "Don't show tutorials again"
  L.markTutorialSeen("port", true);
  ```

---
## 4. Save File Format

### LocalStorage Save (`piratesSave`)

- **Key**: `"piratesSave"`
- **Format**: Raw `JSON.stringify(state)`
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
## 5. Tutorial Mode Integration

Broadside supports **three tutorial modes**, set during new game creation (`state.tutorialMode`):

| Mode | Value | Behavior |
|------|-------|----------|
| **Guided (QM)** | `"full"` | Quartermaster character guides the player; tutorials are handled by `engine_onboarding.js`. `shouldShowTutorial` always returns `false`. |
| **Hints Only** | `"light"` | Per-screen popups appear until dismissed. Uses `shouldShowTutorial`/`markTutorialSeen`. |
| **None** | `"none"` | No tutorials or popups. `shouldShowTutorial` always returns `false`. |

**Note**: The `seenScreens` array in tutorial state **only applies to `"light"` mode**. In `"full"` mode, the Quartermaster (QM) system in `engine_onboarding.js` manages all onboarding.

---
## 6. Dependencies

| Reads | Used For | May NOT Call |
|-------|----------|---------------|
| `window.D` | None (storage.js does not read data constants) | Engine, Generators, UI |
| `window.L` | None (storage.js extends `window.L` but does not call its functions) | Engine, Generators, UI |
| `localStorage` | Save/load game state, tutorial progress | — |

**Load Order Constraint**:
- Must load **after `logic.js`** (to extend `window.L`).
- Must load **before any file that calls `L.hasSave()` or tutorial functions** (e.g., `App.jsx`, `screens_*.jsx`).

---
## 7. Exposed Functions Summary

### From `storage.js` (extends `window.L`)

| Category | Functions | Side Effects |
|----------|-----------|---------------|
| **Save/Load** | `hasSave`, `encodeSave`, `decodeSave`, `checkLocalStorageAvailable` | `localStorage` access (except `encodeSave`, which is pure) |
| **Tutorial** | `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen` | `localStorage` access |

---
## 8. Usage Rules

1. **No Game Logic**: `storage.js` contains **only I/O helpers**. All game rules live in `logic.js` or `engine_*.js`.
2. **Immutable State**: Never mutate the input `state` in any function. Always return new objects.
3. **Error Handling**: Functions that interact with `localStorage` (e.g., `decodeSave`) must handle errors gracefully (e.g., return `{ state: null, error: "..." }`).
4. **Tutorial State Isolation**: Tutorial progress (`broadside_tutorial`) is **separate** from game saves (`piratesSave`). Do not mix them.
5. **Versioning**: Always include a `version` field in saved states for migration compatibility (handled by `E.migrateState` in `engine_core.js`).

---
## 9. Migration Notes

- **Version 1 → 2**:
  - Added `factionAlerts`, `portGossip`, `crew.tags`, `startDate`, `scenarioId`, `ship.equipment`, `equipmentInventory`, and `onboarding` fields.
  - Handled by `E.migrateState` in `engine_core.js`.
- **Tutorial State**: No migration needed. Missing fields default to `getDefaultTutorialState()`.

---
## 10. Example Workflows

### Saving a Game
```javascript
// In engine_core.js (SAVE_GAME action)
case A.SAVE_GAME:
  localStorage.setItem("piratesSave", JSON.stringify(state));
  return state;
```

### Loading a Game
```javascript
// In engine_core.js (LOAD_GAME action)
case A.LOAD_GAME:
  const raw = localStorage.getItem("piratesSave");
  if (!raw) return { ...state, log: [...state.log, "No saved game found."] };
  const parsed = JSON.parse(raw);
  const loaded = E.migrateState(parsed);
  return {
    ...loaded,
    screen: "port",
    portMarket: G.generatePortMarket(loaded.currentPort, loaded),
    missions: G.generateMissions(loaded.currentPort, loaded)
  };
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
