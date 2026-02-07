import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, X, Hammer, Search, LayoutGrid, Eye, EyeOff,
  Trash2, Info, ZoomIn, ZoomOut, TreePine
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

const BASE = import.meta.env.BASE_URL || '/';
const BUILDING_IMAGES = {
  'houses': `${BASE}assets/buildings/cottage-1.jpg`,
  'inn': `${BASE}assets/buildings/inn-1.jpg`,
  'tavern': `${BASE}assets/buildings/inn-2.jpg`,
  'temple': `${BASE}assets/buildings/temple-1.jpg`,
  'shrine': `${BASE}assets/buildings/temple-2.jpg`,
  'granary': `${BASE}assets/buildings/cottage-2.jpg`,
};

// Settlement map dimensions
const MAP_WIDTH = 600;
const MAP_HEIGHT = 500;

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
  const lotWidth = MAP_WIDTH / config.cols;
  const lotHeight = MAP_HEIGHT / config.rows;
  
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

  // Generate decorative trees
  const trees = useMemo(() => {
    const t = [];
    for (let i = 0; i < 12; i++) {
      t.push({
        x: Math.random() * MAP_WIDTH,
        y: Math.random() * MAP_HEIGHT,
        size: 20 + Math.random() * 15,
        opacity: 0.3 + Math.random() * 0.3,
      });
    }
    return t;
  }, []);

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
        
        {/* Map Container */}
        <div className="flex-1 rounded-lg overflow-hidden relative" style={{ background: 'linear-gradient(180deg, #1a2f1a 0%, #243524 100%)' }}>
          <div className="absolute inset-0 overflow-auto p-4">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: MAP_WIDTH, height: MAP_HEIGHT }} className="relative">
              
              {/* Terrain Layer - grass texture */}
              <div className="absolute inset-0 rounded-lg overflow-hidden" style={{
                background: `
                  radial-gradient(ellipse at 30% 20%, rgba(60,90,40,0.6) 0%, transparent 50%),
                  radial-gradient(ellipse at 70% 80%, rgba(50,80,35,0.5) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 50%, rgba(70,100,50,0.4) 0%, transparent 60%),
                  linear-gradient(180deg, #3d5c3d 0%, #4a6b4a 50%, #3d5c3d 100%)
                `,
              }}>
                {/* Dirt paths - connecting roads */}
                <svg className="absolute inset-0 w-full h-full opacity-40">
                  <defs>
                    <pattern id="dirt" patternUnits="userSpaceOnUse" width="20" height="20">
                      <rect width="20" height="20" fill="#8B7355"/>
                      <circle cx="5" cy="5" r="2" fill="#7a6548" opacity="0.5"/>
                      <circle cx="15" cy="12" r="1.5" fill="#9c8462" opacity="0.3"/>
                    </pattern>
                  </defs>
                  {/* Main road */}
                  <path d={`M 0 ${MAP_HEIGHT/2} L ${MAP_WIDTH} ${MAP_HEIGHT/2}`} stroke="url(#dirt)" strokeWidth="20" fill="none" opacity="0.6"/>
                  <path d={`M ${MAP_WIDTH/2} 0 L ${MAP_WIDTH/2} ${MAP_HEIGHT}`} stroke="url(#dirt)" strokeWidth="15" fill="none" opacity="0.5"/>
                </svg>
              </div>
              
              {/* Decorative Trees */}
              {trees.map((t, i) => (
                <div key={i} className="absolute pointer-events-none text-green-800" 
                  style={{ left: t.x, top: t.y, fontSize: t.size, opacity: t.opacity, transform: 'translate(-50%, -50%)' }}>
                  🌲
                </div>
              ))}
              
              {/* Waterfront */}
              {settlement.mapConfig?.waterfront && settlement.mapConfig.waterfront !== 'none' && (
                <div className={`absolute pointer-events-none ${
                  settlement.mapConfig.waterfront === 'south' ? 'bottom-0 left-0 right-0 h-16' :
                  settlement.mapConfig.waterfront === 'north' ? 'top-0 left-0 right-0 h-16' :
                  settlement.mapConfig.waterfront === 'east' ? 'top-0 right-0 bottom-0 w-16' :
                  'top-0 left-0 bottom-0 w-16'
                }`} style={{
                  background: settlement.mapConfig.waterfront === 'south' || settlement.mapConfig.waterfront === 'north'
                    ? 'linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.5))'
                    : 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5))',
                }} />
              )}
              
              {/* Grid Overlay - very subtle */}
              {showGrid && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
                  {Array(config.cols + 1).fill(0).map((_, i) => (
                    <line key={`v${i}`} x1={i * lotWidth} y1={0} x2={i * lotWidth} y2={MAP_HEIGHT}
                      stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                  {Array(config.rows + 1).fill(0).map((_, i) => (
                    <line key={`h${i}`} x1={0} y1={i * lotHeight} x2={MAP_WIDTH} y2={i * lotHeight}
                      stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
                  ))}
                </svg>
              )}
              
              {/* Drop Zones */}
              <div className="absolute inset-0" style={{ zIndex: 10 }}>
                {Array(config.maxLots).fill(null).map((_, i) => {
                  const col = i % config.cols;
                  const row = Math.floor(i / config.cols);
                  const isValid = draggedStructure && isValidPlacement(i, draggedStructure);
                  const isDragOver = dragOverSlot === i;
                  const isOccupied = settlement.structures?.[i];
                  
                  return (
                    <div key={i} className={`absolute transition-all ${isOccupied ? 'pointer-events-none' : ''}`}
                      style={{ left: col * lotWidth, top: row * lotHeight, width: lotWidth, height: lotHeight }}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragLeave={() => setDragOverSlot(null)}
                      onDrop={(e) => handleDrop(e, i)}>
                      {draggedStructure && isValid && (
                        <div className={`absolute inset-1 rounded transition-all ${isDragOver ? 'bg-green-500/40 border-2 border-green-400' : 'bg-yellow-500/20 border border-yellow-500/30'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Buildings Layer */}
              <div className="absolute inset-0" style={{ zIndex: 20 }}>
                {buildings.map((b) => {
                  const img = BUILDING_IMAGES[b.structure.id];
                  const x = b.col * lotWidth;
                  const y = b.row * lotHeight;
                  const w = b.width * lotWidth;
                  const h = b.height * lotHeight;
                  
                  return (
                    <div key={b.slotIndex} className="absolute group" style={{ left: x + 4, top: y + 4, width: w - 8, height: h - 8 }}>
                      {img ? (
                        <img src={img} alt={b.structure.name} className="w-full h-full object-contain drop-shadow-xl" 
                          style={{ filter: 'drop-shadow(3px 5px 8px rgba(0,0,0,0.6))' }} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg flex items-center justify-center shadow-xl border-2 border-amber-500">
                          <span className="text-3xl">🏠</span>
                        </div>
                      )}
                      
                      {/* Name tooltip */}
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-30">
                        {b.structure.name}
                      </div>
                      
                      {/* Demolish */}
                      <button onClick={() => demolishStructure(b.slotIndex)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-500 shadow-lg z-30">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Drag indicator */}
          {draggedStructure && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-yellow-400 text-xs px-3 py-1 rounded-full">
              Drop "{draggedStructure.name}" on highlighted area
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
