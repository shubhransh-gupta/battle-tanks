/**
 * HUD.js - Cyber-Military Tactical HUD, Minimap Radar & Bollywood Jukebox
 */
export class HUD {
  constructor(container) {
    this.container = container;
    this.elements = {};

    this.onStart = null;
    this.onRestart = null;
    this.onToggleMute = null;
    this.onToggleMusic = null;
    this.onNextMusic = null;
    this.onToggleCamera = null;
    this.onToggleFullscreen = null;

    this.setupDOM();
    this.setupMinimap();
  }

  setupDOM() {
    this.container.innerHTML = `
      <div id="hud-overlay">
        <!-- 1. Top Industrial Status Bar -->
        <header class="hud-top-bar">
          <div class="hud-brand">
            <span class="hud-title">BATTLE TANKS</span>
            <span class="hud-bollywood-pill">AGGRESSIVE PHONK 💀</span>
            <span class="hud-badge" id="hud-fps-pill">60 FPS</span>
          </div>

          <!-- Phonk / Soundtrack Player Bar -->
          <div class="hud-music-player" id="hud-music-player">
            <button class="hud-music-btn" id="btn-music-toggle" title="Play / Pause Soundtrack [P]">🎶 PAUSE</button>
            <div class="hud-music-track-info">
              <span class="music-icon">📻</span>
              <select class="hud-music-select" id="hud-music-select" title="Choose Phonk Track">
                <option value="0">🔥 ELLEY DUHÉ - MIDDLE OF THE NIGHT</option>
                <option value="1">💀 DVRST - CLOSE EYES (RUSSIAN PHONK)</option>
                <option value="2">🩸 KORDHELL - MURDER IN MY MIND</option>
                <option value="3">⚡ INTERWORLD - METAMORPHOSIS</option>
                <option value="4">🚀 MOONDEITY X INTERWORLD - ONE CHANCE</option>
              </select>
              <div class="hud-eq-bars" id="hud-eq-bars">
                <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
                <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
              </div>
            </div>
            <button class="hud-music-btn" id="btn-music-next" title="Next Song [N]">⏭ NEXT</button>
          </div>

          <div class="hud-center-status">
            <div class="hud-wave-badge" id="hud-wave-badge">WAVE 01 / 05</div>
            <div class="hud-contacts" id="hud-contacts-count">CONTACTS: 0</div>
          </div>

          <div class="hud-stats-group">
            <div class="hud-stat-item">
              <span class="hud-stat-label">SCORE</span>
              <span class="hud-stat-value" id="hud-score-val">000000</span>
            </div>
            <div class="hud-stat-item">
              <span class="hud-stat-label">KILLS</span>
              <span class="hud-stat-value" id="hud-kills-val">00</span>
            </div>

            <!-- Utility Buttons -->
            <button class="hud-icon-btn" id="btn-sound" title="Toggle SFX [M]">🔊</button>
            <button class="hud-icon-btn" id="btn-camera" title="Toggle Camera [C]">📹</button>
            <button class="hud-icon-btn" id="btn-fullscreen" title="Fullscreen [F]">⛶</button>
          </div>
        </header>

        <!-- Bollywood Dialogue Callout Popups -->
        <div class="hud-bollywood-callout" id="hud-bollywood-callout" style="display: none;">
          <span class="callout-sparkle">💥</span>
          <span class="callout-text" id="hud-callout-text">DHAMAKA!</span>
          <span class="callout-sparkle">💥</span>
        </div>

        <!-- 2. Boss Health Bar (Top Center, hidden by default) -->
        <div class="hud-boss-container" id="hud-boss-bar" style="display: none;">
          <div class="hud-boss-header">
            <span class="hud-boss-warning">⚠️ PRIORITY THREAT DETECTED</span>
            <span class="hud-boss-name">TITAN MK-IV // HEAVY SIEGE BATTLE MECH</span>
          </div>
          <div class="hud-boss-track">
            <div class="hud-boss-fill" id="hud-boss-fill" style="width: 100%;"></div>
          </div>
        </div>

        <!-- 3. Bottom Left - Armor & Health Card -->
        <div class="hud-bottom-left">
          <div class="hud-card">
            <div class="hud-card-header">
              <span class="hud-card-icon">🛡️</span>
              <span class="hud-card-title">HULL INTEGRITY</span>
              <span class="hud-card-percent" id="hud-health-pct">100%</span>
            </div>
            <div class="hud-progress-track">
              <div class="hud-progress-fill hud-health-fill" id="hud-health-fill" style="width: 100%;"></div>
            </div>
            <div class="hud-card-footer">
              <span class="hud-status-nominal" id="hud-sys-status">SYS: NOMINAL</span>
              <span class="hud-shield-status" id="hud-shield-status" style="display: none; color: #00e5ff; font-weight: bold; margin-left: 6px;">🛡️ SHIELD (8s)</span>
              <span class="hud-repair-hint" id="hud-repair-hint">[R] REPAIR READY</span>
            </div>
          </div>
        </div>

        <!-- 4. Bottom Center - Ordnance & Boost Controls -->
        <div class="hud-bottom-center">
          <div class="hud-ordnance-group">
            <div class="hud-gauge-block">
              <div class="hud-gauge-label">
                <span>DHOOM BOOST</span>
                <span id="hud-boost-pct">100%</span>
              </div>
              <div class="hud-gauge-track">
                <div class="hud-gauge-fill hud-boost-fill" id="hud-boost-fill" style="width: 100%;"></div>
              </div>
            </div>

            <div class="hud-gauge-block">
              <div class="hud-gauge-label">
                <span>CANNON READY</span>
                <span id="hud-reload-status" class="status-ready">READY</span>
              </div>
              <div class="hud-gauge-track">
                <div class="hud-gauge-fill hud-reload-fill" id="hud-reload-fill" style="width: 100%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Bottom Right - Tactical Radar Minimap -->
        <div class="hud-bottom-right">
          <div class="hud-radar-frame">
            <div class="hud-radar-label">TACTICAL SCANNER</div>
            <canvas id="hud-minimap-canvas" width="140" height="140"></canvas>
          </div>
        </div>

        <!-- 6. Mobile Touch Joysticks -->
        <div class="hud-touch-controls" id="hud-touch-controls">
          <div class="hud-touch-zone" id="touch-move-zone">
            <div class="hud-touch-stick" id="touch-move-stick">
              <div class="hud-touch-knob" id="touch-move-knob"></div>
            </div>
            <div class="hud-touch-label">MOVE / STEER</div>
          </div>

          <div class="hud-touch-zone right-zone" id="touch-aim-zone">
            <button class="hud-touch-btn boost-btn" id="touch-boost-btn">BOOST</button>
            <div class="hud-touch-stick" id="touch-aim-stick">
              <div class="hud-touch-knob aim-knob" id="touch-aim-knob"></div>
            </div>
            <div class="hud-touch-label">AIM & SHOOT</div>
          </div>
        </div>

        <!-- 7. Reticle (Floating cursor in screen space) -->
        <div class="hud-aim-reticle" id="hud-aim-reticle">
          <div class="reticle-circle"></div>
          <div class="reticle-dot"></div>
        </div>

        <!-- 8. Start Screen Modal -->
        <div class="hud-modal" id="modal-start">
          <div class="hud-modal-card">
            <div class="modal-badge">AGGRESSIVE PHONK WARFARE EDITION ⚡</div>
            <h1 class="modal-title">BATTLE TANKS</h1>
            <p class="modal-subtitle">TACTICAL ARMOR COMBAT // AGGRESSIVE DRIFT PHONK</p>
            <p class="modal-desc">
              Hostile mechanized rogue forces have captured Sector 7. Deploy your heavy combat tank, crank up the aggressive phonk beats, blast through scout squadrons, and defeat the colossal Titan MK-IV Boss!
            </p>
            <div class="modal-controls-grid">
              <div class="control-key-item"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Drive & Steer</span></div>
              <div class="control-key-item"><kbd>MOUSE</kbd><span>Aim Turret</span></div>
              <div class="control-key-item"><kbd>CLICK</kbd> / <kbd>SPACE</kbd><span>Fire Cannon</span></div>
              <div class="control-key-item"><kbd>SHIFT</kbd><span>Nitro Drift Boost</span></div>
              <div class="control-key-item"><kbd>N</kbd><span>Next Phonk Track</span></div>
              <div class="control-key-item"><kbd>P</kbd><span>Toggle Music</span></div>
              <div class="control-key-item"><kbd>C</kbd><span>Toggle Camera</span></div>
              <div class="control-key-item"><kbd>R</kbd><span>Quick Repair</span></div>
            </div>
            <button class="hud-primary-btn" id="btn-start-game">START COMBAT 🚀</button>
          </div>
        </div>

        <!-- 9. Game Over Modal -->
        <div class="hud-modal" id="modal-gameover" style="display: none;">
          <div class="hud-modal-card death-card">
            <div class="modal-badge death-badge">HULL DESTROYED</div>
            <h1 class="modal-title death-title">YOU DIED</h1>
            <p class="modal-tagline">"Haar kar jeetne waale ko Baazigar kehte hain!"</p>
            <div class="modal-stats-summary">
              <div class="stat-row"><span>Final Score:</span><strong id="go-score">00000</strong></div>
              <div class="stat-row"><span>Tanks Destroyed:</span><strong id="go-kills">0</strong></div>
              <div class="stat-row"><span>Waves Cleared:</span><strong id="go-waves">0</strong></div>
            </div>
            <button class="hud-primary-btn" id="btn-restart-game">REDEPLOY TANK [R]</button>
          </div>
        </div>

        <!-- 10. Victory Modal -->
        <div class="hud-modal" id="modal-victory" style="display: none;">
          <div class="hud-modal-card victory-card">
            <div class="modal-badge victory-badge">EKDUM JHAKAAS! 🏆</div>
            <h1 class="modal-title victory-title">TITAN DESTROYED</h1>
            <p class="modal-tagline">"Don ko pakadna mushkil hi nahi, namumkin hai!"</p>
            <p class="modal-desc">Sector 7 has been liberated with explosive Bollywood style. All hostile divisions eliminated.</p>
            <div class="modal-stats-summary">
              <div class="stat-row"><span>Total Score:</span><strong id="vic-score">00000</strong></div>
              <div class="stat-row"><span>Total Kills:</span><strong id="vic-kills">0</strong></div>
              <div class="stat-row"><span>Action Rating:</span><strong style="color: #ffaa00;">SUPER HIT BLOCKBUSTER ★★★★★</strong></div>
            </div>
            <button class="hud-primary-btn" id="btn-next-mission">PLAY AGAIN [R]</button>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.elements = {
      fpsPill: document.getElementById('hud-fps-pill'),
      waveBadge: document.getElementById('hud-wave-badge'),
      contactsCount: document.getElementById('hud-contacts-count'),
      scoreVal: document.getElementById('hud-score-val'),
      killsVal: document.getElementById('hud-kills-val'),
      musicSelect: document.getElementById('hud-music-select'),
      musicTitle: document.getElementById('hud-music-title'),
      btnMusicToggle: document.getElementById('btn-music-toggle'),
      btnMusicNext: document.getElementById('btn-music-next'),
      eqBars: document.querySelectorAll('.eq-bar'),
      callout: document.getElementById('hud-bollywood-callout'),
      calloutText: document.getElementById('hud-callout-text'),
      bossBar: document.getElementById('hud-boss-bar'),
      bossFill: document.getElementById('hud-boss-fill'),
      healthPct: document.getElementById('hud-health-pct'),
      healthFill: document.getElementById('hud-health-fill'),
      shieldStatus: document.getElementById('hud-shield-status'),
      sysStatus: document.getElementById('hud-sys-status'),
      repairHint: document.getElementById('hud-repair-hint'),
      boostPct: document.getElementById('hud-boost-pct'),
      boostFill: document.getElementById('hud-boost-fill'),
      reloadStatus: document.getElementById('hud-reload-status'),
      reloadFill: document.getElementById('hud-reload-fill'),
      reticle: document.getElementById('hud-aim-reticle'),
      modalStart: document.getElementById('modal-start'),
      modalGameOver: document.getElementById('modal-gameover'),
      modalVictory: document.getElementById('modal-victory'),
      goScore: document.getElementById('go-score'),
      goKills: document.getElementById('go-kills'),
      goWaves: document.getElementById('go-waves'),
      vicScore: document.getElementById('vic-score'),
      vicKills: document.getElementById('vic-kills'),
      btnSound: document.getElementById('btn-sound'),
      btnCamera: document.getElementById('btn-camera'),
      btnFullscreen: document.getElementById('btn-fullscreen')
    };

    if (this.elements.musicSelect) {
      this.elements.musicSelect.addEventListener('change', (e) => {
        const idx = parseInt(e.target.value, 10);
        if (this.onSelectMusic) this.onSelectMusic(idx);
      });
    }

    // Button event bindings
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.elements.modalStart.style.display = 'none';
      if (this.onStart) this.onStart();
    });

    document.getElementById('btn-restart-game').addEventListener('click', () => {
      this.elements.modalGameOver.style.display = 'none';
      if (this.onRestart) this.onRestart();
    });

    document.getElementById('btn-next-mission').addEventListener('click', () => {
      this.elements.modalVictory.style.display = 'none';
      if (this.onRestart) this.onRestart();
    });

    this.elements.btnSound.addEventListener('click', () => {
      if (this.onToggleMute) {
        const isMuted = this.onToggleMute();
        this.elements.btnSound.textContent = isMuted ? '🔇' : '🔊';
      }
    });

    this.elements.btnMusicToggle.addEventListener('click', () => {
      if (this.onToggleMusic) {
        const playing = this.onToggleMusic();
        this.elements.btnMusicToggle.textContent = playing ? '🎶 PAUSE' : '🎶 PLAY';
      }
    });

    this.elements.btnMusicNext.addEventListener('click', () => {
      if (this.onNextMusic) {
        const track = this.onNextMusic();
        if (this.elements.musicSelect && track) {
          const opt = Array.from(this.elements.musicSelect.options).find(o => o.text.includes(track.title) || o.value == track.id);
          if (opt) this.elements.musicSelect.value = opt.value;
        }
        if (this.elements.musicTitle && track) {
          this.elements.musicTitle.textContent = track.title;
        }
      }
    });

    this.elements.btnCamera.addEventListener('click', () => {
      if (this.onToggleCamera) this.onToggleCamera();
    });

    this.elements.btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  showBollywoodCallout(text) {
    if (!this.elements.callout) return;
    this.elements.calloutText.textContent = text;
    this.elements.callout.style.display = 'flex';
    this.elements.callout.classList.remove('callout-pop');
    void this.elements.callout.offsetWidth; // trigger reflow
    this.elements.callout.classList.add('callout-pop');

    if (this.calloutTimer) clearTimeout(this.calloutTimer);
    this.calloutTimer = setTimeout(() => {
      this.elements.callout.style.display = 'none';
    }, 1500);
  }

  setupMinimap() {
    this.minimapCanvas = document.getElementById('hud-minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
  }

  updateMinimap(player, enemies, boss, collectibles) {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Dark Radar disc
    ctx.fillStyle = 'rgba(12, 16, 24, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fill();

    // Radar concentric grid rings
    ctx.strokeStyle = 'rgba(56, 219, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, (cx - 2) * 0.33, 0, Math.PI * 2);
    ctx.arc(cx, cy, (cx - 2) * 0.66, 0, Math.PI * 2);
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, 2);
    ctx.lineTo(cx, h - 2);
    ctx.moveTo(2, cy);
    ctx.lineTo(w - 2, cy);
    ctx.stroke();

    // Radar sweep line animation
    const sweepAngle = (performance.now() * 0.002) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * (cx - 2), cy + Math.sin(sweepAngle) * (cy - 2));
    ctx.stroke();

    const scale = (cx - 10) / 85;

    // 1. Collectibles (Green pings)
    if (collectibles && collectibles.items) {
      ctx.fillStyle = '#55ff77';
      for (let c of collectibles.items) {
        if (!c.alive) continue;
        const rx = cx + c.position.x * scale;
        const ry = cy + c.position.z * scale;
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
      }
    }

    // 2. Fodder Enemies (Red dots)
    if (enemies) {
      ctx.fillStyle = '#ff3344';
      for (let e of enemies) {
        if (!e.alive) continue;
        const rx = cx + e.position.x * scale;
        const ry = cy + e.position.z * scale;
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Boss Tank
    if (boss && boss.alive) {
      const bx = cx + boss.position.x * scale;
      const by = cy + boss.position.z * scale;
      ctx.fillStyle = '#ff0033';
      ctx.beginPath();
      ctx.arc(bx, by, 7.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Player Tank
    if (player && player.alive) {
      const px = cx + player.position.x * scale;
      const py = cy + player.position.z * scale;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-player.yaw - Math.PI / 2);

      ctx.fillStyle = '#38dbff';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4.5, 4.5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4.5, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  update(player, boss, waveInfo, fps, screenMouse, eqLevels = []) {
    this.elements.fpsPill.textContent = `${fps} FPS`;

    // Visualizer EQ bars
    if (this.elements.eqBars && eqLevels.length > 0) {
      this.elements.eqBars.forEach((bar, i) => {
        const height = Math.min(18, Math.max(3, (eqLevels[i] || 1) * 2));
        bar.style.height = `${height}px`;
      });
    }

    // Wave & score stats
    this.elements.waveBadge.textContent = `WAVE ${String(waveInfo.wave).padStart(2, '0')} / 05`;
    this.elements.contactsCount.textContent = `CONTACTS: ${waveInfo.activeEnemies}`;
    this.elements.scoreVal.textContent = String(waveInfo.score).padStart(6, '0');
    this.elements.killsVal.textContent = String(waveInfo.kills).padStart(2, '0');

    // Player health
    if (player) {
      const hpPct = Math.max(0, Math.round((player.health / player.maxHealth) * 100));
      this.elements.healthPct.textContent = `${hpPct}%`;
      this.elements.healthFill.style.width = `${hpPct}%`;

      // Shield
      if (player.shieldTimer > 0) {
        if (this.elements.shieldStatus) {
          this.elements.shieldStatus.style.display = 'inline-block';
          this.elements.shieldStatus.textContent = `🛡️ SHIELD: ${Math.ceil(player.shieldTimer)}s`;
        }
      } else if (this.elements.shieldStatus) {
        this.elements.shieldStatus.style.display = 'none';
      }

      // Boost
      const bPct = Math.max(0, Math.round((player.boost / player.maxBoost) * 100));
      this.elements.boostPct.textContent = `${bPct}%`;
      this.elements.boostFill.style.width = `${bPct}%`;

      // Reload
      if (player.fireTimer > 0) {
        const reloadPct = Math.min(100, Math.round(((player.fireCooldown - player.fireTimer) / player.fireCooldown) * 100));
        this.elements.reloadFill.style.width = `${reloadPct}%`;
        this.elements.reloadStatus.textContent = 'RELOADING';
        this.elements.reloadStatus.className = 'status-reloading';
      } else {
        this.elements.reloadFill.style.width = '100%';
        this.elements.reloadStatus.textContent = 'READY';
        this.elements.reloadStatus.className = 'status-ready';
      }
    }

    // Boss bar
    if (boss && boss.alive) {
      this.elements.bossBar.style.display = 'block';
      const bHp = Math.max(0, (boss.health / boss.maxHealth) * 100);
      this.elements.bossFill.style.width = `${bHp}%`;
    } else {
      this.elements.bossBar.style.display = 'none';
    }

    // Reticle cursor tracking
    if (screenMouse && this.elements.reticle) {
      const rx = ((screenMouse.x + 1) / 2) * window.innerWidth;
      const ry = ((-screenMouse.y + 1) / 2) * window.innerHeight;
      this.elements.reticle.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    }
  }

  showGameOver(score, kills, wave) {
    this.elements.goScore.textContent = String(score).padStart(6, '0');
    this.elements.goKills.textContent = String(kills);
    this.elements.goWaves.textContent = String(wave);
    this.elements.modalGameOver.style.display = 'flex';
  }

  showVictory(score, kills) {
    this.elements.vicScore.textContent = String(score).padStart(6, '0');
    this.elements.vicKills.textContent = String(kills);
    this.elements.modalVictory.style.display = 'flex';
  }
}
