// ============================================
// KINGDOM ACTIVITIES (PF2E Kingmaker)
// With Mechanical Effects
// ============================================

// Effect types for the activity engine:
// { type: 'unrest', delta: -1 }
// { type: 'fame', delta: 1 }
// { type: 'infamy', delta: 1 }
// { type: 'xp', delta: 10 }
// { type: 'rp', delta: -5 } (negative = cost)
// { type: 'ruin', ruinType: 'Decay', delta: 1 }
// { type: 'commodity', commodity: 'Food', delta: 2 }
// { type: 'claimHex' } (requires hexCoord input)
// { type: 'workSite', siteType: 'farm' } (requires hexCoord input)
// { type: 'special', key: 'prognostication' } (handled by custom logic)

// Activity categories
export const ACTIVITY_CATEGORIES = {
  leadership: 'Leadership',
  region: 'Region',
  civic: 'Civic',
  commerce: 'Commerce',
};

// ============================================
// LEADERSHIP ACTIVITIES
// ============================================
export const LEADERSHIP_ACTIVITIES = [
  {
    id: 'celebrate-holiday',
    name: 'Celebrate Holiday',
    category: 'leadership',
    skill: 'Folklore',
    desc: 'Hold a celebration to reduce Unrest',
    rpCost: 1,
    effects: {
      criticalSuccess: [{ type: 'unrest', delta: -2 }, { type: 'fame', delta: 1 }],
      success: [{ type: 'unrest', delta: -1 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'craft-luxuries',
    name: 'Craft Luxuries',
    category: 'leadership',
    skill: 'Industry',
    desc: 'Create luxury goods',
    rpCost: 5,
    effects: {
      criticalSuccess: [{ type: 'commodity', commodity: 'luxuries', delta: 2 }],
      success: [{ type: 'commodity', commodity: 'luxuries', delta: 1 }],
      failure: [], // RP already spent
      criticalFailure: [{ type: 'ruin', ruinType: 'Decay', delta: 1 }],
    },
  },
  {
    id: 'creative-solution',
    name: 'Creative Solution',
    category: 'leadership',
    skill: 'Scholarship',
    desc: 'Find creative answer to a problem',
    effects: {
      criticalSuccess: [{ type: 'special', key: 'solveProblem' }, { type: 'unrest', delta: -1 }],
      success: [{ type: 'special', key: 'solveProblem' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'hire-adventurers',
    name: 'Hire Adventurers',
    category: 'leadership',
    skill: 'Warfare',
    desc: 'Hire adventurers for a dangerous task',
    rpCost: 2, // Base cost, may vary
    requiresInput: ['taskLevel'], // Level of task determines actual cost
    effects: {
      criticalSuccess: [{ type: 'special', key: 'taskComplete' }],
      success: [{ type: 'special', key: 'taskComplete' }],
      failure: [], // RP wasted
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'improve-lifestyle',
    name: 'Improve Lifestyle',
    category: 'leadership',
    skill: 'Politics',
    desc: 'Improve citizen lifestyle for a turn',
    effects: {
      criticalSuccess: [{ type: 'unrest', delta: -2 }],
      success: [{ type: 'unrest', delta: -1 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'new-leadership',
    name: 'New Leadership',
    category: 'leadership',
    skill: 'Politics',
    desc: 'Assign or change a leadership role',
    requiresInput: ['roleId', 'leaderName'],
    effects: {
      criticalSuccess: [{ type: 'special', key: 'assignRole' }],
      success: [{ type: 'special', key: 'assignRole' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'prognostication',
    name: 'Prognostication',
    category: 'leadership',
    skill: 'Magic',
    desc: 'Divine future events',
    effects: {
      criticalSuccess: [{ type: 'special', key: 'prognosticationCrit' }], // +2 to next event check
      success: [{ type: 'special', key: 'prognostication' }], // +1 to next event check
      failure: [],
      criticalFailure: [{ type: 'special', key: 'prognosticationFail' }], // -1 to next event check
    },
  },
  {
    id: 'provide-care',
    name: 'Provide Care',
    category: 'leadership',
    skill: 'Defense',
    desc: 'Heal sick or injured citizens',
    effects: {
      criticalSuccess: [{ type: 'unrest', delta: -1 }],
      success: [],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'quell-unrest',
    name: 'Quell Unrest',
    category: 'leadership',
    skill: 'Intrigue',
    desc: 'Reduce kingdom Unrest',
    effects: {
      criticalSuccess: [{ type: 'unrest', delta: -2 }],
      success: [{ type: 'unrest', delta: -1 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'repair-reputation',
    name: 'Repair Reputation',
    category: 'leadership',
    skill: 'Politics',
    desc: 'Reduce Infamy or a Ruin score',
    requiresInput: ['targetStat'], // 'infamy' or ruin type
    effects: {
      criticalSuccess: [{ type: 'special', key: 'repairRep2' }], // -2 to chosen stat
      success: [{ type: 'special', key: 'repairRep1' }], // -1 to chosen stat
      failure: [],
      criticalFailure: [{ type: 'special', key: 'repairRepFail' }], // +1 to chosen stat
    },
  },
  {
    id: 'rest-and-relax',
    name: 'Rest and Relax',
    category: 'leadership',
    skill: 'Arts',
    desc: 'Take time for leisure activities',
    effects: {
      criticalSuccess: [{ type: 'unrest', delta: -2 }, { type: 'fame', delta: 1 }],
      success: [{ type: 'unrest', delta: -1 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'supernatural-solution',
    name: 'Supernatural Solution',
    category: 'leadership',
    skill: 'Magic',
    desc: 'Use magic to solve a problem',
    effects: {
      criticalSuccess: [{ type: 'special', key: 'solveProblem' }, { type: 'unrest', delta: -1 }],
      success: [{ type: 'special', key: 'solveProblem' }],
      failure: [],
      criticalFailure: [{ type: 'ruin', ruinType: 'Corruption', delta: 1 }],
    },
  },
];

// ============================================
// REGION ACTIVITIES
// ============================================
export const REGION_ACTIVITIES = [
  {
    id: 'claim-hex',
    name: 'Claim Hex',
    category: 'region',
    skill: 'Exploration',
    desc: 'Claim an adjacent explored hex',
    rpCost: 1,
    requiresInput: ['hexCoord'],
    prerequisite: 'adjacentExploredHex',
    effects: {
      criticalSuccess: [{ type: 'claimHex' }, { type: 'xp', delta: 20 }],
      success: [{ type: 'claimHex' }, { type: 'xp', delta: 10 }],
      failure: [], // RP refunded on failure
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
    refundOnFailure: true,
  },
  {
    id: 'abandon-hex',
    name: 'Abandon Hex',
    category: 'region',
    skill: 'Wilderness',
    desc: 'Relinquish a claimed hex',
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexNoSettlement',
    effects: {
      criticalSuccess: [{ type: 'abandonHex' }],
      success: [{ type: 'abandonHex' }, { type: 'unrest', delta: 1 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: '1d4' }], // Random 1d4
    },
  },
  {
    id: 'build-roads',
    name: 'Build Roads',
    category: 'region',
    skill: 'Engineering',
    desc: 'Construct roads in a hex',
    rpCost: 1,
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHex',
    effects: {
      criticalSuccess: [{ type: 'addRoad' }, { type: 'special', key: 'fastRoad' }],
      success: [{ type: 'addRoad' }],
      failure: [],
      criticalFailure: [], // Just lose RP
    },
    refundOnFailure: true,
  },
  {
    id: 'clear-hex',
    name: 'Clear Hex',
    category: 'region',
    skill: 'Exploration',
    desc: 'Remove hazards from a hex',
    requiresInput: ['hexCoord'],
    effects: {
      criticalSuccess: [{ type: 'clearHex' }, { type: 'special', key: 'discoverResource' }],
      success: [{ type: 'clearHex' }],
      failure: [],
      criticalFailure: [{ type: 'special', key: 'randomEncounter' }],
    },
  },
  {
    id: 'establish-farmland',
    name: 'Establish Farmland',
    category: 'region',
    skill: 'Agriculture',
    desc: 'Create farmland in a plains or hills hex',
    rpCost: 2,
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexFarmable',
    effects: {
      criticalSuccess: [{ type: 'workSite', siteType: 'farm', bonus: true }],
      success: [{ type: 'workSite', siteType: 'farm' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
    refundOnFailure: true,
  },
  {
    id: 'establish-work-site-mine',
    name: 'Establish Mine',
    category: 'region',
    skill: 'Industry',
    desc: 'Create a mine in a hills or mountain hex',
    rpCost: 2,
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexMinable',
    effects: {
      criticalSuccess: [{ type: 'workSite', siteType: 'mine', bonus: true }],
      success: [{ type: 'workSite', siteType: 'mine' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
    refundOnFailure: true,
  },
  {
    id: 'establish-work-site-quarry',
    name: 'Establish Quarry',
    category: 'region',
    skill: 'Industry',
    desc: 'Create a quarry in a hills or mountain hex',
    rpCost: 2,
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexQuarryable',
    effects: {
      criticalSuccess: [{ type: 'workSite', siteType: 'quarry', bonus: true }],
      success: [{ type: 'workSite', siteType: 'quarry' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
    refundOnFailure: true,
  },
  {
    id: 'establish-work-site-lumber',
    name: 'Establish Lumber Camp',
    category: 'region',
    skill: 'Industry',
    desc: 'Create a lumber camp in a forest hex',
    rpCost: 2,
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexForest',
    effects: {
      criticalSuccess: [{ type: 'workSite', siteType: 'lumber', bonus: true }],
      success: [{ type: 'workSite', siteType: 'lumber' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
    refundOnFailure: true,
  },
  {
    id: 'fortify-hex',
    name: 'Fortify Hex',
    category: 'region',
    skill: 'Defense',
    desc: 'Build defensive structures in a hex',
    rpCost: 2,
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHex',
    effects: {
      criticalSuccess: [{ type: 'fortifyHex', bonus: 2 }],
      success: [{ type: 'fortifyHex', bonus: 1 }],
      failure: [],
      criticalFailure: [],
    },
    refundOnFailure: true,
  },
  {
    id: 'go-fishing',
    name: 'Go Fishing',
    category: 'region',
    skill: 'Wilderness',
    desc: 'Fish in a water-adjacent hex',
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexWaterAdjacent',
    effects: {
      criticalSuccess: [{ type: 'commodity', commodity: 'food', delta: 2 }],
      success: [{ type: 'commodity', commodity: 'food', delta: 1 }],
      failure: [],
      criticalFailure: [], // Lose fishing gear (flavor)
    },
  },
  {
    id: 'harvest-crops',
    name: 'Harvest Crops',
    category: 'region',
    skill: 'Agriculture',
    desc: 'Harvest from existing farmland',
    requiresInput: ['hexCoord'],
    prerequisite: 'ownedHexWithFarm',
    effects: {
      criticalSuccess: [{ type: 'commodity', commodity: 'food', delta: 2 }],
      success: [{ type: 'commodity', commodity: 'food', delta: 1 }],
      failure: [],
      criticalFailure: [{ type: 'commodity', commodity: 'food', delta: -1 }],
    },
  },
];

// ============================================
// CIVIC ACTIVITIES
// ============================================
export const CIVIC_ACTIVITIES = [
  {
    id: 'build-structure',
    name: 'Build Structure',
    category: 'civic',
    skill: 'varies', // Determined by structure
    desc: 'Construct a building in a settlement',
    requiresInput: ['settlementId', 'structureId', 'blockId', 'lotIndex'],
    effects: {
      criticalSuccess: [{ type: 'buildStructure', discount: true }],
      success: [{ type: 'buildStructure' }],
      failure: [{ type: 'special', key: 'halfRpLost' }],
      criticalFailure: [{ type: 'ruin', ruinType: 'Decay', delta: 1 }],
    },
  },
  {
    id: 'demolish',
    name: 'Demolish',
    category: 'civic',
    skill: 'none',
    desc: 'Tear down a structure',
    requiresInput: ['settlementId', 'structureId'],
    effects: {
      criticalSuccess: [{ type: 'demolish', recover: true }],
      success: [{ type: 'demolish' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'establish-settlement',
    name: 'Establish Settlement',
    category: 'civic',
    skill: 'Engineering',
    desc: 'Found a new settlement in a claimed hex',
    rpCost: 0, // First block is free, additional blocks cost RP
    requiresInput: ['hexCoord', 'settlementName'],
    prerequisite: 'ownedHexNoSettlement',
    effects: {
      criticalSuccess: [{ type: 'establishSettlement' }, { type: 'xp', delta: 40 }],
      success: [{ type: 'establishSettlement' }, { type: 'xp', delta: 20 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'relocate-capital',
    name: 'Relocate Capital',
    category: 'civic',
    skill: 'Statecraft',
    desc: 'Move capital to a different settlement',
    requiresInput: ['settlementId'],
    prerequisite: 'hasMultipleSettlements',
    effects: {
      criticalSuccess: [{ type: 'relocateCapital' }],
      success: [{ type: 'relocateCapital' }, { type: 'unrest', delta: 1 }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: '1d4' }],
    },
  },
];

// ============================================
// COMMERCE ACTIVITIES
// ============================================
export const COMMERCE_ACTIVITIES = [
  {
    id: 'collect-taxes',
    name: 'Collect Taxes',
    category: 'commerce',
    skill: 'Trade',
    desc: 'Gather taxes from citizens',
    phase: 'commerce',
    effects: {
      criticalSuccess: [{ type: 'special', key: 'taxesCrit' }], // +1 bonus RP
      success: [{ type: 'special', key: 'taxes' }],
      failure: [{ type: 'special', key: 'taxesReduced' }],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
  {
    id: 'trade-commodities',
    name: 'Trade Commodities',
    category: 'commerce',
    skill: 'Trade',
    desc: 'Buy or sell commodities',
    phase: 'commerce',
    requiresInput: ['tradeType', 'commodity', 'amount'], // buy/sell, which commodity, how many
    effects: {
      criticalSuccess: [{ type: 'special', key: 'tradeExcellent' }],
      success: [{ type: 'special', key: 'tradeFair' }],
      failure: [{ type: 'special', key: 'tradePoor' }],
      criticalFailure: [{ type: 'special', key: 'tradeTerrible' }],
    },
  },
  {
    id: 'establish-trade-agreement',
    name: 'Establish Trade Agreement',
    category: 'commerce',
    skill: 'Trade',
    desc: 'Create a trade route with a neighbor',
    phase: 'commerce',
    requiresInput: ['targetFaction'],
    effects: {
      criticalSuccess: [{ type: 'special', key: 'tradeAgreementLucrative' }],
      success: [{ type: 'special', key: 'tradeAgreement' }],
      failure: [],
      criticalFailure: [{ type: 'unrest', delta: 1 }],
    },
  },
];

// ============================================
// COMBINED EXPORTS
// ============================================
export const ALL_ACTIVITIES = [
  ...LEADERSHIP_ACTIVITIES,
  ...REGION_ACTIVITIES,
  ...CIVIC_ACTIVITIES,
  ...COMMERCE_ACTIVITIES,
];

export const getActivityById = (id) => ALL_ACTIVITIES.find(a => a.id === id);

export const getActivitiesByCategory = (category) => 
  ALL_ACTIVITIES.filter(a => a.category === category);

export const getActivitiesForPhase = (phase) => {
  switch (phase) {
    case 'upkeep':
      return []; // Upkeep has fixed steps, not activities
    case 'commerce':
      return COMMERCE_ACTIVITIES;
    case 'activity':
      return [...LEADERSHIP_ACTIVITIES, ...REGION_ACTIVITIES, ...CIVIC_ACTIVITIES];
    case 'event':
      return []; // Events are rolled, not chosen
    default:
      return [];
  }
};
