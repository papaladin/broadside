// screens_menu.jsx — Player Menu
window.S = window.S || {};

(() => {
  const { useState, useRef, useEffect } = React;
  const { T, panelStyle, Btn, Tooltip, NarrativePanel,
    IconFloppy, IconContinue, IconPlay, IconFileTransfer, IconSearch, IconJournal, IconTalking
  } = window.UI;
  const A = window.E.A;
  const L = window.L;

  // ── Feedback form as a separate component ────────────────────
const FeedbackPanel = ({ popPanel, state }) => {
  const formRef = useRef(null);
  const [includeSave, setIncludeSave] = useState(false);

  // Detect itch.io embedding
  const isOnItchio = window.self !== window.top || window.location.hostname.includes("itch.zone");

  useEffect(() => {
    if (!isOnItchio && formRef.current) {
      const now = new Date().toISOString();
      formRef.current.elements["date"].value = now;
      formRef.current.elements["os"].value = navigator.platform || "unknown";
      formRef.current.elements["browser"].value = navigator.userAgent;
      formRef.current.elements["url"].value = window.location.href;
      formRef.current.elements["playtime"].value = state.day + " days";
    }
  }, [isOnItchio]);

  useEffect(() => {
    if (!isOnItchio && formRef.current) {
      formRef.current.elements["saveData"].value = includeSave
        ? JSON.stringify(state)
        : "";
    }
  }, [includeSave, isOnItchio]);

  if (isOnItchio) {
    return (
      <div>
        <div style={{ marginBottom: 8 }}>
          <Btn sm v="ghost" onClick={popPanel}>← Back</Btn>
        </div>
        <NarrativePanel variant="neutral">
          <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, marginBottom: 8 }}>
            External feedback forms are not supported inside itch.io. Please use the <strong>comments section</strong> at the bottom of the itch.io game page to share your feedback. Thank you!
          </p>
        </NarrativePanel>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Btn sm v="ghost" onClick={popPanel}>← Back</Btn>
      </div>
      <form ref={formRef} action="https://formsubmit.co/gregory.paladin@me.com" method="POST" target="_blank">
        <input type="hidden" name="date" value="" />
        <input type="hidden" name="os" value="" />
        <input type="hidden" name="browser" value="" />
        <input type="hidden" name="url" value="" />
        <input type="hidden" name="playtime" value="" />
        <input type="hidden" name="saveData" value="" />
        <input type="hidden" name="_subject" value="Broadside Feedback" />
        <input type="hidden" name="_captcha" value="false" />
        <textarea name="message" rows={6} style={{
          width: "100%", background: T.panel, border: `1px solid ${T.border}`,
          color: T.text, padding: 8, fontFamily: T.font, fontSize: T.narrativeFontSize,
          resize: "vertical"
        }} placeholder="Your feedback..." required></textarea>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, color: T.textDim, fontSize: T.captionFontSize }}>
          <input type="checkbox" id="shareSave" checked={includeSave} onChange={e => setIncludeSave(e.target.checked)} />
          <label htmlFor="shareSave">Share my game save for context (optional)</label>
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit" style={{
            background: T.panel, border: `1px solid ${T.gold}`, color: T.gold,
            padding: "4px 8px", borderRadius: 2, cursor: "pointer",
            fontSize: 11, fontFamily: T.font, minHeight: 44, width: "100%"
          }}>Send</button>
        </div>
      </form>
    </div>
  );
};

  // ── Simple markdown‑to‑JSX for changelog ────────────────────
  const renderChangelogContent = (md) => {
    const lines = md.split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^###\s/.test(line)) {
        const heading = line.replace(/^###\s+/, "");
        elements.push(
          <div key={i} style={{ color: T.gold, fontSize: T.heading3FontSize, fontWeight: "bold", marginTop: 12, marginBottom: 4 }}>
            {heading}
          </div>
        );
        i++;
        continue;
      }
      if (line.trim() === "") { i++; continue; }
      const processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      elements.push(
        <div key={i} style={{ color: T.textDim, fontSize: T.captionFontSize, lineHeight: 1.5, marginBottom: 4 }}
          dangerouslySetInnerHTML={{ __html: processed }} />
      );
      i++;
    }
    return elements;
  };

  // ── Main menu modal ─────────────────────────────────────────
  function MenuModal({ state, dispatch, onClose }) {
    const [panel, setPanel] = useState("menu");
    const [changelogContent, setChangelogContent] = useState(null);
    const [isNarrow, setIsNarrow] = useState(window.innerWidth < 500);
    const importRef = useRef(null);

    useEffect(() => {
      const h = () => setIsNarrow(window.innerWidth < 500);
      window.addEventListener("resize", h);
      return () => window.removeEventListener("resize", h);
    }, []);

    useEffect(() => {
      if (panel === "changelog" && !changelogContent) {
        fetch("docs/changelog.md")
          .then(r => r.text())
          .then(md => setChangelogContent(md))
          .catch(() => setChangelogContent("*Changelog not available.*"));
      }
    }, [panel]);

    const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dispatch({ type: A.IMPORT_SAVE, fileContent: reader.result });
        onClose();
      };
      reader.readAsText(file);
      e.target.value = "";
    };

    const pushPanel = (p) => setPanel(p);
    const popPanel = () => setPanel("menu");
    const closeAll = () => { setPanel("menu"); onClose(); };

    // ── Panel renderers ─────────────────────────────────────
    const renderMenu = () => (
      <>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          <Btn v="gold" style={{ width: "100%" }} onClick={closeAll}>
            <IconContinue size={12} color={T.gold} /> Resume
          </Btn>

          <Tooltip text="Record your progress against the perils of the sea.">
            <Btn style={{ width: "100%" }} onClick={() => { dispatch({ type: A.SAVE_GAME }); closeAll(); }}>
              <IconFloppy size={12} color={T.text} /> Save Game
            </Btn>
          </Tooltip>

          {L.hasSave() && (
            <Tooltip text="Return to a previous record of your journey.">
              <Btn style={{ width: "100%" }} onClick={() => { dispatch({ type: A.LOAD_GAME }); closeAll(); }}>
                <IconFloppy size={12} color={T.text} /> Load Game
              </Btn>
            </Tooltip>
          )}

          <Tooltip text="You will lose any unsaved progress.">
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => pushPanel("newGame")}>
              <IconPlay size={12} color={T.gold} /> Start New Game
            </Btn>
          </Tooltip>

          <Tooltip text="Save your adventure to a file for safekeeping.">
            <Btn style={{ width: "100%" }} onClick={() => { dispatch({ type: A.EXPORT_SAVE }); closeAll(); }}>
              <IconFileTransfer size={12} color={T.text} /> Export Save
            </Btn>
          </Tooltip>

          <Tooltip text="Load an adventure from a file.">
            <Btn style={{ width: "100%" }} onClick={() => importRef.current?.click()}>
              <IconFileTransfer size={12} color={T.text} /> Import Save
            </Btn>
          </Tooltip>
          <input type="file" accept=".broadside" ref={importRef} style={{ display: "none" }} onChange={handleImport} />
        </div>

        {/* Auto‑save toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, color: T.textDim, fontSize: T.captionFontSize }}>
          <input type="checkbox" checked={state.autoSave !== false}
            onChange={() => dispatch({ type: A.TOGGLE_AUTO_SAVE })} />
          Auto‑save on port entry
        </div>

        <div style={{ borderTop: `1px solid ${T.borderFaint}`, paddingTop: 16 }}>
          <div style={{ color: T.textDim, fontSize: T.captionFontSize, marginBottom: 8 }}>Reference & Community</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => window.open("handbook.html", "_blank")}>
              <IconSearch size={12} color={T.gold} /> Captain's Handbook
            </Btn>
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => pushPanel("changelog")}>
              <IconJournal size={12} color={T.gold} /> Changelog
            </Btn>
            <Btn v="ghost" style={{ width: "100%" }} onClick={() => pushPanel("feedback")}>
              <IconTalking size={12} color={T.gold} /> Send Feedback
            </Btn>

            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 8 }}>
              {/* GitHub */}
              <a href="https://github.com/papaladin/broadside" target="_blank" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <svg width="36" height="36" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#gh_clip)">
                    <path d="M41.4395 69.3848C28.8066 67.8535 19.9062 58.7617 19.9062 46.9902C19.9062 42.2051 21.6289 37.0371 24.5 33.5918C23.2559 30.4336 23.4473 23.7344 24.8828 20.959C28.7109 20.4805 33.8789 22.4902 36.9414 25.2656C40.5781 24.1172 44.4062 23.543 49.0957 23.543C53.7852 23.543 57.6133 24.1172 61.0586 25.1699C64.0254 22.4902 69.2891 20.4805 73.1172 20.959C74.457 23.543 74.6484 30.2422 73.4043 33.4961C76.4668 37.1328 78.0937 42.0137 78.0937 46.9902C78.0937 58.7617 69.1934 67.6621 56.3691 69.2891C59.623 71.3945 61.8242 75.9883 61.8242 81.252L61.8242 91.2051C61.8242 94.0762 64.2168 95.7031 67.0879 94.5547C84.4102 87.9512 98 70.6289 98 49.1914C98 22.1074 75.9883 6.69539e-07 48.9043 4.309e-07C21.8203 1.92261e-07 -1.9479e-07 22.1074 -4.3343e-07 49.1914C-6.20631e-07 70.4375 13.4941 88.0469 31.6777 94.6504C34.2617 95.6074 36.75 93.8848 36.75 91.3008L36.75 83.6445C35.4102 84.2188 33.6875 84.6016 32.1562 84.6016C25.8398 84.6016 22.1074 81.1563 19.4277 74.7441C18.375 72.1602 17.2266 70.6289 15.0254 70.3418C13.877 70.2461 13.4941 69.7676 13.4941 69.1934C13.4941 68.0449 15.4082 67.1836 17.3223 67.1836C20.0977 67.1836 22.4902 68.9063 24.9785 72.4473C26.8926 75.2227 28.9023 76.4668 31.2949 76.4668C33.6875 76.4668 35.2187 75.6055 37.4199 73.4043C39.0469 71.7773 40.291 70.3418 41.4395 69.3848Z" fill={T.textDim}/>
                  </g>
                  <defs>
                    <clipPath id="gh_clip">
                      <rect width="98" height="96" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <span style={{ color: T.textDim, fontSize: 9 }}>GitHub</span>
              </a>

              {/* itch.io */}
              <a href="https://papaladin.itch.io/broadside" target="_blank" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="36" width="36" viewBox="0 0 245.371 220.736">
                  <path d="M31.99 1.365C21.287 7.72.2 31.945 0 38.298v10.516C0 62.144 12.46 73.86 23.773 73.86c13.584 0 24.902-11.258 24.903-24.62 0 13.362 10.93 24.62 24.515 24.62 13.586 0 24.165-11.258 24.165-24.62 0 13.362 11.622 24.62 25.207 24.62h.246c13.586 0 25.208-11.258 25.208-24.62 0 13.362 10.58 24.62 24.164 24.62 13.585 0 24.515-11.258 24.515-24.62 0 13.362 11.32 24.62 24.903 24.62 11.313 0 23.773-11.714 23.773-25.046V38.298c-.2-6.354-21.287-30.58-31.988-36.933C180.118.197 157.056-.005 122.685 0c-34.37.003-81.228.54-90.697 1.365zm65.194 66.217a28.025 28.025 0 0 1-4.78 6.155c-5.128 5.014-12.157 8.122-19.906 8.122a28.482 28.482 0 0 1-19.948-8.126c-1.858-1.82-3.27-3.766-4.563-6.032l-.006.004c-1.292 2.27-3.092 4.215-4.954 6.037a28.5 28.5 0 0 1-19.948 8.12c-.934 0-1.906-.258-2.692-.528-1.092 11.372-1.553 22.24-1.716 30.164l-.002.045c-.02 4.024-.04 7.333-.06 11.93.21 23.86-2.363 77.334 10.52 90.473 19.964 4.655 56.7 6.775 93.555 6.788h.006c36.854-.013 73.59-2.133 93.554-6.788 12.883-13.14 10.31-66.614 10.52-90.474-.022-4.596-.04-7.905-.06-11.93l-.003-.045c-.162-7.926-.623-18.793-1.715-30.165-.786.27-1.757.528-2.692.528a28.5 28.5 0 0 1-19.948-8.12c-1.862-1.822-3.662-3.766-4.955-6.037l-.006-.004c-1.294 2.266-2.705 4.213-4.563 6.032a28.48 28.48 0 0 1-19.947 8.125c-7.748 0-14.778-3.11-19.906-8.123a28.025 28.025 0 0 1-4.78-6.155 27.99 27.99 0 0 1-4.736 6.155 28.49 28.49 0 0 1-19.95 8.124c-.27 0-.54-.012-.81-.02h-.007c-.27.008-.54.02-.813.02a28.49 28.49 0 0 1-19.95-8.123 27.992 27.992 0 0 1-4.736-6.155zm-20.486 26.49l-.002.01h.015c8.113.017 15.32 0 24.25 9.746 7.028-.737 14.372-1.105 21.722-1.094h.006c7.35-.01 14.694.357 21.723 1.094 8.93-9.747 16.137-9.73 24.25-9.746h.014l-.002-.01c3.833 0 19.166 0 29.85 30.007L210 165.244c8.504 30.624-2.723 31.373-16.727 31.4-20.768-.773-32.267-15.855-32.267-30.935-11.496 1.884-24.907 2.826-38.318 2.827h-.006c-13.412 0-26.823-.943-38.318-2.827 0 15.08-11.5 30.162-32.267 30.935-14.004-.027-25.23-.775-16.726-31.4L46.85 124.08C57.534 94.073 72.867 94.073 76.7 94.073zm45.985 23.582v.006c-.02.02-21.863 20.08-25.79 27.215l14.304-.573v12.474c0 .584 5.74.346 11.486.08h.006c5.744.266 11.485.504 11.485-.08v-12.474l14.304.573c-3.928-7.135-25.79-27.215-25.79-27.215v-.006l-.003.002z" fill="#fa5c5c"/>
                </svg>
                <span style={{ color: T.textDim, fontSize: 9 }}>itch.io</span>
              </a>

              {/* Ko‑fi */}
              <a href='https://ko-fi.com/U3J11ZXS37' target='_blank' style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textDecoration: "none" }}>
                <img height='36' style={{ border: '0px', height: '36px' }} src='https://storage.ko-fi.com/cdn/kofi2.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
                <span style={{ color: T.textDim, fontSize: 9 }}>Ko‑fi</span>
              </a>
            </div>
          </div>
        </div>
      </>
    );

    const renderNewGame = () => (
      <div>
        <div style={{ color: T.textDim, fontSize: T.narrativeFontSize, marginBottom: 12 }}>
          Are you sure? Your current browser‑stored save will be lost. If you want to keep it, use the Export Game button.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="red" sm onClick={() => { dispatch({ type: A.NAVIGATE, screen: "newgame" }); closeAll(); }}>Yes, start a new game</Btn>
          <Btn sm onClick={popPanel}>Cancel</Btn>
        </div>
      </div>
    );

    const renderChangelog = () => (
      <div>
        <div style={{ marginBottom: 8 }}>
          <Btn sm v="ghost" onClick={popPanel}>← Back</Btn>
        </div>
        <NarrativePanel variant="neutral">
          {changelogContent
            ? renderChangelogContent(changelogContent)
            : <div style={{ color: T.textDim }}>Loading...</div>}
        </NarrativePanel>
      </div>
    );

    // ── Main render ─────────────────────────────────────────
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }} onClick={panel === "menu" ? closeAll : undefined}>
        <div style={{
          background: T.panel,
          border: `1px solid ${T.gold}`,
          borderRadius: 2,
          padding: T.spacing.lg,
          width: isNarrow ? "100%" : 420,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          position: "relative",
        }} onClick={e => e.stopPropagation()}>
          <div style={{ color: T.gold, fontSize: T.heading2FontSize, fontWeight: "bold", marginBottom: 16 }}>
            {panel === "menu" ? "Menu" :
             panel === "changelog" ? "Changelog" :
             panel === "feedback" ? "Send Feedback" :
             panel === "newGame" ? "Start New Game" : ""}
          </div>
          {panel === "menu" && renderMenu()}
          {panel === "newGame" && renderNewGame()}
          {panel === "changelog" && renderChangelog()}
          {panel === "feedback" && <FeedbackPanel popPanel={popPanel} state={state} />}
        </div>
      </div>
    );
  }

  window.S.MenuModal = MenuModal;
})();