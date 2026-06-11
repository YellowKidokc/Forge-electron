# FORGE — File-Oriented Research Graph Engine
## Template engine for complex interactive documents
## Built on Electron + React + TypeScript

FORGE is a desktop app for building and viewing complex, layered documents.
It wraps existing HTML articles in a React shell that provides layer toggles,
commentary panels, and reusable template components.

**FORGE is not a note app.** It's a template engine for documents that need
dropdowns, proof panels, equation translators, reading-level toggles, and
structured annotation — all composable and reusable.


## Markdown-First CLI

Phase 1 and Phase 2 include a local Markdown-first FORGE engine. It does not require Electron, Postgres, BlockNote, or AI APIs.

```bash
npm run forge -- parse samples/article.md
npm run forge -- parse samples/article.md --preserve-ids
npm run forge -- stamp samples/article.md --dry-run
npm run forge -- stamp samples/article.md
npm run forge -- validate samples/article.md
npm run forge -- export samples/article.md
npm run forge -- export-folder samples --dry-run
npm run forge -- export-folder samples
npm run forge -- import-folder path/to/notes --vault vault/notes --dry-run
npm run forge -- import-folder path/to/notes --vault vault/notes
npm run forge -- mirror path/to/notes --dry-run
npm run forge -- engines path/to/notes
npm run forge -- run-engine path/to/notes statistics --dry-run
npm test
npm run typecheck
```

See `docs/PHASE_2_MARKDOWN_HARDENING.md` for the hardened Markdown workflow, `docs/VAULT_IMPORT_AND_COLUMNS.md` for bulk import plus the two-column model, and `docs/DATA_MIRROR_AND_GLOBAL_ENGINE.md` for `_data/` mirrors and YAML engines.

## Architecture

```
Electron Shell
├── React Frame (topbar, sidebar, content area, footer)
├── Layer System (activates existing vanilla JS layers)
│   ├── Math Translation Layer (shared/js/mtl-equation.js)
│   ├── Claim Layer (shared/js/claim-layer.js)
│   ├── Glossary Layer (shared/js/glossary-layer.js)
│   └── TTS Audio (shared/js/mda-browser-tts.js)
├── Block Editor (BlockNote — Notion-style blocks)
├── File Tree Sidebar (vault navigation)
├── Template System (composable, reusable document components)
└── Postgres Connection (knowledge graph, Bible DB)
```

## The Vision

A document is not just text. A document is an addressable thinking surface.

- **Layer 1 (Markdown)** — Clean writing. Files over apps.
- **Layer 2 (Blocks)** — Structured components drop into the document. Dropdowns,
  tables, proof panels, tabs — one block per line, composable.
- **Layer 3 (AI)** — Select text, chat box appears, say what you want. AI executes
  against the structured layers. No plugins. No config.
- **Layer 4 (Graph)** — Claims, dependencies, contradictions, kill chains.
  Emerges from the work.

Design principle: **if a feature requires more than select → declare → done,
it is overcomplicated.**

## What's in this repo

### content/ — Sample articles from faiththruphysics.com
7 articles across 3 template families (MDA, Isomorphism, Proof Explorer).
These are the documents the React shell wraps around.

### shared/ — Existing layer implementations (ALREADY BUILT)
Vanilla JS/CSS/JSON layers that activate on top of articles:
- `js/claim-layer.js` — Claims/evidence layer
- `js/mtl-equation.js` — Math Translation Layer
- `js/glossary-layer.js` — Glossary hover/click
- `js/mda-browser-tts.js` — Text-to-speech
- `css/` — Styling for each layer
- `data/` — Equations, glossary terms, mappings

### docs/ — Architecture and reference
- `REFERENCE_REPOS.md` — Open-source Electron apps to study/steal from

## Tech Stack

- **Electron** — desktop shell (electron-vite for dev)
- **React + TypeScript** — UI framework
- **BlockNote** — Notion-style block editor (MPL-2.0)
- **TipTap/ProseMirror** — editor substrate (underneath BlockNote)
- **Tailwind CSS** — styling
- **PostgreSQL** — knowledge graph, Bible database (192.168.1.97:5432)

## Theme

```
--dark:        #050505
--card:        #0a0a0a
--accent:      #dc2626 (red)
--amber:       #f59e0b
--text:        #d1d5db
--text-bright: #f9fafb

Serif:    Crimson Text
Display:  Oswald
Sans:     Inter
Mono:     JetBrains Mono
```

## Build Order

1. Electron + Vite + React scaffold
2. Dark theme + frame (topbar, sidebar, footer)
3. Content area that loads article HTML
4. Layer toggle buttons wired to existing shared/js
5. File tree sidebar for vault navigation
6. BlockNote integration for block editing
7. Postgres connection for graph data
8. AI panel (Claude/OpenAI API)
9. Template system (composable reusable components)

---
POF 2828 · Theophysics Research Initiative · June 2026