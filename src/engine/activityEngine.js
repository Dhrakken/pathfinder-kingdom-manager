// ============================================
// ACTIVITY ENGINE
// Processes kingdom activities and applies effects
// ============================================

import { getActivityById } from '../data/activities.js';
import { getControlDC, getSizeData, getProficiencyBonus, getAbilityForSkill } from '../data/reference.js';
import { getInvestedLeaderBonus } from './upkeepEngine.js';

// Dice utilities
const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;
const rollDice = (count, sides) => Array(count).fill(0).map(() => rollDie(sides));
const sumDice = (rolls) => rolls.reduce((a, b) => a + b, 0);

// Parse dice notation like "1d4" and roll it
const rollDiceNotation = (notation) => {
  if (typeof notation === 'number') return notation;
  const match = notation.match(/(\d+)d(\d+)/);
  if (!match) return parseInt(notation) || 0;
  const [, count, sides] = match;
  return sumDice(rollDice(parseInt(count), parseInt(sides)));
};

/**
 * Calculate skill modifier for a kingdom skill check
 */
export const getSkillModifier = (state, skillName) => {
  const ability = getAbilityForSkill(skillName);
  if (!ability) return 0;
  
  const abilityScore = state.abilities[ability] || 10;
  const abilityMod = Math.floor((abilityScore - 10) / 2);
  
  const proficiency = state.skillProficiencies?.[skillName] || 'Untrained';
  const profBonus = getProficiencyBonus(proficiency, state.kingdom.level);
  
  // Unrest penalty
  const unrestPenalty = state.unrest >= 15 ? 4 : state.unrest >= 10 ? 3 : state.unrest >= 5 ? 2 : state.unrest >= 1 ? 1 : 0;
  
  // Invested leader bonus
  const leaderBonus = getInvestedLeaderBonus(state, skillName);
  
  // TODO: Add item bonuses from structures
  // TODO: Add circumstance bonuses/penalties
  
  return abilityMod + profBonus - unrestPenalty + leaderBonus;
};

/**
 * Perform a skill check and determine degree of success
 */
export const performSkillCheck = (state, skillName, dcModifier = 0) => {
  const sizeData = getSizeData(state.kingdom.hexes);
  const baseDC = getControlDC(state.kingdom.level) + sizeData.dcMod + dcModifier;
  
  const modifier = getSkillModifier(state, skillName);
  const roll = rollDie(20);
  const total = roll + modifier;
  
  // Determine degree of success
  let degree;
  if (roll === 20 && total >= baseDC) {
    degree = 'criticalSuccess'; // Nat 20 that succeeds = crit
  } else if (roll === 1 && total < baseDC + 10) {
    degree = 'criticalFailure'; // Nat 1 that doesn't crit succeed = crit fail
  } else if (total >= baseDC + 10) {
    degree = 'criticalSuccess';
  } else if (total >= baseDC) {
    degree = 'success';
  } else if (total <= baseDC - 10) {
    degree = 'criticalFailure';
  } else {
    degree = 'failure';
  }
  
  return { roll, modifier, total, dc: baseDC, degree };
};

/**
 * Validate activity prerequisites
 * Returns { valid: boolean, error?: string }
 */
export const validatePrerequisite = (state, activity, inputs = {}) => {
  if (!activity.prerequisite) return { valid: true };
  
  const hexMap = state.hexMap || {};
  const hexCoord = inputs.hexCoord?.toLowerCase();
  const hex = hexCoord ? hexMap[hexCoord] : null;
  
  switch (activity.prerequisite) {
    case 'adjacentExploredHex':
      // Hex must be explored but not claimed, and adjacent to a claimed hex
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status === 'claimed') return { valid: false, error: 'Hex is already claimed' };
      if (hex.status !== 'explored') return { valid: false, error: 'Hex must be explored first' };
      
      // Check adjacency to any claimed hex
      const claimedHexes = Object.keys(hexMap).filter(k => hexMap[k].status === 'claimed');
      const isAdjacent = claimedHexes.some(claimed => areHexesAdjacent(claimed, hexCoord));
      if (!isAdjacent) return { valid: false, error: 'Hex must be adjacent to claimed territory' };
      return { valid: true };
      
    case 'ownedHex':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      return { valid: true };
      
    case 'ownedHexNoSettlement':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      if (hex.settlement) return { valid: false, error: 'Hex already has a settlement' };
      return { valid: true };
      
    case 'ownedHexFarmable':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      if (!['plains', 'hills'].includes(hex.terrain)) return { valid: false, error: 'Farmland requires plains or hills terrain' };
      if (hex.workSite) return { valid: false, error: 'Hex already has a work site' };
      return { valid: true };
      
    case 'ownedHexMinable':
    case 'ownedHexQuarryable':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      if (!['hills', 'mountain'].includes(hex.terrain)) return { valid: false, error: 'Requires hills or mountain terrain' };
      if (hex.workSite) return { valid: false, error: 'Hex already has a work site' };
      return { valid: true };
      
    case 'ownedHexForest':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      if (hex.terrain !== 'forest') return { valid: false, error: 'Requires forest terrain' };
      if (hex.workSite) return { valid: false, error: 'Hex already has a work site' };
      return { valid: true };
      
    case 'ownedHexWithFarm':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      if (hex.workSite !== 'farm') return { valid: false, error: 'Hex must have farmland' };
      return { valid: true };
      
    case 'ownedHexWaterAdjacent':
      if (!hex) return { valid: false, error: 'Invalid hex coordinate' };
      if (hex.status !== 'claimed') return { valid: false, error: 'You must own this hex' };
      // Check if adjacent to water
      const allHexes = Object.keys(hexMap);
      const adjacentWater = allHexes.some(k => 
        hexMap[k].terrain === 'water' && areHexesAdjacent(k, hexCoord)
      );
      if (!adjacentWater && hex.terrain !== 'water') {
        return { valid: false, error: 'Hex must be adjacent to water' };
      }
      return { valid: true };
      
    case 'hasMultipleSettlements':
      if ((state.settlements?.length || 0) < 2) {
        return { valid: false, error: 'Need at least 2 settlements to relocate capital' };
      }
      return { valid: true };
      
    default:
      return { valid: true };
  }
};

/**
 * Check if two hex coordinates are adjacent (pointy-top hex grid)
 */
const areHexesAdjacent = (coord1, coord2) => {
  // Parse coordinates like "c19" into column letter and row number
  const parse = (coord) => {
    const match = coord.toLowerCase().match(/([a-z]+)(\d+)/);
    if (!match) return null;
    const col = match[1].charCodeAt(0) - 'a'.charCodeAt(0);
    const row = parseInt(match[2]);
    return { col, row };
  };
  
  const h1 = parse(coord1);
  const h2 = parse(coord2);
  if (!h1 || !h2) return false;
  
  const dc = h2.col - h1.col;
  const dr = h2.row - h1.row;
  
  // Pointy-top hex adjacency (offset coordinates)
  // Even columns have different adjacency than odd columns
  const isEvenCol = h1.col % 2 === 0;
  
  const adjacentOffsets = isEvenCol
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  
  return adjacentOffsets.some(([oc, or]) => dc === oc && dr === or);
};

/**
 * Apply effects from an activity result
 * Returns the new state and a log of what happened
 */
export const applyActivityEffects = (state, activity, degree, inputs = {}) => {
  const effects = activity.effects[degree] || [];
  let newState = { ...state };
  const log = [];
  
  for (const effect of effects) {
    const result = applySingleEffect(newState, effect, inputs);
    newState = result.state;
    if (result.log) log.push(result.log);
  }
  
  return { state: newState, log };
};

/**
 * Apply a single effect and return new state + log message
 */
const applySingleEffect = (state, effect, inputs) => {
  switch (effect.type) {
    case 'unrest': {
      const delta = rollDiceNotation(effect.delta);
      const newUnrest = Math.max(0, state.unrest + delta);
      return {
        state: { ...state, unrest: newUnrest },
        log: delta > 0 ? `+${delta} Unrest` : `${delta} Unrest`,
      };
    }
    
    case 'fame': {
      const delta = rollDiceNotation(effect.delta);
      const newFame = Math.max(0, (state.kingdom.fame || 0) + delta);
      return {
        state: { ...state, kingdom: { ...state.kingdom, fame: newFame } },
        log: delta > 0 ? `+${delta} Fame` : `${delta} Fame`,
      };
    }
    
    case 'infamy': {
      const delta = rollDiceNotation(effect.delta);
      const newInfamy = Math.max(0, (state.kingdom.infamy || 0) + delta);
      return {
        state: { ...state, kingdom: { ...state.kingdom, infamy: newInfamy } },
        log: delta > 0 ? `+${delta} Infamy` : `${delta} Infamy`,
      };
    }
    
    case 'xp': {
      const delta = rollDiceNotation(effect.delta);
      const newXP = (state.kingdom.xp || 0) + delta;
      return {
        state: { ...state, kingdom: { ...state.kingdom, xp: newXP } },
        log: `+${delta} XP`,
      };
    }
    
    case 'rp': {
      const delta = rollDiceNotation(effect.delta);
      const newRP = Math.max(0, (state.resources?.rp || 0) + delta);
      return {
        state: { ...state, resources: { ...state.resources, rp: newRP } },
        log: delta > 0 ? `+${delta} RP` : `${delta} RP`,
      };
    }
    
    case 'ruin': {
      const delta = rollDiceNotation(effect.delta);
      const ruinType = effect.ruinType;
      const currentRuin = state.ruin?.[ruinType] || 0;
      const newRuin = Math.max(0, currentRuin + delta);
      return {
        state: { ...state, ruin: { ...state.ruin, [ruinType]: newRuin } },
        log: delta > 0 ? `+${delta} ${ruinType}` : `${delta} ${ruinType}`,
      };
    }
    
    case 'commodity': {
      const delta = rollDiceNotation(effect.delta);
      const commodity = effect.commodity;
      const current = state.resources?.[commodity] || 0;
      const newAmount = Math.max(0, current + delta);
      return {
        state: { ...state, resources: { ...state.resources, [commodity]: newAmount } },
        log: delta > 0 ? `+${delta} ${capitalize(commodity)}` : `${delta} ${capitalize(commodity)}`,
      };
    }
    
    case 'claimHex': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      if (!hexCoord) return { state, log: null };
      
      const currentHex = state.hexMap?.[hexCoord] || { coord: hexCoord };
      const playerFaction = Object.values(state.factions || {}).find(f => f.isPlayer);
      const factionId = playerFaction?.id || '1';
      
      const updatedHex = {
        ...currentHex,
        status: 'claimed',
        faction: factionId,
      };
      
      const newHexCount = (state.kingdom.hexes || 0) + 1;
      
      return {
        state: {
          ...state,
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
          kingdom: { ...state.kingdom, hexes: newHexCount },
        },
        log: `Claimed hex ${hexCoord.toUpperCase()}`,
      };
    }
    
    case 'abandonHex': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      if (!hexCoord) return { state, log: null };
      
      const currentHex = state.hexMap?.[hexCoord];
      if (!currentHex) return { state, log: null };
      
      const updatedHex = {
        ...currentHex,
        status: 'explored',
        faction: null,
        workSite: null,
      };
      
      const newHexCount = Math.max(0, (state.kingdom.hexes || 0) - 1);
      
      return {
        state: {
          ...state,
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
          kingdom: { ...state.kingdom, hexes: newHexCount },
        },
        log: `Abandoned hex ${hexCoord.toUpperCase()}`,
      };
    }
    
    case 'workSite': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      if (!hexCoord) return { state, log: null };
      
      const currentHex = state.hexMap?.[hexCoord];
      if (!currentHex) return { state, log: null };
      
      const siteType = effect.siteType;
      const updatedHex = {
        ...currentHex,
        workSite: siteType,
      };
      
      // Update work site counts
      const siteKey = {
        'farm': 'farmlands',
        'lumber': 'lumberCamps',
        'mine': 'mines',
        'quarry': 'quarries',
      }[siteType] || siteType;
      
      const currentCount = state.workSites?.[siteKey] || 0;
      
      return {
        state: {
          ...state,
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
          workSites: { ...state.workSites, [siteKey]: currentCount + 1 },
        },
        log: `Established ${siteType} at ${hexCoord.toUpperCase()}${effect.bonus ? ' (bonus production)' : ''}`,
      };
    }
    
    case 'addRoad': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      if (!hexCoord) return { state, log: null };
      
      const currentHex = state.hexMap?.[hexCoord];
      if (!currentHex) return { state, log: null };
      
      const updatedHex = {
        ...currentHex,
        roads: true,
      };
      
      return {
        state: {
          ...state,
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
        },
        log: `Built roads in ${hexCoord.toUpperCase()}`,
      };
    }
    
    case 'fortifyHex': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      if (!hexCoord) return { state, log: null };
      
      const currentHex = state.hexMap?.[hexCoord];
      if (!currentHex) return { state, log: null };
      
      const updatedHex = {
        ...currentHex,
        fortified: true,
        defenseBonus: (currentHex.defenseBonus || 0) + (effect.bonus || 1),
      };
      
      return {
        state: {
          ...state,
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
        },
        log: `Fortified ${hexCoord.toUpperCase()} (+${effect.bonus || 1} Defense)`,
      };
    }
    
    case 'clearHex': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      if (!hexCoord) return { state, log: null };
      
      const currentHex = state.hexMap?.[hexCoord];
      if (!currentHex) return { state, log: null };
      
      const updatedHex = {
        ...currentHex,
        hazards: null,
        cleared: true,
      };
      
      return {
        state: {
          ...state,
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
        },
        log: `Cleared hazards from ${hexCoord.toUpperCase()}`,
      };
    }
    
    case 'establishSettlement': {
      const hexCoord = inputs.hexCoord?.toLowerCase();
      const settlementName = inputs.settlementName || 'New Settlement';
      if (!hexCoord) return { state, log: null };
      
      const newSettlement = {
        id: `settlement-${Date.now()}`,
        name: settlementName,
        hexCoordinate: hexCoord,
        isCapital: (state.settlements?.length || 0) === 0,
        level: 1,
        type: 'Village',
        blocks: 1,
        structures: [],
      };
      
      const currentHex = state.hexMap?.[hexCoord] || {};
      const updatedHex = {
        ...currentHex,
        settlement: settlementName,
      };
      
      return {
        state: {
          ...state,
          settlements: [...(state.settlements || []), newSettlement],
          hexMap: { ...state.hexMap, [hexCoord]: updatedHex },
        },
        log: `Established settlement: ${settlementName}`,
      };
    }
    
    case 'relocateCapital': {
      const settlementId = inputs.settlementId;
      if (!settlementId) return { state, log: null };
      
      const updatedSettlements = (state.settlements || []).map(s => ({
        ...s,
        isCapital: s.id === settlementId,
      }));
      
      const newCapital = updatedSettlements.find(s => s.isCapital);
      
      return {
        state: {
          ...state,
          settlements: updatedSettlements,
          kingdom: { ...state.kingdom, capital: newCapital?.name || state.kingdom.capital },
        },
        log: `Relocated capital to ${newCapital?.name}`,
      };
    }
    
    case 'special':
      // Special effects are handled by custom logic in the component
      return { state, log: `[${effect.key}]` };
    
    default:
      return { state, log: null };
  }
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Execute a full activity
 * Returns { success, state, checkResult, effectLog, error }
 */
export const executeActivity = (state, activityId, inputs = {}) => {
  const activity = getActivityById(activityId);
  if (!activity) {
    return { success: false, error: 'Activity not found' };
  }
  
  // Check prerequisites
  const prereqCheck = validatePrerequisite(state, activity, inputs);
  if (!prereqCheck.valid) {
    return { success: false, error: prereqCheck.error };
  }
  
  // Check RP cost
  const rpCost = activity.rpCost || 0;
  if (rpCost > 0 && (state.resources?.rp || 0) < rpCost) {
    return { success: false, error: `Insufficient RP (need ${rpCost}, have ${state.resources?.rp || 0})` };
  }
  
  // Deduct RP cost upfront
  let workingState = { ...state };
  if (rpCost > 0) {
    workingState = {
      ...workingState,
      resources: { ...workingState.resources, rp: workingState.resources.rp - rpCost },
    };
  }
  
  // Perform skill check (skip for skill: 'none')
  let checkResult = null;
  let degree = 'success';
  
  if (activity.skill && activity.skill !== 'none' && activity.skill !== 'varies') {
    checkResult = performSkillCheck(workingState, activity.skill);
    degree = checkResult.degree;
    
    // Refund RP on failure if activity specifies
    if (activity.refundOnFailure && (degree === 'failure' || degree === 'criticalFailure')) {
      workingState = {
        ...workingState,
        resources: { ...workingState.resources, rp: workingState.resources.rp + rpCost },
      };
    }
  }
  
  // Apply effects
  const { state: finalState, log: effectLog } = applyActivityEffects(workingState, activity, degree, inputs);
  
  return {
    success: true,
    state: finalState,
    checkResult,
    degree,
    effectLog,
    rpCost: (degree === 'failure' || degree === 'criticalFailure') && activity.refundOnFailure ? 0 : rpCost,
  };
};
