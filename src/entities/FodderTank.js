/**
 * FodderTank.js - Autonomous Enemy Scout Tank with Flanking AI & Laser Sight
 */
import * as THREE from 'three';

export class FodderTank {
  constructor(scene, assetManager, particleSystem, soundManager, bulletSystem, id) {
    this.scene = scene;
    this.assets = assetManager;
    this.particles = particleSystem;
    this.sound = soundManager;
    this.bullets = bulletSystem;
    this.id = id;

    this.isPlayer = false;
    this.alive = false;
    this.hitRadius = 1.6;
    this.hitSound = 'fodder-hit';

    this.maxHealth = 70;
    this.health = 70;
    this.damage = 10;

    // Movement & AI
    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.speed = 0;
    this.maxSpeed = 8.5;
    this.turnSpeed = 2.4;

    this.state = 'PATROL';
    this.stateTimer = 0;
    this.patrolTarget = new THREE.Vector3();

    // Spawn grace period: no shooting for 3.5 seconds
    this.spawnGraceTimer = 3.5;
    this.fireCooldown = 2.4;
    this.fireTimer = 2.0;
    this.stunTimer = 0;

    this.setupMesh();
    this.setupLaserSight();
  }

  setupMesh() {
    this.group = new THREE.Group();
    const model = this.assets ? this.assets.getModel('fodder') : null;

    if (model) {
      this.model = model;
      this.model.scale.setScalar(2.2);
      this.model.position.y = 0; // Grounds tracks
      this.group.add(this.model);

      this.body = this.model.getObjectByName('Fodder_Body');
      this.turret = this.model.getObjectByName('Fodder_Turret');
      this.barrel = this.model.getObjectByName('Fodder_Barrel');

      // Mirror left track to create right track
      const leftTrack = this.model.getObjectByName('Fodder_Track');
      if (leftTrack && !this.model.getObjectByName('Fodder_Track_Right')) {
        const rightTrack = leftTrack.clone();
        rightTrack.name = 'Fodder_Track_Right';
        rightTrack.position.z = -leftTrack.position.z;
        rightTrack.scale.z = -1;
        this.model.add(rightTrack);
      }

      // Glowing red warning lights
      const redGlow = new THREE.MeshBasicMaterial({ color: 0xff2244 });
      for (let lName of ['Light_1A', 'Light_2A', 'Back_Light']) {
        const l = this.model.getObjectByName(lName);
        if (l && l.isMesh) l.material = redGlow;
      }
    } else {
      this.buildProceduralFodder();
    }

    // Overhead Health Bar
    this.setupHealthBar();

    this.group.visible = false;
    this.scene.add(this.group);
  }

  setupLaserSight() {
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(25, 0, 0)
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0xff2233,
      transparent: true,
      opacity: 0.0
    });
    this.laserLine = new THREE.Line(laserGeo, laserMat);
    this.laserLine.position.set(2.4, 0, 0);

    if (this.barrel) {
      this.barrel.add(this.laserLine);
    } else if (this.turret) {
      this.turret.add(this.laserLine);
    }
  }

  buildProceduralFodder() {
    const mainMat = new THREE.MeshStandardMaterial({
      color: 0x7c2d12, // Crimson desert armor
      roughness: 0.5,
      metalness: 0.4
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.7,
      metalness: 0.3
    });
    const redGlowMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });

    // Body
    this.body = new THREE.Group();
    this.body.position.y = 0.5;

    const hullGeo = new THREE.BoxGeometry(2.7, 0.75, 1.85);
    const hull = new THREE.Mesh(hullGeo, mainMat);
    hull.castShadow = true;
    hull.receiveShadow = true;
    this.body.add(hull);

    // Tracks
    for (let side of [-1.1, 1.1]) {
      const trackGeo = new THREE.BoxGeometry(3.0, 0.65, 0.4);
      const track = new THREE.Mesh(trackGeo, darkMat);
      track.position.set(0, -0.1, side);
      track.castShadow = true;
      this.body.add(track);
    }

    // Headlight Red
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.4), redGlowMat);
    light.position.set(1.4, 0.1, 0);
    this.body.add(light);

    this.group.add(this.body);

    // Turret
    this.turret = new THREE.Group();
    this.turret.position.set(0.1, 1.15, 0);

    const turretGeo = new THREE.CylinderGeometry(0.75, 0.85, 0.55, 8);
    const turretMesh = new THREE.Mesh(turretGeo, mainMat);
    turretMesh.castShadow = true;
    this.turret.add(turretMesh);

    // Barrel
    this.barrel = new THREE.Group();
    this.barrel.position.set(0.65, 0.1, 0);

    const barrelGeo = new THREE.CylinderGeometry(0.1, 0.12, 2.0, 8);
    barrelGeo.rotateZ(-Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, darkMat);
    barrelMesh.position.set(0.95, 0, 0);
    barrelMesh.castShadow = true;
    this.barrel.add(barrelMesh);

    this.turret.add(this.barrel);
    this.group.add(this.turret);
  }

  setupHealthBar() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 16;
    this.barCanvas = canvas;
    this.barCtx = canvas.getContext('2d');

    this.barTexture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.barTexture,
      depthTest: false
    });
    this.healthSprite = new THREE.Sprite(spriteMat);
    this.healthSprite.scale.set(2.8, 0.35, 1);
    this.healthSprite.position.set(0, 2.4, 0);
    this.group.add(this.healthSprite);
    this.updateHealthBarCanvas();
  }

  updateHealthBarCanvas() {
    if (!this.barCtx) return;
    const ctx = this.barCtx;
    const pct = Math.max(0, this.health / this.maxHealth);

    ctx.clearRect(0, 0, 128, 16);
    ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
    ctx.fillRect(0, 0, 128, 16);

    ctx.fillStyle = '#ff2244';
    ctx.fillRect(2, 2, Math.floor(124 * pct), 12);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, 126, 14);

    this.barTexture.needsUpdate = true;
  }

  spawn(x, z, yaw = 0) {
    this.position.set(x, 0, z);
    this.yaw = yaw;
    this.speed = 0;
    this.health = this.maxHealth;
    this.alive = true;
    this.spawnGraceTimer = 3.5;
    this.fireTimer = 2.5;

    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.yaw;
    this.group.visible = true;

    if (this.healthSprite) this.healthSprite.visible = true;
    this.updateHealthBarCanvas();
    this.pickNewPatrolTarget();
  }

  pickNewPatrolTarget() {
    this.patrolTarget.set(
      this.position.x + (Math.random() * 2 - 1) * 35,
      0,
      this.position.z + (Math.random() * 2 - 1) * 35
    );
    this.patrolTarget.x = THREE.MathUtils.clamp(this.patrolTarget.x, -75, 75);
    this.patrolTarget.z = THREE.MathUtils.clamp(this.patrolTarget.z, -85, 65);
  }

  update(dt, player) {
    if (!this.alive) {
      if (Math.random() < 0.3) {
        this.particles.emitSmoke(
          new THREE.Vector3(this.position.x, 0.8, this.position.z),
          1,
          0.6,
          0x222222
        );
      }
      return;
    }

    if (this.spawnGraceTimer > 0) {
      this.spawnGraceTimer -= dt;
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    const distToPlayer = player && player.alive
      ? Math.hypot(player.position.x - this.position.x, player.position.z - this.position.z)
      : 999;

    if (distToPlayer < 40 && player && player.alive) {
      this.state = distToPlayer < 12 ? 'RETREAT' : 'ENGAGE';
    } else {
      this.state = 'PATROL';
    }

    let moveTarget = this.patrolTarget;

    if (this.state === 'ENGAGE') {
      const angleOffset = Math.sin(performance.now() * 0.001 + this.id) * 0.75;
      const dx = player.position.x - this.position.x;
      const dz = player.position.z - this.position.z;
      const baseAngle = Math.atan2(dz, dx) + angleOffset;
      moveTarget = new THREE.Vector3(
        player.position.x - Math.cos(baseAngle) * 16,
        0,
        player.position.z - Math.sin(baseAngle) * 16
      );
    } else if (this.state === 'RETREAT') {
      const dx = this.position.x - player.position.x;
      const dz = this.position.z - player.position.z;
      moveTarget = new THREE.Vector3(this.position.x + dx * 2, 0, this.position.z + dz * 2);
    }

    const targetAngle = Math.atan2(-(moveTarget.z - this.position.z), moveTarget.x - this.position.x);
    let diff = targetAngle - this.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));

    this.yaw += Math.sign(diff) * Math.min(Math.abs(diff), this.turnSpeed * dt);

    const forwardX = Math.cos(this.yaw);
    const forwardZ = -Math.sin(this.yaw);
    this.speed = THREE.MathUtils.lerp(this.speed, this.maxSpeed, dt * 2.5);

    this.position.x += forwardX * this.speed * dt;
    this.position.z += forwardZ * this.speed * dt;

    this.position.x = THREE.MathUtils.clamp(this.position.x, -80, 75);
    this.position.z = THREE.MathUtils.clamp(this.position.z, -88, 68);

    this.group.position.set(this.position.x, 0, this.position.z);
    this.group.rotation.y = this.yaw;

    // Turret & Laser Aiming
    if (player && player.alive) {
      const aimDx = player.position.x - this.position.x;
      const aimDz = player.position.z - this.position.z;
      const aimYaw = Math.atan2(-aimDz, aimDx);
      let turretRel = aimYaw - this.yaw;
      turretRel = Math.atan2(Math.sin(turretRel), Math.cos(turretRel));

      if (this.turret) {
        this.turret.rotation.y = THREE.MathUtils.lerp(this.turret.rotation.y, turretRel, dt * 8);
      }

      // Laser Sight telegraph
      if (this.laserLine) {
        if (distToPlayer < 36 && this.spawnGraceTimer <= 0) {
          const aimError = Math.abs(turretRel - (this.turret ? this.turret.rotation.y : 0));
          this.laserLine.material.opacity = aimError < 0.35 ? 0.75 : 0.2;
        } else {
          this.laserLine.material.opacity = 0;
        }
      }

      // Fire
      if (distToPlayer < 35 && this.spawnGraceTimer <= 0) {
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
          this.shoot(player);
        }
      }
    } else {
      if (this.laserLine) this.laserLine.material.opacity = 0;
    }
  }

  shoot(player) {
    this.fireTimer = this.fireCooldown + (Math.random() * 0.6 - 0.3);

    const muzzle = new THREE.Vector3(2.6, 1.2, 0);
    if (this.turret) muzzle.applyEuler(this.turret.rotation);
    muzzle.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const origin = this.position.clone().add(muzzle);

    const dir = muzzle.clone().normalize();
    dir.y = 0;

    // Aim with minor inaccuracy
    const jitter = (Math.random() * 2 - 1) * 0.08;
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), jitter);

    this.bullets.fire(origin, dir, false, this.damage, 48, false);
    this.sound.play('fodder-shoot', {
      volume: 0.65,
      pitchVar: 0.1,
      sourcePos: { x: this.position.x, z: this.position.z }
    });
  }

  takeDamage(amount, hitPos) {
    if (!this.alive) return;
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBarCanvas();

    this.particles.emitSparks(hitPos, 12, { r: 1, g: 0.2, b: 0.2 });
    this.sound.play('fodder-hit', {
      volume: 0.8,
      sourcePos: { x: this.position.x, z: this.position.z }
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    // Tank remains as a smoking battle wreck!
    this.group.visible = true;

    if (this.healthSprite) this.healthSprite.visible = false;
    if (this.laserLine) this.laserLine.material.opacity = 0;

    const charredMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.95,
      metalness: 0.1
    });

    this.group.traverse((c) => {
      if (c.isMesh && c !== this.healthSprite) {
        c.material = charredMat;
      }
    });

    this.particles.emitExplosion(this.position, 1.8);
    this.sound.play('fodder-explode', {
      volume: 1.0,
      sourcePos: { x: this.position.x, z: this.position.z }
    });
  }
}
