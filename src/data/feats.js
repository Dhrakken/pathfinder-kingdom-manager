// ============================================
// KINGDOM FEATS (PF2E Kingmaker)
// ============================================

export const KINGDOM_FEATS = [
  // Level 1 Feats
  {
    id: 'civil-war-veterans',
    name: 'Civil War Veterans',
    level: 1,
    traits: ['kingdom'],
    description: 'Your citizens include veterans of a civil war, making them tougher and more resilient.',
    benefit: '+1 item bonus to Warfare checks when defending your kingdom.',
    prerequisite: null,
  },
  {
    id: 'cooperative-leadership',
    name: 'Cooperative Leadership',
    level: 1,
    traits: ['kingdom'],
    description: 'Your leaders work together exceptionally well.',
    benefit: 'Once per turn, when you critically fail a leadership activity, you can reroll it.',
    prerequisite: null,
  },
  {
    id: 'crush-dissent',
    name: 'Crush Dissent',
    level: 1,
    traits: ['kingdom'],
    description: 'Your kingdom deals harshly with those who sow discord.',
    benefit: '+1 item bonus to Quell Unrest checks. On a critical success, reduce Unrest by an additional 1.',
    prerequisite: null,
  },
  {
    id: 'experienced-farmers',
    name: 'Experienced Farmers',
    level: 1,
    traits: ['kingdom'],
    description: 'Your citizens are skilled at working the land.',
    benefit: '+1 item bonus to Harvest Crops. Farmlands produce 1 additional Food during upkeep.',
    prerequisite: null,
  },
  {
    id: 'folk-magic',
    name: 'Folk Magic',
    level: 1,
    traits: ['kingdom'],
    description: 'Hedge magic and folk remedies are common in your kingdom.',
    benefit: '+1 item bonus to Provide Care. Reduce the DC of events involving disease or poison by 2.',
    prerequisite: null,
  },
  {
    id: 'fortified-fiefs',
    name: 'Fortified Fiefs',
    level: 1,
    traits: ['kingdom'],
    description: 'Your settlements are built with defense in mind.',
    benefit: '+1 item bonus to Defense checks. Walls cost 1 less stone to construct.',
    prerequisite: null,
  },
  {
    id: 'free-and-fair',
    name: 'Free and Fair',
    level: 1,
    traits: ['kingdom'],
    description: 'Your kingdom values free trade and fair markets.',
    benefit: '+1 item bonus to Establish Trade Agreement. Trade commodities at 1 additional RP value.',
    prerequisite: null,
  },
  {
    id: 'insider-trading',
    name: 'Insider Trading',
    level: 1,
    traits: ['kingdom'],
    description: 'Your merchants share information that helps the kingdom profit.',
    benefit: '+1 item bonus to Trade checks. On a critical success when trading, gain 1 additional RP.',
    prerequisite: null,
  },
  {
    id: 'muddle-through',
    name: 'Muddle Through',
    level: 1,
    traits: ['kingdom'],
    description: 'Your kingdom has a talent for making do with less.',
    benefit: 'When you pay consumption and are short on food, roll d3 instead of d4 for Unrest.',
    prerequisite: null,
  },
  {
    id: 'practical-magic',
    name: 'Practical Magic',
    level: 1,
    traits: ['kingdom'],
    description: 'Magic is used practically throughout your kingdom.',
    benefit: '+1 item bonus to Supernatural Solution. Magic shops and temples cost 2 less RP.',
    prerequisite: null,
  },
  
  // Level 2 Feats
  {
    id: 'backup-militia',
    name: 'Backup Militia',
    level: 2,
    traits: ['kingdom'],
    description: 'Your citizens can quickly form a defensive militia.',
    benefit: '+1 circumstance bonus to Defense checks against invasion. Once per turn, reduce Unrest from bandit events by 1.',
    prerequisite: null,
  },
  {
    id: 'civic-planning',
    name: 'Civic Planning',
    level: 2,
    traits: ['kingdom'],
    description: 'Your settlements are thoughtfully laid out.',
    benefit: 'Structures that provide item bonuses grant +1 higher bonus. Infrastructure costs 2 less RP.',
    prerequisite: null,
  },
  {
    id: 'clever-courtiers',
    name: 'Clever Courtiers',
    level: 2,
    traits: ['kingdom'],
    description: 'Your court is filled with cunning advisors.',
    benefit: '+1 item bonus to Intrigue and Politics checks. Diplomatic events have -2 DC.',
    prerequisite: null,
  },
  {
    id: 'enduring-kingdom',
    name: 'Enduring Kingdom',
    level: 2,
    traits: ['kingdom'],
    description: 'Your kingdom can weather hard times.',
    benefit: 'Ruin thresholds are increased by 2. When Ruin would increase, reduce it by 1 (min 0).',
    prerequisite: null,
  },
  {
    id: 'expert-craftspeople',
    name: 'Expert Craftspeople',
    level: 2,
    traits: ['kingdom'],
    description: 'Your kingdom is known for the quality of its goods.',
    benefit: '+1 item bonus to Craft Luxuries. When crafting, critical success produces 3 Luxuries instead of 2.',
    prerequisite: null,
  },
  {
    id: 'frontier-mentality',
    name: 'Frontier Mentality',
    level: 2,
    traits: ['kingdom'],
    description: 'Your citizens are hardy pioneers.',
    benefit: '+1 item bonus to Exploration and Wilderness checks. Claiming hexes costs 0 RP.',
    prerequisite: null,
  },
  
  // Level 4 Feats
  {
    id: 'celebratory-traditions',
    name: 'Celebratory Traditions',
    level: 4,
    traits: ['kingdom'],
    description: 'Your kingdom has beloved holidays and celebrations.',
    benefit: 'Celebrate Holiday costs 0 RP. On success or better, reduce Unrest by 1 additional point.',
    prerequisite: null,
  },
  {
    id: 'consolidated-leadership',
    name: 'Consolidated Leadership',
    level: 4,
    traits: ['kingdom'],
    description: 'Your leadership is highly efficient.',
    benefit: 'Gain 1 additional leadership activity per turn. Invested leaders provide +2 instead of +1.',
    prerequisite: 'cooperative-leadership',
  },
  {
    id: 'diverse-trade',
    name: 'Diverse Trade',
    level: 4,
    traits: ['kingdom'],
    description: 'Your kingdom trades in many goods.',
    benefit: 'Trade agreements provide +2 RP per turn. Commodity storage increased by 4 for all types.',
    prerequisite: 'free-and-fair',
  },
  {
    id: 'famous-scholars',
    name: 'Famous Scholars',
    level: 4,
    traits: ['kingdom'],
    description: 'Your kingdom is known for its learned institutions.',
    benefit: '+2 item bonus to Creative Solution and Scholarship checks. Libraries and academies cost 10 less RP.',
    prerequisite: null,
  },
  {
    id: 'quality-of-life',
    name: 'Quality of Life',
    level: 4,
    traits: ['kingdom'],
    description: 'Your citizens enjoy a high standard of living.',
    benefit: 'Improve Lifestyle always reduces Unrest by at least 1. Consumption decreased by 1.',
    prerequisite: null,
  },
  {
    id: 'seasoned-veterans',
    name: 'Seasoned Veterans',
    level: 4,
    traits: ['kingdom'],
    description: 'Your military forces are battle-hardened.',
    benefit: '+2 item bonus to Warfare checks. Armies gain +1 to attack and Morale.',
    prerequisite: 'civil-war-veterans',
  },
  
  // Level 6 Feats
  {
    id: 'architectural-wonders',
    name: 'Architectural Wonders',
    level: 6,
    traits: ['kingdom'],
    description: 'Your kingdom builds impressive structures.',
    benefit: 'Level 3 structures cost 10 less RP. Gain +1 Fame when building a structure for the first time.',
    prerequisite: 'civic-planning',
  },
  {
    id: 'diplomatic-immunity',
    name: 'Diplomatic Immunity',
    level: 6,
    traits: ['kingdom'],
    description: 'Your diplomatic corps is respected throughout the region.',
    benefit: '+2 item bonus to all diplomatic activities. Trade agreements cannot be broken by events.',
    prerequisite: 'clever-courtiers',
  },
  {
    id: 'legendary-craftspeople',
    name: 'Legendary Craftspeople',
    level: 6,
    traits: ['kingdom'],
    description: 'Your artisans produce works of legendary quality.',
    benefit: 'Craft Luxuries produces +1 Luxury on any success. +2 item bonus to Industry checks.',
    prerequisite: 'expert-craftspeople',
  },
  {
    id: 'national-spirit',
    name: 'National Spirit',
    level: 6,
    traits: ['kingdom'],
    description: 'Your citizens are fiercely patriotic.',
    benefit: 'Maximum Unrest cannot exceed 10. When Unrest would exceed 10, gain 1 Fame instead.',
    prerequisite: null,
  },
  {
    id: 'vast-territory',
    name: 'Vast Territory',
    level: 6,
    traits: ['kingdom'],
    description: 'Your kingdom encompasses a huge area.',
    benefit: 'Increase the Resource Die by one step. DC modifiers from kingdom size are halved.',
    prerequisite: 'frontier-mentality',
  },
  
  // Level 8+ Feats
  {
    id: 'capital-investment',
    name: 'Capital Investment',
    level: 8,
    traits: ['kingdom'],
    description: 'Your kingdom attracts wealthy investors.',
    benefit: 'Start each turn with +2 RP. Collect Taxes critical success grants +3 RP instead of +2.',
    prerequisite: null,
  },
  {
    id: 'eternal-kingdom',
    name: 'Eternal Kingdom',
    level: 8,
    traits: ['kingdom'],
    description: 'Your kingdom is built to last forever.',
    benefit: 'Ignore the first point of Ruin each turn. Ruin thresholds increased by 5.',
    prerequisite: 'enduring-kingdom',
  },
  {
    id: 'imperial-ambition',
    name: 'Imperial Ambition',
    level: 10,
    traits: ['kingdom'],
    description: 'Your kingdom seeks to become an empire.',
    benefit: 'Gain +2 to all checks when claiming hexes or establishing settlements. +3 Fame.',
    prerequisite: 'vast-territory',
  },
];

// Get feats available at a given level
export const getFeatsForLevel = (level) => 
  KINGDOM_FEATS.filter(f => f.level <= level);

// Get feat by ID
export const getFeatById = (id) => 
  KINGDOM_FEATS.find(f => f.id === id);

// Check if prerequisites are met
export const checkPrerequisites = (feat, acquiredFeats) => {
  if (!feat.prerequisite) return true;
  return acquiredFeats.includes(feat.prerequisite);
};

// Get feats organized by level
export const getFeatsByLevel = () => {
  const result = {};
  for (const feat of KINGDOM_FEATS) {
    if (!result[feat.level]) result[feat.level] = [];
    result[feat.level].push(feat);
  }
  return result;
};
