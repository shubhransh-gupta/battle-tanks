/**
 * BossTank.js - Titan MK-IV Heavy Siege Battle Mech
 * Colossal triple-turret armor boss with enrage phase, mortar barrage, and spotlight.
 */
import * as THREE from 'three';

export class BossTank {
  constructor(scene, assetManager, particleSystem, soundManager, bulletSystem) {
    this.scene = scene;
    this.assets = assetManager;
    this.particles = particleSystem;
    this.sound = soundManager;
    this.bullets = bulletSystem;

    this.isPlayer = false;
    this.isBoss = true;
    this.alive = false;
    this.hitRadius = 3.8;
    this.hitSound = 'boss-hit';

    this.maxHealth = 700;
    this.health = 700;
    this.damage = 18;

    this.position = new THREE.Vector3(0, 0, -45);
    this.yaw = Math.PI;
    this.speed = 0;
    this.maxSpeed = 4.2;
    this.turnSpeed = 1.2;

    this.fireCooldown = 2.4;
    this.fireTimer = 2.0;

    this.isEnraged = false;
    this.hasEnragedTriggered = false;

    this.setupMesh();
  }

  setupMesh() {
    this.group = new THREE.Group();
    const model = this.assets ? this.assets.getModel('boss') : null;

    if (model) {
      this.model = model;
      this.model.scale.setScalar(3.2);
      this.model.position.y = 0; // Grounds tracks
      this.group.add(this.model);

      this.body = this.model.getObjectByName('Boss_Body');
      this.turret = this.model.getObjectByName('Boss_Turret');
      this.barrel = this.model.getObjectByName('Boss_Barrel');
      this.engine = this.model.getObjectByName('Boss_Engine');

      const redGlow = new THREE.MeshBasicMaterial({ color: 0xff0033 });
      for (let lName of ['Boss_Light_1A', 'Boss_Light_1B', 'Boss_Light_1C', 'Boss_Light_2C']) {
        const l = this.model.getObjectByName(lName);
        if (l && l.isMesh) l.material = redGlow;
      }
    } else {
      this.buildProceduralBoss();
    }

    // Heavy crimson spotlight / core
    this.eyeLight = new THREE.PointLight(0xff1122, 6.0, 35);
    this.eyeLight.position.set(0, 3.2, 0);
    this.group.add(this.eyeLight);

    this.group.visible = false;
    this.scene.add(this.group);
  }

  buildProceduralBoss() {
    const bossMat = new THREE.MeshStandardMaterial({
      color: 0x1f1f23,
      roughness: 0.35,
      metalness: 0.75
    });
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xe05600,
      roughness: 0.4,
      metalness: 0.6
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f1013,
      roughness: 0.85,
      metalness: 0.1
    });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    // Chassis
    this.body = new THREE.Group();
    this.body.position.y = 0.8;

    const hullGeo = new THREE.BoxGeometry(5.8, 1.6, 4.4);
    const hull = new THREE.Mesh(hullGeo, bossMat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.body.add(hull);

    // Giant Tracks
    for (let side of [-2.4, 2.4]) {
      const trackGeo = new THREE.BoxGeometry(6.6, 1.4, 0.8);
      const track = new THREE.Mesh(trackGeo, darkMat);
      track.position.set(0, -0.2, side);
      track.castShadow = true;
      track.receiveShadow = true;
      this.body.add(track);
    }

    // Heavy orange armor plates
    const plateGeo = new THREE.BoxGeometry(2.4, 0.3, 3.6);
    const plate = new THREE.Mesh(plateGeo, orangeMat);
    plate.position.set(1.4, 0.85, 0);
    this.body.add(plate);

    this.group.add(this.body);

    // Heavy Siege Turret
    this.turret = new THREE.Group();
    this.turret.position.set(0.2, 2.2, 0);

    const turretGeo = new THREE.BoxGeometry(2.8, 1.2, 2.8);
    const turretMesh = new THREE.Mesh(turretGeo, bossMat);
    turretMesh.castShadow = true;
    this.turret.add(turretMesh);

    // Glowing Eye Core
    const eyeGeo = new THREE.BoxGeometry(0.2, 0.4, 1.4);
    const eye = new THREE.Mesh(eyeGeo, redGlowMat);
    eye.position.set(1.45, 0.1, 0);
    this.turret.add(eye);

    // Triple Heavy Barrels
    this.barrel = new THREE.Group();
    this.barrel.position.set(1.4, 0, 0);

    for (let bz of [-0.65, 0, 0.65]) {
      const barrelGeo = new THREE.CylinderGeometry(0.2, 0.22, 3.8, 12);
      barrelGeo.rotateZ(-Math.PI / 2);
      const barrelMesh = new THREE.Mesh(barrelGeo, darkMat);
      barrelMesh.position.set(1.9, 0, bz);
      barrelMesh.castShadow = true;
      this.barrel.add(barrelMesh);
    }

    this.turret.add(this.barrel);
    this.group.add(this.turret);
  }

  spawn(x, z, yaw = Math.PI) {
    this.position.set(x, 0, z);
    this.yaw = yaw;
    this.speed = 0;
    this.health = this.maxHealth;
    this.alive = true;
    this.isEnraged = false;
    this.hasEnragedTriggered = false;

    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.yaw;
    this.group.visible = true;

    this.sound.play('boss-move-loop', { volume: 0.6, loop: true });
  }

  update(dt, player, onEnrage) {
    if (!this.alive) {
      if (Math.random() < 0.4) {
        this.particles.emitSmoke(
          new THREE.Vector3(this.position.x, 1.8, this.position.z),
          2,
          1.2,
          0x18181b
        );
      }
      return;
    }

    // Check enrage state (under 50% health)
    if (this.health < this.maxHealth * 0.5 && !this.hasEnragedTriggered) {
      this.isEnraged = true;
      this.hasEnragedTriggered = true;
      this.fireCooldown = 1.5;
      this.maxSpeed = 5.6;
      if (this.eyeLight) this.eyeLight.color.setHex(0xff0000);
      if (onEnrage) onEnrage();
    }

    const distToPlayer = player && player.alive
      ? Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z)
      : 999;

    // Movement: steadily approach player
    if (player && player.alive) {
      const targetDx = player.position.x - this.position.x;
      const targetDz = player.position.z - this.position.z;
      const targetAngle = Math.atan2(-targetDz, targetDx);
      let diff = targetAngle - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));

      this.yaw += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);

      if (distToPlayer > 18) {
        const forwardX = Math.cos(this.yaw);
        const forwardZ = -Math.sin(this.yaw);
        this.speed = THREE.MathUtils.lerp(this.speed, this.maxSpeed, dt * 2.0);
        this.position.x += forwardX * this.speed * dt;
        this.position.z += forwardZ * this.speed * dt;
      } else {
        this.speed *= 0.9;
      }
    }

    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.yaw;

    // Turret aim at player
    if (player && player.alive) {
      const aimDx = player.position.x - this.position.x;
      const aimDz = player.position.z - this.position.z;
      const aimYaw = Math.atan2(-aimDz, aimDx);
      let turretRel = aimYaw - this.yaw;
      turretRel = Math.atan2(Math.sin(turretRel), Math.cos(turretRel));

      if (this.turret) {
        this.turret.rotation.y = THREE.MathUtils.lerp(this.turret.rotation.y, turretRel, dt * 6);
      }

      // Firing triple barrage
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && distToPlayer < 45) {
        this.shoot(player);
      }
    }
  }

  shoot(player) {
    this.fireTimer = this.fireCooldown + (Math.random() * 0.4 - 0.2);

    // Spread of 3 bullets
    const spreadAngles = [-0.18, 0, 0.18];
    for (let angle of spreadAngles) {
      const muzzleOffset = new THREE.Vector3(4.8, 2.2, 0);
      if (this.turret) muzzleOffset.applyEuler(this.turret.rotation);
      muzzleOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

      const origin = this.position.clone().add(muzzleOffset);
      const dir = muzzleOffset.clone().normalize();
      dir.y = 0;
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

      this.bullets.fire(origin, dir, false, this.damage, 42, true);
    }

    this.sound.play('boss-shoot', { volume: 0.95 });
  }

  takeDamage(amount, hitPos) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);

    this.particles.emitSparks(hitPos, 16, { r: 1, g: 0.5, b: 0.1 });
    this.sound.play('boss-hit', { volume: 0.9 });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    // Titan wreck remains permanently visible on the battlefield!
    this.group.visible = true;

    if (this.eyeLight) this.eyeLight.intensity = 0.5;

    const charredMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.95,
      metalness: 0.1
    });

    this.group.traverse((c) => {
      if (c.isMesh) {
        c.material = charredMat;
      }
    });

    this.particles.emitExplosion(this.position, 4.0);
    this.sound.play('boss-explode', { volume: 1.0 });
  }
}
