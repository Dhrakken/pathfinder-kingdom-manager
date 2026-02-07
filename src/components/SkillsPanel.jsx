import React, { useState } from 'react';
import { 
  BookOpen, Coins, ChevronUp, Check, AlertTriangle,
  Palette, Scroll, Sparkles, GraduationCap, // Culture
  Ship, Cog, Compass, Factory, Store, // Economy
  Fingerprint, Vote, Building2, Swords, // Loyalty
  Wheat, Shield, Trees // Stability
} from 'lucide-react';
import { SKILLS, ABILITIES, getProficiencyBonus } from '../data/reference.js';
import { getSkillTrainingCost, trainSkillWithRP } from '../engine/progressionEngine.js';
import { getSkillModifierBreakdown } from '../engine/activityEngine.js';

// Skill icons
const SKILL_ICONS = {
  // Culture
  Arts: Palette,
  Folklore: Scroll,
  Magic: Sparkles,
  Scholarship: GraduationCap,
  // Economy
  Boating: Ship,
  Engineering: Cog,
  Exploration: Compass,
  Industry: Factory,
  Trade: Store,
  // Loyalty
  Intrigue: Fingerprint,
  Politics: Vote,
  Statecraft: Building2,
  Warfare: Swords,
  // Stability
  Agriculture: Wheat,
  Defense: Shield,
  Wilderness: Trees,
};

const ABILITY_COLORS = {
  Culture: 'text-purple-400',
  Economy: 'text-yellow-400',
  Loyalty: 'text-red-400',
  Stability: 'text-green-400',
};

const PROFICIENCY_COLORS = {
  Untrained: 'text-gray-500',
  Trained: 'text-blue-400',
  Expert: 'text-purple-400',
  Master: 'text-yellow-400',
  Legendary: 'text-orange-400',
};

export default function SkillsPanel({ state, onStateChange, onLog }) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [confirmTrain, setConfirmTrain] = useState(false);
  
  const handleTrain = (skillName) => {
    const result = trainSkillWithRP(state, skillName);
    
    if (!result.success) {
      onLog?.(result.error, 'failure');
      return;
    }
    
    onStateChange(result.state);
    onLog?.(`Trained ${skillName} to ${result.newProficiency} (-${result.cost} RP)`, 'success');
    setSelectedSkill(null);
    setConfirmTrain(false);
  };
  
  const currentRP = state.resources?.rp || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Kingdom Skills
        </h2>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          {currentRP} RP available
        </div>
      </div>
      
      <p className="text-sm text-gray-400">
        Skills can be trained using RP. Each proficiency level costs more than the last.
        Level ups also grant skill training at no cost.
      </p>
      
      {ABILITIES.map(ability => (
        <div key={ability} className="glass-card p-4">
          <h3 className={`font-semibold mb-3 flex items-center gap-2 ${ABILITY_COLORS[ability]}`}>
            {ability}
            <span className="text-xs text-gray-500 font-normal">
              Score: {state.abilities?.[ability] || 10} (
              {Math.floor(((state.abilities?.[ability] || 10) - 10) / 2) >= 0 ? '+' : ''}
              {Math.floor(((state.abilities?.[ability] || 10) - 10) / 2)})
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SKILLS[ability].map(skillName => {
              const Icon = SKILL_ICONS[skillName] || BookOpen;
              const proficiency = state.skillProficiencies?.[skillName] || 'Untrained';
              const trainingCost = getSkillTrainingCost(proficiency);
              const canTrain = trainingCost !== null && currentRP >= trainingCost;
              const isSelected = selectedSkill === skillName;
              
              // Get modifier breakdown
              const breakdown = getSkillModifierBreakdown(state, skillName);
              
              return (
                <div
                  key={skillName}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{skillName}</span>
                    </div>
                    <span className={`text-sm font-bold ${breakdown.total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {breakdown.total >= 0 ? '+' : ''}{breakdown.total}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${PROFICIENCY_COLORS[proficiency]}`}>
                      {proficiency}
                      {proficiency !== 'Untrained' && (
                        <span className="text-gray-500 ml-1">
                          (+{getProficiencyBonus(proficiency, state.kingdom?.level || 1)})
                        </span>
                      )}
                    </span>
                    
                    {trainingCost !== null ? (
                      <button
                        onClick={() => {
                          if (isSelected && confirmTrain) {
                            handleTrain(skillName);
                          } else {
                            setSelectedSkill(skillName);
                            setConfirmTrain(false);
                          }
                        }}
                        disabled={!canTrain}
                        className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                          canTrain
                            ? isSelected
                              ? 'bg-green-500 text-black hover:bg-green-400'
                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ChevronUp className="w-3 h-3" />
                        {trainingCost} RP
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">Max</span>
                    )}
                  </div>
                  
                  {/* Confirmation */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-xs text-gray-400 mb-2">
                        Train to {getNextProficiency(proficiency)} for {trainingCost} RP?
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTrain(skillName)}
                          disabled={!canTrain}
                          className={`flex-1 px-2 py-1 rounded text-xs flex items-center justify-center gap-1 ${
                            canTrain
                              ? 'bg-green-600 hover:bg-green-500 text-white'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          Confirm
                        </button>
                        <button
                          onClick={() => setSelectedSkill(null)}
                          className="flex-1 px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Modifier breakdown on hover/expand */}
                  {isSelected && (
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Ability:</span>
                        <span>{breakdown.abilityMod >= 0 ? '+' : ''}{breakdown.abilityMod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Proficiency:</span>
                        <span>+{breakdown.profBonus}</span>
                      </div>
                      {breakdown.leaderBonus > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Leader:</span>
                          <span>+{breakdown.leaderBonus}</span>
                        </div>
                      )}
                      {breakdown.itemBonus > 0 && (
                        <div className="flex justify-between text-blue-400">
                          <span>Item:</span>
                          <span>+{breakdown.itemBonus}</span>
                        </div>
                      )}
                      {breakdown.unrestPenalty > 0 && (
                        <div className="flex justify-between text-red-400">
                          <span>Unrest:</span>
                          <span>-{breakdown.unrestPenalty}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function getNextProficiency(current) {
  const order = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];
  const index = order.indexOf(current);
  return order[Math.min(index + 1, order.length - 1)];
}
