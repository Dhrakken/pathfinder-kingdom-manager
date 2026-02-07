import React, { useState } from 'react';
import { 
  Crown, ChevronRight, ChevronLeft, Check, Map, Building2, 
  ScrollText, Shield, Coins, Heart, Mountain, TreePine, Waves
} from 'lucide-react';
import { CHARTER_TYPES, HEARTLAND_TYPES, GOVERNMENT_TYPES, ABILITIES } from '../data/reference.js';

// Step indicators
const STEPS = [
  { id: 'name', label: 'Kingdom Name', icon: Crown },
  { id: 'charter', label: 'Charter', icon: ScrollText },
  { id: 'heartland', label: 'Heartland', icon: Map },
  { id: 'government', label: 'Government', icon: Building2 },
  { id: 'abilities', label: 'Ability Boosts', icon: Shield },
  { id: 'review', label: 'Review', icon: Check },
];

// Heartland icons
const HEARTLAND_ICONS = {
  forest: TreePine,
  hill: Mountain,
  lake: Waves,
  mountain: Mountain,
};

export default function KingdomCreationWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [kingdom, setKingdom] = useState({
    name: '',
    charter: null,
    heartland: null,
    government: null,
    freeBoosts: [], // Two free ability boosts
    abilities: {
      Culture: 10,
      Economy: 10,
      Loyalty: 10,
      Stability: 10,
    },
    trainedSkills: [], // From government
  });

  const currentStep = STEPS[step];

  const canProceed = () => {
    switch (currentStep.id) {
      case 'name': return kingdom.name.trim().length > 0;
      case 'charter': return kingdom.charter !== null;
      case 'heartland': return kingdom.heartland !== null;
      case 'government': return kingdom.government !== null;
      case 'abilities': return kingdom.freeBoosts.length === 2;
      case 'review': return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      // Apply boosts when leaving certain steps
      if (currentStep.id === 'charter' && kingdom.charter) {
        applyCharterBoosts();
      }
      if (currentStep.id === 'heartland' && kingdom.heartland) {
        applyHeartlandBoost();
      }
      if (currentStep.id === 'government' && kingdom.government) {
        applyGovernmentBoost();
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      // Reset boosts when going back
      if (currentStep.id === 'abilities') {
        setKingdom(prev => ({ ...prev, freeBoosts: [] }));
      }
      setStep(step - 1);
    }
  };

  const applyCharterBoosts = () => {
    const charter = CHARTER_TYPES.find(c => c.id === kingdom.charter);
    if (!charter) return;

    setKingdom(prev => {
      const newAbilities = { ...prev.abilities };
      // Apply boost (+2)
      if (charter.boost !== 'Any') {
        newAbilities[charter.boost] = (newAbilities[charter.boost] || 10) + 2;
      }
      // Apply flaw (-2)
      if (charter.flaw !== 'Any') {
        newAbilities[charter.flaw] = Math.max(8, (newAbilities[charter.flaw] || 10) - 2);
      }
      return { ...prev, abilities: newAbilities };
    });
  };

  const applyHeartlandBoost = () => {
    const heartland = HEARTLAND_TYPES.find(h => h.id === kingdom.heartland);
    if (!heartland) return;

    setKingdom(prev => {
      const newAbilities = { ...prev.abilities };
      newAbilities[heartland.boost] = (newAbilities[heartland.boost] || 10) + 2;
      return { ...prev, abilities: newAbilities };
    });
  };

  const applyGovernmentBoost = () => {
    const government = GOVERNMENT_TYPES.find(g => g.id === kingdom.government);
    if (!government) return;

    setKingdom(prev => {
      const newAbilities = { ...prev.abilities };
      newAbilities[government.boost] = (newAbilities[government.boost] || 10) + 2;
      return { ...prev, abilities: newAbilities, trainedSkills: [government.skill] };
    });
  };

  const toggleFreeBoost = (ability) => {
    setKingdom(prev => {
      const boosts = [...prev.freeBoosts];
      const index = boosts.indexOf(ability);
      
      if (index >= 0) {
        // Remove boost
        boosts.splice(index, 1);
        return {
          ...prev,
          freeBoosts: boosts,
          abilities: {
            ...prev.abilities,
            [ability]: prev.abilities[ability] - 2,
          },
        };
      } else if (boosts.length < 2) {
        // Add boost
        boosts.push(ability);
        return {
          ...prev,
          freeBoosts: boosts,
          abilities: {
            ...prev.abilities,
            [ability]: prev.abilities[ability] + 2,
          },
        };
      }
      return prev;
    });
  };

  const handleComplete = () => {
    onComplete(kingdom);
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'name':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              What is the name of your new kingdom?
            </p>
            <input
              type="text"
              value={kingdom.name}
              onChange={(e) => setKingdom(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter kingdom name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-xl text-yellow-400 font-cinzel"
              autoFocus
            />
          </div>
        );

      case 'charter':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              Your charter determines how your kingdom was founded and provides ability modifiers.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {CHARTER_TYPES.map(charter => (
                <button
                  key={charter.id}
                  onClick={() => setKingdom(prev => ({ ...prev, charter: charter.id }))}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    kingdom.charter === charter.id
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-yellow-400">{charter.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {charter.boost !== 'Any' ? (
                      <span className="text-green-400">+2 {charter.boost}</span>
                    ) : (
                      <span className="text-blue-400">+2 to any ability</span>
                    )}
                    {' • '}
                    {charter.flaw !== 'Any' ? (
                      <span className="text-red-400">-2 {charter.flaw}</span>
                    ) : (
                      <span className="text-orange-400">-2 to any ability</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getCharterDescription(charter.id)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'heartland':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              Your heartland is the terrain type where your kingdom was founded.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {HEARTLAND_TYPES.map(heartland => {
                const Icon = HEARTLAND_ICONS[heartland.id] || Map;
                return (
                  <button
                    key={heartland.id}
                    onClick={() => setKingdom(prev => ({ ...prev, heartland: heartland.id }))}
                    className={`text-left p-4 rounded-lg border transition-all ${
                      kingdom.heartland === heartland.id
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-yellow-400">{heartland.name}</span>
                    </div>
                    <div className="text-sm text-green-400 mt-1">
                      +2 {heartland.boost}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'government':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              Your government type determines how your kingdom is ruled and what skills you start trained in.
            </p>
            <div className="grid grid-cols-1 gap-3">
              {GOVERNMENT_TYPES.map(gov => (
                <button
                  key={gov.id}
                  onClick={() => setKingdom(prev => ({ ...prev, government: gov.id }))}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    kingdom.government === gov.id
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold text-yellow-400">{gov.name}</div>
                  <div className="text-sm mt-1">
                    <span className="text-green-400">+2 {gov.boost}</span>
                    {' • '}
                    <span className="text-blue-400">Trained in {gov.skill}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {getGovernmentDescription(gov.id)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'abilities':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              Choose two ability scores to boost. Each boost adds +2.
              <span className="text-yellow-400 ml-2">
                ({kingdom.freeBoosts.length}/2 selected)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ABILITIES.map(ability => {
                const isSelected = kingdom.freeBoosts.includes(ability);
                const currentScore = kingdom.abilities[ability] || 10;
                
                return (
                  <button
                    key={ability}
                    onClick={() => toggleFreeBoost(ability)}
                    disabled={!isSelected && kingdom.freeBoosts.length >= 2}
                    className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-yellow-500/20 border-yellow-500'
                        : kingdom.freeBoosts.length >= 2
                        ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold text-yellow-400">{ability}</div>
                    <div className="text-2xl font-bold mt-1">{currentScore}</div>
                    <div className="text-xs text-gray-500">
                      Modifier: {Math.floor((currentScore - 10) / 2) >= 0 ? '+' : ''}{Math.floor((currentScore - 10) / 2)}
                    </div>
                    {isSelected && (
                      <div className="text-xs text-green-400 mt-1">+2 Free Boost</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'review':
        const charter = CHARTER_TYPES.find(c => c.id === kingdom.charter);
        const heartland = HEARTLAND_TYPES.find(h => h.id === kingdom.heartland);
        const government = GOVERNMENT_TYPES.find(g => g.id === kingdom.government);
        
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Crown className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
              <h2 className="text-2xl font-bold text-yellow-400 font-cinzel">{kingdom.name}</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Charter</div>
                <div className="font-semibold text-yellow-400">{charter?.name}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Heartland</div>
                <div className="font-semibold text-yellow-400">{heartland?.name}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-400">Government</div>
                <div className="font-semibold text-yellow-400">{government?.name}</div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Final Ability Scores</div>
              <div className="grid grid-cols-4 gap-2">
                {ABILITIES.map(ability => (
                  <div key={ability} className="text-center">
                    <div className="text-xs text-gray-500">{ability}</div>
                    <div className="text-xl font-bold text-yellow-400">{kingdom.abilities[ability]}</div>
                    <div className="text-xs text-gray-400">
                      {Math.floor((kingdom.abilities[ability] - 10) / 2) >= 0 ? '+' : ''}
                      {Math.floor((kingdom.abilities[ability] - 10) / 2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-2">Trained Skills</div>
              <div className="flex flex-wrap gap-2">
                {kingdom.trainedSkills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-yellow-600/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-yellow-400 font-cinzel flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Found Your Kingdom
          </h2>
          
          {/* Step Progress */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isComplete = i < step;
              const isCurrent = i === step;
              
              return (
                <React.Fragment key={s.id}>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      isComplete ? 'bg-green-500/20 text-green-400' :
                      isCurrent ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-800 text-gray-500'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{currentStep.label}</h3>
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between">
          <button
            onClick={step === 0 ? onCancel : handleBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                canProceed()
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Found Kingdom
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper descriptions
function getCharterDescription(id) {
  const descriptions = {
    conquest: 'Founded through military might and territorial expansion.',
    expansion: 'An extension of an existing nation seeking new frontiers.',
    exploration: 'Born from the spirit of discovery and pioneering.',
    grant: 'Established through official decree from a higher authority.',
    open: 'A free kingdom with no predefined structure.',
  };
  return descriptions[id] || '';
}

function getGovernmentDescription(id) {
  const descriptions = {
    despotism: 'Rule by a single absolute authority.',
    feudalism: 'A hierarchy of nobles owing fealty to the crown.',
    oligarchy: 'Rule by a small group of wealthy or powerful individuals.',
    republic: 'Citizens elect representatives to govern.',
    thaumocracy: 'Rule by those with magical power.',
    yeomanry: 'A nation of free landowners and farmers.',
  };
  return descriptions[id] || '';
}
