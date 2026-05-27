// ============================================================
// THREE.JS SCENE — Ambient background: particles, lighting, ground
// ============================================================
//
// The 3D scene is purely atmospheric — no tensor cubes or arrows.
// All data visualization happens in the 2D HUD console panel.

import { COL } from './config.js';
import { randf } from './utils.js';

/* global THREE */

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(new THREE.Color(COL.BG));

    // Orthographic camera (isometric)
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = 6;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum, 0.1, 100
    );
    this.camera.position.set(8, 10, 8);
    this.camera.lookAt(0, 0, 0);

    // Scene
    this.scene = new THREE.Scene();

    this._setupLighting();
    this._buildGround();
    this._setupParticles();

    this.resize();
  }

  _setupLighting() {
    // Cool blue-purple ambient
    this.ambient = new THREE.AmbientLight(0x334455, 0.9);
    this.scene.add(this.ambient);

    // Soft directional overhead
    this.sun = new THREE.DirectionalLight(0xCCDDFF, 0.7);
    this.sun.position.set(5, 12, 5);
    this.scene.add(this.sun);

    // Hemisphere: cool sky + dark ground
    this.scene.add(new THREE.HemisphereLight(0x445577, 0x0A0E1A, 0.4));

    // Subtle accent light
    const accentLight = new THREE.PointLight(0x64B5F6, 0.4, 15);
    accentLight.position.set(-3, 4, 0);
    this.scene.add(accentLight);
  }

  _buildGround() {
    const gridSize = 20;
    const gridDiv = 20;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(gridSize, gridSize),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(COL.GROUND) })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    this.scene.add(ground);

    const gridHelper = new THREE.GridHelper(gridSize, gridDiv, 0x1A2040, 0x141830);
    gridHelper.position.y = -0.49;
    this.scene.add(gridHelper);
  }

  _setupParticles() {
    const count = 60;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const particleColors = [
      new THREE.Color(0x64B5F6),
      new THREE.Color(0xC792EA),
      new THREE.Color(0x89DDFF),
      new THREE.Color(0xFFCB6B),
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randf(-8, 8);
      positions[i * 3 + 1] = randf(0, 6);
      positions[i * 3 + 2] = randf(-8, 8);

      const c = particleColors[Math.floor(Math.random() * particleColors.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
    this._particleVelocities = [];
    for (let i = 0; i < count; i++) {
      this._particleVelocities.push({
        x: randf(-0.1, 0.1),
        y: randf(0.05, 0.2),
        z: randf(-0.1, 0.1),
      });
    }
  }

  /**
   * Flash effect for correct/incorrect answers.
   */
  flashEffect(correct) {
    const color = correct ? 0x66BB6A : 0xEF5350;
    const light = new THREE.PointLight(color, 2, 20);
    light.position.set(0, 5, 0);
    this.scene.add(light);

    const startTime = performance.now();
    const fade = () => {
      const t = (performance.now() - startTime) / 500;
      if (t >= 1) {
        this.scene.remove(light);
        return;
      }
      light.intensity = 2 * (1 - t);
      requestAnimationFrame(fade);
    };
    requestAnimationFrame(fade);
  }

  update(dt) {
    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < this._particleVelocities.length; i++) {
        const v = this._particleVelocities[i];
        positions[i * 3] += v.x * dt;
        positions[i * 3 + 1] += v.y * dt;
        positions[i * 3 + 2] += v.z * dt;

        // Wrap around
        if (positions[i * 3 + 1] > 7) {
          positions[i * 3] = randf(-8, 8);
          positions[i * 3 + 1] = -1;
          positions[i * 3 + 2] = randf(-8, 8);
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const frustum = 6;

    this.camera.left = -frustum * aspect;
    this.camera.right = frustum * aspect;
    this.camera.top = frustum;
    this.camera.bottom = -frustum;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
  }
}
