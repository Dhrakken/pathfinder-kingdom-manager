import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  MapPin, Mountain, TreePine, Home, Hammer, Wheat, 
  Eye, EyeOff, Flag, Info, X, ZoomIn, ZoomOut, Move
} from 'lucide-react';
import {
  HEX_SIZE,
  HEX_HEIGHT,
  parseCoord,
  buildCoord,
  hexToPixel,
  getHexPoints,
  getNeighbors,
  TERRAIN_TYPES,
  HEX_STATUS,
  WORK_SITE_TYPES,
} from '../utils/hexUtils.js';

// ============================================
// HEX MAP COMPONENT
// Interactive SVG hex map for kingdom management
// ============================================

// Single Hex component
const Hex = ({ 
  hex, 
  cx, 
  cy, 
  isSelected, 
  onClick, 
  kingdomColor = '#3333f9',
  showLabels = true,
}) => {
  const { coord, status, terrain, workSite, settlement, faction } = hex;
  
  // Determine fill color based on status
  let fillColor = '#1a1a2e'; // Unexplored (dark)
  let fillOpacity = 1;
  let strokeColor = '#333';
  let strokeWidth = 1;
  
  if (status === HEX_STATUS.EXPLORED) {
    fillColor = TERRAIN_TYPES[terrain]?.color || '#90B860';
    fillOpacity = 0.7;
    strokeColor = '#555';
  } else if (status === HEX_STATUS.CLAIMED) {
    fillColor = TERRAIN_TYPES[terrain]?.color || '#90B860';
    fillOpacity = 1;
    strokeColor = kingdomColor;
    strokeWidth = 2;
  }
  
  if (isSelected) {
    strokeColor = '#D4AF37';
    strokeWidth = 3;
  }
  
  const points = getHexPoints(cx, cy, HEX_SIZE - 1);
  
  return (
    <g 
      onClick={() => onClick(hex)} 
      style={{ cursor: 'pointer' }}
      className="hex-group"
    >
      {/* Main hex shape */}
      <polygon
        points={points}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-all duration-200"
      />
      
      {/* Fog overlay for unexplored */}
      {status === HEX_STATUS.UNEXPLORED && (
        <polygon
          points={points}
          fill="url(#fogPattern)"
          fillOpacity={0.8}
        />
      )}
      
      {/* Claimed faction border glow */}
      {status === HEX_STATUS.CLAIMED && (
        <polygon
          points={getHexPoints(cx, cy, HEX_SIZE - 4)}
          fill="none"
          stroke={kingdomColor}
          strokeWidth={1}
          strokeOpacity={0.5}
        />
      )}
      
      {/* Settlement icon */}
      {settlement && (
        <g transform={`translate(${cx - 8}, ${cy - 8})`}>
          <Home size={16} className="text-yellow-400" stroke="#D4AF37" fill="#2d004d" />
        </g>
      )}
      
      {/* Work site icon */}
      {workSite && !settlement && (
        <g transform={`translate(${cx - 6}, ${cy - 6})`}>
          {workSite === 'farm' && <Wheat size={12} stroke="#FFA500" />}
          {workSite === 'lumber' && <TreePine size={12} stroke="#228B22" />}
          {workSite === 'mine' && <Hammer size={12} stroke="#A0A0A0" />}
          {workSite === 'quarry' && <Mountain size={12} stroke="#808080" />}
        </g>
      )}
      
      {/* Coordinate label */}
      {showLabels && status !== HEX_STATUS.UNEXPLORED && (
        <text
          x={cx}
          y={cy + HEX_SIZE * 0.6}
          textAnchor="middle"
          fontSize="8"
          fill="#888"
          className="pointer-events-none select-none"
        >
          {coord}
        </text>
      )}
    </g>
  );
};

// Work Site Selection Modal
const WorkSiteModal = ({ hex, onSelect, onClose }) => {
  if (!hex) return null;
  
  const workSiteOptions = [
    { id: 'farm', name: 'Farmland', commodity: 'Food', icon: '🌾', description: 'Produces food each turn' },
    { id: 'lumber', name: 'Lumber Camp', commodity: 'Lumber', icon: '🪵', description: 'Produces lumber from forests' },
    { id: 'mine', name: 'Mine', commodity: 'Ore', icon: '⛏️', description: 'Extracts ore from hills/mountains' },
    { id: 'quarry', name: 'Quarry', commodity: 'Stone', icon: '🪨', description: 'Produces stone blocks' },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-yellow-400 mb-2">
          Establish Work Site
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Hex {hex.coord.toUpperCase()} — Choose a work site type:
        </p>
        
        <div className="space-y-2 mb-4">
          {workSiteOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-yellow-500/50 transition-all text-left flex items-center gap-3"
            >
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-medium text-yellow-400">{option.name}</div>
                <div className="text-xs text-gray-400">{option.description}</div>
                <div className="text-xs text-green-400">→ +1 {option.commodity}/turn</div>
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="btn-secondary w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Terrain Selection Modal
const TerrainModal = ({ hex, onSelect, onClose }) => {
  if (!hex) return null;
  
  const terrainOptions = Object.entries(TERRAIN_TYPES).map(([id, data]) => ({
    id,
    ...data,
  }));
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-yellow-400 mb-2">
          Set Terrain Type
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Hex {hex.coord.toUpperCase()} — Select terrain:
        </p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {terrainOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className={`p-3 rounded border transition-all text-center ${
                hex.terrain === option.id 
                  ? 'bg-yellow-500/20 border-yellow-500' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-yellow-500/50'
              }`}
            >
              <span className="text-2xl block mb-1">{option.icon}</span>
              <span className="text-sm">{option.name}</span>
            </button>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="btn-secondary w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Hex info panel
const HexInfoPanel = ({ hex, onClose, onAction, kingdomName = 'Nauthgard' }) => {
  if (!hex) return null;
  
  const terrainInfo = TERRAIN_TYPES[hex.terrain] || TERRAIN_TYPES.plains;
  const workSiteInfo = hex.workSite ? WORK_SITE_TYPES[hex.workSite] : null;
  
  return (
    <div className="absolute top-4 right-4 w-72 glass-card p-4 z-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-yellow-400">
            Hex {hex.coord.toUpperCase()}
          </h3>
          <button 
            onClick={() => onAction('terrain', hex)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-yellow-400"
          >
            <span>{terrainInfo.icon}</span>
            <span>{terrainInfo.name}</span>
            <span className="text-xs">(click to change)</span>
          </button>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Status */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
        <div className={`text-sm font-medium ${
          hex.status === HEX_STATUS.CLAIMED ? 'text-green-400' :
          hex.status === HEX_STATUS.EXPLORED ? 'text-blue-400' :
          'text-gray-500'
        }`}>
          {hex.status === HEX_STATUS.CLAIMED && `Claimed by ${kingdomName}`}
          {hex.status === HEX_STATUS.EXPLORED && 'Explored'}
          {hex.status === HEX_STATUS.UNEXPLORED && 'Unexplored'}
        </div>
      </div>
      
      {/* Work Site */}
      {workSiteInfo && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Work Site</div>
          <div className="text-sm">
            <span className="text-yellow-400">{workSiteInfo.name}</span>
            <span className="text-gray-400"> → +1 {workSiteInfo.commodity}/turn</span>
          </div>
        </div>
      )}
      
      {/* Settlement */}
      {hex.settlement && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Settlement</div>
          <div className="text-sm text-yellow-400">{hex.settlement}</div>
        </div>
      )}
      
      {/* Features */}
      {hex.features && hex.features.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Features</div>
          <div className="text-sm text-gray-300">
            {hex.features.join(', ')}
          </div>
        </div>
      )}
      
      {/* Notes */}
      {hex.notes && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</div>
          <div className="text-sm text-gray-300">{hex.notes}</div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
        {hex.status === HEX_STATUS.UNEXPLORED && (
          <button 
            onClick={() => onAction('explore', hex)}
            className="btn-secondary text-xs flex items-center gap-1"
          >
            <Eye size={12} /> Explore
          </button>
        )}
        {hex.status === HEX_STATUS.EXPLORED && (
          <button 
            onClick={() => onAction('claim', hex)}
            className="btn-royal text-xs flex items-center gap-1"
          >
            <Flag size={12} /> Claim Hex (1 RP)
          </button>
        )}
        {hex.status === HEX_STATUS.CLAIMED && !hex.workSite && !hex.settlement && (
          <>
            <button 
              onClick={() => onAction('worksite', hex)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Hammer size={12} /> Work Site (2 RP)
            </button>
            <button 
              onClick={() => onAction('settlement', hex)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              <Home size={12} /> Settlement
            </button>
          </>
        )}
        {hex.status === HEX_STATUS.CLAIMED && hex.workSite && (
          <button 
            onClick={() => onAction('removeWorksite', hex)}
            className="btn-secondary text-xs flex items-center gap-1 text-red-400"
          >
            <X size={12} /> Remove Work Site
          </button>
        )}
      </div>
    </div>
  );
};

// Main HexMap component
export default function HexMap({ 
  hexes = {}, 
  onHexUpdate,
  kingdomName = 'Nauthgard',
  kingdomColor = '#3333f9',
  rows = 10,
  cols = 28,
}) {
  const [selectedHex, setSelectedHex] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 1200, height: 500 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [showWorkSiteModal, setShowWorkSiteModal] = useState(false);
  const [showTerrainModal, setShowTerrainModal] = useState(false);
  const svgRef = useRef(null);
  
  // Generate all hex positions
  const hexGrid = useMemo(() => {
    const grid = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const coord = buildCoord(row, col);
        const { x, y } = hexToPixel(row, col);
        const hexData = hexes[coord] || {
          coord,
          status: HEX_STATUS.UNEXPLORED,
          terrain: 'plains',
          features: [],
        };
        grid.push({ ...hexData, cx: x + HEX_SIZE, cy: y + HEX_SIZE });
      }
    }
    return grid;
  }, [hexes, rows, cols]);
  
  // Center view on claimed territory on mount
  useEffect(() => {
    const claimedHexes = hexGrid.filter(h => h.status === HEX_STATUS.CLAIMED);
    if (claimedHexes.length > 0) {
      const avgX = claimedHexes.reduce((sum, h) => sum + h.cx, 0) / claimedHexes.length;
      const avgY = claimedHexes.reduce((sum, h) => sum + h.cy, 0) / claimedHexes.length;
      setViewBox(prev => ({
        ...prev,
        x: avgX - prev.width / 2,
        y: avgY - prev.height / 2,
      }));
    }
  }, []);
  
  const handleHexClick = useCallback((hex) => {
    setSelectedHex(hex.coord === selectedHex?.coord ? null : hex);
  }, [selectedHex]);
  
  const handleAction = useCallback((action, hex) => {
    if (!onHexUpdate) return;
    
    switch (action) {
      case 'explore':
        const exploredHex = { ...hex, status: HEX_STATUS.EXPLORED };
        onHexUpdate(exploredHex);
        setSelectedHex(exploredHex);
        break;
      case 'claim':
        const claimedHex = { ...hex, status: HEX_STATUS.CLAIMED, faction: '1' };
        onHexUpdate(claimedHex);
        setSelectedHex(claimedHex);
        break;
      case 'worksite':
        setShowWorkSiteModal(true);
        break;
      case 'terrain':
        setShowTerrainModal(true);
        break;
      case 'removeWorksite':
        const clearedHex = { ...hex, workSite: null };
        onHexUpdate(clearedHex);
        setSelectedHex(clearedHex);
        break;
      case 'settlement':
        // TODO: Open settlement creation modal
        break;
    }
  }, [onHexUpdate]);

  const handleWorkSiteSelect = useCallback((workSiteType) => {
    if (!selectedHex || !onHexUpdate) return;
    const updatedHex = { ...selectedHex, workSite: workSiteType };
    onHexUpdate(updatedHex);
    setSelectedHex(updatedHex);
    setShowWorkSiteModal(false);
  }, [selectedHex, onHexUpdate]);

  const handleTerrainSelect = useCallback((terrainType) => {
    if (!selectedHex || !onHexUpdate) return;
    const updatedHex = { ...selectedHex, terrain: terrainType };
    onHexUpdate(updatedHex);
    setSelectedHex(updatedHex);
    setShowTerrainModal(false);
  }, [selectedHex, onHexUpdate]);
  
  // Zoom controls
  const handleZoom = (delta) => {
    setViewBox(prev => {
      const factor = delta > 0 ? 0.8 : 1.25;
      const newWidth = prev.width * factor;
      const newHeight = prev.height * factor;
      const dx = (prev.width - newWidth) / 2;
      const dy = (prev.height - newHeight) / 2;
      return {
        x: prev.x + dx,
        y: prev.y + dy,
        width: Math.max(400, Math.min(2400, newWidth)),
        height: Math.max(200, Math.min(1200, newHeight)),
      };
    });
  };
  
  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) * (viewBox.width / svgRef.current.clientWidth);
    const dy = (e.clientY - panStart.y) * (viewBox.height / svgRef.current.clientHeight);
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  const handleWheel = (e) => {
    e.preventDefault();
    handleZoom(e.deltaY);
  };
  
  return (
    <div className="relative w-full h-full min-h-[500px] bg-black/30 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-40 flex gap-2">
        <button
          onClick={() => handleZoom(-1)}
          className="p-2 bg-black/50 rounded hover:bg-black/70"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => handleZoom(1)}
          className="p-2 bg-black/50 rounded hover:bg-black/70"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 rounded ${showLabels ? 'bg-yellow-500/30' : 'bg-black/50'} hover:bg-black/70`}
          title="Toggle Labels"
        >
          <Info size={18} />
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-40 glass-card p-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: kingdomColor }} />
            <span>Claimed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-600/70" />
            <span>Explored</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-800" />
            <span>Unexplored</span>
          </div>
        </div>
      </div>
      
      {/* SVG Map */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {/* Defs for patterns */}
        <defs>
          <pattern id="fogPattern" patternUnits="userSpaceOnUse" width="10" height="10">
            <rect width="10" height="10" fill="#0a0a15" />
            <circle cx="2" cy="2" r="1" fill="#1a1a2e" opacity="0.5" />
            <circle cx="7" cy="7" r="1" fill="#1a1a2e" opacity="0.5" />
          </pattern>
        </defs>
        
        {/* Render hexes */}
        {hexGrid.map(hex => (
          <Hex
            key={hex.coord}
            hex={hex}
            cx={hex.cx}
            cy={hex.cy}
            isSelected={selectedHex?.coord === hex.coord}
            onClick={handleHexClick}
            kingdomColor={kingdomColor}
            showLabels={showLabels}
          />
        ))}
      </svg>
      
      {/* Info Panel */}
      <HexInfoPanel
        hex={selectedHex}
        onClose={() => setSelectedHex(null)}
        onAction={handleAction}
        kingdomName={kingdomName}
      />
      
      {/* Work Site Modal */}
      {showWorkSiteModal && (
        <WorkSiteModal
          hex={selectedHex}
          onSelect={handleWorkSiteSelect}
          onClose={() => setShowWorkSiteModal(false)}
        />
      )}
      
      {/* Terrain Modal */}
      {showTerrainModal && (
        <TerrainModal
          hex={selectedHex}
          onSelect={handleTerrainSelect}
          onClose={() => setShowTerrainModal(false)}
        />
      )}
    </div>
  );
}
