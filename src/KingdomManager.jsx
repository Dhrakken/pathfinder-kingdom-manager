import React, { useState, useCallback } from 'react';
import { 
  Crown, Users, Coins, TreePine, Gem, Wheat, Mountain, Hammer,
  Shield, BookOpen, Sword, Calendar, Plus, Save, Download, Upload,
  Home, Grid3X3, Map, History, Settings, ChevronRight, Dice6,
  AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown
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
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.kingdom.name.toLowerCase()}-turn-${state.turn.number}.json`;
    a.click();
  };

  const importState = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setState(imported);
          addLog('Kingdom state imported successfully', 'success');
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
            <div className="text-purple-200">{state.kingdom.xp} / {state.kingdom.xpToNext} XP</div>
            <div className="text-sm text-purple-300">{sizeData.type} • {state.kingdom.hexes} hexes</div>
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
        <div className="mt-4 flex gap-2">
          <button onClick={advancePhase} className="btn-royal flex items-center gap-2"><ChevronRight className="w-4 h-4" /> Advance Phase</button>
          {state.turn.phase === 'event' && <button onClick={endTurn} className="btn-secondary">End Turn</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ABILITIES.map(ability => (
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
          {state.turn.phase === 'upkeep' && <button onClick={rollResourceDice} className="btn-royal w-full flex items-center justify-center gap-2"><Dice6 className="w-4 h-4" /> Roll Resource Dice ({state.kingdom.level + 4}d{sizeData.die})</button>}
          {diceResult && <div className="mt-2 p-2 bg-black/30 rounded text-sm">Rolled: [{diceResult.rolls.join(', ')}] = {diceResult.total} RP</div>}
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
          {state.turn.phase === 'upkeep' && <div className="mt-3 flex gap-2"><button onClick={collectWorkSites} className="btn-secondary flex-1">Collect Work Sites</button><button onClick={payConsumption} className="btn-secondary flex-1">Pay Consumption ({state.consumption})</button></div>}
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
          <div className="grid grid-cols-4 gap-2">{RUIN_TYPES.map(type => (<div key={type} className="text-center"><div className="text-xs text-gray-400">{type}</div><div className="text-lg font-bold">{state.ruin[type]}</div></div>))}</div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-yellow-400 font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
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

  const renderActivities = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold text-yellow-400">Activities</h2><div className="text-sm text-gray-400">Leadership Actions: {state.turn.leadershipActionsUsed}/{state.turn.leadershipActionsMax}</div></div>
      <div className="glass-card p-4">
        <h3 className="text-yellow-400 font-semibold mb-3">Leadership Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {LEADERSHIP_ACTIVITIES.map(activity => (<button key={activity.id} onClick={() => { setSelectedActivity(activity); setShowActivityModal(true); }} className="text-left p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-yellow-500/50 transition-all"><div className="font-medium">{activity.name}</div><div className="text-xs text-gray-400">{activity.skill} • {activity.desc}</div></button>))}
        </div>
      </div>
      <div className="glass-card p-4">
        <h3 className="text-yellow-400 font-semibold mb-3">Region Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {REGION_ACTIVITIES.map(activity => (<button key={activity.id} onClick={() => { setSelectedActivity(activity); setShowActivityModal(true); }} className="text-left p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-yellow-500/50 transition-all"><div className="font-medium">{activity.name}</div><div className="text-xs text-gray-400">{activity.skill} • {activity.desc}</div>{activity.rp && <div className="text-xs text-yellow-400">{activity.rp} RP</div>}</button>))}
        </div>
      </div>
      <div className="glass-card p-4">
        <h3 className="text-yellow-400 font-semibold mb-3">Civic Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {CIVIC_ACTIVITIES.map(activity => (<button key={activity.id} onClick={() => { setSelectedActivity(activity); setShowActivityModal(true); }} className="text-left p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-yellow-500/50 transition-all"><div className="font-medium">{activity.name}</div><div className="text-xs text-gray-400">{activity.skill} • {activity.desc}</div></button>))}
        </div>
      </div>
    </div>
  );

  const renderSettlements = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2"><Home className="w-6 h-6" /> Settlements</h2>
      {state.settlements.map(settlement => (
        <div key={settlement.id} className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-lg font-semibold text-yellow-400">{settlement.name}{settlement.isCapital && <Crown className="inline w-4 h-4 ml-2 text-yellow-500" />}</h3><div className="text-sm text-gray-400">{settlement.blocks} blocks • {settlement.structures.length} structures</div></div>
          </div>
          <div className="grid grid-cols-4 gap-2 max-w-md">
            {Array(16).fill(null).map((_, i) => { const structure = settlement.structures[i]; const structureData = structure ? STRUCTURES.find(s => s.id === structure) : null; return (<div key={i} className={`urban-block ${structure ? 'occupied' : ''}`} title={structureData?.name}>{structureData ? <span className="text-xs text-center leading-tight">{structureData.name}</span> : <Plus className="w-4 h-4 text-gray-500" />}</div>); })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderTurnLog = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2"><History className="w-6 h-6" /> Turn Log</h2>
      <div className="glass-card p-4 max-h-96 overflow-y-auto">
        {state.log.length === 0 ? <p className="text-gray-400">No actions logged this turn.</p> : state.log.map((entry, i) => (<div key={i} className={`log-entry ${entry.type}`}><span className="text-gray-500 text-xs">[{entry.timestamp}]</span> <span className="text-gray-300">{entry.message}</span></div>))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Grid3X3 },
    { id: 'leadership', label: 'Leadership', icon: Users },
    { id: 'activities', label: 'Activities', icon: Hammer },
    { id: 'settlements', label: 'Settlements', icon: Home },
    { id: 'log', label: 'Log', icon: History },
  ];

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {tabs.map(tab => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'hover:bg-white/5 text-gray-400'}`}><Icon className="w-4 h-4" />{tab.label}</button>); })}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'leadership' && renderLeadership()}
        {activeTab === 'activities' && renderActivities()}
        {activeTab === 'settlements' && renderSettlements()}
        {activeTab === 'log' && renderTurnLog()}
      </main>

      {showActivityModal && selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-yellow-400 mb-2">{selectedActivity.name}</h3>
            <p className="text-gray-300 mb-4">{selectedActivity.desc}</p>
            <div className="text-sm text-gray-400 mb-4"><div>Skill: {selectedActivity.skill}</div>{selectedActivity.rp && <div>Cost: {selectedActivity.rp} RP</div>}</div>
            {selectedActivity.outcomes && (<div className="space-y-1 text-sm mb-4"><div className="text-green-400">Critical Success: {selectedActivity.outcomes.criticalSuccess}</div><div className="text-blue-400">Success: {selectedActivity.outcomes.success}</div><div className="text-yellow-400">Failure: {selectedActivity.outcomes.failure}</div><div className="text-red-400">Critical Failure: {selectedActivity.outcomes.criticalFailure}</div></div>)}
            <div className="flex gap-2">
              <button onClick={() => { const result = performSkillCheck(selectedActivity.skill, controlDC); addLog(`${selectedActivity.name}: Rolled ${result.roll} + ${result.modifier} = ${result.total} vs DC ${result.dc} (${result.degree})`, result.degree.includes('Success') ? 'success' : 'failure'); setShowActivityModal(false); }} className="btn-royal flex-1">Roll Check</button>
              <button onClick={() => setShowActivityModal(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
