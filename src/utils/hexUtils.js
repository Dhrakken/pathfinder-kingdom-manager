// ============================================
// HEX MAP UTILITIES
// Coordinate system: Letter-Number (a1, b2, c19, etc.)
// Letters = rows (a-j), Numbers = columns (1-28)
// Offset hex grid (odd rows shifted right)
// ============================================

// Hex geometry constants
export const HEX_SIZE = 40; // radius of hex
export const HEX_WIDTH = HEX_SIZE * 2;
export const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

// Convert letter to row number (a=0, b=1, etc.)
export const letterToRow = (letter) => letter.toLowerCase().charCodeAt(0) - 97;
export const rowToLetter = (row) => String.fromCharCode(97 + row);

// Parse coordinate string "a1" to {row, col}
export const parseCoord = (coord) => {
  const match = coord.match(/^([a-z])(\d+)$/i);
  if (!match) return null;
  return {
    row: letterToRow(match[1]),
    col: parseInt(match[2], 10) - 1, // 0-indexed
  };
};

// Build coordinate string from row, col
export const buildCoord = (row, col) => `${rowToLetter(row)}${col + 1}`;

// Get pixel position for hex center (offset coordinates)
export const hexToPixel = (row, col) => {
  const x = HEX_SIZE * 1.5 * col;
  const y = HEX_HEIGHT * (row + (col % 2 === 1 ? 0.5 : 0));
  return { x, y };
};

// Get hex corners for SVG polygon (pointy-top hex)
export const getHexPoints = (cx, cy, size = HEX_SIZE) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(' ');
};

// Get neighboring hex coordinates
export const getNeighbors = (row, col) => {
  const isOddCol = col % 2 === 1;
  const neighbors = [
    { row: row - 1, col: col },     // North
    { row: row + 1, col: col },     // South
    { row: isOddCol ? row : row - 1, col: col - 1 },  // NW
    { row: isOddCol ? row + 1 : row, col: col - 1 },  // SW
    { row: isOddCol ? row : row - 1, col: col + 1 },  // NE
    { row: isOddCol ? row + 1 : row, col: col + 1 },  // SE
  ];
  return neighbors
    .filter(n => n.row >= 0 && n.col >= 0)
    .map(n => buildCoord(n.row, n.col));
};

// Calculate distance between two hexes
export const hexDistance = (coord1, coord2) => {
  const p1 = parseCoord(coord1);
  const p2 = parseCoord(coord2);
  if (!p1 || !p2) return Infinity;
  
  // Convert to cube coordinates for distance calc
  const toCube = (row, col) => {
    const x = col;
    const z = row - (col - (col & 1)) / 2;
    const y = -x - z;
    return { x, y, z };
  };
  
  const c1 = toCube(p1.row, p1.col);
  const c2 = toCube(p2.row, p2.col);
  
  return Math.max(
    Math.abs(c1.x - c2.x),
    Math.abs(c1.y - c2.y),
    Math.abs(c1.z - c2.z)
  );
};

// Terrain types with colors
export const TERRAIN_TYPES = {
  plains: { name: 'Plains', color: '#90B860', icon: '🌾' },
  forest: { name: 'Forest', color: '#2D5A27', icon: '🌲' },
  hills: { name: 'Hills', color: '#A67C52', icon: '⛰️' },
  mountains: { name: 'Mountains', color: '#6B6B6B', icon: '🏔️' },
  swamp: { name: 'Swamp', color: '#5C4033', icon: '🌿' },
  water: { name: 'Water', color: '#4A90D9', icon: '🌊' },
  lake: { name: 'Lake', color: '#3B7DD8', icon: '💧' },
  river: { name: 'River', color: '#5BA3E0', icon: '🏞️' },
};

// Hex status types
export const HEX_STATUS = {
  UNEXPLORED: 'unexplored',
  EXPLORED: 'explored',
  CLAIMED: 'claimed',
};

// Work site types
export const WORK_SITE_TYPES = {
  farm: { name: 'Farmland', commodity: 'food', icon: '🌾' },
  lumber: { name: 'Lumber Camp', commodity: 'lumber', icon: '🪵' },
  mine: { name: 'Mine', commodity: 'ore', icon: '⛏️' },
  quarry: { name: 'Quarry', commodity: 'stone', icon: '🪨' },
};

// Parse imported map data from David's tool
export const parseImportedMapData = (mapJson) => {
  const hexes = {};
  
  // Parse fog of war data for hex status
  if (mapJson.fog) {
    mapJson.fog.forEach(fogHex => {
      const coord = fogHex.name;
      if (!coord) return;
      
      const isExplored = fogHex.class?.includes('visited');
      const isClaimed = fogHex.faction && fogHex.faction !== 'None' && fogHex.faction !== 'Select Faction';
      
      hexes[coord] = {
        coord,
        status: isClaimed ? HEX_STATUS.CLAIMED : isExplored ? HEX_STATUS.EXPLORED : HEX_STATUS.UNEXPLORED,
        faction: isClaimed ? fogHex.faction : null,
        terrain: 'plains', // Default, can be enhanced
        features: [],
        workSite: null,
        settlement: null,
        notes: '',
      };
    });
  }
  
  // Parse buildings/features
  if (mapJson.building) {
    mapJson.building.forEach(building => {
      // Find which hex this building is in based on position
      // This is approximate - we'd need to reverse the pixel position
      // For now, store as a feature list
    });
  }
  
  // Parse resources
  if (mapJson.resources) {
    mapJson.resources.forEach(resource => {
      // Similar to buildings
    });
  }
  
  return {
    hexes,
    factions: mapJson.factions || [],
    player: mapJson.player || { x: 0, y: 0 },
  };
};

// Generate a grid of hexes for the Stolen Lands
// Standard Kingmaker map is about 10 rows (a-j) by 28 columns
export const generateHexGrid = (rows = 10, cols = 28) => {
  const hexes = {};
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const coord = buildCoord(row, col);
      hexes[coord] = {
        coord,
        status: HEX_STATUS.UNEXPLORED,
        faction: null,
        terrain: 'plains',
        features: [],
        workSite: null,
        settlement: null,
        notes: '',
      };
    }
  }
  return hexes;
};

export default {
  HEX_SIZE,
  HEX_WIDTH,
  HEX_HEIGHT,
  parseCoord,
  buildCoord,
  hexToPixel,
  getHexPoints,
  getNeighbors,
  hexDistance,
  TERRAIN_TYPES,
  HEX_STATUS,
  WORK_SITE_TYPES,
  parseImportedMapData,
  generateHexGrid,
};
