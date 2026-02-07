import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Home, Hammer, Wheat, Eye, Flag, Info, X, ZoomIn, ZoomOut,
  Mountain, TreePine, Tent, Store, MapPin, Building, Landmark, 
  Skull, Fish, Droplet, TreeDeciduous, Sparkles, Ghost,
  Swords, Footprints, Link2, Plus, Edit, Trash2, 
  EyeOff, Users, Navigation, Crosshair, Shovel, Gem
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
  Hammer, Home, Wheat, TreePine, Mountain, Flag, Shovel, Gem
};

// POI Marker component - now draggable
const POIMarker = ({ poi, onClick, onDragStart, onContextMenu, isDragging }) => {
  const typeInfo = POI_TYPES[poi.type] || { icon: 'Flag', color: '#999', label: 'Unknown' };
  const IconComponent = POI_ICON_MAP[typeInfo.icon] || Flag;
  
  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (onDragStart) onDragStart(poi, e);
  };
  
  const handleContextMenu = (e) => {
    if (onContextMenu) onContextMenu(e, poi);
  };
  
  return (
    <g 
      transform={`translate(${poi.left}, ${poi.top})`}
      onClick={(e) => { e.stopPropagation(); onClick && onClick(poi); }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
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
const HexOverlay = ({ coord, hex, position, isSelected, onClick, onContextMenu, getFactionColor, defaultColor }) => {
  if (!position) return null;
  
  // Position is top-left of hex bounding box (from David's tool)
  const x = position.left;
  const y = position.top;
  const cx = x + HEX_W / 2; // Center for icons
  const cy = y + HEX_H / 2;
  
  const { status, workSite, settlement, faction } = hex || {};
  
  // Get the faction color, or use default
  const factionColor = faction ? (getFactionColor?.(faction) || defaultColor) : defaultColor;
  
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
    fillColor = factionColor;
    fillOpacity = 0.3;
    strokeColor = factionColor;
    strokeWidth = 3;
  }
  
  if (isSelected) {
    strokeColor = '#D4AF37';
    strokeWidth = 4;
  }
  
  const points = getPointyTopHexPoints(x, y);
  
  return (
    <g 
      onClick={() => onClick && onClick(hex, coord)} 
      onContextMenu={(e) => onContextMenu && onContextMenu(e, hex, coord)}
      style={{ cursor: 'pointer' }}
    >
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

// Context Menu component
const ContextMenu = ({ x, y, items, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);
  
  return (
    <div 
      className="fixed z-[100] bg-gray-900/95 border border-yellow-600/30 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, idx) => (
        item.separator ? (
          <div key={idx} className="border-t border-white/10 my-1" />
        ) : item.disabled ? (
          <div key={idx} className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wide">
            {item.label}
          </div>
        ) : (
          <button
            key={idx}
            onClick={() => { item.action?.(); onClose(); }}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-yellow-600/20 flex items-center gap-2 ${item.checked ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-400'}`}
          >
            {item.color && (
              <div className="w-3 h-3 rounded" style={{ background: item.color }} />
            )}
            {item.icon && !item.color && <item.icon size={16} />}
            <span className="flex-1">{item.label}</span>
            {item.checked && <span className="text-green-400">✓</span>}
          </button>
        )
      ))}
    </div>
  );
};

// Icon option with preview
const IconOption = ({ type, isSelected, onClick }) => {
  const typeInfo = POI_TYPES[type] || { icon: 'Flag', color: '#999', label: type };
  const IconComponent = POI_ICON_MAP[typeInfo.icon] || Flag;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2 rounded transition-colors ${
        isSelected 
          ? 'bg-yellow-600/30 border border-yellow-500' 
          : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
      }`}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)', border: `2px solid ${typeInfo.color}` }}
      >
        <IconComponent size={18} color={typeInfo.color} />
      </div>
      <span className={isSelected ? 'text-yellow-400' : 'text-gray-200'}>{typeInfo.label}</span>
    </button>
  );
};

// POI Editor Modal with icon previews
const POIEditorModal = ({ poi, isNew, onSave, onDelete, onClose }) => {
  const [title, setTitle] = useState(poi?.title || '');
  const [poiType, setPOIType] = useState(poi?.type || 'camp');
  const [category, setCategory] = useState(poi?.elementType || 'building');
  
  const categories = [
    { id: 'building', label: 'Structures', icon: Building },
    { id: 'resources', label: 'Resources', icon: Wheat },
    { id: 'misc', label: 'Points of Interest', icon: MapPin },
    { id: 'armies', label: 'Creatures & Forces', icon: Swords },
  ];
  
  // Organized types with cleaner groupings
  const typesByCategory = {
    building: ['village', 'house', 'camp', 'cabane', 'mine', 'ruin', 'dolmen'],
    resources: ['farm', 'tree', 'deadtree', 'mushroom', 'rock', 'lake'],
    misc: ['sign', 'bridge', 'battle', 'footmen', 'swamp', 'hill'],
    armies: ['lizard', 'bandit', 'enemy', 'friendly', 'patrol'],
  };
  
  // When category changes, select first type in that category
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPOIType(typesByCategory[newCategory][0]);
  };
  
  const handleSave = () => {
    onSave({
      ...poi,
      title,
      type: poiType,
      elementType: category,
    });
  };
  
  const selectedTypeInfo = POI_TYPES[poiType] || { icon: 'Flag', color: '#999', label: poiType };
  const SelectedIcon = POI_ICON_MAP[selectedTypeInfo.icon] || Flag;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900/95 border border-yellow-600/30 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">
          {isNew ? 'Add New Marker' : 'Edit Marker'}
        </h3>
        
        <div className="space-y-4">
          {/* Category tabs */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Category</label>
            <div className="flex gap-1">
              {categories.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex-1 px-2 py-2 rounded text-xs flex flex-col items-center gap-1 transition-colors ${
                      category === cat.id
                        ? 'bg-yellow-600/30 border border-yellow-500 text-yellow-400'
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400'
                    }`}
                  >
                    <CatIcon size={16} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Icon type grid with previews */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Icon Type</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {typesByCategory[category]?.map(type => (
                <IconOption
                  key={type}
                  type={type}
                  isSelected={poiType === type}
                  onClick={() => setPOIType(type)}
                />
              ))}
            </div>
          </div>
          
          {/* Preview of selected marker */}
          <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded border border-gray-700">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.9)', border: `3px solid ${selectedTypeInfo.color}` }}
            >
              <SelectedIcon size={28} color={selectedTypeInfo.color} />
            </div>
            <div>
              <div className="text-sm text-gray-400">Preview</div>
              <div className="text-white font-medium">{selectedTypeInfo.label}</div>
            </div>
          </div>
          
          {/* Notes/Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title / Notes</label>
            <textarea 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white h-24"
              placeholder="Enter description or notes..."
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <button onClick={handleSave} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded">
            {isNew ? 'Add Marker' : 'Save Changes'}
          </button>
          {!isNew && onDelete && (
            <button onClick={onDelete} className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded">
              <Trash2 size={18} />
            </button>
          )}
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Stolen Lands Map component
export default function StolenLandsMap({
  hexes = {},
  factions = {},
  onHexUpdate,
  onFactionsUpdate,
  onPOIUpdate,
  kingdomName = 'Nauthgard',
  initialPOIs = null,
}) {
  // Get player faction color (default to first faction or blue)
  const getPlayerFactionColor = () => {
    const playerFaction = Object.values(factions).find(f => f.isPlayer);
    return playerFaction?.color || '#6366f1';
  };
  
  // Get faction color by ID
  const getFactionColor = (factionId) => {
    if (!factionId) return null;
    return factions[factionId]?.color || '#6366f1';
  };
  
  const [showFactionManager, setShowFactionManager] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 3500, y: 400, width: 1500, height: 900 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showWorkSiteModal, setShowWorkSiteModal] = useState(false);
  const [draggingPOI, setDraggingPOI] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, type, target }
  const [poiEditor, setPOIEditor] = useState(null); // { poi, isNew, position }
  const [visibilityFilters, setVisibilityFilters] = useState({
    building: true, resources: true, misc: true, armies: true
  });
  const [poiPositions, setPOIPositions] = useState(() => {
    // Try to load from localStorage first
    const saved = localStorage.getItem('kingdomManager_poiPositions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved POI positions', e);
      }
    }
    // Initialize with positions from POI_MARKERS or provided initialPOIs
    const pois = initialPOIs || POI_MARKERS;
    return pois.filter(p => p.faction !== '1').map((poi, idx) => ({
      ...poi,
      id: poi.id || `poi-${idx}`,
    }));
  });
  
  // Party token position
  const [partyPosition, setPartyPosition] = useState(() => {
    const saved = localStorage.getItem('kingdomManager_partyPosition');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { x: 4200, y: 1300 }; // Default near Lakewatch
  });
  const [draggingParty, setDraggingParty] = useState(false);
  
  const svgRef = useRef(null);
  
  // Save POI positions to localStorage when they change
  useEffect(() => {
    localStorage.setItem('kingdomManager_poiPositions', JSON.stringify(poiPositions));
  }, [poiPositions]);
  
  // Save party position to localStorage
  useEffect(() => {
    localStorage.setItem('kingdomManager_partyPosition', JSON.stringify(partyPosition));
  }, [partyPosition]);
  
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
  
  // Handle party token drag
  const handlePartyDragStart = useCallback((e) => {
    e.stopPropagation();
    setDraggingParty(true);
  }, []);
  
  const handlePartyDrag = useCallback((e) => {
    if (!draggingParty || !svgRef.current) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setPartyPosition({ x: svgPt.x, y: svgPt.y });
  }, [draggingParty]);
  
  const handlePartyDragEnd = useCallback(() => {
    setDraggingParty(false);
  }, []);
  
  // Handle right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    
    const svg = svgRef.current;
    if (!svg) return;
    
    // Convert screen coords to SVG coords
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      svgX: svgPt.x,
      svgY: svgPt.y,
      type: 'map', // Could be 'map', 'hex', or 'poi' depending on target
    });
  }, []);
  
  // Handle POI right-click
  const handlePOIContextMenu = useCallback((e, poi) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'poi',
      target: poi,
    });
  }, []);
  
  // Handle hex right-click
  const handleHexContextMenu = useCallback((e, hex, coord) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: 'hex',
      target: hex,
      coord: coord,
    });
  }, []);
  
  // Add new POI
  const handleAddPOI = useCallback((position) => {
    setPOIEditor({
      poi: {
        id: `poi-${Date.now()}`,
        type: 'camp',
        elementType: 'building',
        title: '',
        left: position.x,
        top: position.y,
        faction: 'None',
      },
      isNew: true,
    });
  }, []);
  
  // Edit existing POI
  const handleEditPOI = useCallback((poi) => {
    setPOIEditor({ poi, isNew: false });
  }, []);
  
  // Save POI (new or edited)
  const handleSavePOI = useCallback((updatedPOI) => {
    setPOIPositions(prev => {
      const exists = prev.find(p => p.id === updatedPOI.id);
      if (exists) {
        return prev.map(p => p.id === updatedPOI.id ? updatedPOI : p);
      } else {
        return [...prev, updatedPOI];
      }
    });
    setPOIEditor(null);
  }, []);
  
  // Delete POI
  const handleDeletePOI = useCallback((poiId) => {
    setPOIPositions(prev => prev.filter(p => p.id !== poiId));
    setPOIEditor(null);
    setSelectedPOI(null);
  }, []);
  
  // Get context menu items based on type
  const getContextMenuItems = useCallback(() => {
    if (!contextMenu) return [];
    
    if (contextMenu.type === 'poi') {
      return [
        { icon: Edit, label: 'Edit Marker', action: () => handleEditPOI(contextMenu.target) },
        { icon: Trash2, label: 'Delete Marker', action: () => handleDeletePOI(contextMenu.target.id) },
      ];
    }
    
    // Hex context menu
    if (contextMenu.type === 'hex') {
      const hex = contextMenu.target;
      const coord = contextMenu.coord;
      const items = [];
      
      // Status changes
      if (hex?.status !== HEX_STATUS.EXPLORED && hex?.status !== HEX_STATUS.CLAIMED) {
        items.push({ icon: Eye, label: 'Mark Explored', action: () => onHexUpdate && onHexUpdate({ ...hex, coord, status: HEX_STATUS.EXPLORED }) });
      }
      if (hex?.status === HEX_STATUS.EXPLORED) {
        items.push({ icon: Flag, label: 'Claim Hex', action: () => onHexUpdate && onHexUpdate({ ...hex, coord, status: HEX_STATUS.CLAIMED, faction: '1' }) });
      }
      
      // Faction assignment (for claimed hexes)
      if (hex?.status === HEX_STATUS.CLAIMED && Object.keys(factions).length > 0) {
        items.push({ separator: true });
        items.push({ label: 'Assign to Faction:', disabled: true });
        Object.values(factions).forEach(faction => {
          items.push({
            icon: Flag,
            label: faction.name,
            color: faction.color,
            checked: hex?.faction === faction.id,
            action: () => onHexUpdate && onHexUpdate({ ...hex, coord, faction: faction.id })
          });
        });
      }
      
      return items;
    }
    
    // Map context menu (empty space)
    return [
      { icon: Plus, label: 'Add Marker Here', action: () => handleAddPOI({ x: contextMenu.svgX, y: contextMenu.svgY }) },
      { separator: true },
      { icon: Navigation, label: 'Move Party Here', action: () => setPartyPosition({ x: contextMenu.svgX, y: contextMenu.svgY }) },
    ];
  }, [contextMenu, handleEditPOI, handleDeletePOI, handleAddPOI, factions, onHexUpdate]);
  
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
  
  // Zoom (scroll up = zoom in, scroll down = zoom out)
  const handleZoom = (delta) => {
    setViewBox(prev => {
      const factor = delta > 0 ? 1.25 : 0.8;
      const newWidth = Math.max(500, Math.min(4000, prev.width * factor));
      const newHeight = Math.max(300, Math.min(2200, prev.height * factor));
      const dx = (prev.width - newWidth) / 2;
      const dy = (prev.height - newHeight) / 2;
      return { x: prev.x + dx, y: prev.y + dy, width: newWidth, height: newHeight };
    });
  };
  
  // Pan (only if not dragging POI or party)
  const handleMouseDown = (e) => {
    if (e.button === 0 && !draggingPOI && !draggingParty) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseMove = (e) => {
    // Handle party dragging
    if (draggingParty) {
      handlePartyDrag(e);
      return;
    }
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
    if (draggingParty) {
      handlePartyDragEnd();
    }
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
        <div className="flex items-center gap-4 flex-wrap">
          {Object.values(factions).map(faction => (
            <div key={faction.id} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: faction.color }} />
              <span>{faction.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-600/50" />
            <span>Explored</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-black/70" />
            <span>Fog</span>
          </div>
          <button 
            onClick={() => setShowFactionManager(true)}
            className="ml-2 px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/40 rounded text-yellow-400"
          >
            + Factions
          </button>
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
        onContextMenu={handleContextMenu}
        style={{ cursor: draggingPOI ? 'grabbing' : isPanning ? 'grabbing' : 'grab' }}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Background map image */}
        <image
          href={`${import.meta.env.BASE_URL}stolen-lands-map.png`}
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
            onContextMenu={handleHexContextMenu}
            getFactionColor={getFactionColor}
            defaultColor={getPlayerFactionColor()}
          />
        ))}
        
        {/* POI Markers - draggable, filtered by visibility */}
        {poiPositions
          .filter(poi => visibilityFilters[poi.elementType] !== false)
          .map((poi) => (
            <POIMarker
              key={poi.id}
              poi={poi}
              onClick={handlePOIClick}
              onDragStart={handlePOIDragStart}
              onContextMenu={handlePOIContextMenu}
              isDragging={draggingPOI?.id === poi.id}
            />
          ))}
        
        {/* Party Token */}
        <g 
          transform={`translate(${partyPosition.x}, ${partyPosition.y})`}
          onMouseDown={handlePartyDragStart}
          style={{ cursor: draggingParty ? 'grabbing' : 'grab' }}
        >
          {/* Outer glow */}
          <circle cx="0" cy="0" r="30" fill="rgba(255,215,0,0.3)" />
          {/* Main circle */}
          <circle 
            cx="0" cy="0" r="24" 
            fill={draggingParty ? '#FFD700' : '#1a1a2e'} 
            stroke="#FFD700" 
            strokeWidth={draggingParty ? 5 : 3} 
          />
          {/* Icon - Users/Party */}
          <foreignObject x="-16" y="-16" width="32" height="32">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <Users size={26} color="#FFD700" strokeWidth={2} />
            </div>
          </foreignObject>
          {/* Label */}
          <text
            y="42"
            textAnchor="middle"
            fontSize="14"
            fill="#FFD700"
            fontWeight="bold"
            style={{ textShadow: '1px 1px 2px black, -1px -1px 2px black' }}
          >
            PARTY
          </text>
        </g>
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
      
      {/* Visibility Toggles */}
      <div className="absolute top-4 right-4 z-40 bg-gray-900/90 rounded-lg p-3 border border-white/10">
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <Eye size={12} /> Visibility
        </div>
        <div className="space-y-1">
          {[
            { id: 'building', label: 'Structures', icon: Building },
            { id: 'resources', label: 'Resources', icon: Wheat },
            { id: 'misc', label: 'Points of Interest', icon: MapPin },
            { id: 'armies', label: 'Creatures', icon: Swords },
          ].map(cat => (
            <label key={cat.id} className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={visibilityFilters[cat.id]}
                onChange={(e) => setVisibilityFilters(prev => ({ ...prev, [cat.id]: e.target.checked }))}
                className="rounded"
              />
              <cat.icon size={12} className={visibilityFilters[cat.id] ? 'text-yellow-400' : 'text-gray-500'} />
              <span className={visibilityFilters[cat.id] ? 'text-white' : 'text-gray-500'}>{cat.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {/* POI Editor Modal */}
      {poiEditor && (
        <POIEditorModal
          poi={poiEditor.poi}
          isNew={poiEditor.isNew}
          onSave={handleSavePOI}
          onDelete={poiEditor.isNew ? null : () => handleDeletePOI(poiEditor.poi.id)}
          onClose={() => setPOIEditor(null)}
        />
      )}
      
      {/* Faction Manager Modal */}
      {showFactionManager && (
        <FactionManager
          factions={factions}
          onUpdate={(updatedFactions) => {
            if (onFactionsUpdate) onFactionsUpdate(updatedFactions);
          }}
          onClose={() => setShowFactionManager(false)}
        />
      )}
    </div>
  );
}

// ============================================
// FACTION MANAGER MODAL
// ============================================
function FactionManager({ factions, onUpdate, onClose }) {
  const [localFactions, setLocalFactions] = useState({ ...factions });
  const [editingId, setEditingId] = useState(null);
  const [newFaction, setNewFaction] = useState({ name: '', color: '#ef4444', isPlayer: false });
  
  const PRESET_COLORS = [
    '#6366f1', // Indigo (player default)
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#6b7280', // Gray
    '#1e293b', // Dark
  ];
  
  const handleAddFaction = () => {
    if (!newFaction.name.trim()) return;
    const id = `faction-${Date.now()}`;
    setLocalFactions(prev => ({
      ...prev,
      [id]: { id, ...newFaction, name: newFaction.name.trim() }
    }));
    setNewFaction({ name: '', color: '#ef4444', isPlayer: false });
  };
  
  const handleUpdateFaction = (id, updates) => {
    setLocalFactions(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };
  
  const handleDeleteFaction = (id) => {
    if (localFactions[id]?.isPlayer) {
      alert("Cannot delete the player faction!");
      return;
    }
    setLocalFactions(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  };
  
  const handleSave = () => {
    onUpdate(localFactions);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900/95 border border-yellow-600/30 rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">Manage Factions</h3>
        
        {/* Existing Factions */}
        <div className="space-y-3 mb-6">
          {Object.values(localFactions).map(faction => (
            <div key={faction.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              {/* Color picker */}
              <input
                type="color"
                value={faction.color}
                onChange={(e) => handleUpdateFaction(faction.id, { color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
              />
              
              {/* Name */}
              {editingId === faction.id ? (
                <input
                  type="text"
                  value={faction.name}
                  onChange={(e) => handleUpdateFaction(faction.id, { name: e.target.value })}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                  autoFocus
                />
              ) : (
                <span 
                  className="flex-1 text-white cursor-pointer hover:text-yellow-400"
                  onClick={() => setEditingId(faction.id)}
                >
                  {faction.name}
                </span>
              )}
              
              {/* Player badge */}
              {faction.isPlayer && (
                <span className="text-xs bg-yellow-600 text-black px-2 py-0.5 rounded">PLAYER</span>
              )}
              
              {/* Delete button */}
              {!faction.isPlayer && (
                <button
                  onClick={() => handleDeleteFaction(faction.id)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* Add New Faction */}
        <div className="border-t border-gray-700 pt-4 mb-4">
          <h4 className="text-sm text-gray-400 mb-2">Add New Faction</h4>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newFaction.color}
              onChange={(e) => setNewFaction(prev => ({ ...prev, color: e.target.value }))}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={newFaction.name}
              onChange={(e) => setNewFaction(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Faction name..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAddFaction()}
            />
            <button
              onClick={handleAddFaction}
              disabled={!newFaction.name.trim()}
              className={`px-3 py-2 rounded ${newFaction.name.trim() ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-700 text-gray-500'}`}
            >
              Add
            </button>
          </div>
          
          {/* Preset colors */}
          <div className="flex gap-1 mt-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setNewFaction(prev => ({ ...prev, color }))}
                className={`w-6 h-6 rounded ${newFaction.color === color ? 'ring-2 ring-white' : ''}`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-medium py-2 px-4 rounded"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
