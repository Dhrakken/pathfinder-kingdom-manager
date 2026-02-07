import React, { useState, useMemo } from 'react';
import { 
  Plus, X, Hammer, Search, Waves, TreePine, Mountain,
  Home, Building2, Store, Church, Shield, Wheat, Factory,
  GraduationCap, Scale, Landmark, Beer, Tent
} from 'lucide-react';
import { STRUCTURES, getStructureById, getStructuresByLevel } from '../data/structures.js';

// Block layout: 3x3 grid that can expand
// Each block has 4 lots in a 2x2 arrangement
const BLOCK_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Get icon for structure type
const getStructureIcon = (structureId) => {
  if (!structureId) return null;
  const id = structureId.toLowerCase();
  
  if (id.includes('house') || id.includes('tenement')) return Home;
  if (id.includes('inn') || id.includes('tavern')) return Beer;
  if (id.includes('store') || id.includes('shop') || id.includes('market')) return Store;
  if (id.includes('shrine') || id.includes('temple') || id.includes('cathedral')) return Church;
  if (id.includes('wall') || id.includes('garrison') || id.includes('barracks')) return Shield;
  if (id.includes('mill') || id.includes('farm') || id.includes('granary')) return Wheat;
  if (id.includes('smith') || id.includes('foundry') || id.includes('workshop')) return Factory;
  if (id.includes('library') || id.includes('academy') || id.includes('school')) return GraduationCap;
  if (id.includes('court') || id.includes('jail') || id.includes('prison')) return Scale;
  if (id.includes('hall') || id.includes('castle') || id.includes('palace')) return Landmark;
  if (id.includes('pier') || id.includes('dock') || id.includes('fishery')) return Waves;
  if (id.includes('lumber') || id.includes('park')) return TreePine;
  
  return Building2;
};

export default function SettlementMap({ 
  settlement, 
  state, 
  onUpdateSettlement,
  onLog 
}) {
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  const [hoveredLot, setHoveredLot] = useState(null);
  
  const kingdomLevel = state.kingdom?.level || 1;
  const currentRP = state.resources?.rp || 0;
  
  // Settlement configuration
  const config = settlement.mapConfig || {
    rows: 3,
    cols: 3,
    waterfront: 'south', // 'south', 'north', 'east', 'west', 'none'
  };
  
  // Get structures placed in each block/lot
  const structureMap = useMemo(() => {
    const map = {};
    const placements = settlement.structurePlacements || [];
    
    for (const placement of placements) {
      const key = `${placement.block}-${placement.lot}`;
      map[key] = placement;
    }
    
    // Also support legacy format (just array of structure IDs)
    if (placements.length === 0 && settlement.structures?.length > 0) {
      settlement.structures.forEach((structureId, i) => {
        const block = BLOCK_LABELS[Math.floor(i / 4)];
        const lot = (i % 4) + 1;
        map[`${block}-${lot}`] = { block, lot, structureId };
      });
    }
    
    return map;
  }, [settlement.structurePlacements, settlement.structures]);
  
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
  
  // Check if a block is on the waterfront
  const isWaterfront = (block, row) => {
    const totalRows = config.rows;
    switch (config.waterfront) {
      case 'south': return row === totalRows - 1;
      case 'north': return row === 0;
      case 'east': return block.charCodeAt(0) - 'A'.charCodeAt(0) === config.cols - 1;
      case 'west': return block.charCodeAt(0) - 'A'.charCodeAt(0) === 0;
      default: return false;
    }
  };
  
  // Check if a lot is in water (southern half of waterfront blocks for south waterfront)
  const isWaterLot = (block, lot, row) => {
    if (!isWaterfront(block, row)) return false;
    switch (config.waterfront) {
      case 'south': return lot >= 3; // Lots 3 and 4 are in water
      case 'north': return lot <= 2; // Lots 1 and 2 are in water
      case 'east': return lot % 2 === 0; // Lots 2 and 4 are in water
      case 'west': return lot % 2 === 1; // Lots 1 and 3 are in water
      default: return false;
    }
  };
  
  // Build a structure
  const buildStructure = (structure) => {
    if (!canAfford(structure) || !selectedBlock) return;
    
    const cost = structure.cost || {};
    
    // Deduct costs
    const newResources = { ...state.resources };
    if (cost.rp) newResources.rp -= cost.rp;
    if (cost.lumber) newResources.lumber -= cost.lumber;
    if (cost.stone) newResources.stone -= cost.stone;
    if (cost.ore) newResources.ore -= cost.ore;
    if (cost.luxuries) newResources.luxuries -= cost.luxuries;
    
    // Add placement
    const newPlacements = [...(settlement.structurePlacements || [])];
    
    // Handle multi-lot structures
    const lotsNeeded = structure.lots || 1;
    const startLot = selectedLot || 1;
    
    // Remove any existing structures in these lots
    const lotsToUse = [];
    for (let i = 0; i < lotsNeeded; i++) {
      const lot = startLot + i;
      if (lot <= 4) lotsToUse.push(lot);
    }
    
    // Filter out old placements in these lots
    const filteredPlacements = newPlacements.filter(p => 
      !(p.block === selectedBlock && lotsToUse.includes(p.lot))
    );
    
    // Add new placement
    filteredPlacements.push({
      block: selectedBlock,
      lot: startLot,
      structureId: structure.id,
      lotsUsed: lotsNeeded,
    });
    
    // Calculate block count
    const usedBlocks = new Set(filteredPlacements.map(p => p.block));
    const blocks = usedBlocks.size;
    
    onUpdateSettlement({
      ...settlement,
      structurePlacements: filteredPlacements,
      blocks: Math.max(settlement.blocks || 1, blocks),
    }, newResources);
    
    // Log the build
    const costStr = Object.entries(cost)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => `${v} ${k.toUpperCase()}`)
      .join(', ');
    
    onLog?.(`Built ${structure.name} in ${settlement.name} Block ${selectedBlock} (${costStr})`, 'success');
    
    setShowBuildModal(false);
    setSelectedBlock(null);
    setSelectedLot(null);
  };
  
  // Demolish a structure
  const demolishStructure = (block, lot) => {
    const key = `${block}-${lot}`;
    const placement = structureMap[key];
    if (!placement) return;
    
    const structure = getStructureById(placement.structureId);
    
    const newPlacements = (settlement.structurePlacements || []).filter(p => 
      !(p.block === block && p.lot === lot)
    );
    
    onUpdateSettlement({
      ...settlement,
      structurePlacements: newPlacements,
    }, state.resources);
    
    onLog?.(`Demolished ${structure?.name || 'structure'} in ${settlement.name}`, 'info');
  };
  
  // Calculate totals
  const totalLots = config.rows * config.cols * 4;
  const usedLots = Object.values(structureMap).reduce((acc, p) => acc + (p.lotsUsed || 1), 0);
  const waterLots = (() => {
    let count = 0;
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const blockIndex = row * config.cols + col;
        const block = BLOCK_LABELS[blockIndex];
        for (let lot = 1; lot <= 4; lot++) {
          if (isWaterLot(block, lot, row)) count++;
        }
      }
    }
    return count;
  })();
  const buildableLots = totalLots - waterLots;
  
  // Get settlement type
  const getSettlementType = () => {
    const blocks = Object.keys(
      Object.values(structureMap).reduce((acc, p) => ({ ...acc, [p.block]: true }), {})
    ).length || 1;
    if (blocks <= 4) return 'Village';
    if (blocks <= 8) return 'Town';
    if (blocks <= 16) return 'City';
    return 'Metropolis';
  };
  
  // Render a single lot
  const renderLot = (block, lot, row) => {
    const key = `${block}-${lot}`;
    const placement = structureMap[key];
    const structure = placement ? getStructureById(placement.structureId) : null;
    const isWater = isWaterLot(block, lot, row);
    const isOnWaterfront = isWaterfront(block, row) && !isWater;
    const Icon = structure ? getStructureIcon(placement.structureId) : null;
    const isHovered = hoveredLot === key;
    const isPartOfMultiLot = placement?.lot !== lot && placement?.lotsUsed > 1;
    
    // Skip rendering if this lot is part of a multi-lot structure's secondary lots
    if (isPartOfMultiLot) {
      return null;
    }
    
    // Check if we should span multiple lots
    const lotsUsed = placement?.lotsUsed || 1;
    
    return (
      <div
        key={key}
        className={`
          relative flex items-center justify-center transition-all cursor-pointer
          ${isWater 
            ? 'bg-blue-600/40 border-blue-400/50' 
            : isOnWaterfront
            ? 'bg-amber-900/30 border-amber-600/50 hover:border-yellow-400'
            : 'bg-green-900/20 border-green-700/30 hover:border-yellow-400'
          }
          ${structure ? 'bg-purple-900/40 border-purple-500/60' : ''}
          ${isHovered ? 'ring-2 ring-yellow-400' : ''}
          border rounded
        `}
        style={{
          gridColumn: lotsUsed === 2 && lot % 2 === 1 ? 'span 2' : undefined,
          gridRow: lotsUsed === 4 ? 'span 2' : undefined,
        }}
        onMouseEnter={() => setHoveredLot(key)}
        onMouseLeave={() => setHoveredLot(null)}
        onClick={() => {
          if (isWater) return;
          if (structure) {
            // Show structure info or demolish option
          } else {
            setSelectedBlock(block);
            setSelectedLot(lot);
            setShowBuildModal(true);
          }
        }}
      >
        {isWater ? (
          <Waves className="w-4 h-4 text-blue-300/60" />
        ) : structure ? (
          <div className="text-center p-1 group w-full h-full flex flex-col items-center justify-center">
            {Icon && <Icon className="w-5 h-5 text-yellow-400 mb-0.5" />}
            <div className="text-[9px] text-gray-300 leading-tight truncate w-full px-0.5">
              {structure.name}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                demolishStructure(block, lot);
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <Plus className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100" />
        )}
        
        {/* Lot number indicator */}
        <span className="absolute bottom-0 right-0.5 text-[8px] text-gray-500">
          {lot}
        </span>
      </div>
    );
  };
  
  // Render a block (4 lots in 2x2)
  const renderBlock = (blockIndex, row, col) => {
    const block = BLOCK_LABELS[blockIndex];
    const onWaterfront = isWaterfront(block, row);
    
    return (
      <div 
        key={block}
        className={`
          relative p-1 rounded-lg border-2
          ${onWaterfront 
            ? 'border-blue-500/50 bg-blue-900/10' 
            : 'border-gray-600/50 bg-gray-800/30'
          }
        `}
      >
        {/* Block label */}
        <div className="absolute -top-2 left-1 bg-gray-900 px-1 text-xs text-gray-400 font-mono">
          {block}
        </div>
        
        {/* 2x2 lot grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square">
          {[1, 2, 3, 4].map(lot => renderLot(block, lot, row))}
        </div>
      </div>
    );
  };
  
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
            {getSettlementType()} • {usedLots}/{buildableLots} lots used
            {config.waterfront !== 'none' && (
              <span className="text-blue-400 ml-2">• Waterfront ({config.waterfront})</span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedBlock(null);
            setSelectedLot(null);
            setShowBuildModal(true);
          }}
          className="btn-royal flex items-center gap-2"
        >
          <Hammer className="w-4 h-4" />
          Build
        </button>
      </div>
      
      {/* Settlement Map Grid */}
      <div 
        className="grid gap-2 mb-4 max-w-md mx-auto"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
        }}
      >
        {Array(config.rows).fill(null).map((_, row) =>
          Array(config.cols).fill(null).map((_, col) => {
            const blockIndex = row * config.cols + col;
            return renderBlock(blockIndex, row, col);
          })
        )}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-4 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-900/40 border border-green-700/50 rounded" />
          <span>Land</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-900/40 border border-amber-600/50 rounded" />
          <span>Waterfront</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-600/40 border border-blue-400/50 rounded" />
          <span>Water</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-900/40 border border-purple-500/50 rounded" />
          <span>Building</span>
        </div>
      </div>
      
      {/* Structure Effects Summary */}
      {Object.keys(structureMap).length > 0 && (
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
          <div className="font-semibold text-gray-300 mb-2">Structures:</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(structureMap).map(([key, placement]) => {
              const structure = getStructureById(placement.structureId);
              if (!structure) return null;
              return (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-purple-400 font-mono">{placement.block}{placement.lot}:</span>
                  <span className="text-yellow-400">{structure.name}</span>
                </div>
              );
            })}
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
                  {selectedBlock && ` • Block ${selectedBlock}`}
                  {selectedLot && `, Lot ${selectedLot}`}
                </div>
              </div>
              <button onClick={() => setShowBuildModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Block Selection (if not selected) */}
            {!selectedBlock && (
              <div className="p-4 border-b border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Select a block:</div>
                <div className="flex flex-wrap gap-2">
                  {Array(config.rows * config.cols).fill(null).map((_, i) => {
                    const block = BLOCK_LABELS[i];
                    const row = Math.floor(i / config.cols);
                    const onWater = isWaterfront(block, row);
                    return (
                      <button
                        key={block}
                        onClick={() => setSelectedBlock(block)}
                        className={`w-10 h-10 rounded border-2 font-mono text-sm ${
                          onWater 
                            ? 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/40' 
                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        {block}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Lot Selection (if block selected but lot not) */}
            {selectedBlock && !selectedLot && (
              <div className="p-4 border-b border-gray-800">
                <div className="text-sm text-gray-400 mb-2">Select a lot in Block {selectedBlock}:</div>
                <div className="grid grid-cols-2 gap-2 w-32">
                  {[1, 2, 3, 4].map(lot => {
                    const row = Math.floor((BLOCK_LABELS.indexOf(selectedBlock)) / config.cols);
                    const isWater = isWaterLot(selectedBlock, lot, row);
                    const key = `${selectedBlock}-${lot}`;
                    const occupied = !!structureMap[key];
                    
                    return (
                      <button
                        key={lot}
                        onClick={() => !isWater && !occupied && setSelectedLot(lot)}
                        disabled={isWater || occupied}
                        className={`w-14 h-14 rounded border-2 font-mono text-sm ${
                          isWater 
                            ? 'border-blue-500/50 bg-blue-600/40 cursor-not-allowed' 
                            : occupied
                            ? 'border-purple-500/50 bg-purple-900/40 cursor-not-allowed'
                            : 'border-gray-600 bg-gray-800 hover:bg-gray-700 hover:border-yellow-500'
                        }`}
                      >
                        {isWater ? <Waves className="w-4 h-4 mx-auto text-blue-300" /> : lot}
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
              <span className="text-pink-400">{state.resources?.luxuries || 0} Lux</span>
            </div>
            
            {/* Structure List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {availableStructures.map(structure => {
                  const affordable = canAfford(structure);
                  const cost = structure.cost || {};
                  const Icon = getStructureIcon(structure.id);
                  
                  return (
                    <div
                      key={structure.id}
                      className={`p-3 rounded-lg border transition-all ${
                        affordable && selectedLot
                          ? 'bg-white/5 border-white/10 hover:border-yellow-500/50 cursor-pointer'
                          : 'bg-gray-800/50 border-gray-700 opacity-60'
                      }`}
                      onClick={() => affordable && selectedLot && buildStructure(structure)}
                    >
                      <div className="flex items-start gap-3">
                        {Icon && <Icon className="w-6 h-6 text-yellow-400 mt-0.5" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-yellow-400">{structure.name}</span>
                            <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">L{structure.level}</span>
                            <span className="text-xs text-gray-500">{structure.lots || 1} lot{(structure.lots || 1) > 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{structure.effects}</div>
                        </div>
                        <div className="text-right text-xs space-y-0.5">
                          {cost.rp && <div className={currentRP >= cost.rp ? 'text-yellow-400' : 'text-red-400'}>{cost.rp} RP</div>}
                          {cost.lumber && <div className={(state.resources?.lumber || 0) >= cost.lumber ? 'text-green-400' : 'text-red-400'}>{cost.lumber} Lumber</div>}
                          {cost.stone && <div className={(state.resources?.stone || 0) >= cost.stone ? 'text-gray-400' : 'text-red-400'}>{cost.stone} Stone</div>}
                          {cost.ore && <div className={(state.resources?.ore || 0) >= cost.ore ? 'text-orange-400' : 'text-red-400'}>{cost.ore} Ore</div>}
                          {cost.luxuries && <div className={(state.resources?.luxuries || 0) >= cost.luxuries ? 'text-pink-400' : 'text-red-400'}>{cost.luxuries} Lux</div>}
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
