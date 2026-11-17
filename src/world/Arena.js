/**
 * Arena.js - Battlefield Environment, Terrain & Strategic Map Layout
 */
import * as THREE from 'three';

export class Arena {
  constructor(scene, assetManager, propManager) {
    this.scene = scene;
    this.assets = assetManager;
    this.props = propManager;

    this.setupGround();
    this.populateStrategicProps();
  }

  setupGround() {
    // 1. High-Quality Tactical Concrete & Asphalt Ground Plane
    const groundGeo = new THREE.PlaneGeometry(220, 220, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);

    const mapLight = this.assets.getTexture('mapLight');
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x181e29,
      roughness: 0.85,
      metalness: 0.15,
      map: mapLight || null
    });
    if (mapLight) {
      mapLight.wrapS = THREE.RepeatWrapping;
      mapLight.wrapT = THREE.RepeatWrapping;
      mapLight.repeat.set(4, 4);
    }

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Tactical Military Grid Markings
    const grid = new THREE.GridHelper(200, 40, 0x38dbff, 0x1f293d);
    grid.position.y = 0.01;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    this.scene.add(grid);

    // 3. Runway Hazard Stripes / Boundary Markers
    const boundaryGeo = new THREE.RingGeometry(94, 96, 64);
    boundaryGeo.rotateX(-Math.PI / 2);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      opacity: 0.4,
      transparent: true,
      side: THREE.DoubleSide
    });
    const boundaryRing = new THREE.Mesh(boundaryGeo, boundaryMat);
    boundaryRing.position.y = 0.02;
    this.scene.add(boundaryRing);
  }

  populateStrategicProps() {
    // 1. Explosive Barrels placed at tactical corners & choke points
    const barrelPositions = [
      { x: 14, z: 16 },
      { x: 16, z: 16 },
      { x: -16, z: 20 },
      { x: -18, z: 18 },
      { x: 25, z: -14 },
      { x: -28, z: -16 },
      { x: 6, z: -32 },
      { x: 8, z: -34 },
      { x: -12, z: 45 },
      { x: 22, z: 48 }
    ];
    for (let bp of barrelPositions) {
      this.props.addExplosiveBarrel(bp.x, bp.z);
    }

    // 2. Concrete Fences / Cover points
    const fencePositions = [
      { x: 10, z: 12, rot: 0 },
      { x: -14, z: 10, rot: Math.PI / 2 },
      { x: 20, z: -8, rot: Math.PI / 4 },
      { x: -24, z: -10, rot: 0 },
      { x: 0, z: 28, rot: 0 },
      { x: -18, z: 36, rot: Math.PI / 2 },
      { x: 18, z: 36, rot: Math.PI / 2 }
    ];
    for (let fp of fencePositions) {
      this.props.addConcreteFence(fp.x, fp.z, fp.rot);
    }

    // 3. Heavy industrial cover
    this.props.addHeavyCover('metal-box', 24, 24, 0);
    this.props.addHeavyCover('metal-box', -26, 26, Math.PI / 3);
    this.props.addHeavyCover('metal-box', 32, -22, 0);
    this.props.addHeavyCover('giant-pipe', -6, -42, Math.PI / 2);
    this.props.addHeavyCover('giant-pipe', 16, -46, 0);
  }
}
