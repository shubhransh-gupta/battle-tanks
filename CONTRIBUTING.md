# Contributing to Battle Tanks 🚀💥

Thank you for your interest in contributing to **Battle Tanks**! We welcome all contributions from game developers, 3D artists, sound designers, web engineers, and open-source enthusiasts.

---

## 🌟 How Can You Contribute?

Here are some great ways to get involved:
- 🐛 **Report Bugs**: Submit bug reports with browser specs and reproduction steps.
- 💡 **Suggest Features**: Propose new tank types, arena hazards, audio tracks, or multiplayer concepts on the [Issues page](https://github.com/shubhransh-gupta/battle-tanks/issues).
- 🎨 **Art & Audio**: Contribute optimized 3D models (`.glb`), texture maps, or action SFX.
- 💻 **Code Contributions**: Pick up any open issue labeled [`good first issue`](https://github.com/shubhransh-gupta/battle-tanks/labels/good%20first%20issue) or [`help wanted`](https://github.com/shubhransh-gupta/battle-tanks/labels/help%20wanted).

---

## 🛠️ Development Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/<your-username>/battle-tanks.git
   cd battle-tanks
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to test live.

4. **Verify Production Build**:
   ```bash
   npm run build
   npm run preview
   ```

---

## 📐 Code Guidelines

- **Performance First**: Maintain locked 60 FPS. Minimize runtime garbage collection by reusing `THREE.Vector3` / `THREE.Quaternion` temporary instances.
- **Shadows & Materials**: Share materials when possible to minimize draw calls and shader recompilations.
- **Audio Routing**: Route all music and sound through `Web Audio API` nodes connected to `SoundManager.js` and `BollywoodMusic.js` so equalizer and volume controls remain synchronized.
- **Clean Commits**: Use descriptive commit messages (e.g. `feat: add sniper tank class`, `fix: barrel recoil offset`).

---

## 🚀 Submitting a Pull Request

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear messages.
3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request against the `main` branch of [shubhransh-gupta/battle-tanks](https://github.com/shubhransh-gupta/battle-tanks).

We review pull requests promptly. Happy hacking! 💥
