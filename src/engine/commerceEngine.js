// ============================================
// COMMERCE ENGINE
// Handles the Commerce Phase of kingdom turns
// ============================================

import { getSizeData, getControlDC } from '../data/reference.js';
import { getSkillModifier, getSkillModifierBreakdown, performSkillCheck } from './activityEngine.js';

/**
 * Collect Taxes
 * Make a Trade check to collect taxes from citizens
 * The amount collected depends on degree of success
 */
export const collectTaxes = (state) => {
  const log = [];
  
  // Perform Trade check
  const result = performSkillCheck(state, 'Trade', 0, 'collect-taxes');
  
  let rpGained = 0;
  let unrestGained = 0;
  
  // Base tax income = kingdom level
  const baseTax = state.kingdom?.level || 1;
  
  switch (result.degree) {
    case 'criticalSuccess':
      rpGained = baseTax + 2;
      log.push(`Critical Success! Collected ${rpGained} RP in taxes (base ${baseTax} + 2 bonus)`);
      break;
    case 'success':
      rpGained = baseTax;
      log.push(`Success. Collected ${rpGained} RP in taxes`);
      break;
    case 'failure':
      rpGained = Math.max(1, Math.floor(baseTax / 2));
      log.push(`Failure. Only collected ${rpGained} RP in taxes (half)`);
      break;
    case 'criticalFailure':
      rpGained = 0;
      unrestGained = 1;
      log.push(`Critical Failure! No taxes collected, +1 Unrest from citizen anger`);
      break;
  }
  
  const newState = {
    ...state,
    resources: {
      ...state.resources,
      rp: (state.resources?.rp || 0) + rpGained,
    },
    unrest: (state.unrest || 0) + unrestGained,
    turn: {
      ...state.turn,
      taxesCollected: true,
      taxesResult: rpGained,
    },
  };
  
  return {
    state: newState,
    result,
    rpGained,
    unrestGained,
    log,
  };
};

/**
 * Trade Commodities
 * Buy or sell commodities for RP
 * 
 * Base rates (can be modified by structures/events):
 * - Food: 1 RP each
 * - Lumber: 2 RP each
 * - Ore: 2 RP each
 * - Stone: 2 RP each
 * - Luxuries: 4 RP each
 * 
 * Trade check affects rates:
 * - Crit Success: 50% better rates
 * - Success: Normal rates
 * - Failure: 25% worse rates
 * - Crit Failure: 50% worse rates + 1 Unrest
 */
export const COMMODITY_BASE_VALUES = {
  food: 1,
  lumber: 2,
  ore: 2,
  stone: 2,
  luxuries: 4,
};

export const tradeCommodities = (state, tradeType, commodity, amount) => {
  const log = [];
  
  if (!commodity || !amount || amount <= 0) {
    return { success: false, error: 'Invalid trade parameters' };
  }
  
  const commodityLower = commodity.toLowerCase();
  const baseValue = COMMODITY_BASE_VALUES[commodityLower];
  
  if (!baseValue) {
    return { success: false, error: `Unknown commodity: ${commodity}` };
  }
  
  // Perform Trade check
  const result = performSkillCheck(state, 'Trade', 0, 'trade-commodities');
  
  let rateModifier = 1.0;
  let unrestGained = 0;
  
  switch (result.degree) {
    case 'criticalSuccess':
      rateModifier = tradeType === 'sell' ? 1.5 : 0.75; // Better rates
      log.push(`Critical Success! Excellent trade terms`);
      break;
    case 'success':
      rateModifier = 1.0;
      log.push(`Success. Fair trade terms`);
      break;
    case 'failure':
      rateModifier = tradeType === 'sell' ? 0.75 : 1.25; // Worse rates
      log.push(`Failure. Poor trade terms`);
      break;
    case 'criticalFailure':
      rateModifier = tradeType === 'sell' ? 0.5 : 1.5; // Much worse rates
      unrestGained = 1;
      log.push(`Critical Failure! Terrible trade, +1 Unrest`);
      break;
  }
  
  const adjustedValue = Math.max(1, Math.round(baseValue * rateModifier));
  const totalRP = adjustedValue * amount;
  
  let newState = { ...state };
  const currentCommodity = state.resources?.[commodityLower] || 0;
  const currentRP = state.resources?.rp || 0;
  
  if (tradeType === 'sell') {
    if (currentCommodity < amount) {
      return { success: false, error: `Insufficient ${commodity} (have ${currentCommodity}, need ${amount})` };
    }
    
    newState = {
      ...newState,
      resources: {
        ...newState.resources,
        [commodityLower]: currentCommodity - amount,
        rp: currentRP + totalRP,
      },
    };
    
    log.push(`Sold ${amount} ${commodity} for ${totalRP} RP (${adjustedValue} RP each)`);
  } else {
    // Buy
    if (currentRP < totalRP) {
      return { success: false, error: `Insufficient RP (have ${currentRP}, need ${totalRP})` };
    }
    
    newState = {
      ...newState,
      resources: {
        ...newState.resources,
        [commodityLower]: currentCommodity + amount,
        rp: currentRP - totalRP,
      },
    };
    
    log.push(`Bought ${amount} ${commodity} for ${totalRP} RP (${adjustedValue} RP each)`);
  }
  
  newState.unrest = (newState.unrest || 0) + unrestGained;
  
  return {
    success: true,
    state: newState,
    result,
    tradeType,
    commodity,
    amount,
    totalRP,
    rateModifier,
    log,
  };
};

/**
 * Run the full commerce phase
 * - Collect taxes (automatic)
 * - Trading is optional (done via activities)
 */
export const runCommercePhase = (state) => {
  const allLogs = [];
  let currentState = state;
  
  // Step 1: Collect Taxes
  if (!state.turn?.taxesCollected) {
    const taxResult = collectTaxes(currentState);
    currentState = taxResult.state;
    allLogs.push({ step: 'Collect Taxes', logs: taxResult.log });
  }
  
  // Mark commerce as complete
  currentState = {
    ...currentState,
    turn: {
      ...currentState.turn,
      phaseComplete: {
        ...currentState.turn.phaseComplete,
        commerce: true,
      },
    },
  };
  
  allLogs.push({ step: 'Commerce', logs: ['Commerce Phase complete'] });
  
  return {
    state: currentState,
    logs: allLogs,
  };
};

/**
 * Get current commodity values with any modifiers
 */
export const getCommodityValues = (state) => {
  // TODO: Check for structures/effects that modify commodity values
  return { ...COMMODITY_BASE_VALUES };
};

/**
 * Calculate potential trade value
 */
export const calculateTradeValue = (commodity, amount, tradeType, rateModifier = 1.0) => {
  const baseValue = COMMODITY_BASE_VALUES[commodity.toLowerCase()] || 0;
  const adjustedValue = Math.max(1, Math.round(baseValue * rateModifier));
  return adjustedValue * amount;
};
