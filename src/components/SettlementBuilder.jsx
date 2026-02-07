import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, X, Hammer, Search, LayoutGrid, 
  Trash2, Info, ZoomIn, ZoomOut
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

const BASE = import.meta.env.BASE_URL || '/';
const BUILDING_IMAGES = {
  'houses': `${BASE}assets/buildings/cottage-1.png`,
  'inn': `${BASE}assets/buildings/inn-1.png`,
  'tavern': `${BASE}assets/buildings/inn-2.png`,
  'temple': `${BASE}assets/buildings/temple-1.png`,
  'shrine': `${BASE}assets/buildings/temple-2.png`,
  'granary': `${BASE}assets/buildings/cottage-2.png`,
};

// Settlement map dimensions - isometric grid
const TILE_SIZE = 100; // Base tile size before transform
const ISO_ANGLE = 60; // Tilt angle in degrees
const ISO_ROTATION = 45; // Rotation to make diamonds

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
  
  // Settlement config
  const getSettlementConfig = (blocks) => {
    if (blocks <= 4) return { type: 'Village', maxLots: 16, cols: 4, rows: 4 };
    if (blocks <= 8) return { type: 'Town', maxLots: 32, cols: 8, rows: 4 };
    if (blocks <= 16) return { type: 'City', maxLots: 64, cols: 8, rows: 8 };
    return { type: 'Metropolis', maxLots: 144, cols: 12, rows: 12 };
  };
  
  const config = getSettlementConfig(settlement.blocks || 1);
  
  // Isometric grid dimensions
  const gridWidth = config.cols * TILE_SIZE;
  const gridHeight = config.rows * TILE_SIZE;
  // After transform, we need more container space
  const containerWidth = (config.cols + config.rows) * TILE_SIZE * 0.7;
  const containerHeight = (config.cols + config.rows) * TILE_SIZE * 0.5;
  
  // Get available structures
  const availableStructures = useMemo(() => {
    let structures = getStructuresByLevel(kingdomLevel);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      structures = structures.filter(s => s.name.toLowerCase().includes(q) || s.effects?.toLowerCase().includes(q));
    }
    if (filterLevel !== null) {
      structures = structures.filter(s => s.level === filterLevel);
    }
    return structures.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [kingdomLevel, searchQuery, filterLevel]);
  
  const canAfford = useCallback((structure) => {
    const cost = structure.cost || {};
    if (cost.rp && currentRP < cost.rp) return false;
    if (cost.lumber && (state.resources?.lumber || 0) < cost.lumber) return false;
    if (cost.stone && (state.resources?.stone || 0) < cost.stone) return false;
    if (cost.ore && (state.resources?.ore || 0) < cost.ore) return false;
    if (cost.luxuries && (state.resources?.luxuries || 0) < cost.luxuries) return false;
    return true;
  }, [currentRP, state.resources]);
  
  const isValidPlacement = useCallback((slotIndex, structure) => {
    if (!structure || slotIndex >= config.maxLots) return false;
    if (settlement.structures?.[slotIndex]) return false;
    
    const lots = structure.lots || 1;
    const col = slotIndex % config.cols;
    const row = Math.floor(slotIndex / config.cols);
    
    if (lots === 2 && col + 2 > config.cols) return false;
    if (lots === 4 && (col + 2 > config.cols || row + 2 > config.rows)) return false;
    
    // Check all required slots are free
    if (lots >= 2 && settlement.structures?.[slotIndex + 1]) return false;
    if (lots === 4) {
      if (settlement.structures?.[slotIndex + config.cols]) return false;
      if (settlement.structures?.[slotIndex + config.cols + 1]) return false;
    }
    
    // Waterfront check
    if (structure.requiresWater) {
      const waterfront = settlement.mapConfig?.waterfront || 'none';
      const isWaterSlot = 
        (waterfront === 'south' && row === config.rows - 1) ||
        (waterfront === 'north' && row === 0) ||
        (waterfront === 'east' && col === config.cols - 1) ||
        (waterfront === 'west' && col === 0);
      if (!isWaterSlot) return false;
    }
    
    return true;
  }, [settlement, config]);
  
  const buildStructure = useCallback((structure, slotIndex) => {
    if (!canAfford(structure) || !isValidPlacement(slotIndex, structure)) return;
    
    const cost = structure.cost || {};
    const newResources = { ...state.resources };
    Object.entries(cost).forEach(([k, v]) => { if (newResources[k]) newResources[k] -= v; });
    
    const newStructures = [...(settlement.structures || [])];
    const lots = structure.lots || 1;
    
    newStructures[slotIndex] = structure.id;
    if (lots >= 2) newStructures[slotIndex + 1] = `${structure.id}_part`;
    if (lots === 4) {
      newStructures[slotIndex + config.cols] = `${structure.id}_part`;
      newStructures[slotIndex + config.cols + 1] = `${structure.id}_part`;
    }
    
    onUpdateSettlement({ ...settlement, structures: newStructures }, newResources);
    onLog?.(`Built ${structure.name} in ${settlement.name}`, 'success');
  }, [settlement, state.resources, canAfford, isValidPlacement, onUpdateSettlement, onLog, config]);
  
  const demolishStructure = useCallback((slotIndex) => {
    const structureId = settlement.structures?.[slotIndex];
    if (!structureId || structureId.endsWith('_part')) return;
    
    const structure = getStructureById(structureId);
    const newStructures = [...(settlement.structures || [])];
    const lots = structure?.lots || 1;
    
    newStructures[slotIndex] = null;
    if (lots >= 2) newStructures[slotIndex + 1] = null;
    if (lots === 4) {
      newStructures[slotIndex + config.cols] = null;
      newStructures[slotIndex + config.cols + 1] = null;
    }
    
    onUpdateSettlement({ ...settlement, structures: newStructures }, state.resources);
    onLog?.(`Demolished ${structure?.name}`, 'info');
  }, [settlement, state.resources, onUpdateSettlement, onLog, config]);
  
  // Drag handlers
  const handleDragStart = (e, structure) => {
    if (!canAfford(structure)) { e.preventDefault(); return; }
    setDraggedStructure(structure);
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const handleDragEnd = () => { setDraggedStructure(null); setDragOverSlot(null); };
  
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
    handleDragEnd();
  };
  
  // Build building data for rendering
  const buildings = useMemo(() => {
    const result = [];
    const processed = new Set();
    
    (settlement.structures || []).forEach((id, i) => {
      if (!id || id.endsWith('_part') || processed.has(i)) return;
      const structure = getStructureById(id);
      if (!structure) return;
      
      const col = i % config.cols;
      const row = Math.floor(i / config.cols);
      const lots = structure.lots || 1;
      
      result.push({
        structure, slotIndex: i, col, row,
        width: lots >= 2 ? 2 : 1,
        height: lots === 4 ? 2 : 1,
      });
      
      processed.add(i);
      if (lots >= 2) processed.add(i + 1);
      if (lots === 4) { processed.add(i + config.cols); processed.add(i + config.cols + 1); }
    });
    
    return result;
  }, [settlement.structures, config]);
  
  const usedLots = buildings.reduce((a, b) => a + (b.structure.lots || 1), 0);

  const getCostDisplay = (structure) => {
    const cost = structure.cost || {};
    const parts = [];
    if (cost.rp) parts.push(<span key="rp" className={currentRP >= cost.rp ? 'text-yellow-400' : 'text-red-400'}>{cost.rp} RP</span>);
    if (cost.lumber) parts.push(<span key="l" className={(state.resources?.lumber||0) >= cost.lumber ? 'text-green-400' : 'text-red-400'}>{cost.lumber}🪵</span>);
    if (cost.stone) parts.push(<span key="s" className={(state.resources?.stone||0) >= cost.stone ? 'text-gray-300' : 'text-red-400'}>{cost.stone}🪨</span>);
    if (cost.ore) parts.push(<span key="o" className={(state.resources?.ore||0) >= cost.ore ? 'text-orange-400' : 'text-red-400'}>{cost.ore}⛏️</span>);
    if (cost.luxuries) parts.push(<span key="x" className={(state.resources?.luxuries||0) >= cost.luxuries ? 'text-pink-400' : 'text-red-400'}>{cost.luxuries}💎</span>);
    return parts.length ? parts.reduce((a,p,i) => [...a, i?' ':'', p], []) : <span className="text-green-400">Free</span>;
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Building Palette */}
      <div className="w-56 flex flex-col glass-card overflow-hidden">
        <div className="p-2 border-b border-white/10">
          <h3 className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
            <Hammer className="w-3 h-3" /> Buildings
          </h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..." className="w-full bg-gray-800 border border-gray-700 rounded pl-7 pr-2 py-1 text-xs" />
          </div>
          <div className="flex gap-1 mt-1">
            {[null, 1, 2, 3].map(l => (
              <button key={l ?? 'all'} onClick={() => setFilterLevel(l)}
                disabled={l !== null && l > kingdomLevel}
                className={`flex-1 px-1 py-0.5 rounded text-[10px] ${filterLevel === l ? 'bg-yellow-500/20 text-yellow-400' : l && l > kingdomLevel ? 'bg-gray-800 text-gray-600' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {l ? `L${l}` : 'All'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-2 py-1 bg-gray-800/50 text-[10px] flex flex-wrap gap-1 border-b border-white/10">
          <span className="text-yellow-400">{currentRP}RP</span>
          <span className="text-green-400">{state.resources?.lumber||0}🪵</span>
          <span className="text-gray-300">{state.resources?.stone||0}🪨</span>
          <span className="text-orange-400">{state.resources?.ore||0}⛏️</span>
          <span className="text-pink-400">{state.resources?.luxuries||0}💎</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {availableStructures.map(s => {
            const affordable = canAfford(s);
            const img = BUILDING_IMAGES[s.id];
            return (
              <div key={s.id} draggable={affordable} onDragStart={(e) => handleDragStart(e, s)} onDragEnd={handleDragEnd}
                className={`p-1.5 rounded border transition-all flex gap-2 ${affordable ? 'bg-white/5 border-white/10 hover:border-yellow-500/50 cursor-grab' : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'}`}>
                <div className="w-8 h-8 rounded bg-gray-700 flex-shrink-0 overflow-hidden">
                  {img ? <img src={img} alt={s.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🏠</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[10px] text-yellow-400 truncate">{s.name}</span>
                    <span className="text-[8px] bg-gray-700 px-0.5 rounded">L{s.level}</span>
                  </div>
                  <div className="text-[9px] text-gray-500">{s.lots>1?`${s.lots} lots`:'1 lot'}{s.requiresWater && ' 🌊'}</div>
                  <div className="text-[9px]">{getCostDisplay(s)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Settlement Map */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <div>
            <h3 className="text-base font-semibold text-yellow-400">{settlement.name}
              {settlement.isCapital && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">Capital</span>}
            </h3>
            <div className="text-xs text-gray-400">
              {config.type} • {usedLots}/{config.maxLots} lots
              {settlement.mapConfig?.waterfront !== 'none' && ` • ${settlement.mapConfig?.waterfront} waterfront`}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded text-xs ${showGrid ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-800 text-gray-400'}`} title="Toggle grid">
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.5, z-0.25))} className="p-1.5 rounded bg-gray-800 text-gray-400"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[10px] text-gray-400 w-8 text-center">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z+0.25))} className="p-1.5 rounded bg-gray-800 text-gray-400"><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>
        
        {/* Map Container - Isometric View */}
        <div className="flex-1 rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(180deg, #0a1a0a 0%, #1a2f1a 100%)' }}>
          <div className="absolute inset-0 overflow-auto flex items-center justify-center" style={{ perspective: '1000px' }}>
            <div 
              className="relative"
              style={{ 
                transform: `scale(${zoom}) rotateX(${ISO_ANGLE}deg) rotateZ(${ISO_ROTATION}deg)`,
                transformStyle: 'preserve-3d',
                width: gridWidth,
                height: gridHeight,
              }}
            >
              {/* Isometric Grid Tiles */}
              {Array(config.maxLots).fill(null).map((_, i) => {
                const col = i % config.cols;
                const row = Math.floor(i / config.cols);
                const isValid = draggedStructure && isValidPlacement(i, draggedStructure);
                const isDragOver = dragOverSlot === i;
                const isOccupied = settlement.structures?.[i];
                
                // Waterfront edge detection
                const waterfront = settlement.mapConfig?.waterfront || 'none';
                const isWaterEdge = 
                  (waterfront === 'south' && row === config.rows - 1) ||
                  (waterfront === 'north' && row === 0) ||
                  (waterfront === 'east' && col === config.cols - 1) ||
                  (waterfront === 'west' && col === 0);
                
                // Grass color variation based on position
                const grassHue = 120 + ((col * 3 + row * 7) % 20) - 10;
                const grassLight = 25 + ((col * 5 + row * 3) % 10);
                
                return (
                  <div 
                    key={i}
                    className={`absolute transition-all border border-black/30 ${isOccupied ? 'pointer-events-none' : 'cursor-pointer hover:brightness-110'}`}
                    style={{ 
                      left: col * TILE_SIZE, 
                      top: row * TILE_SIZE, 
                      width: TILE_SIZE, 
                      height: TILE_SIZE,
                      background: isWaterEdge 
                        ? `linear-gradient(135deg, hsl(200, 60%, 35%) 0%, hsl(210, 70%, 25%) 100%)`
                        : `linear-gradient(135deg, hsl(${grassHue}, 40%, ${grassLight}%) 0%, hsl(${grassHue}, 45%, ${grassLight - 5}%) 100%)`,
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                    }}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragLeave={() => setDragOverSlot(null)}
                    onDrop={(e) => handleDrop(e, i)}
                  >
                    {/* Grid lines */}
                    {showGrid && (
                      <div className="absolute inset-0 border border-white/10" />
                    )}
                    
                    {/* Valid drop highlight */}
                    {draggedStructure && isValid && (
                      <div className={`absolute inset-0 transition-all ${isDragOver ? 'bg-green-400/50 border-2 border-green-300' : 'bg-yellow-400/30'}`} />
                    )}
                    
                    {/* Water wave effect */}
                    {isWaterEdge && (
                      <div className="absolute inset-0 overflow-hidden opacity-30">
                        <div className="absolute inset-0 animate-pulse" style={{
                          background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Buildings Layer - stay on the isometric plane, just lifted */}
              {buildings.map((b) => {
                const img = BUILDING_IMAGES[b.structure.id];
                const x = b.col * TILE_SIZE;
                const y = b.row * TILE_SIZE;
                const w = b.width * TILE_SIZE;
                const h = b.height * TILE_SIZE;
                
                return (
                  <div 
                    key={b.slotIndex} 
                    className="absolute group pointer-events-auto"
                    style={{ 
                      left: x + TILE_SIZE * 0.1, 
                      top: y - TILE_SIZE * 0.3, // Shift up to appear "on" the tile
                      width: w * 0.8,
                      height: h * 1.3, // Taller to show building properly
                    }}
                  >
                    {img ? (
                      <img 
                        src={img} 
                        alt={b.structure.name} 
                        className="w-full h-full object-contain"
                        style={{ 
                          filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.8))',
                        }} 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-amber-600 to-amber-800 rounded flex items-center justify-center shadow-xl border-2 border-amber-500">
                        <span className="text-3xl">🏠</span>
                      </div>
                    )}
                    
                    {/* Name tooltip */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 bg-black/95 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
                      style={{ 
                        bottom: '100%', 
                        marginBottom: 4,
                        transform: `translateX(-50%) rotateZ(-${ISO_ROTATION}deg) rotateX(-${ISO_ANGLE}deg)`,
                      }}
                    >
                      {b.structure.name}
                    </div>
                    
                    {/* Demolish button */}
                    <button 
                      onClick={() => demolishStructure(b.slotIndex)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-500 shadow-lg z-50"
                      style={{
                        transform: `rotateZ(-${ISO_ROTATION}deg) rotateX(-${ISO_ANGLE}deg)`,
                      }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Drag indicator */}
          {draggedStructure && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 text-yellow-400 text-sm px-4 py-2 rounded-full shadow-lg">
              Drop "{draggedStructure.name}" on highlighted tile
            </div>
          )}
        </div>
      </div>
      
      {/* Info Panel */}
      {buildings.length > 0 && (
        <div className="w-44 glass-card p-2 flex flex-col overflow-hidden">
          <h4 className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Built ({buildings.length})
          </h4>
          <div className="flex-1 overflow-y-auto space-y-1 text-[10px]">
            {buildings.map((b) => (
              <div key={b.slotIndex} className="p-1.5 bg-white/5 rounded">
                <div className="font-medium text-purple-400">{b.structure.name}</div>
                {b.structure.effects && <div className="text-gray-400 mt-0.5">{b.structure.effects}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
