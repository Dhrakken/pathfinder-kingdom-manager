import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  X, Hammer, Search, LayoutGrid, 
  Info, ZoomIn, ZoomOut
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

// ── Isometric math ──────────────────────────────────────────────
const TILE_W = 96;   // Diamond width
const TILE_H = 48;   // Diamond height (half width = true isometric)

// Convert grid (col, row) → screen (px, py) for the top-center of the diamond
function gridToScreen(col, row, cols) {
  const px = (col - row) * (TILE_W / 2) + (cols * TILE_W / 2);
  const py = (col + row) * (TILE_H / 2) + 20; // 20px top padding
  return { px, py };
}

// Diamond SVG path for a single tile
function diamondPath(cx, cy) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  return `M ${cx} ${cy - hh} L ${cx + hw} ${cy} L ${cx} ${cy + hh} L ${cx - hw} ${cy} Z`;
}

// ── Component ───────────────────────────────────────────────────
export default function SettlementBuilder({ 
  settlement, 
  state, 
  onUpdateSettlement,
  onLog 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  const [draggedStructure, setDraggedStructure] = useState(null);
  const [hoverSlot, setHoverSlot] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);
  
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
  
  // SVG canvas size
  const svgWidth = (config.cols + config.rows) * (TILE_W / 2) + TILE_W;
  const svgHeight = (config.cols + config.rows) * (TILE_H / 2) + TILE_H + 80; // extra for buildings poking up
  
  // ── Structures ────────────────────────────────────────────────
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
    
    if (lots >= 2 && settlement.structures?.[slotIndex + 1]) return false;
    if (lots === 4) {
      if (settlement.structures?.[slotIndex + config.cols]) return false;
      if (settlement.structures?.[slotIndex + config.cols + 1]) return false;
    }
    
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
  
  // ── Drag handlers ─────────────────────────────────────────────
  const handleDragStart = (e, structure) => {
    if (!canAfford(structure)) { e.preventDefault(); return; }
    setDraggedStructure(structure);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', structure.id);
  };
  
  const handleDragEnd = () => { setDraggedStructure(null); setHoverSlot(null); };
  
  // Convert mouse position to grid slot
  const screenToGrid = useCallback((clientX, clientY) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const scale = zoom;
    const mx = (clientX - rect.left) / scale;
    const my = (clientY - rect.top) / scale;
    
    // Reverse isometric transform
    const offsetX = config.cols * TILE_W / 2;
    const offsetY = 20;
    const ax = mx - offsetX;
    const ay = my - offsetY;
    
    const col = Math.floor((ax / (TILE_W / 2) + ay / (TILE_H / 2)) / 2);
    const row = Math.floor((ay / (TILE_H / 2) - ax / (TILE_W / 2)) / 2);
    
    if (col < 0 || col >= config.cols || row < 0 || row >= config.rows) return null;
    return row * config.cols + col;
  }, [config, zoom]);
  
  const handleSvgDragOver = useCallback((e) => {
    e.preventDefault();
    const slot = screenToGrid(e.clientX, e.clientY);
    if (slot !== null && draggedStructure && isValidPlacement(slot, draggedStructure)) {
      e.dataTransfer.dropEffect = 'copy';
      setHoverSlot(slot);
    } else {
      setHoverSlot(null);
    }
  }, [screenToGrid, draggedStructure, isValidPlacement]);
  
  const handleSvgDrop = useCallback((e) => {
    e.preventDefault();
    const slot = screenToGrid(e.clientX, e.clientY);
    if (slot !== null && draggedStructure && isValidPlacement(slot, draggedStructure)) {
      buildStructure(draggedStructure, slot);
    }
    handleDragEnd();
  }, [screenToGrid, draggedStructure, isValidPlacement, buildStructure]);
  
  // ── Build tile + building data ────────────────────────────────
  const tiles = useMemo(() => {
    const waterfront = settlement.mapConfig?.waterfront || 'none';
    return Array(config.maxLots).fill(null).map((_, i) => {
      const col = i % config.cols;
      const row = Math.floor(i / config.cols);
      const { px, py } = gridToScreen(col, row, config.cols);
      const isWater = 
        (waterfront === 'south' && row === config.rows - 1) ||
        (waterfront === 'north' && row === 0) ||
        (waterfront === 'east' && col === config.cols - 1) ||
        (waterfront === 'west' && col === 0);
      const structureId = settlement.structures?.[i];
      const isOccupied = !!structureId;
      const isPart = structureId?.endsWith('_part');
      return { i, col, row, px, py, isWater, isOccupied, isPart, structureId };
    });
  }, [settlement, config]);
  
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
      const w = lots >= 2 ? 2 : 1;
      const h = lots === 4 ? 2 : 1;
      
      // Position building at center of its footprint
      const centerCol = col + (w - 1) / 2;
      const centerRow = row + (h - 1) / 2;
      const { px, py } = gridToScreen(centerCol, centerRow, config.cols);
      
      result.push({ structure, slotIndex: i, col, row, w, h, px, py, lots });
      
      processed.add(i);
      if (lots >= 2) processed.add(i + 1);
      if (lots === 4) { processed.add(i + config.cols); processed.add(i + config.cols + 1); }
    });
    
    // Sort by py for proper depth (back to front)
    result.sort((a, b) => a.py - b.py);
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

  // ── Tile colors ───────────────────────────────────────────────
  const getTileColor = (tile) => {
    if (tile.isWater) return '#2a6496';
    // Grass variation
    const seed = (tile.col * 7 + tile.row * 13) % 5;
    const greens = ['#4a7a3b', '#527f42', '#486e38', '#5a8a48', '#4f7540'];
    return greens[seed];
  };
  
  const getTileStroke = (tile) => {
    if (tile.isWater) return '#1d4e78';
    return '#3a5e2e';
  };

  return (
    <div className="flex gap-4 h-[650px]">
      {/* ── Building Palette ─────────────────────────────────── */}
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
                className={`p-1.5 rounded border transition-all flex gap-2 ${affordable ? 'bg-white/5 border-white/10 hover:border-yellow-500/50 cursor-grab active:cursor-grabbing' : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'}`}>
                <div className="w-10 h-10 rounded bg-gray-700/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {img ? <img src={img} alt={s.name} className="w-full h-full object-contain" /> : <span className="text-lg">🏠</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-[11px] text-yellow-400 truncate">{s.name}</span>
                    <span className="text-[9px] bg-gray-700 px-1 rounded">L{s.level}</span>
                  </div>
                  <div className="text-[9px] text-gray-500">{s.lots>1?`${s.lots} lots`:'1 lot'}{s.requiresWater && ' 🌊'}</div>
                  <div className="text-[9px]">{getCostDisplay(s)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ── Isometric Map ────────────────────────────────────── */}
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
            <button onClick={() => setZoom(z => Math.max(0.5, z-0.25))} className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[10px] text-gray-400 w-8 text-center">{Math.round(zoom*100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z+0.25))} className="p-1.5 rounded bg-gray-800 text-gray-400 hover:bg-gray-700"><ZoomIn className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="flex-1 rounded-lg overflow-auto relative" 
          style={{ background: 'radial-gradient(ellipse at center, #1a2e1a 0%, #0d1a0d 100%)' }}>
          <div className="min-w-full min-h-full flex items-center justify-center p-4">
            <svg
              ref={svgRef}
              width={svgWidth * zoom}
              height={svgHeight * zoom}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onDragOver={handleSvgDragOver}
              onDragLeave={() => setHoverSlot(null)}
              onDrop={handleSvgDrop}
              className="select-none"
            >
              <defs>
                {/* Water shimmer */}
                <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2a6496" />
                  <stop offset="50%" stopColor="#3a7ab6" />
                  <stop offset="100%" stopColor="#2a6496" />
                </linearGradient>
                {/* Tile highlight for valid drop */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              {/* ── Ground tiles ──────────────────────────────── */}
              {tiles.map(tile => {
                const fill = getTileColor(tile);
                const stroke = getTileStroke(tile);
                const isHover = hoverSlot === tile.i;
                const isValidDrop = draggedStructure && isValidPlacement(tile.i, draggedStructure);
                
                return (
                  <g key={tile.i}>
                    {/* Base tile */}
                    <path
                      d={diamondPath(tile.px, tile.py)}
                      fill={tile.isWater ? 'url(#waterGrad)' : fill}
                      stroke={isHover ? '#4ade80' : (isValidDrop ? '#facc15' : stroke)}
                      strokeWidth={isHover ? 2.5 : (isValidDrop ? 1.5 : 0.8)}
                      opacity={showGrid ? 1 : 0.95}
                      filter={isHover ? 'url(#glow)' : undefined}
                      className="transition-colors"
                    />
                    {/* Hover highlight for valid drops */}
                    {isValidDrop && (
                      <path
                        d={diamondPath(tile.px, tile.py)}
                        fill={isHover ? 'rgba(74, 222, 128, 0.35)' : 'rgba(250, 204, 21, 0.15)'}
                        stroke="none"
                      />
                    )}
                    {/* Subtle grid lines */}
                    {showGrid && !tile.isOccupied && (
                      <path
                        d={diamondPath(tile.px, tile.py)}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="0.5"
                        strokeDasharray="3 3"
                      />
                    )}
                    {/* Water waves */}
                    {tile.isWater && (
                      <>
                        <line 
                          x1={tile.px - TILE_W * 0.25} y1={tile.py - 2}
                          x2={tile.px + TILE_W * 0.25} y2={tile.py - 2}
                          stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeLinecap="round"
                        />
                        <line 
                          x1={tile.px - TILE_W * 0.15} y1={tile.py + 5}
                          x2={tile.px + TILE_W * 0.15} y2={tile.py + 5}
                          stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" strokeLinecap="round"
                        />
                      </>
                    )}
                  </g>
                );
              })}
              
              {/* ── Buildings (rendered back-to-front) ────────── */}
              {buildings.map((b) => {
                const img = BUILDING_IMAGES[b.structure.id];
                // Building sprite: positioned above the tile center
                const bw = TILE_W * (b.w === 2 ? 1.6 : 0.85);
                const bh = bw * 1.2; // Buildings are taller than wide
                const bx = b.px - bw / 2;
                const by = b.py - bh + TILE_H * 0.3; // Anchor at bottom of building
                
                return (
                  <g key={b.slotIndex} className="cursor-pointer">
                    {/* Shadow under building */}
                    <ellipse
                      cx={b.px} cy={b.py + 2}
                      rx={bw * 0.35} ry={TILE_H * 0.25}
                      fill="rgba(0,0,0,0.3)"
                    />
                    
                    {/* Building image or fallback */}
                    {img ? (
                      <image
                        href={img}
                        x={bx} y={by}
                        width={bw} height={bh}
                        preserveAspectRatio="xMidYMax meet"
                      />
                    ) : (
                      <>
                        {/* Fallback: simple isometric box */}
                        <rect
                          x={b.px - 20} y={b.py - 35}
                          width={40} height={35}
                          rx={3}
                          fill="url(#waterGrad)"
                          opacity={0.8}
                          stroke="#8b7355"
                          strokeWidth={1}
                        />
                        <polygon
                          points={`${b.px - 20},${b.py - 35} ${b.px},${b.py - 48} ${b.px + 20},${b.py - 35}`}
                          fill="#a0522d"
                          stroke="#8b4513"
                          strokeWidth={0.5}
                        />
                        <text
                          x={b.px} y={b.py - 14}
                          textAnchor="middle"
                          fontSize="14"
                          fill="white"
                        >
                          🏠
                        </text>
                      </>
                    )}
                    
                    {/* Building name label */}
                    <g opacity="0" className="building-label">
                      <rect
                        x={b.px - 40} y={by - 16}
                        width={80} height={14}
                        rx={3}
                        fill="rgba(0,0,0,0.85)"
                      />
                      <text
                        x={b.px} y={by - 6}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#facc15"
                        fontFamily="sans-serif"
                      >
                        {b.structure.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
          
          {/* Drag indicator */}
          {draggedStructure && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/90 text-yellow-400 text-sm px-4 py-2 rounded-full shadow-lg border border-yellow-500/30">
              Drop <strong>{draggedStructure.name}</strong> on a highlighted tile
            </div>
          )}
        </div>
      </div>
      
      {/* ── Info Panel ───────────────────────────────────────── */}
      {buildings.length > 0 && (
        <div className="w-44 glass-card p-2 flex flex-col overflow-hidden">
          <h4 className="text-xs font-semibold text-yellow-400 mb-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Built ({buildings.length})
          </h4>
          <div className="flex-1 overflow-y-auto space-y-1 text-[10px]">
            {buildings.map((b) => (
              <div key={b.slotIndex} className="p-1.5 bg-white/5 rounded group relative">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-400">{b.structure.name}</span>
                  <button 
                    onClick={() => demolishStructure(b.slotIndex)}
                    className="w-4 h-4 bg-red-600/80 rounded-full hidden group-hover:flex items-center justify-center hover:bg-red-500"
                    title="Demolish"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
                {b.structure.effects && <div className="text-gray-400 mt-0.5">{b.structure.effects}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
