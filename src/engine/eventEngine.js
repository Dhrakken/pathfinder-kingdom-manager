// ============================================
// EVENT ENGINE
// Random Kingdom Events for PF2E Kingmaker
// ============================================

import { getControlDC, getSizeData } from '../data/reference.js';
import { getSkillModifier, getSkillModifierBreakdown } from './activityEngine.js';

// Random event table - 36 events covering all 16 skills
export const KINGDOM_EVENTS = [
  // ========== CULTURE SKILLS ==========
  // Arts
  {
    id: 'artistic-masterpiece',
    name: 'Artistic Masterpiece',
    description: 'A renowned artist seeks patronage to create a great work in your kingdom.',
    skill: 'Arts',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 2, unrest: -1, message: 'The masterpiece becomes legendary, drawing visitors from afar!' },
      success: { fame: 1, message: 'A beautiful work is created that brings pride to your people.' },
      failure: { rp: -1, message: 'The project stalls due to creative differences.' },
      criticalFailure: { rp: -2, unrest: 1, message: 'The artist creates a controversial piece that divides opinion.' },
    },
  },
  {
    id: 'theater-troupe',
    name: 'Traveling Theater',
    description: 'A theater troupe arrives seeking permission to perform.',
    skill: 'Arts',
    dcModifier: -2,
    outcomes: {
      criticalSuccess: { unrest: -2, fame: 1, message: 'The performances are a sensation! Everyone is talking about them.' },
      success: { unrest: -1, message: 'The shows provide welcome entertainment.' },
      failure: { message: 'Mediocre performances draw modest crowds.' },
      criticalFailure: { unrest: 1, message: 'The troupe\'s bawdy show offends local sensibilities.' },
    },
  },
  
  // Folklore
  {
    id: 'religious-festival',
    name: 'Religious Festival',
    description: 'A holy day approaches and the faithful expect celebrations.',
    skill: 'Folklore',
    dcModifier: -2,
    outcomes: {
      criticalSuccess: { unrest: -2, fame: 1, message: 'A magnificent festival that will be remembered for years!' },
      success: { unrest: -1, message: 'The celebration brings joy to the people.' },
      failure: { message: 'A modest observance, neither memorable nor disappointing.' },
      criticalFailure: { unrest: 1, ruin: { Corruption: 1 }, message: 'The festival descends into debauchery and scandal.' },
    },
  },
  {
    id: 'local-legend',
    name: 'Local Legend Surfaces',
    description: 'Tales of buried treasure or a lost ruin spread through the populace.',
    skill: 'Folklore',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { luxuries: 2, xp: 20, message: 'The legend proves true! Treasure is recovered!' },
      success: { luxuries: 1, message: 'Some valuables are found at the legendary site.' },
      failure: { unrest: 1, message: 'Treasure hunters cause problems searching for nothing.' },
      criticalFailure: { unrest: 2, message: 'The "treasure hunt" turns into a lawless rush.' },
    },
  },
  
  // Magic
  {
    id: 'arcane-discovery',
    name: 'Arcane Discovery',
    description: 'Scholars have uncovered an ancient magical artifact or text.',
    skill: 'Magic',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { luxuries: 2, xp: 20, message: 'A powerful artifact is safely recovered!' },
      success: { luxuries: 1, message: 'The discovery yields valuable magical resources.' },
      failure: { message: 'The discovery proves less significant than hoped.' },
      criticalFailure: { unrest: 1, ruin: { Corruption: 1 }, message: 'The artifact releases harmful magical energy!' },
    },
  },
  {
    id: 'wild-magic',
    name: 'Wild Magic Surge',
    description: 'Strange magical phenomena manifest across the kingdom.',
    skill: 'Magic',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { luxuries: 1, fame: 1, message: 'Mages harness the surge for beneficial effects!' },
      success: { message: 'The magic is contained without incident.' },
      failure: { unrest: 1, message: 'Strange effects unnerve the populace.' },
      criticalFailure: { unrest: 2, ruin: { Corruption: 1 }, message: 'Magical chaos damages property and injures citizens!' },
    },
  },
  
  // Scholarship
  {
    id: 'visiting-scholar',
    name: 'Visiting Scholar',
    description: 'A renowned sage seeks to establish a library or academy.',
    skill: 'Scholarship',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, xp: 20, message: 'The scholar establishes a center of learning!' },
      success: { xp: 10, message: 'Valuable knowledge is shared with your people.' },
      failure: { message: 'The scholar moves on, unimpressed by local facilities.' },
      criticalFailure: { infamy: 1, message: 'The scholar publicly criticizes your kingdom\'s ignorance.' },
    },
  },
  {
    id: 'historical-dispute',
    name: 'Historical Dispute',
    description: 'Two factions argue over historical claims to land or titles.',
    skill: 'Scholarship',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { unrest: -1, fame: 1, message: 'Your wise ruling satisfies all parties!' },
      success: { message: 'A fair compromise is reached.' },
      failure: { unrest: 1, message: 'The dispute remains unresolved and simmers.' },
      criticalFailure: { unrest: 2, ruin: { Strife: 1 }, message: 'Your ruling enrages one faction!' },
    },
  },
  
  // ========== ECONOMY SKILLS ==========
  // Boating
  {
    id: 'river-trade',
    name: 'River Trade Boom',
    description: 'Merchants seek to establish river trade routes through your territory.',
    skill: 'Boating',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { rp: 3, fame: 1, message: 'Your waterways become a major trade artery!' },
      success: { rp: 2, message: 'River trade brings prosperity.' },
      failure: { message: 'Trade routes prove impractical.' },
      criticalFailure: { rp: -1, message: 'A shipping accident damages your reputation.' },
    },
  },
  {
    id: 'flooding',
    name: 'River Flooding',
    description: 'Heavy rains cause rivers to overflow their banks.',
    skill: 'Boating',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { message: 'Excellent preparations prevent all damage.' },
      success: { message: 'Minor flooding is quickly managed.' },
      failure: { food: -1, unrest: 1, message: 'Floods damage farmland and homes.' },
      criticalFailure: { food: -2, unrest: 2, ruin: { Decay: 1 }, message: 'Catastrophic flooding destroys crops and buildings!' },
    },
  },
  
  // Engineering
  {
    id: 'natural-disaster',
    name: 'Natural Disaster',
    description: 'Earthquakes or storms threaten your settlements.',
    skill: 'Engineering',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { message: 'Your preparations minimize all damage.' },
      success: { message: 'Some damage occurs but recovery is swift.' },
      failure: { rp: -2, unrest: 1, message: 'Significant damage requires costly repairs.' },
      criticalFailure: { rp: -4, unrest: 2, ruin: { Decay: 1 }, message: 'Devastation! Buildings collapse and resources are lost.' },
    },
  },
  {
    id: 'infrastructure-decay',
    name: 'Infrastructure Decay',
    description: 'Roads and bridges show signs of wear and neglect.',
    skill: 'Engineering',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, message: 'Repairs improve infrastructure beyond its original state!' },
      success: { message: 'Necessary repairs are completed efficiently.' },
      failure: { rp: -1, message: 'Repairs cost more than expected.' },
      criticalFailure: { rp: -2, unrest: 1, ruin: { Decay: 1 }, message: 'A bridge collapses! Someone may have been hurt.' },
    },
  },
  
  // Exploration
  {
    id: 'new-resources',
    name: 'Resource Discovery',
    description: 'Explorers report finding valuable resources in unclaimed territory.',
    skill: 'Exploration',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { ore: 2, stone: 1, xp: 20, message: 'A major deposit is discovered!' },
      success: { ore: 1, message: 'Useful resources are found.' },
      failure: { message: 'The reports prove exaggerated.' },
      criticalFailure: { unrest: 1, message: 'Expeditions return empty-handed after costly efforts.' },
    },
  },
  {
    id: 'lost-expedition',
    name: 'Lost Expedition',
    description: 'An exploration party has gone missing in the wilderness.',
    skill: 'Exploration',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { fame: 1, xp: 30, message: 'The expedition is rescued with valuable discoveries!' },
      success: { message: 'The lost explorers are found and returned safely.' },
      failure: { unrest: 1, message: 'The search fails; the expedition is presumed lost.' },
      criticalFailure: { unrest: 2, message: 'The rescue party also goes missing!' },
    },
  },
  
  // Industry
  {
    id: 'labor-dispute',
    name: 'Labor Dispute',
    description: 'Workers are protesting conditions and demanding better treatment.',
    skill: 'Industry',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { unrest: -2, message: 'You address their concerns with wisdom, earning loyalty.' },
      success: { unrest: -1, message: 'A fair compromise is reached.' },
      failure: { unrest: 1, message: 'The dispute drags on, souring morale.' },
      criticalFailure: { unrest: 3, ruin: { Strife: 1 }, message: 'The protest turns into a riot!' },
    },
  },
  {
    id: 'production-boom',
    name: 'Production Boom',
    description: 'Favorable conditions lead to increased industrial output.',
    skill: 'Industry',
    dcModifier: -2,
    outcomes: {
      criticalSuccess: { lumber: 2, ore: 1, stone: 1, message: 'Exceptional productivity across all sectors!' },
      success: { lumber: 1, ore: 1, message: 'Good output from your work sites.' },
      failure: { message: 'Production remains steady, nothing special.' },
      criticalFailure: { unrest: 1, message: 'Overwork leads to accidents and complaints.' },
    },
  },
  
  // Trade
  {
    id: 'trade-opportunity',
    name: 'Trade Opportunity',
    description: 'Merchants from distant lands arrive seeking to establish trade.',
    skill: 'Trade',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { rp: 4, luxuries: 1, message: 'Lucrative trade deals are struck!' },
      success: { rp: 2, message: 'Fair trade agreements are established.' },
      failure: { message: 'Negotiations stall but no harm done.' },
      criticalFailure: { rp: -1, unrest: 1, message: 'Trade talks break down acrimoniously.' },
    },
  },
  {
    id: 'merchant-caravan',
    name: 'Merchant Caravan',
    description: 'A large merchant caravan requests passage and trading rights.',
    skill: 'Trade',
    dcModifier: -2,
    outcomes: {
      criticalSuccess: { rp: 3, luxuries: 1, message: 'Excellent trade and lasting connections!' },
      success: { rp: 2, message: 'Profitable trading for all parties.' },
      failure: { rp: 1, message: 'Minimal trade, but tolls collected.' },
      criticalFailure: { unrest: 1, ruin: { Crime: 1 }, message: 'The caravan brought thieves and swindlers!' },
    },
  },
  
  // ========== LOYALTY SKILLS ==========
  // Intrigue
  {
    id: 'spy-discovered',
    name: 'Spy Discovered',
    description: 'A foreign spy has been discovered in your kingdom.',
    skill: 'Intrigue',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { fame: 1, xp: 20, message: 'The spy is captured and turned into a double agent!' },
      success: { message: 'The spy is captured and expelled.' },
      failure: { message: 'The spy escapes but causes no immediate harm.' },
      criticalFailure: { infamy: 1, ruin: { Crime: 1 }, message: 'The spy escapes with sensitive information.' },
    },
  },
  {
    id: 'assassination-plot',
    name: 'Assassination Plot',
    description: 'Rumors of a plot against kingdom leadership surface.',
    skill: 'Intrigue',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { fame: 1, message: 'The plotters are exposed and brought to justice!' },
      success: { message: 'The plot is foiled before anyone is harmed.' },
      failure: { unrest: 1, message: 'The threat lingers, keeping everyone on edge.' },
      criticalFailure: { unrest: 2, ruin: { Crime: 1 }, message: 'An attempt is made! A leader is wounded.' },
    },
  },
  
  // Politics
  {
    id: 'diplomatic-visit',
    name: 'Diplomatic Visit',
    description: 'Envoys from a neighboring nation arrive seeking audience.',
    skill: 'Politics',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, unrest: -1, message: 'Your diplomatic prowess impresses the envoys greatly.' },
      success: { message: 'The visit goes smoothly and goodwill is established.' },
      failure: { message: 'The envoys depart without incident but unimpressed.' },
      criticalFailure: { infamy: 1, unrest: 1, message: 'A diplomatic incident damages your reputation.' },
    },
  },
  {
    id: 'squatters',
    name: 'Squatters',
    description: 'Homeless refugees have settled in your territory without permission.',
    skill: 'Politics',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, unrest: -1, message: 'You integrate the refugees as productive citizens!' },
      success: { message: 'The squatters are peacefully relocated.' },
      failure: { unrest: 1, message: 'Tensions arise between squatters and citizens.' },
      criticalFailure: { unrest: 2, ruin: { Strife: 1 }, message: 'Conflict erupts between the groups!' },
    },
  },
  
  // Statecraft
  {
    id: 'succession-crisis',
    name: 'Succession Question',
    description: 'Citizens question the legitimacy or succession of leadership.',
    skill: 'Statecraft',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { fame: 1, unrest: -1, message: 'Your authority is reaffirmed with popular support!' },
      success: { message: 'Concerns are addressed and stability maintained.' },
      failure: { unrest: 1, message: 'Grumbling continues but no action is taken.' },
      criticalFailure: { unrest: 3, ruin: { Strife: 1 }, message: 'A rival faction openly challenges leadership!' },
    },
  },
  {
    id: 'new-laws',
    name: 'Legal Reform',
    description: 'Citizens petition for new laws or changes to existing ones.',
    skill: 'Statecraft',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, unrest: -1, message: 'Your wise laws become a model for the region!' },
      success: { message: 'Fair laws are enacted to general approval.' },
      failure: { unrest: 1, message: 'The changes please no one.' },
      criticalFailure: { unrest: 2, message: 'The new laws cause outrage and protests!' },
    },
  },
  
  // Warfare
  {
    id: 'bandit-activity',
    name: 'Bandit Activity',
    description: 'Bandits have been raiding trade routes and farms.',
    skill: 'Warfare',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, xp: 20, message: 'Your forces crush the bandits decisively!' },
      success: { message: 'The bandits are driven off with minimal losses.' },
      failure: { food: -1, unrest: 1, message: 'Bandits escape with stolen goods.' },
      criticalFailure: { food: -2, unrest: 2, ruin: { Crime: 1 }, message: 'Bandits run rampant, stealing and terrorizing citizens.' },
    },
  },
  {
    id: 'border-skirmish',
    name: 'Border Skirmish',
    description: 'Armed forces from a neighboring territory test your borders.',
    skill: 'Warfare',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { fame: 1, xp: 30, message: 'A decisive victory sends a clear message!' },
      success: { message: 'The incursion is repelled.' },
      failure: { unrest: 1, message: 'Skirmishes continue; citizens feel unsafe.' },
      criticalFailure: { unrest: 2, ruin: { Strife: 1 }, message: 'Territory is lost or citizens are taken captive!' },
    },
  },
  
  // ========== STABILITY SKILLS ==========
  // Agriculture
  {
    id: 'bountiful-harvest',
    name: 'Bountiful Harvest',
    description: 'Favorable weather and fertile soil have led to an exceptional harvest.',
    skill: 'Agriculture',
    dcModifier: -2,
    outcomes: {
      criticalSuccess: { food: 3, unrest: -1, message: 'The harvest is legendary! Surplus food fills every storehouse.' },
      success: { food: 2, message: 'An excellent harvest provides extra food.' },
      failure: { food: 1, message: 'A decent harvest, nothing special.' },
      criticalFailure: { unrest: 1, message: 'The harvest celebration draws criticism for wastefulness.' },
    },
  },
  {
    id: 'crop-blight',
    name: 'Crop Blight',
    description: 'A mysterious blight threatens this season\'s crops.',
    skill: 'Agriculture',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { food: 1, message: 'Quick action saves the crops and prevents spread!' },
      success: { message: 'The blight is contained with minimal losses.' },
      failure: { food: -1, unrest: 1, message: 'Significant crop losses this season.' },
      criticalFailure: { food: -2, unrest: 2, message: 'The blight devastates the harvest!' },
    },
  },
  
  // Defense
  {
    id: 'disease-outbreak',
    name: 'Disease Outbreak',
    description: 'A sickness spreads through one of your settlements.',
    skill: 'Defense',
    dcModifier: 2,
    outcomes: {
      criticalSuccess: { fame: 1, unrest: -1, message: 'Swift action contains the outbreak and saves lives.' },
      success: { message: 'The disease is contained with some effort.' },
      failure: { unrest: 2, message: 'The outbreak spreads before being contained.' },
      criticalFailure: { unrest: 3, ruin: { Decay: 1 }, message: 'The plague ravages the population.' },
    },
  },
  {
    id: 'fire-outbreak',
    name: 'Fire!',
    description: 'A fire breaks out in a settlement.',
    skill: 'Defense',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { fame: 1, message: 'Heroes emerge as the fire is quickly contained!' },
      success: { message: 'The fire is put out with minor damage.' },
      failure: { rp: -1, unrest: 1, message: 'Several buildings are damaged.' },
      criticalFailure: { rp: -3, unrest: 2, ruin: { Decay: 1 }, message: 'The fire spreads, destroying a city block!' },
    },
  },
  
  // Wilderness
  {
    id: 'monster-sighting',
    name: 'Monster Sighting',
    description: 'A dangerous creature has been spotted in your territory.',
    skill: 'Wilderness',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { xp: 30, fame: 1, message: 'The beast is slain and becomes a trophy of your might!' },
      success: { xp: 10, message: 'The creature is driven away from settled areas.' },
      failure: { unrest: 1, message: 'The creature escapes, leaving citizens fearful.' },
      criticalFailure: { unrest: 2, food: -1, message: 'The monster attacks livestock and citizens flee in terror.' },
    },
  },
  {
    id: 'fey-mischief',
    name: 'Fey Mischief',
    description: 'Mischievous fey creatures are causing trouble.',
    skill: 'Wilderness',
    dcModifier: 0,
    outcomes: {
      criticalSuccess: { luxuries: 1, message: 'You befriend the fey, who offer gifts!' },
      success: { message: 'The fey are appeased and cease their pranks.' },
      failure: { unrest: 1, message: 'The pranks continue, annoying everyone.' },
      criticalFailure: { unrest: 2, food: -1, message: 'The fey escalate to sabotage and theft!' },
    },
  },
  {
    id: 'good-omens',
    name: 'Good Omens',
    description: 'Strange but fortuitous signs appear across the land.',
    skill: 'Wilderness',
    dcModifier: -2,
    outcomes: {
      criticalSuccess: { fame: 1, unrest: -2, message: 'The omens herald great fortune! Morale soars!' },
      success: { unrest: -1, message: 'Citizens take heart from the positive signs.' },
      failure: { message: 'The omens fade without effect.' },
      criticalFailure: { unrest: 1, message: 'Superstitious citizens see the signs as warnings.' },
    },
  },
];

/**
 * Roll a random event from the table
 */
export const rollRandomEvent = () => {
  const index = Math.floor(Math.random() * KINGDOM_EVENTS.length);
  return KINGDOM_EVENTS[index];
};

/**
 * Get an event by ID
 */
export const getEventById = (eventId) => {
  return KINGDOM_EVENTS.find(e => e.id === eventId);
};

/**
 * Get events filtered by skill
 */
export const getEventsBySkill = (skillName) => {
  return KINGDOM_EVENTS.filter(e => e.skill === skillName);
};

/**
 * Perform the skill check for an event
 */
export const resolveEvent = (state, event) => {
  const sizeData = getSizeData(state.kingdom?.hexes || 1);
  const baseDC = getControlDC(state.kingdom?.level || 1) + sizeData.dcMod + (event.dcModifier || 0);
  
  const breakdown = getSkillModifierBreakdown(state, event.skill);
  const modifier = breakdown.total;
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + modifier;
  
  // Determine degree
  let degree;
  if (roll === 20 && total >= baseDC) {
    degree = 'criticalSuccess';
  } else if (roll === 1 && total < baseDC + 10) {
    degree = 'criticalFailure';
  } else if (total >= baseDC + 10) {
    degree = 'criticalSuccess';
  } else if (total >= baseDC) {
    degree = 'success';
  } else if (total <= baseDC - 10) {
    degree = 'criticalFailure';
  } else {
    degree = 'failure';
  }
  
  return {
    roll,
    modifier,
    total,
    dc: baseDC,
    degree,
    outcome: event.outcomes[degree],
    breakdown,
  };
};

/**
 * Apply event outcome effects to state
 */
export const applyEventOutcome = (state, outcome) => {
  let newState = { ...state };
  const log = [];
  
  if (outcome.rp) {
    const newRP = Math.max(0, (newState.resources?.rp || 0) + outcome.rp);
    newState = { ...newState, resources: { ...newState.resources, rp: newRP } };
    log.push(outcome.rp > 0 ? `+${outcome.rp} RP` : `${outcome.rp} RP`);
  }
  
  if (outcome.food) {
    const newFood = Math.max(0, (newState.resources?.food || 0) + outcome.food);
    newState = { ...newState, resources: { ...newState.resources, food: newFood } };
    log.push(outcome.food > 0 ? `+${outcome.food} Food` : `${outcome.food} Food`);
  }
  
  if (outcome.lumber) {
    const newLumber = Math.max(0, (newState.resources?.lumber || 0) + outcome.lumber);
    newState = { ...newState, resources: { ...newState.resources, lumber: newLumber } };
    log.push(outcome.lumber > 0 ? `+${outcome.lumber} Lumber` : `${outcome.lumber} Lumber`);
  }
  
  if (outcome.ore) {
    const newOre = Math.max(0, (newState.resources?.ore || 0) + outcome.ore);
    newState = { ...newState, resources: { ...newState.resources, ore: newOre } };
    log.push(outcome.ore > 0 ? `+${outcome.ore} Ore` : `${outcome.ore} Ore`);
  }
  
  if (outcome.stone) {
    const newStone = Math.max(0, (newState.resources?.stone || 0) + outcome.stone);
    newState = { ...newState, resources: { ...newState.resources, stone: newStone } };
    log.push(outcome.stone > 0 ? `+${outcome.stone} Stone` : `${outcome.stone} Stone`);
  }
  
  if (outcome.luxuries) {
    const newLux = Math.max(0, (newState.resources?.luxuries || 0) + outcome.luxuries);
    newState = { ...newState, resources: { ...newState.resources, luxuries: newLux } };
    log.push(outcome.luxuries > 0 ? `+${outcome.luxuries} Luxuries` : `${outcome.luxuries} Luxuries`);
  }
  
  if (outcome.unrest) {
    const newUnrest = Math.max(0, (newState.unrest || 0) + outcome.unrest);
    newState = { ...newState, unrest: newUnrest };
    log.push(outcome.unrest > 0 ? `+${outcome.unrest} Unrest` : `${outcome.unrest} Unrest`);
  }
  
  if (outcome.fame) {
    const newFame = Math.max(0, (newState.kingdom?.fame || 0) + outcome.fame);
    newState = { ...newState, kingdom: { ...newState.kingdom, fame: newFame } };
    log.push(`+${outcome.fame} Fame`);
  }
  
  if (outcome.infamy) {
    const newInfamy = Math.max(0, (newState.kingdom?.infamy || 0) + outcome.infamy);
    newState = { ...newState, kingdom: { ...newState.kingdom, infamy: newInfamy } };
    log.push(`+${outcome.infamy} Infamy`);
  }
  
  if (outcome.xp) {
    const newXP = (newState.kingdom?.xp || 0) + outcome.xp;
    newState = { ...newState, kingdom: { ...newState.kingdom, xp: newXP } };
    log.push(`+${outcome.xp} XP`);
  }
  
  if (outcome.ruin) {
    const newRuin = { ...newState.ruin };
    for (const [ruinType, delta] of Object.entries(outcome.ruin)) {
      newRuin[ruinType] = Math.max(0, (newRuin[ruinType] || 0) + delta);
      log.push(`+${delta} ${ruinType}`);
    }
    newState = { ...newState, ruin: newRuin };
  }
  
  return { state: newState, log };
};

/**
 * Run a complete event phase
 */
export const runEventPhase = (state) => {
  // Roll for event
  const event = rollRandomEvent();
  
  // Resolve it
  const resolution = resolveEvent(state, event);
  
  // Apply outcome
  const { state: newState, log } = applyEventOutcome(state, resolution.outcome);
  
  // Mark event phase complete
  const finalState = {
    ...newState,
    turn: {
      ...newState.turn,
      phaseComplete: {
        ...newState.turn.phaseComplete,
        event: true,
      },
      lastEvent: {
        id: event.id,
        name: event.name,
        description: event.description,
        skill: event.skill,
        roll: resolution.roll,
        modifier: resolution.modifier,
        total: resolution.total,
        dc: resolution.dc,
        degree: resolution.degree,
        outcome: resolution.outcome,
      },
    },
  };
  
  return {
    state: finalState,
    event,
    resolution,
    effectLog: log,
  };
};

/**
 * Get count of events
 */
export const getEventCount = () => KINGDOM_EVENTS.length;
