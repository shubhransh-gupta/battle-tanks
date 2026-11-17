# 🚀 Battle Tanks: Dhamaka Edition 🇮🇳

[![Live Demo](https://img.shields.io/badge/Live%20Demo-battle--tanks--dhamaka.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://battle-tanks-dhamaka.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-shubhransh--gupta%2Fbattle--tanks-181717?style=for-the-badge&logo=github)](https://github.com/shubhransh-gupta/battle-tanks)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r187-black?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?logo=webgl&logoColor=white)](https://www.khronos.org/webgl/)
[![Deployment](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://battle-tanks-dhamaka.vercel.app)
[![FPS](https://img.shields.io/badge/Performance-Locked%2060%20FPS-brightgreen)](#-features)

> 🎮 **Play Live Now:** **[battle-tanks-dhamaka.vercel.app](https://battle-tanks-dhamaka.vercel.app)** *(Mirror: [better-tanks.vercel.app](https://better-tanks.vercel.app))*
>
> **High-Performance 3D Arcade Tank Combat Simulator built with Three.js, WebGL, Web Audio API, and Vite.**
> Inspired by classic 3D armor games and powered by an authentic high-voltage Bollywood action soundtrack & aesthetic.

---

## 🌟 Overview

**Battle Tanks** reimagines 3D browser tank combat into a buttery-smooth, zero-lag experience. Engineered from the ground up to eliminate frame drops and geometry bottlenecks, it delivers locked 60+ FPS on both desktop and mobile browsers, paired with authentic Bollywood action sound design, dynamic lighting, articulated caterpillar tracks, and tactical wave combat.

---

## ✨ Features

### 🎮 High-Precision Tank Combat
- **Articulated 3D Armor**: Fully modeled tank hulls with dual caterpillar track assemblies, cylindrical road wheels, independent rotating turrets, dynamic cannon recoil, and forward combat spotlights.
- **Spawn Energy Shield**: 8-second holographic cyan invulnerability shield on deployment (`🛡️ SHIELD: 8s`) with energetic particle shells.
- **Permanent Battle Wrecks**: Destroyed tanks never simply vanish — they remain on the battlefield as smoking, charred armored wrecks with persistent fire and smoke particle emitters.
- **Flanking AI & Laser Sight**: Enemy scout tanks flank the player, communicate tactical formations, and project bright crimson targeting laser beams to telegraph shots.
- **Colossal Titan MK-IV Boss Mech**: Final wave encounter featuring a massive obsidian siege mech, rotating command superstructure, glowing crimson spotlight eye, enrage state, and triple-spread mortar barrage.

### 📻 Bollywood Action Jukebox
- **Authentic Soundtrack**: Built-in Web Audio Jukebox streaming iconic high-energy tracks:
  1. 📻 **Dhoom Machale (Title Anthem)** — Iconic action bhangra beat
  2. 📻 **Don — The Theme (SRK Action)** — Cyber brass chase groove
  3. 📻 **Dhoom Action (Chase Beats)** — High-octane battle percussion
  4. 📻 **Salaame Salaame (War Celebration)** — Victory anthem
- **Dancing Equalizer Visualizer**: Real-time multi-band audio frequency analyzer driving animated dancing equalizer bars directly in the tactical HUD.
- **Interactive Controls**: Dropdown track selector, `⏭ NEXT` track button (`[N]`), `🎶 PLAY/PAUSE` toggle (`[P]`), and mute options.
- **Iconic Dialogue Announcer**: Famous action cinema callouts on streaks, kills, and boss alerts (*"Aata Majhi Satakli!"*, *"Dhamaka!"*, *"Dishyum!"*, *"Mogambo Khush Hua!"*, *"Haar kar jeetne waale ko Baazigar kehte hain!"*).

### ⚡ Performance & Optimization
- **Locked 60 FPS**: Geometry instancing, memory-conscious particle pooling, optimized shadow camera frustums, and Draco mesh compression.
- **Dynamic Camera**: Toggle seamlessly between elevated tactical isometric view and close behind-the-hull action chase camera (`[C]`).
- **Interactive Battlefield**: Explosive fuel barrels, destructible concrete fences, heavy metal crates, and tactical field drops (Hull Repair kits, Dhoom Boost canisters, Gear tech points).
- **Mobile Twin Joysticks**: Full mobile touch support with on-screen virtual joysticks for simultaneous steering and independent turret raycast aiming.

---

## 🕹️ Controls

| Control | Action |
|:---|:---|
| <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> / Arrow Keys | Drive & Steer Tank Chassis |
| <kbd>Mouse Move</kbd> | Aim Turret & Cannon (3D Ground Raycast) |
| <kbd>Left Click</kbd> / <kbd>Space</kbd> | Fire Main Cannon |
| <kbd>Shift</kbd> | Dhoom Boost (High-Speed Turbo Drift) |
| <kbd>R</kbd> | Quick Repair / Redeploy Tank |
| <kbd>N</kbd> | Next Bollywood Soundtrack |
| <kbd>P</kbd> | Play / Pause Music |
| <kbd>M</kbd> | Toggle SFX Sound |
| <kbd>C</kbd> | Toggle Camera Mode (Isometric / Action Chase) |
| <kbd>F</kbd> | Toggle Fullscreen Mode |

*On touch devices, dual on-screen virtual joysticks appear automatically for twin-stick arcade steering and aiming.*

---

## 🛠️ Tech Stack & Architecture

- **Renderer**: [Three.js](https://threejs.org/) (r187) with WebGLRenderer, ACES Filmic Tone Mapping, and PCF Soft Shadow Maps.
- **Asset Pipeline**: GLTF / GLB with Draco geometry compression, Basis / KTX2 texture transcoding, and PNG fallback atlases.
- **Audio Engine**: Web Audio API with `AudioContext`, `MediaElementAudioSourceNode`, real-time `AnalyserNode`, and procedural oscillator synthesis fallback.
- **Build Tool**: [Vite](https://vitejs.dev/) 8.3 with ES modules and optimized production bundling.
- **Deployment**: [Vercel](https://vercel.com) Edge CDN.

### Project Structure
```text
better-tanks/
├── public/
│   ├── assets/
│   │   ├── audio/        # Combat SFX (cannon, boost, explosions, engine)
│   │   ├── models/       # 3D GLTF models (player, fodder, boss, arena props)
│   │   ├── music/        # Authentic Bollywood soundtracks (MP3)
│   │   └── textures/     # Texture atlas & ground lightmaps
│   ├── basis/            # Basis Universal transcoder WASM
│   └── draco/            # Google Draco decoder WASM
├── src/
│   ├── audio/
│   │   └── BollywoodMusic.js   # Music streaming, EQ analyzer, dialogue engine
│   ├── core/
│   │   ├── Engine.js           # Three.js renderer, lighting, follow camera
│   │   └── Input.js            # WASD keyboard, mouse raycast, touch joysticks
│   ├── entities/
│   │   ├── PlayerTank.js       # Player chassis, dual tracks, shield, recoil
│   │   ├── FodderTank.js       # Flanking AI scout tanks with laser sights
│   │   ├── BossTank.js         # Titan MK-IV siege boss mech
│   │   ├── Bullet.js           # Bullet physics, trail particles, collision
│   │   ├── Prop.js             # Explosive barrels, concrete fences
│   │   └── Collectible.js      # Tools repair, fuel boost, gear collectibles
│   ├── managers/
│   │   ├── AssetManager.js     # Draco/KTX2 loader, collider filtering
│   │   └── SoundManager.js     # Spatial 3D sound effects attenuator
│   ├── ui/
│   │   └── HUD.js              # Cyber-military tactical HUD, minimap, jukebox
│   ├── world/
│   │   ├── Arena.js            # Ground terrain, military grid, boundary rings
│   │   └── Particles.js        # GPU smoke, sparks, fire & explosion VFX
│   ├── main.js                 # Wave combat loop & game director
│   └── style.css               # HUD styling, responsive glassmorphism UI
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/shubhransh-gupta/battle-tanks.git
   cd battle-tanks
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Production Build
To create an optimized production build:
```bash
npm run build
npm run preview
```

---

## 🚢 Direct Deployment to Vercel

Deploying **Better Tanks** to Vercel takes seconds with the [Vercel CLI](https://vercel.com/cli):

```bash
# Login to your Vercel account
vercel login

# Deploy directly to production
vercel --prod --yes
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/shubhransh-gupta/better-tanks/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Crafted with ❤️ and 💥 <b>DHAMAKA</b> by <a href="https://github.com/shubhransh-gupta">Shubhransh Gupta</a>
</p>
