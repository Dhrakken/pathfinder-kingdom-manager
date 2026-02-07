import React, { useState, useMemo } from 'react';
import { 
  Plus, X, Hammer, Search, Waves,
  ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

// Tilemap is 192x176 pixels, 12x11 tiles of 16x16 each
const TILE_SIZE = 16;
const TILEMAP_COLS = 12;

// Get pixel position for a tile index
const getTilePos = (index) => {
  const col = index % TILEMAP_COLS;
  const row = Math.floor(index / TILEMAP_COLS);
  return { x: col * TILE_SIZE, y: row * TILE_SIZE };
};

// Building definitions - which tiles make up each structure
// Each building is a 2D array of tile indices (or null for empty)
// Tile indices based on the tilemap layout
const BUILDING_SPRITES = {
  // Small houses (1 lot) - 2x2 tiles
  'houses': {
    village: [[36, 37], [48, 49]], // Blue roof house
    town: [[38, 39], [50, 51]], // Red roof house
    city: [[40, 41], [52, 53]], // Brown stone house
  },
  'tenement': {
    village: [[38, 39], [50, 51]],
    town: [[40, 41], [52, 53]],
    city: [[40, 41], [52, 53]],
  },
  
  // Inn/Tavern (1 lot) - 2x2 tiles with different roof
  'inn': {
    village: [[38, 39], [50, 51]],
    town: [[26, 27], [38, 39]],
    city: [[40, 41], [52, 53]],
  },
  'tavern': {
    village: [[38, 39], [50, 51]],
    town: [[26, 27], [38, 39]],
    city: [[40, 41], [52, 53]],
  },
  
  // General Store / Shops
  'general-store': {
    village: [[36, 37], [48, 49]],
    town: [[38, 39], [50, 51]],
    city: [[40, 41], [52, 53]],
  },
  'marketplace': {
    village: [[109, 110], [121, 122]],
    town: [[109, 110], [121, 122]],
    city: [[109, 110], [121, 122]],
  },
  
  // Town Hall (2 lots) - 4x2 tiles
  'town-hall': {
    village: [[36, 37, 36, 37], [48, 49, 48, 49]],
    town: [[38, 39, 40, 41], [50, 51, 52, 53]],
    city: [[64, 65, 66, 67], [76, 77, 78, 79]],
  },
  
  // Castle (4 lots) - 4x4 tiles  
  'castle': {
    village: [[64, 65, 66, 67], [76, 77, 78, 79], [88, 89, 90, 91], [100, 101, 102, 103]],
    town: [[64, 65, 66, 67], [76, 77, 78, 79], [88, 89, 90, 91], [100, 101, 102, 103]],
    city: [[64, 65, 66, 67], [76, 77, 78, 79], [88, 89, 90, 91], [100, 101, 102, 103]],
  },
  
  // Shrine/Temple
  'shrine': {
    village: [[36, 37], [48, 49]],
    town: [[64, 65], [76, 77]],
    city: [[66, 67], [78, 79]],
  },
  'temple': {
    village: [[64, 65], [76, 77]],
    town: [[64, 65, 66], [76, 77, 78]],
    city: [[64, 65, 66, 67], [76, 77, 78, 79]],
  },
  
  // Mill - has special windmill sprite
  'mill': {
    village: [[42, 43], [54, 55]],
    town: [[42, 43], [54, 55]],
    city: [[42, 43], [54, 55]],
  },
  
  // Walls/Fortifications
  'wooden-walls': {
    village: [[58, 59], [70, 71]],
    town: [[58, 59], [70, 71]],
    city: [[58, 59], [70, 71]],
  },
  'stone-walls': {
    village: [[68, 69], [80, 81]],
    town: [[68, 69], [80, 81]],
    city: [[68, 69], [80, 81]],
  },
  
  // Default fallback
  'default': {
    village: [[36, 37], [48, 49]],
    town: [[38, 39], [50, 51]],
    city: [[40, 41], [52, 53]],
  },
};

// Ground tiles
const GROUND_TILES = {
  grass: 12, // Green grass
  water: 18, // Water
  dirt: 13, // Dirt path
  stone: 14, // Stone path
  waterfront: 19, // Water edge
};

// Get settlement level tier
const getSettlementTier = (blocks) => {
  if (blocks <= 4) return 'village';
  if (blocks <= 8) return 'town';
  return 'city';
};

// Tile component - renders a single 16x16 tile from the tilemap
const Tile = ({ index, scale = 3 }) => {
  if (index === null || index === undefined) return <div style={{ width: TILE_SIZE * scale, height: TILE_SIZE * scale }} />;
  
  const pos = getTilePos(index);
  
  return (
    <div
      style={{
        width: TILE_SIZE * scale,
        height: TILE_SIZE * scale,
        backgroundImage: `url(${import.meta.env.BASE_URL}tilemap.png)`,
        backgroundPosition: `-${pos.x * scale}px -${pos.y * scale}px`,
        backgroundSize: `${192 * scale}px ${176 * scale}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
};

// Building component - renders a building from multiple tiles
const Building = ({ structureId, tier = 'village', scale = 2, onClick }) => {
  const sprites = BUILDING_SPRITES[structureId] || BUILDING_SPRITES['default'];
  const tileGrid = sprites[tier] || sprites['village'];
  
  return (
    <div 
      className="cursor-pointer hover:brightness-110 transition-all"
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tileGrid[0].length}, ${TILE_SIZE * scale}px)`,
        gap: 0,
      }}
    >
      {tileGrid.map((row, rowIndex) =>
        row.map((tileIndex, colIndex) => (
          <Tile key={`${rowIndex}-${colIndex}`} index={tileIndex} scale={scale} />
        ))
      )}
    </div>
  );
};

// Ground tile component
const GroundTile = ({ type = 'grass', scale = 3 }) => {
  const index = GROUND_TILES[type] || GROUND_TILES.grass;
  return <Tile index={index} scale={scale} />;
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
  
  // Calculate settlement tier based on blocks used
  const usedBlocks = new Set(
    (settlement.structurePlacements || []).map(p => p.block)
  ).size || 1;
  const tier = getSettlementTier(usedBlocks);
  
  // Get structures placed
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
    const blockLabel = String.fromCharCode(65 + selectedSlot); // A, B, C...
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
  
  // Get settlement type name
  const getSettlementType = () => {
    if (usedBlocks <= 4) return 'Village';
    if (usedBlocks <= 8) return 'Town';
    if (usedBlocks <= 16) return 'City';
    return 'Metropolis';
  };
  
  const totalSlots = config.rows * config.cols;
  const scale = 3; // Tile scale factor
  const slotSize = TILE_SIZE * scale * 4; // 4 tiles per lot side
  
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
            {getSettlementType()} • {usedBlocks} blocks
            {config.waterfront !== 'none' && (
              <span className="text-blue-400 ml-2">• Lakefront</span>
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
        className="relative mx-auto rounded-lg overflow-hidden border-4 border-amber-900/50"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${config.cols}, ${slotSize}px)`,
          gap: 4,
          padding: 8,
          background: 'linear-gradient(135deg, #2d5016 0%, #1a3a0a 100%)',
        }}
      >
        {Array(totalSlots).fill(null).map((_, slotIndex) => {
          const blockLabel = String.fromCharCode(65 + slotIndex);
          const placements = structureMap[blockLabel] || [];
          const onWaterfront = isWaterfront(slotIndex);
          const row = Math.floor(slotIndex / config.cols);
          
          return (
            <div
              key={slotIndex}
              className={`
                relative rounded transition-all
                ${onWaterfront ? 'bg-blue-600/30' : 'bg-green-900/20'}
                ${placements.length === 0 ? 'hover:bg-yellow-500/20 cursor-pointer' : ''}
                border-2 border-dashed
                ${onWaterfront ? 'border-blue-400/30' : 'border-green-700/30'}
              `}
              style={{
                width: slotSize,
                height: slotSize,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
              onClick={() => {
                if (placements.length === 0) {
                  setSelectedSlot(slotIndex);
                  setShowBuildModal(true);
                }
              }}
            >
              {/* Block label */}
              <div className="absolute top-1 left-2 text-xs font-mono text-white/40">
                {blockLabel}
              </div>
              
              {/* Water effect for waterfront */}
              {onWaterfront && (
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-500/40 to-transparent pointer-events-none" />
              )}
              
              {/* Buildings in this block */}
              {placements.length > 0 ? (
                <div className="relative group">
                  {placements.map((placement, i) => (
                    <div key={i} className="relative">
                      <Building 
                        structureId={placement.structureId} 
                        tier={tier}
                        scale={scale}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          demolishStructure(blockLabel, placement.structureId);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/60 px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                        {getStructureById(placement.structureId)?.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Plus className="w-8 h-8 text-white/20" />
              )}
            </div>
          );
        })}
        
        {/* Water at the bottom if south waterfront */}
        {config.waterfront === 'south' && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(59, 130, 246, 0.6), transparent)',
            }}
          />
        )}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-4 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-900/40 rounded" />
          <span>Land</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600/40 rounded" />
          <span>Waterfront</span>
        </div>
        <div className="text-yellow-400">
          Architecture: {tier.charAt(0).toUpperCase() + tier.slice(1)} style
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
                  <span key={`${block}-${i}`} className="bg-purple-900/30 px-2 py-1 rounded">
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
                  {settlement.name}
                  {selectedSlot !== null && ` • Block ${String.fromCharCode(65 + selectedSlot)}`}
                </div>
              </div>
              <button onClick={() => setShowBuildModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
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
                        className={`w-12 h-12 rounded border-2 font-mono text-sm flex items-center justify-center ${
                          hasBuildings
                            ? 'border-purple-500/50 bg-purple-900/30 cursor-not-allowed opacity-50'
                            : onWater 
                            ? 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/40' 
                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        {blockLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
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
            </div>
            
            {/* Structure List with Previews */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableStructures.map(structure => {
                  const affordable = canAfford(structure);
                  const cost = structure.cost || {};
                  
                  return (
                    <div
                      key={structure.id}
                      className={`p-3 rounded-lg border transition-all flex gap-3 ${
                        affordable && selectedSlot !== null
                          ? 'bg-white/5 border-white/10 hover:border-yellow-500/50 cursor-pointer'
                          : 'bg-gray-800/50 border-gray-700 opacity-60'
                      }`}
                      onClick={() => affordable && selectedSlot !== null && buildStructure(structure)}
                    >
                      {/* Building Preview */}
                      <div className="flex-shrink-0 bg-green-900/30 rounded p-1">
                        <Building 
                          structureId={structure.id} 
                          tier={tier}
                          scale={2}
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-yellow-400 truncate">{structure.name}</span>
                          <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded flex-shrink-0">L{structure.level}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{structure.effects}</div>
                        <div className="flex gap-2 mt-1 text-xs">
                          {cost.rp && <span className={currentRP >= cost.rp ? 'text-yellow-400' : 'text-red-400'}>{cost.rp} RP</span>}
                          {cost.lumber && <span className={(state.resources?.lumber || 0) >= cost.lumber ? 'text-green-400' : 'text-red-400'}>{cost.lumber} Lum</span>}
                          {cost.stone && <span className={(state.resources?.stone || 0) >= cost.stone ? 'text-gray-400' : 'text-red-400'}>{cost.stone} Stn</span>}
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
