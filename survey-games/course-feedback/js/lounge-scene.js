// ============================================================
// LOUNGE SCENE — Cozy ambient 3D elements floating around the survey
// Objects materialize as questions are answered, warming the scene
// ============================================================

import * as THREE from 'three';

/** Question ID to item ID mapping */
const ITEM_MAP = {
  'pace': 'lamp',
  'difficulty': 'books',
  'peer-difficulty': 'globe',
  'useful-topics': 'scrolls',
  'topic-depth': 'notebook',
  'method-ranking': 'tools',
  'overall-feeling': 'mug',
  'ai-exam': 'laptop',
  'best-thing': 'frame',
  'improvement': 'sticky',
  'anything-else': 'plant',
};

/** Reverse map: item ID → question ID */
const REVERSE_ITEM_MAP = Object.fromEntries(
  Object.entries(ITEM_MAP).map(([qId, itemId]) => [itemId, qId])
);

/** Friendly display names for 3D items */
const ITEM_NAMES = {
  lamp: 'Desk Lamp',
  books: 'Book Stack',
  globe: 'Globe',
  scrolls: 'Topic Cards',
  notebook: 'Notebook',
  tools: 'Pencil Cup',
  mug: 'Coffee Mug',
  laptop: 'Laptop',
  frame: 'Picture Frame',
  sticky: 'Sticky Notes',
  plant: 'Potted Plant',
};

/** Positions in a ring around center (x, y, z) — brought close to camera for prominence.
 *  Camera is at z=14, so z=3-7 puts objects 7-11 units away = large and visible.
 *  Canvas has pointer-events:none so overlapping the card area is fine for clicks. */
const POSITIONS = {
  lamp:     [-5.2, 2.8, 4],
  books:    [-5.6, -0.8, 3],
  globe:    [5.2, 2.8, 4],
  scrolls:  [5.6, 0.3, 3.5],
  notebook: [5.2, -2.2, 3],
  tools:    [-5.6, 1.2, 3],
  mug:      [-3.4, -3.0, 5.5],
  laptop:   [-4.8, -2.2, 3.5],
  frame:    [-5.0, 3.8, 2],
  sticky:   [5.4, -1.0, 3.5],
  plant:    [3.4, -3.2, 5],
};

const state = {
  initialized: false,
  revealed: new Set(),
  totalSlots: 11,
  warmth: 0,
  collectionMode: false,
  collectionQuestions: null,
  collectionResponses: null,
};

let scene3d, camera, renderer;
let ambientLight, hemiLight, warmLights;
let particles, bokehSprites;
let mouseX = 0, mouseY = 0;
const items = {};
const pendingReveals = [];
const revealRings = [];
const clickPulses = []; // click effect animations
let raycaster, pointerVec;
let prevTime = 0;
let softCircleTex = null;

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Initialize the Three.js ambient scene.
 * @param {string} moduleId
 * @param {object} config - needs loungeScene.enabled
 */
export async function initLoungeScene(moduleId, config) {
  if (!config.loungeScene?.enabled) return;
  const canvas = document.getElementById('scene');
  if (!canvas) return;

  _setupScene(canvas);
  _setupLighting();
  softCircleTex = _makeSoftCircle();
  particles = _createParticles();
  bokehSprites = _createBokeh();
  _buildAllItems();
  _addVignette();
  _addMouseParallax();
  _addClickInteraction();

  state.initialized = true;
  prevTime = performance.now();
  _animate(prevTime);

  // Make survey card transparent so 3D objects are visible behind it
  document.getElementById('survey-card')?.classList.add('lounge-active');
}

/**
 * Called when a question is answered — reveals item and applies variant.
 * Skips null/empty values to prevent flash-reveal on text clear or auto-fire.
 */
export function onQuestionAnswered(questionId, value, questionConfig) {
  if (!state.initialized) return;
  const itemId = ITEM_MAP[questionId];
  if (!itemId) return;

  // Empty/null value or empty text — hide item if previously revealed
  const isEmpty = !value || (value.text !== undefined && !value.text);
  if (isEmpty) {
    _hideItem(itemId);
    return;
  }

  // Slider and ranking fire onChange once on initial render (auto-fire).
  // Track seen questions: first call = auto-fire (apply variant only), subsequent = real.
  if (!state.seenQuestions) state.seenQuestions = new Set();
  const type = questionConfig?.type;
  if (type === 'slider' || type === 'ranking') {
    if (!state.seenQuestions.has(questionId)) {
      state.seenQuestions.add(questionId);
      // Apply variant preview without revealing the item
      _applyVariant(questionId, value);
      return;
    }
  }

  _revealItem(itemId);
  _applyVariant(questionId, value);
  _updateWarmth();
}

/**
 * Final scene reveal on completion — max glow.
 * @returns {{ personalCount: number }}
 */
export function showFinalScene() {
  if (!state.initialized) return null;
  state.warmth = 1;
  document.documentElement.style.setProperty('--glow-intensity', '1');
  _applyWarmthToLights();
  return { personalCount: state.revealed.size };
}

/**
 * Enter collection mode — hide survey card, let user explore 3D items.
 * @param {Array} questions - config.questions array
 * @param {object} responses - state.responses map (questionId → value)
 */
export function enterCollectionMode(questions, responses) {
  if (!state.initialized) return;

  state.collectionMode = true;
  state.collectionQuestions = questions;
  state.collectionResponses = responses;

  // Hide survey card and ambient bg, enable canvas interaction
  document.body.classList.add('collection-mode');

  // Create overlay if not already present
  if (!document.getElementById('collection-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'collection-overlay';
    overlay.innerHTML = `
      <div id="collection-info" class="collection-info hidden">
        <div class="collection-info-label"></div>
        <div class="collection-info-question"></div>
        <div class="collection-info-answer"></div>
      </div>
      <a href="index.html" class="collection-exit-btn">Back to Lobby</a>
    `;
    document.body.appendChild(overlay);
  }
}

// ============================================================
// SCENE SETUP
// ============================================================

function _setupScene(canvas) {
  const w = window.innerWidth, h = window.innerHeight;
  const isMobile = window.innerWidth <= 768;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x1A1410);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.8;

  scene3d = new THREE.Scene();
  scene3d.fog = new THREE.FogExp2(0x1A1410, 0.012);

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0.5, 14);
  camera.lookAt(0, 0, 0);

  window.addEventListener('resize', () => {
    const rw = window.innerWidth, rh = window.innerHeight;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
  });
}

function _setupLighting() {
  ambientLight = new THREE.AmbientLight(0x665544, 0.6);
  scene3d.add(ambientLight);

  hemiLight = new THREE.HemisphereLight(0xDDB888, 0x332211, 0.5);
  scene3d.add(hemiLight);

  const dir = new THREE.DirectionalLight(0xFFDDBB, 0.4);
  dir.position.set(5, 8, 8);
  scene3d.add(dir);

  // Key light from camera area to illuminate front faces of objects
  const frontFill = new THREE.PointLight(0xFFCC99, 0.6, 30);
  frontFill.position.set(0, 2, 12);
  scene3d.add(frontFill);

  warmLights = [
    _makeLight(-5.5, 3, 6, 0xFFAA55),
    _makeLight(5.5, 3, 6, 0xFFCC88),
    _makeLight(0, -2, 7, 0xFF9944),
  ];
}

function _makeLight(x, y, z, color) {
  const l = new THREE.PointLight(color, 0, 14);
  l.position.set(x, y, z);
  scene3d.add(l);
  return l;
}

// ============================================================
// PARTICLES — Warm floating embers
// ============================================================

function _createParticles() {
  const count = window.innerWidth <= 768 ? 50 : 120;
  const pos = new Float32Array(count * 3);
  const vel = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    vel.push({
      vy: 0.15 + Math.random() * 0.35,
      vx: (Math.random() - 0.5) * 0.08,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xF5C16C,
    size: 0.07,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geom, mat);
  scene3d.add(points);
  return { points, pos, vel, count, mat };
}

// ============================================================
// BOKEH — Soft out-of-focus warm lights
// ============================================================

function _createBokeh() {
  const sprites = [];
  const bokehCount = window.innerWidth <= 768 ? 8 : 18;
  for (let i = 0; i < bokehCount; i++) {
    const hue = 0.06 + Math.random() * 0.08;
    const mat = new THREE.SpriteMaterial({
      map: softCircleTex,
      color: new THREE.Color().setHSL(hue, 0.7, 0.6),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    const sz = 0.5 + Math.random() * 2.5;
    sprite.scale.set(sz, sz, 1);
    sprite.position.set(
      (Math.random() - 0.5) * 22,
      (Math.random() - 0.5) * 16,
      -4 + Math.random() * 10
    );
    scene3d.add(sprite);
    sprites.push({
      sprite, mat,
      baseOp: 0.04 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0002 + Math.random() * 0.0004,
    });
  }
  return sprites;
}

function _makeSoftCircle() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,220,130,1)');
  g.addColorStop(0.25, 'rgba(255,200,100,0.7)');
  g.addColorStop(0.6, 'rgba(255,180,80,0.2)');
  g.addColorStop(1, 'rgba(255,160,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ============================================================
// EXTRAS — Vignette + Mouse Parallax
// ============================================================

function _addVignette() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;' +
    'background:radial-gradient(ellipse at center,transparent 30%,rgba(10,8,5,0.55) 100%);';
  document.body.appendChild(el);
}

function _addMouseParallax() {
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
}

function _addClickInteraction() {
  raycaster = new THREE.Raycaster();
  pointerVec = new THREE.Vector2();

  // Listen on document so clicks on the card still work normally.
  // We raycast in the background to detect 3D object clicks.
  document.addEventListener('click', (e) => {
    if (!state.initialized) return;

    // In collection mode, ignore clicks on the overlay UI elements
    if (state.collectionMode) {
      const overlay = document.getElementById('collection-overlay');
      if (overlay && overlay.contains(e.target)) return;
    }

    pointerVec.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointerVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointerVec, camera);

    // Collect all revealed item groups
    const targets = [];
    for (const item of Object.values(items)) {
      if (item.revealed) targets.push(item.group);
    }
    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      // Walk up the scene graph to find which item group was hit
      let hitObj = intersects[0].object;
      let hitId = null;
      while (hitObj) {
        for (const [id, item] of Object.entries(items)) {
          if (item.group === hitObj) { hitId = id; break; }
        }
        if (hitId) break;
        hitObj = hitObj.parent;
      }
      if (hitId) {
        _onItemClicked(hitId, intersects[0].point);
      }
    } else if (state.collectionMode) {
      // Click on empty space hides the info panel
      const panel = document.getElementById('collection-info');
      if (panel) panel.classList.add('hidden');
    }
  });
}

/** Click effect: pulse scale + sparkle burst + golden ring */
function _onItemClicked(id, hitPoint) {
  const item = items[id];
  if (!item) return;

  // Pulse animation — scale up then back to 1
  clickPulses.push({
    group: item.group,
    progress: 0,
    baseScale: 1,
  });

  // Sparkle burst — spray of glowing particles from hit point
  const burstCount = 8;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const speed = 1.5 + Math.random() * 1.5;
    const sparkMat = new THREE.SpriteMaterial({
      map: softCircleTex,
      color: 0xFFDD88,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const spark = new THREE.Sprite(sparkMat);
    spark.scale.set(0.15, 0.15, 1);
    spark.position.copy(hitPoint);
    scene3d.add(spark);

    clickPulses.push({
      type: 'spark',
      sprite: spark,
      mat: sparkMat,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 1.0,
      vz: (Math.random() - 0.5) * speed * 0.5,
      progress: 0,
    });
  }

  // Golden expanding ring
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xFFCC66, transparent: true, opacity: 0.8,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 32), ringMat);
  ring.position.copy(hitPoint);
  ring.lookAt(camera.position);
  scene3d.add(ring);
  clickPulses.push({ type: 'ring', mesh: ring, mat: ringMat, progress: 0 });

  // Collection mode: show info panel with question + answer
  if (state.collectionMode) {
    _showCollectionInfo(id);
  }
}

/** Show info panel for a clicked item in collection mode */
function _showCollectionInfo(itemId) {
  const panel = document.getElementById('collection-info');
  if (!panel) return;

  const questionId = REVERSE_ITEM_MAP[itemId];
  if (!questionId) return;

  const questions = state.collectionQuestions || [];
  const responses = state.collectionResponses || {};

  const qConfig = questions.find(q => q.id === questionId);
  if (!qConfig) return;

  const value = responses[questionId];
  const formatted = _formatResponse(questionId, value, qConfig);

  panel.querySelector('.collection-info-label').textContent = ITEM_NAMES[itemId] || itemId;
  panel.querySelector('.collection-info-question').textContent = qConfig.text;
  panel.querySelector('.collection-info-answer').innerHTML = formatted;
  panel.classList.remove('hidden');
}

/** Format a response value into readable text for the info panel */
function _formatResponse(questionId, value, qConfig) {
  if (value === undefined || value === null) return 'Not answered';

  const type = qConfig.type;

  switch (type) {
    case 'likert': {
      // value is 1-based index into options
      const idx = _num(value);
      if (idx === null) return 'Not answered';
      const opt = qConfig.options?.[idx - 1];
      return opt ? _esc(opt.label) : `Option ${idx}`;
    }
    case 'slider': {
      const v = _num(value);
      if (v === null) return 'Not answered';
      const max = qConfig.max ?? 100;
      const endpoints = qConfig.endpointLabels || [];
      let text = `${v} / ${max}`;
      if (endpoints.length === 2) {
        text += `<br><span style="font-size:12px;color:var(--text-dim)">${_esc(endpoints[0])} \u2190 \u2192 ${_esc(endpoints[1])}</span>`;
      }
      return text;
    }
    case 'multichoice': {
      const sel = Array.isArray(value?.selected) ? value.selected
        : (value?.selected ? [value.selected] : []);
      if (sel.length === 0) return 'Not answered';
      const labels = sel.map(id => {
        const opt = qConfig.options?.find(o => o.id === id);
        return opt ? _esc(opt.label) : _esc(id);
      });
      return labels.join(', ');
    }
    case 'ranking': {
      const ranked = Array.isArray(value?.ranked) ? value.ranked : [];
      if (ranked.length === 0) return 'Not answered';
      return ranked.map((id, i) => {
        const opt = qConfig.options?.find(o => o.id === id);
        const label = opt ? _esc(opt.label) : _esc(id);
        return `${i + 1}. ${label}`;
      }).join('<br>');
    }
    case 'emoji': {
      const v = _num(value);
      if (v === null) return 'Not answered';
      const opt = qConfig.options?.find(o => o.value === v);
      return opt ? `${opt.emoji} ${_esc(opt.label)}` : `Value: ${v}`;
    }
    case 'text': {
      const text = value?.text ?? (typeof value === 'string' ? value : '');
      if (!text) return 'Not answered';
      const display = text.length > 200 ? text.substring(0, 200) + '\u2026' : text;
      return `\u201C${_esc(display)}\u201D`;
    }
    default:
      return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }
}

/** Escape HTML for safe insertion */
function _esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// ITEM BUILDERS
// ============================================================

function _buildAllItems() {
  _reg('lamp', _buildLamp());
  _reg('books', _buildBooks());
  _reg('globe', _buildGlobe());
  _reg('scrolls', _buildScrolls());
  _reg('notebook', _buildNotebook());
  _reg('tools', _buildTools());
  _reg('mug', _buildMug());
  _reg('laptop', _buildLaptop());
  _reg('frame', _buildFrame());
  _reg('sticky', _buildSticky());
  _reg('plant', _buildPlant());
}

function _reg(id, data) {
  const p = _scaledPosition(POSITIONS[id]);
  data.group.position.set(p[0], p[1], p[2]);
  data.group.scale.set(0, 0, 0);
  data.group.visible = false;
  scene3d.add(data.group);
  items[id] = { ...data, revealed: false, baseY: p[1] };
}

/** Scale positions based on aspect ratio — pull items inward on narrow (mobile) screens */
function _scaledPosition(pos) {
  const aspect = window.innerWidth / window.innerHeight;
  // At aspect >= 1.2 (landscape/desktop), use full positions
  // At aspect < 1.0 (portrait/mobile), scale X inward aggressively
  const xScale = aspect >= 1.2 ? 1.0 : Math.max(0.38, aspect * 0.55);
  return [pos[0] * xScale, pos[1], pos[2]];
}

/** Create mesh with optional position [x,y,z] */
function _m(geom, mat, pos) {
  const mesh = new THREE.Mesh(geom, mat);
  if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
  return mesh;
}

/** Standard material shorthand — includes subtle warm emissive for visibility */
function _std(color, opts) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.1,
    emissive: opts?.emissive ?? 0x221100,
    emissiveIntensity: opts?.emissiveIntensity ?? 0.15,
    ...opts,
  });
}

// --- Desk Lamp ---
function _buildLamp() {
  const g = new THREE.Group();
  const brass = _std(0xB8860B, { metalness: 0.6, roughness: 0.3 });
  // Base
  g.add(_m(new THREE.CylinderGeometry(0.28, 0.32, 0.07, 16), brass, [0, 0.035, 0]));
  // Pole
  g.add(_m(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8), brass, [0, 0.72, 0]));
  // Angled neck
  const neck = _m(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), brass, [0, 0.25, 0]);
  neck.rotation.z = -Math.PI / 5;
  const pivot = new THREE.Group();
  pivot.position.set(0, 1.35, 0);
  pivot.add(neck);
  g.add(pivot);
  // Shade
  const shadeMat = _std(0xC9982E, {
    side: THREE.DoubleSide, metalness: 0.2, roughness: 0.5,
    emissive: 0x442200, emissiveIntensity: 0,
  });
  g.add(_m(new THREE.CylinderGeometry(0.08, 0.35, 0.3, 16, 1, true), shadeMat, [0.2, 1.35, 0]));
  // Glow bulb
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xFFAA55, transparent: true, opacity: 0 });
  g.add(_m(new THREE.SphereGeometry(0.1, 8, 8), glowMat, [0.2, 1.25, 0]));

  return { group: g, shadeMat, glowMat };
}

// --- Book Stack ---
function _buildBooks() {
  const g = new THREE.Group();
  const colors = [0x8B4513, 0x5A4528, 0x2E5D3A, 0x4A6B8A, 0x8B3A3A];
  const meshes = [];
  for (let i = 0; i < 5; i++) {
    const w = 0.8 + Math.random() * 0.15;
    const h = 0.12 + Math.random() * 0.04;
    const d = 0.5 + Math.random() * 0.1;
    const book = _m(new THREE.BoxGeometry(w, h, d), _std(colors[i]), [
      (Math.random() - 0.5) * 0.06, i * 0.14 + h / 2, 0
    ]);
    book.rotation.y = (Math.random() - 0.5) * 0.12;
    book.visible = i === 0;
    g.add(book);
    meshes.push(book);
  }
  // Page edges on side of bottom book
  g.add(_m(new THREE.BoxGeometry(0.78, 0.08, 0.02), _std(0xF5F0E0), [0, 0.06, 0.26]));

  return { group: g, meshes };
}

// --- Globe ---
function _buildGlobe() {
  const g = new THREE.Group();
  const wood = _std(0x5A4528);
  const metal = _std(0x888888, { metalness: 0.5, roughness: 0.3 });
  // Stand
  g.add(_m(new THREE.CylinderGeometry(0.22, 0.26, 0.06, 16), wood, [0, 0.03, 0]));
  g.add(_m(new THREE.CylinderGeometry(0.035, 0.035, 0.45, 8), metal, [0, 0.28, 0]));
  // Globe sub-group (rotates independently)
  const globeGroup = new THREE.Group();
  globeGroup.position.set(0, 0.72, 0);
  globeGroup.add(_m(
    new THREE.SphereGeometry(0.38, 24, 16),
    _std(0x4A7799, { roughness: 0.35, transparent: true, opacity: 0.9 })
  ));
  globeGroup.add(_m(
    new THREE.SphereGeometry(0.39, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x88BBDD, wireframe: true, transparent: true, opacity: 0.2 })
  ));
  g.add(globeGroup);
  // Axis ring
  const ring = _m(new THREE.TorusGeometry(0.42, 0.015, 8, 32), metal, [0, 0.72, 0]);
  ring.rotation.x = Math.PI / 6;
  g.add(ring);

  return { group: g, globeGroup, spinSpeed: 0.2 };
}

// --- Topic Scrolls/Cards ---
function _buildScrolls() {
  const g = new THREE.Group();
  const topicColors = {
    'regression': 0x8B4513,
    'multiple-regression': 0x5A4528,
    'visualization': 0x2E5D3A,
    'python': 0x4A6B8A,
  };
  const topicMeshes = {};
  const ids = Object.keys(topicColors);
  ids.forEach((tid, i) => {
    const angle = (i / ids.length) * Math.PI * 0.6 - Math.PI * 0.3;
    const x = Math.sin(angle) * 0.4;
    const y = i * 0.08 - 0.12;
    const card = _m(new THREE.BoxGeometry(0.5, 0.7, 0.02), _std(topicColors[tid]), [x, y, 0]);
    card.rotation.y = angle * 0.3;
    card.rotation.z = (Math.random() - 0.5) * 0.15;
    g.add(card);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xF5C16C, transparent: true, opacity: 0 });
    const hl = _m(new THREE.BoxGeometry(0.52, 0.72, 0.025), hlMat, [x, y, 0.015]);
    hl.rotation.y = card.rotation.y;
    hl.rotation.z = card.rotation.z;
    g.add(hl);
    topicMeshes[tid] = { card, hlMat };
  });

  return { group: g, topicMeshes };
}

// --- Notebook ---
function _buildNotebook() {
  const g = new THREE.Group();
  const page = _std(0xF5F0E0);
  g.add(_m(new THREE.BoxGeometry(0.55, 0.75, 0.015), page, [-0.28, 0, 0]));
  g.add(_m(new THREE.BoxGeometry(0.55, 0.75, 0.015), page, [0.28, 0, 0]));
  g.add(_m(new THREE.BoxGeometry(0.06, 0.75, 0.04), _std(0x5A4528), [0, 0, -0.01]));
  // Writing lines
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const lm = new THREE.MeshBasicMaterial({ color: 0x7BA7C9, transparent: true, opacity: 0 });
    const line = _m(new THREE.BoxGeometry(0.4, 0.005, 0.002), lm, [0.28, 0.25 - i * 0.12, 0.01]);
    g.add(line);
    lines.push({ mesh: line, mat: lm });
  }
  g.rotation.x = -0.15;
  g.rotation.z = 0.08;

  return { group: g, lines };
}

// --- Study Tools (pencil cup) ---
function _buildTools() {
  const g = new THREE.Group();
  g.add(_m(new THREE.CylinderGeometry(0.2, 0.17, 0.45, 16), _std(0x6B5535), [0, 0.225, 0]));
  g.add(_m(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 16), _std(0x5A4528), [0, 0.46, 0]));
  const toolIds = ['lectures', 'labs', 'games', 'readings', 'discussions'];
  const toolColors = [0xF5C16C, 0x66AA55, 0x7BA7C9, 0xCC6644, 0xAA88CC];
  const toolMeshes = {};
  toolIds.forEach((tid, i) => {
    const a = (i / toolIds.length) * Math.PI * 2;
    const r = 0.08;
    const h = 0.5 + Math.random() * 0.2;
    const pencil = _m(new THREE.CylinderGeometry(0.02, 0.02, h, 6), _std(toolColors[i]), [
      Math.sin(a) * r, 0.45 + h / 2, Math.cos(a) * r
    ]);
    pencil.rotation.z = (Math.random() - 0.5) * 0.15;
    pencil.rotation.x = (Math.random() - 0.5) * 0.1;
    g.add(pencil);
    toolMeshes[tid] = pencil;
  });

  return { group: g, toolMeshes };
}

// --- Coffee Mug ---
function _buildMug() {
  const g = new THREE.Group();
  const bodyMat = _std(0x6B5535, { roughness: 0.3 });
  const body = _m(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 16), bodyMat, [0, 0.2, 0]);
  g.add(body);
  // Handle
  const handle = _m(new THREE.TorusGeometry(0.12, 0.025, 8, 16, Math.PI), _std(0x5A4528), [0.24, 0.22, 0]);
  handle.rotation.set(0, Math.PI / 2, Math.PI / 2);
  g.add(handle);
  // Liquid
  const liq = _m(new THREE.CircleGeometry(0.19, 16), _std(0x3A2010, { roughness: 0.15 }), [0, 0.39, 0]);
  liq.rotation.x = -Math.PI / 2;
  g.add(liq);
  // Steam sprites
  const steamSprites = [];
  for (let i = 0; i < 6; i++) {
    const sm = new THREE.SpriteMaterial({
      map: softCircleTex,
      color: 0xFFDDBB,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const s = new THREE.Sprite(sm);
    s.scale.set(0.15, 0.15, 1);
    s.position.set(0, 0.5, 0);
    g.add(s);
    steamSprites.push({ sprite: s, mat: sm });
  }

  return { group: g, bodyMat, body, steamSprites, steamIntensity: 0.15 };
}

// --- Laptop ---
function _buildLaptop() {
  const g = new THREE.Group();
  const shell = _std(0x555566, { metalness: 0.5, roughness: 0.3 });
  g.add(_m(new THREE.BoxGeometry(1.0, 0.04, 0.65), shell, [0, 0.02, 0]));
  // Keyboard dots
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      g.add(_m(
        new THREE.BoxGeometry(0.08, 0.005, 0.05),
        _std(0x444455),
        [-0.32 + c * 0.09, 0.045, -0.1 + r * 0.1]
      ));
    }
  }
  // Screen
  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, 0.04, -0.3);
  screenGroup.rotation.x = -Math.PI / 5;
  screenGroup.add(_m(new THREE.BoxGeometry(0.95, 0.6, 0.025), shell, [0, 0.3, 0]));
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x1A2030 });
  screenGroup.add(_m(new THREE.BoxGeometry(0.85, 0.5, 0.005), screenMat, [0, 0.3, 0.016]));
  const iconMat = new THREE.MeshBasicMaterial({ color: 0x7BA7C9, transparent: true, opacity: 0 });
  screenGroup.add(_m(new THREE.BoxGeometry(0.2, 0.2, 0.002), iconMat, [0, 0.32, 0.02]));
  g.add(screenGroup);

  return { group: g, screenMat, iconMat };
}

// --- Picture Frame ---
function _buildFrame() {
  const g = new THREE.Group();
  g.add(_m(new THREE.BoxGeometry(0.8, 1.0, 0.06), _std(0xDAA520, { metalness: 0.5, roughness: 0.3 }), [0, 0, 0]));
  g.add(_m(new THREE.BoxGeometry(0.6, 0.8, 0.02), _std(0x3D2E1E), [0, 0, 0.022]));
  // Subtle glass reflection
  g.add(_m(
    new THREE.BoxGeometry(0.6, 0.8, 0.003),
    new THREE.MeshBasicMaterial({ color: 0xFFDDBB, transparent: true, opacity: 0.05 }),
    [0, 0, 0.035]
  ));

  return { group: g };
}

// --- Sticky Notes ---
function _buildSticky() {
  const g = new THREE.Group();
  const colors = [0xF0D060, 0xFFB347, 0xFF9999, 0x99DDFF];
  const noteMeshes = [];
  for (let i = 0; i < 4; i++) {
    const note = _m(
      new THREE.BoxGeometry(0.5, 0.5, 0.008),
      _std(colors[i]),
      [(i % 2) * 0.3 - 0.15, Math.floor(i / 2) * 0.3 - 0.15, i * 0.01]
    );
    note.rotation.z = (Math.random() - 0.5) * 0.25;
    note.visible = i === 0;
    g.add(note);
    noteMeshes.push(note);
  }

  return { group: g, noteMeshes };
}

// --- Potted Plant ---
function _buildPlant() {
  const g = new THREE.Group();
  const terra = _std(0xB5651D);
  g.add(_m(new THREE.CylinderGeometry(0.24, 0.19, 0.35, 16), terra, [0, 0.175, 0]));
  g.add(_m(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16), terra, [0, 0.37, 0]));
  const soil = _m(new THREE.CircleGeometry(0.22, 16), _std(0x3A2816), [0, 0.36, 0]);
  soil.rotation.x = -Math.PI / 2;
  g.add(soil);
  // Stem
  const stem = _m(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 8), _std(0x558844), [0, 0.65, 0]);
  g.add(stem);
  // Leaves
  const leafGeom = new THREE.SphereGeometry(0.14, 8, 6);
  const leafCfg = [
    { c: 0x66AA55, p: [-0.12, 0.7, 0.05], r: 0.5, s: [1.2, 0.5, 1] },
    { c: 0x77BB66, p: [0.1, 0.8, -0.06], r: -0.4, s: [1, 0.5, 1.1] },
    { c: 0x446633, p: [-0.08, 0.9, 0.08], r: 0.6, s: [0.9, 0.4, 1] },
    { c: 0x55AA44, p: [0.12, 0.95, -0.04], r: -0.5, s: [0.8, 0.4, 0.9] },
  ];
  const leaves = [];
  leafCfg.forEach((cfg, i) => {
    const leaf = _m(leafGeom, _std(cfg.c), cfg.p);
    leaf.scale.set(cfg.s[0], cfg.s[1], cfg.s[2]);
    leaf.rotation.z = cfg.r;
    leaf.visible = i === 0;
    g.add(leaf);
    leaves.push(leaf);
  });
  // Flower bud
  const flower = _m(
    new THREE.SphereGeometry(0.08, 8, 8),
    _std(0xF5C16C, { emissive: 0x442200, emissiveIntensity: 0.3 }),
    [0, 1.05, 0]
  );
  flower.visible = false;
  g.add(flower);

  return { group: g, stem, leaves, flower };
}

// ============================================================
// ANIMATION LOOP
// ============================================================

function _animate(time) {
  requestAnimationFrame(_animate);
  const dt = Math.min(0.1, (time - prevTime) / 1000);
  prevTime = time;

  _updateReveals(dt);
  _updateRevealRings(dt);
  _updateClickPulses(dt);
  _updateParticles(dt, time);
  _updateBokeh(time);
  _updateItemAnimations(dt, time);

  // Camera: breathing + mouse parallax
  camera.position.x = mouseX * 0.25 + Math.sin(time * 0.0003) * 0.05;
  camera.position.y = 0.5 - mouseY * 0.15 + Math.sin(time * 0.0004) * 0.08;

  renderer.render(scene3d, camera);
}

function _updateReveals(dt) {
  for (let i = pendingReveals.length - 1; i >= 0; i--) {
    const r = pendingReveals[i];
    r.progress += dt * 2.2;
    if (r.progress >= 1) {
      r.group.scale.set(1, 1, 1);
      pendingReveals.splice(i, 1);
    } else {
      const t = r.progress;
      // Elastic ease-out bounce
      const s = t < 0.6
        ? (t / 0.6) * 1.12
        : 1.12 - (t - 0.6) / 0.4 * 0.12;
      r.group.scale.set(s, s, s);
    }
  }
}

function _updateRevealRings(dt) {
  for (let i = revealRings.length - 1; i >= 0; i--) {
    const r = revealRings[i];
    r.progress += dt * 2;
    if (r.progress >= 1) {
      scene3d.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
      revealRings.splice(i, 1);
    } else {
      const s = 1 + r.progress * 3;
      r.mesh.scale.set(s, s, s);
      r.mesh.material.opacity = 0.6 * (1 - r.progress);
    }
  }
}

function _updateClickPulses(dt) {
  for (let i = clickPulses.length - 1; i >= 0; i--) {
    const p = clickPulses[i];
    p.progress += dt * 3;

    if (p.type === 'spark') {
      // Sparkle particle flies outward then fades
      if (p.progress >= 1) {
        scene3d.remove(p.sprite);
        p.mat.dispose();
        clickPulses.splice(i, 1);
      } else {
        p.sprite.position.x += p.vx * dt;
        p.sprite.position.y += p.vy * dt;
        p.sprite.position.z += p.vz * dt;
        p.vy -= 3 * dt; // gravity
        p.mat.opacity = 1.0 - p.progress;
        const sc = 0.15 * (1 - p.progress * 0.5);
        p.sprite.scale.set(sc, sc, 1);
      }
    } else if (p.type === 'ring') {
      // Expanding golden ring
      if (p.progress >= 1) {
        scene3d.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mat.dispose();
        clickPulses.splice(i, 1);
      } else {
        const s = 1 + p.progress * 4;
        p.mesh.scale.set(s, s, s);
        p.mat.opacity = 0.8 * (1 - p.progress);
      }
    } else {
      // Scale pulse on the item group
      if (p.progress >= 1) {
        p.group.scale.set(1, 1, 1);
        clickPulses.splice(i, 1);
      } else {
        // Quick scale up then ease back down
        const t = p.progress;
        const s = t < 0.3
          ? 1 + (t / 0.3) * 0.25
          : 1.25 - ((t - 0.3) / 0.7) * 0.25;
        p.group.scale.set(s, s, s);
      }
    }
  }
}

function _updateParticles(dt, time) {
  if (!particles) return;
  const { pos, vel, count, mat } = particles;
  mat.opacity = 0.15 + state.warmth * 0.45;
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    pos[i3] += (vel[i].vx + Math.sin(time * 0.001 + vel[i].phase) * 0.04) * dt;
    pos[i3 + 1] += vel[i].vy * dt;
    pos[i3 + 2] += Math.cos(time * 0.0008 + vel[i].phase) * 0.015 * dt;
    // Wrap vertically and horizontally
    if (pos[i3 + 1] > 9) {
      pos[i3 + 1] = -8;
      pos[i3] = (Math.random() - 0.5) * 22;
      pos[i3 + 2] = (Math.random() - 0.5) * 12;
    }
    if (Math.abs(pos[i3]) > 13) {
      pos[i3] = -Math.sign(pos[i3]) * 12;
    }
  }
  particles.points.geometry.attributes.position.needsUpdate = true;
}

function _updateBokeh(time) {
  for (const b of bokehSprites) {
    const pulse = Math.sin(time * b.speed * 2 + b.phase) * 0.5 + 0.5;
    b.mat.opacity = b.baseOp * state.warmth * (0.7 + pulse * 0.3);
    b.sprite.position.y += Math.sin(time * b.speed + b.phase) * 0.0008;
    b.sprite.position.x += Math.cos(time * b.speed * 0.7 + b.phase) * 0.0004;
  }
}

function _updateItemAnimations(dt, time) {
  for (const [id, item] of Object.entries(items)) {
    if (!item.revealed) continue;
    const p = POSITIONS[id];
    const phase = p[0] * 0.5 + p[1] * 0.3;
    // Gentle float
    item.group.position.y = item.baseY + Math.sin(time * 0.0008 + phase) * 0.12;
    item.group.rotation.y = Math.sin(time * 0.0005 + phase) * 0.06;
  }

  // Globe spin
  if (items.globe?.revealed && items.globe.globeGroup) {
    items.globe.globeGroup.rotation.y += dt * (items.globe.spinSpeed || 0.2);
  }

  // Mug steam
  if (items.mug?.revealed) {
    const si = items.mug.steamIntensity || 0.15;
    items.mug.steamSprites.forEach((s, i) => {
      const cycle = ((time * 0.001 + i * 0.5) % 3) / 3;
      s.sprite.position.y = 0.5 + cycle * 1.5;
      s.sprite.position.x = Math.sin(time * 0.002 + i * 1.2) * 0.08;
      s.mat.opacity = si * (1 - cycle) * Math.min(1, state.warmth + 0.3);
      const sc = 0.12 + cycle * 0.2;
      s.sprite.scale.set(sc, sc, 1);
    });
  }

  // Lamp glow pulse
  if (items.lamp?.revealed) {
    const pulse = Math.sin(time * 0.002) * 0.1;
    if (items.lamp.glowMat) {
      items.lamp.glowMat.opacity = 0.3 + pulse + state.warmth * 0.3;
    }
    if (items.lamp.shadeMat) {
      items.lamp.shadeMat.emissiveIntensity = 0.2 + state.warmth * 0.5 + pulse * 0.1;
    }
  }

  // Plant gentle sway
  if (items.plant?.revealed) {
    items.plant.group.rotation.z = Math.sin(time * 0.0007) * 0.02;
  }
}

// ============================================================
// REVEAL & WARMTH
// ============================================================

function _revealItem(id) {
  const item = items[id];
  if (!item || item.revealed) return;
  item.revealed = true;
  item.group.visible = true;
  pendingReveals.push({ group: item.group, progress: 0 });
  state.revealed.add(id);

  // Spawn reveal ring effect at the item's actual position
  const gp = item.group.position;
  const ringMesh = new THREE.Mesh(
    new THREE.RingGeometry(0.1, 0.15, 32),
    new THREE.MeshBasicMaterial({
      color: 0xF5C16C, transparent: true, opacity: 0.6,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  ringMesh.position.set(gp.x, gp.y, gp.z + 0.5);
  ringMesh.lookAt(camera.position);
  scene3d.add(ringMesh);
  revealRings.push({ mesh: ringMesh, progress: 0 });
}

function _updateWarmth() {
  state.warmth = state.revealed.size / state.totalSlots;
  document.documentElement.style.setProperty('--glow-intensity', String(state.warmth));
  _applyWarmthToLights();
}

function _applyWarmthToLights() {
  const w = state.warmth;
  if (ambientLight) ambientLight.intensity = 0.6 + w * 0.4;
  if (hemiLight) hemiLight.intensity = 0.5 + w * 0.5;
  if (warmLights) warmLights.forEach(l => { l.intensity = 0.2 + w * 0.8; });
}

// ============================================================
// RESPONSE VARIANTS
// ============================================================

function _applyVariant(questionId, value) {
  switch (questionId) {
    case 'pace': {
      const v = _num(value) || 3;
      const dist = Math.abs(v - 3);
      const brightness = dist === 0 ? 1.0 : dist === 1 ? 0.6 : 0.25;
      if (items.lamp?.glowMat) items.lamp.glowMat.opacity = brightness;
      if (items.lamp?.shadeMat) items.lamp.shadeMat.emissiveIntensity = brightness * 0.8;
      break;
    }
    case 'difficulty': {
      const v = _num(value) || 50;
      const count = Math.max(1, Math.min(5, Math.ceil(v / 20)));
      items.books?.meshes.forEach((m, i) => { m.visible = i < count; });
      break;
    }
    case 'peer-difficulty': {
      const v = _num(value) || 50;
      if (items.globe) items.globe.spinSpeed = 0.1 + (v / 100) * 0.6;
      break;
    }
    case 'useful-topics': {
      const sel = Array.isArray(value?.selected) ? value.selected
        : (value?.selected ? [value.selected] : []);
      const tm = items.scrolls?.topicMeshes;
      if (tm) {
        for (const [tid, m] of Object.entries(tm)) {
          m.hlMat.opacity = sel.includes(tid) ? 0.4 : 0;
        }
      }
      break;
    }
    case 'topic-depth': {
      const v = _num(value) || 3;
      items.notebook?.lines.forEach((l, i) => { l.mat.opacity = i < v ? 0.6 : 0; });
      break;
    }
    case 'method-ranking': {
      const ranking = Array.isArray(value?.ranked) ? value.ranked : [];
      const scales = [1.3, 1.1, 1.0, 0.85, 0.75];
      const tm = items.tools?.toolMeshes;
      if (tm) {
        ranking.forEach((mid, i) => {
          if (tm[mid] && i < 5) {
            const s = scales[i];
            tm[mid].scale.set(s, s, s);
          }
        });
      }
      break;
    }
    case 'overall-feeling': {
      const v = _num(value) || 3;
      const mugColors = [0x664433, 0x775544, 0x6B5535, 0x886644, 0x997755];
      if (items.mug?.bodyMat) items.mug.bodyMat.color.setHex(mugColors[Math.min(4, Math.max(0, v - 1))]);
      if (items.mug) items.mug.steamIntensity = 0.05 + (v / 5) * 0.35;
      break;
    }
    case 'ai-exam': {
      const isYes = value?.selected === 'yes' ||
        (Array.isArray(value?.selected) && value.selected.includes('yes'));
      if (items.laptop?.screenMat) items.laptop.screenMat.color.setHex(isYes ? 0x203040 : 0x302020);
      if (items.laptop?.iconMat) {
        items.laptop.iconMat.opacity = 0.8;
        items.laptop.iconMat.color.setHex(isYes ? 0x7BA7C9 : 0xF5C16C);
      }
      break;
    }
    case 'best-thing': {
      const len = typeof value?.text === 'string' ? value.text.length : 0;
      if (len === 0) { _hideItem('frame'); return; }
      const s = Math.min(1.3, 0.8 + (len / 500) * 0.5);
      if (items.frame) items.frame.group.scale.set(s, s, s);
      break;
    }
    case 'improvement': {
      const len = typeof value?.text === 'string' ? value.text.length : 0;
      if (len === 0) { _hideItem('sticky'); return; }
      const count = Math.min(4, Math.max(1, Math.ceil(len / 100)));
      items.sticky?.noteMeshes.forEach((n, i) => { n.visible = i < count; });
      break;
    }
    case 'anything-else': {
      const len = typeof value?.text === 'string' ? value.text.length : 0;
      const plant = items.plant;
      if (!plant) break;
      if (len === 0) {
        plant.stem.scale.y = 0.5;
        plant.leaves.forEach((l, i) => { l.visible = i === 0; });
        plant.flower.visible = false;
        return;
      }
      plant.stem.scale.y = Math.min(1.5, 0.5 + (len / 500));
      plant.leaves[0].visible = true;
      if (plant.leaves[1]) plant.leaves[1].visible = len > 50;
      if (plant.leaves[2]) plant.leaves[2].visible = len > 150;
      if (plant.leaves[3]) plant.leaves[3].visible = len > 300;
      plant.flower.visible = len > 400;
      break;
    }
  }
}

function _hideItem(id) {
  const item = items[id];
  if (!item) return;
  item.group.visible = false;
  item.group.scale.set(0, 0, 0);
  item.revealed = false;
  state.revealed.delete(id);
  const idx = pendingReveals.findIndex(r => r.group === item.group);
  if (idx !== -1) pendingReveals.splice(idx, 1);
  _updateWarmth();
}

// ============================================================
// HELPERS
// ============================================================

function _num(val) {
  if (!val) return null;
  if (typeof val === 'number') return val;
  if (typeof val.value === 'number') return val.value;
  const n = parseFloat(val.value ?? val);
  return isNaN(n) ? null : n;
}
