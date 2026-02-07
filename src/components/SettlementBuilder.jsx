import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, X, Hammer, Search, Grid, Eye, EyeOff,
  GripVertical, Trash2, Info, Anchor, ZoomIn, ZoomOut
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

// Building images - mapped to generated assets
const BASE = import.meta.env.BASE_URL || '/';
const BUILDING_IMAGES = {
  'houses': `${BASE}assets/buildings/cottage-1.jpg`,
  'inn': `${BASE}assets/buildings/inn-1.jpg`,
  'tavern': `${BASE}assets/buildings/inn-2.jpg`,
  'temple': `${BASE}assets/buildings/temple-1.jpg`,
  'shrine': `${BASE}assets/buildings/temple-2.jpg`,
  'granary': `${BASE}assets/buildings/cottage-2.jpg`,
};

// Grid configuration
const GRID_COLS = 8; // 8 lots wide
const GRID_ROWS = 8; // 8 lots tall (2 blocks x 4 lots = 8 for a village)
const LOT_SIZE = 80; // Base lot size in pixels

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
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  
  const kingdomLevel = state.kingdom?.level || 1;
  const currentRP = state.resources?.rp || 0;
  
  // Settlement type determines available area
  const getSettlementType = (blocks) => {
    if (blocks <= 4) return { type: 'Village', maxBlocks: 4, gridSize: 4 }; // 4x4 lots
    if (blocks <= 8) return { type: 'Town', maxBlocks: 8, gridSize: 6 }; // 6x6 lots
    if (blocks <= 16) return { type: 'City', maxBlocks: 16, gridSize: 8 }; // 8x8 lots
    return { type: 'Metropolis', maxBlocks: 36, gridSize: 12 }; // 12x12 lots
  };
  
  const settlementInfo = getSettlementType(settlement.blocks || 1);
  const gridSize = settlementInfo.gridSize;
  const totalLots = gridSize * gridSize;
  
  // Get available structures
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
  
  // Check affordability
  const canAfford = useCallback((structure) => {
    const cost = structure.cost || {};
    if (cost.rp && currentRP < cost.rp) return false;
    if (cost.lumber && (state.resources?.lumber || 0) < cost.lumber) return false;
    if (cost.stone && (state.resources?.stone || 0) < cost.stone) return false;
    if (cost.ore && (state.resources?.ore || 0) < cost.ore) return false;
    if (cost.luxuries && (state.resources?.luxuries || 0) < cost.luxuries) return false;
    return true;
  }, [currentRP, state.resources]);
  
  // Check valid placement
  const isValidPlacement = useCallback((slotIndex, structure) => {
    if (!structure) return false;
    if (slotIndex >= totalLots) return false;
    if (settlement.structures?.[slotIndex]) return false;
    
    // Multi-lot buildings
    const lots = structure.lots || 1;
    if (lots > 1) {
      const row = Math.floor(slotIndex / gridSize);
      const col = slotIndex % gridSize;
      
      // Check if building fits (assuming horizontal layout for 2-lot, 2x2 for 4-lot)
      if (lots === 2) {
        if (col + 2 > gridSize) return false;
        if (settlement.structures?.[slotIndex + 1]) return false;
      } else if (lots === 4) {
        if (col + 2 > gridSize || row + 2 > gridSize) return false;
        if (settlement.structures?.[slotIndex + 1]) return false;
        if (settlement.structures?.[slotIndex + gridSize]) return false;
        if (settlement.structures?.[slotIndex + gridSize + 1]) return false;
      }
    }
    
    // Waterfront check
    if (structure.requiresWater) {
      const waterfront = settlement.mapConfig?.waterfront || 'none';
      const row = Math.floor(slotIndex / gridSize);
      const col = slotIndex % gridSize;
      
      const isWaterfrontSlot = 
        (waterfront === 'south' && row === gridSize - 1) ||
        (waterfront === 'north' && row === 0) ||
        (waterfront === 'east' && col === gridSize - 1) ||
        (waterfront === 'west' && col === 0);
        
      if (!isWaterfrontSlot) return false;
    }
    
    return true;
  }, [settlement, totalLots, gridSize]);
  
  // Build structure
  const buildStructure = useCallback((structure, slotIndex) => {
    if (!canAfford(structure)) return;
    if (!isValidPlacement(slotIndex, structure)) return;
    
    const cost = structure.cost || {};
    const newResources = { ...state.resources };
    if (cost.rp) newResources.rp -= cost.rp;
    if (cost.lumber) newResources.lumber -= cost.lumber;
    if (cost.stone) newResources.stone -= cost.stone;
    if (cost.ore) newResources.ore -= cost.ore;
    if (cost.luxuries) newResources.luxuries -= cost.luxuries;
    
    const newStructures = [...(settlement.structures || [])];
    const lots = structure.lots || 1;
    
    // Place building and mark occupied slots
    newStructures[slotIndex] = structure.id;
    if (lots === 2) {
      newStructures[slotIndex + 1] = `${structure.id}_part`;
    } else if (lots === 4) {
      newStructures[slotIndex + 1] = `${structure.id}_part`;
      newStructures[slotIndex + gridSize] = `${structure.id}_part`;
      newStructures[slotIndex + gridSize + 1] = `${structure.id}_part`;
    }
    
    onUpdateSettlement({
      ...settlement,
      structures: newStructures,
    }, newResources);
    
    const costStr = Object.entries(cost)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${v} ${k.toUpperCase()}`)
      .join(', ');
    
    onLog?.(`Built ${structure.name} in ${settlement.name} (${costStr})`, 'success');
  }, [settlement, state.resources, canAfford, isValidPlacement, onUpdateSettlement, onLog, gridSize]);
  
  // Demolish
  const demolishStructure = useCallback((slotIndex) => {
    const structureId = settlement.structures?.[slotIndex];
    if (!structureId || structureId.endsWith('_part')) return;
    
    const structure = getStructureById(structureId);
    const newStructures = [...(settlement.structures || [])];
    const lots = structure?.lots || 1;
    
    newStructures[slotIndex] = null;
    if (lots === 2) {
      newStructures[slotIndex + 1] = null;
    } else if (lots === 4) {
      newStructures[slotIndex + 1] = null;
      newStructures[slotIndex + gridSize] = null;
      newStructures[slotIndex + gridSize + 1] = null;
    }
    
    onUpdateSettlement({ ...settlement, structures: newStructures }, state.resources);
    onLog?.(`Demolished ${structure?.name || 'structure'} in ${settlement.name}`, 'info');
  }, [settlement, state.resources, onUpdateSettlement, onLog, gridSize]);
  
  // Drag handlers
  const handleDragStart = (e, structure) => {
    if (!canAfford(structure)) {
      e.preventDefault();
      return;
    }
    setDraggedStructure(structure);
    e.dataTransfer.effectAllowed = 'copy';
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
    }
  };
  
  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    if (draggedStructure && isValidPlacement(slotIndex, draggedStructure)) {
      buildStructure(draggedStructure, slotIndex);
    }
    setDraggedStructure(null);
    setDragOverSlot(null);
  };
  
  // Calculate built structures for display
  const builtStructures = useMemo(() => {
    const buildings = [];
    const processed = new Set();
    
    (settlement.structures || []).forEach((structureId, index) => {
      if (!structureId || structureId.endsWith('_part') || processed.has(index)) return;
      
      const structure = getStructureById(structureId);
      if (!structure) return;
      
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const lots = structure.lots || 1;
      
      buildings.push({
        structure,
        slotIndex: index,
        row,
        col,
        width: lots === 4 ? 2 : lots === 2 ? 2 : 1,
        height: lots === 4 ? 2 : 1,
      });
      
      // Mark slots as processed
      processed.add(index);
      if (lots >= 2) processed.add(index + 1);
      if (lots === 4) {
        processed.add(index + gridSize);
        processed.add(index + gridSize + 1);
      }
    });
    
    return buildings;
  }, [settlement.structures, gridSize]);
  
  // Cost display
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

  const usedLots = builtStructures.reduce((acc, b) => acc + (b.structure.lots || 1), 0);

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Building Palette */}
      <div className="w-64 flex flex-col glass-card">
        <div className="p-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Buildings
          </h3>
          
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
        
        {/* Resources */}
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
                  <div className="w-10 h-10 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                    {image ? (
                      <img src={image} alt={structure.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-lg">
                        🏠
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs text-yellow-400 truncate">{structure.name}</span>
                      <span className="text-[10px] bg-gray-700 px-1 rounded flex-shrink-0">L{structure.level}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {structure.lots > 1 ? `${structure.lots} lots` : '1 lot'}
                      {structure.requiresWater && <span className="ml-1 text-blue-400">🌊</span>}
                    </div>
                    <div className="text-[10px] mt-0.5">{getCostDisplay(structure)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Settlement Map */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="glass-card p-3 mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 flex items-center gap-2">
              {settlement.name}
              {settlement.isCapital && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Capital</span>
              )}
            </h3>
            <div className="text-sm text-gray-400">
              {settlementInfo.type} • {usedLots}/{totalLots} lots
              {settlement.mapConfig?.waterfront && settlement.mapConfig.waterfront !== 'none' && (
                <span className="ml-2 text-blue-400">• {settlement.mapConfig.waterfront} waterfront</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Grid toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded transition-colors ${showGrid ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              title={showGrid ? 'Hide grid' : 'Show grid'}
            >
              {showGrid ? <Grid className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            
            {/* Zoom controls */}
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-2 rounded bg-gray-800 text-gray-400 hover:bg-gray-700"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              className="p-2 rounded bg-gray-800 text-gray-400 hover:bg-gray-700"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Map Area */}
        <div className="flex-1 glass-card overflow-auto relative">
          {/* Terrain Background */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, #2d4a2d 0%, #3d5a3d 25%, #2d4a2d 50%, #3d5a3d 75%, #2d4a2d 100%),
                repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(0,0,0,0.05) 10px,
                  rgba(0,0,0,0.05) 20px
                )
              `,
              backgroundSize: '200px 200px, 28px 28px',
            }}
          />
          
          {/* Waterfront indicator */}
          {settlement.mapConfig?.waterfront && settlement.mapConfig.waterfront !== 'none' && (
            <div 
              className={`absolute bg-gradient-to-t from-blue-500/40 to-transparent pointer-events-none ${
                settlement.mapConfig.waterfront === 'south' ? 'bottom-0 left-0 right-0 h-20' :
                settlement.mapConfig.waterfront === 'north' ? 'top-0 left-0 right-0 h-20 rotate-180' :
                settlement.mapConfig.waterfront === 'east' ? 'top-0 right-0 bottom-0 w-20' :
                'top-0 left-0 bottom-0 w-20'
              }`}
              style={{ zIndex: 1 }}
            />
          )}
          
          {/* Grid and Buildings Container */}
          <div 
            className="relative p-4"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: gridSize * LOT_SIZE + 32,
              height: gridSize * LOT_SIZE + 32,
            }}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <div 
                className="absolute inset-4 pointer-events-none"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridSize}, ${LOT_SIZE}px)`,
                  gridTemplateRows: `repeat(${gridSize}, ${LOT_SIZE}px)`,
                  zIndex: 10,
                }}
              >
                {Array(totalLots).fill(null).map((_, i) => {
                  const structureId = settlement.structures?.[i];
                  const isPart = structureId?.endsWith?.('_part');
                  const isOccupied = structureId && !isPart;
                  const isValidDrop = draggedStructure && isValidPlacement(i, draggedStructure);
                  const isDragOver = dragOverSlot === i;
                  
                  return (
                    <div
                      key={i}
                      className={`
                        border border-white/20 transition-all pointer-events-auto
                        ${!structureId && !isPart ? 'hover:bg-white/10' : ''}
                        ${isDragOver && isValidDrop ? 'bg-green-500/30 border-green-500' : ''}
                        ${draggedStructure && !isDragOver && isValidDrop ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                        ${isPart ? 'bg-transparent border-transparent' : ''}
                      `}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => handleDrop(e, i)}
                    >
                      {/* Empty slot indicator */}
                      {!structureId && !isPart && !draggedStructure && (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Drop zones when grid is hidden */}
            {!showGrid && draggedStructure && (
              <div 
                className="absolute inset-4"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridSize}, ${LOT_SIZE}px)`,
                  gridTemplateRows: `repeat(${gridSize}, ${LOT_SIZE}px)`,
                  zIndex: 10,
                }}
              >
                {Array(totalLots).fill(null).map((_, i) => {
                  const isValidDrop = isValidPlacement(i, draggedStructure);
                  const isDragOver = dragOverSlot === i;
                  
                  return (
                    <div
                      key={i}
                      className={`
                        border border-dashed transition-all
                        ${isValidDrop ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-transparent'}
                        ${isDragOver && isValidDrop ? 'bg-green-500/30 border-green-500' : ''}
                      `}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => handleDrop(e, i)}
                    />
                  );
                })}
              </div>
            )}
            
            {/* Buildings Layer */}
            <div className="absolute inset-4" style={{ zIndex: 20 }}>
              {builtStructures.map((building) => {
                const image = BUILDING_IMAGES[building.structure.id];
                
                return (
                  <div
                    key={building.slotIndex}
                    className="absolute group transition-transform hover:scale-105"
                    style={{
                      left: building.col * LOT_SIZE,
                      top: building.row * LOT_SIZE,
                      width: building.width * LOT_SIZE,
                      height: building.height * LOT_SIZE,
                    }}
                  >
                    {/* Building Image */}
                    <div className="w-full h-full p-1">
                      {image ? (
                        <img 
                          src={image} 
                          alt={building.structure.name}
                          className="w-full h-full object-contain drop-shadow-lg"
                          style={{ 
                            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))',
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg flex items-center justify-center shadow-lg border-2 border-amber-600">
                          <span className="text-2xl">🏠</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Building name tooltip */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {building.structure.name}
                    </div>
                    
                    {/* Demolish button */}
                    <button
                      onClick={() => demolishStructure(building.slotIndex)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="text-center text-gray-500 text-xs mt-2">
          {draggedStructure ? (
            <span className="text-yellow-400 animate-pulse">Drop "{draggedStructure.name}" on the map</span>
          ) : (
            <span>Drag buildings from the palette • Toggle grid with <Grid className="w-3 h-3 inline" /></span>
          )}
        </div>
      </div>
      
      {/* Building Info Panel */}
      {builtStructures.length > 0 && (
        <div className="w-48 glass-card p-3 flex flex-col">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-1">
            <Info className="w-4 h-4" />
            Built ({builtStructures.length})
          </h4>
          
          <div className="flex-1 overflow-y-auto space-y-2 text-xs">
            {builtStructures.map((building) => (
              <div key={building.slotIndex} className="p-2 bg-white/5 rounded">
                <div className="font-medium text-purple-400">{building.structure.name}</div>
                {building.structure.effects && (
                  <div className="text-gray-400 mt-1">{building.structure.effects}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
