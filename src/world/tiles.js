// Tile definitions. The map is just a 2D array of these tile ids.
export const TILES = {
  GRASS:    { id: 0,  name: 'grass',  walk: true,  color: '#3a7a3b', alt: '#2f6a30' },
  TREE:     { id: 1,  name: 'tree',   walk: false, color: '#1a3a1a' },
  WATER:    { id: 2,  name: 'water',  walk: false, color: '#1a4a7a', alt: '#2255a0' },
  PATH:     { id: 3,  name: 'path',   walk: true,  color: '#a08a5f', alt: '#8a724f' },
  STONE:    { id: 4,  name: 'stone',  walk: false, color: '#5a5a6a' },
  SAND:     { id: 5,  name: 'sand',   walk: true,  color: '#d4b878', alt: '#bfa367' },
  FLOWER:   { id: 6,  name: 'flower', walk: true,  color: '#3a7a3b' },
  COBBLE:   { id: 7,  name: 'cobble', walk: true,  color: '#7a7a85', alt: '#6f6f7a' },
  WALL:     { id: 8,  name: 'wall',   walk: false, color: '#6a4a30' },
  DOOR:     { id: 9,  name: 'door',   walk: true,  color: '#4a2a10' },
  ROOF:     { id: 10, name: 'roof',   walk: false, color: '#7a3030' },
  CFLOOR:   { id: 11, name: 'cfloor', walk: true,  color: '#2a2530', alt: '#252028' },
  CWALL:    { id: 12, name: 'cwall',  walk: false, color: '#1a1620' },
  RUG:      { id: 13, name: 'rug',    walk: true,  color: '#8a3030', alt: '#7a2a2a' },
  CAVE_MOUTH: { id: 14, name: 'cave_mouth', walk: true, color: '#0a0608' },
  // ---- Town props -------------------------------------------------------
  BUSH:     { id: 15, name: 'bush',     walk: false, color: '#2a5a2a' }, // small collider in renderer
  BARREL:   { id: 16, name: 'barrel',   walk: false, color: '#5a3a18' },
  CRATE:    { id: 17, name: 'crate',    walk: false, color: '#7a5028' },
  FENCE:    { id: 18, name: 'fence',    walk: false, color: '#8a6a3a' },
  LANTERN:  { id: 19, name: 'lantern',  walk: false, color: '#4a3a2a' },
  FOUNTAIN: { id: 20, name: 'fountain', walk: false, color: '#5aaaff' },
  HEDGE:    { id: 21, name: 'hedge',    walk: false, color: '#2a5a2a' },
  SIGN:     { id: 22, name: 'sign',     walk: false, color: '#5a3a1a' },
  GARDEN:   { id: 23, name: 'garden',   walk: true,  color: '#3a7a3b' },
  WELL:     { id: 24, name: 'well',     walk: false, color: '#5a5a6a' },
};

export const TILE_BY_ID = Object.fromEntries(Object.values(TILES).map(t => [t.id, t]));

export const TILE_SIZE = 40;
