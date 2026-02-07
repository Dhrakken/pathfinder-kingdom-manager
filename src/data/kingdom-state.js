// Kingdom State Schema and Factory
import { COMMODITY_TYPES, RUIN_TYPES, ALL_SKILLS, GOLARION_MONTHS } from './reference.js';

// Create initial kingdom state
export const createInitialKingdomState = (overrides = {}) => ({
  // Basic Info
  name: 'New Kingdom',
  capital: '',
  level: 1,
  xp: 0,
  fame: 0,
  infamy: 0,
  
  // Founding choices
  charter: null,
  heartland: null,
  government: null,
  
  // Ability Scores
  abilities: {
    Culture: 10,
    Economy: 10,
    Loyalty: 10,
    Stability: 10,
  },
  
  // Skill Proficiencies
  skillProficiencies: ALL_SKILLS.reduce((acc, skill) => {
    acc[skill] = 'Untrained';
    return acc;
  }, {}),
  
  unrest: 0,
  
  ruin: RUIN_TYPES.reduce((acc, type) => {
    acc[type] = { score: 0, threshold: 10 };
    return acc;
  }, {}),
  
  commodities: COMMODITY_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {}),
  commodityCapacity: COMMODITY_TYPES.reduce((acc, type) => {
    acc[type] = 4;
    return acc;
  }, {}),
  
  resourcePoints: 0,
  hexes: [],
  settlements: [
    // Sample settlement for testing the settlement builder
    {
      id: 'lakewatch-1',
      name: 'Lakewatch',
      isCapital: true,
      hex: 'f19',
      blocks: 4,
      structures: ['houses', 'inn', 'shrine'],
      mapConfig: { waterfront: 'south' },
    },
  ],
  leaders: [],
  feats: [],
  currentTurn: 1,
  currentMonth: 'Pharast',
  currentYear: 0,
  turnState: createInitialTurnState(),
  turnHistory: [],
  bonuses: {
    bonusDice: 0,
    penaltyDice: 0,
    circumstanceBonus: 0,
    circumstancePenalty: 0,
    itemBonuses: {},
  },
  ...overrides,
});

export const createInitialTurnState = () => ({
  phase: 'upkeep',
  upkeepComplete: false,
  commerceComplete: false,
  activityComplete: false,
  eventComplete: false,
  resourceDiceRolled: false,
  resourceDiceResult: 0,
  resourceDiceBreakdown: [],
  taxesCollected: false,
  taxesResult: 0,
  consumptionPaid: false,
  leadershipActivitiesUsed: 0,
  leadershipActivitiesMax: 2,
  regionActivitiesUsed: 0,
  civicActivitiesUsed: 0,
  firstBuildingsThisTurn: [],
  activityLog: [],
  eventOccurred: false,
  eventDetails: null,
});

export const createSettlement = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'New Settlement',
  hexCoordinate: '',
  isCapital: false,
  level: 1,
  type: 'Village',
  infrastructure: {
    pavedStreets: false,
    magicalStreetlamps: false,
    sewerSystem: false,
  },
  blocks: {
    A: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    B: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    C: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    D: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    E: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    F: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    G: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    H: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
    I: { lots: [null, null, null, null], walls: { north: null, east: null, south: null, west: null } },
  },
  waterBorders: [],
  bridges: [],
  notes: '',
  ...overrides,
});

export const createBuildingPlacement = (structureId, overrides = {}) => ({
  id: crypto.randomUUID(),
  structureId,
  constructedTurn: 1,
  ...overrides,
});

export const createLeader = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: '',
  role: '',
  isPC: false,
  isInvested: false,
  isVacant: false,
  notes: '',
  ...overrides,
});

export const createHex = (coordinate, overrides = {}) => ({
  coordinate,
  terrain: 'plains',
  features: [],
  workSite: null,
  roads: false,
  fortified: false,
  explored: true,
  claimed: true,
  settlementId: null,
  notes: '',
  ...overrides,
});

export const createTurnHistoryEntry = (turn, month, year, overrides = {}) => ({
  turn,
  month,
  year,
  xpGained: 0,
  fameChange: 0,
  infamyChange: 0,
  unrestChange: 0,
  ruinChanges: { Corruption: 0, Crime: 0, Decay: 0, Strife: 0 },
  commodityChanges: { Food: 0, Lumber: 0, Luxuries: 0, Ore: 0, Stone: 0 },
  hexesClaimed: [],
  hexesAbandoned: [],
  buildingsConstructed: [],
  buildingsDemolished: [],
  activities: [],
  events: [],
  notes: '',
  ...overrides,
});

export const createActivityLogEntry = (activityKey, overrides = {}) => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  activityKey,
  activityName: '',
  phase: '',
  skill: '',
  roll: null,
  dc: null,
  result: '',
  modifiers: [],
  effects: [],
  inputs: {},
  notes: '',
  ...overrides,
});

export const XP_AWARDS = {
  claimHex: 10,
  claimHexCritical: 20,
  firstVillage: 20,
  firstTown: 40,
  firstCity: 80,
  firstMetropolis: 100,
  buildStructure: 'varies',
  eventResolved: 'varies',
  milestone: 80,
  rulerCriticalSuccess: 10,
  diplomaticVictory: 40,
};

export const getStructureXP = (structureLevel) => structureLevel * 10;

export const advanceMonth = (currentMonth) => {
  const index = GOLARION_MONTHS.indexOf(currentMonth);
  return GOLARION_MONTHS[(index + 1) % 12];
};

export const shouldAdvanceYear = (currentMonth) => currentMonth === 'Kuthona';
