/**
 * main.js - Main Game Controller & Wave Combat Loop for Better Tanks (Dhamaka Edition)
 */
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { AssetManager } from './managers/AssetManager.js';
import { SoundManager } from './managers/SoundManager.js';
import { BollywoodMusic } from './audio/BollywoodMusic.js';
import { ParticleSystem } from './world/Particles.js';
import { Arena } from './world/Arena.js';
import { BulletSystem } from './entities/Bullet.js';
import { PlayerTank } from './entities/PlayerTank.js';
import { FodderTank } from './entities/FodderTank.js';
import { BossTank } from './entities/BossTank.js';
import { PropManager } from './entities/Prop.js';
import { CollectibleManager } from './entities/Collectible.js';
import { HUD } from './ui/HUD.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.hudContainer = document.getElementById('app-hud');

    // 1. Core Systems
    this.engine = new Engine(this.canvas);
    this.input = new Input(this.canvas, this.engine.camera);
    this.sound = new SoundManager();
    this.music = new BollywoodMusic(this.sound);
    this.assets = new AssetManager(this.engine.renderer);
    this.particles = new ParticleSystem(this.engine.scene);
    this.props = new PropManager(this.engine.scene, this.assets, this.particles, this.sound);
    this.bullets = new BulletSystem(this.engine.scene, this.assets, this.particles, this.sound);
    this.collectibles = new CollectibleManager(this.engine.scene, this.assets, this.sound, this.particles);

    // 2. Entities (Instantiated after assets load)
    this.player = null;
    this.enemies = [];
    this.boss = null;

    // 3. UI
    this.hud = new HUD(this.hudContainer);

    // 4. Game State
    this.isRunning = false;
    this.wave = 1;
    this.maxWaves = 5;
    this.score = 0;
    this.kills = 0;
    this.waveInProgress = false;

    // Time tracking
    this.lastTime = performance.now();

    this.bindCallbacks();
  }

  bindCallbacks() {
    this.hud.onStart = () => {
      this.sound.init();
      this.music.init(this.sound.ctx);
      this.music.play();
      this.music.speakQuote('start');
      this.startBattle();
    };

    this.hud.onRestart = () => {
      this.startBattle();
    };

    this.hud.onToggleMute = () => {
      return this.sound.toggleMute();
    };

    this.hud.onToggleMusic = () => {
      return this.music.toggle();
    };

    this.hud.onSelectMusic = (trackIndex) => {
      const track = this.music.setTrack(trackIndex);
      this.hud.showBollywoodCallout(`SONG: ${track.title}`);
      return track;
    };

    this.hud.onNextMusic = () => {
      const track = this.music.nextTrack();
      if (this.hud.elements.musicSelect) {
        this.hud.elements.musicSelect.value = String(this.music.currentTrackIndex);
      }
      this.hud.showBollywoodCallout(`SONG: ${track.title}`);
      return track;
    };

    this.hud.onToggleCamera = () => {
      return this.engine.toggleCameraMode();
    };

    this.input.onKeyAction = (code) => {
      if (code === 'KeyR') {
        if (!this.player || !this.player.alive) {
          this.startBattle();
        } else {
          this.player.repair(60);
          this.hud.showBollywoodCallout('HULL REPAIRED! 💪');
        }
      } else if (code === 'KeyM') {
        const isMuted = this.sound.toggleMute();
        const btn = document.getElementById('btn-sound');
        if (btn) btn.textContent = isMuted ? '🔇' : '🔊';
      } else if (code === 'KeyP') {
        const playing = this.music.toggle();
        const btn = document.getElementById('btn-music-toggle');
        if (btn) btn.textContent = playing ? '🎶 PAUSE' : '🎶 PLAY';
      } else if (code === 'KeyN') {
        const track = this.music.nextTrack();
        if (this.hud.elements.musicSelect) {
          this.hud.elements.musicSelect.value = String(this.music.currentTrackIndex);
        }
        this.hud.showBollywoodCallout(`SONG: ${track.title}`);
      } else if (code === 'KeyC') {
        this.engine.toggleCameraMode();
      } else if (code === 'KeyF') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
  }

  async init() {
    // 1. Preload 3D Models, Textures and Transcoders FIRST
    await this.assets.loadAll((progress) => {});

    // 2. NOW instantiate Player and Boss Tanks with loaded models!
    this.player = new PlayerTank(this.engine.scene, this.assets, this.particles, this.sound, this.bullets);
    this.player.spawn(0, 0, 0);

    this.boss = new BossTank(this.engine.scene, this.assets, this.particles, this.sound, this.bullets);

    // 3. Build Arena terrain & strategic obstacles
    this.arena = new Arena(this.engine.scene, this.assets, this.props);

    // 4. Spawn initial field collectibles
    this.collectibles.spawn('tools', 0, 18);
    this.collectibles.spawn('fuel', -15, -10);
    this.collectibles.spawn('gear', 18, 5);

    // 5. Start RAF loop
    requestAnimationFrame((t) => this.loop(t));
  }

  startBattle() {
    this.wave = 1;
    this.score = 0;
    this.kills = 0;
    this.isRunning = true;

    // Clear active enemies
    for (let e of this.enemies) {
      this.engine.scene.remove(e.group);
    }
    this.enemies = [];

    // Clear boss if alive
    if (this.boss) {
      this.boss.alive = false;
      this.boss.group.visible = false;
    }

    // Spawn player at origin
    this.player.spawn(0, 0, 0);

    // Start Wave 1
    this.startWave(this.wave);
  }

  startWave(waveNum) {
    this.wave = waveNum;
    this.waveInProgress = true;

    // Boss Wave!
    if (waveNum === 5) {
      this.boss.spawn(0, -45, Math.PI);
      this.engine.addShake(1.4);
      this.hud.showBollywoodCallout('⚠️ MOGAMBO KHUSH HUA! TITAN ARRIVES! ⚠️');
      this.music.speakQuote('boss');

      // Escort fodder tanks
      this.spawnFodder(-18, -38);
      this.spawnFodder(18, -38);
      return;
    }

    // Normal waves: spawn fodder squad
    const count = Math.min(6, 1 + waveNum);
    this.hud.showBollywoodCallout(`WAVE ${waveNum}: AATA MAJHI SATAKLI! 🔥`);

    const spawnPositions = [
      { x: 38, z: -42 },
      { x: -44, z: -36 },
      { x: 42, z: 32 },
      { x: -40, z: 38 },
      { x: 0, z: -55 },
      { x: 50, z: -10 },
      { x: -48, z: 10 },
      { x: 25, z: 45 },
      { x: -28, z: 48 }
    ];

    for (let i = 0; i < count; i++) {
      const sp = spawnPositions[i % spawnPositions.length];
      const jitterX = (Math.random() * 2 - 1) * 6;
      const jitterZ = (Math.random() * 2 - 1) * 6;
      this.spawnFodder(sp.x + jitterX, sp.z + jitterZ);
    }
  }

  spawnFodder(x, z) {
    const fodder = new FodderTank(
      this.engine.scene,
      this.assets,
      this.particles,
      this.sound,
      this.bullets,
      this.enemies.length
    );
    fodder.spawn(x, z, Math.random() * Math.PI * 2);
    this.enemies.push(fodder);
  }

  loop(timestamp) {
    requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min(0.06, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.engine.render();
  }

  update(dt) {
    if (!this.player) return;

    // 1. Update Input
    this.input.update(this.player.position);

    // 2. Update Sound listener position to follow player
    this.sound.setPlayerPosition(this.player.position.x, this.player.position.z);

    // 3. Update Player Tank
    if (!this.isRunning) {
      // Title showcase: smoothly rotate player tank so user can see it proudly!
      this.player.yaw += dt * 0.45;
      this.player.group.rotation.y = this.player.yaw;
    } else {
      this.player.update(dt, this.input);
    }

    // 4. Update Fodder Enemies
    let activeEnemyCount = 0;
    for (let enemy of this.enemies) {
      if (enemy.alive) {
        activeEnemyCount++;
        enemy.update(dt, this.player);
      }
    }

    // 5. Update Boss Tank
    if (this.boss && this.boss.alive) {
      activeEnemyCount++;
      this.boss.update(dt, this.player, () => {
        this.spawnFodder(this.boss.position.x - 14, this.boss.position.z);
        this.spawnFodder(this.boss.position.x + 14, this.boss.position.z);
        this.hud.showBollywoodCallout('TITAN ENRAGED! DHAMAKA! 💥');
      });
    }

    // 6. Update Bullets & Collisions
    const combatTargets = [this.player, ...this.enemies];
    if (this.boss && this.boss.alive) combatTargets.push(this.boss);

    this.bullets.update(dt, combatTargets, (bullet, target) => {
      this.engine.addShake(bullet.isPlayer ? 0.35 : 0.6);

      if (!target.alive) {
        if (!target.isPlayer) {
          this.kills++;
          const pts = target.isBoss ? 3500 : 450;
          this.score += pts;

          // Bollywood callout on kill!
          const calloutText = this.music.speakQuote('kill') || 'DHAMAKA!';
          this.hud.showBollywoodCallout(calloutText);

          // Drop collectibles
          if (Math.random() < 0.45) {
            const dropType = Math.random() < 0.5 ? 'tools' : 'fuel';
            this.collectibles.spawn(dropType, target.position.x, target.position.z);
          }

          // If Boss was killed -> Victory!
          if (target.isBoss) {
            setTimeout(() => {
              this.music.speakQuote('victory');
              this.hud.showVictory(this.score, this.kills);
            }, 1200);
          }
        } else {
          // Player destroyed -> Game Over!
          setTimeout(() => {
            this.music.speakQuote('defeat');
            this.hud.showGameOver(this.score, this.kills, this.wave);
          }, 1000);
        }
      }
    });

    // Check bullet collisions with fences & barrels
    for (let b of this.bullets.bullets) {
      if (b.active) {
        if (this.props.checkBulletHit(b)) {
          this.bullets.deactivateBullet(b);
        }
      }
    }

    // 7. Update Props (Explosive Barrels)
    this.props.update(dt, combatTargets, (explodePos) => {
      this.engine.addShake(1.3);
      this.hud.showBollywoodCallout('💥 MAHA DHAMAKA! 💥');
    });

    // 8. Update Field Collectibles
    this.collectibles.update(dt, this.player, (collectedType) => {
      if (collectedType === 'gear') {
        this.score += 500;
        this.hud.showBollywoodCallout('+500 GEAR POINTS! ⚙️');
      }
      if (collectedType === 'circuit') {
        this.score += 250;
        this.hud.showBollywoodCallout('+250 TECH BONUS! ⚡');
      }
      if (collectedType === 'tools') {
        this.hud.showBollywoodCallout('HULL REPAIRED! 🛠️');
      }
      if (collectedType === 'fuel') {
        this.hud.showBollywoodCallout('DHOOM BOOST FULL! 🚀');
      }
    });

    // 9. Update Particles & VFX
    this.particles.update(dt);

    // 10. Wave Progression Check
    if (this.isRunning && this.waveInProgress && activeEnemyCount === 0 && this.player.alive) {
      if (this.wave < this.maxWaves) {
        this.waveInProgress = false;
        setTimeout(() => {
          this.startWave(this.wave + 1);
        }, 2000);
      }
    }

    // 11. Update Camera
    this.engine.update(dt, this.player.position, this.input.aimPoint, this.player.yaw);

    // 12. Update HUD & Minimap with live EQ levels
    const eqLevels = this.music.getVisualizerLevels();
    this.hud.update(
      this.player,
      this.boss,
      {
        wave: this.wave,
        activeEnemies: activeEnemyCount,
        score: this.score,
        kills: this.kills
      },
      this.engine.fps,
      this.input.mouseScreen,
      eqLevels
    );

    this.hud.updateMinimap(this.player, this.enemies, this.boss, this.collectibles);
  }
}

// Start game on load
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
