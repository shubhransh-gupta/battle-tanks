/**
 * Engine.js - High-performance WebGL Render Engine & Dynamic Follow Camera
 */
import * as THREE from 'three';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1117);
    this.scene.fog = new THREE.FogExp2(0x0e1117, 0.0075);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(46, this.width / this.height, 0.1, 400);
    this.camera.position.set(0, 22, 22);
    this.cameraTarget = new THREE.Vector3(0, 22, 22);
    this.cameraLookTarget = new THREE.Vector3(0, 0.5, 0);
    this.camera.lookAt(this.cameraLookTarget);

    // Camera modes: 'isometric' or 'action'
    this.cameraMode = 'isometric';

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDecay = 4.0;

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 4. Lights
    this.setupLighting();

    // 5. Performance tracking
    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    // Resize listener
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient / Hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0xddeeff, 0x181e28, 1.0);
    this.scene.add(hemiLight);

    const ambLight = new THREE.AmbientLight(0x222a38, 0.5);
    this.scene.add(ambLight);

    // Main Sun Directional Light with shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.4);
    this.sunLight.position.set(40, 65, 30);
    this.sunLight.castShadow = true;

    // Optimized shadow camera frustum
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 170;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.02;

    const d = 50;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }

  toggleCameraMode() {
    this.cameraMode = this.cameraMode === 'isometric' ? 'action' : 'isometric';
    return this.cameraMode;
  }

  addShake(amount = 0.4) {
    this.shakeIntensity = Math.min(1.8, this.shakeIntensity + amount);
  }

  update(dt, playerPos, playerAimPoint, playerYaw = 0) {
    if (!playerPos) return;

    // Update Sun shadow camera target to stay centered on player
    this.sunLight.position.set(playerPos.x + 35, 60, playerPos.z + 30);
    this.sunLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.sunLight.target.updateMatrixWorld();

    // Compute desired camera position
    let desiredCamPos = new THREE.Vector3();
    let desiredLookPos = new THREE.Vector3();

    if (this.cameraMode === 'isometric') {
      // Elevated tactical isometric angle with lookahead
      const lookAhead = new THREE.Vector3();
      if (playerAimPoint) {
        lookAhead.subVectors(playerAimPoint, playerPos).multiplyScalar(0.22);
        lookAhead.clampLength(0, 8);
      }

      desiredLookPos.set(playerPos.x + lookAhead.x, playerPos.y + 0.5, playerPos.z + lookAhead.z);
      desiredCamPos.set(
        playerPos.x + lookAhead.x,
        playerPos.y + 24,
        playerPos.z + lookAhead.z + 24
      );
    } else {
      // Action Chase view: Close behind tank heading
      const behindDist = 12;
      const heightOffset = 6.5;
      const fwdX = Math.cos(playerYaw);
      const fwdZ = Math.sin(playerYaw);

      desiredCamPos.set(
        playerPos.x - fwdX * behindDist,
        playerPos.y + heightOffset,
        playerPos.z - fwdZ * behindDist
      );
      desiredLookPos.set(playerPos.x + fwdX * 8, playerPos.y + 1.2, playerPos.z + fwdZ * 8);
    }

    // Smooth camera damping
    const lerpRate = Math.min(1.0, dt * 7.5);
    this.cameraTarget.lerp(desiredCamPos, lerpRate);
    this.cameraLookTarget.lerp(desiredLookPos, lerpRate);

    // Apply camera shake
    let shakeOffset = new THREE.Vector3();
    if (this.shakeIntensity > 0.001) {
      shakeOffset.set(
        (Math.random() * 2 - 1) * this.shakeIntensity,
        (Math.random() * 2 - 1) * this.shakeIntensity * 0.5,
        (Math.random() * 2 - 1) * this.shakeIntensity
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    }

    this.camera.position.addVectors(this.cameraTarget, shakeOffset);
    this.camera.lookAt(this.cameraLookTarget);

    // Calculate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
