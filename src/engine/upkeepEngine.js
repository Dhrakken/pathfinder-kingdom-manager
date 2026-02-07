// ============================================
// UPKEEP ENGINE
// Handles the Upkeep Phase of kingdom turns
// ============================================

import { getSizeData, getControlDC } from '../data/reference.js';
import { calculateTotalConsumption } from './structureEngine.js';
import { getConsumptionModFromFeats, getRuinThresholdModFromFeats, getBonusRPFromFeats, getResourceDieModFromFeats } from './featEngine.js';

/**
 * Step 1: Check for Leadership Vacancies
 * Each vacant role adds Unrest:
 * - Ruler vacant: +2 Unrest
 * - Other roles vacant: +1 Unrest each
 * - Invested leaders reduce vacancy penalty by 1 (to minimum 0)
 */
export const checkLeadershipVacancies = (state) => {
  const log = [];
  let unrestGain = 0;
  
  const leadership = state.leadership || [];
  
  for (const role of leadership) {
    const isVacant = !role.holder || role.holder.trim() === '';
    
    if (isVacant) {
      const penalty = role.id === 'ruler' ? 2 : 1;
      unrestGain += penalty;
      log.push(`${role.name} is vacant: +${penalty} Unrest`);
    }
  }
  
  if (unrestGain === 0) {
    log.push('All leadership roles are filled');
  }
  
  const newState = {
    ...state,
    unrest: Math.max(0, state.unrest + unrestGain),
  };
  
  return {
    state: newState,
    unrestGain,
    log,
  };
};

/**
 * Step 2: Check Ruin Thresholds
 * Each Ruin type has a threshold (default 10).
 * When Ruin equals or exceeds threshold:
 * - Reduce corresponding ability by 1
 * - Increase threshold by 1 (so it triggers at 11 next time)
 * - Gain 1d10 Unrest
 */
export const checkRuinThresholds = (state) => {
  const log = [];
  let newState = { ...state };
  let unrestGain = 0;
  
  const ruinAbilityMap = {
    'Corruption': 'Culture',
    'Crime': 'Economy',
    'Decay': 'Stability',
    'Strife': 'Loyalty',
  };
  
  const ruin = { ...state.ruin };
  const ruinThresholds = { ...(state.ruinThresholds || {}) };
  const abilities = { ...state.abilities };
  
  const ruinThresholdMod = getRuinThresholdModFromFeats(state);
  
  for (const [ruinType, currentValue] of Object.entries(ruin)) {
    const threshold = (ruinThresholds[ruinType] || 10) + ruinThresholdMod;
    
    if (currentValue >= threshold) {
      // Reduce corresponding ability
      const ability = ruinAbilityMap[ruinType];
      if (ability && abilities[ability] > 0) {
        abilities[ability] = abilities[ability] - 1;
        log.push(`${ruinType} exceeded threshold (${threshold})! ${ability} reduced to ${abilities[ability]}`);
      }
      
      // Increase threshold
      ruinThresholds[ruinType] = threshold + 1;
      log.push(`${ruinType} threshold increased to ${ruinThresholds[ruinType]}`);
      
      // Gain 1d10 Unrest
      const unrestRoll = Math.floor(Math.random() * 10) + 1;
      unrestGain += unrestRoll;
      log.push(`Rolled ${unrestRoll} Unrest from ${ruinType} overflow`);
    }
  }
  
  if (log.length === 0) {
    log.push('No Ruin thresholds exceeded');
  }
  
  newState = {
    ...newState,
    ruin,
    ruinThresholds,
    abilities,
    unrest: Math.max(0, newState.unrest + unrestGain),
  };
  
  return {
    state: newState,
    unrestGain,
    log,
  };
};

/**
 * Step 3: Roll Resource Dice
 * Roll (Kingdom Level + 4) resource dice of the size determined by kingdom size
 * Size determines die: Territory=d4, Province=d6, State=d8, Country=d10, Dominion=d12
 */
export const rollResourceDice = (state) => {
  const log = [];
  
  const level = state.kingdom?.level || 1;
  const hexes = state.kingdom?.hexes || 1;
  const sizeData = getSizeData(hexes);
  
  const diceCount = level + 4;
  const dieSteps = [4, 6, 8, 10, 12];
  const baseDieIndex = dieSteps.indexOf(sizeData.die);
  const dieModFromFeats = getResourceDieModFromFeats(state);
  const adjustedDieIndex = Math.min(baseDieIndex + dieModFromFeats, dieSteps.length - 1);
  const dieSides = dieSteps[adjustedDieIndex] || sizeData.die;
  
  // Roll the dice
  const rolls = [];
  for (let i = 0; i < diceCount; i++) {
    rolls.push(Math.floor(Math.random() * dieSides) + 1);
  }
  const total = rolls.reduce((a, b) => a + b, 0);
  
  // Add bonus RP from feats (e.g., Capital Investment)
  const bonusRP = getBonusRPFromFeats(state);
  
  if (dieModFromFeats > 0) {
    log.push(`Resource die upgraded to d${dieSides} (Vast Territory feat)`);
  }
  log.push(`Rolled ${diceCount}d${dieSides}: [${rolls.join(', ')}] = ${total} RP`);
  if (bonusRP > 0) {
    log.push(`+${bonusRP} bonus RP from feats`);
  }
  
  const totalWithBonus = total + bonusRP;
  
  const newState = {
    ...state,
    resources: {
      ...state.resources,
      rp: (state.resources?.rp || 0) + totalWithBonus,
    },
    turn: {
      ...state.turn,
      resourceDiceResult: total,
      resourceDiceRolls: rolls,
    },
  };
  
  return {
    state: newState,
    rolls,
    total,
    log,
  };
};

/**
 * Step 4: Collect from Work Sites
 * Each work site type produces its commodity:
 * - Farmland: +1 Food per farm
 * - Lumber Camp: +1 Lumber per camp
 * - Mine: +1 Ore per mine
 * - Quarry: +1 Stone per quarry
 */
export const collectFromWorkSites = (state) => {
  const log = [];
  
  const workSites = state.workSites || {};
  const resources = { ...state.resources };
  
  const collections = {
    farmlands: { commodity: 'food', count: workSites.farmlands || 0 },
    lumberCamps: { commodity: 'lumber', count: workSites.lumberCamps || 0 },
    mines: { commodity: 'ore', count: workSites.mines || 0 },
    quarries: { commodity: 'stone', count: workSites.quarries || 0 },
  };
  
  for (const [siteType, { commodity, count }] of Object.entries(collections)) {
    if (count > 0) {
      resources[commodity] = (resources[commodity] || 0) + count;
      log.push(`+${count} ${capitalize(commodity)} from ${count} ${siteType.replace(/([A-Z])/g, ' $1').trim()}`);
    }
  }
  
  if (log.length === 0) {
    log.push('No work sites to collect from');
  }
  
  const newState = {
    ...state,
    resources,
  };
  
  return {
    state: newState,
    log,
  };
};

/**
 * Step 5: Pay Consumption
 * The kingdom must pay its consumption in Food.
 * Consumption is calculated dynamically from settlements and structures.
 * If insufficient Food:
 * - Set Food to 0
 * - Gain 1d4 Unrest per missing Food
 */
export const payConsumption = (state) => {
  const log = [];
  
  // Calculate consumption dynamically from settlements, modified by feats
  const baseConsumption = calculateTotalConsumption(state);
  const consumptionMod = getConsumptionModFromFeats(state);
  const consumption = Math.max(0, baseConsumption + consumptionMod);
  const food = state.resources?.food || 0;
  const resources = { ...state.resources };
  let unrestGain = 0;
  
  if (consumption === 0) {
    log.push('Consumption is 0, nothing to pay');
  } else if (food >= consumption) {
    resources.food = food - consumption;
    log.push(`Paid ${consumption} Food for consumption (${resources.food} remaining)`);
  } else {
    const shortage = consumption - food;
    resources.food = 0;
    
    // Roll 1d4 per missing food
    for (let i = 0; i < shortage; i++) {
      unrestGain += Math.floor(Math.random() * 4) + 1;
    }
    
    log.push(`Food shortage! Missing ${shortage} Food`);
    log.push(`+${unrestGain} Unrest from starvation`);
  }
  
  const newState = {
    ...state,
    consumption, // Update the stored consumption value
    resources,
    unrest: Math.max(0, (state.unrest || 0) + unrestGain),
  };
  
  return {
    state: newState,
    consumption,
    unrestGain,
    shortage: consumption > food ? consumption - food : 0,
    log,
  };
};

/**
 * Run full upkeep phase
 */
export const runFullUpkeep = (state) => {
  const allLogs = [];
  let currentState = state;
  
  // Step 1: Leadership vacancies
  const vacancyResult = checkLeadershipVacancies(currentState);
  currentState = vacancyResult.state;
  allLogs.push({ step: 'Leadership', logs: vacancyResult.log });
  
  // Step 2: Ruin thresholds
  const ruinResult = checkRuinThresholds(currentState);
  currentState = ruinResult.state;
  allLogs.push({ step: 'Ruin', logs: ruinResult.log });
  
  // Step 3: Resource dice
  const resourceResult = rollResourceDice(currentState);
  currentState = resourceResult.state;
  allLogs.push({ step: 'Resources', logs: resourceResult.log });
  
  // Step 4: Work sites
  const workSiteResult = collectFromWorkSites(currentState);
  currentState = workSiteResult.state;
  allLogs.push({ step: 'Work Sites', logs: workSiteResult.log });
  
  // Step 5: Consumption
  const consumptionResult = payConsumption(currentState);
  currentState = consumptionResult.state;
  allLogs.push({ step: 'Consumption', logs: consumptionResult.log });
  
  // Mark upkeep as complete
  currentState = {
    ...currentState,
    turn: {
      ...currentState.turn,
      phaseComplete: {
        ...currentState.turn.phaseComplete,
        upkeep: true,
      },
    },
  };
  
  return {
    state: currentState,
    logs: allLogs,
  };
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

/**
 * Calculate leadership bonus for a skill based on invested leaders
 * An invested leader in a role that governs an ability provides +1 to skills under that ability
 */
export const getInvestedLeaderBonus = (state, skillName) => {
  // Map abilities to their governing leadership roles
  const abilityToRoles = {
    'Culture': ['counselor', 'magister'],
    'Economy': ['treasurer', 'viceroy'],
    'Loyalty': ['general', 'emissary'],
    'Stability': ['warden'],
  };
  
  // Get the ability for this skill
  const skillAbilityMap = {
    Arts: 'Culture', Folklore: 'Culture', Magic: 'Culture', Scholarship: 'Culture',
    Boating: 'Economy', Engineering: 'Economy', Exploration: 'Economy', Industry: 'Economy', Trade: 'Economy',
    Intrigue: 'Loyalty', Politics: 'Loyalty', Statecraft: 'Loyalty', Warfare: 'Loyalty',
    Agriculture: 'Stability', Defense: 'Stability', Wilderness: 'Stability',
  };
  
  const ability = skillAbilityMap[skillName];
  if (!ability) return 0;
  
  const relevantRoles = abilityToRoles[ability] || [];
  const leadership = state.leadership || [];
  
  // Check if any relevant role has an invested leader
  let bonus = 0;
  for (const role of leadership) {
    if (relevantRoles.includes(role.id) && role.holder && role.invested) {
      bonus += 1;
      break; // Only +1 per ability, even with multiple invested roles
    }
  }
  
  // Ruler is special - if invested, +1 to any one skill per turn (not implemented here)
  
  return bonus;
};
