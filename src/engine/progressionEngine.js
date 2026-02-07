// ============================================
// PROGRESSION ENGINE
// XP, Leveling, and Kingdom Advancement
// ============================================

import { SKILLS } from '../data/reference.js';

/**
 * XP thresholds per level
 * Level 1 starts at 0 XP
 */
export const XP_THRESHOLDS = {
  1: 0,
  2: 1000,
  3: 2000,
  4: 3000,
  5: 4000,
  6: 6000,
  7: 8000,
  8: 10000,
  9: 12000,
  10: 14000,
  11: 17000,
  12: 20000,
  13: 23000,
  14: 26000,
  15: 29000,
  16: 33000,
  17: 37000,
  18: 41000,
  19: 45000,
  20: 49000,
};

/**
 * XP awards for various achievements
 */
export const XP_AWARDS = {
  claimHex: 10,
  claimHexCritical: 20,
  establishVillage: 20,
  establishTown: 40,
  establishCity: 80,
  establishMetropolis: 120,
  buildStructure: 10, // Per structure level
  eventResolved: 20,
  eventResolvedCritical: 40,
  milestone: 80,
  questComplete: 40,
  rulerCriticalSuccess: 10,
  diplomaticVictory: 40,
  warVictory: 80,
};

/**
 * Milestones that can be achieved
 */
export const MILESTONES = [
  { id: 'first-settlement', name: 'First Settlement', description: 'Establish your first settlement', xp: 80, condition: (state) => (state.settlements?.length || 0) >= 1 },
  { id: 'five-hexes', name: 'Territorial Claim', description: 'Claim 5 hexes', xp: 40, condition: (state) => (state.kingdom?.hexes || 0) >= 5 },
  { id: 'ten-hexes', name: 'Growing Territory', description: 'Claim 10 hexes', xp: 80, condition: (state) => (state.kingdom?.hexes || 0) >= 10 },
  { id: 'twenty-five-hexes', name: 'Established Province', description: 'Claim 25 hexes', xp: 120, condition: (state) => (state.kingdom?.hexes || 0) >= 25 },
  { id: 'first-town', name: 'First Town', description: 'Upgrade a village to a town', xp: 80, condition: (state) => state.settlements?.some(s => s.blocks >= 5) },
  { id: 'first-city', name: 'First City', description: 'Upgrade a town to a city', xp: 120, condition: (state) => state.settlements?.some(s => s.blocks >= 9) },
  { id: 'zero-unrest', name: 'Content Kingdom', description: 'Reduce Unrest to 0', xp: 40, condition: (state) => (state.unrest || 0) === 0 },
  { id: 'all-leadership', name: 'Full Council', description: 'Fill all leadership positions', xp: 40, condition: (state) => state.leadership?.every(r => r.holder && r.holder.trim()) },
  { id: 'ten-buildings', name: 'Infrastructure', description: 'Build 10 structures', xp: 60, condition: (state) => state.settlements?.reduce((acc, s) => acc + (s.structures?.length || 0), 0) >= 10 },
  { id: 'level-five', name: 'Established Kingdom', description: 'Reach kingdom level 5', xp: 100, condition: (state) => (state.kingdom?.level || 1) >= 5 },
  { id: 'level-ten', name: 'Regional Power', description: 'Reach kingdom level 10', xp: 200, condition: (state) => (state.kingdom?.level || 1) >= 10 },
];

/**
 * Get XP required for next level
 */
export const getXPToNextLevel = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  return XP_THRESHOLDS[nextLevel] || XP_THRESHOLDS[20] + (nextLevel - 20) * 4000;
};

/**
 * Get current level based on XP
 */
export const getLevelFromXP = (xp) => {
  let level = 1;
  for (let l = 2; l <= 20; l++) {
    if (xp >= XP_THRESHOLDS[l]) {
      level = l;
    } else {
      break;
    }
  }
  // Handle levels beyond 20
  if (xp >= XP_THRESHOLDS[20]) {
    const extraLevels = Math.floor((xp - XP_THRESHOLDS[20]) / 4000);
    level = 20 + extraLevels;
  }
  return level;
};

/**
 * Check if kingdom should level up and return level up data
 */
export const checkLevelUp = (state) => {
  const currentLevel = state.kingdom?.level || 1;
  const currentXP = state.kingdom?.xp || 0;
  const xpForNextLevel = getXPToNextLevel(currentLevel);
  
  if (currentXP >= xpForNextLevel) {
    return {
      shouldLevel: true,
      newLevel: currentLevel + 1,
      currentXP,
      xpRequired: xpForNextLevel,
    };
  }
  
  return {
    shouldLevel: false,
    currentLevel,
    currentXP,
    xpForNextLevel,
    xpRemaining: xpForNextLevel - currentXP,
  };
};

/**
 * Apply level up to state
 * Returns new state with level increased
 * Level up grants:
 * - +2 to one ability score
 * - Train one skill (or upgrade existing)
 * - Kingdom feat (at level 1 and even levels)
 */
export const applyLevelUp = (state, abilityBoost, skillTraining, featId = null) => {
  const newLevel = (state.kingdom?.level || 1) + 1;
  
  const newState = {
    ...state,
    kingdom: {
      ...state.kingdom,
      level: newLevel,
      xpToNext: getXPToNextLevel(newLevel),
    },
  };
  
  // Apply ability boost (+2)
  if (abilityBoost) {
    newState.abilities = {
      ...state.abilities,
      [abilityBoost]: (state.abilities?.[abilityBoost] || 10) + 2,
    };
  }
  
  // Apply skill training
  if (skillTraining) {
    const currentProf = state.skillProficiencies?.[skillTraining] || 'Untrained';
    const profOrder = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];
    const currentIndex = profOrder.indexOf(currentProf);
    const newProf = profOrder[Math.min(currentIndex + 1, profOrder.length - 1)];
    
    newState.skillProficiencies = {
      ...state.skillProficiencies,
      [skillTraining]: newProf,
    };
  }
  
  // Apply kingdom feat
  if (featId) {
    newState.kingdomFeats = [...(state.kingdomFeats || []), featId];
  }
  
  return newState;
};

/**
 * Award XP for an action
 */
export const awardXP = (state, amount, reason) => {
  const currentXP = state.kingdom?.xp || 0;
  const newXP = currentXP + amount;
  
  return {
    state: {
      ...state,
      kingdom: {
        ...state.kingdom,
        xp: newXP,
      },
    },
    awarded: amount,
    reason,
    newTotal: newXP,
  };
};

/**
 * Check for newly achieved milestones
 */
export const checkMilestones = (state) => {
  const achievedMilestones = state.achievedMilestones || [];
  const newMilestones = [];
  
  for (const milestone of MILESTONES) {
    if (!achievedMilestones.includes(milestone.id) && milestone.condition(state)) {
      newMilestones.push(milestone);
    }
  }
  
  return newMilestones;
};

/**
 * Award milestones and return updated state
 */
export const awardMilestones = (state, milestones) => {
  let currentState = state;
  let totalXP = 0;
  const log = [];
  
  for (const milestone of milestones) {
    const result = awardXP(currentState, milestone.xp, `Milestone: ${milestone.name}`);
    currentState = result.state;
    totalXP += milestone.xp;
    log.push(`Milestone achieved: ${milestone.name} (+${milestone.xp} XP)`);
  }
  
  // Track achieved milestones
  currentState = {
    ...currentState,
    achievedMilestones: [
      ...(state.achievedMilestones || []),
      ...milestones.map(m => m.id),
    ],
  };
  
  return {
    state: currentState,
    totalXP,
    milestones,
    log,
  };
};

/**
 * Get available skills for training (grouped by ability)
 */
export const getTrainableSkills = (state) => {
  const result = {};
  
  for (const [ability, skills] of Object.entries(SKILLS)) {
    result[ability] = skills.map(skill => ({
      name: skill,
      currentProficiency: state.skillProficiencies?.[skill] || 'Untrained',
      canUpgrade: (state.skillProficiencies?.[skill] || 'Untrained') !== 'Legendary',
    }));
  }
  
  return result;
};

/**
 * Calculate RP cost to train a skill outside of level-up
 */
export const getSkillTrainingCost = (currentProficiency) => {
  switch (currentProficiency) {
    case 'Untrained': return 10; // Train to Trained
    case 'Trained': return 20; // Train to Expert
    case 'Expert': return 40; // Train to Master
    case 'Master': return 80; // Train to Legendary
    default: return null; // Can't train higher
  }
};

/**
 * Train a skill using RP (outside of level-up)
 */
export const trainSkillWithRP = (state, skillName) => {
  const currentProf = state.skillProficiencies?.[skillName] || 'Untrained';
  const cost = getSkillTrainingCost(currentProf);
  
  if (cost === null) {
    return { success: false, error: 'Skill is already at maximum proficiency' };
  }
  
  if ((state.resources?.rp || 0) < cost) {
    return { success: false, error: `Insufficient RP (need ${cost}, have ${state.resources?.rp || 0})` };
  }
  
  const profOrder = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];
  const currentIndex = profOrder.indexOf(currentProf);
  const newProf = profOrder[currentIndex + 1];
  
  return {
    success: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        rp: state.resources.rp - cost,
      },
      skillProficiencies: {
        ...state.skillProficiencies,
        [skillName]: newProf,
      },
    },
    cost,
    oldProficiency: currentProf,
    newProficiency: newProf,
  };
};
