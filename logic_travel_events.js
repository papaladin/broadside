// logic_travel_events.js — Navigation, travel, and random events.
// Depends on logic_core.js and logic_economy_crew.js (must be loaded after).
// Exposed as window.L.

window.L = window.L || {};

(() => {
  const { PORTS, SHIPS, RANDOM_EVENTS } = window.D;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  TRAVEL & NAVIGATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const getSeaPosition = (route) => {
    if (!route || route.totalDays === 0) return route?.originPos || { x: 0, y: 0 };
    const progress = route.progressDays / route.totalDays;
    return {
      x: Math.round(route.originPos.x + (route.destinationPos.x - route.originPos.x) * progress),
      y: Math.round(route.originPos.y + (route.destinationPos.y - route.originPos.y) * progress),
    };
  };

  // Private: travel days between two coordinate points
  const travelDaysBetween = (posA, posB, state) => {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.hypot(dx, dy);

    const ship = window.L.getShipStats(state);
    let days = Math.ceil(distance / (ship.speed * 4));

    if (state.crew.morale < 50) days += 1;
    if (state.crew.morale < 30) days += 1;

    const angleToPort = Math.atan2(dy, dx) * 180 / Math.PI;
    const windAngleDiff = Math.abs(angleToPort - state.wind.angle) % 360;
    if (windAngleDiff < 45 || windAngleDiff > 315) days -= 1;
    else if (windAngleDiff > 135 && windAngleDiff < 225) days += 1;

    let baseDays = Math.max(1, days);

    if (baseDays > 4) {
      const reduction = window.L.getEquipmentEffect(state, "longVoyageDayReduction") || 0;
      baseDays = Math.max(1, baseDays - reduction);
    }

    const loadPct = window.L.getHoldLoadPct(state.hold?.items, window.L.getHoldCapacity(state));
    const mult = window.L.getHoldSpeedMultiplier(loadPct);
    return Math.max(1, Math.round(baseDays * mult));
  };

  const travelDays = (fromPort, toPort, state) => {
    const from = PORTS[fromPort];
    const to = PORTS[toPort];
    if (!from || !to) return Infinity;
    return travelDaysBetween(from, to, state);
  };

  const travelDaysFromPosition = (originPos, portKey, state) => {
    const port = PORTS[portKey];
    if (!port) return Infinity;
    return travelDaysBetween(originPos, port, state);
  };

  const canReachFrom = (origin, portKey, state, maxDays) => {
    const port = PORTS[portKey];
    if (!port) return false;
    if (port.hidden && !state.discoveredPorts?.includes(portKey)) return false;
    if (port.minHull) {
      const effectiveHull = window.L.getShipStats(state).maxHull;
      if (effectiveHull < port.minHull) return false;
    }
    let days;
    if (typeof origin === "string") {
      days = travelDays(origin, portKey, state);
    } else {
      days = travelDaysFromPosition(origin, portKey, state);
    }
    return days <= maxDays;
  };

  const canReach = (state, portKey) => {
    if (portKey === state.currentPort) return false;
    const shipMaxDays = SHIPS[state.ship?.type]?.maxDays ?? 10;
    return canReachFrom(state.currentPort, portKey, state, shipMaxDays);
  };

  const canReachFromPosition = (originPos, portKey, state, remainingEndurance) => {
    return canReachFrom(originPos, portKey, state, remainingEndurance);
  };

  const getReachablePortsFromSea = (state) => {
    const route = state.route;
    if (!route) return [];
    const seaPos = getSeaPosition(route);
    const remaining = (route.enduranceBudget || 0) - (route.enduranceSpent || 0);
    return Object.keys(PORTS).filter(portKey => {
      if (portKey === route.destinationPort) return false;
      if (PORTS[portKey]?.hidden && !state.discoveredPorts?.includes(portKey)) return false;
      return canReachFromPosition(seaPos, portKey, state, remaining);
    });
  };

  const getUnreachableReason = (state, portKey) => {
    if (portKey === state.currentPort) return null;
    const port = PORTS[portKey];
    if (!port) return "Unknown port";
    if (port.hidden && !state.discoveredPorts?.includes(portKey)) return null;
    if (port.minHull) {
      const effectiveHull = window.L.getShipStats(state).maxHull;
      if (effectiveHull < port.minHull) {
        return `Requires a heavier vessel (your ship: ${effectiveHull} hull, required: ${port.minHull}+)`;
      }
    }
    const days = travelDays(state.currentPort, portKey, state);
    const shipMaxDays = SHIPS[state.ship?.type]?.maxDays ?? 10;
    if (days > shipMaxDays) {
      return `${days}-day voyage exceeds your ship's range (${shipMaxDays} days)`;
    }
    return null;
  };

  const processStarvation = (state, prov, currentRoster) => {
    const roster = currentRoster || [];
    const daysWithoutFood = state.daysWithoutFood ?? 0;
    const daysWithoutWater = state.daysWithoutWater ?? 0;
    const FOOD_GRACE = 14;
    const WATER_GRACE = 3;
    let newDaysWithoutFood = daysWithoutFood;
    let newDaysWithoutWater = daysWithoutWater;
    const warningLogs = [];
    let deathLog = null;
    let newRoster = roster;

    if (prov.foodEmpty) newDaysWithoutFood += 1;
    else newDaysWithoutFood = 0;
    if (prov.waterEmpty) newDaysWithoutWater += 1;
    else newDaysWithoutWater = 0;

    if (newDaysWithoutFood === FOOD_GRACE - 1) {
      warningLogs.push("The crew grows gaunt. Without food, starvation is imminent.");
    }
    if (newDaysWithoutWater === WATER_GRACE - 1) {
      warningLogs.push("Tongues are swollen. The crew is desperate for fresh water.");
    }

    if (roster.length > 0) {
      const foodDeath = newDaysWithoutFood >= FOOD_GRACE;
      const waterDeath = newDaysWithoutWater >= WATER_GRACE;
      if (waterDeath || foodDeath) {
        const { newRoster: tempRoster, removed } = window.L.removeRandomCrew(roster, 1);
        if (removed.length > 0) {
          const name = `${removed[0].firstName} ${removed[0].lastName}`;
          if (waterDeath && foodDeath) deathLog = `Hunger and thirst claim a crew member. ${name} has died.`;
          else if (waterDeath) deathLog = `Thirst claims a crew member. ${name} has died.`;
          else deathLog = `Starvation claims a crew member. ${name} has died.`;
          newRoster = tempRoster;
        }
      }
    }
    return { daysWithoutFood: newDaysWithoutFood, daysWithoutWater: newDaysWithoutWater, warningLogs, deathLog, roster: newRoster };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENTS & PATROLS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const triggerRandomEvent = (state) => {
    const availableEvents = RANDOM_EVENTS.filter(event => !event.condition || event.condition(state));
    if (availableEvents.length === 0) return null;
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    if (Array.isArray(event.desc)) event.desc = event.desc[Math.floor(Math.random() * event.desc.length)];
    return { ...event };
  };

  const maybeRandomPatrol = (state) => {
    const port = PORTS[state.currentPort];
    if (!port || port.faction === "pirate") return false;
    const baseChance = 0.01;
    const infamyBonus = (state.infamy ?? 0) / 400;
    const alerts = state.factionAlerts || {};
    const originFaction = port.faction;
    const destFaction = state.destination ? PORTS[state.destination]?.faction : null;
    const relevantHeat = Math.max(alerts[originFaction] || 0, destFaction ? (alerts[destFaction] || 0) : 0);
    const originRep = state.reputation[state.currentPort] || 50;
    const destRep = state.destination ? (state.reputation[state.destination] || 50) : originRep;
    const avgRep = (originRep + destRep) / 2;
    const heatDampening = avgRep >= 70 ? 0.5 : avgRep >= 50 ? 0.75 : 1.0;
    const effectiveHeat = Math.floor(relevantHeat * heatDampening);
    const heatBonus = effectiveHeat * 0.03;
    const chance = Math.min(baseChance + infamyBonus + heatBonus, 0.40);
    return Math.random() < chance;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EXPOSE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Object.assign(window.L, {
    // Travel
    getSeaPosition,
    travelDaysBetween,
    travelDays,
    travelDaysFromPosition,
    canReachFrom,
    canReach,
    canReachFromPosition,
    getReachablePortsFromSea,
    getUnreachableReason,
    processStarvation,

    // Events
    triggerRandomEvent,
    maybeRandomPatrol,
  });
})();