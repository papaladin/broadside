# 🏴☠️ Broadside Wiki
*Open-source pirate trading and naval combat game for the Caribbean (1700s)*

---

## 📚 **Documentation Hierarchy**

### 🎮 **Level 1: Core Guides**
   Guide | Description | Audience |
 |-------|-------------|----------|
 | [Player Guide](player_guide) | How to play, mechanics, tips, and strategies. | Players |
 | [Roadmap](roadmap) | Planned features, priorities, and release timeline. | Everyone |

---

### 🛠️ **Level 2: Technical Specifications** 
#### **Architecture & Design**
- [Architecture](architecture) — High-level system design, data flow, and module roles.

#### **Module Specifications**
- [Engine Module (specs_engine.md)](specs_engine) — State management, reducer cases, and the **4-way file split** (`engine_core`, `engine_port`, `engine_voyage`, `engine_combat`).
- [Logic Module (specs_logic.md)](specs_logic) — Pure functions for calculations (travel, reputation, combat, etc.).
- [Generators Module (specs_generators.md)](specs_generators) — Runtime content generation (missions, enemies, markets).
- [React/JSX Module (specs_jsx.md)](specs_jsx) — UI components, screens, and rendering logic.

---
## 🚀 **Quick Start**

### For Players
Start with the **[Player Guide](player_guide)** to learn:
- Game mechanics (sailing, trading, combat)
- Port services and missions
- Crew management and ship upgrades

### For Developers
1. Read the **[Developer Guide](developer_guide)** for setup and contribution rules.
2. Explore the **[Architecture](architecture)** to understand the codebase structure.
3. Dive into the **[Module Specs](specs_engine)** for implementation details.

### For Contributors
- Check the **[Roadmap](roadmap)** for open tasks and priorities.
- Review the **[Architecture](architecture)** before proposing changes.

---
## 📖 **About This Wiki**
This wiki is **auto-synced** from the [`docs/`](https://github.com/papaladin/broadside/tree/main/docs) folder in the repository.

- **Edit a page?** Submit a PR to the `docs/` folder.
- **Found a bug?** Open an issue with the `[docs]` label.
- **Questions?** Ask in [Discussions](https://github.com/papaladin/broadside/discussions).

---
## 🔗 **External Links**
- [GitHub Repository](https://github.com/papaladin/broadside)
- [Issue Tracker](https://github.com/papaladin/broadside/issues)