// ============================================================
// PIXEL ART SPRITES — spr() function + building textures
// ============================================================

import { COL } from './config.js';

// Create a small canvas from a palette + pixel strings
export function spr(pal, rows) {
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let i = 0; i < w; i++) {
      const col = pal[rows[y][i]];
      if (col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); }
    }
  }
  return c;
}

// --- Building Texture Palettes ---
const CAFE_PAL = {
  'w': '#D9B68C', // warm wall
  'b': '#A65E2E', // brown trim
  'd': '#8B4513', // dark wood
  'g': '#FFAA55', // glowing window
  'y': '#FFD700', // bright yellow
  'r': '#CC6633', // roof/awning
  'f': '#5A4030', // floor/base
  's': '#E8D0B0', // sign light
  'W': '#F0E0C8', // light wall
  'D': '#4A3020', // doorframe
  'G': '#FFE088', // window glow bright
  'a': '#FFFFFF', // white awning stripe
  'p': '#DD6688', // pink flower
  'L': '#558844', // leaf green
  'P': '#B05A30', // terracotta pot
  'h': '#C0A060', // door handle
  '.': null,      // transparent
};

const COMP_PAL = {
  'w': '#88BBCC', // cool wall
  'b': '#336688', // blue trim
  'd': '#224466', // dark blue
  'g': '#88BBDD', // cool glow
  'y': '#AADDEE', // light blue
  'r': '#446688', // roof
  'f': '#3A4550', // floor
  's': '#BBDDEE', // sign
  'W': '#CCE0EE', // light wall
  'D': '#2A3A4A', // doorframe
  'G': '#AACCEE', // bright glow
  'L': '#44886A', // planter green
  '.': null,
};

const SHOP_PAL = {
  'w': '#A09888', // neutral wall
  'b': '#706050', // trim
  'd': '#504030', // dark
  'g': '#C0B090', // window
  'r': '#887060', // roof
  'f': '#504840', // floor
  's': '#D0C0A0', // sign
  'W': '#C0B8A8', // light
  'D': '#3A3028', // door
  '.': null,
};

// --- Building Face Sprites (24x24 tiles) ---

export function makePlayerCafeFront() {
  return spr(CAFE_PAL, [
    'rararararararararararara',
    'rararararararararararara',
    'arararararararararararar',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wwwwssssssssssssssssWwww',
    'wwwwgGGGgwwwwwwgGGGgwww',
    'wwwwgGGGgwwwwwwgGGGgwww',
    'wwwwgGgGgwwwwwwgGgGgwww',
    'wwwwgGgGgwwwwwwgGgGgwww',
    'wwwwbbbbbbwwwwwwbbbbbbww',
    'wwPpLLPwwwwwwwPpLLPwwww',
    'wwPpLLPwwwwwwwPpLLPwwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwDDDDDDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'wwwwwwwwDggghDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'ffffffwwDgggGDwwffffffff',
    'ffffffwwDDDDDDwwffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}

export function makeCompCafeFront() {
  return spr(COMP_PAL, [
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wwwwssssssssssssssssWwww',
    'wwwwssssssssssssssssWwww',
    'wwwgGGGGGwwwwgGGGGGwwww',
    'wwwgGGGGGwwwwgGGGGGwwww',
    'wwwgGGGGGwwwwgGGGGGwwww',
    'wwwgGGGGGwwwwgGGGGGwwww',
    'wwwgGGGGGwwwwgGGGGGwwww',
    'wwwbbbbbbwwwwbbbbbbwwwww',
    'wwLLLLLwwwwwwwwLLLLLwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwDDDDDDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'wwwwwwwwDgggGDwwwwwwwwww',
    'ffffffwwDgggGDwwffffffff',
    'ffffffwwDDDDDDwwffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}

// --- Three Unique Background Shops ---

const BOOK_PAL = {
  'w': '#A09080', 'b': '#705840', 'd': '#504030',
  'g': '#D0C0A0', 'r': '#806850', 'f': '#504840',
  's': '#E0D0B0', 'W': '#C0B098', 'D': '#3A2820',
  'G': '#E8D8B8', // bright window (books visible)
  'k': '#884422', // bookshelf brown
  '.': null,
};

export function makeBookshop() {
  return spr(BOOK_PAL, [
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wwwwssssssssssssssssWwww',
    'wwwgGkGGgwwwwwgGkGGgwww',
    'wwwgkGkGgwwwwwgkGkGgwww',
    'wwwgGkGGgwwwwwgGkGGgwww',
    'wwwgkGkGgwwwwwgkGkGgwww',
    'wwwbbbbbbwwwwwwbbbbbbwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwDDDDDDwwwwwwwwww',
    'wwwwwwwwDwwwwDwwwwwwwwww',
    'wwwwwwwwDwwwwDwwwwwwwwww',
    'wwwwwwwwDwwwwDwwwwwwwwww',
    'ffffffwwDDDDDDwwffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}

const BAKERY_PAL = {
  'w': '#C0A888', 'b': '#906840', 'd': '#705030',
  'g': '#FFD088', 'r': '#B07848', 'f': '#605040',
  's': '#FFE8C0', 'W': '#D8C0A0', 'D': '#4A3020',
  'G': '#FFE0A0', // warm bakery glow
  'p': '#DD8866', // pastry pink
  '.': null,
};

export function makeBakery() {
  return spr(BAKERY_PAL, [
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wwwwssssssssssssssssWwww',
    'wwwgGGGGgwwwwwgGGGGgwww',
    'wwwgGpGGgwwwwwgGGpGgwww',
    'wwwgGGpGgwwwwwgGpGGgwww',
    'wwwgGGGGgwwwwwgGGGGgwww',
    'wwwbbbbbbwwwwwwbbbbbbwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwDDDDDDDDwwwwwwwww',
    'wwwwwwwDGGGGGGDwwwwwwwww',
    'wwwwwwwDGGGGGGDwwwwwwwww',
    'wwwwwwwDGGGGGGDwwwwwwwww',
    'ffffffwDDDDDDDDwffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}

const FLOWER_PAL = {
  'w': '#90A888', 'b': '#506848', 'd': '#405838',
  'g': '#A0C890', 'r': '#608850', 'f': '#485040',
  's': '#C0D8B0', 'W': '#A8B8A0', 'D': '#2A3828',
  'G': '#B0D8A0', // green window
  'p': '#DD6688', // pink flowers
  'y': '#DDCC44', // yellow flowers
  'L': '#448844', // leaf dark
  '.': null,
};

export function makeFlowerShop() {
  return spr(FLOWER_PAL, [
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wwwwssssssssssssssssWwww',
    'wwwgGGGGgwwwwwgGGGGgwww',
    'wwwgGGGGgwwwwwgGGGGgwww',
    'wwwgGGGGgwwwwwgGGGGgwww',
    'wwwbbbbbbwwwwwwbbbbbbwww',
    'wwpLypLywwwwwwpLypLywwww',
    'wwLpLypLwwwwwwLpLypLwwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwDDDDDDwwwwwwwwww',
    'wwwwwwwwDGGGGDwwwwwwwwww',
    'wwwwwwwwDGGGGDwwwwwwwwww',
    'wwwwwwwwDGGGGDwwwwwwwwww',
    'ffffffwwDDDDDDwwffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}

// --- Customer Pixel Art Sprites (8x10 each) ---
// 12 diverse characters with different skin, hair, clothing, and optional hats

const CUST_PALS = [
  // 0: Light skin, brown hair, red shirt
  { 'h': '#6B4226', 's': '#FDDCB5', 'c': '#CC4444', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 1: Medium skin, black hair, blue shirt
  { 'h': '#2A2A2A', 's': '#D4A574', 'c': '#4488CC', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 2: Dark skin, short hair, green shirt
  { 'h': '#1A1A1A', 's': '#8B6914', 'c': '#44AA66', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 3: Light skin, blonde hair, purple shirt, hat
  { 'h': '#D4A83C', 's': '#FFE0C0', 'c': '#9966CC', 'p': '#4A5568', 'o': '#3A3A3A', 'H': '#CC6633', '.': null },
  // 4: Medium-dark skin, brown hair, orange shirt
  { 'h': '#4A3020', 's': '#C08050', 'c': '#DD8833', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 5: Pale skin, red hair, teal shirt
  { 'h': '#CC5533', 's': '#FFE8D0', 'c': '#44AAAA', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 6: Olive skin, dark hair, pink shirt, hat
  { 'h': '#2A2010', 's': '#C9B080', 'c': '#DD6688', 'p': '#4A5568', 'o': '#3A3A3A', 'H': '#5566AA', '.': null },
  // 7: Dark skin, grey hair, yellow shirt
  { 'h': '#888888', 's': '#7A5230', 'c': '#CCAA33', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 8: Light-medium skin, black hair, navy shirt
  { 'h': '#1A1A2A', 's': '#E8C498', 'c': '#334466', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 9: Medium skin, brown hair, white shirt, hat
  { 'h': '#5A3A20', 's': '#D0A070', 'c': '#F0E8DD', 'p': '#4A5568', 'o': '#3A3A3A', 'H': '#AA4444', '.': null },
  // 10: Pale, auburn hair, olive shirt
  { 'h': '#884422', 's': '#FFD8B8', 'c': '#668844', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
  // 11: Dark-medium skin, curly black hair, coral shirt
  { 'h': '#222222', 's': '#A07040', 'c': '#DD6655', 'p': '#4A5568', 'o': '#3A3A3A', '.': null },
];

// Character pixel patterns (8w x 10h)
// h=hair, s=skin, c=clothing, p=pants, o=shoes, H=hat, .=transparent
const CUST_ROWS_NORMAL = [
  '..hhhh..',
  '.hhhhhh.',
  '.hsshss.',
  '.ssssss.',
  '..ssss..',
  '.cccccc.',
  '.cccccc.',
  '..cccc..',
  '..pp.pp.',
  '..oo.oo.',
];

const CUST_ROWS_HAT = [
  '.HHHHHH.',
  '.HHhhhH.',
  '.hhhhhh.',
  '.hsshss.',
  '.ssssss.',
  '..ssss..',
  '.cccccc.',
  '.cccccc.',
  '..pp.pp.',
  '..oo.oo.',
];

export function makeCustomerSprites() {
  const sprites = [];
  for (let i = 0; i < CUST_PALS.length; i++) {
    const pal = CUST_PALS[i];
    const rows = pal['H'] ? CUST_ROWS_HAT : CUST_ROWS_NORMAL;
    sprites.push(scaleSprite(spr(pal, rows), 4));
  }
  return sprites;
}

export function makeGlowCircle() {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 208, 136, 0.5)');
  grad.addColorStop(0.4, 'rgba(255, 208, 136, 0.2)');
  grad.addColorStop(1, 'rgba(255, 208, 136, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return c;
}

// Scale a sprite canvas up for use as a Three.js texture
export function scaleSprite(canvas, scale = 8) {
  const c = document.createElement('canvas');
  c.width = canvas.width * scale;
  c.height = canvas.height * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, c.width, c.height);
  return c;
}

// Simple sign sprite
export function makeSaleSign() {
  const pal = { 'r': '#CC3333', 'w': '#FFFFFF', 'y': '#FFCC00', '.': null };
  return spr(pal, [
    'rrrrrrrr',
    'rwwwwwwr',
    'rwywywwr',
    'rwwwwwwr',
    'rrrrrrrr',
  ]);
}

// Tree sprite (top-down feel)
export function makeTree() {
  const pal = { 'g': '#558844', 'G': '#66AA55', 'b': '#664422', '.': null };
  return spr(pal, [
    '..gGg..',
    '.gGGGg.',
    'gGGGGGg',
    'gGGGGGg',
    '.gGGGg.',
    '..gbg..',
    '..gbg..',
    '...b...',
  ]);
}

// Apartment facade (24x24) — rows of windows on warm wall
export function makeApartmentFront() {
  const pal = {
    'w': '#907868', 'b': '#706050', 'g': '#C0AA88', 'G': '#D8C8A8',
    'r': '#806050', 'f': '#504840', '.': null,
  };
  return spr(pal, [
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrr',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwbbbwwwbbbwwwbbbwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwbbbwwwbbbwwwbbbwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwbbbwwwbbbwwwbbbwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwgGgwwwgGgwwwgGgwwwwww',
    'wwwbbbwwwbbbwwwbbbwwwwww',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}

// Billboard texture for Channel A marketing (16x8)
export function makeBillboardTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#2A1F18';
  ctx.fillRect(0, 0, 64, 32);
  ctx.fillStyle = '#FFAA44';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DISCOVER', 32, 14);
  ctx.fillStyle = '#FFD088';
  ctx.font = '7px sans-serif';
  ctx.fillText('Your Cafe', 32, 26);
  return c;
}

// Heart texture for Channel C social icons (16x16)
export function makeHeartTexture() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#CC66FF';
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(2, 8, 0, 4, 4, 2);
  ctx.bezierCurveTo(6, 0, 8, 2, 8, 4);
  ctx.bezierCurveTo(8, 2, 10, 0, 12, 2);
  ctx.bezierCurveTo(16, 4, 14, 8, 8, 14);
  ctx.fill();
  return c;
}

// Star texture for Channel C social icons (16x16)
export function makeStarTexture() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#CC66FF';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
    const x = 8 + 7 * Math.cos(angle);
    const y = 8 + 7 * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  return c;
}

// Boarded-up front for monopoly mode competitor (24x24)
export function makeBoardedFront() {
  const pal = {
    'w': '#706050', 'b': '#504030', 'd': '#3A2A1A',
    'x': '#8B7355', 'f': '#403530', '.': null,
  };
  return spr(pal, [
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'bxbxbxbxbxbxbxbxbxbxbxbb',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'bxbxbxbxbxbxbxbxbxbxbxbb',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wxwxwxwxwxwxwxwxwxwxwxww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wxwxwxwxwxwxwxwxwxwxwxww',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'bxbxbxbxbxbxbxbxbxbxbxbb',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'bxbxbxbxbxbxbxbxbxbxbxbb',
    'bbbbbbbbbbbbbbbbbbbbbbbb',
    'wxwxwxwxwxwxwxwxwxwxwxww',
    'wwwwwwwwwwwwwwwwwwwwwwww',
    'wxwxwxwxwxwxwxwxwxwxwxww',
    'ffffffffffffffffffffffwb',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
    'ffffffffffffffffffffffff',
  ]);
}
