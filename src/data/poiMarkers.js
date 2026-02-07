// POI Markers extracted from nauthgard-map.json
// These are absolute pixel positions on the map image

export const POI_TYPES = {
  // Structures
  village: { icon: 'Building', color: '#D4AF37', label: 'Settlement' },
  house: { icon: 'Home', color: '#CD853F', label: 'House/Building' },
  camp: { icon: 'Tent', color: '#FF6B35', label: 'Camp' },
  cabane: { icon: 'Store', color: '#8B4513', label: 'Hut/Shack' },
  mine: { icon: 'Pickaxe', color: '#708090', label: 'Mine' },
  ruin: { icon: 'Skull', color: '#696969', label: 'Ruin/Dungeon' },
  dolmen: { icon: 'Landmark', color: '#6B5B95', label: 'Temple/Shrine' },
  
  // Resources
  farm: { icon: 'Wheat', color: '#DAA520', label: 'Farmland' },
  tree: { icon: 'TreePine', color: '#228B22', label: 'Lumber Camp' },
  deadtree: { icon: 'TreeDeciduous', color: '#8B4513', label: 'Notable Tree' },
  mushroom: { icon: 'Sparkles', color: '#9932CC', label: 'Magic Resource' },
  rock: { icon: 'Mountain', color: '#A0A0A0', label: 'Quarry' },
  lake: { icon: 'Fish', color: '#4169E1', label: 'Fishing Spot' },
  
  // Points of Interest
  sign: { icon: 'MapPin', color: '#DEB887', label: 'Location Marker' },
  bridge: { icon: 'Link2', color: '#A0522D', label: 'Bridge/Crossing' },
  battle: { icon: 'Swords', color: '#DC143C', label: 'Battle Site' },
  footmen: { icon: 'Footprints', color: '#B22222', label: 'Encounter' },
  swamp: { icon: 'Droplet', color: '#556B2F', label: 'Swamp/Hazard' },
  hill: { icon: 'Mountain', color: '#8FBC8F', label: 'Hill/Island' },
  
  // Creatures & Forces
  lizard: { icon: 'Ghost', color: '#2E8B57', label: 'Creature Lair' },
};

// All POI markers from David's map (buildings, resources, misc, armies combined)
export const POI_MARKERS = [
  // Buildings
  { type: 'camp', top: 751.889, left: 4129.44, title: 'Bandit Camp - (where Hans Gruber came from)', faction: 'None' },
  { type: 'cabane', top: 358, left: 4821, title: 'Smoking Hut - Alchemist - sells potions', faction: 'None' },
  { type: 'sign', top: 824, left: 4875, title: "Nettle's crossing - dude wants us to kill the Staglord", faction: 'None' },
  { type: 'camp', top: 755, left: 4308.2, title: 'Worksite (mine)', faction: '1' },
  { type: 'camp', top: 923, left: 4465, title: 'Worksite (lumber)', faction: '1' },
  { type: 'village', top: 1327, left: 4215, title: 'Fort on a hill with wooden palisades. (60-80 ft wide)', faction: '1' },
  { type: 'dolmen', top: 716, left: 3883, title: 'Corrupted Temple - Druids', faction: 'None' },
  { type: 'mine', top: 740, left: 4535, title: 'Worksite - 2 ore per turn', faction: '1' },
  { type: 'lake', top: 1607, left: 5339.2, title: 'Lake Silverstep - Good fishing', faction: 'None' },
  { type: 'swamp', top: 1302.8, left: 3632.2, title: 'Swamps and marshlands in this direction', faction: 'None' },
  { type: 'hill', top: 1770, left: 4040, title: 'Island (Candlemeer) also haunted apparently', faction: 'None' },
  { type: 'house', top: 1523.47, left: 4120.8, title: 'Hag - Elga Vernex', faction: 'None' },
  { type: 'ruin', top: 1346.8, left: 4701.8, title: 'Gravestone, skeleton, fire sword', faction: 'None' },
  
  // Resources
  { type: 'mushroom', top: 530, left: 4230, title: 'Magic radish tree', faction: 'None' },
  { type: 'deadtree', top: 556, left: 4681, title: 'Claw Tree Map location - X marks the spot!', faction: 'None' },
  { type: 'tree', top: 759, left: 4591.8, title: 'Old Sycamore tree - wedding ring?', faction: 'None' },
  { type: 'deadtree', top: 1120, left: 4116.8, title: 'Fang Berries', faction: 'None' },
  { type: 'mine', top: 711, left: 4374, title: 'Gold Mine', faction: '1' },
  { type: 'farm', top: 1109, left: 4186.5, title: 'Farmland', faction: '1' },
  { type: 'footmen', top: 690, left: 4610, title: 'Kobold body found - ambush site, killed within last 2 days, torn up chain mail, no other items of value', faction: '1' },
  { type: 'mushroom', top: 1950.47, left: 4575.8, title: 'Hags Mushrooms are around here somewhere', faction: 'None' },
  
  // Misc
  { type: 'lizard', top: 478, left: 4274, title: "Kobolds - They wanted to know if we liked radishes, I said yes. They didn't like that...", faction: 'None' },
  { type: 'battle', top: 717, left: 5010, title: 'Horse skeletons and other bones - died from natural causes? - nope, died from deadly spiders', faction: 'None' },
  { type: 'bridge', top: 950, left: 4219, title: 'Rope over bridge over troubled waters', faction: 'None' },
  { type: 'rock', top: 1330, left: 4494, title: 'Quarry Worksite', faction: '1' },
  { type: 'farm', top: 1107, left: 4377.75, title: 'Farm', faction: '1' },
  
  // Armies
  { type: 'lizard', top: 1767, left: 3819, title: 'Lizard Men - Almost blew my cover... phew', faction: 'None' },
];
