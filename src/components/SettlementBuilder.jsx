import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, X, Coins, TreePine, Mountain, Gem,
  Home, Building2, AlertTriangle, Hammer, Search,
  GripVertical, Trash2, Info, Anchor
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

// Building images - mapped to generated assets
// Note: Using import.meta.env.BASE_URL for GitHub Pages compatibility
const BASE = import.meta.env.BASE_URL || '/';
const BUILDING_IMAGES = {
  'houses': `${BASE}assets/buildings/cottage-1.jpg`,
  'inn': `${BASE}assets/buildings/inn-1.jpg`,
  'tavern': `${BASE}assets/buildings/inn-2.jpg`,
  'temple': `${BASE}assets/buildings/temple-1.jpg`,
  'shrine': `${BASE}assets/buildings/temple-2.jpg`,
  'granary': `${BASE}assets/buildings/cottage-2.jpg`, // placeholder
  // More images will be added as we generate them
};

export default function SettlementBuilder({ 
  settlement, 
  state, 
  onUpdateSettlement,
  onLog 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  const [draggedStructure, setDraggedStructure] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const kingdomLevel = state.kingdom?.level || 1;
  const currentRP = state.resources?.rp || 0;
  
  // Settlement configuration
  const BLOCKS_PER_ROW = 4;
  const LOTS_PER_BLOCK = 4;
  const TOTAL_BLOCKS = 16; // 4x4 grid of blocks
  
  // Get settlement type from blocks
  const getSettlementType = (blocks) => {
    if (blocks <= 4) return { type: 'Village', maxBlocks: 4, color: 'green' };
    if (blocks <= 8) return { type: 'Town', maxBlocks: 8, color: 'blue' };
    if (blocks <= 16) return { type: 'City', maxBlocks: 16, color: 'purple' };
    return { type: 'Metropolis', maxBlocks: 36, color: 'yellow' };
  };
  
  const settlementInfo = getSettlementType(settlement.blocks || 1);
  
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
  const canAfford = useCallback((structure) => {
    const cost = structure.cost || {};
    if (cost.rp && currentRP < cost.rp) return false;
    if (cost.lumber && (state.resources?.lumber || 0) < cost.lumber) return false;
    if (cost.stone && (state.resources?.stone || 0) < cost.stone) return false;
    if (cost.ore && (state.resources?.ore || 0) < cost.ore) return false;
    if (cost.luxuries && (state.resources?.luxuries || 0) < cost.luxuries) return false;
    return true;
  }, [currentRP, state.resources]);
  
  // Check if a slot is valid for placement
  const isValidPlacement = useCallback((slotIndex, structure) => {
    if (!structure) return false;
    
    // Check if slot is within settlement bounds
    const maxSlots = (settlement.blocks || 1) * LOTS_PER_BLOCK;
    if (slotIndex >= maxSlots) return false;
    
    // Check if slot is empty
    if (settlement.structures?.[slotIndex]) return false;
    
    // Check building size (multi-lot buildings)
    const lots = structure.lots || 1;
    if (lots > 1) {
      // Check if all required slots are available
      for (let i = 0; i < lots; i++) {
        const checkSlot = slotIndex + i;
        if (checkSlot >= maxSlots || settlement.structures?.[checkSlot]) {
          return false;
        }
      }
    }
    
    // Check waterfront requirement
    if (structure.requiresWater) {
      const waterfront = settlement.mapConfig?.waterfront || 'none';
      const row = Math.floor(slotIndex / BLOCKS_PER_ROW);
      const col = slotIndex % BLOCKS_PER_ROW;
      
      const isWaterfrontSlot = 
        (waterfront === 'south' && row === Math.floor(maxSlots / BLOCKS_PER_ROW) - 1) ||
        (waterfront === 'north' && row === 0) ||
        (waterfront === 'east' && col === BLOCKS_PER_ROW - 1) ||
        (waterfront === 'west' && col === 0);
        
      if (!isWaterfrontSlot) return false;
    }
    
    return true;
  }, [settlement]);
  
  // Build a structure at a slot
  const buildStructure = useCallback((structure, slotIndex) => {
    if (!canAfford(structure)) return;
    if (!isValidPlacement(slotIndex, structure)) return;
    
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
    
    // Fill slots for multi-lot buildings
    const lots = structure.lots || 1;
    for (let i = 0; i < lots; i++) {
      newStructures[slotIndex + i] = i === 0 ? structure.id : `${structure.id}_part`;
    }
    
    // Auto-expand blocks if needed
    const usedSlots = newStructures.filter(Boolean).length;
    const neededBlocks = Math.ceil(usedSlots / LOTS_PER_BLOCK);
    const newBlocks = Math.max(settlement.blocks || 1, neededBlocks);
    
    onUpdateSettlement({
      ...settlement,
      structures: newStructures,
      blocks: newBlocks,
    }, newResources);
    
    // Log the build
    const costStr = Object.entries(cost)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${v} ${k.toUpperCase()}`)
      .join(', ');
    
    onLog?.(`Built ${structure.name} in ${settlement.name} (${costStr})`, 'success');
  }, [settlement, state.resources, canAfford, isValidPlacement, onUpdateSettlement, onLog]);
  
  // Demolish a structure
  const demolishStructure = useCallback((slotIndex) => {
    const structureId = settlement.structures?.[slotIndex];
    if (!structureId || structureId.endsWith('_part')) return;
    
    const structure = getStructureById(structureId);
    const newStructures = [...(settlement.structures || [])];
    
    // Remove all parts of multi-lot building
    const lots = structure?.lots || 1;
    for (let i = 0; i < lots; i++) {
      newStructures[slotIndex + i] = null;
    }
    
    onUpdateSettlement({
      ...settlement,
      structures: newStructures,
    }, state.resources);
    
    onLog?.(`Demolished ${structure?.name || 'structure'} in ${settlement.name}`, 'info');
  }, [settlement, state.resources, onUpdateSettlement, onLog]);
  
  // Drag handlers
  const handleDragStart = (e, structure) => {
    if (!canAfford(structure)) {
      e.preventDefault();
      return;
    }
    setDraggedStructure(structure);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', structure.id);
  };
  
  const handleDragEnd = () => {
    setDraggedStructure(null);
    setDragOverSlot(null);
  };
  
  const handleDragOver = (e, slotIndex) => {
    e.preventDefault();
    if (draggedStructure && isValidPlacement(slotIndex, draggedStructure)) {
      e.dataTransfer.dropEffect = 'copy';
      setDragOverSlot(slotIndex);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };
  
  const handleDragLeave = () => {
    setDragOverSlot(null);
  };
  
  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    if (draggedStructure && isValidPlacement(slotIndex, draggedStructure)) {
      buildStructure(draggedStructure, slotIndex);
    }
    setDraggedStructure(null);
    setDragOverSlot(null);
  };
  
  // Calculate stats
  const usedSlots = (settlement.structures || []).filter(s => s && !s.endsWith?.('_part')).length;
  const maxSlots = (settlement.blocks || 1) * LOTS_PER_BLOCK;
  
  // Get cost string for display
  const getCostDisplay = (structure) => {
    const cost = structure.cost || {};
    const parts = [];
    if (cost.rp) parts.push(<span key="rp" className={currentRP >= cost.rp ? 'text-yellow-400' : 'text-red-400'}>{cost.rp} RP</span>);
    if (cost.lumber) parts.push(<span key="lumber" className={(state.resources?.lumber || 0) >= cost.lumber ? 'text-green-400' : 'text-red-400'}>{cost.lumber} 🪵</span>);
    if (cost.stone) parts.push(<span key="stone" className={(state.resources?.stone || 0) >= cost.stone ? 'text-gray-300' : 'text-red-400'}>{cost.stone} 🪨</span>);
    if (cost.ore) parts.push(<span key="ore" className={(state.resources?.ore || 0) >= cost.ore ? 'text-orange-400' : 'text-red-400'}>{cost.ore} ⛏️</span>);
    if (cost.luxuries) parts.push(<span key="lux" className={(state.resources?.luxuries || 0) >= cost.luxuries ? 'text-pink-400' : 'text-red-400'}>{cost.luxuries} 💎</span>);
    return parts.length > 0 ? parts.reduce((acc, part, i) => [...acc, i > 0 ? ' ' : '', part], []) : <span className="text-green-400">Free</span>;
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Building Palette (Left) */}
      <div className="w-72 flex flex-col glass-card">
        <div className="p-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Buildings
          </h3>
          
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-gray-800 border border-gray-700 rounded pl-8 pr-2 py-1.5 text-sm"
            />
          </div>
          
          {/* Level Filter */}
          <div className="flex gap-1">
            <button
              onClick={() => setFilterLevel(null)}
              className={`flex-1 px-2 py-1 rounded text-xs ${filterLevel === null ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}
            >
              All
            </button>
            {[1, 2, 3].map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                disabled={level > kingdomLevel}
                className={`flex-1 px-2 py-1 rounded text-xs ${
                  filterLevel === level ? 'bg-yellow-500/20 text-yellow-400' : 
                  level > kingdomLevel ? 'bg-gray-800 text-gray-600 cursor-not-allowed' :
                  'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                L{level}
              </button>
            ))}
          </div>
        </div>
        
        {/* Resources Bar */}
        <div className="px-3 py-2 bg-gray-800/50 text-xs flex flex-wrap gap-2 border-b border-white/10">
          <span className="text-yellow-400">{currentRP} RP</span>
          <span className="text-green-400">{state.resources?.lumber || 0} 🪵</span>
          <span className="text-gray-300">{state.resources?.stone || 0} 🪨</span>
          <span className="text-orange-400">{state.resources?.ore || 0} ⛏️</span>
          <span className="text-pink-400">{state.resources?.luxuries || 0} 💎</span>
        </div>
        
        {/* Building List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {availableStructures.map(structure => {
            const affordable = canAfford(structure);
            const image = BUILDING_IMAGES[structure.id];
            
            return (
              <div
                key={structure.id}
                draggable={affordable}
                onDragStart={(e) => handleDragStart(e, structure)}
                onDragEnd={handleDragEnd}
                className={`p-2 rounded-lg border transition-all ${
                  affordable
                    ? 'bg-white/5 border-white/10 hover:border-yellow-500/50 cursor-grab active:cursor-grabbing'
                    : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex gap-2">
                  {/* Building Thumbnail */}
                  <div className="w-12 h-12 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                    {image ? (
                      <img src={image} alt={structure.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm text-yellow-400 truncate">{structure.name}</span>
                      <span className="text-[10px] bg-gray-700 px-1 rounded flex-shrink-0">L{structure.level}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {structure.lots > 1 ? `${structure.lots} lots` : '1 lot'}
                      {structure.requiresWater && <span className="ml-1 text-blue-400">🌊</span>}
                    </div>
                    <div className="text-[10px] mt-0.5">{getCostDisplay(structure)}</div>
                  </div>
                  
                  {affordable && (
                    <GripVertical className="w-4 h-4 text-gray-600 flex-shrink-0 self-center" />
                  )}
                </div>
              </div>
            );
          })}
          
          {availableStructures.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">
              No buildings found
            </div>
          )}
        </div>
      </div>
      
      {/* Settlement Grid (Center) */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="glass-card p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
                {settlement.name}
                {settlement.isCapital && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Capital</span>
                )}
              </h3>
              <div className="text-sm text-gray-400">
                {settlementInfo.type} • {settlement.blocks || 1} blocks • {usedSlots}/{maxSlots} lots used
                {settlement.mapConfig?.waterfront && settlement.mapConfig.waterfront !== 'none' && (
                  <span className="ml-2 text-blue-400">
                    <Anchor className="w-3 h-3 inline mr-1" />
                    {settlement.mapConfig.waterfront} waterfront
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick expand blocks button */}
            {settlement.blocks < settlementInfo.maxBlocks && (
              <button
                onClick={() => {
                  onUpdateSettlement({
                    ...settlement,
                    blocks: Math.min((settlement.blocks || 1) + 1, settlementInfo.maxBlocks),
                  }, state.resources);
                }}
                className="btn-secondary text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Block
              </button>
            )}
          </div>
        </div>
        
        {/* Grid */}
        <div className="flex-1 glass-card p-4 overflow-auto">
          <div 
            className="grid gap-2 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${BLOCKS_PER_ROW}, minmax(80px, 1fr))`,
              maxWidth: '600px'
            }}
          >
            {Array(TOTAL_BLOCKS).fill(null).map((_, slotIndex) => {
              const structureId = settlement.structures?.[slotIndex];
              const isPart = structureId?.endsWith?.('_part');
              const structure = structureId && !isPart ? getStructureById(structureId) : null;
              const isInBounds = slotIndex < maxSlots;
              const isValidDrop = draggedStructure && isValidPlacement(slotIndex, draggedStructure);
              const isDragOver = dragOverSlot === slotIndex;
              
              // Waterfront indicator
              const waterfront = settlement.mapConfig?.waterfront || 'none';
              const row = Math.floor(slotIndex / BLOCKS_PER_ROW);
              const col = slotIndex % BLOCKS_PER_ROW;
              const isWaterfrontSlot = 
                (waterfront === 'south' && row === Math.ceil(maxSlots / BLOCKS_PER_ROW) - 1) ||
                (waterfront === 'north' && row === 0) ||
                (waterfront === 'east' && col === BLOCKS_PER_ROW - 1) ||
                (waterfront === 'west' && col === 0);
              
              return (
                <div
                  key={slotIndex}
                  onDragOver={(e) => handleDragOver(e, slotIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, slotIndex)}
                  onClick={() => setSelectedSlot(selectedSlot === slotIndex ? null : slotIndex)}
                  className={`
                    aspect-square rounded-lg border-2 transition-all relative overflow-hidden
                    ${!isInBounds ? 'bg-black/40 border-white/5 opacity-30' : ''}
                    ${isInBounds && !structureId ? 'bg-white/5 border-dashed border-white/20 hover:border-yellow-500/30' : ''}
                    ${structure ? 'bg-purple-900/30 border-purple-500/50' : ''}
                    ${isPart ? 'bg-purple-900/20 border-purple-500/30' : ''}
                    ${isDragOver && isValidDrop ? 'border-green-500 bg-green-500/20 border-solid' : ''}
                    ${isDragOver && !isValidDrop ? 'border-red-500 bg-red-500/10' : ''}
                    ${draggedStructure && !isDragOver && isValidDrop ? 'border-yellow-500/30' : ''}
                    ${isWaterfrontSlot && isInBounds ? 'ring-1 ring-blue-500/30 ring-inset' : ''}
                    ${selectedSlot === slotIndex ? 'ring-2 ring-yellow-500' : ''}
                  `}
                >
                  {/* Waterfront indicator */}
                  {isWaterfrontSlot && isInBounds && !structureId && (
                    <div className="absolute inset-0 flex items-center justify-center text-blue-400/30">
                      <Anchor className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Empty slot */}
                  {isInBounds && !structureId && !isPart && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                      <Plus className="w-6 h-6" />
                    </div>
                  )}
                  
                  {/* Building */}
                  {structure && (
                    <div className="absolute inset-0 group">
                      {/* Building image */}
                      {BUILDING_IMAGES[structure.id] ? (
                        <img 
                          src={BUILDING_IMAGES[structure.id]} 
                          alt={structure.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-900/50">
                          <Building2 className="w-8 h-8 text-purple-400" />
                        </div>
                      )}
                      
                      {/* Overlay with name */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <div className="text-[10px] text-white text-center truncate leading-tight">
                          {structure.name}
                        </div>
                      </div>
                      
                      {/* Demolish button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          demolishStructure(slotIndex);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                  
                  {/* Multi-lot building part */}
                  {isPart && (
                    <div className="absolute inset-0 bg-purple-900/30 flex items-center justify-center">
                      <div className="text-[10px] text-purple-400/50">...</div>
                    </div>
                  )}
                  
                  {/* Drag ghost preview */}
                  {isDragOver && isValidDrop && draggedStructure && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <div className="text-xs text-green-400 text-center">
                        <div>{draggedStructure.name}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Drag instruction */}
          {!draggedStructure && (
            <div className="text-center text-gray-500 text-xs mt-4">
              Drag buildings from the palette and drop them on the grid
            </div>
          )}
          
          {/* Dragging indicator */}
          {draggedStructure && (
            <div className="text-center text-yellow-400 text-sm mt-4 animate-pulse">
              Drop "{draggedStructure.name}" on a valid slot
            </div>
          )}
        </div>
        
        {/* Structure Effects Summary */}
        {settlement.structures?.some(s => s && !s.endsWith?.('_part')) && (
          <div className="glass-card p-3 mt-4">
            <div className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Active Building Effects
            </div>
            <div className="text-xs text-gray-400 space-y-1 max-h-24 overflow-y-auto">
              {settlement.structures
                .filter((sId, i) => sId && !sId.endsWith?.('_part'))
                .map((sId, i) => {
                  const structure = getStructureById(sId);
                  return structure?.effects ? (
                    <div key={i} className="flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">{structure.name}:</span>
                      <span>{structure.effects}</span>
                    </div>
                  ) : null;
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
