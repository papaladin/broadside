// @ts-check
// sim-legal.js — Legal actions helper for the Career Simulator.
// Exposes: window.Simulator.getLegalActions

(() => {
  "use strict";

  const A = window.E.A;
  const L = window.L;
  const D = window.D;

  /**
   * Returns a structured list of legal actions for the current state.
   * @param {object} state – current game state
   * @returns {{ context: string, actions: Array<{ type: string, legal: boolean, reason?: string } & any> }}
   */
  function getLegalActions(state) {
    const screen = state.screen;
    const actions = [];

    // ── Context detection ──────────────────────────────────────────
    let context = "unknown";
    if (screen === "port") context = "port";
    else if (screen === "map") context = "map";
    else if (screen === "sailing") context = "sailing";
    else if (screen === "event") context = "event";
    else if (screen === "intercept") context = "intercept";
    else if (screen === "battle") context = "battle";
    else if (screen === "plunder") context = "plunder";
    else if (screen === "shipyard") context = "shipyard";
    else if (screen === "crew") context = "crew";
    else if (screen === "market") context = "market";
    else if (screen === "status") context = "status";
    else if (screen === "journal") context = "journal";
    else if (screen === "gameover") context = "gameover";
    else if (screen === "title" || screen === "newgame") context = "menu";

    // ═══════════════════════════════════════════════════════════════
    //  SPECIAL CHECK: inspection_pending before generic intercept
    // ═══════════════════════════════════════════════════════════════
    if (screen === "intercept" && state.encounterSession?.phase === "inspection_pending") {
      context = "inspection_pending";
      actions.push({
        type: A.RESOLVE_INSPECTION,
        choice: "handOver",
        legal: true,
        reason: null
      });
      actions.push({
        type: A.RESOLVE_INSPECTION,
        choice: "resist",
        legal: state.crew.roster.length > 0 && state.ship.hull > 0,
        reason: state.crew.roster.length === 0
          ? "No crew to resist"
          : state.ship.hull === 0
            ? "Ship destroyed"
            : null
      });
      return { context, actions };
    }

    // ── Port ──────────────────────────────────────────────────────
    if (context === "port") {
      const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
      const servicesBlocked = repPerk.servicesBlocked;

      // Repair
      const maxHull = L.getShipStats(state).maxHull;
      actions.push({
        type: A.REPAIR,
        legal: !servicesBlocked && state.ship.hull < maxHull && state.gold >= L.shipRepairCost(state),
        reason: !servicesBlocked ? (state.ship.hull < maxHull ? null : "Hull already full") : "Services blocked"
      });

      // Hire Crew
      const maxCrew = state.crew.max || L.getShipStats(state).maxCrew;
      actions.push({
        type: A.HIRE_CREW,
        count: 1,
        legal: !servicesBlocked && state.crew.roster.length < maxCrew && state.gold >= 50,
        reason: !servicesBlocked ? "Not enough gold or crew full" : "Services blocked"
      });

      // Raise Morale
      const moraleCost = state.crew.roster.length * 5;
      actions.push({
        type: A.RAISE_MORALE,
        legal: !servicesBlocked && state.crew.roster.length > 0 && state.gold >= moraleCost && state.crew.morale < 100,
        reason: !servicesBlocked ? "Not enough gold, no crew, or morale full" : "Services blocked"
      });

      // Refresh Missions
      actions.push({
        type: A.REFRESH_MISSIONS,
        legal: !servicesBlocked,
        reason: !servicesBlocked ? null : "Services blocked"
      });

      // Take Mission – one action per available mission
      if (state.missions && state.missions.length > 0 && !state.activeMission) {
        state.missions.forEach((mission) => {
          actions.push({
            type: A.TAKE_MISSION,
            mission: mission,
            legal: true,
            reason: null
          });
        });
      } else {
        actions.push({
          type: A.TAKE_MISSION,
          legal: false,
          reason: state.activeMission ? "Already have a mission" : "No missions available"
        });
      }

      // NEW: Complete Mission (if active mission exists)
      if (state.activeMission) {
        const mission = state.activeMission;
        const canComplete = !mission.requiredGood || 
                            (state.hold?.items?.[mission.requiredGood] || 0) >= mission.requiredQty;
        actions.push({
          type: A.COMPLETE_MISSION,
          legal: canComplete,
          reason: canComplete ? null : "Missing required goods"
        });
      }

      // Abandon Mission
      actions.push({
        type: A.ABANDON_MISSION,
        legal: !!state.activeMission,
        reason: state.activeMission ? null : "No active mission"
      });

      // Confirm Trade (generic – policy must fill buys/sells)
      actions.push({
        type: A.CONFIRM_TRADE,
        buys: {},
        sells: {},
        legal: !!state.portMarket,
        reason: state.portMarket ? null : "No market at this port"
      });

      // Buy Ship
      const shipKeys = Object.keys(D.SHIPS);
      shipKeys.forEach(shipType => {
        const shipData = D.SHIPS[shipType];
        const req = L.meetsRequirement(state, shipData);
        const canAfford = state.gold >= shipData.cost;
        const isCurrent = state.ship.type === shipType;
        actions.push({
          type: A.BUY_SHIP,
          shipType: shipType,
          shipName: shipData.name,
          legal: !servicesBlocked && req.allowed && canAfford && !isCurrent,
          reason: !servicesBlocked ? (req.allowed ? (canAfford ? (isCurrent ? "Already this ship" : null) : "Not enough gold") : req.reason) : "Services blocked"
        });
      });

      // Buy Equipment
      const equipKeys = Object.keys(D.EQUIPMENT);
      equipKeys.forEach(equipKey => {
        const item = D.EQUIPMENT[equipKey];
        const validation = L.canInstallEquipment(state, equipKey);
        const totalCost = item.cost + (item.installFee || 0);
        const canAfford = state.gold >= totalCost;
        actions.push({
          type: A.BUY_EQUIPMENT,
          equipmentKey: equipKey,
          legal: !servicesBlocked && validation.ok && canAfford,
          reason: !servicesBlocked ? (validation.ok ? (canAfford ? null : "Not enough gold") : validation.reason) : "Services blocked"
        });
      });

      // Install Equipment from locker
      if (state.equipmentInventory && state.equipmentInventory.length > 0) {
        state.equipmentInventory.forEach(equipKey => {
          const item = D.EQUIPMENT[equipKey];
          if (!item) return;
          const validation = L.canInstallEquipment(state, equipKey);
          const cost = item.installFee || 0;
          const canAfford = state.gold >= cost;
          actions.push({
            type: A.INSTALL_EQUIPMENT,
            equipmentKey: equipKey,
            legal: !servicesBlocked && validation.ok && canAfford,
            reason: !servicesBlocked ? (validation.ok ? (canAfford ? null : "Not enough gold for install fee") : validation.reason) : "Services blocked"
          });
        });
      }

      // Remove Equipment
      const allEquipped = [
        ...(state.ship.equipment?.hull || []),
        ...(state.ship.equipment?.armament || []),
        ...(state.ship.equipment?.rigging || []),
        ...(state.ship.equipment?.special || [])
      ];
      allEquipped.forEach(equipKey => {
        const item = D.EQUIPMENT[equipKey];
        if (!item || !item.removable) return;
        const cost = item.installFee || 0;
        const canAfford = state.gold >= cost;
        actions.push({
          type: A.REMOVE_EQUIPMENT,
          equipmentKey: equipKey,
          legal: !servicesBlocked && canAfford,
          reason: !servicesBlocked ? (canAfford ? null : "Not enough gold for removal fee") : "Services blocked"
        });
      });

      // Navigate
      ["map", "shipyard", "crew", "market", "status", "journal"].forEach(screenName => {
        actions.push({
          type: A.NAVIGATE,
          screen: screenName,
          legal: true,
          reason: null
        });
      });

      // Top Up Provisions
      const crew = state.crew.roster.length;
      if (crew > 0 && state.portMarket) {
        const buyQty = Math.max(1, Math.ceil(crew));
        const foodPrice = state.portMarket.goods.food?.buyFromPort || 3;
        const waterPrice = state.portMarket.goods.water?.buyFromPort || 2;
        const cost = buyQty * (foodPrice + waterPrice);
        const freeSpace = L.getHoldCapacity(state) - L.getHoldUsed(state.hold?.items || {});
        const hasSpace = freeSpace >= buyQty * 2;
        actions.push({
          type: A.TOP_UP_PROVISIONS,
          legal: !servicesBlocked && state.gold >= cost && hasSpace,
          reason: !servicesBlocked ? (state.gold >= cost ? (hasSpace ? null : "Not enough hold space") : "Not enough gold") : "Services blocked"
        });
      }

      // ── SAIL_TO – one action per reachable port
      const shipMaxHull = L.getShipStats(state).maxHull;
      const isHullDestroyed = state.ship.hull === 0;
      const minCrew = L.getMinViableCrew(state.ship.type);
      const isCrewInsufficient = state.ship.type !== "dinghy" && state.crew.roster.length < minCrew;
      const sailBlocked = isHullDestroyed || isCrewInsufficient;

      const portKeys = Object.keys(D.PORTS);
      portKeys.forEach(portKey => {
        if (portKey === state.currentPort) return;
        const reachable = L.canReach(state, portKey);
        const reason = !sailBlocked
          ? (reachable ? null : L.getUnreachableReason(state, portKey) || "Unreachable")
          : isHullDestroyed
            ? "Ship is destroyed"
            : `Insufficient crew (need ${minCrew})`;
        actions.push({
          type: A.SAIL_TO,
          port: portKey,
          legal: !sailBlocked && reachable,
          reason: reason
        });
      });
    }

    // ── Sailing ────────────────────────────────────────────────────
    else if (context === "sailing") {
      const arrived = state.sailingDaysLeft <= 0;
      actions.push({
        type: A.ADVANCE_DAY,
        legal: !arrived,
        reason: arrived ? "Already arrived" : null
      });
      actions.push({
        type: A.ENTER_PORT,
        legal: arrived,
        reason: arrived ? null : "Not yet arrived"
      });
      actions.push({
        type: A.NAVIGATE,
        screen: "map",
        legal: true,
        reason: null
      });
    }

    // ── Map ────────────────────────────────────────────────────────
    else if (context === "map") {
      actions.push({
        type: A.NAVIGATE,
        screen: "port",
        legal: true,
        reason: null
      });
    }

    // ── Intercept (generic, excluding inspection_pending) ──────────
    else if (context === "intercept") {
      const session = state.encounterSession;
      if (session && session.intercept && session.intercept.options) {
        session.intercept.options.forEach(opt => {
          if (!opt.action) return;
          const actionType = opt.action.type;
          let flatAction = { type: actionType };
          actions.push({
            ...flatAction,
            legal: opt.available,
            reason: opt.available ? null : (opt.reason || "Option unavailable")
          });
        });
      }
    }

    // ── Battle ─────────────────────────────────────────────────────
    else if (context === "battle") {
      const battle = state.encounterSession?.battle;
      console.log("⚔️ Battle object:", battle);
      if (!battle) {
        console.warn("⚠️ Battle context but no battle object");
        return { context, actions };
      }
      const phase = battle.phase || "player_turn";
      const subPhase = battle.subPhase || "naval";
      let distance = battle.distance || "medium";
      // Normalize distance
      if (!["far", "medium", "close"].includes(distance)) {
        console.warn(`⚠️ Unknown distance "${distance}", defaulting to "medium"`);
        distance = "medium";
      }

      console.log(`⚔️ Battle state: phase=${phase}, subPhase=${subPhase}, distance=${distance}`);

      if (phase === "player_turn") {
        if (subPhase === "naval") {
          const legalActions = D.LEGAL_ACTIONS_BY_DISTANCE[distance] || [];
          legalActions.forEach(actionName => {
            let legal = true;
            let reason = null;
            if (actionName === "grapple" && state.crew.roster.length === 0) {
              legal = false;
              reason = "No crew to board";
            }
            actions.push({
              type: A.BATTLE_ACTION,
              action: actionName,
              legal: legal,
              reason: reason
            });
          });
          // Evade is already included for 'far', but we add it explicitly if not present
          if (distance === "far" && !actions.some(a => a.action === "evade")) {
            actions.push({
              type: A.BATTLE_ACTION,
              action: "evade",
              legal: true,
              reason: null
            });
          }
        } else if (subPhase === "boarding") {
          const boardingActions = ["continue_fighting", "fall_back", "surrender"];
          const ratio = L.getBoardingRatio(state, battle, state.encounterSession.enemy);
          boardingActions.push({
            action: "demand_surrender",
            legal: ratio >= 0.65
          });
          boardingActions.forEach(a => {
            if (typeof a === "string") {
              actions.push({
                type: A.BATTLE_ACTION,
                action: a,
                legal: true,
                reason: null
              });
            } else {
              actions.push({
                type: A.BATTLE_ACTION,
                action: a.action,
                legal: a.legal,
                reason: a.legal ? null : "Advantage too low"
              });
            }
          });
        }
      } else if (phase === "victory" || phase === "defeat" || phase === "fled") {
        actions.push({
          type: A.DISMISS_BATTLE,
          legal: true,
          reason: null
        });
        if (phase === "victory" && battle.canPlunder) {
          actions.push({
            type: A.NAVIGATE,
            screen: "plunder",
            legal: true,
            reason: null
          });
        }
      } else {
        console.warn(`⚠️ Unknown battle phase "${phase}", adding DISMISS_BATTLE as fallback`);
        actions.push({
          type: A.DISMISS_BATTLE,
          legal: true,
          reason: null
        });
      }

      // If after all that we still have no actions, add a fallback DISMISS_BATTLE
      if (actions.length === 0) {
        console.warn("⚠️ No battle actions generated, adding DISMISS_BATTLE fallback");
        actions.push({
          type: A.DISMISS_BATTLE,
          legal: true,
          reason: null
        });
      }
    }

    // ── Plunder ────────────────────────────────────────────────────
    else if (context === "plunder") {
      actions.push({
        type: A.TAKE_PLUNDER,
        holdItems: { ...state.hold.items },
        legal: true,
        reason: null
      });
      actions.push({
        type: A.DISMISS_BATTLE,
        legal: true,
        reason: null
      });
    }

    // ── Event ──────────────────────────────────────────────────────
    else if (context === "event") {
      const event = state.activeEvent;
      if (event && event.choices) {
        event.choices.forEach((choice, idx) => {
          const isEnabled = !choice.condition || choice.condition(state);
          actions.push({
            type: A.RESOLVE_EVENT,
            choiceIndex: idx,
            legal: isEnabled,
            reason: isEnabled ? null : "Condition not met"
          });
        });
      }
    }

    // ── Game over ──────────────────────────────────────────────────
    else if (context === "gameover") {
      // no actions
    }

    // ── Other screens (shipyard, crew, market, status, journal) ──
    else if (["shipyard", "crew", "market", "status", "journal"].includes(context)) {
      actions.push({
        type: A.NAVIGATE,
        screen: "port",
        legal: true,
        reason: null
      });
      const otherScreens = ["map", "shipyard", "crew", "market", "status", "journal"].filter(s => s !== context);
      otherScreens.forEach(screenName => {
        actions.push({
          type: A.NAVIGATE,
          screen: screenName,
          legal: true,
          reason: null
        });
      });
    }

    // ── Unknown ────────────────────────────────────────────────────
    else {
      actions.push({
        type: A.NAVIGATE,
        screen: "port",
        legal: true,
        reason: null
      });
    }

    return { context, actions };
  }

  // ── Attach to window.Simulator ──────────────────────────────────
  if (!window.Simulator) window.Simulator = {};
  window.Simulator.getLegalActions = getLegalActions;
  console.log("📋 sim-legal.js loaded – getLegalActions attached.");
})();