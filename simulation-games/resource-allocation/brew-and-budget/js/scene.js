// ============================================================
// THREE.JS SCENE — Isometric city, buildings, customers, weather
// ============================================================

import { COL, SCENE_COLORS, CUSTOMER_SPAWN, FONT_FAMILY, MARKETING_VFX } from './config.js';
import { lerp, clamp, randf, easeOutCubic } from './utils.js';
import { makePlayerCafeFront, makeCompCafeFront, makeBookshop, makeBakery, makeFlowerShop, makeBoardedFront, makeBillboardTexture, makeHeartTexture, makeStarTexture, scaleSprite, makeCustomerSprites, makeGlowCircle } from './sprites.js';

/* global THREE */

export class Scene3D {
  constructor(canvas, monopoly = false) {
    this.canvas = canvas;
    this.monopoly = monopoly;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new THREE.Color(COL.BG));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // Orthographic camera (isometric)
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = 8;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum, 0.1, 100
    );
    this.camera.position.set(12, 12, 12);
    this.camera.lookAt(0, 0, 0);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(new THREE.Color(COL.BG), 0.015);

    this._setupLighting();
    this._buildCity();
    this._setupCustomerPool();
    this._setupSteamParticles();
    this._setupSpendPool();
    this._setupDecorations();

    this.resize();
  }

  _setupLighting() {
    // Warm ambient — deeper golden tone
    this.ambient = new THREE.AmbientLight(0x554433, 0.8);
    this.scene.add(this.ambient);

    // Golden hour sun — warmer, softer
    this.sun = new THREE.DirectionalLight(0xFFDDBB, 0.85);
    this.sun.position.set(8, 12, 5);
    this.scene.add(this.sun);

    // Warm hemisphere — cozy sky/ground colors
    this.scene.add(new THREE.HemisphereLight(0xC0956A, 0x3A2816, 0.45));

    // Player cafe warm glow (stronger, wider)
    this.cafeLight = new THREE.PointLight(0xFFAA55, 1.4, 12);
    this.cafeLight.position.set(-3, 2, 0);
    this.scene.add(this.cafeLight);

    // Warm fill light at ground level — stronger for cozy feel
    const fillLight = new THREE.PointLight(0xFFCC88, 0.55, 8);
    fillLight.position.set(-3.5, 0.3, 0.5);
    this.scene.add(fillLight);

    // Global warm fill from south side (simulates light bouncing off ground)
    const southFill = new THREE.PointLight(0xFFBB77, 0.25, 15);
    southFill.position.set(0, 1, 6);
    this.scene.add(southFill);

    // Competitor cafe cool glow — slightly warmer than before
    if (!this.monopoly) {
      this.compLight = new THREE.PointLight(0x99CCDD, 0.6, 8);
      this.compLight.position.set(3, 2, 0);
      this.scene.add(this.compLight);
    }

    // Street lamps — warmer, slightly brighter
    [[-5, 0, 3], [0, 0, 3], [5, 0, 3]].forEach(pos => {
      const lamp = new THREE.PointLight(0xFFCC77, 0.5, 7);
      lamp.position.set(...pos);
      this.scene.add(lamp);
    });
  }

  _buildCity() {
    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(COL.GROUND) })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    this.scene.add(ground);

    // Road — procedural asphalt with center dashes
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 3),
      new THREE.MeshLambertMaterial({ map: this._makeRoadTexture() })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 2);
    this.scene.add(road);

    // Curb edges at road/sidewalk boundaries
    const curbMat = new THREE.MeshLambertMaterial({ color: 0x6B6358 });
    [0.55, 3.45].forEach(z => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(20, 0.06, 0.08), curbMat);
      curb.position.set(0, 0.03, z);
      this.scene.add(curb);
    });

    // Crosswalk markings
    this._addCrosswalk();

    // Sidewalks — procedural flagstone pattern
    [0, 4].forEach(z => {
      const sw = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 1.2),
        new THREE.MeshLambertMaterial({ map: this._makeSidewalkTexture() })
      );
      sw.rotation.x = -Math.PI / 2;
      sw.position.set(0, 0.01, z);
      this.scene.add(sw);
    });

    // --- Buildings ---
    this._buildBuilding(-3.5, 0, -1.5, 3.5, 3, 2.5, makePlayerCafeFront(), 'player');
    if (!this.monopoly) {
      this._buildBuilding(3.5, 0, -1.5, 3.5, 3, 2.5, makeCompCafeFront(), 'comp');
    } else {
      this._buildBuilding(3.5, 0, -1.5, 3.5, 3, 2.5, makeBoardedFront(), 'boarded');
    }

    // Background shops — three unique types
    this._buildBuilding(-7, 0, -3.5, 2.5, 2.5, 2, makeBookshop(), 'shop');
    this._buildBuilding(0, 0, -3.5, 2.5, 2.5, 2, makeBakery(), 'shop');
    this._buildBuilding(7, 0, -3.5, 2.5, 2.5, 2, makeFlowerShop(), 'shop');

    // Trees/benches (simple geometries)
    this._addTreesAndFurniture();

    // Outdoor cafe seating
    this._addOutdoorSeating();

    // Flower pots along sidewalk
    this._addFlowerPots();

    // Window light spill
    this._addWindowLightSpill();

    // Expanded landscape elements
    this._addLandscape();

    // Marketing effect indicators (initially hidden)
    this._setupMarketingEffects();
  }

  _addCrosswalk() {
    const stripeMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.CROSSWALK });
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 2.6),
        stripeMat
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(-0.9 + i * 0.6, 0.015, 2);
      this.scene.add(stripe);
    }
  }

  _addOutdoorSeating() {
    const tableMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.TABLE_TOP });
    const chairMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.CHAIR });

    // Two tables in front of player cafe
    [-4.5, -2.5].forEach(x => {
      // Table top (flat cylinder)
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8),
        tableMat
      );
      table.position.set(x, 0.55, 0.3);
      this.scene.add(table);

      // Table leg
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.55, 4),
        tableMat
      );
      leg.position.set(x, 0.275, 0.3);
      this.scene.add(leg);

      // Two chairs per table
      [-0.35, 0.35].forEach(oz => {
        const chair = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.35, 0.2),
          chairMat
        );
        chair.position.set(x, 0.175, 0.3 + oz);
        this.scene.add(chair);
      });
    });
  }

  _addFlowerPots() {
    const potMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.FLOWER_POT });
    const flowerColors = [SCENE_COLORS.FLOWER_PINK, SCENE_COLORS.FLOWER_YELLOW, SCENE_COLORS.FLOWER_RED, SCENE_COLORS.FLOWER_PINK, SCENE_COLORS.FLOWER_YELLOW];
    const positions = [-5.5, -3.5, -1.5, 0.5, 2.5];

    positions.forEach((x, i) => {
      // Pot
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.15, 0.2, 6),
        potMat
      );
      pot.position.set(x, 0.1, 0.2);
      this.scene.add(pot);

      // Flower
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 4),
        new THREE.MeshLambertMaterial({ color: flowerColors[i] })
      );
      flower.position.set(x, 0.28, 0.2);
      this.scene.add(flower);
    });
  }

  _addWindowLightSpill() {
    const spillMat = new THREE.MeshBasicMaterial({
      color: SCENE_COLORS.WINDOW_SPILL,
      transparent: true,
      opacity: 0.08,
    });

    // Two spill planes in front of player cafe windows
    [-4.5, -2.5].forEach(x => {
      const spill = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.5),
        spillMat
      );
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(x, 0.02, 0.1);
      this.scene.add(spill);
    });
  }

  _addLandscape() {
    // --- A few bushes for softness ---
    const bushMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.BUSH_GREEN });
    const bushDark = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.BUSH_DARK });
    [
      { x: -8.5, z: 3 }, { x: 8.5, z: 3 },
    ].forEach((pos, i) => {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 + (i % 3) * 0.05, 6, 5),
        i % 2 === 0 ? bushMat : bushDark
      );
      bush.position.set(pos.x, 0.2, pos.z);
      this.scene.add(bush);
    });

    // --- Hedges between background shops ---
    const hedgeMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.HEDGE });
    [-4, 4].forEach(x => {
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 1.5), hedgeMat);
      hedge.position.set(x, 0.3, -3.5);
      this.scene.add(hedge);
    });
  }

  // --- Procedural terrain textures ---

  _makeRoadTexture() {
    const w = 256, h = 64;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2A2520';
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const bR = 0x2A, bG = 0x25, bB = 0x20;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        // Sparse asphalt grain
        const grain = Math.random() > 0.5 ? (Math.random() - 0.5) * 5 : 0;
        // Slight edge darkening
        const edgeDist = Math.min(y, h - y) / (h * 0.5);
        const edgeDark = (1 - edgeDist) * -3;
        const v = grain + edgeDark;
        d[i]     = clamp(bR + v, 0, 255);
        d[i + 1] = clamp(bG + v, 0, 255);
        d[i + 2] = clamp(bB + v, 0, 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    // Faded dashed center line
    ctx.strokeStyle = 'rgba(200, 190, 170, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  _makeSidewalkTexture() {
    const w = 256, h = 32;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    // Dark grout base
    ctx.fillStyle = '#504840';
    ctx.fillRect(0, 0, w, h);
    // Flagstone grid — subtle color variation per stone
    const stoneW = 32, stoneH = 13, gap = 1;
    for (let sy = 0; sy < h; sy += stoneH + gap) {
      const rowIdx = sy / (stoneH + gap);
      const offset = (rowIdx % 2 === 1) ? stoneW * 0.5 : 0;
      for (let sx = -stoneW; sx < w + stoneW; sx += stoneW + gap) {
        const px = sx + offset;
        const variation = (Math.random() - 0.5) * 10;
        const r = clamp(0x5C + variation, 0, 255) | 0;
        const g = clamp(0x55 + variation * 0.9, 0, 255) | 0;
        const b = clamp(0x48 + variation * 0.7, 0, 255) | 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, sy, stoneW, stoneH);
      }
    }
    return new THREE.CanvasTexture(c);
  }

  _buildBuilding(x, y, z, w, h, d, faceTex, type) {
    const geo = new THREE.BoxGeometry(w, h, d);

    // Side material
    let sideColor = 0x8A7A6A;
    if (type === 'player') sideColor = 0xC9A67C;
    else if (type === 'comp') sideColor = 0x78AABC;
    else if (type === 'boarded') sideColor = 0x605040;

    const sideMat = new THREE.MeshLambertMaterial({ color: sideColor });

    // Front face texture
    const tex = new THREE.CanvasTexture(scaleSprite(faceTex, 8));
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    const frontMat = new THREE.MeshLambertMaterial({ map: tex });

    // Box faces: +x, -x, +y, -y, +z (front), -z (back)
    const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];
    const mesh = new THREE.Mesh(geo, materials);
    mesh.position.set(x, y + h / 2, z);
    this.scene.add(mesh);

    // Store reference for effects
    if (type === 'player') this.playerBuilding = mesh;
    if (type === 'comp') this.compBuilding = mesh;
  }

  _addTreesAndFurniture() {
    // Improved trees: icosahedron canopy, warmer green, varied sizes
    const treeMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.TREE_GREEN });
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    const benchMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });

    const treeSizes = [0.55, 0.5, 0.6, 0.45];
    [-6, -2, 2, 6].forEach((x, i) => {
      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1, 6), trunkMat);
      trunk.position.set(x, 0.5, 5);
      this.scene.add(trunk);
      // Organic canopy (icosahedron)
      const canopy = new THREE.Mesh(
        new THREE.IcosahedronGeometry(treeSizes[i], 1),
        treeMat
      );
      canopy.position.set(x, 1.3, 5);
      this.scene.add(canopy);
    });

    // Benches
    [-4, 4].forEach(x => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 0.4), benchMat);
      bench.position.set(x, 0.15, 4.5);
      this.scene.add(bench);
    });

    // Improved lamp posts
    const lampMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.LAMP_POST });
    [-5, 0, 5].forEach(x => {
      // Thicker post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.5, 6), lampMat);
      post.position.set(x, 1.25, 3.5);
      this.scene.add(post);
      // Arm bracket
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.04), lampMat);
      arm.position.set(x + 0.15, 2.4, 3.5);
      this.scene.add(arm);
      // Larger warm bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshBasicMaterial({ color: SCENE_COLORS.LAMP_BULB }));
      bulb.position.set(x + 0.3, 2.38, 3.5);
      this.scene.add(bulb);
    });
  }

  _setupSteamParticles() {
    this.steamParticles = [];
    const steamMat = new THREE.MeshBasicMaterial({
      color: SCENE_COLORS.STEAM,
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 0; i < 8; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        steamMat.clone()
      );
      const startY = 3.2 + Math.random() * 0.8;
      particle.position.set(
        -3.5 + (Math.random() - 0.5) * 1.5,
        startY,
        -1.5 + (Math.random() - 0.5) * 0.5
      );
      particle.userData = {
        baseX: particle.position.x,
        baseZ: particle.position.z,
        speed: 0.3 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      };
      this.scene.add(particle);
      this.steamParticles.push(particle);
    }
  }

  _setupMarketingEffects() {
    // ===== Channel A: Discovery — Billboard + Flyers =====
    const bbPos = MARKETING_VFX.BILLBOARD_POS;

    // Billboard frame (two posts + board)
    const postMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 4), postMat);
    post1.position.set(bbPos.x - 0.5, 1, bbPos.z);
    this.scene.add(post1);
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 4), postMat);
    post2.position.set(bbPos.x + 0.5, 1, bbPos.z);
    this.scene.add(post2);

    // Billboard face with canvas texture
    const bbCanvas = makeBillboardTexture();
    const bbTex = new THREE.CanvasTexture(bbCanvas);
    const bbMat = new THREE.MeshBasicMaterial({ map: bbTex, transparent: true, opacity: 0.8 });
    this._billboardMat = bbMat;
    const billboard = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), bbMat);
    billboard.position.set(bbPos.x, 2.2, bbPos.z + 0.01);
    this.scene.add(billboard);

    // Billboard glow light (scales with adstock)
    this._billboardGlow = new THREE.PointLight(0xFFAA44, 0, 5);
    this._billboardGlow.position.set(bbPos.x, 2.5, bbPos.z + 0.5);
    this.scene.add(this._billboardGlow);

    // Flyer pool
    this._flyers = [];
    const flyerMat = new THREE.MeshBasicMaterial({ color: 0xFFCC77, transparent: true, opacity: 0, side: THREE.DoubleSide });
    for (let i = 0; i < MARKETING_VFX.FLYER_POOL; i++) {
      const flyer = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.1), flyerMat.clone());
      flyer.position.set(0, -10, 0);
      this.scene.add(flyer);
      this._flyers.push({
        mesh: flyer, active: false, time: 0, lifetime: MARKETING_VFX.FLYER_LIFETIME,
        vx: 0, vy: 0, vz: 0, phase: Math.random() * Math.PI * 2,
      });
    }
    this._flyerTimer = 0;

    // ===== Channel B: Conversion — Neon Sign + Flags + Spotlight =====
    const neonPos = MARKETING_VFX.NEON_POS;

    // Neon sign on storefront
    const neonMat = new THREE.MeshBasicMaterial({ color: 0x44AAFF, transparent: true, opacity: 0 });
    this._neonSign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), neonMat);
    this._neonSign.position.set(neonPos.x, neonPos.y, neonPos.z);
    this.scene.add(this._neonSign);

    // Neon glow light
    this._neonGlow = new THREE.PointLight(0x44AAFF, 0, 4);
    this._neonGlow.position.set(neonPos.x, neonPos.y, neonPos.z + 0.3);
    this.scene.add(this._neonGlow);

    // Pennant flags
    this._flags = [];
    const flagColors = [0x44AAFF, 0x55BBFF, 0x3399EE, 0x44AAFF, 0x55BBFF, 0x3399EE];
    for (let i = 0; i < MARKETING_VFX.FLAG_COUNT; i++) {
      const flagGeo = new THREE.BufferGeometry();
      // Triangular pennant
      const verts = new Float32Array([0, 0, 0, 0.1, -0.2, 0, -0.1, -0.2, 0]);
      flagGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      flagGeo.computeVertexNormals();
      const flagMat = new THREE.MeshBasicMaterial({
        color: flagColors[i], transparent: true, opacity: 0, side: THREE.DoubleSide
      });
      const flag = new THREE.Mesh(flagGeo, flagMat);
      const fx = -5 + i * (3 / MARKETING_VFX.FLAG_COUNT);
      flag.position.set(fx, 3.2, -0.22);
      this.scene.add(flag);
      this._flags.push({ mesh: flag, baseX: fx, phase: i * 0.8 });
    }

    // String line for flags
    this._flagLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-5, 3.2, -0.22),
        new THREE.Vector3(-2, 3.2, -0.22),
      ]),
      new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0 })
    );
    this.scene.add(this._flagLine);

    // Spotlight cone
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x44AAFF, transparent: true, opacity: 0, side: THREE.DoubleSide });
    this._spotlight = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2, 8, 1, true), coneMat);
    this._spotlight.position.set(-3.5, 4.5, -1);
    this.scene.add(this._spotlight);

    // ===== Channel C: Social Buzz — Floating Icons + Sparkles =====
    this._socialIcons = [];
    const heartTex = new THREE.CanvasTexture(makeHeartTexture());
    const starTex = new THREE.CanvasTexture(makeStarTexture());

    for (let i = 0; i < MARKETING_VFX.ICON_POOL; i++) {
      const tex = i % 2 === 0 ? heartTex : starTex;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.25, 0.25, 1);
      sprite.position.set(0, -10, 0);
      this.scene.add(sprite);
      this._socialIcons.push({
        sprite, active: false, time: 0, lifetime: MARKETING_VFX.ICON_LIFETIME,
        vx: 0, vy: 0, vz: 0, phase: Math.random() * Math.PI * 2,
      });
    }
    this._iconTimer = 0;

    // Sparkle pool
    this._sparkles = [];
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xEE88FF, transparent: true, opacity: 0 });
    for (let i = 0; i < MARKETING_VFX.SPARKLE_POOL; i++) {
      const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 3), sparkleMat.clone());
      sparkle.position.set(0, -10, 0);
      this.scene.add(sparkle);
      this._sparkles.push({ mesh: sparkle, active: false, time: 0, lifetime: 0.6, vx: 0, vy: 0, vz: 0 });
    }
  }

  _setupCustomerPool() {
    // Generate sprite textures for customers
    this._custSpriteCanvases = makeCustomerSprites();
    this._custTextures = this._custSpriteCanvases.map(c => {
      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    });

    // Glow circle texture
    const glowCanvas = makeGlowCircle();
    this._glowTexture = new THREE.CanvasTexture(glowCanvas);

    this.customers = [];
    for (let i = 0; i < CUSTOMER_SPAWN.POOL_SIZE; i++) {
      // Customer sprite
      const spriteMat = new THREE.SpriteMaterial({
        map: this._custTextures[i % this._custTextures.length],
        transparent: true,
        opacity: 0,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.5, 0.625, 1); // 8:10 aspect ratio
      sprite.position.set(0, 0.4, 10);
      this.scene.add(sprite);

      // Glow circle beneath
      const glowMat = new THREE.SpriteMaterial({
        map: this._glowTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(0.7, 0.35, 1);
      glow.position.set(0, 0.02, 10);
      this.scene.add(glow);

      this.customers.push({
        sprite,
        glow,
        active: false,
        progress: 0,
        type: 'player',
        startX: 0,
        targetX: 0,
        speed: CUSTOMER_SPAWN.BASE_SPEED,
        spriteIdx: i % this._custTextures.length,
        bouncing: false,
        bounceTime: 0,
        spendTriggered: false,
      });
    }
    this._custTimer = 0;
  }

  // Update customer animations, steam, spend pops, decorations, and marketing effects
  update(dt, gameState) {
    this._custTimer += dt;
    const now = performance.now() / 1000;

    // Spawn customers during simulation
    if (gameState.phase === 'simulating' && gameState.todayRecord) {
      const rec = gameState.todayRecord;
      const spawnRate = gameState.simSpeed === 0 ? 0 : (gameState.simSpeed === 6 ? 0.15 : (gameState.simSpeed === 3 ? 0.3 : 0.5));

      if (this._custTimer > spawnRate && spawnRate > 0) {
        this._custTimer = 0;
        this._spawnCustomer(rec);
      }
    }

    // Animate customers — multi-segment walk path with bobbing
    for (const c of this.customers) {
      if (!c.active) continue;
      c.progress += dt * c.speed;

      if (c.progress >= 1) {
        c.active = false;
        c.sprite.material.opacity = 0;
        c.glow.material.opacity = 0;
        c.sprite.position.z = 10;
        c.glow.position.z = 10;
        continue;
      }

      const t = c.progress;
      let posX, posZ;

      if (c.type === 'leave') {
        // Leaving customers walk straight across and off
        posX = lerp(c.startX, c.targetX, clamp(t * 1.5, 0, 1));
        posZ = lerp(5.5, -3, t);
      } else {
        // Multi-segment path toward cafe
        if (t < 0.15) {
          // Phase 1: Walk along far sidewalk
          const p = t / 0.15;
          posZ = 5.0;
          posX = lerp(c.startX, c.startX * 0.3, easeOutCubic(p));
        } else if (t < 0.35) {
          // Phase 2: Cross the road
          const p = (t - 0.15) / 0.2;
          posZ = lerp(5.0, 1.0, easeOutCubic(p));
          posX = lerp(c.startX * 0.3, c.targetX * 0.7, p);
        } else if (t < 0.70) {
          // Phase 3: Walk along near sidewalk toward cafe
          const p = (t - 0.35) / 0.35;
          posZ = lerp(1.0, 0.2, p * 0.3);
          posX = lerp(c.targetX * 0.7, c.targetX, easeOutCubic(p));
        } else if (t < 0.90) {
          // Phase 4: Enter cafe building
          const p = (t - 0.70) / 0.2;
          posZ = lerp(0.2 * 0.7, -0.8, easeOutCubic(p));
          posX = c.targetX;
        } else {
          // Phase 5: Fade out inside
          const p = (t - 0.90) / 0.1;
          posZ = lerp(-0.8, -1.5, p);
          posX = c.targetX;
        }

        // Trigger spend pop when entering cafe (phase 4 start)
        if (t >= 0.70 && !c.spendTriggered && c.type === 'player') {
          c.spendTriggered = true;
          if (gameState.todayRecord) {
            const rec = gameState.todayRecord;
            const amount = rec.customers > 0 ? Math.round(rec.revenue / rec.customers) : 0;
            if (amount > 0) this._triggerSpend(c.targetX, amount);
          }
          // Start arrival bounce
          c.bouncing = true;
          c.bounceTime = 0;
        }
      }

      // Walking bob
      const bobY = Math.sin(now * CUSTOMER_SPAWN.BOB_FREQUENCY * Math.PI * 2 + c.spriteIdx) * CUSTOMER_SPAWN.BOB_AMPLITUDE;

      c.sprite.position.x = posX;
      c.sprite.position.z = posZ;
      c.sprite.position.y = 0.35 + bobY;

      c.glow.position.x = posX;
      c.glow.position.z = posZ;
      c.glow.position.y = 0.02;

      // Flip sprite based on walk direction
      const movingRight = c.targetX > c.startX;
      c.sprite.material.rotation = 0;
      const scaleX = movingRight ? -0.5 : 0.5;
      c.sprite.scale.set(scaleX, 0.625, 1);

      // Opacity: fade in, hold, fade out
      let alpha;
      if (t < 0.08) alpha = t / 0.08;
      else if (t > 0.90) alpha = (1 - t) / 0.1;
      else alpha = 1;
      c.sprite.material.opacity = alpha;
      c.glow.material.opacity = alpha * 0.4;

      // Glow pulse
      const glowScale = 0.7 + Math.sin(now * 2 + c.spriteIdx * 0.5) * 0.05;
      c.glow.scale.set(glowScale, glowScale * 0.5, 1);

      // Arrival bounce
      if (c.bouncing) {
        c.bounceTime += dt;
        if (c.bounceTime < CUSTOMER_SPAWN.BOUNCE_DURATION) {
          const bp = c.bounceTime / CUSTOMER_SPAWN.BOUNCE_DURATION;
          const bounceScale = 1 + 0.15 * Math.sin(bp * Math.PI);
          c.sprite.scale.y = 0.625 * bounceScale;
        } else {
          c.bouncing = false;
          c.sprite.scale.y = 0.625;
        }
      }
    }

    // Animate spend pop-ups
    this._updateSpendPops(dt);

    // Animate upgrade decorations
    this._updateDecorations(dt, now);

    // Animate steam particles
    for (const p of this.steamParticles) {
      const ud = p.userData;
      p.position.y += ud.speed * dt;
      p.position.x = ud.baseX + Math.sin(now * 1.5 + ud.phase) * 0.15;
      p.scale.setScalar(1 + (p.position.y - 3.2) * 0.5);
      p.material.opacity = Math.max(0, 0.15 - (p.position.y - 3.2) * 0.08);

      // Reset when fully faded
      if (p.material.opacity <= 0.01) {
        p.position.y = 3.2 + Math.random() * 0.2;
        p.position.x = ud.baseX;
        p.scale.setScalar(1);
        p.material.opacity = 0.15;
      }
    }

    // Marketing effects
    this._updateMarketingEffects(dt, now, gameState);

    // Weather lighting
    if (gameState.todayRecord) {
      const w = gameState.todayRecord.weather;
      if (w.name === 'Sunny' || w.name === 'Hot') {
        this.sun.intensity = lerp(this.sun.intensity, 1.2, dt * 2);
      } else if (w.name === 'Rainy' || w.name === 'Snowy') {
        this.sun.intensity = lerp(this.sun.intensity, 0.3, dt * 2);
      } else {
        this.sun.intensity = lerp(this.sun.intensity, 0.9, dt * 2);
      }
    }

    // Cafe glow pulse
    this.cafeLight.intensity = 1.0 + 0.2 * Math.sin(performance.now() / 1000);
  }

  _spawnCustomer(record) {
    const avail = this.customers.find(c => !c.active);
    if (!avail) return;

    // Decide type based on record
    const r = Math.random();
    const pShare = record.playerShare || 0.5;
    let type;
    if (r < pShare) {
      type = 'player';
    } else if (!this.monopoly && r < pShare + 0.3) {
      type = 'comp';
    } else {
      type = 'leave';
    }

    // Pick a random sprite
    const spriteIdx = Math.floor(Math.random() * this._custTextures.length);
    avail.spriteIdx = spriteIdx;
    avail.sprite.material.map = this._custTextures[spriteIdx];
    avail.sprite.material.needsUpdate = true;

    avail.active = true;
    avail.progress = 0;
    avail.type = type;
    avail.startX = randf(CUSTOMER_SPAWN.SPAWN_X_MIN, CUSTOMER_SPAWN.SPAWN_X_MAX);
    avail.targetX = type === 'player' ? -3.5 : (type === 'comp' ? 3.5 : randf(-4, 4));
    avail.speed = CUSTOMER_SPAWN.BASE_SPEED + randf(-CUSTOMER_SPAWN.SPEED_VARIANCE, CUSTOMER_SPAWN.SPEED_VARIANCE);
    avail.sprite.material.opacity = 0;
    avail.glow.material.opacity = 0;
    avail.sprite.position.set(avail.startX, 0.35, 5.5);
    avail.glow.position.set(avail.startX, 0.02, 5.5);
    avail.bouncing = false;
    avail.bounceTime = 0;
    avail.spendTriggered = false;
  }

  // --- Spend Pop-up System ---
  _setupSpendPool() {
    this._spendPops = [];
    for (let i = 0; i < CUSTOMER_SPAWN.SPEND_POOL_SIZE; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 128; canvas.height = 48;
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.2, 0.45, 1);
      sprite.position.set(0, 10, 0);
      this.scene.add(sprite);
      this._spendPops.push({ sprite, canvas, tex, active: false, time: 0, startY: 0 });
    }
  }

  _triggerSpend(x, amount) {
    const pop = this._spendPops.find(p => !p.active);
    if (!pop) return;

    // Render text to canvas
    const ctx = pop.canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 48);
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('+$' + amount, 66, 26);
    // Main text
    ctx.fillStyle = '#FFD088';
    ctx.fillText('+$' + amount, 64, 24);
    pop.tex.needsUpdate = true;

    pop.active = true;
    pop.time = 0;
    pop.startY = 3.2;
    pop.sprite.position.set(x + randf(-0.3, 0.3), pop.startY, -0.5);
    pop.sprite.material.opacity = 0;
  }

  _updateSpendPops(dt) {
    for (const pop of this._spendPops) {
      if (!pop.active) continue;
      pop.time += dt;
      const t = pop.time / CUSTOMER_SPAWN.SPEND_LIFETIME;
      if (t >= 1) {
        pop.active = false;
        pop.sprite.material.opacity = 0;
        pop.sprite.position.y = 10;
        continue;
      }

      // Float upward with ease-out
      pop.sprite.position.y = pop.startY + easeOutCubic(t) * 1.5;

      // Fade lifecycle: fade in (0-15%), hold (15-70%), fade out (70-100%)
      let alpha;
      if (t < 0.15) alpha = t / 0.15;
      else if (t < 0.70) alpha = 1;
      else alpha = (1 - t) / 0.3;
      pop.sprite.material.opacity = alpha;
    }
  }

  // --- Upgrade Decoration System ---
  _setupDecorations() {
    this._decorations = {}; // keyed by type: 'tier1', 'tier2', 'tier3', 'comp_intel'
    this._decoParticles = [];
    this._decoAnims = []; // active scale-in animations
  }

  addUpgradeDecoration(type, skipAnimation = false) {
    if (this._decorations[type]) return; // already added

    const group = new THREE.Group();
    // Player cafe roof is at y=3, building center x=-3.5, front face z=-0.25 (approx)
    const roofY = 3.05;
    const cafeX = -3.5;

    if (type === 'tier1') {
      // Satellite dish on roof edge
      const poleMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.DISH_POLE });
      const dishMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.DISH_GREY });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), poleMat);
      pole.position.set(0, 0.2, 0);
      group.add(pole);
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.15, 8, 1, true), dishMat);
      dish.rotation.x = -0.3;
      dish.position.set(0, 0.42, 0.05);
      group.add(dish);
      group.position.set(cafeX + 1.2, roofY, -1.0);
    } else if (type === 'tier2') {
      // Glowing data screen on building face
      const screenMat = new THREE.MeshBasicMaterial({
        color: SCENE_COLORS.SCREEN_BLUE,
        transparent: true,
        opacity: 0.8,
      });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), screenMat);
      screen.position.set(0, 0, 0.01);
      group.add(screen);
      // Point light for glow
      const screenLight = new THREE.PointLight(0x44AAFF, 0.3, 2);
      screenLight.position.set(0, 0, 0.3);
      group.add(screenLight);
      group.position.set(cafeX + 1.3, 2.0, -0.24);
      group.userData.screenMat = screenMat;
    } else if (type === 'tier3') {
      // 3-antenna array with pulsing green tips
      const antMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.ANTENNA_GREY });
      const tipMat1 = new THREE.MeshBasicMaterial({ color: SCENE_COLORS.ANTENNA_TIP, transparent: true, opacity: 1 });
      const tipMat2 = new THREE.MeshBasicMaterial({ color: SCENE_COLORS.ANTENNA_TIP, transparent: true, opacity: 1 });
      const tipMat3 = new THREE.MeshBasicMaterial({ color: SCENE_COLORS.ANTENNA_TIP, transparent: true, opacity: 1 });
      const tipMats = [tipMat1, tipMat2, tipMat3];

      [-0.2, 0, 0.2].forEach((xOff, i) => {
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5 + i * 0.1, 4), antMat);
        antenna.position.set(xOff, 0.25 + i * 0.05, 0);
        group.add(antenna);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), tipMats[i]);
        tip.position.set(xOff, 0.52 + i * 0.1, 0);
        group.add(tip);
      });
      group.position.set(cafeX - 1.0, roofY, -1.0);
      group.userData.tipMats = tipMats;
    } else if (type === 'comp_intel') {
      // Telescope on tripod
      const tubeMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.TELESCOPE });
      const tripodMat = new THREE.MeshLambertMaterial({ color: SCENE_COLORS.TRIPOD });
      // Tube
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.5, 6), tubeMat);
      tube.rotation.z = 0.4;
      tube.position.set(0, 0.35, 0);
      group.add(tube);
      // Tripod legs
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 3), tripodMat);
        const angle = (i / 3) * Math.PI * 2;
        leg.position.set(Math.cos(angle) * 0.1, 0.12, Math.sin(angle) * 0.1);
        leg.rotation.x = Math.sin(angle) * 0.3;
        leg.rotation.z = Math.cos(angle) * 0.3;
        group.add(leg);
      }
      // Lens
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0x88CCFF }));
      lens.position.set(0.15, 0.52, 0);
      group.add(lens);
      group.position.set(cafeX, roofY, -2.0);
    }

    this.scene.add(group);
    this._decorations[type] = group;

    if (!skipAnimation) {
      // Scale-in animation
      group.scale.setScalar(0);
      this._decoAnims.push({ group, time: 0, duration: 0.5 });
      // Particle burst
      this._spawnDecoParticles(group.position);
    }
  }

  _spawnDecoParticles(pos) {
    const particleMat = new THREE.MeshBasicMaterial({
      color: SCENE_COLORS.PARTICLE_GOLD,
      transparent: true,
      opacity: 1,
    });
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 3), particleMat.clone());
      const angle = (i / 12) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 1.5;
      p.position.copy(pos);
      p.userData = {
        vx: Math.cos(angle) * speed * 0.5,
        vy: 2 + Math.random() * 2,
        vz: Math.sin(angle) * speed * 0.5,
        time: 0,
        lifetime: 0.6 + Math.random() * 0.2,
      };
      this.scene.add(p);
      this._decoParticles.push(p);
    }
  }

  _updateDecorations(dt, now) {
    // Scale-in animations
    for (let i = this._decoAnims.length - 1; i >= 0; i--) {
      const anim = this._decoAnims[i];
      anim.time += dt;
      const t = clamp(anim.time / anim.duration, 0, 1);
      // Ease-out bounce: overshoot then settle
      const ease = t < 0.6 ? easeOutCubic(t / 0.6) * 1.15 : 1.15 - 0.15 * easeOutCubic((t - 0.6) / 0.4);
      anim.group.scale.setScalar(ease);
      if (t >= 1) {
        anim.group.scale.setScalar(1);
        this._decoAnims.splice(i, 1);
      }
    }

    // Particle burst physics
    for (let i = this._decoParticles.length - 1; i >= 0; i--) {
      const p = this._decoParticles[i];
      const ud = p.userData;
      ud.time += dt;
      ud.vy -= 8 * dt; // gravity
      p.position.x += ud.vx * dt;
      p.position.y += ud.vy * dt;
      p.position.z += ud.vz * dt;
      p.material.opacity = clamp(1 - ud.time / ud.lifetime, 0, 1);
      if (ud.time >= ud.lifetime) {
        this.scene.remove(p);
        this._decoParticles.splice(i, 1);
      }
    }

    // Tier 2 screen breathing
    if (this._decorations.tier2) {
      const screenMat = this._decorations.tier2.userData.screenMat;
      if (screenMat) {
        screenMat.opacity = 0.6 + 0.2 * Math.sin(now * 2);
      }
    }

    // Tier 3 antenna tips pulsing independently
    if (this._decorations.tier3) {
      const tips = this._decorations.tier3.userData.tipMats;
      if (tips) {
        tips.forEach((mat, i) => {
          mat.opacity = 0.5 + 0.5 * Math.sin(now * 3 + i * 2.1);
        });
      }
    }
  }

  _updateMarketingEffects(dt, now, gameState) {
    const isActive = gameState.phase === 'simulating' || gameState.phase === 'budget';
    const alloc = gameState.alloc || { a: 0, b: 0, c: 0 };
    const rec = gameState.todayRecord;
    const isSimulating = gameState.phase === 'simulating';

    // ===== Channel A: Billboard + Flyers =====
    // Billboard glow scales with adstock (compounding indicator)
    const adstock = rec ? (rec.adstockA || 0) : 0;
    const adstockIntensity = isActive ? clamp(adstock / 50000, 0, 1.5) : 0;
    this._billboardGlow.intensity = lerp(this._billboardGlow.intensity, adstockIntensity, dt * 3);
    this._billboardMat.opacity = isActive && alloc.a > 0 ? 0.6 + adstockIntensity * 0.25 : 0.3;

    // Flyers — spawn proportional to daily A spend
    if (isSimulating && rec) {
      const dailyA = rec.dailySpend ? rec.dailySpend.a : 0;
      const flyerRate = dailyA > 0 ? clamp(0.8 - (dailyA / 12000) * 0.6, 0.15, 0.8) : 999;
      this._flyerTimer += dt;
      if (this._flyerTimer > flyerRate) {
        this._flyerTimer = 0;
        this._spawnFlyer();
      }
    }

    // Animate active flyers
    for (const f of this._flyers) {
      if (!f.active) continue;
      f.time += dt;
      if (f.time >= f.lifetime) {
        f.active = false;
        f.mesh.material.opacity = 0;
        f.mesh.position.y = -10;
        continue;
      }
      const t = f.time / f.lifetime;
      f.mesh.position.x += f.vx * dt;
      f.mesh.position.y += f.vy * dt - 0.3 * dt;
      f.mesh.position.z += f.vz * dt;
      // Flutter
      f.mesh.rotation.z = Math.sin(now * 5 + f.phase) * 0.4;
      f.mesh.rotation.x = Math.sin(now * 3 + f.phase * 2) * 0.3;
      // Fade
      f.mesh.material.opacity = t < 0.1 ? t / 0.1 : (t > 0.7 ? (1 - t) / 0.3 : 0.7);
    }

    // ===== Channel B: Neon Sign + Flags + Spotlight =====
    const bIntensity = isActive ? clamp(alloc.b / 200000, 0, 1) : 0;

    // Neon sign pulse
    const neonPulse = 0.4 + 0.3 * Math.sin(now * 4);
    this._neonSign.material.opacity = bIntensity * neonPulse;
    this._neonGlow.intensity = bIntensity * 0.8;

    // Flags — visible count proportional to B spend
    const visibleFlags = Math.round(bIntensity * MARKETING_VFX.FLAG_COUNT);
    for (let i = 0; i < this._flags.length; i++) {
      const flag = this._flags[i];
      const visible = i < visibleFlags;
      flag.mesh.material.opacity = visible ? 0.8 : 0;
      if (visible) {
        // Gentle wave
        const wave = Math.sin(now * MARKETING_VFX.FLAG_WAVE_SPEED + flag.phase) * 0.1;
        flag.mesh.position.y = 3.2 + wave;
      }
    }
    this._flagLine.material.opacity = visibleFlags > 0 ? 0.5 : 0;

    // Spotlight
    this._spotlight.material.opacity = bIntensity * 0.06;
    this._spotlight.rotation.y = now * 0.3;

    // ===== Channel C: Social Icons + Sparkles =====
    const dailyC = rec && rec.dailySpend ? rec.dailySpend.c : 0;

    // Spawn social icons proportional to C spend
    if (isSimulating && dailyC > 0) {
      const iconRate = clamp(1.0 - (dailyC / 10000) * 0.7, 0.2, 1.0);
      this._iconTimer += dt;
      if (this._iconTimer > iconRate) {
        this._iconTimer = 0;
        this._spawnSocialIcon();
      }
    }

    // Animate active icons
    for (const icon of this._socialIcons) {
      if (!icon.active) continue;
      icon.time += dt;
      if (icon.time >= icon.lifetime) {
        icon.active = false;
        icon.sprite.material.opacity = 0;
        icon.sprite.position.y = -10;
        // Spawn sparkle burst at death position
        this._spawnSparkle(icon.sprite.position.x, icon.sprite.position.y, icon.sprite.position.z);
        continue;
      }
      const t = icon.time / icon.lifetime;
      icon.sprite.position.y += MARKETING_VFX.ICON_SPEED * dt;
      icon.sprite.position.x += Math.sin(now * 2 + icon.phase) * 0.3 * dt;
      // Scale up then shrink
      const scale = t < 0.2 ? t / 0.2 * 0.3 : (t > 0.8 ? (1 - t) / 0.2 * 0.3 : 0.3);
      icon.sprite.scale.set(scale, scale, 1);
      // Opacity
      icon.sprite.material.opacity = t < 0.1 ? t / 0.1 : (t > 0.8 ? (1 - t) / 0.2 : 0.8);
    }

    // Animate sparkles
    for (const s of this._sparkles) {
      if (!s.active) continue;
      s.time += dt;
      if (s.time >= s.lifetime) {
        s.active = false;
        s.mesh.material.opacity = 0;
        s.mesh.position.y = -10;
        continue;
      }
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.vy -= 3 * dt;
      s.mesh.material.opacity = clamp(1 - s.time / s.lifetime, 0, 1) * 0.8;
    }
  }

  _spawnFlyer() {
    const f = this._flyers.find(f => !f.active);
    if (!f) return;
    const bbPos = MARKETING_VFX.BILLBOARD_POS;
    f.active = true;
    f.time = 0;
    f.mesh.position.set(
      bbPos.x + randf(-0.5, 0.5),
      2.0 + randf(0, 0.5),
      bbPos.z + randf(-0.2, 0.2)
    );
    // Drift toward cafe
    f.vx = randf(0.3, 0.8);
    f.vy = randf(-0.1, 0.2);
    f.vz = randf(-0.5, -0.2);
    f.phase = Math.random() * Math.PI * 2;
  }

  _spawnSocialIcon() {
    const icon = this._socialIcons.find(i => !i.active);
    if (!icon) return;
    icon.active = true;
    icon.time = 0;
    icon.sprite.position.set(
      randf(-5, 5),
      0.5 + randf(0, 1),
      randf(0, 4)
    );
    icon.phase = Math.random() * Math.PI * 2;
    icon.sprite.material.opacity = 0;
  }

  _spawnSparkle(x, y, z) {
    const s = this._sparkles.find(s => !s.active);
    if (!s) return;
    s.active = true;
    s.time = 0;
    s.mesh.position.set(x, y, z);
    s.vx = randf(-1.5, 1.5);
    s.vy = randf(0.5, 2);
    s.vz = randf(-1.5, 1.5);
  }

  setMonopoly(val) {
    this.monopoly = val;
    // Rebuild would be needed for full change, but toggled at game start
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const frustum = 8;
    this.camera.left = -frustum * aspect;
    this.camera.right = frustum * aspect;
    this.camera.top = frustum;
    this.camera.bottom = -frustum;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
