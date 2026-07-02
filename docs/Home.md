# 🏴☠️ Broadside Wiki
*Open-source pirate trading and naval combat game for the Caribbean (1700s)*

---

## 📚 **Documentation Hierarchy**

### 🎮 **Level 1: Core Guides**
   Guide | Description | Audience |
 |-------|-------------|----------|
 | [Player Guide](player_guide) | How to play, mechanics, tips, and strategies. | Players |
 | [Roadmap](roadmap) | Planned features, priorities, and release timeline. | Everyone |
 | [Captain's Handbook](handbook.html) | Quick reference for game mechanics. | Players |





---

### 🛠️ **Level 2: Technical Specifications** 
#### **Architecture & Design**
- [Architecture](architecture) — Game design, high-level system design, data flow, and module roles.

#### **Module Specifications**
- [Engine Module (specs_engine.md)](specs_engine) — State management, reducer cases, and the **4-way file split** (`engine_core`, `engine_port`, `engine_voyage`, `engine_combat`).
- [Logic Module (specs_logic.md)](specs_logic) — Pure functions for calculations (travel, reputation, combat, etc.).
- [Generators Module (specs_generators.md)](specs_generators) — Runtime content generation (missions, enemies, markets).
- [Data Module (specs_data.md)](specs_data) - All game data, used by the Generator mainly (text), but also directly by Logic or Engine.
- [Storage Module (specs_storage.md)](specs_storage) - Save/load encoding, tutorial state management, localStorage I/O.
- [React/JSX Module (specs_jsx.md)](specs_jsx) — UI components, screens, and rendering logic.

---
## 🚀 **Quick Start**

### For Players
Start with the **[Player Guide](player_guide)** to learn:
- Game mechanics (sailing, trading, combat)
- Port services and missions
- Crew management and ship upgrades


### For Contributors
- Check the **[Roadmap](roadmap)** for open tasks and priorities.
- Review the **[Architecture](architecture)** before proposing changes.


---
## 🔗 **External Links**
- [GitHub Repository](https://github.com/papaladin/broadside)
- [Issue Tracker](https://github.com/papaladin/broadside/issues)