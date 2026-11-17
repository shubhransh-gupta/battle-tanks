/**
 * PlayerTank.js - High-Precision Arcade Player Tank Controller
 * Features Dual Treads, Road Wheels, Independent Rotating Turret, Recoil,
 * Invulnerability Shield, and Permanent Visible Charred Wreck State.
 */
import * as THREE from 'three';

export class PlayerTank {
  constructor(scene, assetManager, particleSystem, soundManager, bulletSystem) {
    this.scene = scene;
    this.assets = assetManager;
    this.particles = particleSystem;
    this.sound = soundManager;
    this.bullets = bulletSystem;

    this.isPlayer = true;
    this.alive = true;
    this.hitRadius = 1.8;
    this.hitSound = 'player-hit';

    // Stats
    this.maxHealth = 300;
    this.health = 300;
    this.maxBoost = 100;
    this.boost = 100;
    this.boostDrainRate = 34;
    this.boostRechargeRate = 24;
    this.isBoosting = false;

    // Invulnerability Shield
    this.shieldTimer = 8.0; // 8 seconds of spawn protection

    // Firing cooldown
    this.fireCooldown = 0.32;
    this.fireTimer = 0;
    this.damage = 38;

    // Movement Dynamics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0; // hull rotation
    this.speed = 0;
    this.maxForwardSpeed = 16.5;
    this.maxReverseSpeed = 9.0;
    this.accel = 34.0;
    this.friction = 0.94;
    this.turnSpeed = 3.4;

    // Suspension tilt
    this.pitch = 0;
    this.roll = 0;

    // Turret & Barrel Aiming
    this.turretYaw = 0;
    this.barrelRecoil = 0;
    this.muzzlePos = new THREE.Vector3();
    this.barrelOrigPos = new THREE.Vector3(1.23, 0.21, 0);

    // Track Marks timer
    this.trackMarkTimer = 0;
    this.engineSoundTimer = 0;

    // Build Mesh
    this.setupMesh();
    this.setupShield();
  }

  setupMesh() {
    this.group = new THREE.Group();
    const model = this.assets ? this.assets.getModel('player') : null;

    if (model) {
      this.model = model;
      this.model.scale.setScalar(2.2);
      this.model.position.y = 0; // Sits treads directly on the ground!
      this.group.add(this.model);

      this.body = this.model.getObjectByName('Player_Body');
      this.turret = this.model.getObjectByName('Player_Turret');
      this.barrel = this.model.getObjectByName('Player_Barrel');
      this.track = this.model.getObjectByName('Player_Track');

      if (this.barrel) {
        this.barrelOrigPos.copy(this.barrel.position);
      }

      // Mirror left track to create right track if missing
      const leftTrack = this.model.getObjectByName('Player_Track');
      if (leftTrack && !this.model.getObjectByName('Player_Track_Right')) {
        const rightTrack = leftTrack.clone();
        rightTrack.name = 'Player_Track_Right';
        rightTrack.position.z = -leftTrack.position.z;
        rightTrack.scale.z = -1;
        this.model.add(rightTrack);
      }

      // Mirror road wheels to right side
      for (let i = 1; i <= 4; i++) {
        const wheel = this.model.getObjectByName(`Left_Wheel_0${i}`);
        if (wheel && !this.model.getObjectByName(`Right_Wheel_0${i}`)) {
          const rw = wheel.clone();
          rw.name = `Right_Wheel_0${i}`;
          rw.position.z = -wheel.position.z;
          this.model.add(rw);
        }
      }

      // Mirror track covers to right side
      for (let i = 1; i <= 3; i++) {
        const tc = this.model.getObjectByName(`TrackCover_Left_0${i}`);
        if (tc && tc.parent && !this.model.getObjectByName(`TrackCover_Right_0${i}`)) {
          const rtc = tc.clone();
          rtc.name = `TrackCover_Right_0${i}`;
          rtc.position.z = -tc.position.z;
          rtc.scale.z = -1;
          tc.parent.add(rtc);
        }
      }

      // Accentuate lights with glowing cyan
      const cyanGlow = new THREE.MeshBasicMaterial({ color: 0x38dbff });
      const frontLight = this.model.getObjectByName('Front_Light');
      if (frontLight && frontLight.isMesh) frontLight.material = cyanGlow;
    } else {
      // High-Detail Procedural Character Combat Tank
      this.buildProceduralTank();
    }

    // Dual Forward Combat Headlights
    const headlightL = new THREE.SpotLight(0x55d6ff, 5.0, 45, Math.PI / 6, 0.4, 1.2);
    headlightL.position.set(1.6, 1.2, 0.7);
    headlightL.target.position.set(22, 0, 0.7);
    this.group.add(headlightL);
    this.group.add(headlightL.target);

    const headlightR = new THREE.SpotLight(0x55d6ff, 5.0, 45, Math.PI / 6, 0.4, 1.2);
    headlightR.position.set(1.6, 1.2, -0.7);
    headlightR.target.position.set(22, 0, -0.7);
    this.group.add(headlightR);
    this.group.add(headlightR.target);

    this.group.visible = true;
    this.scene.add(this.group);
  }

  setupShield() {
    const shieldGeo = new THREE.SphereGeometry(3.0, 24, 18);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.2;

    // Inner glowing aura
    const innerGeo = new THREE.SphereGeometry(2.8, 20, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    this.shieldInner = new THREE.Mesh(innerGeo, innerMat);
    this.shieldMesh.add(this.shieldInner);

    this.group.add(this.shieldMesh);
  }

  buildProceduralTank() {
    const mainMat = new THREE.MeshStandardMaterial({
      color: 0x22362b, // Military Forest Olive
      roughness: 0.5,
      metalness: 0.4
    });
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x2e4235,
      roughness: 0.4,
      metalness: 0.5
    });
    const treadMat = new THREE.MeshStandardMaterial({
      color: 0x111418,
      roughness: 0.8,
      metalness: 0.2
    });
    const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38dbff });

    // 1. Chassis Body
    this.body = new THREE.Group();
    this.body.position.y = 0.55;

    const hullGeo = new THREE.BoxGeometry(3.2, 0.85, 2.1);
    const hull = new THREE.Mesh(hullGeo, mainMat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.body.add(hull);

    // Glacis sloped front
    const slopeGeo = new THREE.BoxGeometry(1.0, 0.65, 2.06);
    const slope = new THREE.Mesh(slopeGeo, armorMat);
    slope.rotation.z = -Math.PI / 6;
    slope.position.set(1.4, 0.12, 0);
    slope.castShadow = true;
    this.body.add(slope);

    // Left and Right Track Assemblies
    for (let side of [-1.2, 1.2]) {
      const trackGeo = new THREE.BoxGeometry(3.6, 0.75, 0.45);
      const trackMesh = new THREE.Mesh(trackGeo, treadMat);
      trackMesh.position.set(0, -0.15, side);
      trackMesh.castShadow = true;
      trackMesh.receiveShadow = true;
      this.body.add(trackMesh);

      // Road Wheels
      for (let wx = -1.3; wx <= 1.3; wx += 0.65) {
        const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.48, 12);
        wheelGeo.rotateX(Math.PI / 2);
        const wheel = new THREE.Mesh(wheelGeo, armorMat);
        wheel.position.set(wx, -0.15, side);
        this.body.add(wheel);
      }
    }

    // Engine vents
    const ventGeo = new THREE.BoxGeometry(0.7, 0.12, 1.3);
    const vent = new THREE.Mesh(ventGeo, cyanGlowMat);
    vent.position.set(-1.15, 0.45, 0);
    this.body.add(vent);

    this.group.add(this.body);

    // 2. Rotating Turret
    this.turret = new THREE.Group();
    this.turret.position.set(0.1, 1.15, 0);

    const turretBaseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.65, 10);
    const turretBase = new THREE.Mesh(turretBaseGeo, armorMat);
    turretBase.castShadow = true;
    this.turret.add(turretBase);

    // Commander Cupola
    const cupolaGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.28, 8);
    const cupola = new THREE.Mesh(cupolaGeo, mainMat);
    cupola.position.set(-0.25, 0.42, 0.35);
    this.turret.add(cupola);

    // 3. Cannon Barrel
    this.barrel = new THREE.Group();
    this.barrel.position.set(0.8, 0.1, 0);
    this.barrelOrigPos.copy(this.barrel.position);

    const barrelGeo = new THREE.CylinderGeometry(0.13, 0.15, 2.5, 12);
    barrelGeo.rotateZ(-Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, mainMat);
    barrelMesh.position.set(1.2, 0, 0);
    barrelMesh.castShadow = true;
    this.barrel.add(barrelMesh);

    // Muzzle Brake
    const muzzleBrakeGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.45, 12);
    muzzleBrakeGeo.rotateZ(-Math.PI / 2);
    const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, armorMat);
    muzzleBrake.position.set(2.45, 0, 0);
    this.barrel.add(muzzleBrake);

    this.turret.add(this.barrel);
    this.group.add(this.turret);
  }

  spawn(x, z, yaw = 0) {
    this.position.set(x, 0, z);
    this.yaw = yaw;
    this.turretYaw = yaw;
    this.speed = 0;
    this.health = this.maxHealth;
    this.boost = this.maxBoost;
    this.alive = true;
    this.shieldTimer = 8.0; // 8 seconds of invulnerability

    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    this.group.visible = true;

    // Reset charred material if respawned
    this.group.traverse((c) => {
      if (c.isMesh && c !== this.shieldMesh && c !== this.shieldInner) {
        if (c.userData.origMaterial) {
          c.material = c.userData.origMaterial;
        }
      }
    });
  }

  update(dt, input) {
    // 0. Update Shield Visuals
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      this.shieldMesh.visible = true;
      this.shieldMesh.rotation.y += dt * 2.0;
      this.shieldMesh.rotation.x += dt * 1.2;
      const pulse = 0.3 + 0.15 * Math.sin(performance.now() * 0.008);
      this.shieldMesh.material.opacity = pulse;
    } else {
      this.shieldMesh.visible = false;
    }

    if (!this.alive) {
      // Wrecked tank smoke emitter
      if (Math.random() < 0.4) {
        this.particles.emitSmoke(
          new THREE.Vector3(this.position.x, 1.2, this.position.z),
          1,
          0.8,
          0x111111
        );
      }
      return;
    }

    // 1. Boost logic
    if (input.isBoosting && this.boost > 5) {
      this.isBoosting = true;
      this.boost = Math.max(0, this.boost - this.boostDrainRate * dt);
      if (Math.random() < 0.6) {
        this.sound.play('player-boost', { volume: 0.35, pitchVar: 0.04 });
      }
    } else {
      this.isBoosting = false;
      this.boost = Math.min(this.maxBoost, this.boost + this.boostRechargeRate * dt);
    }

    // 2. Throttle & Steering
    const topSpeed = this.isBoosting ? this.maxForwardSpeed * 1.5 : this.maxForwardSpeed;
    const accelRate = this.isBoosting ? this.accel * 1.6 : this.accel;

    if (input.moveY > 0) {
      this.speed = Math.min(topSpeed, this.speed + accelRate * dt * input.moveY);
    } else if (input.moveY < 0) {
      this.speed = Math.max(-this.maxReverseSpeed, this.speed + accelRate * dt * input.moveY);
    } else {
      this.speed *= Math.pow(this.friction, dt * 60);
      if (Math.abs(this.speed) < 0.05) this.speed = 0;
    }

    // Turn
    if (input.moveX !== 0) {
      const turnDir = (this.speed < -0.1) ? input.moveX : -input.moveX;
      this.yaw += turnDir * this.turnSpeed * dt;
    }

    // 3. Position update & Arena Boundaries
    const forwardX = Math.cos(this.yaw);
    const forwardZ = -Math.sin(this.yaw);

    this.position.x += forwardX * this.speed * dt;
    this.position.z += forwardZ * this.speed * dt;

    // Clamp inside arena boundary ring (radius ~92)
    const distFromCenter = Math.hypot(this.position.x, this.position.z);
    if (distFromCenter > 92) {
      const angle = Math.atan2(this.position.z, this.position.x);
      this.position.x = Math.cos(angle) * 92;
      this.position.z = Math.sin(angle) * 92;
      this.speed *= 0.5;
    }

    // 4. Dynamic Suspension Pitch & Roll
    const targetPitch = (this.speed / topSpeed) * 0.08;
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, dt * 10);

    const targetRoll = input.moveX * (this.speed / topSpeed) * 0.1;
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, dt * 8);

    // Update group transform
    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

    // 5. Track Marks & Exhaust VFX
    if (Math.abs(this.speed) > 1.2) {
      this.trackMarkTimer += dt;
      if (this.trackMarkTimer > 0.08) {
        this.trackMarkTimer = 0;
        const exhaust = new THREE.Vector3(
          this.position.x - forwardX * 1.5,
          0.6,
          this.position.z - forwardZ * 1.5
        );
        this.particles.emitSmoke(exhaust, 1, 0.45, this.isBoosting ? 0x1166aa : 0x222933);
      }
    }

    // Engine sound
    this.engineSoundTimer += dt;
    if (this.engineSoundTimer > 0.3) {
      this.engineSoundTimer = 0;
      if (Math.abs(this.speed) > 0.5) {
        this.sound.play('player-move', { volume: 0.18 + Math.abs(this.speed) * 0.015, pitchVar: 0.05 });
      }
    }

    // Low HP warning smoke
    if (this.health < 80 && Math.random() < 0.25) {
      this.particles.emitSmoke(
        new THREE.Vector3(this.position.x, 1.2, this.position.z),
        1,
        0.8,
        0x111111
      );
    }

    // 6. Turret Aiming
    if (input.hasAimPoint) {
      const dx = input.aimPoint.x - this.position.x;
      const dz = input.aimPoint.z - this.position.z;
      const targetAimYaw = Math.atan2(-dz, dx);
      let relativeYaw = targetAimYaw - this.yaw;
      relativeYaw = Math.atan2(Math.sin(relativeYaw), Math.cos(relativeYaw));

      if (this.turret) {
        this.turret.rotation.y = THREE.MathUtils.lerp(this.turret.rotation.y, relativeYaw, dt * 16);
      }
    }

    // 7. Barrel Recoil
    if (this.barrelRecoil > 0) {
      this.barrelRecoil = Math.max(0, this.barrelRecoil - dt * 3.5);
      if (this.barrel) {
        this.barrel.position.x = this.barrelOrigPos.x - this.barrelRecoil * 0.35;
      }
    }

    // 8. Firing Cannon
    this.fireTimer -= dt;
    if ((input.isShooting || input.consumeFire()) && this.fireTimer <= 0) {
      this.shoot();
    }
  }

  shoot() {
    this.fireTimer = this.fireCooldown;
    this.barrelRecoil = 1.0;

    const muzzleOffset = new THREE.Vector3(3.2, 1.3, 0);
    if (this.turret) muzzleOffset.applyEuler(this.turret.rotation);
    muzzleOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    this.muzzlePos.copy(this.position).add(muzzleOffset);

    const fireDir = muzzleOffset.clone().normalize();
    fireDir.y = 0;

    this.bullets.fire(this.muzzlePos, fireDir, true, this.damage, 70, false);
    this.sound.play('player-shoot', { volume: 0.85, pitchVar: 0.08 });
  }

  takeDamage(amount, hitPos) {
    if (!this.alive) return;
    if (this.shieldTimer > 0) {
      // Shield absorbs hit with flash!
      this.particles.emitSparks(hitPos, 10, { r: 0.2, g: 0.8, b: 1.0 });
      return;
    }

    this.health = Math.max(0, this.health - amount);
    this.particles.emitSparks(hitPos, 14, { r: 1, g: 0.4, b: 0.1 });
    this.sound.play('player-hit', { volume: 0.9 });

    if (this.health <= 0) {
      this.die();
    }
  }

  repair(amount = 60) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.sound.play('player-landing', { volume: 0.8 });
  }

  refillBoost() {
    this.boost = this.maxBoost;
    this.sound.play('player-boost', { volume: 0.6 });
  }

  die() {
    this.alive = false;
    // CRITICAL: NEVER HIDE THE TANK! It stays as an armored smoking wreck!
    this.group.visible = true;

    // Convert mesh materials to charred battle wreck
    const charredMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.95,
      metalness: 0.1
    });

    this.group.traverse((c) => {
      if (c.isMesh && c !== this.shieldMesh && c !== this.shieldInner) {
        if (!c.userData.origMaterial) c.userData.origMaterial = c.material;
        c.material = charredMat;
      }
    });

    this.particles.emitExplosion(this.position, 2.5);
    this.sound.play('player-explode', { volume: 1.0 });
  }
}
