// ============================================
// KINGDOM SIZE TABLE (PF2E Kingmaker RAW)
// ============================================
export const KINGDOM_SIZE_TABLE = [
  { min: 1, max: 9, type: 'Territory', die: 4, dcMod: 0, storage: 4 },
  { min: 10, max: 24, type: 'Province', die: 6, dcMod: 1, storage: 8 },
  { min: 25, max: 49, type: 'State', die: 8, dcMod: 2, storage: 12 },
  { min: 50, max: 99, type: 'Country', die: 10, dcMod: 3, storage: 16 },
  { min: 100, max: Infinity, type: 'Dominion', die: 12, dcMod: 4, storage: 20 },
];

export const getSizeData = (hexes) => 
  KINGDOM_SIZE_TABLE.find(s => hexes >= s.min && hexes <= s.max) || KINGDOM_SIZE_TABLE[0];

// ============================================
// SETTLEMENT TYPES
// ============================================
export const SETTLEMENT_TYPES = [
  { type: 'Village', minBlocks: 1, maxBlocks: 4, level: 1, consumption: 1 },
  { type: 'Town', minBlocks: 5, maxBlocks: 8, level: 2, consumption: 2 },
  { type: 'City', minBlocks: 9, maxBlocks: 16, level: 3, consumption: 4 },
  { type: 'Metropolis', minBlocks: 17, maxBlocks: 36, level: 4, consumption: 6 },
];

export const getSettlementType = (blocks) =>
  SETTLEMENT_TYPES.find(s => blocks >= s.minBlocks && blocks <= s.maxBlocks) || SETTLEMENT_TYPES[0];

// ============================================
// CONTROL DC
// ============================================
export const getControlDC = (level) => 14 + level;

// ============================================
// ABILITIES & SKILLS
// ============================================
export const ABILITIES = ['Culture', 'Economy', 'Loyalty', 'Stability'];

export const SKILLS = {
  Culture: ['Arts', 'Folklore', 'Magic', 'Scholarship'],
  Economy: ['Boating', 'Engineering', 'Exploration', 'Industry', 'Trade'],
  Loyalty: ['Intrigue', 'Politics', 'Statecraft', 'Warfare'],
  Stability: ['Agriculture', 'Defense', 'Wilderness'],
};

export const ALL_SKILLS = Object.values(SKILLS).flat();

export const getAbilityForSkill = (skillName) => {
  for (const [ability, skills] of Object.entries(SKILLS)) {
    if (skills.includes(skillName)) return ability;
  }
  return null;
};

// ============================================
// PROFICIENCY
// ============================================
export const PROFICIENCY_LEVELS = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];

export const getProficiencyBonus = (proficiency, level) => {
  switch (proficiency) {
    case 'Trained': return level + 2;
    case 'Expert': return level + 4;
    case 'Master': return level + 6;
    case 'Legendary': return level + 8;
    default: return 0;
  }
};

// ============================================
// LEADERSHIP ROLES
// ============================================
export const LEADERSHIP_ROLES = [
  { id: 'ruler', name: 'Ruler', ability: 'Any', key: true, description: 'The kingdom\'s head of state.' },
  { id: 'counselor', name: 'Counselor', ability: 'Culture', key: false, description: 'Guides public sentiment and religion.' },
  { id: 'general', name: 'General', ability: 'Loyalty', key: false, description: 'Commands military forces.' },
  { id: 'emissary', name: 'Emissary', ability: 'Loyalty', key: false, description: 'Handles foreign diplomacy.' },
  { id: 'magister', name: 'Magister', ability: 'Culture', key: false, description: 'Oversees magical matters.' },
  { id: 'treasurer', name: 'Treasurer', ability: 'Economy', key: false, description: 'Manages finances and trade.' },
  { id: 'viceroy', name: 'Viceroy', ability: 'Economy', key: false, description: 'Oversees expansion and new territories.' },
  { id: 'warden', name: 'Warden', ability: 'Stability', key: false, description: 'Protects lands and resources.' },
];

// ============================================
// COMMODITIES
// ============================================
export const COMMODITY_TYPES = ['Food', 'Lumber', 'Luxuries', 'Ore', 'Stone'];

// ============================================
// RUIN TYPES
// ============================================
export const RUIN_TYPES = ['Corruption', 'Crime', 'Decay', 'Strife'];

// ============================================
// GOLARION CALENDAR
// ============================================
export const GOLARION_MONTHS = [
  'Abadius', 'Calistril', 'Pharast', 'Gozran', 'Desnus', 'Sarenith',
  'Erastus', 'Arodus', 'Rova', 'Lamashan', 'Neth', 'Kuthona'
];

// ============================================
// CHARTER TYPES
// ============================================
export const CHARTER_TYPES = [
  { id: 'conquest', name: 'Conquest', boost: 'Loyalty', flaw: 'Culture', freeBoost: 'Loyalty' },
  { id: 'expansion', name: 'Expansion', boost: 'Culture', flaw: 'Stability', freeBoost: 'Economy' },
  { id: 'exploration', name: 'Exploration', boost: 'Economy', flaw: 'Loyalty', freeBoost: 'Culture' },
  { id: 'grant', name: 'Grant', boost: 'Stability', flaw: 'Economy', freeBoost: 'Stability' },
  { id: 'open', name: 'Open', boost: 'Any', flaw: 'Any', freeBoost: 'Any' },
];

// ============================================
// HEARTLAND TYPES
// ============================================
export const HEARTLAND_TYPES = [
  { id: 'forest', name: 'Forest or Swamp', boost: 'Culture' },
  { id: 'hill', name: 'Hill or Plain', boost: 'Loyalty' },
  { id: 'lake', name: 'Lake or River', boost: 'Economy' },
  { id: 'mountain', name: 'Mountain or Ruins', boost: 'Stability' },
];

// ============================================
// GOVERNMENT TYPES
// ============================================
export const GOVERNMENT_TYPES = [
  { id: 'despotism', name: 'Despotism', boost: 'Stability', skill: 'Intrigue' },
  { id: 'feudalism', name: 'Feudalism', boost: 'Stability', skill: 'Defense' },
  { id: 'oligarchy', name: 'Oligarchy', boost: 'Economy', skill: 'Industry' },
  { id: 'republic', name: 'Republic', boost: 'Loyalty', skill: 'Politics' },
  { id: 'thaumocracy', name: 'Thaumocracy', boost: 'Culture', skill: 'Magic' },
  { id: 'yeomanry', name: 'Yeomanry', boost: 'Loyalty', skill: 'Agriculture' },
];
