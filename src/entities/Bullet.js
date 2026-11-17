/**
 * Bullet.js - Fast Ballistics & Collision System for Better Tanks
 */
import * as THREE from 'three';

export class BulletSystem {
  constructor(scene, assetManager, particleSystem, soundManager) {
    this.scene = scene;
    this.assets = assetManager;
    this.particles = particleSystem;
    this.sound = soundManager;

    this.maxBullets = 50;
    this.bullets = [];

    // Base geometry and material for energy shells
    const shellGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8);
    shellGeo.rotateX(Math.PI / 2);

    const playerMat = new THREE.MeshBasicMaterial({ color: 0x55d6ff });
    const enemyMat = new THREE.MeshBasicMaterial({ color: 0xff4433 });
    const bossMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

    for (let i = 0; i < this.maxBullets; i++) {
      const mesh = new THREE.Mesh(shellGeo, playerMat);
      mesh.visible = false;

      // Glow light
      const light = new THREE.PointLight(0x55d6ff, 1.2, 8);
      mesh.add(light);

      this.scene.add(mesh);

      this.bullets.push({
        mesh,
        light,
        active: false,
        isPlayer: true,
        damage: 25,
        radius: 0.35,
        speed: 65,
        life: 0,
        maxLife: 2.2,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        prevPos: new THREE.Vector3(),
        materials: { player: playerMat, enemy: enemyMat, boss: bossMat }
      });
    }
  }

  fire(origin, direction, isPlayer = true, damage = 25, speed = 65, isBoss = false) {
    for (let b of this.bullets) {
      if (!b.active) {
        b.active = true;
        b.isPlayer = isPlayer;
        b.damage = damage;
        b.speed = speed;
        b.life = 0;
        b.maxLife = 2.5;

        b.pos.copy(origin);
        b.prevPos.copy(origin);
        b.vel.copy(direction).normalize().multiplyScalar(speed);

        // Orient mesh along travel direction
        b.mesh.position.copy(origin);
        b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
        b.mesh.visible = true;

        if (isPlayer) {
          b.mesh.material = b.materials.player;
          b.light.color.setHex(0x55d6ff);
          b.light.intensity = 1.5;
          b.mesh.scale.set(1.0, 1.0, 1.3);
        } else if (isBoss) {
          b.mesh.material = b.materials.boss;
          b.light.color.setHex(0xffaa00);
          b.light.intensity = 3.0;
          b.mesh.scale.set(1.8, 1.8, 2.0);
        } else {
          b.mesh.material = b.materials.enemy;
          b.light.color.setHex(0xff4433);
          b.light.intensity = 1.2;
          b.mesh.scale.set(0.9, 0.9, 1.1);
        }

        // Particle muzzle pop at gun tip
        this.particles.emitMuzzleFlash(origin, direction);
        break;
      }
    }
  }

  update(dt, targets, onHit = () => {}) {
    for (let b of this.bullets) {
      if (!b.active) continue;

      b.life += dt;
      if (b.life >= b.maxLife) {
        this.deactivateBullet(b);
        continue;
      }

      b.prevPos.copy(b.pos);

      // Travel step with slight ballistic curve
      b.pos.addScaledVector(b.vel, dt);
      b.pos.y = Math.max(0.3, b.pos.y - 0.2 * dt); // maintain combat height
      b.mesh.position.copy(b.pos);

      // Tracer smoke puff along path
      if (Math.random() < 0.4) {
        this.particles.emitSmoke(b.pos, 1, 0.35, b.isPlayer ? 0x224455 : 0x552222);
      }

      // Check ground or out-of-bounds hit
      if (b.pos.y <= 0.2 || Math.abs(b.pos.x) > 95 || Math.abs(b.pos.z) > 105) {
        this.particles.emitExplosion(b.pos, 0.6);
        this.sound.play(b.isPlayer ? 'player-hit' : 'fodder-hit', { position: b.pos, volume: 0.6 });
        this.deactivateBullet(b);
        continue;
      }

      // Collision checks against targets
      let hitSomething = false;
      for (let target of targets) {
        if (!target.alive) continue;
        // Don't hit self team
        if (b.isPlayer && target.isPlayer) continue;
        if (!b.isPlayer && !target.isPlayer) continue;

        const dist = Math.hypot(b.pos.x - target.position.x, b.pos.z - target.position.z);
        if (dist < target.hitRadius + b.radius) {
          // HIT!
          hitSomething = true;
          target.takeDamage(b.damage, b.pos);

          this.particles.emitExplosion(b.pos, b.isPlayer ? 0.9 : 0.7);
          this.sound.play(target.hitSound || 'fodder-hit', { position: b.pos, volume: 0.9 });

          onHit(b, target);
          this.deactivateBullet(b);
          break;
        }
      }

      if (hitSomething) continue;
    }
  }

  deactivateBullet(b) {
    b.active = false;
    b.mesh.visible = false;
  }
}
