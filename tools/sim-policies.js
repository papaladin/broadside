// sim-policies.js — All policy implementations
// Extends window.Simulator.Policy and registers personas into Simulator.PERSONAS

(() => {
  const A = window.E.A;
  const L = window.L;
  const D = window.D;
  const Policy = window.Simulator.Policy;

  // ── Shared plunder helper ─────────────────────────────────────────
  // Mirrors the game's PlunderScreen "take all" behavior: prioritize enemy
  // cargo by base resource value and take only what fits in the current hold.
  // If the hold is full, TAKE_PLUNDER is still chosen; the battle's gold reward
  // is granted independently by the real engine.
  function buildPlunderHoldItems(state) {
    const enemyCargo = state.encounterSession?.battle?.enemyCargo || {};
    const currentItems = { ...(state.hold?.items || {}) };

    const capacity = Number(L.getHoldCapacity(state));
    const used = Number(L.getHoldUsed(currentItems));
    let remaining = Math.max(0, (Number.isFinite(capacity) ? capacity : used) - used);

    const priority = Object.entries(enemyCargo)
      .map(([good, qty]) => ({
        good,
        qty: Math.max(0, Number(qty) || 0),
        price: Number(D.RESOURCES?.[good]?.basePrice) || 0,
      }))
      .filter(item => item.qty > 0)
      .sort((a, b) => b.price - a.price);

    const newItems = { ...currentItems };
    for (const item of priority) {
      if (remaining <= 0) break;
      const takeQty = Math.min(item.qty, remaining);
      if (takeQty > 0) {
        newItems[item.good] = (newItems[item.good] || 0) + takeQty;
        remaining -= takeQty;
      }
    }
    return newItems;
  }

  // ── TestRoutePolicy ──
  class TestRoutePolicy extends Policy {
    constructor() {
      super("TestRoute", { startingGold: 100000 });
    }

    chooseDecision(context, state) {
      const { context: ctx, actions } = context;
      const legalActions = actions.filter(a => a.legal);

      if (ctx === 'port') {
        if (state.ship.hull < L.getShipStats(state).maxHull) {
          const repairAction = legalActions.find(a => a.type === A.REPAIR);
          if (repairAction) return { action: repairAction, reason: 'Repair hull' };
        }
        if (state.crew.morale < 50 && state.crew.roster.length > 0) {
          const raiseAction = legalActions.find(a => a.type === A.RAISE_MORALE);
          if (raiseAction) return { action: raiseAction, reason: 'Boost morale' };
        }
        const crew = state.crew.roster.length;
        const food = state.hold?.items?.food || 0;
        const water = state.hold?.items?.water || 0;
        if (crew > 0 && (food < crew || water < crew)) {
          const topUpAction = legalActions.find(a => a.type === A.TOP_UP_PROVISIONS);
          if (topUpAction) return { action: topUpAction, reason: 'Top up provisions' };
        }
        const routePorts = ['portRoyal', 'kingston'];
        let target = null;
        if (state.currentPort === 'portRoyal') target = 'kingston';
        else if (state.currentPort === 'kingston') target = 'portRoyal';
        else {
          target = routePorts.find(p => p !== state.currentPort &&
            legalActions.some(a => a.type === A.SAIL_TO && a.port === p));
        }
        if (target) {
          const sailAction = legalActions.find(a => a.type === A.SAIL_TO && a.port === target);
          if (sailAction) return { action: sailAction, reason: `Sail to ${target}` };
        }
        const anySail = legalActions.find(a => a.type === A.SAIL_TO);
        if (anySail) return { action: anySail, reason: `Sail to ${anySail.port}` };
        return { action: null, reason: 'Cannot sail' };
      }

      if (ctx === 'sailing') {
        if (state.sailingDaysLeft <= 0) {
          const enterAction = legalActions.find(a => a.type === A.ENTER_PORT);
          if (enterAction) return { action: enterAction, reason: 'Enter port' };
        }
        const advanceAction = legalActions.find(a => a.type === A.ADVANCE_DAY);
        if (advanceAction) return { action: advanceAction, reason: 'Advance day' };
        return { action: null, reason: 'No sailing action' };
      }

      const fallback = legalActions.find(a => a.type === A.NAVIGATE && a.screen === 'port') ||
                       legalActions.find(a => a.type === A.REPAIR) ||
                       legalActions.find(a => a.type === A.TOP_UP_PROVISIONS) ||
                       legalActions[0];
      if (fallback) return { action: fallback, reason: 'Fallback for non-route context' };
      return { action: null, reason: 'No legal action' };
    }
  }

  // ── PureHuntPolicy ──
  class PureHuntPolicy extends Policy {
    constructor() {
      super("PureHunt", { refreshLimit: 3 });
      this.refreshCount = 0;
      this.missionAttempts = 0;
      this.battleRounds = 0;
    }

    chooseDecision(context, state) {
      const { context: ctx, actions } = context;
      const legalActions = actions.filter(a => a.legal);

      if (ctx === 'port') {
        if (state.activeMission && state.activeMission.type === 'combat' && !state.encounterSession) {
          const completeAction = legalActions.find(a => a.type === A.COMPLETE_MISSION);
          if (completeAction) return { action: completeAction, reason: 'Complete combat mission' };
        }

        // Sell captured cargo before paying for repairs and other port work.
        if (state.portMarket) {
          const holdItems = state.hold?.items || {};
          const sells = {};
          for (const good in holdItems) {
            if (good !== 'food' && good !== 'water' && holdItems[good] > 0) {
              sells[good] = holdItems[good];
            }
          }
          if (Object.keys(sells).length > 0) {
            const tradeAction = legalActions.find(a => a.type === A.CONFIRM_TRADE);
            if (tradeAction) {
              return { action: { type: A.CONFIRM_TRADE, buys: {}, sells }, reason: 'Sell captured cargo' };
            }
          }
        }

        if (state.ship.hull < L.getShipStats(state).maxHull) {
          const repairAction = legalActions.find(a => a.type === A.REPAIR);
          if (repairAction) return { action: repairAction, reason: 'Repair hull' };
        }

        const desiredCrew = Math.max(5, Math.ceil(L.getShipStats(state).maxCrew * 0.3));
        if (state.crew.roster.length < desiredCrew) {
          const hireAction = legalActions.find(a => a.type === A.HIRE_CREW);
          if (hireAction) return { action: hireAction, reason: 'Recruit to combat strength' };
        }

        if (state.crew.morale < 60 && state.crew.roster.length > 0) {
          const moraleAction = legalActions.find(a => a.type === A.RAISE_MORALE);
          if (moraleAction) return { action: moraleAction, reason: 'Boost morale' };
        }

        const crew = state.crew.roster.length;
        const food = state.hold?.items?.food || 0;
        const water = state.hold?.items?.water || 0;
        if (crew > 0 && (food < crew * 5 || water < crew * 5)) {
          const topUpAction = legalActions.find(a => a.type === A.TOP_UP_PROVISIONS);
          if (topUpAction) return { action: topUpAction, reason: 'Top up provisions' };
        }

        // Leave only after cargo has been sold and essential port maintenance is done.
        if (!state.activeMission && !state.completedCombatThisVisit) {
          const shipStats = L.getShipStats(state);
          const playerStrength = state.ship.hull + state.crew.roster.length * 10 + shipStats.cannons * 5;

          const winnableMissions = legalActions.filter(a => {
            if (a.type !== A.TAKE_MISSION || !a.mission) return false;
            if (a.mission.type !== 'combat') return false;
            if (a.mission.risk !== 'low') return false;
            const enemy = a.mission.enemy;
            if (!enemy) return false;
            const enemyStrength = enemy.hull + enemy.crew * 10 + enemy.cannons * 5;
            return playerStrength >= enemyStrength;
          });

          if (winnableMissions.length > 0) {
            const missionAction = winnableMissions[0];
            this.refreshCount = 0;
            this.missionAttempts++;
            return { action: missionAction, reason: `Take low-risk combat mission: ${missionAction.mission.name}` };
          }

          if (this.refreshCount < this.parameters.refreshLimit) {
            const refreshAction = legalActions.find(a => a.type === A.REFRESH_MISSIONS);
            if (refreshAction) {
              this.refreshCount++;
              return { action: refreshAction, reason: 'Refresh missions for a low-risk target' };
            }
          }

          const to = state.currentPort === 'kingston' ? 'portRoyal' : 'kingston';
          const sailAction = legalActions.find(a => a.type === A.SAIL_TO && a.port === to);
          if (sailAction) {
            this.refreshCount = 0;
            return { action: sailAction, reason: `Sail to ${to} for easier missions` };
          }
        } else if (state.activeMission && state.activeMission.type !== 'combat') {
          const abandon = legalActions.find(a => a.type === A.ABANDON_MISSION);
          if (abandon) return { action: abandon, reason: 'Abandon non-combat mission' };
        }

        const anySail = legalActions.find(a => a.type === A.SAIL_TO);
        if (anySail) return { action: anySail, reason: `Sail to ${anySail.port}` };

        return { action: null, reason: 'No action possible' };
      }

      if (ctx === 'sailing') {
        if (state.sailingDaysLeft <= 0) {
          const enter = legalActions.find(a => a.type === A.ENTER_PORT);
          if (enter) return { action: enter, reason: 'Enter port' };
        }
        const advance = legalActions.find(a => a.type === A.ADVANCE_DAY);
        if (advance) return { action: advance, reason: 'Advance day' };
        return { action: null, reason: 'No sailing action' };
      }

      if (ctx === 'intercept') {
        const session = state.encounterSession;
        if (session && session.enemy) {
          const enemy = session.enemy;
          const playerStrength = state.ship.hull + state.crew.roster.length * 10 + L.getShipStats(state).cannons * 5;
          const enemyStrength = enemy.hull + enemy.crew * 10 + enemy.cannons * 5;
          const fight = playerStrength >= enemyStrength * 0.8;

          const fightAction = legalActions.find(a => a.type === A.INTERCEPT_FIGHT);
          const fleeAction = legalActions.find(a => a.type === A.INTERCEPT_FLEE);

          if (fightAction && fight) return { action: fightAction, reason: 'Fight – we have an advantage' };
          if (fleeAction && !fight) return { action: fleeAction, reason: 'Flee – enemy too strong' };
          if (fightAction) return { action: fightAction, reason: 'Forced to fight' };
          if (fleeAction) return { action: fleeAction, reason: 'Flee (only option)' };
        }
        const fight = legalActions.find(a => a.type === A.INTERCEPT_FIGHT);
        if (fight) return { action: fight, reason: 'Fight' };
        return { action: legalActions[0], reason: 'Fallback intercept' };
      }

      if (ctx === 'battle') {
        const battle = state.encounterSession?.battle;
        if (!battle) return { action: null, reason: 'No battle state' };

        // Completed battle: plunder is mandatory whenever this victory was
        // achieved through boarding. Naval victories are sunk outcomes and
        // have no plunder screen.
        if (battle.phase !== 'player_turn') {
          this.battleRounds = 0;
          if (battle.phase === 'victory' && battle.canPlunder) {
            const plunderNav = legalActions.find(a => a.type === A.NAVIGATE && a.screen === 'plunder');
            if (plunderNav) return { action: plunderNav, reason: 'Plunder boarding victory' };
          }
          const dismiss = legalActions.find(a => a.type === A.DISMISS_BATTLE);
          if (dismiss) return { action: dismiss, reason: 'End battle' };
        }

        this.battleRounds = battle.round;

        if (this.battleRounds > 8) {
          const playerHullPct = battle.playerHull / L.getShipStats(state).maxHull;
          if (playerHullPct < 0.4 || battle.enemyHull > 20) {
            const evade = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'evade' && a.legal);
            if (evade) return { action: evade, reason: 'Evade – battle dragging on' };
            const open = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'open_distance' && a.legal);
            if (open) return { action: open, reason: 'Open distance – trying to disengage' };
          }
        }

        if (battle.subPhase === 'naval') {
          // Pure Hunt's defining behavior: once the target is badly damaged,
          // close and grapple instead of accidentally sinking it with another shot.
          const enemyMaxHull = state.encounterSession?.enemy?.maxHull || state.encounterSession?.enemy?.hull || battle.enemyHull;
          const enemyHullPct = battle.enemyHull / enemyMaxHull;
          const wantsBoarding = state.crew.roster.length >= 8 && enemyHullPct < 0.5;

          if (wantsBoarding) {
            if (battle.distance === 'close') {
              const grapple = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'grapple' && a.legal);
              if (grapple) return { action: grapple, reason: 'Grapple for boarding and plunder' };
            }
            const close = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'close_distance' && a.legal);
            if (close) return { action: close, reason: 'Close distance to board for plunder' };
          }

          const broadside = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'broadside' && a.legal);
          if (broadside) return { action: broadside, reason: 'Broadside' };
          const precision = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'precision' && a.legal);
          if (precision) return { action: precision, reason: 'Precision' };
          const any = legalActions.find(a => a.type === A.BATTLE_ACTION && a.legal);
          if (any) return { action: any, reason: 'Any naval action' };
        } else if (battle.subPhase === 'boarding') {
          const continueAction = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'continue_fighting' && a.legal);
          if (continueAction) return { action: continueAction, reason: 'Continue boarding' };
          const demand = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'demand_surrender' && a.legal);
          if (demand) return { action: demand, reason: 'Demand surrender' };
          const fallback = legalActions.find(a => a.type === A.BATTLE_ACTION && a.legal);
          if (fallback) return { action: fallback, reason: 'Boarding fallback' };
        }
        return { action: null, reason: 'No battle action' };
      }

      if (ctx === 'plunder') {
        const take = legalActions.find(a => a.type === A.TAKE_PLUNDER);
        if (take) {
          return {
            action: { ...take, holdItems: buildPlunderHoldItems(state) },
            reason: 'Take highest-value plunder; collect gold reward even if hold is full',
          };
        }
        const dismiss = legalActions.find(a => a.type === A.DISMISS_BATTLE);
        if (dismiss) return { action: dismiss, reason: 'Dismiss without plunder' };
        return { action: null, reason: 'No plunder action' };
      }

      if (ctx === 'event') {
        const event = state.activeEvent;
        if (event && event.choices) {
          const safeChoice = event.choices.findIndex((c, idx) => {
            const outcome = c.outcome;
            if (!outcome) return false;
            const hasDamage = outcome.hullDamage || outcome.crewLoss || (outcome.gold && outcome.gold < 0);
            return !hasDamage;
          });
          if (safeChoice >= 0) {
            const action = legalActions.find(a => a.type === A.RESOLVE_EVENT && a.choiceIndex === safeChoice);
            if (action) return { action, reason: 'Choose safe event option' };
          }
          const first = legalActions.find(a => a.type === A.RESOLVE_EVENT && a.legal);
          if (first) return { action: first, reason: 'First legal event option' };
        }
      }

      const back = legalActions.find(a => a.type === A.NAVIGATE && a.screen === 'port');
      if (back) return { action: back, reason: 'Back to port' };

      const any = legalActions.find(a => a.legal);
      if (any) return { action: any, reason: 'Generic fallback' };

      return { action: null, reason: 'No action available' };
    }
  }

  // ── CompetentHuntPolicy ──
class CompetentHuntPolicy extends Policy {
  constructor() {
    super("CompetentHunt", {
      refreshLimit: 3,
      reserveGold: 1000,
      crewTargetPct: 0.6,
      provisionDays: 5
    });
    this.refreshCount = 0;
    this.battleRounds = 0;
  }

  chooseDecision(context, state) {
    const { context: ctx, actions } = context;
    const legalActions = actions.filter(a => a.legal);

    // ── PORT CONTEXT ──────────────────────────────────────────────
    if (ctx === 'port') {
      // 1. Complete active combat mission if possible
      if (state.activeMission && state.activeMission.type === 'combat' && !state.encounterSession) {
        const completeAction = legalActions.find(a => a.type === A.COMPLETE_MISSION);
        if (completeAction) return { action: completeAction, reason: 'Complete combat mission' };
      }

      // 2. If already hunted here and no active mission, sail away
      if (state.completedCombatThisVisit && !state.activeMission) {
        const to = state.currentPort === 'kingston' ? 'portRoyal' : 'kingston';
        const sailAction = legalActions.find(a => a.type === A.SAIL_TO && a.port === to);
        if (sailAction) return { action: sailAction, reason: `Sail to ${to} to find new prey` };
      }

      // 3. Repair if damaged
      if (state.ship.hull < L.getShipStats(state).maxHull) {
        const repairAction = legalActions.find(a => a.type === A.REPAIR);
        if (repairAction) return { action: repairAction, reason: 'Repair hull' };
      }

      // 4. Hire crew to a target percentage (but after ship upgrade, we may need more)
      const shipStats = L.getShipStats(state);
      const desiredCrew = Math.max(5, Math.ceil(shipStats.maxCrew * this.parameters.crewTargetPct));
      if (state.crew.roster.length < desiredCrew) {
        const hireAction = legalActions.find(a => a.type === A.HIRE_CREW);
        if (hireAction) return { action: hireAction, reason: 'Recruit to combat strength' };
      }

      // 5. Raise morale if below 70
      if (state.crew.morale < 70 && state.crew.roster.length > 0) {
        const moraleAction = legalActions.find(a => a.type === A.RAISE_MORALE);
        if (moraleAction) return { action: moraleAction, reason: 'Boost morale' };
      }

      // 6. Top up provisions for N days
      const crew = state.crew.roster.length;
      const daysNeeded = this.parameters.provisionDays;
      const foodNeeded = crew * daysNeeded;
      const waterNeeded = crew * daysNeeded;
      const food = state.hold?.items?.food || 0;
      const water = state.hold?.items?.water || 0;
      if (crew > 0 && (food < foodNeeded || water < waterNeeded)) {
        const topUpAction = legalActions.find(a => a.type === A.TOP_UP_PROVISIONS);
        if (topUpAction) return { action: topUpAction, reason: 'Top up provisions' };
      }

      // 7. Sell cargo (keep food/water)
      if (state.portMarket) {
        const holdItems = state.hold?.items || {};
        let hasGoodsToSell = false;
        const sells = {};
        for (const good in holdItems) {
          if (good !== "food" && good !== "water" && holdItems[good] > 0) {
            sells[good] = holdItems[good];
            hasGoodsToSell = true;
          }
        }
        if (hasGoodsToSell) {
          const tradeAction = legalActions.find(a => a.type === A.CONFIRM_TRADE);
          if (tradeAction) {
            return { action: { type: A.CONFIRM_TRADE, buys: {}, sells }, reason: 'Sell cargo for gold' };
          }
        }
      }

      // 8. Buy a better ship if we're strong enough and can afford it
      const shipUpgradeDecision = this.shouldBuyShip(state);
      if (shipUpgradeDecision) {
        const buyAction = legalActions.find(a => a.type === A.BUY_SHIP && a.shipType === shipUpgradeDecision.shipType);
        if (buyAction) return { action: buyAction, reason: `Buy ${shipUpgradeDecision.shipName} for stronger combat` };
      }

      // Leave only after cargo has been sold and essential port maintenance is done.
      if (state.completedCombatThisVisit && !state.activeMission) {
        const to = state.currentPort === 'kingston' ? 'portRoyal' : 'kingston';
        const sailAction = legalActions.find(a => a.type === A.SAIL_TO && a.port === to);
        if (sailAction) return { action: sailAction, reason: `Sail to ${to} to find new prey` };
      }

      // 9. If no active mission and haven't hunted here, accept a winnable low‑risk combat mission
      if (!state.activeMission && !state.completedCombatThisVisit) {
        const playerStrength = this.calcPlayerStrength(state);

        // Filter combat missions: low-risk and winnable
        const winnableMissions = legalActions.filter(a => {
          if (a.type !== A.TAKE_MISSION || !a.mission) return false;
          if (a.mission.type !== 'combat') return false;
          const enemy = a.mission.enemy;
          if (!enemy) return false;
          const enemyStrength = enemy.hull + enemy.crew * 10 + enemy.cannons * 5;
          // Accept low-risk if we have at least parity, or any risk if clear advantage
          const isLowRisk = a.mission.risk === 'low';
          const isClearAdvantage = playerStrength >= enemyStrength * 1.3;
          return (isLowRisk && playerStrength >= enemyStrength) || (isClearAdvantage && playerStrength >= enemyStrength * 1.2);
        });

        if (winnableMissions.length > 0) {
          const missionAction = winnableMissions[0];
          this.refreshCount = 0;
          return { action: missionAction, reason: `Take combat mission: ${missionAction.mission.name}` };
        }

        // No winnable mission – refresh up to limit
        if (this.refreshCount < this.parameters.refreshLimit) {
          const refreshAction = legalActions.find(a => a.type === A.REFRESH_MISSIONS);
          if (refreshAction) {
            this.refreshCount++;
            return { action: refreshAction, reason: 'Refresh missions for a winnable target' };
          }
        }

        // Refreshes exhausted – sail to other port
        const to = state.currentPort === 'kingston' ? 'portRoyal' : 'kingston';
        const sailAction = legalActions.find(a => a.type === A.SAIL_TO && a.port === to);
        if (sailAction) {
          this.refreshCount = 0;
          return { action: sailAction, reason: `Sail to ${to} for easier missions` };
        }
      } else if (state.activeMission && state.activeMission.type !== 'combat') {
        const abandon = legalActions.find(a => a.type === A.ABANDON_MISSION);
        if (abandon) return { action: abandon, reason: 'Abandon non-combat mission' };
      }

      // Fallback: sail anywhere reachable
      const anySail = legalActions.find(a => a.type === A.SAIL_TO);
      if (anySail) return { action: anySail, reason: `Sail to ${anySail.port}` };

      return { action: null, reason: 'No action possible' };
    }

    // ── SAILING CONTEXT ─────────────────────────────────────────────
    if (ctx === 'sailing') {
      if (state.sailingDaysLeft <= 0) {
        const enter = legalActions.find(a => a.type === A.ENTER_PORT);
        if (enter) return { action: enter, reason: 'Enter port' };
      }
      const advance = legalActions.find(a => a.type === A.ADVANCE_DAY);
      if (advance) return { action: advance, reason: 'Advance day' };
      return { action: null, reason: 'No sailing action' };
    }

    // ── INTERCEPT CONTEXT ───────────────────────────────────────────
    if (ctx === 'intercept') {
      const session = state.encounterSession;
      if (session && session.enemy) {
        const enemy = session.enemy;
        const playerStrength = this.calcPlayerStrength(state);
        const enemyStrength = enemy.hull + enemy.crew * 10 + enemy.cannons * 5;
        const fight = playerStrength >= enemyStrength * 0.8;

        const fightAction = legalActions.find(a => a.type === A.INTERCEPT_FIGHT);
        const fleeAction = legalActions.find(a => a.type === A.INTERCEPT_FLEE);

        if (fightAction && fight) return { action: fightAction, reason: 'Fight – we have an advantage' };
        if (fleeAction && !fight) return { action: fleeAction, reason: 'Flee – enemy too strong' };
        if (fightAction) return { action: fightAction, reason: 'Forced to fight' };
        if (fleeAction) return { action: fleeAction, reason: 'Flee (only option)' };
      }
      const fight = legalActions.find(a => a.type === A.INTERCEPT_FIGHT);
      if (fight) return { action: fight, reason: 'Fight' };
      return { action: legalActions[0], reason: 'Fallback intercept' };
    }

    // ── BATTLE CONTEXT ──────────────────────────────────────────────
    if (ctx === 'battle') {
      const battle = state.encounterSession?.battle;
      if (!battle) return { action: null, reason: 'No battle state' };

      if (battle.phase !== 'player_turn') {
        this.battleRounds = 0;
        if (battle.phase === 'victory' && battle.canPlunder) {
          const plunderNav = legalActions.find(a => a.type === A.NAVIGATE && a.screen === 'plunder');
          if (plunderNav) return { action: plunderNav, reason: 'Plunder boarding victory' };
        }
        const dismiss = legalActions.find(a => a.type === A.DISMISS_BATTLE);
        if (dismiss) return { action: dismiss, reason: 'End battle' };
      }

      this.battleRounds = battle.round;

      if (this.battleRounds > 8) {
        const playerHullPct = battle.playerHull / L.getShipStats(state).maxHull;
        if (playerHullPct < 0.4 || battle.enemyHull > 20) {
          const evade = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'evade' && a.legal);
          if (evade) return { action: evade, reason: 'Evade – battle dragging on' };
          const open = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'open_distance' && a.legal);
          if (open) return { action: open, reason: 'Open distance – trying to disengage' };
        }
      }

      if (battle.subPhase === 'naval') {
        // Competent Hunt attempts to capture profitable targets rather than
        // continuing to fire after the boarding window has opened.
        const enemyMaxHull = state.encounterSession?.enemy?.maxHull || state.encounterSession?.enemy?.hull || battle.enemyHull;
        const enemyHullPct = battle.enemyHull / enemyMaxHull;
        const hasCrewForBoarding = state.crew.roster.length >= 8;
        const wantsBoarding = hasCrewForBoarding && enemyHullPct < 0.5;

        if (wantsBoarding) {
          if (battle.distance === 'close') {
            const grapple = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'grapple' && a.legal);
            if (grapple) return { action: grapple, reason: 'Grapple for boarding and plunder' };
          }
          const close = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'close_distance' && a.legal);
          if (close) return { action: close, reason: 'Close distance to board for plunder' };
        }

        const broadside = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'broadside' && a.legal);
        if (broadside) return { action: broadside, reason: 'Broadside' };
        const precision = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'precision' && a.legal);
        if (precision) return { action: precision, reason: 'Precision' };
        const any = legalActions.find(a => a.type === A.BATTLE_ACTION && a.legal);
        if (any) return { action: any, reason: 'Any naval action' };
      } else if (battle.subPhase === 'boarding') {
        const continueAction = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'continue_fighting' && a.legal);
        if (continueAction) return { action: continueAction, reason: 'Continue boarding' };
        const demand = legalActions.find(a => a.type === A.BATTLE_ACTION && a.action === 'demand_surrender' && a.legal);
        if (demand) return { action: demand, reason: 'Demand surrender' };
        const fallback = legalActions.find(a => a.type === A.BATTLE_ACTION && a.legal);
        if (fallback) return { action: fallback, reason: 'Boarding fallback' };
      }
      return { action: null, reason: 'No battle action' };
    }

    // ── PLUNDER CONTEXT ──────────────────────────────────────────────
    if (ctx === 'plunder') {
      const take = legalActions.find(a => a.type === A.TAKE_PLUNDER);
      if (take) {
        return {
          action: { ...take, holdItems: buildPlunderHoldItems(state) },
          reason: 'Take highest-value plunder; collect gold reward even if hold is full',
        };
      }
      const dismiss = legalActions.find(a => a.type === A.DISMISS_BATTLE);
      if (dismiss) return { action: dismiss, reason: 'Dismiss without plunder' };
      return { action: null, reason: 'No plunder action' };
    }

    // ── EVENT CONTEXT ────────────────────────────────────────────────
    if (ctx === 'event') {
      const event = state.activeEvent;
      if (event && event.choices) {
        const safeChoice = event.choices.findIndex((c, idx) => {
          const outcome = c.outcome;
          if (!outcome) return false;
          const hasDamage = outcome.hullDamage || outcome.crewLoss || (outcome.gold && outcome.gold < 0);
          return !hasDamage;
        });
        if (safeChoice >= 0) {
          const action = legalActions.find(a => a.type === A.RESOLVE_EVENT && a.choiceIndex === safeChoice);
          if (action) return { action, reason: 'Choose safe event option' };
        }
        const first = legalActions.find(a => a.type === A.RESOLVE_EVENT && a.legal);
        if (first) return { action: first, reason: 'First legal event option' };
      }
    }

    // ── FALLBACK FOR OTHER CONTEXTS ──────────────────────────────────
    const back = legalActions.find(a => a.type === A.NAVIGATE && a.screen === 'port');
    if (back) return { action: back, reason: 'Back to port' };

    const any = legalActions.find(a => a.legal);
    if (any) return { action: any, reason: 'Generic fallback' };

    return { action: null, reason: 'No action available' };
  }

  // ── Helper: calculate player strength (hull + crew*10 + cannons*5) ──
  calcPlayerStrength(state) {
    const shipStats = L.getShipStats(state);
    return state.ship.hull + state.crew.roster.length * 10 + shipStats.cannons * 5;
  }

  // ── Helper: decide if we should buy a better ship ──
  shouldBuyShip(state) {
    const currentType = state.ship.type;
    const shipTiers = ['dinghy', 'cutter', 'sloop', 'schooner', 'brigantine', 'frigate', 'galleon', 'ship_of_the_line'];
    const currentIndex = shipTiers.indexOf(currentType);
    if (currentIndex === -1 || currentIndex >= shipTiers.length - 1) return null;

    const nextType = shipTiers[currentIndex + 1];
    const nextShip = D.SHIPS[nextType];
    if (!nextShip) return null;

    // Only upgrade if we can afford: cost + reserve + hire to 60% of new max crew + provisions for 5 days
    const reserve = this.parameters.reserveGold;
    const newMaxCrew = nextShip.maxCrew;
    const targetCrew = Math.max(5, Math.ceil(newMaxCrew * this.parameters.crewTargetPct));
    const crewCost = targetCrew * 50; // 50g per hire
    const provisionCost = targetCrew * this.parameters.provisionDays * (3 + 2); // 3g food + 2g water per unit
    const totalNeeded = nextShip.cost + reserve + crewCost + provisionCost;

    if (state.gold >= totalNeeded) {
      return { shipType: nextType, shipName: nextShip.name };
    }

    // Also consider upgrading earlier if current ship is too weak for fame tier
    // Could add condition based on fame: e.g., fame >= 10 and still dinghy, consider cutter even if not fully funded?
    // For now keep the strict affordability condition.

    return null;
  }
}

  // ── Register personas ──
  const Simulator = window.Simulator;
  Simulator.PERSONAS.testRoute = { label: "Test Route", factory: () => new TestRoutePolicy() };
  Simulator.PERSONAS.pureHunt = { label: "Pure Hunt", factory: () => new PureHuntPolicy() };
  Simulator.PERSONAS.competentHunt = { label: "Competent Hunt", factory: () => new CompetentHuntPolicy() };

  console.log("📋 sim-policies.js loaded – registered testRoute, pureHunt, competentHunt");
})();




// @ts-check
