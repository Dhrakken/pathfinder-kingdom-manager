// ============================================
// KINGDOM ACTIVITIES (PF2E Kingmaker)
// ============================================

// Leadership Activities (limit per turn based on government building)
export const LEADERSHIP_ACTIVITIES = [
  { id: 'celebrate-holiday', name: 'Celebrate Holiday', skill: 'Folklore', desc: 'Hold a celebration to reduce Unrest', outcomes: { criticalSuccess: '-2 Unrest, +1 Fame', success: '-1 Unrest', failure: 'No effect', criticalFailure: '+1 Unrest' } },
  { id: 'craft-luxuries', name: 'Craft Luxuries', skill: 'Industry', desc: 'Create luxury goods', rp: 5, outcomes: { criticalSuccess: 'Gain 2 Luxuries', success: 'Gain 1 Luxuries', failure: 'No luxuries, lose RP', criticalFailure: 'No luxuries, lose RP, +1 Decay' } },
  { id: 'creative-solution', name: 'Creative Solution', skill: 'Scholarship', desc: 'Find creative answer to problem', outcomes: { criticalSuccess: 'Solve problem, -1 Unrest', success: 'Solve problem', failure: 'No solution', criticalFailure: 'No solution, +1 Unrest' } },
  { id: 'hire-adventurers', name: 'Hire Adventurers', skill: 'Warfare', desc: 'Hire adventurers for a task', rp: 'varies', outcomes: { criticalSuccess: 'Task completed excellently', success: 'Task completed', failure: 'Task failed, lose RP', criticalFailure: 'Task failed badly, lose RP, +1 Unrest' } },
  { id: 'improve-lifestyle', name: 'Improve Lifestyle', skill: 'Politics', desc: 'Improve citizen lifestyle', outcomes: { criticalSuccess: '-2 Unrest', success: '-1 Unrest', failure: 'No effect', criticalFailure: '+1 Unrest' } },
  { id: 'new-leadership', name: 'New Leadership', skill: 'Politics', desc: 'Assign or change leadership role', outcomes: { criticalSuccess: 'Smooth transition', success: 'Role assigned', failure: 'Role not assigned', criticalFailure: 'Role not assigned, +1 Unrest' } },
  { id: 'prognostication', name: 'Prognostication', skill: 'Magic', desc: 'Divine future events', outcomes: { criticalSuccess: 'Detailed forewarning', success: 'Vague warning', failure: 'No insight', criticalFailure: 'False insight, -1 to next event check' } },
  { id: 'provide-care', name: 'Provide Care', skill: 'Defense', desc: 'Heal sick/injured citizens', outcomes: { criticalSuccess: 'Full recovery, -1 Unrest', success: 'Recovery', failure: 'No improvement', criticalFailure: 'Condition worsens, +1 Unrest' } },
  { id: 'quell-unrest', name: 'Quell Unrest', skill: 'Intrigue', desc: 'Reduce kingdom Unrest', outcomes: { criticalSuccess: '-2 Unrest', success: '-1 Unrest', failure: 'No change', criticalFailure: '+1 Unrest' } },
  { id: 'repair-reputation', name: 'Repair Reputation', skill: 'Politics', desc: 'Reduce Infamy or Ruin', outcomes: { criticalSuccess: '-2 chosen stat', success: '-1 chosen stat', failure: 'No change', criticalFailure: '+1 chosen stat' } },
  { id: 'rest-and-relax', name: 'Rest and Relax', skill: 'Arts', desc: 'Take time for leisure', outcomes: { criticalSuccess: '-2 Unrest, +1 Fame', success: '-1 Unrest', failure: 'No effect', criticalFailure: '+1 Unrest' } },
  { id: 'supernatural-solution', name: 'Supernatural Solution', skill: 'Magic', desc: 'Use magic to solve problem', outcomes: { criticalSuccess: 'Magical solution found, -1 Unrest', success: 'Magical solution found', failure: 'No solution', criticalFailure: 'Magical mishap, +1 Corruption' } },
];

// Region Activities (unlimited per turn)
export const REGION_ACTIVITIES = [
  { id: 'claim-hex', name: 'Claim Hex', skill: 'Exploration', desc: 'Claim adjacent explored hex', rp: 1, outcomes: { criticalSuccess: 'Hex claimed, +20 XP', success: 'Hex claimed, +10 XP', failure: 'Hex not claimed', criticalFailure: 'Hex not claimed, +1 Unrest' } },
  { id: 'abandon-hex', name: 'Abandon Hex', skill: 'Wilderness', desc: 'Relinquish claimed hex', outcomes: { criticalSuccess: 'Hex abandoned cleanly', success: 'Hex abandoned, +1 Unrest', failure: 'Cannot abandon', criticalFailure: 'Cannot abandon, +1d4 Unrest' } },
  { id: 'build-roads', name: 'Build Roads', skill: 'Engineering', desc: 'Construct roads in hex', rp: 1, outcomes: { criticalSuccess: 'Roads built, reduce travel time', success: 'Roads built', failure: 'Roads not built', criticalFailure: 'Roads not built, lose RP' } },
  { id: 'clear-hex', name: 'Clear Hex', skill: 'Exploration', desc: 'Remove hazards from hex', outcomes: { criticalSuccess: 'Hex cleared, discover resource', success: 'Hex cleared', failure: 'Hex not cleared', criticalFailure: 'Hex not cleared, random encounter' } },
  { id: 'establish-farmland', name: 'Establish Farmland', skill: 'Agriculture', desc: 'Create farmland in hex', rp: 2, outcomes: { criticalSuccess: 'Farmland established, produces 2 Food', success: 'Farmland established, produces 1 Food', failure: 'Farmland not established', criticalFailure: 'Farmland not established, lose RP' } },
  { id: 'establish-work-site', name: 'Establish Work Site', skill: 'Industry', desc: 'Create work site (Mine, Quarry, etc)', rp: 2, outcomes: { criticalSuccess: 'Work site established, bonus production', success: 'Work site established', failure: 'Work site not established', criticalFailure: 'Work site not established, lose RP, +1 Unrest' } },
  { id: 'fortify-hex', name: 'Fortify Hex', skill: 'Defense', desc: 'Build defensive structures in hex', rp: 2, outcomes: { criticalSuccess: 'Hex fortified, +2 Defense', success: 'Hex fortified, +1 Defense', failure: 'Hex not fortified', criticalFailure: 'Hex not fortified, lose RP' } },
  { id: 'go-fishing', name: 'Go Fishing', skill: 'Wilderness', desc: 'Fish in water hex', outcomes: { criticalSuccess: 'Gain 2 Food', success: 'Gain 1 Food', failure: 'No catch', criticalFailure: 'No catch, lose fishing gear' } },
  { id: 'harvest-crops', name: 'Harvest Crops', skill: 'Agriculture', desc: 'Harvest from farmland', outcomes: { criticalSuccess: 'Bountiful harvest, +2 Food', success: 'Normal harvest', failure: 'Poor harvest', criticalFailure: 'Crop failure, -1 Food' } },
];

// Civic Activities (unlimited per turn)
export const CIVIC_ACTIVITIES = [
  { id: 'build-structure', name: 'Build Structure', skill: 'Varies', desc: 'Construct building in settlement', rp: 'varies', outcomes: { criticalSuccess: 'Structure built, reduced cost', success: 'Structure built', failure: 'Structure not built, lose half RP', criticalFailure: 'Structure not built, lose all RP, +1 Decay' } },
  { id: 'demolish', name: 'Demolish', skill: 'None', desc: 'Tear down structure', outcomes: { criticalSuccess: 'Structure demolished, recover half materials', success: 'Structure demolished', failure: 'Cannot demolish', criticalFailure: 'Demolition accident, +1 Unrest' } },
  { id: 'establish-settlement', name: 'Establish Settlement', skill: 'Engineering', desc: 'Found new settlement in claimed hex', rp: 'varies', outcomes: { criticalSuccess: 'Settlement established, +40 XP', success: 'Settlement established, +20 XP', failure: 'Settlement not established', criticalFailure: 'Settlement not established, +1 Unrest' } },
  { id: 'relocate-capital', name: 'Relocate Capital', skill: 'Statecraft', desc: 'Move capital to different settlement', outcomes: { criticalSuccess: 'Capital relocated smoothly', success: 'Capital relocated, +1 Unrest', failure: 'Capital not relocated', criticalFailure: 'Capital not relocated, +1d4 Unrest' } },
];

// Commerce Activities (during Commerce phase)
export const COMMERCE_ACTIVITIES = [
  { id: 'collect-taxes', name: 'Collect Taxes', skill: 'Trade', desc: 'Gather taxes from citizens', outcomes: { criticalSuccess: 'Collect taxes + 1 bonus RP', success: 'Collect standard taxes', failure: 'Reduced taxes collected', criticalFailure: 'No taxes, +1 Unrest' } },
  { id: 'trade-commodities', name: 'Trade Commodities', skill: 'Trade', desc: 'Buy/sell commodities', outcomes: { criticalSuccess: 'Excellent trade terms', success: 'Fair trade', failure: 'Poor trade terms', criticalFailure: 'Terrible trade, lose value' } },
  { id: 'establish-trade-agreement', name: 'Establish Trade Agreement', skill: 'Trade', desc: 'Create trade route with neighbor', outcomes: { criticalSuccess: 'Lucrative agreement', success: 'Trade agreement established', failure: 'No agreement', criticalFailure: 'Diplomatic incident, +1 Unrest' } },
];

// All activities combined
export const ALL_ACTIVITIES = [
  ...LEADERSHIP_ACTIVITIES,
  ...REGION_ACTIVITIES,
  ...CIVIC_ACTIVITIES,
  ...COMMERCE_ACTIVITIES,
];

export const getActivityById = (id) => ALL_ACTIVITIES.find(a => a.id === id);
