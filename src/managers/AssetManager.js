/**
 * AssetManager.js - Centralized 3D Model, Texture & Shader Preloader
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

export class AssetManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.models = new Map();
    this.textures = new Map();
    this.materials = new Map();

    // Loaders
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();

    // Draco loader
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // KTX2 loader
    this.ktx2Loader = new KTX2Loader();
    this.ktx2Loader.setTranscoderPath('/basis/');
    if (this.renderer) {
      try {
        this.ktx2Loader.detectSupport(this.renderer);
        this.gltfLoader.setKTX2Loader(this.ktx2Loader);
      } catch (e) {
        console.warn('KTX2Loader detectSupport warning:', e);
      }
    }
  }

  async loadAll(onProgress = () => {}) {
    // 1. Textures
    const textureList = [
      { name: 'gameTexture', path: '/assets/textures/game-texture.png' },
      { name: 'mapLight', path: '/assets/textures/map-light.webp' }
    ];

    // 2. Models
    const modelList = [
      { name: 'player', path: '/assets/models/player.glb' },
      { name: 'fodder', path: '/assets/models/fodder.glb' },
      { name: 'boss', path: '/assets/models/boss.glb' },
      { name: 'bullet', path: '/assets/models/bullet.glb' },
      { name: 'floor', path: '/assets/models/floor.glb' },
      { name: 'explosive-barrel', path: '/assets/models/explosive-barrel.glb' },
      { name: 'concrete-fence', path: '/assets/models/concrete-fence-1a.glb' },
      { name: 'metal-box', path: '/assets/models/metal-box-1a.glb' },
      { name: 'giant-pipe', path: '/assets/models/giant-pipe-1a.glb' },
      { name: 'tools', path: '/assets/models/tools.glb' },
      { name: 'fuel', path: '/assets/models/fuel.glb' },
      { name: 'gear', path: '/assets/models/gear.glb' },
      { name: 'circuit', path: '/assets/models/circuit.glb' }
    ];

    const totalItems = textureList.length + modelList.length;
    let loadedCount = 0;

    const report = () => {
      loadedCount++;
      onProgress(Math.min(1.0, loadedCount / totalItems));
    };

    // Load textures first
    await Promise.all(
      textureList.map(async (item) => {
        try {
          const tex = await new Promise((resolve, reject) => {
            this.textureLoader.load(item.path, resolve, undefined, reject);
          });
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.flipY = false;
          tex.generateMipmaps = true;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          this.textures.set(item.name, tex);
        } catch (e) {
          console.warn(`Texture ${item.name} load failed:`, e);
        }
        report();
      })
    );

    // Build common master material
    const mainTex = this.textures.get('gameTexture');
    if (mainTex) {
      const tankMat = new THREE.MeshStandardMaterial({
        map: mainTex,
        roughness: 0.5,
        metalness: 0.35,
        side: THREE.DoubleSide
      });
      this.materials.set('gameTexture', tankMat);
    }

    // Load models
    await Promise.all(
      modelList.map(async (item) => {
        try {
          const gltf = await new Promise((resolve, reject) => {
            this.gltfLoader.load(item.path, resolve, undefined, reject);
          });

          // Process shadows, materials and hide physics colliders
          gltf.scene.traverse((child) => {
            const nameLower = (child.name || '').toLowerCase();
            // CRITICAL: Hide all physics collider box hulls that encase the tanks!
            if (
              nameLower.includes('cuboid') ||
              nameLower.includes('collider') ||
              nameLower.includes('hitbox') ||
              nameLower.includes('sensor') ||
              nameLower.includes('floor_fixed') ||
              nameLower.endsWith('.ref')
            ) {
              child.visible = false;
              return;
            }

            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material) {
                child.material.side = THREE.DoubleSide;
                if (mainTex && (!child.material.map || child.material.name === 'gameTexture')) {
                  child.material = this.materials.get('gameTexture') || child.material;
                } else if (child.material.map) {
                  child.material.map.colorSpace = THREE.SRGBColorSpace;
                  child.material.map.flipY = false;
                }
              }
            }
          });

          this.models.set(item.name, gltf);
        } catch (e) {
          console.warn(`Model ${item.name} load failed:`, e);
        }
        report();
      })
    );
  }

  getModel(name) {
    const gltf = this.models.get(name);
    if (!gltf) return null;
    return gltf.scene.clone(true);
  }

  getTexture(name) {
    return this.textures.get(name) || null;
  }

  getMaterial(name) {
    return this.materials.get(name) || null;
  }
}
