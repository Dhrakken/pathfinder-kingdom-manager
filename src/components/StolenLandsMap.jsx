import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Home, Hammer, Wheat, Eye, Flag, Info, X, ZoomIn, ZoomOut,
  Mountain, TreePine
} from 'lucide-react';
import { HEX_POSITIONS, MAP_WIDTH, MAP_HEIGHT, HEX_WIDTH, HEX_HEIGHT } from '../data/hexPositions.js';
import { HEX_STATUS, WORK_SITE_TYPES, TERRAIN_TYPES } from '../utils/hexUtils.js';

// ============================================
// STOLEN LANDS MAP - With Background Image
// ============================================

// Generate flat-top hex points for SVG
const getFlatTopHexPoints = (cx, cy, size) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
};

// Single hex overlay
const HexOverlay = ({ coord, hex, position, isSelected, onClick, kingdomColor }) => {
  if (!position) return null;
  
  // The position values from David's tool are top-left of hex bounding box
  // For flat-top hexes: width = 2*r, height = sqrt(3)*r
  // With ~228px spacing, radius ≈ 114
  const hexRadius = 113;
  const cx = position.left + hexRadius; // Center X
  const cy = position.top + hexRadius * Math.sqrt(3) / 2 + 5; // Center Y (adjusted)
  
  const { status, workSite, settlement, faction } = hex || {};
  
  // Determine fill based on status
  let fillColor = 'transparent';
  let fillOpacity = 0;
  let strokeColor = 'transparent';
  let strokeWidth = 0;
  
  if (status === HEX_STATUS.UNEXPLORED) {
    fillColor = '#000000';
    fillOpacity = 0.7;
  } else if (status === HEX_STATUS.EXPLORED) {
    fillColor = '#22c55e';
    fillOpacity = 0.15;
    strokeColor = '#22c55e';
    strokeWidth = 1;
  } else if (status === HEX_STATUS.CLAIMED) {
    fillColor = kingdomColor;
    fillOpacity = 0.25;
    strokeColor = kingdomColor;
    strokeWidth = 3;
  }
  
  if (isSelected) {
    strokeColor = '#D4AF37';
    strokeWidth = 4;
  }
  
  const points = getFlatTopHexPoints(cx, cy, hexRadius);
  
  return (
    <g onClick={() => onClick && onClick(hex, coord)} style={{ cursor: 'pointer' }}>
      {/* Hex overlay */}
      <polygon
        points={points}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        className="transition-all duration-200 hover:fill-opacity-40"
      />
      
      {/* Settlement icon */}
      {settlement && (
        <g transform={`translate(${cx - 10}, ${cy - 10})`}>
          <circle cx="10" cy="10" r="12" fill="#2d004d" stroke="#D4AF37" strokeWidth="2" />
          <Home x="2" y="2" size={16} stroke="#D4AF37" />
        </g>
      )}
      
      {/* Work site icon */}
      {workSite && !settlement && (
        <g transform={`translate(${cx - 8}, ${cy - 8})`}>
          <circle cx="8" cy="8" r="10" fill="rgba(0,0,0,0.6)" />
          {workSite === 'farm' && <Wheat x="2" y="2" size={12} stroke="#FFA500" />}
          {workSite === 'lumber' && <TreePine x="2" y="2" size={12} stroke="#228B22" />}
          {workSite === 'mine' && <Hammer x="2" y="2" size={12} stroke="#A0A0A0" />}
          {workSite === 'quarry' && <Mountain x="2" y="2" size={12} stroke="#808080" />}
        </g>
      )}
      
      {/* Coordinate label */}
      <text
        x={cx}
        y={cy + hexRadius + 12}
        textAnchor="middle"
        fontSize="10"
        fill="rgba(255,255,255,0.7)"
        fontWeight="bold"
        style={{ textShadow: '1px 1px 2px black' }}
      >
        {coord.toUpperCase()}
      </text>
    </g>
  );
};

// Info panel (same as before)
const HexInfoPanel = ({ hex, coord, onClose, onAction, kingdomName }) => {
  if (!hex || !coord) return null;
  
  const workSiteInfo = hex.workSite ? WORK_SITE_TYPES[hex.workSite] : null;
  
  return (
    <div className="absolute top-4 right-4 w-72 glass-card p-4 z-50">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-yellow-400">
            Hex {coord.toUpperCase()}
          </h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
      
      <div className="mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</div>
        <div className={`text-sm font-medium ${
          hex.status === HEX_STATUS.CLAIMED ? 'text-green-400' :
          hex.status === HEX_STATUS.EXPLORED ? 'text-blue-400' : 'text-gray-500'
        }`}>
          {hex.status === HEX_STATUS.CLAIMED && `Claimed by ${kingdomName}`}
          {hex.status === HEX_STATUS.EXPLORED && 'Explored'}
          {hex.status === HEX_STATUS.UNEXPLORED && 'Unexplored (Fog of War)'}
        </div>
      </div>
      
      {workSiteInfo && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Work Site</div>
          <div className="text-sm">
            <span className="text-yellow-400">{workSiteInfo.name}</span>
            <span className="text-gray-400"> → +1 {workSiteInfo.commodity}/turn</span>
          </div>
        </div>
      )}
      
      {hex.settlement && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Settlement</div>
          <div className="text-sm text-yellow-400">{hex.settlement}</div>
        </div>
      )}
      
      {hex.notes && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Notes</div>
          <div className="text-sm text-gray-300">{hex.notes}</div>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
        {hex.status === HEX_STATUS.UNEXPLORED && (
          <button onClick={() => onAction('explore', hex, coord)}
            className="btn-secondary text-xs flex items-center gap-1">
            <Eye size={12} /> Explore
          </button>
        )}
        {hex.status === HEX_STATUS.EXPLORED && (
          <button onClick={() => onAction('claim', hex, coord)}
            className="btn-royal text-xs flex items-center gap-1">
            <Flag size={12} /> Claim Hex (1 RP)
          </button>
        )}
        {hex.status === HEX_STATUS.CLAIMED && !hex.workSite && !hex.settlement && (
          <button onClick={() => onAction('worksite', hex, coord)}
            className="btn-secondary text-xs flex items-center gap-1">
            <Hammer size={12} /> Work Site (2 RP)
          </button>
        )}
      </div>
    </div>
  );
};

// Work Site Modal
const WorkSiteModal = ({ hex, coord, onSelect, onClose }) => {
  if (!hex) return null;
  
  const options = [
    { id: 'farm', name: 'Farmland', icon: '🌾', desc: 'Produces Food' },
    { id: 'lumber', name: 'Lumber Camp', icon: '🪵', desc: 'Produces Lumber' },
    { id: 'mine', name: 'Mine', icon: '⛏️', desc: 'Produces Ore' },
    { id: 'quarry', name: 'Quarry', icon: '🪨', desc: 'Produces Stone' },
  ];
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="glass-card p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">
          Establish Work Site - {coord.toUpperCase()}
        </h3>
        <div className="space-y-2 mb-4">
          {options.map(opt => (
            <button key={opt.id} onClick={() => onSelect(opt.id)}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 hover:border-yellow-500/50 text-left flex items-center gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div>
                <div className="font-medium text-yellow-400">{opt.name}</div>
                <div className="text-xs text-gray-400">{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn-secondary w-full">Cancel</button>
      </div>
    </div>
  );
};

// Main Stolen Lands Map component
export default function StolenLandsMap({
  hexes = {},
  onHexUpdate,
  kingdomName = 'Nauthgard',
  kingdomColor = '#3333f9',
}) {
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 3500, y: 400, width: 1500, height: 900 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showWorkSiteModal, setShowWorkSiteModal] = useState(false);
  const svgRef = useRef(null);
  
  const selectedHex = selectedCoord ? hexes[selectedCoord] : null;
  
  // Handle hex click
  const handleHexClick = useCallback((hex, coord) => {
    setSelectedCoord(prev => prev === coord ? null : coord);
  }, []);
  
  // Handle actions
  const handleAction = useCallback((action, hex, coord) => {
    if (!onHexUpdate) return;
    
    switch (action) {
      case 'explore':
        onHexUpdate({ ...hex, coord, status: HEX_STATUS.EXPLORED });
        break;
      case 'claim':
        onHexUpdate({ ...hex, coord, status: HEX_STATUS.CLAIMED, faction: '1' });
        break;
      case 'worksite':
        setShowWorkSiteModal(true);
        break;
    }
  }, [onHexUpdate]);
  
  const handleWorkSiteSelect = useCallback((type) => {
    if (!selectedHex || !selectedCoord || !onHexUpdate) return;
    onHexUpdate({ ...selectedHex, coord: selectedCoord, workSite: type });
    setShowWorkSiteModal(false);
  }, [selectedHex, selectedCoord, onHexUpdate]);
  
  // Zoom
  const handleZoom = (delta) => {
    setViewBox(prev => {
      const factor = delta > 0 ? 0.8 : 1.25;
      const newWidth = Math.max(500, Math.min(4000, prev.width * factor));
      const newHeight = Math.max(300, Math.min(2200, prev.height * factor));
      const dx = (prev.width - newWidth) / 2;
      const dy = (prev.height - newHeight) / 2;
      return { x: prev.x + dx, y: prev.y + dy, width: newWidth, height: newHeight };
    });
  };
  
  // Pan
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isPanning || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = (e.clientX - panStart.x) * (viewBox.width / rect.width);
    const dy = (e.clientY - panStart.y) * (viewBox.height / rect.height);
    setViewBox(prev => ({
      ...prev,
      x: Math.max(0, Math.min(MAP_WIDTH - prev.width, prev.x - dx)),
      y: Math.max(0, Math.min(MAP_HEIGHT - prev.height, prev.y - dy)),
    }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUp = () => setIsPanning(false);
  
  const handleWheel = (e) => {
    e.preventDefault();
    handleZoom(e.deltaY);
  };
  
  // Generate all hexes
  const allHexes = useMemo(() => {
    return Object.entries(HEX_POSITIONS).map(([coord, pos]) => ({
      coord,
      position: pos,
      hex: hexes[coord] || { status: HEX_STATUS.UNEXPLORED },
    }));
  }, [hexes]);
  
  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-40 flex gap-2">
        <button onClick={() => handleZoom(-1)} className="p-2 bg-black/70 rounded hover:bg-black/90" title="Zoom In">
          <ZoomIn size={18} />
        </button>
        <button onClick={() => handleZoom(1)} className="p-2 bg-black/70 rounded hover:bg-black/90" title="Zoom Out">
          <ZoomOut size={18} />
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
            <div className="w-3 h-3 rounded bg-green-600/50" />
            <span>Explored</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-black/70" />
            <span>Fog</span>
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
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background map image */}
        <image
          href="/stolen-lands-map.png"
          x="0"
          y="0"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
        />
        
        {/* Hex overlays */}
        {allHexes.map(({ coord, position, hex }) => (
          <HexOverlay
            key={coord}
            coord={coord}
            hex={hex}
            position={position}
            isSelected={selectedCoord === coord}
            onClick={handleHexClick}
            kingdomColor={kingdomColor}
          />
        ))}
      </svg>
      
      {/* Info Panel */}
      <HexInfoPanel
        hex={selectedHex}
        coord={selectedCoord}
        onClose={() => setSelectedCoord(null)}
        onAction={handleAction}
        kingdomName={kingdomName}
      />
      
      {/* Work Site Modal */}
      {showWorkSiteModal && (
        <WorkSiteModal
          hex={selectedHex}
          coord={selectedCoord}
          onSelect={handleWorkSiteSelect}
          onClose={() => setShowWorkSiteModal(false)}
        />
      )}
    </div>
  );
}
