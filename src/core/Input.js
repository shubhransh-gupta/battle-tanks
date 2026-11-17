/**
 * Input.js - Unified Desktop & Mobile Input Handler for Better Tanks
 */
import * as THREE from 'three';

export class Input {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;

    // Movement axes (-1 to +1)
    this.moveX = 0;
    this.moveY = 0;

    // Actions
    this.isShooting = false;
    this.isBoosting = false;
    this.wantsFire = false; // single click trigger

    // Aim position in 3D world space (on ground plane Y = 0)
    this.aimPoint = new THREE.Vector3(0, 0, 0);
    this.mouseScreen = new THREE.Vector2(0, 0);
    this.hasAimPoint = false;

    // Touch Virtual Joystick states
    this.touchMove = { active: false, id: null, startX: 0, startY: 0, curX: 0, curY: 0 };
    this.touchAim = { active: false, id: null, startX: 0, startY: 0, curX: 0, curY: 0 };

    // Keyboard state map
    this.keys = {};

    // Raycaster & ground plane
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Callbacks
    this.onKeyAction = null; // for 'R', 'M', 'C', 'F', 'Escape'

    this.bindEvents();
  }

  bindEvents() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'KeyR' || e.code === 'KeyM' || e.code === 'KeyC' || e.code === 'KeyF' || e.code === 'Escape') {
        if (this.onKeyAction) this.onKeyAction(e.code);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse movement
    window.addEventListener('mousemove', (e) => {
      this.mouseScreen.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseScreen.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.updateMouseAim();
    });

    // Mouse clicks
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('#hud-overlay') && !e.target.closest('#hud-canvas-proxy')) {
        return; // Don't shoot when clicking UI buttons
      }
      if (e.button === 0) {
        this.isShooting = true;
        this.wantsFire = true;
      } else if (e.button === 2) {
        this.isBoosting = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isShooting = false;
      if (e.button === 2) this.isBoosting = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
  }

  handleTouchStart(e) {
    e.preventDefault();
    const w = window.innerWidth;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Left half = Move Joystick
      if (touch.clientX < w * 0.45 && !this.touchMove.active) {
        this.touchMove.active = true;
        this.touchMove.id = touch.identifier;
        this.touchMove.startX = touch.clientX;
        this.touchMove.startY = touch.clientY;
        this.touchMove.curX = touch.clientX;
        this.touchMove.curY = touch.clientY;
      }
      // Right half = Aim & Fire Joystick
      else if (touch.clientX >= w * 0.45 && !this.touchAim.active) {
        this.touchAim.active = true;
        this.touchAim.id = touch.identifier;
        this.touchAim.startX = touch.clientX;
        this.touchAim.startY = touch.clientY;
        this.touchAim.curX = touch.clientX;
        this.touchAim.curY = touch.clientY;
        this.isShooting = true;
        this.wantsFire = true;
      }
    }
  }

  handleTouchMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.touchMove.active && touch.identifier === this.touchMove.id) {
        this.touchMove.curX = touch.clientX;
        this.touchMove.curY = touch.clientY;
      } else if (this.touchAim.active && touch.identifier === this.touchAim.id) {
        this.touchAim.curX = touch.clientX;
        this.touchAim.curY = touch.clientY;
      }
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (this.touchMove.active && touch.identifier === this.touchMove.id) {
        this.touchMove.active = false;
        this.touchMove.id = null;
      }
      if (this.touchAim.active && touch.identifier === this.touchAim.id) {
        this.touchAim.active = false;
        this.touchAim.id = null;
        this.isShooting = false;
      }
    }
  }

  updateMouseAim() {
    if (!this.camera) return;
    this.raycaster.setFromCamera(this.mouseScreen, this.camera);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.groundPlane, hit)) {
      this.aimPoint.copy(hit);
      this.hasAimPoint = true;
    }
  }

  update(playerPos) {
    // 1. Keyboard movement
    let kx = 0;
    let ky = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) ky += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) ky -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) kx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) kx += 1;

    // 2. Touch joystick movement
    let tx = 0;
    let ty = 0;
    if (this.touchMove.active) {
      const dx = this.touchMove.curX - this.touchMove.startX;
      const dy = this.touchMove.curY - this.touchMove.startY;
      const maxR = 60;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        const factor = Math.min(1.0, dist / maxR);
        tx = (dx / dist) * factor;
        ty = -(dy / dist) * factor;
      }
    }

    // Blend keyboard and touch
    this.moveX = kx !== 0 ? kx : tx;
    this.moveY = ky !== 0 ? ky : ty;

    // Boost
    this.isBoosting = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyE']);

    // Shoot
    if (this.keys['Space']) {
      this.isShooting = true;
      this.wantsFire = true;
    }

    // Update mouse aim continuously as camera shifts
    if (!this.touchAim.active) {
      this.updateMouseAim();
    } else if (playerPos) {
      // Touch aiming offset relative to player
      const dx = this.touchAim.curX - this.touchAim.startX;
      const dy = this.touchAim.curY - this.touchAim.startY;
      if (Math.hypot(dx, dy) > 10) {
        this.aimPoint.set(playerPos.x + dx * 0.4, 0, playerPos.z + dy * 0.4);
        this.hasAimPoint = true;
      }
    }
  }

  consumeFire() {
    const fired = this.wantsFire;
    this.wantsFire = false;
    return fired;
  }
}
