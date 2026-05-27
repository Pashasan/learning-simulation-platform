// ============================================================
// SCENE — Three.js robot lab scene for RoboVault
// ============================================================

import { PHASES, COL } from './config.js';
import { buildRobot } from './sprites.js';

const THREE = window.THREE;

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this._contextLost = false;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x0D1117, 1);

    // Handle WebGL context loss/restore (weak GPUs drop context under memory pressure)
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this._contextLost = true;
      console.warn('WebGL context lost — pausing 3D rendering');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this._contextLost = false;
      this.renderer.setClearColor(0x0D1117, 1);
      this.resize();
      console.info('WebGL context restored — resuming 3D rendering');
    });

    this.scene = new THREE.Scene();

    // Camera — isometric-ish
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
    this.camera.position.set(6, 5, 8);
    this.camera.lookAt(0, 1, 0);

    // Lighting
    const ambient = new THREE.AmbientLight(0x58A6FF, 0.45);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xE6EDF3, 0.8);
    dirLight.position.set(5, 8, 5);
    this.scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x58A6FF, 0.5, 20);
    pointLight.position.set(-3, 4, 2);
    this.scene.add(pointLight);

    // Fill light for back robots
    const backFill = new THREE.PointLight(0x58A6FF, 0.4, 18);
    backFill.position.set(0, 3, -3);
    this.scene.add(backFill);

    // Floor grid
    this._buildFloor();

    // Lab tables for competitors
    this._buildLabTables();

    // Pedestal for player robot
    this._buildPedestal();

    // Holographic screens
    this._buildHoloScreens();

    // Floating particles
    this._particles = this._buildParticles();

    // Conveyor belt (for launch animation)
    this._conveyor = this._buildConveyor();

    // Robot mesh (updated when config changes)
    this._robotGroup = null;
    this._currentConfigKey = '';

    // Competitor robot meshes
    this._competitorRobots = [];
    this._currentCompKey = '';

    // Animation time
    this._time = 0;

    // Result animation state
    this._resultAnimActive = false;
    this._resultAnimParticles = null;  // THREE.Points for sparkle/smoke/spark effects
    this._savedChildTransforms = [];   // saved per-child positions for F-grade scatter restore

    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _buildFloor() {
    // Dark floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0D1117,
      metalness: 0.8,
      roughness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    this.scene.add(floor);

    // Grid lines
    const gridHelper = new THREE.GridHelper(20, 20, 0x1A2332, 0x1A2332);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  _buildPedestal() {
    const pedGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.15, 32);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1C2129,
      metalness: 0.7,
      roughness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.set(0, 0.075, 0);
    this.scene.add(pedestal);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(0.75, 0.85, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x58A6FF,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.16;
    this.scene.add(ring);
    this._glowRing = ring;
  }

  _buildLabTables() {
    // 2-3 small tables around the scene for competitor robots
    const positions = [
      { x: -3, z: -2 },
      { x: 3, z: -1.5 },
      { x: -2, z: 3 },
    ];

    this._tablePositions = positions;

    for (const pos of positions) {
      const tableGeo = new THREE.BoxGeometry(1.2, 0.8, 0.8);
      const tableMat = new THREE.MeshStandardMaterial({
        color: 0x161B22,
        metalness: 0.5,
        roughness: 0.4,
      });
      const table = new THREE.Mesh(tableGeo, tableMat);
      table.position.set(pos.x, 0.4, pos.z);
      this.scene.add(table);
    }
  }

  _buildHoloScreens() {
    // Floating translucent planes
    const screenGeo = new THREE.PlaneGeometry(1.5, 1.0);
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0x58A6FF,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });

    const screen1 = new THREE.Mesh(screenGeo, screenMat);
    screen1.position.set(-2.5, 2.5, 0);
    screen1.rotation.y = 0.4;
    this.scene.add(screen1);

    const screen2 = new THREE.Mesh(screenGeo, screenMat);
    screen2.position.set(2.5, 2.2, -0.5);
    screen2.rotation.y = -0.3;
    this.scene.add(screen2);

    this._holoScreens = [screen1, screen2];
  }

  _buildParticles() {
    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      velocities.push({
        x: (Math.random() - 0.5) * 0.01,
        y: Math.random() * 0.005 + 0.002,
        z: (Math.random() - 0.5) * 0.01,
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x58A6FF,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    return { points, velocities, positions };
  }

  _buildConveyor() {
    // Simple conveyor belt visual
    const beltGeo = new THREE.BoxGeometry(3, 0.05, 0.8);
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x30363D,
      metalness: 0.6,
    });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, 0.02, 2.5);
    belt.visible = false;
    this.scene.add(belt);
    return belt;
  }

  draw(game) {
    if (this._contextLost) return;
    this._time += 0.016;

    // Update robot based on config
    this._updateRobot(game);

    // Update competitor robots
    this._updateCompetitors(game);

    // Animate particles
    this._animateParticles();

    // Animate holo screens
    for (const s of this._holoScreens) {
      s.position.y += Math.sin(this._time * 0.8 + s.position.x) * 0.0005;
    }

    // Glow ring pulse
    if (this._glowRing) {
      this._glowRing.material.opacity = 0.2 + Math.sin(this._time * 2) * 0.1;
    }

    // Conveyor during launch
    this._conveyor.visible = game.phase === PHASES.LAUNCHING;
    if (game.phase === PHASES.LAUNCHING) {
      this._conveyor.material.color.setHSL((this._time * 0.1) % 1, 0.5, 0.3);
    }

    // Result animation on the 3D robot
    const animating = game.phase === PHASES.RESULTS
      && game.resultAnimTimer < game.resultAnimDuration;

    if (animating) {
      this._animateResultRobot(game);
      this._resultAnimActive = true;
    } else if (this._resultAnimActive) {
      // Animation just ended — restore robot to default pose
      this._restoreRobot();
      this._resultAnimActive = false;
    }

    this.renderer.render(this.scene, this.camera);
  }

  _disposeGroup(group) {
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.scene.remove(group);
  }

  _updateRobot(game) {
    if (!game.config) return;

    const key = JSON.stringify(game.config);
    if (key === this._currentConfigKey) return;
    this._currentConfigKey = key;

    // Remove old robot and free GPU memory
    if (this._robotGroup) {
      this._disposeGroup(this._robotGroup);
    }

    // Build new robot
    this._robotGroup = buildRobot(game.config);
    this._robotGroup.position.set(0, 0.15, 0);
    this._robotGroup.scale.setScalar(0.7);
    this.scene.add(this._robotGroup);

    // Tag cylinders with their original rotation for restore
    for (const child of this._robotGroup.children) {
      if (child.geometry && child.geometry.type === 'CylinderGeometry') {
        child._originalRotZ = child.rotation.z;
      }
    }
  }

  _updateCompetitors(game) {
    if (!game.market) return;

    // Only rebuild when competitor data actually changes
    const key = JSON.stringify(game.market.competitors.map(c => c.config));
    if (key === this._currentCompKey) return;
    this._currentCompKey = key;

    // Remove old competitor robots and free GPU memory
    for (const r of this._competitorRobots) {
      this._disposeGroup(r);
    }
    this._competitorRobots = [];

    const comps = game.market.competitors;
    for (let i = 0; i < Math.min(comps.length, this._tablePositions.length); i++) {
      const comp = comps[i];
      const pos = this._tablePositions[i];
      const robot = buildRobot(comp.config);
      robot.position.set(pos.x, 0.8, pos.z);
      robot.scale.setScalar(0.35);
      this.scene.add(robot);
      this._competitorRobots.push(robot);
    }
  }

  _animateParticles() {
    const p = this._particles;
    const pos = p.positions;

    for (let i = 0; i < p.velocities.length; i++) {
      const v = p.velocities[i];
      pos[i * 3] += v.x;
      pos[i * 3 + 1] += v.y;
      pos[i * 3 + 2] += v.z;

      // Reset particles that go too high
      if (pos[i * 3 + 1] > 7) {
        pos[i * 3] = (Math.random() - 0.5) * 12;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      }
    }

    p.points.geometry.attributes.position.needsUpdate = true;
  }

  // ---- Result animation on 3D robot ----

  _animateResultRobot(game) {
    const robot = this._robotGroup;
    if (!robot) return;

    const rd = game.roundData[game.roundData.length - 1];
    if (!rd) return;

    const grade = rd.grade.letter;
    const progress = Math.min(game.resultAnimTimer / game.resultAnimDuration, 1);

    // Base position
    const baseY = 0.15;

    if (grade === 'F') {
      this._animateF(robot, progress, baseY);
    } else {
      // Reset scatter if coming from a different state
      this._restoreChildren(robot);

      if (grade === 'S') {
        const bounces = 6;
        const bounce = Math.abs(Math.sin(progress * Math.PI * bounces));
        robot.position.y = baseY + bounce * 1.5;
        this._animateArms(robot, -1.2 * bounce);
      } else if (grade === 'A') {
        const bounces = 3;
        const bounce = Math.abs(Math.sin(progress * Math.PI * bounces));
        robot.position.y = baseY + bounce * 1.0;
        this._animateArms(robot, -0.8 * bounce);
      } else if (grade === 'B') {
        robot.position.y = baseY + Math.sin(progress * Math.PI) * 0.5;
      } else if (grade === 'C') {
        robot.position.y = baseY;
        robot.rotation.z = Math.sin(progress * Math.PI * 6) * 0.15;
      } else if (grade === 'D') {
        robot.position.y = baseY;
        robot.rotation.z = Math.sin(progress * Math.PI * 8) * 0.4 * progress;
      }
    }

    // 3D particles
    this._updateResultParticles(game, grade, progress);
  }

  _animateArms(robot, angle) {
    // Arms are children at indices 5 (left) and 6 (right) in buildRobot()
    // body=0, head=1, eyeL=2, eyeR=3, armL=4, armR=5, legL=6, legR=7, ...
    const children = robot.children;
    if (children.length < 6) return;
    // Arms are the cylinder geometries after eyes — find them by their geometry type
    let armIdx = 0;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.geometry && child.geometry.type === 'CylinderGeometry') {
        // First two cylinders are arms, next two are legs
        if (armIdx === 0) {
          child.rotation.z = angle; // left arm outward
          armIdx++;
        } else if (armIdx === 1) {
          child.rotation.z = -angle; // right arm outward
          armIdx++;
          break;
        }
      }
    }
  }

  _animateF(robot, progress, baseY) {
    if (progress < 0.5) {
      // Wobble phase
      this._restoreChildren(robot);
      const wobbleProg = progress * 2;
      robot.position.y = baseY;
      robot.rotation.z = Math.sin(wobbleProg * Math.PI * 4) * 0.4 * wobbleProg;
    } else {
      // Tip over and scatter parts
      const fallProg = (progress - 0.5) * 2; // 0→1
      const ease = fallProg * fallProg;

      // Save original child positions on first frame of scatter
      if (this._savedChildTransforms.length === 0 && robot.children.length > 0) {
        this._savedChildTransforms = robot.children.map(c => ({
          px: c.position.x, py: c.position.y, pz: c.position.z,
          rx: c.rotation.x, ry: c.rotation.y, rz: c.rotation.z,
        }));
        // Generate random drift directions per part
        this._scatterDrifts = robot.children.map(() => ({
          dx: (Math.random() - 0.5) * 3,
          dy: Math.random() * 2 + 0.5,
          dz: (Math.random() - 0.5) * 3,
          rx: (Math.random() - 0.5) * 2,
          rz: (Math.random() - 0.5) * 2,
        }));
      }

      // Whole group tips
      robot.rotation.z = fallProg * 1.2;
      robot.position.y = baseY - ease * 0.8;

      // Scatter children outward
      if (this._savedChildTransforms.length > 0) {
        for (let i = 0; i < robot.children.length && i < this._savedChildTransforms.length; i++) {
          const child = robot.children[i];
          const saved = this._savedChildTransforms[i];
          const drift = this._scatterDrifts[i];

          child.position.x = saved.px + drift.dx * ease;
          child.position.y = saved.py + drift.dy * ease - 2.0 * ease * ease; // gravity
          child.position.z = saved.pz + drift.dz * ease;
          child.rotation.x = saved.rx + drift.rx * ease;
          child.rotation.z = saved.rz + drift.rz * ease;
        }
      }
    }
  }

  _restoreChildren(robot) {
    if (this._savedChildTransforms.length === 0) return;
    for (let i = 0; i < robot.children.length && i < this._savedChildTransforms.length; i++) {
      const child = robot.children[i];
      const saved = this._savedChildTransforms[i];
      child.position.set(saved.px, saved.py, saved.pz);
      child.rotation.set(saved.rx, saved.ry, saved.rz);
    }
    this._savedChildTransforms = [];
    this._scatterDrifts = [];
  }

  _restoreRobot() {
    const robot = this._robotGroup;
    if (!robot) return;

    // Restore group transform
    robot.position.set(0, 0.15, 0);
    robot.rotation.set(0, 0, 0);

    // Restore scattered children
    this._restoreChildren(robot);

    // Reset arm rotations to original values
    for (const child of robot.children) {
      if (child.geometry && child.geometry.type === 'CylinderGeometry') {
        child.rotation.z = child._originalRotZ || 0;
      }
    }

    // Force rebuild next time config is checked (F-grade scatter moves children)
    this._currentConfigKey = '';

    // Remove result particles
    if (this._resultAnimParticles) {
      this.scene.remove(this._resultAnimParticles);
      this._resultAnimParticles.geometry.dispose();
      this._resultAnimParticles.material.dispose();
      this._resultAnimParticles = null;
    }
    this._resultParticleVelocities = null;
  }

  _updateResultParticles(game, grade, progress) {
    const count = 80;

    // Create particle system on first call
    if (!this._resultAnimParticles) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);

      // All start hidden far below
      for (let i = 0; i < count; i++) {
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -10;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const color = grade === 'S' ? 0xE3B341
        : grade === 'A' ? 0x3FB950
        : grade === 'B' ? 0x58A6FF
        : grade === 'D' ? 0x555555
        : grade === 'F' ? 0xF85149
        : 0x888888;

      const mat = new THREE.PointsMaterial({
        color,
        size: grade === 'D' ? 0.15 : 0.08,
        transparent: true,
        opacity: 0.9,
      });

      this._resultAnimParticles = new THREE.Points(geo, mat);
      this.scene.add(this._resultAnimParticles);

      // Initialize velocities
      this._resultParticleVelocities = [];
      for (let i = 0; i < count; i++) {
        this._resultParticleVelocities.push({
          x: 0, y: 0, z: 0,
          life: 0, maxLife: 0, spawned: false,
        });
      }
    }

    // No particles for grade C
    if (grade === 'C') return;

    const pos = this._resultAnimParticles.geometry.attributes.position.array;
    const vels = this._resultParticleVelocities;
    const robotY = this._robotGroup ? this._robotGroup.position.y + 1.5 : 1.5;

    // Spawn particles over time
    const spawnRate = grade === 'S' ? 3 : grade === 'A' ? 2 : grade === 'B' ? 1 : 1.5;
    const spawnCount = Math.floor(progress * count * spawnRate);

    for (let i = 0; i < count; i++) {
      const v = vels[i];

      if (!v.spawned && i < spawnCount && progress < 0.9) {
        v.spawned = true;
        v.life = 0;
        v.maxLife = 0.8 + Math.random() * 0.6;

        if (grade === 'S' || grade === 'A' || grade === 'B') {
          // Sparkles upward from robot
          pos[i * 3] = (Math.random() - 0.5) * 0.8;
          pos[i * 3 + 1] = robotY;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
          v.x = (Math.random() - 0.5) * 1.5;
          v.y = 2 + Math.random() * 3;
          v.z = (Math.random() - 0.5) * 1.5;
        } else if (grade === 'D') {
          // Smoke puffs rising
          pos[i * 3] = (Math.random() - 0.5) * 0.5;
          pos[i * 3 + 1] = robotY;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          v.x = (Math.random() - 0.5) * 0.3;
          v.y = 0.5 + Math.random() * 1.0;
          v.z = (Math.random() - 0.5) * 0.3;
        } else if (grade === 'F') {
          // Red sparks fly outward
          pos[i * 3] = (Math.random() - 0.5) * 0.6;
          pos[i * 3 + 1] = robotY - 0.5;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
          v.x = (Math.random() - 0.5) * 4;
          v.y = 1 + Math.random() * 2;
          v.z = (Math.random() - 0.5) * 4;
        }
      }

      if (v.spawned) {
        const dt = 0.016;
        v.life += dt;
        pos[i * 3] += v.x * dt;
        pos[i * 3 + 1] += v.y * dt;
        pos[i * 3 + 2] += v.z * dt;
        v.y -= 2.0 * dt; // gravity

        // Fade by moving below scene when expired
        if (v.life > v.maxLife) {
          pos[i * 3 + 1] = -10;
          v.spawned = false;
        }
      }
    }

    this._resultAnimParticles.geometry.attributes.position.needsUpdate = true;

    // Fade out particles overall toward end of animation
    if (this._resultAnimParticles.material) {
      this._resultAnimParticles.material.opacity = progress < 0.8
        ? 0.9
        : 0.9 * (1 - (progress - 0.8) / 0.2);
    }
  }
}
