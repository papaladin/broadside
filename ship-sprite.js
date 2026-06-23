// ship-sprite.js
// ─────────────────────────────────────────────────────────────────────────────
// Pure SVG ship silhouette renderer.
//
// Reads ship visual configs from window.D.SHIP_VISUALS and produces clean,
// simplified ship silhouettes for use in BattleScreen, ShipyardScreen, and
// other places where ship identity matters visually.
//
// Depends on: window.D.SHIP_VISUALS (configs), window.D.FACTIONS (flag colors)
// Exposes:    window.ShipSprite.render(shipType, options) → SVGElement
//
// Options:
//   faction    "english" | "spanish" | "french" | "dutch" | "pirate" | null
//   equipment  Array of equipment keys currently installed (war_pennants, etc.)
//   width      Output width in pixels (default 400)
//   height     Output height in pixels (default 300)
//   facing     "left" (default) | "right" — flips the SVG horizontally
//   showFlag   Boolean — overrides default (player ships hide flag, enemies show)
//
// ─────────────────────────────────────────────────────────────────────────────

window.ShipSprite = window.ShipSprite || {};
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ── Palette ────────────────────────────────────────────────
  const COLOR = {
    hull:        "#5a3a1a",
    hullTrim:    "#3a2410",
    hullStripe:  "#2a1a08",
    copper:      "#a8682c",
    sail:        "#f0e4c8",
    sailEdge:    "#a89060",
    mast:        "#5a3010",
    pennant:     "#c41e1e",
    figurehead:  "#c9a84c",
  };

  // ── Helpers ────────────────────────────────────────────────
  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) {
      if (attrs[k] !== null && attrs[k] !== undefined) {
        node.setAttribute(k, attrs[k]);
      }
    }
    return node;
  };

  const path = (d, attrs = {}) => el("path", { d, ...attrs });

  const factionColor = (faction) => {
    // Read directly from FACTIONS data — single source of truth
    if (window.D && window.D.FACTIONS && window.D.FACTIONS[faction]) {
      return window.D.FACTIONS[faction].color;
    }
    return "#800080"; // fallback purple
  };

  // ── Mast height calculation ────────────────────────────────
  // Returns mast top Y relative to hullTopY, based on actual sail config.
  // Adds a small headroom above the topmost sail for the masthead/flag.
  function computeMastTop(mastConfig, hullTopY, L, equipment) {
    const rig = mastConfig.rig;
    const sails = mastConfig.sails || {};
    const forceExtra = equipment.includes("extra_sails");
    const headroom = L * 0.06;

    if (rig === "square") {
      let topLevel = 0.40;  // bare mast: just course
      if (sails.course) topLevel = 0.42;
      if (sails.topsail) topLevel = 0.68;
      if (sails.topgallant || forceExtra) topLevel = 0.92;
      if (sails.royal || forceExtra) topLevel = 1.15;
      return hullTopY - L * topLevel - headroom;
    }

    if (rig === "gaff") {
      let topLevel = 0.62;  // bare mast
      if (sails.main) topLevel = 0.68;
      if (sails.topsail) topLevel = 0.90;
      return hullTopY - L * topLevel - headroom;
    }

    if (rig === "lateen") {
      return hullTopY - L * 0.45 - headroom;
    }

    if (rig === "squareWithLateen") {
      let topLevel = 0.60;
      if (sails.topsail) topLevel = 0.88;
      if (forceExtra) topLevel = 1.00;
      return hullTopY - L * topLevel - headroom;
    }

    return hullTopY - L * 0.70;
  }

  // ── Hull shape functions ───────────────────────────────────
  // All draw the ship facing LEFT (bow at low x, stern at high x).
  // Origin (0, 0) = bow tip at upper-deck level. Hull extends down to hullHeight.

  function drawHull_open(g, config) {
    const L = config.hullLength;
    const H = config.hullHeight;

    const d = [
      `M ${L * 0.05},${-H * 0.1}`,
      `Q ${L * 0.02},${H * 0.4} ${L * 0.15},${H * 0.85}`,
      `L ${L * 0.85},${H * 0.85}`,
      `Q ${L * 0.98},${H * 0.5} ${L * 0.95},${-H * 0.05}`,
      "Z",
    ].join(" ");

    g.appendChild(path(d, { fill: COLOR.hull, stroke: COLOR.hullTrim, "stroke-width": 1.5 }));

    g.appendChild(el("line", {
      x1: L * 0.08, y1: 0, x2: L * 0.95, y2: 0,
      stroke: COLOR.hullStripe, "stroke-width": 1,
    }));

    return g;
  }

  function drawHull_lowSloop(g, config) {
    const L = config.hullLength;
    const H = config.hullHeight;
    const hasQuarter = config.hasQuarterdeck;

    const sternY = hasQuarter ? -H * 0.35 : -H * 0.1;
    const sternX = L * 0.92;

    const d = [
      `M ${L * 0.04},${-H * 0.1}`,
      `Q ${L * 0.01},${H * 0.3} ${L * 0.10},${H * 0.9}`,
      `L ${L * 0.88},${H * 0.9}`,
      `Q ${sternX + L * 0.05},${H * 0.5} ${sternX},${sternY}`,
      hasQuarter ? `L ${L * 0.78},${sternY}` : "",
      hasQuarter ? `L ${L * 0.78},${-H * 0.1}` : "",
      `L ${L * 0.04},${-H * 0.1}`,
      "Z",
    ].filter(s => s.length > 0).join(" ");

    g.appendChild(path(d, { fill: COLOR.hull, stroke: COLOR.hullTrim, "stroke-width": 1.5 }));

    g.appendChild(el("line", {
      x1: L * 0.08, y1: H * 0.35, x2: L * 0.92, y2: H * 0.35,
      stroke: COLOR.hullStripe, "stroke-width": 1.2,
    }));

    if (config.gunDecks > 0) {
      drawGunPorts(g, L * 0.12, H * 0.1, L * 0.75, config.gunPortsLower);
    }

    return g;
  }

  function drawHull_military(g, config) {
    const L = config.hullLength;
    const H = config.hullHeight;
    const hasForecastle = config.hasForecastle;
    const hasQuarter = config.hasQuarterdeck;
    const hasGallery = config.hasSternGallery;

    const bowDeckY = hasForecastle ? -H * 0.3 : -H * 0.1;
    const sternDeckY = hasQuarter ? -H * 0.32 : -H * 0.1;

    const d = [
      `M ${L * 0.06},${-H * 0.1}`,
      `Q ${L * 0.01},${H * 0.35} ${L * 0.10},${H * 0.92}`,
      `L ${L * 0.88},${H * 0.92}`,
      hasGallery
        ? `Q ${L * 0.99},${H * 0.55} ${L * 0.96},${sternDeckY}`
        : `Q ${L * 0.97},${H * 0.4} ${L * 0.94},${sternDeckY}`,
      hasQuarter ? `L ${L * 0.78},${sternDeckY}` : "",
      hasQuarter ? `L ${L * 0.78},${-H * 0.1}` : "",
      hasForecastle ? `L ${L * 0.20},${-H * 0.1}` : "",
      hasForecastle ? `L ${L * 0.20},${bowDeckY}` : "",
      hasForecastle ? `L ${L * 0.06},${bowDeckY}` : "",
      "Z",
    ].filter(s => s.length > 0).join(" ");

    g.appendChild(path(d, { fill: COLOR.hull, stroke: COLOR.hullTrim, "stroke-width": 1.5 }));

    g.appendChild(el("line", {
      x1: L * 0.08, y1: H * 0.15, x2: L * 0.92, y2: H * 0.15,
      stroke: COLOR.hullStripe, "stroke-width": 1.2,
    }));
    g.appendChild(el("line", {
      x1: L * 0.08, y1: H * 0.5, x2: L * 0.92, y2: H * 0.5,
      stroke: COLOR.hullStripe, "stroke-width": 1.2,
    }));

    if (config.gunDecks >= 1) {
      drawGunPorts(g, L * 0.13, H * 0.3, L * 0.72, config.gunPortsLower);
    }
    if (config.gunDecks >= 2) {
      drawGunPorts(g, L * 0.15, H * 0.0, L * 0.68, config.gunPortsUpper);
    }

    if (hasGallery) {
      const windowY = H * 0.2;
      for (let i = 0; i < 3; i++) {
        g.appendChild(el("rect", {
          x: L * 0.91 + i * (L * 0.012),
          y: windowY,
          width: L * 0.01,
          height: H * 0.08,
          fill: "#c9a84c",
          opacity: 0.6,
        }));
      }
    }

    return g;
  }

  function drawHull_galleon(g, config) {
    const L = config.hullLength;
    const H = config.hullHeight;
    const hasForecastle = config.hasForecastle;
    const hasQuarter = config.hasQuarterdeck;
    const hasPoop = config.hasPoopDeck;
    const hasGallery = config.hasSternGallery;

    const bowDeckY = hasForecastle ? -H * 0.42 : -H * 0.15;
    const quarterY = hasQuarter ? -H * 0.42 : -H * 0.1;
    const poopY = hasPoop ? -H * 0.6 : quarterY;

    const d = [
      `M ${L * 0.06},${-H * 0.15}`,
      `Q ${L * 0.01},${H * 0.35} ${L * 0.10},${H * 0.92}`,
      `L ${L * 0.86},${H * 0.92}`,
      hasGallery
        ? `Q ${L * 0.99},${H * 0.55} ${L * 0.97},${quarterY}`
        : `Q ${L * 0.96},${H * 0.4} ${L * 0.94},${quarterY}`,
      hasPoop ? `L ${L * 0.88},${quarterY}` : "",
      hasPoop ? `L ${L * 0.88},${poopY}` : "",
      hasPoop ? `L ${L * 0.82},${poopY}` : "",
      hasPoop ? `L ${L * 0.82},${quarterY}` : "",
      hasQuarter && !hasPoop ? `L ${L * 0.78},${quarterY}` : "",
      hasQuarter ? `L ${L * 0.78},${-H * 0.15}` : "",
      hasForecastle ? `L ${L * 0.22},${-H * 0.15}` : "",
      hasForecastle ? `L ${L * 0.22},${bowDeckY}` : "",
      hasForecastle ? `L ${L * 0.06},${bowDeckY}` : "",
      "Z",
    ].filter(s => s.length > 0).join(" ");

    g.appendChild(path(d, { fill: COLOR.hull, stroke: COLOR.hullTrim, "stroke-width": 1.5 }));

    g.appendChild(el("line", {
      x1: L * 0.08, y1: H * 0.15, x2: L * 0.92, y2: H * 0.15,
      stroke: COLOR.hullStripe, "stroke-width": 1.3,
    }));
    g.appendChild(el("line", {
      x1: L * 0.08, y1: H * 0.45, x2: L * 0.92, y2: H * 0.45,
      stroke: COLOR.hullStripe, "stroke-width": 1.3,
    }));
    g.appendChild(el("line", {
      x1: L * 0.10, y1: H * 0.7, x2: L * 0.90, y2: H * 0.7,
      stroke: COLOR.hullStripe, "stroke-width": 1.0,
    }));

    if (config.gunDecks >= 1) {
      drawGunPorts(g, L * 0.13, H * 0.28, L * 0.7, config.gunPortsLower);
    }
    if (config.gunDecks >= 2) {
      drawGunPorts(g, L * 0.15, H * -0.02, L * 0.65, config.gunPortsUpper);
    }

    if (hasGallery) {
      const windowY = H * 0.05;
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 4; i++) {
          g.appendChild(el("rect", {
            x: L * 0.89 + i * (L * 0.014),
            y: windowY + row * (H * 0.12),
            width: L * 0.012,
            height: H * 0.09,
            fill: "#c9a84c",
            opacity: 0.7,
          }));
        }
      }
    }

    return g;
  }

  // ── Gun port row ───────────────────────────────────────────
  function drawGunPorts(g, startX, y, width, count) {
    if (count <= 0) return;
    const spacing = width / count;
    const portSize = Math.min(spacing * 0.55, 6);
    const offset = (spacing - portSize) / 2;
    for (let i = 0; i < count; i++) {
      g.appendChild(el("rect", {
        x: startX + i * spacing + offset,
        y: y - portSize / 2,
        width: portSize,
        height: portSize,
        fill: COLOR.hullStripe,
      }));
    }
  }

  // ── Mast drawing ───────────────────────────────────────────
  function drawMast(g, x, hullTopY, mastConfig, config, equipment) {
    const L = config.hullLength;
    const mastTop = computeMastTop(mastConfig, hullTopY, L, equipment);
    const mastStroke = Math.max(3.5, L * 0.009);

    // Mast pole — thicker line for visibility
    g.appendChild(el("line", {
      x1: x, y1: hullTopY, x2: x, y2: mastTop,
      stroke: COLOR.mast, "stroke-width": mastStroke,
    }));

    // Force lateen if equipment includes lateen_rig and this is the mizzen
    const isMizzen = mastConfig === config.masts[config.masts.length - 1] && config.masts.length >= 3;
    const forceLateen = equipment.includes("lateen_rig") && isMizzen;
    const rig = forceLateen ? "lateen" : mastConfig.rig;

    if (rig === "square") {
      drawSquareSails(g, x, hullTopY, mastTop, mastConfig.sails, L, equipment);
    } else if (rig === "gaff") {
      drawGaffSails(g, x, hullTopY, mastTop, mastConfig.sails, L);
    } else if (rig === "lateen") {
      drawLateenSail(g, x, hullTopY, mastTop, L);
    } else if (rig === "squareWithLateen") {
      drawSquareWithLateen(g, x, hullTopY, mastTop, mastConfig.sails, L);
    }

    return mastTop;
  }

  // ── Square sails ───────────────────────────────────────────
  function drawSquareSails(g, x, hullTopY, mastTop, sails, L, equipment) {
    const sailWidth = L * 0.28;
    const forceExtra = equipment.includes("extra_sails");

    // Sail level positions (relative to hullTopY, going UP)
    // We size each sail to roughly 23% of L tall
    const levels = [
      { key: "course",     baseY: 0.08, topY: 0.40 },
      { key: "topsail",    baseY: 0.42, topY: 0.66 },
      { key: "topgallant", baseY: 0.68, topY: 0.90 },
      { key: "royal",      baseY: 0.92, topY: 1.13 },
    ];

    levels.forEach(lvl => {
      const present = sails[lvl.key] || (forceExtra && (lvl.key === "topgallant" || lvl.key === "royal"));
      if (!present) return;

      const sailBot = hullTopY - L * lvl.baseY;
      const sailTop = hullTopY - L * lvl.topY;

      // Sails get narrower as they go up
      const widthMult = lvl.key === "course" ? 1.0
                     : lvl.key === "topsail" ? 0.92
                     : lvl.key === "topgallant" ? 0.82
                     : 0.72;
      const w = sailWidth * widthMult;

      // Yard (horizontal spar at top of sail)
      g.appendChild(el("line", {
        x1: x - w / 2 - 4, y1: sailTop, x2: x + w / 2 + 4, y2: sailTop,
        stroke: COLOR.mast, "stroke-width": 1.6,
      }));

      // Sail body with slight belly
      const bellyOffset = (sailBot - sailTop) * 0.06;
      const midY = (sailTop + sailBot) / 2;
      const d = [
        `M ${x - w / 2},${sailTop}`,
        `L ${x + w / 2},${sailTop}`,
        `Q ${x + w / 2 + bellyOffset},${midY} ${x + w / 2},${sailBot}`,
        `L ${x - w / 2},${sailBot}`,
        `Q ${x - w / 2 - bellyOffset},${midY} ${x - w / 2},${sailTop}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));
    });
  }

  // ── Gaff sails ─────────────────────────────────────────────
  function drawGaffSails(g, x, hullTopY, mastTop, sails, L) {
    if (sails.main) {
      // Gaff main: trapezoidal with longer boom than gaff
      const sailBot = hullTopY - L * 0.02;
      const sailTopOnMast = hullTopY - L * 0.50;
      const gaffLen = L * 0.24;
      const boomLen = gaffLen * 1.45;  // boom is 45% longer than gaff
      const gaffPeakX = x + gaffLen;
      const gaffPeakY = sailTopOnMast - L * 0.05;  // gaff angles slightly up

      const d = [
        `M ${x},${sailBot}`,                          // tack (lower fwd corner at mast)
        `L ${x + boomLen},${sailBot}`,                // clew (lower aft corner)
        `L ${gaffPeakX},${gaffPeakY}`,                // peak (upper aft corner)
        `L ${x},${sailTopOnMast}`,                    // throat (upper fwd corner)
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));

      // Boom (bottom spar)
      g.appendChild(el("line", {
        x1: x, y1: sailBot, x2: x + boomLen + 5, y2: sailBot,
        stroke: COLOR.mast, "stroke-width": 1.8,
      }));

      // Gaff (upper spar)
      g.appendChild(el("line", {
        x1: x, y1: sailTopOnMast, x2: gaffPeakX + 5, y2: gaffPeakY,
        stroke: COLOR.mast, "stroke-width": 1.6,
      }));
    }

    if (sails.topsail) {
      // Gaff topsail: triangular sail above the gaff
      const sailBot = hullTopY - L * 0.50;
      const sailTop = hullTopY - L * 0.78;
      const aftReach = L * 0.16;

      const d = [
        `M ${x},${sailBot}`,
        `L ${x + aftReach},${sailBot - L * 0.05}`,
        `L ${x},${sailTop}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));
    }
  }

  // ── Lateen sail ────────────────────────────────────────────
function drawLateenSail(g, x, hullTopY, mastTop, L) {
  const mastLen = hullTopY - mastTop;
  

const shift = L * 0.15;                    // shift whole sail forward
  const yardLowX = x - L * 0.12 - shift;     // forward end of yard, near deck
  const yardLowY = hullTopY - L * 0.02;
  const yardHighX = x + L * 0.42 - shift;    // well aft, well aloft
  const yardHighY =  hullTopY - L * 0.55;
  const clewX = x + L * 0.38 - shift;        // bottom corner pulled aft
  const clewY = hullTopY - L * 0.04;

  
  // Triangle: yard-forward → yard-aft → clew
  const d = [
    `M ${yardLowX},${yardLowY}`,
    `L ${yardHighX},${yardHighY}`,
    `L ${clewX},${clewY}`,
    "Z",
  ].join(" ");
  g.appendChild(path(d, {
    fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
  }));
  
  // Yard (the angled spar) — drawn over the sail
  g.appendChild(el("line", {
    x1: yardLowX, y1: yardLowY, x2: yardHighX, y2: yardHighY,
    stroke: COLOR.mast, "stroke-width": 2.0,
  }));
}

  // ── Square + lateen mizzen (frigates, SoL) ─────────────────
  function drawSquareWithLateen(g, x, hullTopY, mastTop, sails, L) {
    // Square topsail high up
    if (sails.topsail) {
      const sailTop = hullTopY - L * 0.78;
      const sailBot = hullTopY - L * 0.55;
      const w = L * 0.22;

      g.appendChild(el("line", {
        x1: x - w / 2 - 3, y1: sailTop, x2: x + w / 2 + 3, y2: sailTop,
        stroke: COLOR.mast, "stroke-width": 1.6,
      }));

      const bellyOffset = (sailBot - sailTop) * 0.06;
      const midY = (sailTop + sailBot) / 2;
      const d = [
        `M ${x - w / 2},${sailTop}`,
        `L ${x + w / 2},${sailTop}`,
        `Q ${x + w / 2 + bellyOffset},${midY} ${x + w / 2},${sailBot}`,
        `L ${x - w / 2},${sailBot}`,
        `Q ${x - w / 2 - bellyOffset},${midY} ${x - w / 2},${sailTop}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));
    }

    // Mizzen sail (driver/spanker) below
    if (sails.mizzen) {
      const sailBot = hullTopY - L * 0.02;
      const sailTopOnMast = hullTopY - L * 0.50;
      const boomLen = L * 0.30;
      const gaffPeakX = x + L * 0.22;
      const gaffPeakY = sailTopOnMast - L * 0.04;

      const d = [
        `M ${x},${sailBot}`,
        `L ${x + boomLen},${sailBot}`,
        `L ${gaffPeakX},${gaffPeakY}`,
        `L ${x},${sailTopOnMast}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));

      g.appendChild(el("line", {
        x1: x, y1: sailBot, x2: x + boomLen + 4, y2: sailBot,
        stroke: COLOR.mast, "stroke-width": 1.6,
      }));
      g.appendChild(el("line", {
        x1: x, y1: sailTopOnMast, x2: gaffPeakX + 4, y2: gaffPeakY,
        stroke: COLOR.mast, "stroke-width": 1.5,
      }));
    }
  }

  // ── Staysails (large triangles between masts) ──────────────
  function drawStaysails(g, config, hullTopY, mastTops) {
    if (!config.staysails) return;
    const L = config.hullLength;

    config.staysails.forEach(key => {
      let headX, headY, tackX, tackY, clewX, clewY;

      if (key === "main" && config.masts.length >= 2) {
        const foreX = config.masts[0].x * L;
        const mainX = config.masts[1].x * L;
        const mainTop = mastTops[1];
        // Head: high on the mainmast
        headX = mainX;
        headY = mainTop + L * 0.18;
        // Tack: low on stay near foremast deck
        tackX = foreX + L * 0.04;
        tackY = hullTopY - L * 0.04;
        // Clew: at deck near mainmast base
        clewX = mainX - L * 0.02;
        clewY = hullTopY - L * 0.02;
      } else if (key === "mainTopmast" && config.masts.length >= 2) {
        const foreX = config.masts[0].x * L;
        const mainX = config.masts[1].x * L;
        const mainTop = mastTops[1];
        headX = mainX;
        headY = mainTop + L * 0.05;
        tackX = foreX + L * 0.06;
        tackY = hullTopY - L * 0.32;
        clewX = mainX - L * 0.04;
        clewY = hullTopY - L * 0.22;
      } else if (key === "mizzen" && config.masts.length >= 3) {
        const mainX = config.masts[1].x * L;
        const mizzenX = config.masts[2].x * L;
        const mizzenTop = mastTops[2];
        headX = mizzenX;
        headY = mizzenTop + L * 0.18;
        tackX = mainX + L * 0.04;
        tackY = hullTopY - L * 0.04;
        clewX = mizzenX - L * 0.02;
        clewY = hullTopY - L * 0.02;
      } else if (key === "mizzenTopmast" && config.masts.length >= 3) {
        const mainX = config.masts[1].x * L;
        const mizzenX = config.masts[2].x * L;
        const mizzenTop = mastTops[2];
        headX = mizzenX;
        headY = mizzenTop + L * 0.05;
        tackX = mainX + L * 0.06;
        tackY = hullTopY - L * 0.32;
        clewX = mizzenX - L * 0.04;
        clewY = hullTopY - L * 0.22;
      } else {
        return;
      }

      const d = [
        `M ${headX},${headY}`,
        `L ${tackX},${tackY}`,
        `L ${clewX},${clewY}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.8,
        opacity: 0.92,
      }));
    });
  }

  // ── Bowsprit & jibs ────────────────────────────────────────
  function drawBowsprit(g, config, hullTopY) {
    const L = config.hullLength;
    const H = config.hullHeight;
    if (config.bowsprit === "none") return;

    const bowspritLen = L * 0.22;
    const bowspritEndX = -bowspritLen * 0.85;
    const bowspritEndY = hullTopY - bowspritLen * 0.25;
    const bowspritStartX = L * 0.05;
    const bowspritStartY = hullTopY - H * 0.05;
    const bowspritStroke = Math.max(2.5, L * 0.007);

    g.appendChild(el("line", {
      x1: bowspritStartX, y1: bowspritStartY,
      x2: bowspritEndX, y2: bowspritEndY,
      stroke: COLOR.mast, "stroke-width": bowspritStroke,
    }));

    const firstMastX = config.masts[0].x * L;

    if (config.bowsprit === "oneJib" || config.bowsprit === "twoJibs") {
      // Inner jib from bowsprit mid-area up to foremast mid-height
      const d1 = [
        `M ${bowspritStartX - bowspritLen * 0.4},${bowspritStartY - bowspritLen * 0.12}`,
        `L ${firstMastX},${hullTopY - L * 0.32}`,
        `L ${firstMastX - L * 0.08},${hullTopY - L * 0.04}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d1, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));
    }

    if (config.bowsprit === "twoJibs") {
      // Outer jib from bowsprit tip up to higher on foremast
      const d2 = [
        `M ${bowspritEndX + 6},${bowspritEndY + 4}`,
        `L ${firstMastX - L * 0.01},${hullTopY - L * 0.52}`,
        `L ${firstMastX - L * 0.14},${hullTopY - L * 0.06}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d2, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
        opacity: 0.92,
      }));
    }

    if (config.bowsprit === "squareSpritsail") {
      const w = L * 0.18;
      const cx = bowspritStartX + (bowspritEndX - bowspritStartX) * 0.45;
      const cy = bowspritStartY + (bowspritEndY - bowspritStartY) * 0.45;
      const d = [
        `M ${cx - w / 2},${cy + 2}`,
        `L ${cx + w / 2},${cy + 2}`,
        `L ${cx + w / 2},${cy + L * 0.12}`,
        `L ${cx - w / 2},${cy + L * 0.12}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.sail, stroke: COLOR.sailEdge, "stroke-width": 0.9,
      }));
      g.appendChild(el("line", {
        x1: cx - w / 2 - 3, y1: cy + 2, x2: cx + w / 2 + 3, y2: cy + 2,
        stroke: COLOR.mast, "stroke-width": 1.6,
      }));
    }
  }

  // ── Flag ───────────────────────────────────────────────────
  function drawFlag(g, x, mastTop, faction, L) {
    if (!faction) return;
    const flagW = L * 0.08;
    const flagH = L * 0.045;
    const flagX = x + 3;
    const flagY = mastTop + 2;

    // Pole extending above masthead
    g.appendChild(el("line", {
      x1: x, y1: mastTop, x2: x, y2: mastTop - flagH * 0.5,
      stroke: COLOR.mast, "stroke-width": 1.2,
    }));

    const d = [
      `M ${flagX},${flagY}`,
      `L ${flagX + flagW},${flagY + flagH * 0.1}`,
      `L ${flagX + flagW * 0.93},${flagY + flagH * 0.55}`,
      `L ${flagX + flagW},${flagY + flagH}`,
      `L ${flagX},${flagY + flagH * 0.9}`,
      "Z",
    ].join(" ");
    g.appendChild(path(d, {
      fill: factionColor(faction), stroke: COLOR.hullStripe, "stroke-width": 0.5,
    }));
  }

  // ── War pennants ───────────────────────────────────────────
  function drawPennants(g, config, hullTopY, mastTops) {
    const L = config.hullLength;
    config.masts.forEach((mast, i) => {
      const x = mast.x * L;
      const top = mastTops[i];
      const pennantLen = L * 0.06;
      const pennantH = L * 0.015;

      g.appendChild(el("line", {
        x1: x, y1: top, x2: x, y2: top - pennantH * 1.2,
        stroke: COLOR.mast, "stroke-width": 1.0,
      }));

      const px = x + 2;
      const py = top - pennantH;
      const d = [
        `M ${px},${py}`,
        `L ${px + pennantLen},${py + pennantH * 0.3}`,
        `L ${px + pennantLen * 0.6},${py + pennantH * 0.5}`,
        `L ${px + pennantLen * 0.9},${py + pennantH * 0.8}`,
        `L ${px},${py + pennantH}`,
        "Z",
      ].join(" ");
      g.appendChild(path(d, {
        fill: COLOR.pennant, stroke: COLOR.hullStripe, "stroke-width": 0.4,
      }));
    });
  }

  // ── Copper plating ─────────────────────────────────────────
  function drawCopperPlating(g, config) {
    const L = config.hullLength;
    const H = config.hullHeight;
    g.appendChild(el("rect", {
      x: L * 0.08, y: H * 0.65,
      width: L * 0.84, height: H * 0.27,
      fill: COLOR.copper, opacity: 0.55,
    }));
  }

  // ── Ornate figurehead ──────────────────────────────────────
  function drawFigurehead(g, config, hullTopY) {
    const L = config.hullLength;
    const H = config.hullHeight;
    const fx = L * 0.04;
    const fy = hullTopY - H * 0.05;
    const fSize = L * 0.025;

    g.appendChild(el("circle", {
      cx: fx, cy: fy, r: fSize,
      fill: COLOR.figurehead, stroke: COLOR.hullStripe, "stroke-width": 0.6,
    }));
  }

  // ── Main render function ───────────────────────────────────
  function render(shipType, options = {}) {
    const config = window.D?.SHIP_VISUALS?.[shipType];
    if (!config) {
      console.error(`ShipSprite: no config for ship type "${shipType}"`);
      return null;
    }

    const {
      faction = null,
      equipment = [],
      width = 400,
      height = 300,
      facing = "left",
      showFlag = faction !== null,
    } = options;

    const L = config.hullLength;
    const H = config.hullHeight;

    // Compute the tallest mast top to size the viewBox
    let tallestMastTop = 0;
    config.masts.forEach(mc => {
      const mt = computeMastTop(mc, 0, L, equipment);
      if (mt < tallestMastTop) tallestMastTop = mt;
    });
    const mastSpan = -tallestMastTop;  // positive number

    const padTop = mastSpan * 0.08;
    const padBot = H * 0.15;
    const padLeft = L * 0.3;
    const padRight = L * 0.1;
    const vbX = -padLeft;
    const vbY = tallestMastTop - padTop;
    const vbW = L + padLeft + padRight;
    const vbH = mastSpan + H + padTop + padBot;

    const svg = el("svg", {
      xmlns: SVG_NS,
      viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`,
      width: width,
      height: height,
      preserveAspectRatio: "xMidYMid meet",
    });

    const outer = el("g", {
      transform: facing === "right" ? `scale(-1, 1) translate(${-(L * 0.5)}, 0)` : null,
    });
    svg.appendChild(outer);

    const hullTopY = 0;

    // 1. Hull
    const hullGroup = el("g");
    outer.appendChild(hullGroup);
    if (config.hullShape === "open") drawHull_open(hullGroup, config);
    else if (config.hullShape === "lowSloop") drawHull_lowSloop(hullGroup, config);
    else if (config.hullShape === "military") drawHull_military(hullGroup, config);
    else if (config.hullShape === "galleon") drawHull_galleon(hullGroup, config);

    if (equipment.includes("copper_plating")) {
      drawCopperPlating(hullGroup, config);
    }
    if (equipment.includes("ornate_figurehead")) {
      drawFigurehead(hullGroup, config, hullTopY);
    }

    // 2. Bowsprit & jibs
    drawBowsprit(outer, config, hullTopY);

    // 3. Masts and sails
    const mastTops = [];
    config.masts.forEach(mastConfig => {
      const mastX = mastConfig.x * L;
      const mastTop = drawMast(outer, mastX, hullTopY, mastConfig, config, equipment);
      mastTops.push(mastTop);
    });

    // 4. Staysails (drawn over masts)
    drawStaysails(outer, config, hullTopY, mastTops);

    // 5. Flag on mainmast
    if (showFlag && faction) {
      const mainIdx = Math.floor(config.masts.length / 2);
      const flagX = config.masts[mainIdx].x * L;
      const flagTop = mastTops[mainIdx];
      drawFlag(outer, flagX, flagTop, faction, L);
    }

    // 6. War pennants
    if (equipment.includes("war_pennants")) {
      drawPennants(outer, config, hullTopY, mastTops);
    }

    return svg;
  }

  // ── Expose ─────────────────────────────────────────────────
  window.ShipSprite.render = render;
})();
