import React, { useState, useMemo } from 'react';
import { 
  Plus, X, Hammer, Search, Waves,
  ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

// Map structure IDs to Medieval RTS building sprites
// These are complete building images, not tiles
const BUILDING_IMAGES = {
  // Basic housing
  'houses': 'medievalStructure_05.png', // Small house
  'tenement': 'medievalStructure_06.png', // Another house style
  
  // Commercial
  'general-store': 'medievalStructure_09.png', // Shop/store
  'marketplace': 'medievalStructure_11.png', // Market stall
  'inn': 'medievalStructure_07.png', // Inn building
  'tavern': 'medievalStructure_08.png', // Tavern
  
  // Religious
  'shrine': 'medievalStructure_03.png', // Small shrine
  'temple': 'medievalStructure_04.png', // Larger temple
  'cemetery': 'medievalStructure_12.png',
  
  // Industrial  
  'mill': 'medievalStructure_21.png', // Windmill
  'smithy': 'medievalStructure_16.png', // Forge/smithy
  'lumber-yard': 'medievalStructure_19.png',
  'foundry': 'medievalStructure_17.png',
  'granary': 'medievalStructure_10.png', // Storage building
  'stockyard': 'medievalStructure_18.png',
  
  // Military/Defense
  'barracks': 'medievalStructure_13.png', // Military building
  'garrison': 'medievalStructure_14.png', // Larger military
  'castle': 'medievalStructure_15.png', // Castle
  'wooden-walls': 'medievalStructure_22.png',
  'stone-walls': 'medievalStructure_23.png',
  'watchtower': 'medievalStructure_20.png',
  
  // Government
  'town-hall': 'medievalStructure_01.png', // Large official building
  'palace': 'medievalStructure_02.png', // Grand building
  
  // Default fallback
  'default': 'medievalStructure_05.png',
};

// Get building image path
const getBuildingImage = (structureId) => {
  const filename = BUILDING_IMAGES[structureId] || BUILDING_IMAGES['default'];
  return `${import.meta.env.BASE_URL}buildings/${filename}`;
};

// Get settlement type based on blocks
const getSettlementType = (blocks) => {
  if (blocks <= 4) return { name: 'Village', tier: 'village' };
  if (blocks <= 8) return { name: 'Town', tier: 'town' };
  if (blocks <= 16) return { name: 'City', tier: 'city' };
  return { name: 'Metropolis', tier: 'metropolis' };
};

export default function SettlementVisual({ 
  settlement, 
  state, 
  onUpdateSettlement,
  onLog 
}) {
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  
  const kingdomLevel = state.kingdom?.level || 1;
  const currentRP = state.resources?.rp || 0;
  
  // Settlement configuration
  const config = settlement.mapConfig || {
    rows: 3,
    cols: 3,
    waterfront: 'south',
  };
  
  // Calculate settlement tier
  const usedBlocks = new Set(
    (settlement.structurePlacements || []).map(p => p.block)
  ).size || 1;
  const { name: settlementTypeName, tier } = getSettlementType(usedBlocks);
  
  // Get structures placed in each block
  const structureMap = useMemo(() => {
    const map = {};
    const placements = settlement.structurePlacements || [];
    
    for (const placement of placements) {
      map[placement.block] = map[placement.block] || [];
      map[placement.block].push(placement);
    }
    
    return map;
  }, [settlement.structurePlacements]);
  
  // Get available structures for building
  const availableStructures = useMemo(() => {
    let structures = getStructuresByLevel(kingdomLevel);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      structures = structures.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.effects?.toLowerCase().includes(query)
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
  
  // Check if block is on waterfront
  const isWaterfront = (blockIndex) => {
    const row = Math.floor(blockIndex / config.cols);
    switch (config.waterfront) {
      case 'south': return row === config.rows - 1;
      case 'north': return row === 0;
      case 'east': return blockIndex % config.cols === config.cols - 1;
      case 'west': return blockIndex % config.cols === 0;
      default: return false;
    }
  };
  
  // Build a structure
  const buildStructure = (structure) => {
    if (!canAfford(structure) || selectedSlot === null) return;
    
    const cost = structure.cost || {};
    
    // Deduct costs
    const newResources = { ...state.resources };
    if (cost.rp) newResources.rp -= cost.rp;
    if (cost.lumber) newResources.lumber -= cost.lumber;
    if (cost.stone) newResources.stone -= cost.stone;
    if (cost.ore) newResources.ore -= cost.ore;
    if (cost.luxuries) newResources.luxuries -= cost.luxuries;
    
    // Add placement
    const blockLabel = String.fromCharCode(65 + selectedSlot);
    const newPlacements = [...(settlement.structurePlacements || [])];
    
    newPlacements.push({
      block: blockLabel,
      lot: 1,
      structureId: structure.id,
      lotsUsed: structure.lots || 1,
    });
    
    onUpdateSettlement({
      ...settlement,
      structurePlacements: newPlacements,
      blocks: Math.max(settlement.blocks || 1, new Set(newPlacements.map(p => p.block)).size),
    }, newResources);
    
    const costStr = Object.entries(cost)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${v} ${k.toUpperCase()}`)
      .join(', ');
    
    onLog?.(`Built ${structure.name} in ${settlement.name} (${costStr})`, 'success');
    
    setShowBuildModal(false);
    setSelectedSlot(null);
  };
  
  // Demolish
  const demolishStructure = (block, structureId) => {
    const structure = getStructureById(structureId);
    
    const newPlacements = (settlement.structurePlacements || []).filter(p => 
      !(p.block === block && p.structureId === structureId)
    );
    
    onUpdateSettlement({
      ...settlement,
      structurePlacements: newPlacements,
    }, state.resources);
    
    onLog?.(`Demolished ${structure?.name || 'structure'} in ${settlement.name}`, 'info');
  };
  
  const totalSlots = config.rows * config.cols;
  
  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
            {settlement.name}
            {settlement.isCapital && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                Capital
              </span>
            )}
          </h3>
          <div className="text-sm text-gray-400">
            {settlementTypeName} • {usedBlocks} block{usedBlocks !== 1 ? 's' : ''}
            {config.waterfront !== 'none' && (
              <span className="text-blue-400 ml-2">
                <Waves className="w-3 h-3 inline mr-1" />
                Lakefront
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedSlot(null);
            setShowBuildModal(true);
          }}
          className="btn-royal flex items-center gap-2"
        >
          <Hammer className="w-4 h-4" />
          Build
        </button>
      </div>
      
      {/* Visual Settlement Grid */}
      <div 
        className="relative mx-auto rounded-lg overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, 140px)`,
          gap: 4,
          padding: 8,
          background: 'linear-gradient(135deg, #2d5a16 0%, #1a4a0a 100%)',
          border: '4px solid rgba(139, 90, 43, 0.6)',
        }}
      >
        {Array(totalSlots).fill(null).map((_, slotIndex) => {
          const blockLabel = String.fromCharCode(65 + slotIndex);
          const placements = structureMap[blockLabel] || [];
          const onWaterfront = isWaterfront(slotIndex);
          
          return (
            <div
              key={slotIndex}
              className={`
                relative rounded-lg transition-all overflow-hidden
                ${placements.length === 0 ? 'hover:ring-2 hover:ring-yellow-500/50 cursor-pointer' : ''}
              `}
              style={{
                width: 140,
                height: 120,
                background: onWaterfront 
                  ? 'linear-gradient(to bottom, #3a6b35 60%, #2563eb40 100%)'
                  : '#3a6b35',
                border: '2px solid rgba(0,0,0,0.3)',
              }}
              onClick={() => {
                if (placements.length === 0) {
                  setSelectedSlot(slotIndex);
                  setShowBuildModal(true);
                }
              }}
            >
              {/* Block label */}
              <div className="absolute top-1 left-2 text-xs font-bold text-white/60 z-10">
                {blockLabel}
              </div>
              
              {/* Grass texture pattern */}
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'radial-gradient(circle, #228b22 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />
              
              {/* Water waves for waterfront */}
              {onWaterfront && (
                <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full h-full"
                    style={{
                      background: 'linear-gradient(to top, rgba(37, 99, 235, 0.5), transparent)',
                    }}
                  />
                  <svg className="absolute bottom-0 w-full h-3 text-blue-400/40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 12.5 0, 25 5 T 50 5 T 75 5 T 100 5 V 10 H 0 Z" fill="currentColor" />
                  </svg>
                </div>
              )}
              
              {/* Buildings in this block */}
              {placements.length > 0 ? (
                <div className="absolute inset-0 flex flex-wrap items-center justify-center p-2 gap-1">
                  {placements.map((placement, i) => {
                    const structure = getStructureById(placement.structureId);
                    return (
                      <div key={i} className="relative group">
                        <img
                          src={getBuildingImage(placement.structureId)}
                          alt={structure?.name || 'Building'}
                          className="h-16 w-auto object-contain drop-shadow-lg transition-transform group-hover:scale-110"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {/* Demolish button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            demolishStructure(blockLabel, placement.structureId);
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity shadow-lg"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {/* Building name tooltip */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-20 pointer-events-none">
                          {structure?.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-10 h-10 text-white/20" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-4 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded" style={{ background: '#3a6b35' }} />
          <span>Land</span>
        </div>
        {config.waterfront !== 'none' && (
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to bottom, #3a6b35 50%, #2563eb60 100%)' }} />
            <span>Waterfront</span>
          </div>
        )}
        <div className="text-yellow-400/80">
          {settlementTypeName} ({usedBlocks} block{usedBlocks !== 1 ? 's' : ''})
        </div>
      </div>
      
      {/* Structure List */}
      {Object.keys(structureMap).length > 0 && (
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-3 mt-4">
          <div className="font-semibold text-gray-300 mb-2">Structures:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(structureMap).map(([block, placements]) =>
              placements.map((p, i) => {
                const structure = getStructureById(p.structureId);
                return (
                  <span key={`${block}-${i}`} className="bg-purple-900/30 px-2 py-1 rounded flex items-center gap-1">
                    <img 
                      src={getBuildingImage(p.structureId)} 
                      alt="" 
                      className="w-4 h-4 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                    <span className="text-purple-400 font-mono">{block}:</span>{' '}
                    <span className="text-yellow-400">{structure?.name}</span>
                  </span>
                );
              })
            )}
          </div>
        </div>
      )}
      
      {/* Build Modal */}
      {showBuildModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-yellow-600/30 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                  <Hammer className="w-5 h-5" />
                  Build Structure
                </h3>
                <div className="text-sm text-gray-400">
                  {settlement.name}
                  {selectedSlot !== null && ` • Block ${String.fromCharCode(65 + selectedSlot)}`}
                </div>
              </div>
              <button onClick={() => setShowBuildModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Block Selection */}
            {selectedSlot === null && (
              <div className="p-4 border-b border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Select a block:</div>
                <div className="flex flex-wrap gap-2">
                  {Array(totalSlots).fill(null).map((_, i) => {
                    const blockLabel = String.fromCharCode(65 + i);
                    const hasBuildings = (structureMap[blockLabel] || []).length > 0;
                    const onWater = isWaterfront(i);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => !hasBuildings && setSelectedSlot(i)}
                        disabled={hasBuildings}
                        className={`w-14 h-14 rounded-lg border-2 font-mono text-sm flex flex-col items-center justify-center transition-all ${
                          hasBuildings
                            ? 'border-purple-500/50 bg-purple-900/30 cursor-not-allowed opacity-50'
                            : onWater 
                            ? 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/40 hover:border-blue-400' 
                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-yellow-500'
                        }`}
                      >
                        <span className="font-bold">{blockLabel}</span>
                        {onWater && <Waves className="w-3 h-3 text-blue-400 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Search & Filters */}
            <div className="p-4 border-b border-gray-800 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search structures..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm focus:border-yellow-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterLevel(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === null ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'}`}
                >
                  All Levels
                </button>
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setFilterLevel(level)}
                    disabled={level > kingdomLevel}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filterLevel === level ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                      level > kingdomLevel ? 'bg-gray-800/50 text-gray-600 border border-gray-800 cursor-not-allowed' :
                      'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Resources */}
            <div className="px-4 py-2 bg-gray-800/50 flex items-center gap-4 text-sm border-b border-gray-800">
              <span className="text-gray-500">Treasury:</span>
              <span className="text-yellow-400 font-medium">{currentRP} RP</span>
              <span className="text-green-400">{state.resources?.lumber || 0} Lumber</span>
              <span className="text-gray-400">{state.resources?.stone || 0} Stone</span>
              <span className="text-orange-400">{state.resources?.ore || 0} Ore</span>
            </div>
            
            {/* Structure List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableStructures.map(structure => {
                  const affordable = canAfford(structure);
                  const cost = structure.cost || {};
                  
                  return (
                    <div
                      key={structure.id}
                      className={`p-3 rounded-lg border-2 transition-all flex gap-3 ${
                        affordable && selectedSlot !== null
                          ? 'bg-gray-800/50 border-gray-700 hover:border-yellow-500/50 hover:bg-gray-800 cursor-pointer'
                          : 'bg-gray-800/30 border-gray-800 opacity-50'
                      }`}
                      onClick={() => affordable && selectedSlot !== null && buildStructure(structure)}
                    >
                      {/* Building Preview */}
                      <div className="flex-shrink-0 w-16 h-16 bg-green-900/30 rounded-lg flex items-center justify-center">
                        <img 
                          src={getBuildingImage(structure.id)}
                          alt={structure.name}
                          className="max-w-full max-h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-yellow-400 truncate">{structure.name}</span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded flex-shrink-0">
                            L{structure.level}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{structure.effects}</div>
                        <div className="flex gap-2 mt-2 text-xs">
                          {cost.rp && (
                            <span className={`px-1.5 py-0.5 rounded ${currentRP >= cost.rp ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                              {cost.rp} RP
                            </span>
                          )}
                          {cost.lumber && (
                            <span className={`px-1.5 py-0.5 rounded ${(state.resources?.lumber || 0) >= cost.lumber ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {cost.lumber} Lumber
                            </span>
                          )}
                          {cost.stone && (
                            <span className={`px-1.5 py-0.5 rounded ${(state.resources?.stone || 0) >= cost.stone ? 'bg-gray-500/20 text-gray-300' : 'bg-red-500/20 text-red-400'}`}>
                              {cost.stone} Stone
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {availableStructures.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No structures match your search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
