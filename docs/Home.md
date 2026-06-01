# 🏴☠️ Broadside Wiki
*Open-source pirate trading and naval combat game for the Caribbean (1700s)*

---

## 📚 **Documentation Hierarchy**

### 🎮 **Level 1: Core Guides**
   Guide | Description | Audience |
 |-------|-------------|----------|
 | [Player Guide](player_guide.md) | How to play, mechanics, tips, and strategies. | Players |
 | [Developer Guide](developer_guide.md) | Architecture, setup, and contribution rules. | Developers |
 | [Roadmap](roadmap.md) | Planned features, priorities, and release timeline. | Everyone |

---

### 🛠️ **Level 2: Technical Specifications** *(Under Developer Guide)*
#### **Architecture & Design**
- [Architecture](architecture.md) — High-level system design, data flow, and module roles.

#### **Module Specifications**
- [Engine Module (specs_engine.md)](specs_engine.md) — State management, reducer cases, and the **4-way file split** (`engine_core`, `engine_port`, `engine_voyage`, `engine_combat`).
- [Logic Module (specs_logic.md)](specs_logic.md) — Pure functions for calculations (travel, reputation, combat, etc.).
- [Generators Module (specs_generators.md)](specs_generators.md) — Runtime content generation (missions, enemies, markets).
- [React/JSX Module (specs_jsx.md)](specs_jsx.md) — UI components, screens, and rendering logic.

---
## 🚀 **Quick Start**

### For Players
Start with the **[Player Guide](player_guide.md)** to learn:
- Game mechanics (sailing, trading, combat)
- Port services and missions
- Crew management and ship upgrades

### For Developers
1. Read the **[Developer Guide](developer_guide.md)** for setup and contribution rules.
2. Explore the **[Architecture](architecture.md)** to understand the codebase structure.
3. Dive into the **[Module Specs](specs_engine.md)** for implementation details.

### For Contributors
- Check the **[Roadmap](roadmap.md)** for open tasks and priorities.
- Review the **[Architecture](architecture.md)** before proposing changes.

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