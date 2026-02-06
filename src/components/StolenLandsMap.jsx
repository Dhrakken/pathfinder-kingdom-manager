import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Home, Hammer, Wheat, Eye, Flag, Info, X, ZoomIn, ZoomOut,
  Mountain, TreePine, Tent, Store, MapPin, Building, Landmark, 
  Skull, Fish, Droplet, TreeDeciduous, Sparkles, Ghost,
  Swords, Footprints, Link2
} from 'lucide-react';
import { HEX_POSITIONS, MAP_WIDTH, MAP_HEIGHT, HEX_WIDTH, HEX_HEIGHT } from '../data/hexPositions.js';
import { HEX_STATUS, WORK_SITE_TYPES, TERRAIN_TYPES } from '../utils/hexUtils.js';
import { POI_MARKERS, POI_TYPES } from '../data/poiMarkers.js';

// ============================================
// STOLEN LANDS MAP - With Background Image
// ============================================

// David's fog CSS: width=230px, height=264px, pointy-top hex
// clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)
const HEX_W = 230;
const HEX_H = 264;

// Generate pointy-top hex points matching David's CSS clip-path
const getPointyTopHexPoints = (x, y) => {
  // Points relative to top-left corner of bounding box (230x264)
  return [
    `${x + HEX_W * 0.5},${y}`,           // 50% 0% - top point
    `${x + HEX_W},${y + HEX_H * 0.25}`,  // 100% 25% - top-right
    `${x + HEX_W},${y + HEX_H * 0.75}`,  // 100% 75% - bottom-right
    `${x + HEX_W * 0.5},${y + HEX_H}`,   // 50% 100% - bottom point
    `${x},${y + HEX_H * 0.75}`,          // 0% 75% - bottom-left
    `${x},${y + HEX_H * 0.25}`,          // 0% 25% - top-left
  ].join(' ');
};

// Icon mapping for POI markers
const POI_ICON_MAP = {
  Tent, Store, MapPin, Building, Landmark, Skull, Fish, Droplet, 
  TreeDeciduous, Sparkles, Ghost, Swords, Footprints, Link2,
  Hammer, Home, Wheat, TreePine, Mountain
};

// POI Marker component - now draggable
const POIMarker = ({ poi, onClick, onDragStart, isDragging }) => {
  const typeInfo = POI_TYPES[poi.type] || { icon: 'Flag', color: '#999', label: 'Unknown' };
  const IconComponent = POI_ICON_MAP[typeInfo.icon] || Flag;
  
  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(poi, e);
  };
  
  return (
    <g 
      transform={`translate(${poi.left}, ${poi.top})`}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(poi); }}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      className="poi-marker"
    >
      {/* Background circle */}
      <circle 
        cx="0" cy="0" r="22" 
        fill={isDragging ? 'rgba(50,50,80,0.95)' : 'rgba(0,0,0,0.9)'} 
        stroke={isDragging ? '#FFD700' : typeInfo.color} 
        strokeWidth={isDragging ? 4 : 3} 
      />
      {/* Icon */}
      <foreignObject x="-14" y="-14" width="28" height="28">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <IconComponent size={22} color={typeInfo.color} strokeWidth={2} />
        </div>
      </foreignObject>
    </g>
  );
};

// Single hex overlay
const HexOverlay = ({ coord, hex, position, isSelected, onClick, kingdomColor }) => {
  if (!position) return null;
  
  // Position is top-left of hex bounding box (from David's tool)
  const x = position.left;
  const y = position.top;
  const cx = x + HEX_W / 2; // Center for icons
  const cy = y + HEX_H / 2;
  
  const { status, workSite, settlement, faction } = hex || {};
  
  // Determine fill based on status
  let fillColor = 'transparent';
  let fillOpacity = 0;
  let strokeColor = 'transparent';
  let strokeWidth = 0;
  
  if (status === HEX_STATUS.UNEXPLORED) {
    fillColor = '#1a1a2e';
    fillOpacity = 1.0; // Fully opaque fog
  } else if (status === HEX_STATUS.EXPLORED) {
    fillColor = '#22c55e';
    fillOpacity = 0.15;
    strokeColor = '#22c55e';
    strokeWidth = 2;
  } else if (status === HEX_STATUS.CLAIMED) {
    fillColor = kingdomColor;
    fillOpacity = 0.3;
    strokeColor = kingdomColor;
    strokeWidth = 3;
  }
  
  if (isSelected) {
    strokeColor = '#D4AF37';
    strokeWidth = 4;
  }
  
  const points = getPointyTopHexPoints(x, y);
  
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
      
      {/* Settlement icon - EXTRA LARGE */}
      {settlement && (
        <g transform={`translate(${cx - 28}, ${cy - 28})`}>
          <circle cx="28" cy="28" r="32" fill="#2d004d" stroke="#D4AF37" strokeWidth="3" />
          <Home x="8" y="8" size={40} stroke="#D4AF37" strokeWidth={2} />
        </g>
      )}
      
      {/* Work site icon - LARGE */}
      {workSite && !settlement && (
        <g transform={`translate(${cx - 22}, ${cy - 22})`}>
          <circle cx="22" cy="22" r="26" fill="rgba(0,0,0,0.8)" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          {workSite === 'farm' && <Wheat x="6" y="6" size={32} stroke="#FFA500" strokeWidth={2} />}
          {workSite === 'lumber' && <TreePine x="6" y="6" size={32} stroke="#228B22" strokeWidth={2} />}
          {workSite === 'mine' && <Hammer x="6" y="6" size={32} stroke="#A0A0A0" strokeWidth={2} />}
          {workSite === 'quarry' && <Mountain x="6" y="6" size={32} stroke="#808080" strokeWidth={2} />}
        </g>
      )}
      
      {/* Notes indicator - small scroll icon in top-right corner */}
      {hex?.notes && (
        <g transform={`translate(${cx + HEX_W/4}, ${cy - HEX_H/4})`}>
          <circle cx="0" cy="0" r="14" fill="rgba(255,200,50,0.9)" stroke="#333" strokeWidth="1" />
          <Info x="-8" y="-8" size={16} stroke="#333" strokeWidth={2} />
        </g>
      )}
      
      {/* Coordinate label - CENTERED in hex (offset down if icon present) */}
      <text
        x={cx}
        y={(settlement || workSite || hex?.notes) ? cy + HEX_H * 0.32 : cy + 6}
        textAnchor="middle"
        fontSize="18"
        fill="rgba(255,255,255,0.9)"
        fontWeight="bold"
        style={{ 
          textShadow: '2px 2px 3px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.7)',
          pointerEvents: 'none'
        }}
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
    <div className="absolute top-4 right-4 w-72 p-4 z-50 rounded-lg border border-yellow-600/30" style={{ backgroundColor: 'rgba(15, 15, 25, 0.95)' }}>
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
  onPOIUpdate,
  kingdomName = 'Nauthgard',
  kingdomColor = '#3333f9',
  initialPOIs = null,
}) {
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 3500, y: 400, width: 1500, height: 900 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showWorkSiteModal, setShowWorkSiteModal] = useState(false);
  const [draggingPOI, setDraggingPOI] = useState(null);
  const [poiPositions, setPOIPositions] = useState(() => {
    // Initialize with positions from POI_MARKERS or provided initialPOIs
    const pois = initialPOIs || POI_MARKERS;
    return pois.filter(p => p.faction !== '1').map((poi, idx) => ({
      ...poi,
      id: poi.id || `poi-${idx}`,
    }));
  });
  const svgRef = useRef(null);
  
  const selectedHex = selectedCoord ? hexes[selectedCoord] : null;
  
  // Handle POI click
  const handlePOIClick = useCallback((poi) => {
    if (draggingPOI) return; // Don't select while dragging
    setSelectedCoord(null);
    setSelectedPOI(prev => prev?.id === poi.id ? null : poi);
  }, [draggingPOI]);
  
  // Handle POI drag start
  const handlePOIDragStart = useCallback((poi, e) => {
    setDraggingPOI(poi);
    setSelectedPOI(null);
  }, []);
  
  // Handle POI drag (in mouse move)
  const handlePOIDrag = useCallback((e) => {
    if (!draggingPOI || !svgRef.current) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setPOIPositions(prev => prev.map(p => 
      p.id === draggingPOI.id 
        ? { ...p, left: svgPt.x, top: svgPt.y }
        : p
    ));
  }, [draggingPOI]);
  
  // Handle POI drag end
  const handlePOIDragEnd = useCallback(() => {
    if (draggingPOI && onPOIUpdate) {
      const updatedPOI = poiPositions.find(p => p.id === draggingPOI.id);
      if (updatedPOI) onPOIUpdate(updatedPOI);
    }
    setDraggingPOI(null);
  }, [draggingPOI, poiPositions, onPOIUpdate]);
  
  // Handle hex click
  const handleHexClick = useCallback((hex, coord) => {
    setSelectedPOI(null); // Deselect POI
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
  
  // Pan (only if not dragging POI)
  const handleMouseDown = (e) => {
    if (e.button === 0 && !draggingPOI) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e) => {
    // Handle POI dragging
    if (draggingPOI) {
      handlePOIDrag(e);
      return;
    }
    // Handle map panning
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
  
  const handleMouseUp = () => {
    if (draggingPOI) {
      handlePOIDragEnd();
    }
    setIsPanning(false);
  };
  
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
        style={{ cursor: draggingPOI ? 'grabbing' : isPanning ? 'grabbing' : 'grab' }}
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
        
        {/* POI Markers - draggable */}
        {poiPositions.map((poi) => (
          <POIMarker
            key={poi.id}
            poi={poi}
            onClick={handlePOIClick}
            onDragStart={handlePOIDragStart}
            isDragging={draggingPOI?.id === poi.id}
          />
        ))}
      </svg>
      
      {/* Hex Info Panel */}
      <HexInfoPanel
        hex={selectedHex}
        coord={selectedCoord}
        onClose={() => setSelectedCoord(null)}
        onAction={handleAction}
        kingdomName={kingdomName}
      />
      
      {/* POI Info Panel */}
      {selectedPOI && (
        <div className="absolute top-4 right-4 w-72 p-4 z-50 rounded-lg border border-yellow-600/30" style={{ backgroundColor: 'rgba(15, 15, 25, 0.95)' }}>
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-yellow-400">
              {POI_TYPES[selectedPOI.type]?.label || 'Point of Interest'}
            </h3>
            <button onClick={() => setSelectedPOI(null)} className="text-gray-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="text-sm text-gray-300">{selectedPOI.title}</div>
          {selectedPOI.faction === '1' && (
            <div className="mt-2 text-xs text-green-400">✓ Controlled by {kingdomName}</div>
          )}
        </div>
      )}
      
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
