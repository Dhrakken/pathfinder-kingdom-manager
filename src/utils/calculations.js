// Kingdom Calculation Utilities
import { 
  getKingdomSize, 
  getSettlementType, 
  getControlDC as getBaseControlDC,
  getAbilityForSkill,
  getProficiencyBonus,
  PROFICIENCY_LEVELS,
} from '../data/reference.js';
import { STRUCTURES, getStructureById } from '../data/structures.js';

// Get ability modifier from score
export const getAbilityModifier = (score) => Math.floor((score - 10) / 2);

// Calculate skill modifier
export const calculateSkillModifier = (kingdom, skillName) => {
  const ability = getAbilityForSkill(skillName);
  if (!ability) return 0;
  
  const abilityMod = getAbilityModifier(kingdom.abilities[ability]);
  const proficiency = kingdom.skillProficiencies[skillName] || 'Untrained';
  const profBonus = getProficiencyBonus(proficiency, kingdom.level);
  const unrestPenalty = getUnrestPenalty(kingdom.unrest);
  const itemBonus = kingdom.bonuses?.itemBonuses?.[skillName] || 0;
  const circumstanceBonus = kingdom.bonuses?.circumstanceBonus || 0;
  const circumstancePenalty = kingdom.bonuses?.circumstancePenalty || 0;
  
  return abilityMod + profBonus + itemBonus + circumstanceBonus - circumstancePenalty - unrestPenalty;
};

export const getUnrestPenalty = (unrest) => {
  if (unrest >= 15) return 4;
  if (unrest >= 10) return 3;
  if (unrest >= 5) return 2;
  if (unrest >= 1) return 1;
  return 0;
};

export const calculateControlDC = (kingdom) => {
  const baseDC = getBaseControlDC(kingdom.level);
  const size = getKingdomSize(kingdom.hexes.length);
  return baseDC + (size?.controlDCMod || 0);
};

export const calculateResourceDiceCount = (kingdom) => {
  const baseCount = 4;
  const levelBonus = kingdom.level;
  const bonusDice = kingdom.bonuses?.bonusDice || 0;
  return baseCount + levelBonus + bonusDice;
};

export const getResourceDieType = (hexCount) => {
  const size = getKingdomSize(hexCount);
  return size?.resourceDie || 'd4';
};

export const calculateCommodityCapacity = (kingdom) => {
  const size = getKingdomSize(kingdom.hexes.length);
  const baseCapacity = size?.commodityCapacity || 4;
  
  const buildingBonuses = { Food: 0, Lumber: 0, Luxuries: 0, Ore: 0, Stone: 0 };
  
  for (const settlement of kingdom.settlements) {
    for (const blockKey of Object.keys(settlement.blocks)) {
      for (const lot of settlement.blocks[blockKey].lots) {
        if (lot?.structureId) {
          const structure = getStructureById(lot.structureId);
          if (structure) {
            if (structure.id === 'granary') buildingBonuses.Food += 1;
            if (structure.id === 'foundry') buildingBonuses.Ore += 1;
            if (structure.id === 'lumberyard') buildingBonuses.Lumber += 1;
            if (structure.id === 'stonemason') buildingBonuses.Stone += 1;
            if (structure.id === 'secure-warehouse') buildingBonuses.Luxuries += 1;
          }
        }
      }
    }
  }
  
  return {
    Food: baseCapacity + buildingBonuses.Food,
    Lumber: baseCapacity + buildingBonuses.Lumber,
    Luxuries: baseCapacity + buildingBonuses.Luxuries,
    Ore: baseCapacity + buildingBonuses.Ore,
    Stone: baseCapacity + buildingBonuses.Stone,
  };
};

export const calculateSettlementConsumption = (settlement) => {
  const type = getSettlementType(settlement.level);
  let consumption = type?.consumption || 0;
  
  for (const blockKey of Object.keys(settlement.blocks)) {
    for (const lot of settlement.blocks[blockKey].lots) {
      if (lot?.structureId) {
        const structure = getStructureById(lot.structureId);
        if (structure?.id === 'stockyard') consumption -= 1;
        if (structure?.id === 'mill' && hasWaterAdjacent(settlement, blockKey)) consumption -= 1;
      }
    }
  }
  
  if (settlement.infrastructure.sewerSystem) consumption -= 1;
  return Math.max(0, consumption);
};

const hasWaterAdjacent = (settlement, blockKey) => {
  const waterBorders = settlement.waterBorders || [];
  const adjacentToNorth = ['A', 'B', 'C'];
  const adjacentToSouth = ['G', 'H', 'I'];
  const adjacentToWest = ['A', 'D', 'G'];
  const adjacentToEast = ['C', 'F', 'I'];
  
  if (waterBorders.includes('north') && adjacentToNorth.includes(blockKey)) return true;
  if (waterBorders.includes('south') && adjacentToSouth.includes(blockKey)) return true;
  if (waterBorders.includes('west') && adjacentToWest.includes(blockKey)) return true;
  if (waterBorders.includes('east') && adjacentToEast.includes(blockKey)) return true;
  return false;
};

export const calculateTotalConsumption = (kingdom) => {
  let total = 0;
  for (const settlement of kingdom.settlements) {
    total += calculateSettlementConsumption(settlement);
  }
  return total;
};

export const calculateWorkSiteProduction = (kingdom) => {
  const production = { Food: 0, Lumber: 0, Ore: 0, Stone: 0 };
  
  for (const hex of kingdom.hexes) {
    if (hex.workSite) {
      switch (hex.workSite.type) {
        case 'farm': production.Food += hex.workSite.production || 1; break;
        case 'lumber-camp': production.Lumber += hex.workSite.production || 1; break;
        case 'mine': production.Ore += hex.workSite.production || 1; break;
        case 'quarry': production.Stone += hex.workSite.production || 1; break;
      }
    }
  }
  return production;
};

export const calculateSettlementLevel = (settlement) => {
  let totalLots = 0;
  let highestBuildingLevel = 0;
  
  for (const blockKey of Object.keys(settlement.blocks)) {
    for (const lot of settlement.blocks[blockKey].lots) {
      if (lot?.structureId && lot.structureId !== 'rubble') {
        totalLots += 1;
        const structure = getStructureById(lot.structureId);
        if (structure && structure.level > highestBuildingLevel) {
          highestBuildingLevel = structure.level;
        }
      }
    }
  }
  return Math.max(1, Math.min(highestBuildingLevel, Math.floor(totalLots / 2) + 1));
};

export const calculateMaxLeadershipActivities = (kingdom) => {
  let max = 2;
  const capital = kingdom.settlements.find(s => s.isCapital);
  if (capital) {
    const hasLeadershipBuilding = findBuildingInSettlement(capital, ['town-hall', 'castle', 'palace']);
    if (hasLeadershipBuilding) max = 3;
  }
  return max;
};

const findBuildingInSettlement = (settlement, structureIds) => {
  for (const blockKey of Object.keys(settlement.blocks)) {
    for (const lot of settlement.blocks[blockKey].lots) {
      if (lot?.structureId && structureIds.includes(lot.structureId)) return true;
    }
  }
  return false;
};

export const calculateItemBonusForActivity = (kingdom, activityName) => {
  let maxBonus = 0;
  for (const settlement of kingdom.settlements) {
    for (const blockKey of Object.keys(settlement.blocks)) {
      for (const lot of settlement.blocks[blockKey].lots) {
        if (lot?.structureId) {
          const structure = getStructureById(lot.structureId);
          if (structure?.itemBonus && structure.itemBonusTo?.includes(activityName)) {
            maxBonus = Math.max(maxBonus, structure.itemBonus);
          }
        }
      }
    }
  }
  return maxBonus;
};

export const rollDice = (count, sides) => {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  return { rolls, total: rolls.reduce((a, b) => a + b, 0) };
};

export const rollResourceDice = (kingdom) => {
  const count = calculateResourceDiceCount(kingdom);
  const dieType = getResourceDieType(kingdom.hexes.length);
  const sides = parseInt(dieType.replace('d', ''));
  return rollDice(count, sides);
};

export const determineCheckResult = (roll, dc, modifiers = 0) => {
  const total = roll + modifiers;
  const diff = total - dc;
  if (diff >= 10) return 'criticalSuccess';
  if (diff >= 0) return 'success';
  if (diff >= -10) return 'failure';
  return 'criticalFailure';
};

export const applyNaturalModifier = (result, naturalRoll) => {
  const order = ['criticalFailure', 'failure', 'success', 'criticalSuccess'];
  const currentIndex = order.indexOf(result);
  if (naturalRoll === 20) return order[Math.min(currentIndex + 1, 3)];
  if (naturalRoll === 1) return order[Math.max(currentIndex - 1, 0)];
  return result;
};

export const countVacantLeaders = (kingdom) => {
  const requiredRoles = ['ruler', 'counselor', 'general', 'emissary', 'magister', 'treasurer', 'viceroy', 'warden'];
  let vacant = 0;
  for (const role of requiredRoles) {
    const leader = kingdom.leaders.find(l => l.role === role);
    if (!leader || leader.isVacant) vacant += 1;
  }
  return vacant;
};
