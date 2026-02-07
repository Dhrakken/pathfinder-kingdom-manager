import React, { useState, useMemo } from 'react';
import { 
  Dice6, CheckCircle, XCircle, AlertTriangle, ChevronRight,
  MapPin, Building, Users, Coins
} from 'lucide-react';
import { executeActivity, getSkillModifierBreakdown } from '../engine/activityEngine.js';
import { getAbilityForSkill, getProficiencyBonus } from '../data/reference.js';
import { getInvestedLeaderBonus } from '../engine/upkeepEngine.js';
import { getItemBonusForActivity } from '../engine/structureEngine.js';

// Outcome degree colors and icons
const DEGREE_STYLES = {
  criticalSuccess: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Critical Success!' },
  success: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Success' },
  failure: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Failure' },
  criticalFailure: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical Failure!' },
};

// Format effects for display
const formatEffects = (effects) => {
  if (!effects || effects.length === 0) return 'No effect';
  
  return effects.map(effect => {
    switch (effect.type) {
      case 'unrest':
        return effect.delta > 0 ? `+${effect.delta} Unrest` : `${effect.delta} Unrest`;
      case 'fame':
        return `+${effect.delta} Fame`;
      case 'infamy':
        return `+${effect.delta} Infamy`;
      case 'xp':
        return `+${effect.delta} XP`;
      case 'rp':
        return effect.delta > 0 ? `+${effect.delta} RP` : `${effect.delta} RP`;
      case 'ruin':
        return `+${effect.delta} ${effect.ruinType}`;
      case 'commodity':
        return effect.delta > 0 ? `+${effect.delta} ${capitalize(effect.commodity)}` : `${effect.delta} ${capitalize(effect.commodity)}`;
      case 'claimHex':
        return 'Claim the hex';
      case 'abandonHex':
        return 'Abandon the hex';
      case 'workSite':
        return `Establish ${effect.siteType}${effect.bonus ? ' (bonus production)' : ''}`;
      case 'addRoad':
        return 'Build roads';
      case 'fortifyHex':
        return `Fortify (+${effect.bonus || 1} Defense)`;
      case 'clearHex':
        return 'Clear hazards';
      case 'establishSettlement':
        return 'Establish settlement';
      case 'relocateCapital':
        return 'Relocate capital';
      case 'special':
        return `Special: ${effect.key}`;
      default:
        return JSON.stringify(effect);
    }
  }).join(', ');
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export default function ActivityModal({ 
  activity, 
  state, 
  onClose, 
  onExecute,
  onLog 
}) {
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Get available hexes for selection based on activity
  const availableHexes = useMemo(() => {
    if (!activity.requiresInput?.includes('hexCoord')) return [];
    
    const hexMap = state.hexMap || {};
    const hexes = Object.values(hexMap);
    
    switch (activity.prerequisite) {
      case 'adjacentExploredHex':
        // Find explored but unclaimed hexes adjacent to claimed territory
        const claimedCoords = Object.keys(hexMap).filter(k => hexMap[k].status === 'claimed');
        return hexes.filter(h => 
          h.status === 'explored' && 
          h.status !== 'claimed' &&
          claimedCoords.some(c => areHexesAdjacent(c, h.coord))
        );
      case 'ownedHex':
        return hexes.filter(h => h.status === 'claimed');
      case 'ownedHexNoSettlement':
        return hexes.filter(h => h.status === 'claimed' && !h.settlement);
      case 'ownedHexFarmable':
        return hexes.filter(h => 
          h.status === 'claimed' && 
          ['plains', 'hills'].includes(h.terrain) &&
          !h.workSite
        );
      case 'ownedHexMinable':
      case 'ownedHexQuarryable':
        return hexes.filter(h => 
          h.status === 'claimed' && 
          ['hills', 'mountain'].includes(h.terrain) &&
          !h.workSite
        );
      case 'ownedHexForest':
        return hexes.filter(h => 
          h.status === 'claimed' && 
          h.terrain === 'forest' &&
          !h.workSite
        );
      case 'ownedHexWithFarm':
        return hexes.filter(h => h.status === 'claimed' && h.workSite === 'farm');
      default:
        return hexes.filter(h => h.status === 'claimed');
    }
  }, [activity, state.hexMap]);
  
  // Get skill modifier breakdown for display
  const skillInfo = useMemo(() => {
    if (!activity.skill || activity.skill === 'none' || activity.skill === 'varies') return null;
    
    // Use the engine's breakdown function to include item bonuses
    return getSkillModifierBreakdown(state, activity.skill, activity.id);
  }, [activity.skill, activity.id, state]);
  
  const handleExecute = () => {
    setError(null);
    
    // Validate required inputs
    if (activity.requiresInput?.includes('hexCoord') && !inputs.hexCoord) {
      setError('Please select a hex');
      return;
    }
    if (activity.requiresInput?.includes('settlementName') && !inputs.settlementName?.trim()) {
      setError('Please enter a settlement name');
      return;
    }
    
    // Execute the activity
    const execResult = executeActivity(state, activity.id, inputs);
    
    if (!execResult.success) {
      setError(execResult.error);
      return;
    }
    
    setResult(execResult);
    
    // Log the result
    const degreeLabel = DEGREE_STYLES[execResult.degree]?.label || execResult.degree;
    const logType = execResult.degree.includes('Success') ? 'success' : 'failure';
    
    if (execResult.checkResult) {
      const { roll, modifier, total, dc } = execResult.checkResult;
      onLog?.(
        `${activity.name}: Rolled ${roll} + ${modifier} = ${total} vs DC ${dc} → ${degreeLabel}. ${execResult.effectLog.filter(e => e).join(', ')}`,
        logType
      );
    } else {
      onLog?.(
        `${activity.name}: ${degreeLabel}. ${execResult.effectLog.filter(e => e).join(', ')}`,
        logType
      );
    }
  };
  
  const handleConfirm = () => {
    if (result) {
      onExecute(result.state);
    }
    onClose();
  };
  
  const currentRP = state.resources?.rp || 0;
  const canAfford = !activity.rpCost || currentRP >= activity.rpCost;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-yellow-400">{activity.name}</h3>
            <p className="text-sm text-gray-400">{activity.category} Activity</p>
          </div>
          {activity.rpCost > 0 && (
            <div className={`px-3 py-1 rounded ${canAfford ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
              {activity.rpCost} RP
            </div>
          )}
        </div>
        
        {/* Description */}
        <p className="text-gray-300 mb-4">{activity.desc}</p>
        
        {/* Skill Info */}
        {activity.skill && activity.skill !== 'none' && activity.skill !== 'varies' && skillInfo && (
          <div className="bg-white/5 rounded p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Skill:</span>
              <span className="text-white">{activity.skill} ({skillInfo.ability})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Modifier:</span>
              <span className="text-white font-bold">{skillInfo.total >= 0 ? '+' : ''}{skillInfo.total}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 space-y-0.5">
              <div className="flex justify-between">
                <span>Ability ({skillInfo.ability}):</span>
                <span>{skillInfo.abilityMod >= 0 ? '+' : ''}{skillInfo.abilityMod}</span>
              </div>
              <div className="flex justify-between">
                <span>Proficiency ({skillInfo.proficiency}):</span>
                <span>{skillInfo.profBonus > 0 ? `+${skillInfo.profBonus}` : '+0'}</span>
              </div>
              {skillInfo.leaderBonus > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Invested Leader:</span>
                  <span>+{skillInfo.leaderBonus}</span>
                </div>
              )}
              {skillInfo.itemBonus > 0 && (
                <div className="flex justify-between text-blue-400">
                  <span title={skillInfo.itemBonusSource}>Item ({skillInfo.itemBonusSource?.split(' in ')[0] || 'Structure'}):</span>
                  <span>+{skillInfo.itemBonus}</span>
                </div>
              )}
              {skillInfo.unrestPenalty > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Unrest Penalty:</span>
                  <span>-{skillInfo.unrestPenalty}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Outcome Preview */}
        {activity.effects && !result && (
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium text-gray-400">Possible Outcomes:</div>
            <div className="space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-green-400 w-32">Crit Success:</span>
                <span className="text-gray-300">{formatEffects(activity.effects.criticalSuccess)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-400 w-32">Success:</span>
                <span className="text-gray-300">{formatEffects(activity.effects.success)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-yellow-400 w-32">Failure:</span>
                <span className="text-gray-300">{formatEffects(activity.effects.failure)}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-red-400 w-32">Crit Failure:</span>
                <span className="text-gray-300">{formatEffects(activity.effects.criticalFailure)}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Inputs */}
        {!result && activity.requiresInput?.includes('hexCoord') && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Select Hex
            </label>
            {availableHexes.length === 0 ? (
              <div className="text-red-400 text-sm">No valid hexes available for this activity</div>
            ) : (
              <select
                value={inputs.hexCoord || ''}
                onChange={(e) => setInputs({ ...inputs, hexCoord: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="">-- Select a hex --</option>
                {availableHexes.map(hex => (
                  <option key={hex.coord} value={hex.coord}>
                    {hex.coord.toUpperCase()} - {hex.terrain}{hex.notes ? ` (${hex.notes})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        
        {!result && activity.requiresInput?.includes('settlementName') && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">
              <Building className="w-4 h-4 inline mr-1" />
              Settlement Name
            </label>
            <input
              type="text"
              value={inputs.settlementName || ''}
              onChange={(e) => setInputs({ ...inputs, settlementName: e.target.value })}
              placeholder="Enter settlement name..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded p-3 mb-4 text-red-400 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        
        {/* Result Display */}
        {result && (
          <div className={`rounded p-4 mb-4 ${DEGREE_STYLES[result.degree].bg}`}>
            <div className={`text-lg font-bold ${DEGREE_STYLES[result.degree].color} mb-2`}>
              {DEGREE_STYLES[result.degree].label}
            </div>
            
            {result.checkResult && (
              <div className="text-sm text-gray-300 mb-2">
                Rolled {result.checkResult.roll} + {result.checkResult.modifier} = {result.checkResult.total} vs DC {result.checkResult.dc}
              </div>
            )}
            
            {result.effectLog.length > 0 && (
              <div className="space-y-1">
                {result.effectLog.filter(e => e).map((effect, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-200">{effect}</span>
                  </div>
                ))}
              </div>
            )}
            
            {result.rpCost > 0 && (
              <div className="text-sm text-yellow-400 mt-2">
                -{result.rpCost} RP spent
              </div>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          {!result ? (
            <>
              <button
                onClick={handleExecute}
                disabled={!canAfford || (activity.requiresInput?.includes('hexCoord') && availableHexes.length === 0)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded font-medium transition-colors ${
                  canAfford && !(activity.requiresInput?.includes('hexCoord') && availableHexes.length === 0)
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Dice6 className="w-5 h-5" />
                Roll Check
              </button>
              <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded font-medium bg-green-600 hover:bg-green-500 text-white"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm & Apply
              </button>
              <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Check if two hex coordinates are adjacent (same as in engine)
const areHexesAdjacent = (coord1, coord2) => {
  const parse = (coord) => {
    const match = coord.toLowerCase().match(/([a-z]+)(\d+)/);
    if (!match) return null;
    const col = match[1].charCodeAt(0) - 'a'.charCodeAt(0);
    const row = parseInt(match[2]);
    return { col, row };
  };
  
  const h1 = parse(coord1);
  const h2 = parse(coord2);
  if (!h1 || !h2) return false;
  
  const dc = h2.col - h1.col;
  const dr = h2.row - h1.row;
  
  const isEvenCol = h1.col % 2 === 0;
  
  const adjacentOffsets = isEvenCol
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  
  return adjacentOffsets.some(([oc, or]) => dc === oc && dr === or);
};
