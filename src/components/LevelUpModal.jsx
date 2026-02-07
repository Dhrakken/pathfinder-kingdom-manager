import React, { useState } from 'react';
import { 
  TrendingUp, Check, Star, BookOpen, Shield,
  ChevronRight
} from 'lucide-react';
import { ABILITIES, SKILLS } from '../data/reference.js';
import { applyLevelUp, getXPToNextLevel } from '../engine/progressionEngine.js';

export default function LevelUpModal({ state, onComplete, onCancel }) {
  const [step, setStep] = useState('ability'); // 'ability' | 'skill' | 'confirm'
  const [selectedAbility, setSelectedAbility] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const newLevel = (state.kingdom?.level || 1) + 1;
  
  const handleComplete = () => {
    const newState = applyLevelUp(state, selectedAbility, selectedSkill);
    onComplete(newState);
  };
  
  const renderAbilityStep = () => (
    <div className="space-y-4">
      <p className="text-gray-300">
        Choose an ability score to boost by +2:
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ABILITIES.map(ability => {
          const currentScore = state.abilities?.[ability] || 10;
          const newScore = currentScore + 2;
          const isSelected = selectedAbility === ability;
          
          return (
            <button
              key={ability}
              onClick={() => setSelectedAbility(ability)}
              className={`p-4 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'bg-yellow-500/20 border-yellow-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="font-semibold text-yellow-400">{ability}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400">{currentScore}</span>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-green-400 font-bold">{newScore}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Modifier: {Math.floor((newScore - 10) / 2) >= 0 ? '+' : ''}{Math.floor((newScore - 10) / 2)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
  
  const renderSkillStep = () => (
    <div className="space-y-4">
      <p className="text-gray-300">
        Choose a skill to train or upgrade:
      </p>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(SKILLS).map(([ability, skills]) => (
          <div key={ability}>
            <div className="text-sm font-semibold text-yellow-400 mb-2">{ability}</div>
            <div className="grid grid-cols-2 gap-2">
              {skills.map(skill => {
                const currentProf = state.skillProficiencies?.[skill] || 'Untrained';
                const profOrder = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];
                const currentIndex = profOrder.indexOf(currentProf);
                const nextProf = profOrder[Math.min(currentIndex + 1, profOrder.length - 1)];
                const canUpgrade = currentProf !== 'Legendary';
                const isSelected = selectedSkill === skill;
                
                return (
                  <button
                    key={skill}
                    onClick={() => canUpgrade && setSelectedSkill(skill)}
                    disabled={!canUpgrade}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500'
                        : canUpgrade
                        ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                        : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">{skill}</div>
                    <div className="text-xs mt-1">
                      <span className="text-gray-400">{currentProf}</span>
                      {canUpgrade && (
                        <>
                          <span className="text-gray-600 mx-1">→</span>
                          <span className="text-green-400">{nextProf}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderConfirmStep = () => {
    const newAbilityScore = (state.abilities?.[selectedAbility] || 10) + 2;
    const currentSkillProf = state.skillProficiencies?.[selectedSkill] || 'Untrained';
    const profOrder = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];
    const newSkillProf = profOrder[profOrder.indexOf(currentSkillProf) + 1];
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <Star className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
          <h3 className="text-2xl font-bold text-yellow-400">Level Up!</h3>
          <p className="text-gray-400">
            {state.kingdom?.name} reaches Level {newLevel}
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="text-sm text-gray-400">Ability Boost</div>
                <div className="font-semibold">{selectedAbility}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-gray-400">{state.abilities?.[selectedAbility] || 10}</span>
              <span className="text-gray-600 mx-2">→</span>
              <span className="text-green-400 font-bold">{newAbilityScore}</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <div>
                <div className="text-sm text-gray-400">Skill Training</div>
                <div className="font-semibold">{selectedSkill}</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-gray-400">{currentSkillProf}</span>
              <span className="text-gray-600 mx-2">→</span>
              <span className="text-green-400 font-bold">{newSkillProf}</span>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-400 mt-4">
          Next level at {getXPToNextLevel(newLevel).toLocaleString()} XP
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-600/30 rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-yellow-600/20 to-transparent">
          <h2 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Kingdom Level Up!
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {state.kingdom?.name} is ready to advance to Level {newLevel}
          </p>
        </div>
        
        {/* Progress */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50">
          <div className={`flex-1 h-1 rounded ${step === 'ability' ? 'bg-yellow-500' : 'bg-green-500'}`} />
          <div className={`flex-1 h-1 rounded ${step === 'skill' ? 'bg-yellow-500' : step === 'confirm' ? 'bg-green-500' : 'bg-gray-700'}`} />
          <div className={`flex-1 h-1 rounded ${step === 'confirm' ? 'bg-yellow-500' : 'bg-gray-700'}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'ability' && renderAbilityStep()}
          {step === 'skill' && renderSkillStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between">
          <button
            onClick={() => {
              if (step === 'ability') onCancel();
              else if (step === 'skill') setStep('ability');
              else setStep('skill');
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            {step === 'ability' ? 'Cancel' : 'Back'}
          </button>
          
          {step === 'ability' && (
            <button
              onClick={() => setStep('skill')}
              disabled={!selectedAbility}
              className={`px-4 py-2 rounded ${
                selectedAbility
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
          
          {step === 'skill' && (
            <button
              onClick={() => setStep('confirm')}
              disabled={!selectedSkill}
              className={`px-4 py-2 rounded ${
                selectedSkill
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
            </button>
          )}
          
          {step === 'confirm' && (
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Level Up!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
