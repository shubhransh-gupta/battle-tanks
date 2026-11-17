/**
 * Collectible.js - Floating Field Drops (Repair Kits, Boost Fuel, Tech Gears)
 */
import * as THREE from 'three';

export class CollectibleManager {
  constructor(scene, assetManager, soundManager, particleSystem) {
    this.scene = scene;
    this.assets = assetManager;
    this.sound = soundManager;
    this.particles = particleSystem;

    this.items = [];
    this.types = ['tools', 'fuel', 'gear', 'circuit'];
  }

  spawn(type, x, z) {
    const model = this.assets.getModel(type);
    if (!model) return;

    model.position.set(x, 0.7, z);
    model.scale.setScalar(1.4);

    // Glowing aura light
    let color = 0x55ff77;
    if (type === 'fuel') color = 0x33aaff;
    if (type === 'gear') color = 0xffaa22;
    if (type === 'circuit') color = 0xcc44ff;

    const light = new THREE.PointLight(color, 2.5, 6);
    model.add(light);

    this.scene.add(model);

    this.items.push({
      type,
      model,
      position: new THREE.Vector3(x, 0.7, z),
      baseY: 0.7,
      alive: true,
      pickupRadius: 2.2,
      rotSpeed: 2.0 + Math.random()
    });
  }

  update(dt, player, onCollect = () => {}) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (!item.alive) continue;

      // Bob & Rotate
      item.model.rotation.y += item.rotSpeed * dt;
      item.model.position.y = item.baseY + Math.sin(performance.now() * 0.003 + i) * 0.25;

      // Check player proximity
      if (player && player.alive) {
        const dist = Math.hypot(
          player.position.x - item.position.x,
          player.position.z - item.position.z
        );

        if (dist < item.pickupRadius + player.hitRadius) {
          // Collect!
          item.alive = false;
          this.scene.remove(item.model);

          if (item.type === 'tools') {
            player.repair(35);
          } else if (item.type === 'fuel') {
            player.refillBoost();
          }

          this.particles.emitSparks(item.position, 16, { r: 0.4, g: 1, b: 0.6 });
          this.sound.play('player-jump', { volume: 0.75 });

          onCollect(item.type);
          this.items.splice(i, 1);
        }
      }
    }
  }

  clearAll() {
    for (let item of this.items) {
      this.scene.remove(item.model);
    }
    this.items = [];
  }
}
