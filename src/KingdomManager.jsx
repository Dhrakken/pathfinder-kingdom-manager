import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  Crown, Users, Coins, TreePine, Gem, Wheat, Mountain, Hammer,
  Shield, BookOpen, Sword, Calendar, Plus, Save, Download, Upload,
  Home, LayoutDashboard, Map, History, Settings, ChevronRight, Dice6,
  AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown,
  ChevronDown, Image, Grid, Hexagon, Building2
} from 'lucide-react';
import { 
  getSizeData, getControlDC, ABILITIES, SKILLS, ALL_SKILLS,
  LEADERSHIP_ROLES, COMMODITY_TYPES, RUIN_TYPES, GOLARION_MONTHS,
  getProficiencyBonus, getAbilityForSkill
} from './data/reference.js';
import { STRUCTURES, getStructuresByLevel } from './data/structures.js';
import { 
  LEADERSHIP_ACTIVITIES, REGION_ACTIVITIES, CIVIC_ACTIVITIES, 
  COMMERCE_ACTIVITIES, getActivityById 
} from './data/activities.js';
import HexMap from './components/HexMap.jsx';
import StolenLandsMap from './components/StolenLandsMap.jsx';
import ActivityModal from './components/ActivityModal.jsx';
import TradeModal from './components/TradeModal.jsx';
import KingdomCreationWizard from './components/KingdomCreationWizard.jsx';
import LevelUpModal from './components/LevelUpModal.jsx';
import SkillsPanel from './components/SkillsPanel.jsx';
import SettlementBuilder from './components/SettlementBuilder.jsx';
import { checkLevelUp, checkMilestones, awardMilestones, getXPToNextLevel } from './engine/progressionEngine.js';
import { HEX_STATUS, parseImportedMapData } from './utils/hexUtils.js';
import { runFullUpkeep, checkLeadershipVacancies } from './engine/upkeepEngine.js';
import { runEventPhase, KINGDOM_EVENTS } from './engine/eventEngine.js';
import { runCommercePhase, tradeCommodities, COMMODITY_BASE_VALUES } from './engine/commerceEngine.js';

// ============================================
// PHASES
// ============================================
const PHASES = [
  { id: 'upkeep', name: 'Upkeep', icon: Calendar },
  { id: 'commerce', name: 'Commerce', icon: Coins },
  { id: 'activity', name: 'Activity', icon: Hammer },
  { id: 'event', name: 'Event', icon: AlertTriangle },
];

// ============================================
// DICE UTILITIES
// ============================================
const rollDie = (sides) => Math.floor(Math.random() * sides) + 1;
const rollDice = (count, sides) => Array(count).fill(0).map(() => rollDie(sides));
const sumDice = (rolls) => rolls.reduce((a, b) => a + b, 0);

// ============================================
// INITIAL STATE (Nauthgard)
// ============================================
const createInitialState = () => {
  const hexes = 12;
  const level = 3;
  const sizeData = getSizeData(hexes);
  
  return {
    // Factions for territory control
    factions: {
      '1': { id: '1', name: 'Nauthgard', color: '#6366f1', isPlayer: true },
    },
    kingdom: {
      name: 'Nauthgard',
      capital: 'Lakewatch',
      level,
      xp: 186,
      xpToNext: 1000,
      hexes,
      sizeType: sizeData.type,
      resourceDie: sizeData.die,
      fame: 3,
      infamy: 0,
    },
    abilities: {
      Culture: 12,
      Economy: 14,
      Loyalty: 14,
      Stability: 14,
    },
    skillProficiencies: {
      Agriculture: 'Trained',
      Defense: 'Trained',
      Engineering: 'Trained',
      Trade: 'Trained',
      Warfare: 'Trained',
      Wilderness: 'Trained',
    },
    resources: {
      rp: 8,
      food: 4,
      lumber: 3,
      luxuries: 1,
      ore: 2,
      stone: 2,
    },
    ruin: {
      Corruption: 0,
      Crime: 2,
      Decay: 0,
      Strife: 1,
    },
    unrest: 1,
    consumption: 2,
    workSites: {
      farmlands: 2,
      lumberCamps: 1,
      mines: 1,
      quarries: 1,
    },
    leadership: LEADERSHIP_ROLES.map(role => ({
      ...role,
      holder: null,
      invested: false,
      isPC: false,
      bio: '',
    })),
    settlements: [
      {
        id: 'lakewatch',
        name: 'Lakewatch',
        isCapital: true,
        blocks: 6,
        structures: ['town-hall', 'houses', 'houses', 'inn', 'shrine', 'general-store'],
      },
    ],
    turn: {
      year: 4708,
      month: 'Lamashan',
      number: 1,
      phase: 'upkeep',
      phaseComplete: {
        upkeep: false,
        commerce: false,
        activity: false,
        event: false,
      },
      leadershipActionsUsed: 0,
      leadershipActionsMax: 3,
    },
    log: [],
    history: [],
    // Hex map data - Nauthgard's claimed territory
    hexMap: {
      // Claimed hexes (12 total)
      'c19': { coord: 'c19', status: 'claimed', terrain: 'plains', faction: '1', workSite: null, settlement: null, notes: 'Gold Mine nearby' },
      'c20': { coord: 'c20', status: 'claimed', terrain: 'plains', faction: '1', workSite: null, settlement: null, notes: '' },
      'd18': { coord: 'd18', status: 'claimed', terrain: 'forest', faction: '1', workSite: null, settlement: null, notes: 'Corrupted Temple - Druids nearby' },
      'd19': { coord: 'd19', status: 'claimed', terrain: 'hills', faction: '1', workSite: 'mine', settlement: null, notes: 'Mine worksite' },
      'd20': { coord: 'd20', status: 'claimed', terrain: 'forest', faction: '1', workSite: 'lumber', settlement: null, notes: 'Lumber camp' },
      'd21': { coord: 'd21', status: 'claimed', terrain: 'hills', faction: '1', workSite: 'mine', settlement: null, notes: 'Ore mine - 2 ore per turn' },
      'd22': { coord: 'd22', status: 'claimed', terrain: 'plains', faction: '1', workSite: null, settlement: null, notes: '' },
      'e18': { coord: 'e18', status: 'claimed', terrain: 'plains', faction: '1', workSite: 'farm', settlement: null, notes: 'Fang Berries location' },
      'e19': { coord: 'e19', status: 'claimed', terrain: 'plains', faction: '1', workSite: 'farm', settlement: null, notes: 'Farmland' },
      'e20': { coord: 'e20', status: 'claimed', terrain: 'plains', faction: '1', workSite: 'quarry', settlement: null, notes: 'Quarry worksite' },
      'f19': { coord: 'f19', status: 'claimed', terrain: 'hills', faction: '1', workSite: null, settlement: 'Lakewatch', notes: 'Capital - Fort on a hill with wooden palisades' },
      'f20': { coord: 'f20', status: 'claimed', terrain: 'plains', faction: '1', workSite: null, settlement: null, notes: '' },
      // Explored but unclaimed
      'a18': { coord: 'a18', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a19': { coord: 'a19', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a20': { coord: 'a20', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a21': { coord: 'a21', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a22': { coord: 'a22', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a23': { coord: 'a23', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a24': { coord: 'a24', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a25': { coord: 'a25', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a26': { coord: 'a26', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'a27': { coord: 'a27', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'b18': { coord: 'b18', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'b19': { coord: 'b19', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'b20': { coord: 'b20', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'b21': { coord: 'b21', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'b22': { coord: 'b22', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'b23': { coord: 'b23', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'c17': { coord: 'c17', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'c18': { coord: 'c18', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'c21': { coord: 'c21', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'c22': { coord: 'c22', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'd17': { coord: 'd17', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'd23': { coord: 'd23', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'e17': { coord: 'e17', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'f18': { coord: 'f18', status: 'explored', terrain: 'forest', faction: null, workSite: null, settlement: null, notes: '' },
      'f21': { coord: 'f21', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'g17': { coord: 'g17', status: 'explored', terrain: 'swamp', faction: null, workSite: null, settlement: null, notes: '' },
      'g18': { coord: 'g18', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'g19': { coord: 'g19', status: 'explored', terrain: 'plains', faction: null, workSite: null, settlement: null, notes: '' },
      'g20': { coord: 'g20', status: 'explored', terrain: 'water', faction: null, workSite: null, settlement: null, notes: '' },
      'h17': { coord: 'h17', status: 'explored', terrain: 'swamp', faction: null, workSite: null, settlement: null, notes: 'Hag - Elga Vernex' },
      'h18': { coord: 'h18', status: 'explored', terrain: 'water', faction: null, workSite: null, settlement: null, notes: '' },
      'h19': { coord: 'h19', status: 'explored', terrain: 'water', faction: null, workSite: null, settlement: null, notes: 'Candlemeer Island - haunted' },
    },
  };
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function KingdomManager() {
  const [state, setState] = useState(createInitialState);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [diceResult, setDiceResult] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showKingdomWizard, setShowKingdomWizard] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  
  // Multi-map system
  const [selectedMapId, setSelectedMapId] = useState('kingdom'); // 'kingdom' or custom map id
  const [customMaps, setCustomMaps] = useState(() => {
    const saved = localStorage.getItem('kingdomManager_customMaps');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn('Failed to load custom maps'); }
    }
    return [];
  });
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [showAddMapModal, setShowAddMapModal] = useState(false);

  // Save custom maps to localStorage when they change
  useEffect(() => {
    localStorage.setItem('kingdomManager_customMaps', JSON.stringify(customMaps));
  }, [customMaps]);
  
  // Close dropdown when clicking outside
  const mapDropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mapDropdownRef.current && !mapDropdownRef.current.contains(e.target)) {
        setShowMapDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeData = getSizeData(state.kingdom.hexes);
  const controlDC = getControlDC(state.kingdom.level) + sizeData.dcMod;
  const totalRuin = Object.values(state.ruin).reduce((a, b) => a + b, 0);
  const unrestPenalty = state.unrest >= 15 ? 4 : state.unrest >= 10 ? 3 : state.unrest >= 5 ? 2 : state.unrest >= 1 ? 1 : 0;

  const getAbilityMod = (ability) => Math.floor((state.abilities[ability] - 10) / 2);

  const getSkillMod = (skillName) => {
    const ability = getAbilityForSkill(skillName);
    if (!ability) return 0;
    const abilityMod = getAbilityMod(ability);
    const proficiency = state.skillProficiencies[skillName] || 'Untrained';
    const profBonus = getProficiencyBonus(proficiency, state.kingdom.level);
    return abilityMod + profBonus - unrestPenalty;
  };

  const addLog = useCallback((message, type = 'info') => {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      turn: state.turn.number,
      phase: state.turn.phase,
      message,
      type,
    };
    setState(prev => ({ ...prev, log: [...prev.log, entry] }));
  }, [state.turn.number, state.turn.phase]);

  const rollResourceDice = useCallback(() => {
    const count = state.kingdom.level + 4;
    const sides = sizeData.die;
    const rolls = rollDice(count, sides);
    const total = sumDice(rolls);
    setDiceResult({ rolls, total, sides });
    setState(prev => ({ ...prev, resources: { ...prev.resources, rp: prev.resources.rp + total } }));
    addLog(`Rolled ${count}d${sides} for Resource Points: [${rolls.join(', ')}] = ${total} RP`, 'success');
  }, [state.kingdom.level, sizeData.die, addLog]);

  const collectWorkSites = useCallback(() => {
    const { farmlands, lumberCamps, mines, quarries } = state.workSites;
    setState(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        food: prev.resources.food + farmlands,
        lumber: prev.resources.lumber + lumberCamps,
        ore: prev.resources.ore + mines,
        stone: prev.resources.stone + quarries,
      },
    }));
    addLog(`Collected from work sites: +${farmlands} Food, +${lumberCamps} Lumber, +${mines} Ore, +${quarries} Stone`, 'success');
  }, [state.workSites, addLog]);

  const payConsumption = useCallback(() => {
    if (state.resources.food >= state.consumption) {
      setState(prev => ({ ...prev, resources: { ...prev.resources, food: prev.resources.food - prev.consumption } }));
      addLog(`Paid consumption: -${state.consumption} Food`, 'success');
    } else {
      const shortage = state.consumption - state.resources.food;
      const unrestGain = rollDie(4);
      setState(prev => ({ ...prev, resources: { ...prev.resources, food: 0 }, unrest: prev.unrest + unrestGain }));
      addLog(`Food shortage! Missing ${shortage} Food. +${unrestGain} Unrest`, 'failure');
    }
  }, [state.resources.food, state.consumption, addLog]);

  const advancePhase = useCallback(() => {
    const phaseOrder = ['upkeep', 'commerce', 'activity', 'event'];
    const currentIndex = phaseOrder.indexOf(state.turn.phase);
    if (currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1];
      setState(prev => ({
        ...prev,
        turn: { ...prev.turn, phase: nextPhase, phaseComplete: { ...prev.turn.phaseComplete, [prev.turn.phase]: true } },
      }));
      addLog(`Advanced to ${nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)} Phase`, 'info');
    }
  }, [state.turn.phase, addLog]);

  const endTurn = useCallback(() => {
    const monthIndex = GOLARION_MONTHS.indexOf(state.turn.month);
    const nextMonthIndex = (monthIndex + 1) % 12;
    const nextMonth = GOLARION_MONTHS[nextMonthIndex];
    const nextYear = nextMonthIndex === 0 ? state.turn.year + 1 : state.turn.year;
    const turnSummary = { number: state.turn.number, year: state.turn.year, month: state.turn.month, log: [...state.log], endState: { rp: state.resources.rp, unrest: state.unrest, xp: state.kingdom.xp } };
    setState(prev => ({
      ...prev,
      turn: { ...prev.turn, number: prev.turn.number + 1, year: nextYear, month: nextMonth, phase: 'upkeep', phaseComplete: { upkeep: false, commerce: false, activity: false, event: false }, leadershipActionsUsed: 0 },
      history: [...prev.history, turnSummary],
      log: [],
    }));
    addLog(`Turn ${state.turn.number} ended. Beginning ${nextMonth}, ${nextYear}`, 'info');
  }, [state, addLog]);

  const performSkillCheck = useCallback((skillName, dc) => {
    const modifier = getSkillMod(skillName);
    const roll = rollDie(20);
    const total = roll + modifier;
    const degree = total >= dc + 10 ? 'criticalSuccess' : total >= dc ? 'success' : total <= dc - 10 ? 'criticalFailure' : 'failure';
    return { roll, modifier, total, dc, degree };
  }, [getSkillMod]);

  const exportState = () => {
    // Gather all data including localStorage map data
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      kingdom: state,
      mapData: {
        poiPositions: JSON.parse(localStorage.getItem('kingdomManager_poiPositions') || '[]'),
        partyPosition: JSON.parse(localStorage.getItem('kingdomManager_partyPosition') || '{"x":4200,"y":1300}'),
      },
      customMaps: customMaps,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.kingdom.name.toLowerCase()}-turn-${state.turn.number}.json`;
    a.click();
    addLog('Full kingdom state exported (includes map data)', 'success');
  };

  const importState = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          
          // Handle new format with version
          if (imported.version && imported.kingdom) {
            setState(imported.kingdom);
            
            // Restore map data
            if (imported.mapData?.poiPositions) {
              localStorage.setItem('kingdomManager_poiPositions', JSON.stringify(imported.mapData.poiPositions));
            }
            if (imported.mapData?.partyPosition) {
              localStorage.setItem('kingdomManager_partyPosition', JSON.stringify(imported.mapData.partyPosition));
            }
            
            // Restore custom maps
            if (imported.customMaps) {
              setCustomMaps(imported.customMaps);
            }
            
            addLog('Full kingdom state imported (includes map data)', 'success');
          } else {
            // Legacy format - just kingdom state
            setState(imported);
            addLog('Kingdom state imported (legacy format)', 'success');
          }
        } catch (err) {
          addLog('Failed to import state: Invalid JSON', 'failure');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="royal-header rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Crown className="w-8 h-8 text-purple-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-yellow-400 font-cinzel">{state.kingdom.name}</h1>
              <p className="text-purple-200">Capital: {state.kingdom.capital} • {state.turn.month}, {state.turn.year}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 text-xl font-bold">Level {state.kingdom.level}</div>
            <div className="text-purple-200">{state.kingdom.xp} / {getXPToNextLevel(state.kingdom.level)} XP</div>
            <div className="text-sm text-purple-300">{sizeData.type} • {state.kingdom.hexes} hexes</div>
            {checkLevelUp(state).shouldLevel && (
              <button
                onClick={() => setShowLevelUpModal(true)}
                className="mt-2 px-3 py-1 bg-green-500 hover:bg-green-400 text-black text-sm font-bold rounded animate-pulse"
              >
                ⬆ Level Up Available!
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-yellow-400">Turn {state.turn.number} - {state.turn.phase.charAt(0).toUpperCase() + state.turn.phase.slice(1)} Phase</h2>
          <div className="text-sm text-gray-400">Control DC: {controlDC}</div>
        </div>
        <div className="flex gap-2">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            const isActive = state.turn.phase === phase.id;
            const isComplete = state.turn.phaseComplete[phase.id];
            return (
              <div key={phase.id} className={`flex-1 p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${isActive ? 'bg-yellow-500/20 border border-yellow-500' : isComplete ? 'bg-green-500/20 border border-green-500/50' : 'bg-white/5 border border-white/10'}`}>
                {isComplete ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Icon className="w-4 h-4" />}
                <span className={isActive ? 'text-yellow-400' : ''}>{phase.name}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          {state.turn.phase === 'upkeep' && !state.turn.phaseComplete.upkeep && (
            <button
              onClick={() => {
                const result = runFullUpkeep(state);
                setState(result.state);
                // Log all upkeep steps
                for (const step of result.logs) {
                  for (const msg of step.logs) {
                    addLog(`[${step.step}] ${msg}`, msg.includes('+') && msg.includes('Unrest') ? 'failure' : 'info');
                  }
                }
                addLog('Upkeep Phase complete', 'success');
              }}
              className="btn-royal flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Run Full Upkeep
            </button>
          )}
          {state.turn.phase === 'commerce' && !state.turn.phaseComplete.commerce && (
            <>
              <button
                onClick={() => {
                  const result = runCommercePhase(state);
                  setState(result.state);
                  for (const step of result.logs) {
                    for (const msg of step.logs) {
                      addLog(`[${step.step}] ${msg}`, msg.includes('Critical Failure') ? 'failure' : 'info');
                    }
                  }
                }}
                className="btn-royal flex items-center gap-2"
              >
                <Coins className="w-4 h-4" /> Collect Taxes
              </button>
              <button
                onClick={() => setShowTradeModal(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" /> Trade Commodities
              </button>
            </>
          )}
          {state.turn.phase === 'event' && !state.turn.phaseComplete.event && (
            <button
              onClick={() => {
                const result = runEventPhase(state);
                setState(result.state);
                
                const degreeLabel = {
                  criticalSuccess: 'Critical Success!',
                  success: 'Success',
                  failure: 'Failure',
                  criticalFailure: 'Critical Failure!',
                }[result.resolution.degree];
                
                addLog(`EVENT: ${result.event.name}`, 'info');
                addLog(`${result.event.description}`, 'info');
                addLog(`${result.event.skill} check: ${result.resolution.roll} + ${result.resolution.modifier} = ${result.resolution.total} vs DC ${result.resolution.dc}`, 'info');
                addLog(`${degreeLabel}: ${result.resolution.outcome.message}`, result.resolution.degree.includes('Success') ? 'success' : 'failure');
                if (result.effectLog.length > 0) {
                  addLog(`Effects: ${result.effectLog.join(', ')}`, result.effectLog.some(e => e.includes('+') && !e.includes('Unrest') && !e.includes('Infamy')) ? 'success' : 'failure');
                }
              }}
              className="btn-royal flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Roll Random Event
            </button>
          )}
          <button onClick={advancePhase} className="btn-royal flex items-center gap-2"><ChevronRight className="w-4 h-4" /> Advance Phase</button>
          {state.turn.phase === 'event' && state.turn.phaseComplete.event && <button onClick={endTurn} className="btn-secondary">End Turn</button>}
        </div>
        
        {/* Show last event if in event phase and completed */}
        {state.turn.phase === 'event' && state.turn.lastEvent && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">{state.turn.lastEvent.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                state.turn.lastEvent.degree === 'criticalSuccess' ? 'bg-green-500/20 text-green-400' :
                state.turn.lastEvent.degree === 'success' ? 'bg-blue-500/20 text-blue-400' :
                state.turn.lastEvent.degree === 'failure' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {state.turn.lastEvent.degree === 'criticalSuccess' ? 'Crit Success!' :
                 state.turn.lastEvent.degree === 'success' ? 'Success' :
                 state.turn.lastEvent.degree === 'failure' ? 'Failure' : 'Crit Failure!'}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-2">{state.turn.lastEvent.description}</p>
            <p className="text-gray-300 text-sm">{state.turn.lastEvent.outcome.message}</p>
            <div className="text-xs text-gray-500 mt-2">
              {state.turn.lastEvent.skill} check: {state.turn.lastEvent.roll} + {state.turn.lastEvent.modifier} = {state.turn.lastEvent.total} vs DC {state.turn.lastEvent.dc}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Culture', 'Economy', 'Loyalty', 'Stability'].map(ability => (
          <div key={ability} className="glass-card p-4 text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider">{ability}</div>
            <div className="text-2xl font-bold text-yellow-400">{state.abilities[ability]}</div>
            <div className="text-sm text-gray-300">{getAbilityMod(ability) >= 0 ? '+' : ''}{getAbilityMod(ability)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-yellow-400 font-semibold flex items-center gap-2"><Coins className="w-5 h-5" /> Resource Points</h3>
            <span className="text-2xl font-bold">{state.resources.rp} RP</span>
          </div>
          {state.turn.phase === 'upkeep' && !state.turn.phaseComplete.upkeep && (
            <button onClick={rollResourceDice} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Dice6 className="w-4 h-4" /> Roll Resource Dice ({state.kingdom.level + 4}d{sizeData.die})
            </button>
          )}
          {(diceResult || state.turn.resourceDiceResult) && (
            <div className="mt-2 p-2 bg-black/30 rounded text-sm">
              Last roll: {state.turn.resourceDiceResult || diceResult?.total} RP
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="text-yellow-400 font-semibold mb-3">Commodities</h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="commodity-card"><Wheat className="w-5 h-5 mx-auto mb-1 text-amber-400" /><div className="text-lg font-bold">{state.resources.food}</div><div className="text-xs text-gray-400">Food</div></div>
            <div className="commodity-card"><TreePine className="w-5 h-5 mx-auto mb-1 text-green-400" /><div className="text-lg font-bold">{state.resources.lumber}</div><div className="text-xs text-gray-400">Lumber</div></div>
            <div className="commodity-card"><Gem className="w-5 h-5 mx-auto mb-1 text-pink-400" /><div className="text-lg font-bold">{state.resources.luxuries}</div><div className="text-xs text-gray-400">Luxuries</div></div>
            <div className="commodity-card"><Mountain className="w-5 h-5 mx-auto mb-1 text-orange-400" /><div className="text-lg font-bold">{state.resources.ore}</div><div className="text-xs text-gray-400">Ore</div></div>
            <div className="commodity-card"><div className="w-5 h-5 mx-auto mb-1 bg-gray-400 rounded" /><div className="text-lg font-bold">{state.resources.stone}</div><div className="text-xs text-gray-400">Stone</div></div>
          </div>
          {state.turn.phase === 'upkeep' && !state.turn.phaseComplete.upkeep && (
            <div className="mt-3 flex gap-2">
              <button onClick={collectWorkSites} className="btn-secondary flex-1">Collect Work Sites</button>
              <button onClick={payConsumption} className="btn-secondary flex-1">Pay Consumption ({state.consumption})</button>
            </div>
          )}
          {state.turn.phaseComplete.upkeep && (
            <div className="mt-3 text-sm text-green-400 text-center">✓ Upkeep complete</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-yellow-400 font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Unrest</h3>
            <span className={`text-2xl font-bold ${state.unrest >= 5 ? 'text-red-400' : 'text-green-400'}`}>{state.unrest}</span>
          </div>
          {unrestPenalty > 0 && <div className="text-sm text-red-400 mt-1">-{unrestPenalty} penalty to all checks</div>}
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full ${state.unrest >= 10 ? 'bg-red-500' : state.unrest >= 5 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.min(state.unrest * 5, 100)}%` }} /></div>
        </div>
        <div className="glass-card p-4">
          <h3 className="text-yellow-400 font-semibold mb-3">Ruin (Total: {totalRuin})</h3>
          <div className="grid grid-cols-4 gap-2">{['Corruption', 'Crime', 'Decay', 'Strife'].map(type => (<div key={type} className="text-center"><div className="text-xs text-gray-400">{type}</div><div className="text-lg font-bold">{state.ruin[type]}</div></div>))}</div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-yellow-400 font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowKingdomWizard(true)} className="btn-royal flex items-center gap-2"><Crown className="w-4 h-4" /> New Kingdom</button>
          <button onClick={exportState} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer"><Upload className="w-4 h-4" /> Import<input type="file" accept=".json" onChange={importState} className="hidden" /></label>
        </div>
      </div>
    </div>
  );

  const renderLeadership = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2"><Users className="w-6 h-6" /> Leadership Council</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.leadership.map((role, index) => (
          <div key={role.id} className="glass-card glass-card-hover p-4">
            <div className="flex items-center justify-between mb-2"><h3 className="font-semibold text-yellow-400">{role.name}</h3><span className="text-xs bg-purple-900/50 px-2 py-1 rounded">{role.ability}</span></div>
            <p className="text-sm text-gray-400 mb-3">{role.description}</p>
            <input type="text" placeholder="Holder name..." value={role.holder || ''} onChange={(e) => { const newLeadership = [...state.leadership]; newLeadership[index] = { ...role, holder: e.target.value }; setState(prev => ({ ...prev, leadership: newLeadership })); }} className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm mb-2" />
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={role.isPC} onChange={(e) => { const newLeadership = [...state.leadership]; newLeadership[index] = { ...role, isPC: e.target.checked }; setState(prev => ({ ...prev, leadership: newLeadership })); }} className="rounded" />PC</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={role.invested} onChange={(e) => { const newLeadership = [...state.leadership]; newLeadership[index] = { ...role, invested: e.target.checked }; setState(prev => ({ ...prev, leadership: newLeadership })); }} className="rounded" />Invested</label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActivities = () => {
    // Helper to render an activity card
    const ActivityCard = ({ activity }) => (
      <button
        key={activity.id}
        onClick={() => { setSelectedActivity(activity); setShowActivityModal(true); }}
        className="text-left p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-yellow-500/50 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="font-medium">{activity.name}</div>
          {activity.rpCost > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded ${state.resources.rp >= activity.rpCost ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
              {activity.rpCost} RP
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-1">{activity.skill} • {activity.desc}</div>
      </button>
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-yellow-400">Activities</h2>
          <div className="text-sm text-gray-400">
            Leadership Actions: {state.turn.leadershipActionsUsed}/{state.turn.leadershipActionsMax} • RP: {state.resources.rp}
          </div>
        </div>
        
        <div className="glass-card p-4">
          <h3 className="text-yellow-400 font-semibold mb-3">Leadership Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {LEADERSHIP_ACTIVITIES.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
          </div>
        </div>
        
        <div className="glass-card p-4">
          <h3 className="text-yellow-400 font-semibold mb-3">Region Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {REGION_ACTIVITIES.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
          </div>
        </div>
        
        <div className="glass-card p-4">
          <h3 className="text-yellow-400 font-semibold mb-3">Civic Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {CIVIC_ACTIVITIES.map(activity => <ActivityCard key={activity.id} activity={activity} />)}
          </div>
        </div>
      </div>
    );
  };

  const renderSettlements = () => {
    const handleUpdateSettlement = (updatedSettlement, newResources) => {
      setState(prev => ({
        ...prev,
        settlements: prev.settlements.map(s => 
          s.id === updatedSettlement.id ? updatedSettlement : s
        ),
        resources: newResources || prev.resources,
      }));
    };
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
            <Home className="w-6 h-6" /> Settlements
          </h2>
          <div className="text-sm text-gray-400">
            {state.settlements?.length || 0} settlement{(state.settlements?.length || 0) !== 1 ? 's' : ''}
          </div>
        </div>
        
        {state.settlements?.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No settlements yet.</p>
            <p className="text-sm mt-2">Use the "Establish Settlement" activity to found one!</p>
          </div>
        ) : (
          state.settlements.map(settlement => (
            <SettlementBuilder
              key={settlement.id}
              settlement={settlement}
              state={state}
              onUpdateSettlement={handleUpdateSettlement}
              onLog={addLog}
            />
          ))
        )}
      </div>
    );
  };

  const renderTurnLog = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2"><History className="w-6 h-6" /> Turn Log</h2>
      <div className="glass-card p-4 max-h-96 overflow-y-auto">
        {state.log.length === 0 ? <p className="text-gray-400">No actions logged this turn.</p> : state.log.map((entry, i) => (<div key={i} className={`log-entry ${entry.type}`}><span className="text-gray-500 text-xs">[{entry.timestamp}]</span> <span className="text-gray-300">{entry.message}</span></div>))}
      </div>
    </div>
  );

  // Handle hex updates from the map
  const handleHexUpdate = useCallback((updatedHex) => {
    setState(prev => ({
      ...prev,
      hexMap: {
        ...prev.hexMap,
        [updatedHex.coord]: updatedHex,
      },
      // Update kingdom hex count if claiming
      kingdom: updatedHex.status === 'claimed' && prev.hexMap[updatedHex.coord]?.status !== 'claimed'
        ? { ...prev.kingdom, hexes: prev.kingdom.hexes + 1 }
        : prev.kingdom,
    }));
    addLog(`Hex ${updatedHex.coord.toUpperCase()}: ${updatedHex.status}`, 'success');
  }, [addLog]);

  const renderMap = () => {
    // Kingdom Map (Stolen Lands)
    if (selectedMapId === 'kingdom') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
              <Map className="w-6 h-6" /> Kingdom Map
            </h2>
            <div className="text-sm text-gray-400">
              {Object.values(state.hexMap).filter(h => h.status === 'claimed').length} hexes claimed
            </div>
          </div>
          <div className="h-[700px]">
            <StolenLandsMap
              hexes={state.hexMap}
              factions={state.factions}
              onHexUpdate={handleHexUpdate}
              onFactionsUpdate={(factions) => setState(prev => ({ ...prev, factions }))}
              kingdomName={state.kingdom.name}
            />
          </div>
        </div>
      );
    }
    
    // Custom Map
    const customMap = customMaps.find(m => m.id === selectedMapId);
    if (!customMap) {
      return <div className="text-gray-400">Map not found</div>;
    }
    
    return (
      <CustomMapViewer
        map={customMap}
        onUpdate={(updatedMap) => {
          setCustomMaps(prev => prev.map(m => m.id === updatedMap.id ? updatedMap : m));
        }}
        onDelete={() => {
          setCustomMaps(prev => prev.filter(m => m.id !== customMap.id));
          setSelectedMapId('kingdom');
        }}
      />
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leadership', label: 'Leadership', icon: Users },
    { id: 'activities', label: 'Activities', icon: Hammer },
    { id: 'skills', label: 'Skills', icon: BookOpen },
    { id: 'settlements', label: 'Settlements', icon: Home },
    { id: 'log', label: 'Log', icon: History },
  ];
  
  // Get current map name for dropdown
  const currentMapName = selectedMapId === 'kingdom' 
    ? 'Kingdom Map' 
    : customMaps.find(m => m.id === selectedMapId)?.name || 'Map';

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Dashboard */}
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'hover:bg-white/5 text-gray-400'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            
            {/* Map dropdown */}
            <div className="relative" ref={mapDropdownRef}>
              <button 
                onClick={() => setShowMapDropdown(!showMapDropdown)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeTab === 'map' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'hover:bg-white/5 text-gray-400'}`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showMapDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMapDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-gray-900 border border-yellow-600/30 rounded-lg shadow-2xl py-1 z-[200]">
                  <button
                    onClick={() => { setSelectedMapId('kingdom'); setActiveTab('map'); setShowMapDropdown(false); }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-yellow-600/20 ${selectedMapId === 'kingdom' ? 'text-yellow-400' : 'text-gray-200'}`}
                  >
                    <Hexagon className="w-4 h-4" />
                    Kingdom Map
                    {selectedMapId === 'kingdom' && <CheckCircle className="w-3 h-3 ml-auto" />}
                  </button>
                  
                  {customMaps.length > 0 && (
                    <>
                      <div className="border-t border-white/10 my-1" />
                      {customMaps.map(map => (
                        <button
                          key={map.id}
                          onClick={() => { setSelectedMapId(map.id); setActiveTab('map'); setShowMapDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-yellow-600/20 ${selectedMapId === map.id ? 'text-yellow-400' : 'text-gray-200'}`}
                        >
                          {map.gridType === 'hex' ? <Hexagon className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                          {map.name}
                          {selectedMapId === map.id && <CheckCircle className="w-3 h-3 ml-auto" />}
                        </button>
                      ))}
                    </>
                  )}
                  
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => { setShowAddMapModal(true); setShowMapDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-yellow-600/20 text-green-400"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Map...
                  </button>
                </div>
              )}
            </div>
            
            {/* Other tabs */}
            {tabs.filter(t => t.id !== 'dashboard').map(tab => { 
              const Icon = tab.icon; 
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${activeTab === tab.id ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'hover:bg-white/5 text-gray-400'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ); 
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'map' && renderMap()}
        {activeTab === 'leadership' && renderLeadership()}
        {activeTab === 'activities' && renderActivities()}
        {activeTab === 'skills' && (
          <SkillsPanel 
            state={state} 
            onStateChange={setState} 
            onLog={addLog} 
          />
        )}
        {activeTab === 'settlements' && renderSettlements()}
        {activeTab === 'log' && renderTurnLog()}
      </main>

      {showActivityModal && selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          state={state}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedActivity(null);
          }}
          onExecute={(newState) => {
            setState(newState);
          }}
          onLog={addLog}
        />
      )}
      
      {/* Trade Modal */}
      {showTradeModal && (
        <TradeModal
          state={state}
          onClose={() => setShowTradeModal(false)}
          onTrade={(newState) => setState(newState)}
          onLog={addLog}
        />
      )}
      
      {/* Kingdom Creation Wizard */}
      {showKingdomWizard && (
        <KingdomCreationWizard
          onCancel={() => setShowKingdomWizard(false)}
          onComplete={(newKingdom) => {
            // Apply the new kingdom settings
            setState(prev => ({
              ...prev,
              kingdom: {
                ...prev.kingdom,
                name: newKingdom.name,
                charter: newKingdom.charter,
                heartland: newKingdom.heartland,
                government: newKingdom.government,
                level: 1,
                xp: 0,
                hexes: 1,
              },
              abilities: newKingdom.abilities,
              skillProficiencies: {
                ...Object.keys(prev.skillProficiencies || {}).reduce((acc, k) => ({ ...acc, [k]: 'Untrained' }), {}),
                ...newKingdom.trainedSkills.reduce((acc, skill) => ({ ...acc, [skill]: 'Trained' }), {}),
              },
              factions: {
                '1': { id: '1', name: newKingdom.name, color: '#6366f1', isPlayer: true },
              },
            }));
            setShowKingdomWizard(false);
            addLog(`Founded the kingdom of ${newKingdom.name}!`, 'success');
          }}
        />
      )}
      
      {/* Level Up Modal */}
      {showLevelUpModal && (
        <LevelUpModal
          state={state}
          onCancel={() => setShowLevelUpModal(false)}
          onComplete={(newState) => {
            setState(newState);
            setShowLevelUpModal(false);
            addLog(`Kingdom leveled up to Level ${newState.kingdom.level}!`, 'success');
            
            // Check for milestones after level up
            const newMilestones = checkMilestones(newState);
            if (newMilestones.length > 0) {
              const milestoneResult = awardMilestones(newState, newMilestones);
              setState(milestoneResult.state);
              for (const msg of milestoneResult.log) {
                addLog(msg, 'success');
              }
            }
          }}
        />
      )}
      
      {/* Add Map Modal */}
      {showAddMapModal && (
        <AddMapModal 
          onClose={() => setShowAddMapModal(false)}
          onAdd={(newMap) => {
            setCustomMaps(prev => [...prev, newMap]);
            setSelectedMapId(newMap.id);
            setActiveTab('map');
            setShowAddMapModal(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================
// ADD MAP MODAL COMPONENT
// ============================================
function AddMapModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [gridType, setGridType] = useState('square');
  const [gridSize, setGridSize] = useState(50);
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target.result);
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleCreate = () => {
    if (!name.trim() || !imageData) return;
    
    const newMap = {
      id: `map-${Date.now()}`,
      name: name.trim(),
      gridType,
      gridSize,
      imageData,
      width: 0, // Will be set when image loads in viewer
      height: 0,
      pois: [],
      fog: [], // Array of revealed cell coordinates
      createdAt: new Date().toISOString(),
    };
    
    onAdd(newMap);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900/95 border border-yellow-600/30 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Add New Map</h3>
        
        <div className="space-y-4">
          {/* Map Name */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Map Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dungeon Level 1, Battle Map..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
          
          {/* Image Upload */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Map Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-800 border border-gray-700 border-dashed rounded px-3 py-4 text-gray-400 hover:border-yellow-500 hover:text-yellow-400 transition-colors flex items-center justify-center gap-2"
            >
              <Image className="w-5 h-5" />
              {imagePreview ? 'Change Image...' : 'Upload Image (JPG, PNG, etc.)'}
            </button>
            {imagePreview && (
              <div className="mt-2 rounded overflow-hidden border border-gray-700">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
              </div>
            )}
          </div>
          
          {/* Grid Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Grid Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGridType('square')}
                className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors ${
                  gridType === 'square' 
                    ? 'bg-yellow-600/30 border border-yellow-500 text-yellow-400' 
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
                Square
              </button>
              <button
                onClick={() => setGridType('hex')}
                className={`flex-1 px-3 py-2 rounded flex items-center justify-center gap-2 transition-colors ${
                  gridType === 'hex' 
                    ? 'bg-yellow-600/30 border border-yellow-500 text-yellow-400' 
                    : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Hexagon className="w-5 h-5" />
                Hex
              </button>
            </div>
          </div>
          
          {/* Grid Size */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Grid Size (pixels per cell)</label>
            <input
              type="range"
              min="20"
              max="200"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-400">{gridSize}px</div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button 
            onClick={handleCreate}
            disabled={!name.trim() || !imageData}
            className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
              name.trim() && imageData
                ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Create Map
          </button>
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CUSTOM MAP VIEWER COMPONENT
// ============================================
function CustomMapViewer({ map, onUpdate, onDelete }) {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(true);
  const [fogMode, setFogMode] = useState(null); // null, 'reveal', or 'hide'
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 1000, height: 1000 });
  const svgRef = useRef(null);
  
  // Local grid settings (editable)
  const [gridSize, setGridSize] = useState(map.gridSize || 50);
  const [gridOffsetX, setGridOffsetX] = useState(map.gridOffsetX || 0);
  const [gridOffsetY, setGridOffsetY] = useState(map.gridOffsetY || 0);
  
  // Save grid settings to map
  const saveGridSettings = () => {
    onUpdate({ ...map, gridSize, gridOffsetX, gridOffsetY, fog: [] }); // Reset fog when grid changes
    setShowGridSettings(false);
  };
  
  // Load image dimensions
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setViewBox({ x: 0, y: 0, width: Math.min(img.width, 1200), height: Math.min(img.height, 800) });
    };
    img.src = map.imageData;
  }, [map.imageData]);
  
  // Generate grid cells with offset
  const gridCells = useMemo(() => {
    const cells = [];
    const { width, height } = imageDimensions;
    const offsetX = gridOffsetX || 0;
    const offsetY = gridOffsetY || 0;
    
    if (map.gridType === 'square') {
      const cols = Math.ceil((width - offsetX) / gridSize) + 1;
      const rows = Math.ceil((height - offsetY) / gridSize) + 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * gridSize;
          const y = offsetY + row * gridSize;
          if (x < width && y < height) {
            cells.push({
              id: `${col}-${row}`,
              x,
              y,
              col,
              row
            });
          }
        }
      }
    }
    // TODO: Add hex grid generation
    return cells;
  }, [gridSize, gridOffsetX, gridOffsetY, map.gridType, imageDimensions]);
  
  // Check if a cell is revealed (not in fog)
  const isCellRevealed = (cellId) => map.fog?.includes(cellId) ?? false;
  
  // Handle cell click for fog of war
  const handleCellClick = (cellId) => {
    if (!fogMode) return;
    
    const isRevealed = isCellRevealed(cellId);
    let newFog;
    
    if (fogMode === 'reveal' && !isRevealed) {
      newFog = [...(map.fog || []), cellId];
    } else if (fogMode === 'hide' && isRevealed) {
      newFog = (map.fog || []).filter(id => id !== cellId);
    } else {
      return;
    }
    
    onUpdate({ ...map, fog: newFog });
  };
  
  // Zoom (normal mode)
  const handleZoom = (delta) => {
    setViewBox(prev => {
      const factor = delta > 0 ? 1.25 : 0.8;
      const newWidth = Math.max(200, Math.min(imageDimensions.width * 2, prev.width * factor));
      const newHeight = Math.max(150, Math.min(imageDimensions.height * 2, prev.height * factor));
      const dx = (prev.width - newWidth) / 2;
      const dy = (prev.height - newHeight) / 2;
      return { x: prev.x + dx, y: prev.y + dy, width: newWidth, height: newHeight };
    });
  };
  
  // Grid size adjustment (grid mode)
  const handleGridResize = (delta) => {
    const change = delta < 0 ? 2 : -2; // Scroll up = bigger, down = smaller
    setGridSize(prev => Math.max(10, Math.min(200, prev + change)));
  };
  
  // Mouse handlers
  const handleMouseDown = (e) => {
    if (e.button === 0 && !fogMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isPanning || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = (e.clientX - panStart.x) * (viewBox.width / rect.width);
    const dy = (e.clientY - panStart.y) * (viewBox.height / rect.height);
    
    if (showGridSettings) {
      // In grid mode: drag moves the grid offset
      setGridOffsetX(prev => prev + dx);
      setGridOffsetY(prev => prev + dy);
    } else {
      // Normal mode: drag pans the view
      setViewBox(prev => ({
        ...prev,
        x: Math.max(0, Math.min(imageDimensions.width - prev.width, prev.x - dx)),
        y: Math.max(0, Math.min(imageDimensions.height - prev.height, prev.y - dy)),
      }));
    }
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => setIsPanning(false);
  
  const handleWheel = (e) => {
    e.preventDefault();
    if (showGridSettings) {
      handleGridResize(e.deltaY); // Grid mode: scroll = resize grid
    } else {
      handleZoom(e.deltaY); // Normal mode: scroll = zoom
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
          {map.gridType === 'hex' ? <Hexagon className="w-6 h-6" /> : <Grid className="w-6 h-6" />}
          {map.name}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete()}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
          >
            Delete Map
          </button>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => handleZoom(-1)} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => handleZoom(1)} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
            <span className="w-4 h-4 block text-center leading-4">−</span>
          </button>
        </div>
        
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show Grid
        </label>
        
        <button
          onClick={() => setShowGridSettings(!showGridSettings)}
          className={`px-2 py-1 rounded text-sm ${showGridSettings ? 'bg-yellow-600 text-black' : 'bg-gray-700 text-gray-300'}`}
        >
          ⚙️ Adjust Grid
        </button>
        
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showFog} onChange={(e) => setShowFog(e.target.checked)} />
          Fog of War
        </label>
        
        <div className="flex items-center gap-1 text-sm">
          <span className="text-gray-400 mr-1">Fog:</span>
          <button
            onClick={() => setFogMode(fogMode === 'reveal' ? null : 'reveal')}
            className={`px-2 py-1 rounded ${fogMode === 'reveal' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Reveal
          </button>
          <button
            onClick={() => setFogMode(fogMode === 'hide' ? null : 'hide')}
            className={`px-2 py-1 rounded ${fogMode === 'hide' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            Hide
          </button>
        </div>
      </div>
      
      {/* Grid Settings Panel */}
      {showGridSettings && (
        <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-yellow-400">🎯 Grid Alignment Mode</h4>
            <span className="text-xs text-gray-400">Size: {gridSize}px</span>
          </div>
          <div className="text-sm text-gray-300 mb-3">
            <p>• <strong>Drag</strong> to position the grid</p>
            <p>• <strong>Scroll</strong> to resize grid cells</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveGridSettings}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm"
            >
              ✓ Save Grid
            </button>
            <button
              onClick={() => {
                setGridSize(map.gridSize || 50);
                setGridOffsetX(map.gridOffsetX || 0);
                setGridOffsetY(map.gridOffsetY || 0);
                setShowGridSettings(false);
              }}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Map Viewer */}
      <div className="h-[650px] bg-black rounded-lg overflow-hidden border border-gray-700">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: fogMode ? 'crosshair' : isPanning ? 'grabbing' : 'grab' }}
        >
          {/* Map Image */}
          <image
            href={map.imageData}
            x="0"
            y="0"
            width={imageDimensions.width}
            height={imageDimensions.height}
          />
          
          {/* Grid Overlay */}
          {showGrid && map.gridType === 'square' && gridCells.map(cell => (
            <rect
              key={cell.id}
              x={cell.x}
              y={cell.y}
              width={gridSize}
              height={gridSize}
              fill="transparent"
              stroke={showGridSettings ? "rgba(255,200,0,0.5)" : "rgba(255,255,255,0.2)"}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              onClick={() => handleCellClick(cell.id)}
              style={{ cursor: fogMode ? 'pointer' : 'inherit' }}
            />
          ))}
          
          {/* Anchor point marker (in grid settings mode) */}
          {showGridSettings && (
            <g>
              <circle
                cx={gridOffsetX}
                cy={gridOffsetY}
                r={8}
                fill="red"
                stroke="white"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <line x1={gridOffsetX - 15} y1={gridOffsetY} x2={gridOffsetX + 15} y2={gridOffsetY} stroke="red" strokeWidth={2} vectorEffect="non-scaling-stroke" />
              <line x1={gridOffsetX} y1={gridOffsetY - 15} x2={gridOffsetX} y2={gridOffsetY + 15} stroke="red" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </g>
          )}
          
          {/* Fog of War */}
          {showFog && !showGridSettings && gridCells.map(cell => {
            const revealed = isCellRevealed(cell.id);
            if (revealed) return null;
            return (
              <rect
                key={`fog-${cell.id}`}
                x={cell.x}
                y={cell.y}
                width={gridSize}
                height={gridSize}
                fill="rgba(0,0,0,0.85)"
                onClick={() => handleCellClick(cell.id)}
                style={{ cursor: fogMode ? 'pointer' : 'inherit' }}
              />
            );
          })}
        </svg>
      </div>
      
      <div className="text-xs text-gray-500">
        Grid: {map.gridSize}px {map.gridType} • {gridCells.length} cells • {map.fog?.length || 0} revealed
      </div>
    </div>
  );
}
