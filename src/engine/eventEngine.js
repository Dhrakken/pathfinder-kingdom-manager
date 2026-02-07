// ============================================
// EVENT ENGINE
// Random Kingdom Events for PF2E Kingmaker
// ============================================

import { getControlDC, getSizeData } from '../data/reference.js';
import { getSkillModifier, getSkillModifierBreakdown } from './activityEngine.js';

// Random event table (simplified - expandable later)
export const KINGDOM_EVENTS = [
  // Beneficial Events
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
  
  // Challenging Events
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
    id: 'natural-disaster',
    name: 'Natural Disaster',
    description: 'Floods, storms, or earthquakes threaten your settlements.',
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
];

/**
 * Roll a random event from the table
 */
export const rollRandomEvent = () => {
  const index = Math.floor(Math.random() * KINGDOM_EVENTS.length);
  return KINGDOM_EVENTS[index];
};

/**
 * Perform the skill check for an event
 */
export const resolveEvent = (state, event) => {
  const sizeData = getSizeData(state.kingdom?.hexes || 1);
  const baseDC = getControlDC(state.kingdom?.level || 1) + sizeData.dcMod + (event.dcModifier || 0);
  
  const modifier = getSkillModifier(state, event.skill);
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
