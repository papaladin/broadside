// storage.js — Save, Load, Export/Import, and Tutorial State
// Non‑pure functions that read/write localStorage.
// Must be loaded AFTER logic.js (extends window.L).

(() => {
  // Already has access to window.L via closure, but we only
  // need to add properties to window.L.

  // ── simpleHash (used by save encoding) ──────────────────
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  };

  // ── localStorage check ──────────────────────────────────
  const checkLocalStorageAvailable = () => {
    try {
      localStorage.setItem('__test', '1');
      localStorage.removeItem('__test');
      return true;
    } catch (e) {
      return false;
    }
  };

const SAVE_KEY = "BroadsideGameSave";
const OLD_SAVE_KEY = "piratesSave";

const hasSave = () => {
  try {
    return !!(localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY));
  } catch (e) {
    return false;
  }
};

  // ── Export/Import (file save) ───────────────────────────
  const encodeSave = (state) => {
    const data = JSON.stringify(state);
    const payload = JSON.stringify({
      v: 1,
      check: simpleHash(data),
      data: data,
    });
    const bytes = new TextEncoder().encode(payload);
    const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    return btoa(binary);
  };

  const decodeSave = (fileContent) => {
    try {
      const binary = atob(fileContent.trim());
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const decoded = new TextDecoder().decode(bytes);
      const payload = JSON.parse(decoded);
      if (!payload.data) return { state: null, tampered: false, error: "Invalid save format" };
      const state = JSON.parse(payload.data);
      const expectedCheck = simpleHash(payload.data);
      const tampered = payload.check !== expectedCheck;
      return { state, tampered, error: null };
    } catch (e) {
      return { state: null, tampered: false, error: "Could not read save file: " + e.message };
    }
  };

  // ── Tutorial state ──────────────────────────────────────
  const TUTORIAL_KEY = "broadside_tutorial";

  const getDefaultTutorialState = () => ({
    enabled: true,
    seen: {
      port: false, map: false, sailing: false, battle: false,
      market: false, crew: false, shipyard: false, journal: false, status: false, 
    },
  });

  const loadTutorialState = () => {
    try {
      const raw = localStorage.getItem(TUTORIAL_KEY);
      if (!raw) return getDefaultTutorialState();
      return { ...getDefaultTutorialState(), ...JSON.parse(raw) };
    } catch { return getDefaultTutorialState(); }
  };

  const saveTutorialState = (ts) => {
    try { localStorage.setItem(TUTORIAL_KEY, JSON.stringify(ts)); } catch {}
  };

  const shouldShowTutorial = (state, screenName) => {
  // If the player chose no guidance, never show tutorial popups
  if (state.tutorialMode === "none") return false;
  // Full onboarding uses QM, not old‑style popups
  if (state.tutorialMode === "full") return false;
  // Light mode – use the old localStorage‑based system
  const ts = loadTutorialState();
  return ts.enabled && !ts.seen[screenName];
};

  const markTutorialSeen = (screenName, disableAll = false) => {
    const ts = loadTutorialState();
    ts.seen[screenName] = true;
    if (disableAll) ts.enabled = false;
    saveTutorialState(ts);
  };





  // ── Add to window.L ─────────────────────────────────────
  Object.assign(window.L, {

    //save & import-export
    simpleHash,
    checkLocalStorageAvailable,
    hasSave,
    encodeSave,
    decodeSave,

    //tutorial
    loadTutorialState,
    saveTutorialState,
    getDefaultTutorialState,
    shouldShowTutorial,
    markTutorialSeen,

  });
})();