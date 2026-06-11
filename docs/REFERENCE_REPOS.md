# FORGE — Reference Repos
## Open-source Electron apps to strip parts from

These are NOT forks. These are reference code — steal patterns, components,
and architecture ideas. The goal is to build FORGE faster by learning from
what already works.

---

## 1. SiYuan — Block-level knowledge management
**Repo:** https://github.com/siyuan-note/siyuan
**Stack:** Electron + React + TypeScript + Go backend
**License:** AGPLv3 (study/reference only, don't ship their code)
**Stars:** 20K+
**What to steal:**
- Block-level content addressing (every block has an ID)
- File tree sidebar component
- Dark theme implementation
- Local-first sync architecture
- WYSIWYG Markdown editing with math formula support

## 2. BlockNote — Notion-style block editor
**Repo:** https://github.com/TypeCellOS/BlockNote
**Stack:** React + ProseMirror + TipTap
**License:** MPL-2.0 (core), GPL-3.0 (XL features)
**Stars:** 8K+
**What to steal:**
- Block-based editing (drag, drop, nest)
- Slash menu and formatting toolbar
- The block type system (paragraph, heading, image, code, table)
- React component architecture for editor
- This is the Notion layer — Layer 2 of FORGE

## 3. AFFiNE — Full knowledge OS
**Repo:** https://github.com/toeverything/AFFiNE
**Stack:** Electron + React + BlockSuite + Rust (OctoBase)
**License:** MIT (editor/desktop), EE (backend)
**Stars:** 44K+
**What to steal:**
- How they handle docs + canvas + database in one app
- BlockSuite editor architecture
- Dark/light theme switching
- The "edgeless canvas" concept (infinite whiteboard)
- Caution: massive codebase, don't try to fork — study only

## 4. Mark Text — Clean Markdown editor
**Repo:** https://github.com/marktext/marktext
**Stack:** Electron + Vue
**License:** MIT
**Stars:** 48K+
**What to steal:**
- File tree sidebar (simplest, cleanest implementation)
- Markdown rendering pipeline
- Keyboard shortcuts and command palette
- Minimal, fast Electron shell setup

## 5. Zettlr — Academic Markdown editor
**Repo:** https://github.com/Zettlr/Zettlr
**Stack:** Electron + TypeScript
**License:** GPL-3.0 (study/reference only)
**Stars:** 10K+
**What to steal:**
- Academic citation integration
- Vault/workspace management
- Table editor (new in v4.0)
- PDF and image viewer

## 6. Trilium — Hierarchical note-taking
**Repo:** https://github.com/zadam/trilium
**Stack:** Electron + CKEditor
**License:** AGPL-3.0 (study/reference only)
**Stars:** 28K+
**What to steal:**
- Tree navigation pattern (hierarchical, collapsible)
- Note cloning and branching
- Scripting/automation system
- Relation maps between notes

---

## Priority Order for FORGE Build

1. **electron-vite scaffold** — `npm create electron-vite` for base Electron + React + TypeScript
2. **BlockNote** — drop in for the block editor (Layer 2)
3. **Mark Text patterns** — file tree sidebar, markdown rendering
4. **SiYuan patterns** — block addressing, dark theme
5. **Custom** — layer toggles, commentary panels, article HTML loading (FORGE-unique)

## License Rules
- MIT / Apache-2.0 → take code directly
- MPL-2.0 → take but publish changes to those files
- GPL-3.0 → study patterns only, rewrite from scratch
- AGPL-3.0 → study only, never ship their code