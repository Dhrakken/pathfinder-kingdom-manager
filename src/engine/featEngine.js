// ============================================
// FEAT ENGINE
// Calculate bonuses and effects from kingdom feats
// ============================================

import { getFeatById } from '../data/feats.js';

/**
 * Get item bonus from feats for a specific activity
 * @param {object} state - Kingdom state
 * @param {string} activityId - Activity ID
 * @returns {{ bonus: number, source: string | null }}
 */
export const getFeatBonusForActivity = (state, activityId) => {
  const feats = state.kingdomFeats || [];
  let highestBonus = 0;
  let source = null;
  
  for (const featId of feats) {
    const bonus = getActivityBonusFromFeat(featId, activityId);
    if (bonus > highestBonus) {
      highestBonus = bonus;
      const feat = getFeatById(featId);
      source = feat?.name || featId;
    }
  }
  
  return { bonus: highestBonus, source };
};

/**
 * Get item bonus from feats for a specific skill
 * @param {object} state - Kingdom state
 * @param {string} skillName - Skill name
 * @returns {{ bonus: number, source: string | null }}
 */
export const getFeatBonusForSkill = (state, skillName) => {
  const feats = state.kingdomFeats || [];
  let highestBonus = 0;
  let source = null;
  
  for (const featId of feats) {
    const bonus = getSkillBonusFromFeat(featId, skillName);
    if (bonus > highestBonus) {
      highestBonus = bonus;
      const feat = getFeatById(featId);
      source = feat?.name || featId;
    }
  }
  
  return { bonus: highestBonus, source };
};

/**
 * Get activity-specific bonus from a feat
 */
const getActivityBonusFromFeat = (featId, activityId) => {
  const activityIdLower = activityId?.toLowerCase() || '';
  
  switch (featId) {
    // +1 bonuses (level 1 feats)
    case 'crush-dissent':
      return activityIdLower === 'quell-unrest' ? 1 : 0;
    case 'experienced-farmers':
      return activityIdLower === 'harvest-crops' ? 1 : 0;
    case 'folk-magic':
      return activityIdLower === 'provide-care' ? 1 : 0;
    case 'free-and-fair':
      return activityIdLower === 'establish-trade-agreement' ? 1 : 0;
    case 'practical-magic':
      return activityIdLower === 'supernatural-solution' ? 1 : 0;
      
    // +2 bonuses (level 4+ feats)
    case 'famous-scholars':
      return activityIdLower === 'creative-solution' ? 2 : 0;
    case 'expert-craftspeople':
      return activityIdLower === 'craft-luxuries' ? 1 : 0;
    case 'legendary-craftspeople':
      return activityIdLower === 'craft-luxuries' ? 2 : 0; // Stacks? No, replace
      
    default:
      return 0;
  }
};

/**
 * Get skill-specific bonus from a feat
 */
const getSkillBonusFromFeat = (featId, skillName) => {
  const skillLower = skillName?.toLowerCase() || '';
  
  switch (featId) {
    // Defense bonuses
    case 'fortified-fiefs':
      return skillLower === 'defense' ? 1 : 0;
      
    // Trade bonuses
    case 'insider-trading':
      return skillLower === 'trade' ? 1 : 0;
      
    // Warfare bonuses
    case 'civil-war-veterans':
      return skillLower === 'warfare' ? 1 : 0;
    case 'seasoned-veterans':
      return skillLower === 'warfare' ? 2 : 0;
      
    // Exploration/Wilderness bonuses
    case 'frontier-mentality':
      return ['exploration', 'wilderness'].includes(skillLower) ? 1 : 0;
      
    // Intrigue/Politics bonuses
    case 'clever-courtiers':
      return ['intrigue', 'politics'].includes(skillLower) ? 1 : 0;
      
    // Industry bonuses
    case 'legendary-craftspeople':
      return skillLower === 'industry' ? 2 : 0;
      
    // Scholarship bonuses
    case 'famous-scholars':
      return skillLower === 'scholarship' ? 2 : 0;
      
    default:
      return 0;
  }
};

/**
 * Check if a feat provides a special modifier to consumption
 * @returns number - consumption modifier (negative = reduction)
 */
export const getConsumptionModFromFeats = (state) => {
  const feats = state.kingdomFeats || [];
  let modifier = 0;
  
  for (const featId of feats) {
    if (featId === 'quality-of-life') {
      modifier -= 1;
    }
  }
  
  return modifier;
};

/**
 * Check if feats modify an activity's RP cost
 */
export const getActivityCostModFromFeats = (state, activityId) => {
  const feats = state.kingdomFeats || [];
  let modifier = 0;
  
  for (const featId of feats) {
    if (featId === 'celebratory-traditions' && activityId === 'celebrate-holiday') {
      modifier -= 1; // Celebrate Holiday costs 0 RP
    }
    if (featId === 'frontier-mentality' && activityId === 'claim-hex') {
      modifier -= 1; // Claim Hex costs 0 RP
    }
  }
  
  return modifier;
};

/**
 * Check if feats modify ruin thresholds
 */
export const getRuinThresholdModFromFeats = (state) => {
  const feats = state.kingdomFeats || [];
  let modifier = 0;
  
  for (const featId of feats) {
    if (featId === 'enduring-kingdom') {
      modifier += 2;
    }
    if (featId === 'eternal-kingdom') {
      modifier += 5;
    }
  }
  
  return modifier;
};

/**
 * Check if feats grant rerolls or special abilities
 */
export const getFeatSpecialAbilities = (state) => {
  const feats = state.kingdomFeats || [];
  const abilities = [];
  
  for (const featId of feats) {
    switch (featId) {
      case 'cooperative-leadership':
        abilities.push({
          id: 'reroll-leadership-crit-fail',
          name: 'Cooperative Leadership Reroll',
          description: 'Once per turn, reroll a critically failed leadership activity',
          usesPerTurn: 1,
        });
        break;
      case 'muddle-through':
        abilities.push({
          id: 'starvation-d3',
          name: 'Muddle Through',
          description: 'Roll d3 instead of d4 for Unrest from food shortage',
          passive: true,
        });
        break;
      case 'national-spirit':
        abilities.push({
          id: 'max-unrest-10',
          name: 'National Spirit',
          description: 'Maximum Unrest cannot exceed 10. Excess converts to Fame',
          passive: true,
        });
        break;
    }
  }
  
  return abilities;
};

/**
 * Get bonus RP per turn from feats
 */
export const getBonusRPFromFeats = (state) => {
  const feats = state.kingdomFeats || [];
  let bonus = 0;
  
  for (const featId of feats) {
    if (featId === 'capital-investment') {
      bonus += 2;
    }
    // Diverse Trade adds RP from trade agreements (handled separately)
  }
  
  return bonus;
};

/**
 * Get storage capacity bonus from feats
 */
export const getStorageBonusFromFeats = (state) => {
  const feats = state.kingdomFeats || [];
  let bonus = 0;
  
  for (const featId of feats) {
    if (featId === 'diverse-trade') {
      bonus += 4; // +4 to all commodity storage
    }
  }
  
  return bonus;
};

/**
 * Check if feats affect resource die size
 */
export const getResourceDieModFromFeats = (state) => {
  const feats = state.kingdomFeats || [];
  let modifier = 0;
  
  for (const featId of feats) {
    if (featId === 'vast-territory') {
      modifier += 1; // Increase die by one step (d4→d6, d6→d8, etc.)
    }
  }
  
  return modifier;
};

/**
 * Get all active feat effects summary for display
 */
export const getActiveFeatEffects = (state) => {
  const feats = state.kingdomFeats || [];
  const effects = [];
  
  for (const featId of feats) {
    const feat = getFeatById(featId);
    if (feat) {
      effects.push({
        id: featId,
        name: feat.name,
        benefit: feat.benefit,
      });
    }
  }
  
  return effects;
};
