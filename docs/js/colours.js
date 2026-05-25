/**
 * colours.js
 * Colour datasets for the Favourite Colour app.
 *
 * Each colour object: { id: string, name: string, hex: string }
 *
 * Available sets:
 *   '8'       — 8 basic colours
 *   '16'      — 16 extended colours
 *   'websafe' — 216 web-safe colours (6×6×6 RGB cube)
 *   'all'     — 65 curated named colours
 */

/* ── 8 basic colours ─────────────────────────── */
const COLOURS_8 = [
  { id: 'red',    name: 'Red',    hex: '#FF0000' },
  { id: 'orange', name: 'Orange', hex: '#FF8000' },
  { id: 'yellow', name: 'Yellow', hex: '#FFE000' },
  { id: 'green',  name: 'Green',  hex: '#00AA00' },
  { id: 'blue',   name: 'Blue',   hex: '#0055FF' },
  { id: 'purple', name: 'Purple', hex: '#8800CC' },
  { id: 'pink',   name: 'Pink',   hex: '#FF66AA' },
  { id: 'brown',  name: 'Brown',  hex: '#884400' },
];

/* ── 16 extended colours ─────────────────────── */
const COLOURS_16 = [
  ...COLOURS_8,
  { id: 'cyan',     name: 'Cyan',     hex: '#00CCDD' },
  { id: 'lime',     name: 'Lime',     hex: '#88FF00' },
  { id: 'teal',     name: 'Teal',     hex: '#008080' },
  { id: 'navy',     name: 'Navy',     hex: '#000080' },
  { id: 'crimson',  name: 'Crimson',  hex: '#DC143C' },
  { id: 'gold',     name: 'Gold',     hex: '#FFD700' },
  { id: 'violet',   name: 'Violet',   hex: '#8F00FF' },
  { id: 'charcoal', name: 'Charcoal', hex: '#333333' },
];

/* ── Web-safe palette (216 colours, 6×6×6) ───── */
function _generateWebSafe() {
  const steps = [0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF];
  const colours = [];
  for (const r of steps) {
    for (const g of steps) {
      for (const b of steps) {
        const hex = '#' + [r, g, b]
          .map(v => v.toString(16).padStart(2, '0').toUpperCase())
          .join('');
        colours.push({ id: hex.slice(1), name: hex, hex });
      }
    }
  }
  return colours;
}
const COLOURS_WEBSAFE = _generateWebSafe();

/* ── 65 curated named colours ("all" mode) ───── */
const COLOURS_ALL = [
  /* Reds */
  { id: 'crimson',     name: 'Crimson',     hex: '#DC143C' },
  { id: 'scarlet',     name: 'Scarlet',     hex: '#FF2400' },
  { id: 'rose',        name: 'Rose',        hex: '#FF007F' },
  { id: 'ruby',        name: 'Ruby',        hex: '#9B111E' },
  /* Oranges */
  { id: 'vermilion',   name: 'Vermilion',   hex: '#E34234' },
  { id: 'tangerine',   name: 'Tangerine',   hex: '#F28500' },
  { id: 'coral',       name: 'Coral',       hex: '#FF6B6B' },
  { id: 'peach',       name: 'Peach',       hex: '#FFCBA4' },
  /* Yellows */
  { id: 'gold',        name: 'Gold',        hex: '#FFD700' },
  { id: 'amber',       name: 'Amber',       hex: '#FFBF00' },
  { id: 'lemon',       name: 'Lemon',       hex: '#FFF44F' },
  { id: 'cream',       name: 'Cream',       hex: '#FFFDD0' },
  /* Yellow-Greens */
  { id: 'chartreuse',  name: 'Chartreuse',  hex: '#7FFF00' },
  { id: 'lime',        name: 'Lime',        hex: '#32CD32' },
  { id: 'olive',       name: 'Olive',       hex: '#808000' },
  { id: 'mint',        name: 'Mint',        hex: '#98FF98' },
  /* Greens */
  { id: 'emerald',     name: 'Emerald',     hex: '#50C878' },
  { id: 'jade',        name: 'Jade',        hex: '#00A86B' },
  { id: 'forest',      name: 'Forest',      hex: '#228B22' },
  { id: 'sage',        name: 'Sage',        hex: '#9CAF88' },
  /* Blue-Greens */
  { id: 'turquoise',   name: 'Turquoise',   hex: '#40E0D0' },
  { id: 'teal',        name: 'Teal',        hex: '#008080' },
  { id: 'aqua',        name: 'Aqua',        hex: '#00FFFF' },
  { id: 'cyan',        name: 'Cyan',        hex: '#00CED1' },
  /* Blues */
  { id: 'sky',         name: 'Sky Blue',    hex: '#87CEEB' },
  { id: 'cerulean',    name: 'Cerulean',    hex: '#007BA7' },
  { id: 'azure',       name: 'Azure',       hex: '#0080FF' },
  { id: 'cobalt',      name: 'Cobalt',      hex: '#0047AB' },
  { id: 'navy',        name: 'Navy',        hex: '#000080' },
  { id: 'ultramarine', name: 'Ultramarine', hex: '#4166F5' },
  { id: 'periwinkle',  name: 'Periwinkle',  hex: '#CCCCFF' },
  /* Violets */
  { id: 'indigo',      name: 'Indigo',      hex: '#4B0082' },
  { id: 'violet',      name: 'Violet',      hex: '#8F00FF' },
  { id: 'purple',      name: 'Purple',      hex: '#800080' },
  { id: 'plum',        name: 'Plum',        hex: '#DDA0DD' },
  { id: 'lavender',    name: 'Lavender',    hex: '#E6E6FA' },
  /* Pinks & Magentas */
  { id: 'magenta',     name: 'Magenta',     hex: '#FF00FF' },
  { id: 'fuchsia',     name: 'Fuchsia',     hex: '#FF1694' },
  { id: 'hotpink',     name: 'Hot Pink',    hex: '#FF69B4' },
  { id: 'blush',       name: 'Blush',       hex: '#DE5D83' },
  { id: 'mauve',       name: 'Mauve',       hex: '#E0B0FF' },
  /* Browns */
  { id: 'chocolate',   name: 'Chocolate',   hex: '#7B3F00' },
  { id: 'sienna',      name: 'Sienna',      hex: '#A0522D' },
  { id: 'tan',         name: 'Tan',         hex: '#D2B48C' },
  { id: 'ochre',       name: 'Ochre',       hex: '#CC7722' },
  { id: 'rust',        name: 'Rust',        hex: '#B7410E' },
  { id: 'bronze',      name: 'Bronze',      hex: '#CD7F32' },
  { id: 'copper',      name: 'Copper',      hex: '#B87333' },
  { id: 'khaki',       name: 'Khaki',       hex: '#C3B091' },
  /* Neutrals */
  { id: 'white',       name: 'White',       hex: '#FFFFFF' },
  { id: 'ivory',       name: 'Ivory',       hex: '#FFFFF0' },
  { id: 'beige',       name: 'Beige',       hex: '#F5F5DC' },
  { id: 'silver',      name: 'Silver',      hex: '#C0C0C0' },
  { id: 'gray',        name: 'Gray',        hex: '#808080' },
  { id: 'slate',       name: 'Slate',       hex: '#708090' },
  { id: 'charcoal',    name: 'Charcoal',    hex: '#36454F' },
  { id: 'black',       name: 'Black',       hex: '#111111' },
  /* Specials */
  { id: 'electric',    name: 'Electric',    hex: '#7DF9FF' },
  { id: 'neon-green',  name: 'Neon Green',  hex: '#39FF14' },
  { id: 'neon-pink',   name: 'Neon Pink',   hex: '#FF6EC7' },
  { id: 'burgundy',    name: 'Burgundy',    hex: '#800020' },
  { id: 'maroon',      name: 'Maroon',      hex: '#800000' },
  { id: 'champagne',   name: 'Champagne',   hex: '#FAD6A5' },
  { id: 'eggshell',    name: 'Eggshell',    hex: '#F0EAD6' },
  { id: 'midnight',    name: 'Midnight',    hex: '#191970' },
];

/**
 * Return the colour set for a given mode key.
 * @param {string} mode  '8' | '16' | 'websafe' | 'all'
 * @returns {Array<{id:string, name:string, hex:string}>}
 */
function getColourSet(mode) {
  switch (mode) {
    case '8':       return COLOURS_8;
    case '16':      return COLOURS_16;
    case 'websafe': return COLOURS_WEBSAFE;
    case 'all':     return COLOURS_ALL;
    default:        return COLOURS_16;
  }
}

/**
 * Estimated number of comparisons for a given palette + method.
 * Used in the welcome screen to guide user expectations.
 * @param {string} mode    Palette mode key
 * @param {string} method  'tennis' | 'elo'
 * @returns {number}
 */
function estimateComparisons(mode, method) {
  const n = getColourSet(mode).length;
  if (method === 'tennis') {
    return Math.ceil(n * Math.log2(Math.max(n, 2)));
  }
  // Elo: each colour compared at least k times
  const k = Math.max(3, Math.ceil(Math.log2(n)));
  return n * k;
}
