// ============================================
// STRUCTURE ENGINE
// Calculate bonuses and effects from buildings
// ============================================

import { STRUCTURES, getStructureById } from '../data/structures.js';
import { getAbilityForSkill } from '../data/reference.js';

/**
 * Get the highest item bonus for a specific activity from all settlements
 * Item bonuses don't stack - use the highest one
 */
export const getItemBonusForActivity = (state, activityId) => {
  const settlements = state.settlements || [];
  let highestBonus = 0;
  let bonusSource = null;
  
  for (const settlement of settlements) {
    const structures = settlement.structures || [];
    
    for (const structureId of structures) {
      const structure = getStructureById(structureId);
      if (!structure) continue;
      
      // Check if this structure provides a bonus to this activity
      if (structure.itemBonusTo && structure.itemBonus) {
        const bonusTarget = structure.itemBonusTo.toLowerCase();
        const activityName = activityId.toLowerCase().replace(/-/g, ' ');
        
        // Direct activity match
        if (bonusTarget.includes(activityName) || activityName.includes(bonusTarget.replace(' checks', ''))) {
          if (structure.itemBonus > highestBonus) {
            highestBonus = structure.itemBonus;
            bonusSource = `${structure.name} in ${settlement.name}`;
          }
        }
      }
    }
  }
  
  return { bonus: highestBonus, source: bonusSource };
};

/**
 * Get the highest item bonus for a skill check from all settlements
 * Used for general skill checks (not activity-specific)
 */
export const getItemBonusForSkill = (state, skillName) => {
  const settlements = state.settlements || [];
  let highestBonus = 0;
  let bonusSource = null;
  
  // Some structures give bonuses to all checks of an ability
  const ability = getAbilityForSkill(skillName);
  
  for (const settlement of settlements) {
    const structures = settlement.structures || [];
    
    for (const structureId of structures) {
      const structure = getStructureById(structureId);
      if (!structure) continue;
      
      if (structure.itemBonusTo && structure.itemBonus) {
        const bonusTarget = structure.itemBonusTo.toLowerCase();
        
        // Check for ability-wide bonus (e.g., "Economy checks", "Industry")
        if (ability && (bonusTarget.includes(ability.toLowerCase()) || bonusTarget === skillName.toLowerCase())) {
          if (structure.itemBonus > highestBonus) {
            highestBonus = structure.itemBonus;
            bonusSource = `${structure.name} in ${settlement.name}`;
          }
        }
        
        // Check for skill-specific bonus
        if (bonusTarget === skillName.toLowerCase()) {
          if (structure.itemBonus > highestBonus) {
            highestBonus = structure.itemBonus;
            bonusSource = `${structure.name} in ${settlement.name}`;
          }
        }
      }
    }
  }
  
  return { bonus: highestBonus, source: bonusSource };
};

/**
 * Calculate total consumption for all settlements
 */
export const calculateTotalConsumption = (state) => {
  const settlements = state.settlements || [];
  let totalConsumption = 0;
  let reductions = 0;
  
  for (const settlement of settlements) {
    // Base consumption from settlement size
    const blocks = settlement.blocks || 1;
    let settlementConsumption = 0;
    
    if (blocks <= 4) settlementConsumption = 1; // Village
    else if (blocks <= 8) settlementConsumption = 2; // Town
    else if (blocks <= 16) settlementConsumption = 4; // City
    else settlementConsumption = 6; // Metropolis
    
    totalConsumption += settlementConsumption;
    
    // Check for consumption-reducing structures
    const structures = settlement.structures || [];
    for (const structureId of structures) {
      const structure = getStructureById(structureId);
      if (!structure) continue;
      
      if (structureId === 'herbalist') {
        reductions += 1;
      }
      if (structureId === 'mill') {
        // Mill only reduces if adjacent to farmland (simplified: just check if kingdom has farms)
        if ((state.workSites?.farmlands || 0) > 0) {
          reductions += 1;
        }
      }
    }
  }
  
  return Math.max(0, totalConsumption - reductions);
};

/**
 * Calculate total commodity storage capacity
 */
export const calculateStorageCapacity = (state) => {
  const settlements = state.settlements || [];
  const hexCount = state.kingdom?.hexes || 1;
  
  // Base storage from kingdom size
  let baseStorage = 4; // Territory
  if (hexCount >= 10) baseStorage = 8; // Province
  if (hexCount >= 25) baseStorage = 12; // State
  if (hexCount >= 50) baseStorage = 16; // Country
  if (hexCount >= 100) baseStorage = 20; // Dominion
  
  const storage = {
    food: baseStorage,
    lumber: baseStorage,
    luxuries: baseStorage,
    ore: baseStorage,
    stone: baseStorage,
  };
  
  // Add storage from structures
  for (const settlement of settlements) {
    const structures = settlement.structures || [];
    for (const structureId of structures) {
      if (structureId === 'granary') {
        storage.food += 1;
      }
      if (structureId === 'lumberyard') {
        storage.lumber += 2;
      }
    }
  }
  
  return storage;
};

/**
 * Calculate leadership activity limit per turn
 * Base is 2, Town Hall/Castle/Palace increase it
 */
export const calculateLeadershipActivities = (state) => {
  const settlements = state.settlements || [];
  let limit = 2; // Base
  
  for (const settlement of settlements) {
    const structures = settlement.structures || [];
    for (const structureId of structures) {
      if (structureId === 'town-hall') limit = Math.max(limit, 3);
      if (structureId === 'castle') limit = Math.max(limit, 3);
      if (structureId === 'palace') limit = Math.max(limit, 3);
    }
  }
  
  return limit;
};

/**
 * Get all structure effects summary for a settlement
 */
export const getSettlementEffectsSummary = (settlement) => {
  const effects = [];
  const structures = settlement.structures || [];
  
  for (const structureId of structures) {
    const structure = getStructureById(structureId);
    if (!structure) continue;
    
    if (structure.effects) {
      effects.push({
        structure: structure.name,
        effect: structure.effects,
      });
    }
  }
  
  return effects;
};

/**
 * Calculate settlement level from blocks
 */
export const getSettlementLevel = (blocks) => {
  if (blocks <= 4) return { level: 1, type: 'Village' };
  if (blocks <= 8) return { level: 2, type: 'Town' };
  if (blocks <= 16) return { level: 3, type: 'City' };
  return { level: 4, type: 'Metropolis' };
};

/**
 * Get all item bonuses in the kingdom organized by activity/skill
 */
export const getAllItemBonuses = (state) => {
  const bonuses = {};
  const settlements = state.settlements || [];
  
  for (const settlement of settlements) {
    const structures = settlement.structures || [];
    
    for (const structureId of structures) {
      const structure = getStructureById(structureId);
      if (!structure || !structure.itemBonusTo || !structure.itemBonus) continue;
      
      const key = structure.itemBonusTo;
      if (!bonuses[key] || bonuses[key].bonus < structure.itemBonus) {
        bonuses[key] = {
          bonus: structure.itemBonus,
          source: structure.name,
          settlement: settlement.name,
        };
      }
    }
  }
  
  return bonuses;
};
