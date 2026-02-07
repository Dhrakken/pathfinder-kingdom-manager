import React, { useState, useMemo } from 'react';
import { 
  Plus, X, Check, Coins, TreePine, Mountain, Gem,
  Home, Building2, ChevronDown, ChevronUp, AlertTriangle,
  Hammer, Search
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

export default function SettlementBuilder({ 
  settlement, 
  state, 
  onUpdateSettlement,
  onLog 
}) {
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  
  const kingdomLevel = state.kingdom?.level || 1;
  const currentRP = state.resources?.rp || 0;
  
  // Get available structures for building
  const availableStructures = useMemo(() => {
    let structures = getStructuresByLevel(kingdomLevel);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      structures = structures.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.effects.toLowerCase().includes(query)
      );
    }
    
    if (filterLevel !== null) {
      structures = structures.filter(s => s.level === filterLevel);
    }
    
    return structures.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [kingdomLevel, searchQuery, filterLevel]);
  
  // Check if we can afford a structure
  const canAfford = (structure) => {
    const cost = structure.cost || {};
    if (cost.rp && currentRP < cost.rp) return false;
    if (cost.lumber && (state.resources?.lumber || 0) < cost.lumber) return false;
    if (cost.stone && (state.resources?.stone || 0) < cost.stone) return false;
    if (cost.ore && (state.resources?.ore || 0) < cost.ore) return false;
    if (cost.luxuries && (state.resources?.luxuries || 0) < cost.luxuries) return false;
    return true;
  };
  
  // Build a structure
  const buildStructure = (structure) => {
    if (!canAfford(structure)) return;
    
    const cost = structure.cost || {};
    
    // Deduct costs
    const newResources = { ...state.resources };
    if (cost.rp) newResources.rp -= cost.rp;
    if (cost.lumber) newResources.lumber -= cost.lumber;
    if (cost.stone) newResources.stone -= cost.stone;
    if (cost.ore) newResources.ore -= cost.ore;
    if (cost.luxuries) newResources.luxuries -= cost.luxuries;
    
    // Add structure to settlement
    const newStructures = [...(settlement.structures || [])];
    if (selectedLot !== null && selectedLot < newStructures.length) {
      newStructures[selectedLot] = structure.id;
    } else {
      newStructures.push(structure.id);
    }
    
    // Calculate new block count
    const totalLots = newStructures.reduce((acc, sId) => {
      const s = getStructureById(sId);
      return acc + (s?.lots || 1);
    }, 0);
    const blocks = Math.ceil(totalLots / 4);
    
    onUpdateSettlement({
      ...settlement,
      structures: newStructures,
      blocks: Math.max(settlement.blocks, blocks),
    }, newResources);
    
    // Log the build
    const costStr = Object.entries(cost)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${v} ${k.toUpperCase()}`)
      .join(', ');
    
    onLog?.(`Built ${structure.name} in ${settlement.name} (${costStr})`, 'success');
    
    setShowBuildModal(false);
    setSelectedLot(null);
  };
  
  // Demolish a structure
  const demolishStructure = (index) => {
    const structureId = settlement.structures[index];
    const structure = getStructureById(structureId);
    
    const newStructures = [...settlement.structures];
    newStructures.splice(index, 1);
    
    onUpdateSettlement({
      ...settlement,
      structures: newStructures,
    }, state.resources);
    
    onLog?.(`Demolished ${structure?.name || 'structure'} in ${settlement.name}`, 'info');
  };
  
  // Get settlement type from blocks
  const getSettlementType = () => {
    const blocks = settlement.blocks || 1;
    if (blocks <= 4) return { type: 'Village', maxBlocks: 4 };
    if (blocks <= 8) return { type: 'Town', maxBlocks: 8 };
    if (blocks <= 16) return { type: 'City', maxBlocks: 16 };
    return { type: 'Metropolis', maxBlocks: 36 };
  };
  
  const settlementInfo = getSettlementType();
  const usedLots = settlement.structures?.reduce((acc, sId) => {
    const s = getStructureById(sId);
    return acc + (s?.lots || 1);
  }, 0) || 0;
  const maxLots = settlementInfo.maxBlocks * 4;
  
  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            {settlement.name}
            {settlement.isCapital && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Capital</span>}
          </h3>
          <div className="text-sm text-gray-400">
            {settlementInfo.type} • {settlement.blocks || 1} blocks • {usedLots}/{maxLots} lots used
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedLot(null);
            setShowBuildModal(true);
          }}
          className="btn-royal flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Build
        </button>
      </div>
      
      {/* Structure Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {Array(16).fill(null).map((_, i) => {
          const structureId = settlement.structures?.[i];
          const structure = structureId ? getStructureById(structureId) : null;
          
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center transition-all ${
                structure
                  ? 'bg-purple-900/30 border-purple-500/50'
                  : i < maxLots
                  ? 'bg-white/5 border-white/20 hover:border-yellow-500/50 cursor-pointer'
                  : 'bg-black/20 border-white/5 opacity-50'
              }`}
              onClick={() => {
                if (!structure && i < maxLots) {
                  setSelectedLot(i);
                  setShowBuildModal(true);
                }
              }}
            >
              {structure ? (
                <div className="text-center p-1 group relative">
                  <div className="text-xs text-gray-300 leading-tight">{structure.name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      demolishStructure(i);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full hidden group-hover:flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : i < maxLots ? (
                <Plus className="w-6 h-6 text-gray-600" />
              ) : null}
            </div>
          );
        })}
      </div>
      
      {/* Structure Effects Summary */}
      {settlement.structures?.length > 0 && (
        <div className="text-xs text-gray-400 space-y-1">
          <div className="font-semibold text-gray-300">Active Effects:</div>
          {settlement.structures.map((sId, i) => {
            const structure = getStructureById(sId);
            return structure?.effects ? (
              <div key={i} className="flex gap-2">
                <span className="text-purple-400">{structure.name}:</span>
                <span>{structure.effects}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
      
      {/* Build Modal */}
      {showBuildModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-yellow-600/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                  <Hammer className="w-5 h-5" />
                  Build Structure
                </h3>
                <div className="text-sm text-gray-400">
                  {settlement.name} • Slot {selectedLot !== null ? selectedLot + 1 : 'any'}
                </div>
              </div>
              <button onClick={() => setShowBuildModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-800 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search structures..."
                  className="w-full bg-gray-800 border border-gray-700 rounded pl-10 pr-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterLevel(null)}
                  className={`px-3 py-1 rounded text-xs ${filterLevel === null ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}
                >
                  All
                </button>
                {[1, 2, 3].map(level => (
                  <button
                    key={level}
                    onClick={() => setFilterLevel(level)}
                    disabled={level > kingdomLevel}
                    className={`px-3 py-1 rounded text-xs ${
                      filterLevel === level ? 'bg-yellow-500/20 text-yellow-400' : 
                      level > kingdomLevel ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
                      'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Resources */}
            <div className="px-4 py-2 bg-gray-800/50 flex items-center gap-4 text-sm">
              <span className="text-gray-400">Available:</span>
              <span className="text-yellow-400">{currentRP} RP</span>
              <span className="text-green-400">{state.resources?.lumber || 0} Lumber</span>
              <span className="text-gray-400">{state.resources?.stone || 0} Stone</span>
              <span className="text-orange-400">{state.resources?.ore || 0} Ore</span>
              <span className="text-pink-400">{state.resources?.luxuries || 0} Lux</span>
            </div>
            
            {/* Structure List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {availableStructures.map(structure => {
                  const affordable = canAfford(structure);
                  const cost = structure.cost || {};
                  
                  return (
                    <div
                      key={structure.id}
                      className={`p-3 rounded-lg border transition-all ${
                        affordable
                          ? 'bg-white/5 border-white/10 hover:border-yellow-500/50 cursor-pointer'
                          : 'bg-gray-800/50 border-gray-700 opacity-60'
                      }`}
                      onClick={() => affordable && buildStructure(structure)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-yellow-400">{structure.name}</span>
                            <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">L{structure.level}</span>
                            <span className="text-xs text-gray-500">{structure.lots} lot{structure.lots > 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{structure.effects}</div>
                        </div>
                        <div className="text-right text-xs space-y-0.5">
                          {cost.rp && <div className={currentRP >= cost.rp ? 'text-yellow-400' : 'text-red-400'}>{cost.rp} RP</div>}
                          {cost.lumber && <div className={state.resources?.lumber >= cost.lumber ? 'text-green-400' : 'text-red-400'}>{cost.lumber} Lumber</div>}
                          {cost.stone && <div className={state.resources?.stone >= cost.stone ? 'text-gray-400' : 'text-red-400'}>{cost.stone} Stone</div>}
                          {cost.ore && <div className={state.resources?.ore >= cost.ore ? 'text-orange-400' : 'text-red-400'}>{cost.ore} Ore</div>}
                          {cost.luxuries && <div className={state.resources?.luxuries >= cost.luxuries ? 'text-pink-400' : 'text-red-400'}>{cost.luxuries} Lux</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {availableStructures.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No structures match your search
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
