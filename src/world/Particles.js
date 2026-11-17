/**
 * Particles.js - High-performance Pooled Particle & VFX System
 */
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;

    // 1. Sparks Pool
    this.maxSparks = 200;
    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(this.maxSparks * 3);
    const sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    this.sparkMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    this.sparks = [];
    for (let i = 0; i < this.maxSparks; i++) {
      this.sparks.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1,
        r: 1, g: 0.7, b: 0.2
      });
    }

    // 2. Smoke Puffs Pool
    this.smokePuffs = [];
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x2a303c,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });
    const smokeGeo = new THREE.DodecahedronGeometry(0.35, 1);
    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(smokeGeo, smokeMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.smokePuffs.push({
        mesh,
        active: false,
        life: 0,
        maxLife: 1,
        vx: 0, vy: 0, vz: 0,
        scaleSpeed: 1.5,
        rotSpeed: 0
      });
    }

    // 3. Shockwave Rings Pool
    this.shockwaves = [];
    const ringGeo = new THREE.RingGeometry(0.3, 0.6, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffaa33,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    for (let i = 0; i < 15; i++) {
      const mesh = new THREE.Mesh(ringGeo, ringMat.clone());
      mesh.visible = false;
      this.scene.add(mesh);
      this.shockwaves.push({
        mesh,
        active: false,
        life: 0,
        maxLife: 0.45,
        growthRate: 18
      });
    }

    // 4. Track Mark Decals Pool
    this.maxTrackMarks = 80;
    this.trackMarks = [];
    const trackGeo = new THREE.PlaneGeometry(0.7, 0.45);
    trackGeo.rotateX(-Math.PI / 2);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0x141820,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });
    for (let i = 0; i < this.maxTrackMarks; i++) {
      const mesh = new THREE.Mesh(trackGeo, trackMat.clone());
      mesh.position.y = 0.02;
      mesh.visible = false;
      this.scene.add(mesh);
      this.trackMarks.push({ mesh, active: false, life: 0, maxLife: 10 });
    }
    this.trackMarkIndex = 0;

    // 5. Flash Lights Pool (Muzzle / Explosion dynamic flash)
    this.flashLights = [];
    for (let i = 0; i < 6; i++) {
      const light = new THREE.PointLight(0xffaa44, 0, 14);
      this.scene.add(light);
      this.flashLights.push({ light, active: false, life: 0, maxLife: 0.1 });
    }
  }

  emitSparks(pos, count = 15, color = { r: 1, g: 0.7, b: 0.2 }, speedScale = 1.0) {
    let spawned = 0;
    for (let i = 0; i < this.maxSparks && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.x = pos.x;
        s.y = pos.y;
        s.z = pos.z;
        const angle = Math.random() * Math.PI * 2;
        const up = Math.random() * 8 + 3;
        const horiz = (Math.random() * 9 + 4) * speedScale;
        s.vx = Math.cos(angle) * horiz;
        s.vy = up * speedScale;
        s.vz = Math.sin(angle) * horiz;
        s.life = 0;
        s.maxLife = Math.random() * 0.4 + 0.3;
        s.r = color.r;
        s.g = color.g;
        s.b = color.b;
        spawned++;
      }
    }
  }

  emitSmoke(pos, count = 2, scale = 1.0, colorHex = 0x2a303c) {
    let spawned = 0;
    for (let p of this.smokePuffs) {
      if (!p.active && spawned < count) {
        p.active = true;
        p.mesh.visible = true;
        p.mesh.position.set(
          pos.x + (Math.random() * 2 - 1) * 0.3,
          pos.y + Math.random() * 0.3,
          pos.z + (Math.random() * 2 - 1) * 0.3
        );
        p.mesh.scale.setScalar(scale * 0.6);
        p.mesh.material.opacity = 0.65;
        p.mesh.material.color.setHex(colorHex);
        p.life = 0;
        p.maxLife = Math.random() * 0.6 + 0.5;
        p.vx = (Math.random() * 2 - 1) * 0.8;
        p.vy = Math.random() * 2.2 + 1.2;
        p.vz = (Math.random() * 2 - 1) * 0.8;
        p.scaleSpeed = (Math.random() * 1.5 + 1.5) * scale;
        p.rotSpeed = (Math.random() * 2 - 1) * 3;
        spawned++;
      }
    }
  }

  emitExplosion(pos, scale = 1.0) {
    // 1. Sparks
    this.emitSparks(pos, Math.round(30 * scale), { r: 1, g: 0.5, b: 0.1 }, scale * 1.3);

    // 2. Heavy smoke cluster
    this.emitSmoke(pos, Math.round(6 * scale), scale * 1.8, 0x181c22);

    // 3. Shockwave ring
    for (let sw of this.shockwaves) {
      if (!sw.active) {
        sw.active = true;
        sw.mesh.visible = true;
        sw.mesh.position.set(pos.x, 0.08, pos.z);
        sw.mesh.scale.setScalar(0.4);
        sw.mesh.material.opacity = 0.95;
        sw.growthRate = 22 * scale;
        sw.life = 0;
        sw.maxLife = 0.45;
        break;
      }
    }

    // 4. Dynamic light flash
    for (let fl of this.flashLights) {
      if (!fl.active) {
        fl.active = true;
        fl.light.position.set(pos.x, pos.y + 1.5, pos.z);
        fl.light.intensity = 8.0 * scale;
        fl.life = 0;
        fl.maxLife = 0.15;
        break;
      }
    }
  }

  addTrackMark(leftPos, rightPos, yaw) {
    for (let pos of [leftPos, rightPos]) {
      const tm = this.trackMarks[this.trackMarkIndex];
      this.trackMarkIndex = (this.trackMarkIndex + 1) % this.maxTrackMarks;

      tm.active = true;
      tm.mesh.visible = true;
      tm.mesh.position.set(pos.x, 0.02, pos.z);
      tm.mesh.rotation.y = yaw;
      tm.mesh.material.opacity = 0.45;
      tm.life = 0;
      tm.maxLife = 8.0; // Fades out slowly
    }
  }

  emitMuzzleFlash(pos, dir) {
    // Small spark burst
    this.emitSparks(pos, 6, { r: 1, g: 0.9, b: 0.4 }, 0.8);
    // Smoke pop
    this.emitSmoke(pos, 1, 0.7, 0x555566);

    // Flash light
    for (let fl of this.flashLights) {
      if (!fl.active) {
        fl.active = true;
        fl.light.position.set(pos.x, pos.y, pos.z);
        fl.light.intensity = 5.0;
        fl.life = 0;
        fl.maxLife = 0.08;
        break;
      }
    }
  }

  update(dt) {
    // 1. Update Sparks
    const posAttr = this.sparkGeo.attributes.position;
    const colAttr = this.sparkGeo.attributes.color;
    let anySparkActive = false;

    for (let i = 0; i < this.maxSparks; i++) {
      const s = this.sparks[i];
      if (s.active) {
        anySparkActive = true;
        s.life += dt;
        if (s.life >= s.maxLife) {
          s.active = false;
          posAttr.setXYZ(i, 0, -999, 0);
          continue;
        }

        s.vy -= 22 * dt; // Gravity
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;

        // Bounce on ground
        if (s.y < 0.05) {
          s.y = 0.05;
          s.vy = -s.vy * 0.45;
          s.vx *= 0.65;
          s.vz *= 0.65;
        }

        posAttr.setXYZ(i, s.x, s.y, s.z);
        const alpha = 1 - s.life / s.maxLife;
        colAttr.setXYZ(i, s.r * alpha, s.g * alpha * 0.8, s.b * alpha * 0.2);
      } else {
        posAttr.setXYZ(i, 0, -999, 0);
      }
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;

    // 2. Update Smoke Puffs
    for (let p of this.smokePuffs) {
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
          p.mesh.visible = false;
          continue;
        }
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.y += p.rotSpeed * dt;

        const currentScale = p.mesh.scale.x + p.scaleSpeed * dt;
        p.mesh.scale.setScalar(currentScale);

        const fade = 1 - p.life / p.maxLife;
        p.mesh.material.opacity = fade * 0.55;
      }
    }

    // 3. Update Shockwaves
    for (let sw of this.shockwaves) {
      if (sw.active) {
        sw.life += dt;
        if (sw.life >= sw.maxLife) {
          sw.active = false;
          sw.mesh.visible = false;
          continue;
        }
        const s = sw.mesh.scale.x + sw.growthRate * dt;
        sw.mesh.scale.setScalar(s);
        sw.mesh.material.opacity = (1 - sw.life / sw.maxLife) * 0.85;
      }
    }

    // 4. Update Track Marks (fade out)
    for (let tm of this.trackMarks) {
      if (tm.active) {
        tm.life += dt;
        if (tm.life >= tm.maxLife) {
          tm.active = false;
          tm.mesh.visible = false;
        } else {
          tm.mesh.material.opacity = (1 - tm.life / tm.maxLife) * 0.45;
        }
      }
    }

    // 5. Update Flash Lights
    for (let fl of this.flashLights) {
      if (fl.active) {
        fl.life += dt;
        if (fl.life >= fl.maxLife) {
          fl.active = false;
          fl.light.intensity = 0;
        } else {
          fl.light.intensity *= Math.max(0, 1 - (fl.life / fl.maxLife) * 2.5);
        }
      }
    }
  }
}
