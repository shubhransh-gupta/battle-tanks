/**
 * Prop.js - Interactive Battlefield Props (Explosive Barrels, Cover Fences)
 */
import * as THREE from 'three';

export class PropManager {
  constructor(scene, assetManager, particleSystem, soundManager) {
    this.scene = scene;
    this.assets = assetManager;
    this.particles = particleSystem;
    this.sound = soundManager;

    this.props = [];
  }

  addExplosiveBarrel(x, z) {
    const model = this.assets.getModel('explosive-barrel');
    if (!model) return;

    model.position.set(x, 0, z);
    model.scale.setScalar(1.2);
    this.scene.add(model);

    this.props.push({
      type: 'barrel',
      model,
      position: new THREE.Vector3(x, 0, z),
      hitRadius: 1.1,
      alive: true,
      health: 20,
      ignited: false,
      igniteTimer: 0
    });
  }

  addConcreteFence(x, z, rotY = 0) {
    const model = this.assets.getModel('concrete-fence');
    if (!model) return;

    model.position.set(x, 0, z);
    model.rotation.y = rotY;
    model.scale.setScalar(1.2);
    this.scene.add(model);

    this.props.push({
      type: 'fence',
      model,
      position: new THREE.Vector3(x, 0, z),
      hitRadius: 1.8,
      alive: true,
      health: 40
    });
  }

  addHeavyCover(type, x, z, rotY = 0) {
    const model = this.assets.getModel(type); // 'metal-box' or 'giant-pipe'
    if (!model) return;

    model.position.set(x, 0, z);
    model.rotation.y = rotY;
    model.scale.setScalar(1.2);
    this.scene.add(model);

    this.props.push({
      type: 'cover',
      model,
      position: new THREE.Vector3(x, 0, z),
      hitRadius: 2.2,
      alive: true,
      indestructible: true
    });
  }

  update(dt, targets, onExplode = () => {}) {
    for (let i = this.props.length - 1; i >= 0; i--) {
      const p = this.props[i];
      if (!p.alive) continue;

      if (p.ignited) {
        p.igniteTimer -= dt;
        this.particles.emitSmoke(new THREE.Vector3(p.position.x, 1.2, p.position.z), 1, 0.6, 0xee4422);

        if (p.igniteTimer <= 0) {
          // Detonate!
          p.alive = false;
          this.scene.remove(p.model);
          this.particles.emitExplosion(p.position, 2.2);
          this.sound.play('boss-explode', { position: p.position, volume: 1.0 });

          // Radial explosion damage to nearby players & enemies
          const blastRadius = 9.0;
          for (let t of targets) {
            if (!t.alive) continue;
            const dist = Math.hypot(t.position.x - p.position.x, t.position.z - p.position.z);
            if (dist < blastRadius) {
              const falloff = 1 - dist / blastRadius;
              t.takeDamage(Math.round(65 * falloff), p.position);
            }
          }

          // Chain reaction to nearby barrels
          for (let other of this.props) {
            if (other !== p && other.alive && other.type === 'barrel' && !other.ignited) {
              const d = Math.hypot(other.position.x - p.position.x, other.position.z - p.position.z);
              if (d < blastRadius) {
                other.ignited = true;
                other.igniteTimer = 0.15;
              }
            }
          }

          onExplode(p.position);
          this.props.splice(i, 1);
        }
      }
    }
  }

  checkBulletHit(bullet) {
    for (let p of this.props) {
      if (!p.alive) continue;
      const dist = Math.hypot(bullet.pos.x - p.position.x, bullet.pos.z - p.position.z);
      if (dist < p.hitRadius + bullet.radius) {
        if (p.type === 'barrel' && !p.ignited) {
          p.ignited = true;
          p.igniteTimer = 0.18;
          this.sound.play('fodder-hit', { position: p.position, volume: 0.8 });
        } else if (p.type === 'fence') {
          p.health -= bullet.damage;
          this.particles.emitSparks(bullet.pos, 10, { r: 0.8, g: 0.8, b: 0.8 });
          if (p.health <= 0) {
            p.alive = false;
            this.scene.remove(p.model);
            this.particles.emitExplosion(p.position, 0.8);
          }
        }
        return true;
      }
    }
    return false;
  }
}
