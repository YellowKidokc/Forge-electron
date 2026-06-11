# FORGE Design Philosophy
## POF 2828 | June 2026

## Core Thesis
A document is not just text. A document is an addressable thinking surface.
Every word has a coordinate. Every claim has a kill condition. Every connection
has a UUID. The surface looks like writing. Underneath, it's a database.

## The Four Layers
1. **Markdown** — Plain writing. Files over apps. You think by writing.
2. **Blocks** — The page "folds open" to reveal structured components. One block
   per line. Dropdowns, tables, proof panels, tabs — composable, reusable.
3. **AI** — Select text, chat box appears inline, say what you want. AI executes
   against the structured layers below. No plugins. No marketplace.
4. **Graph** — Claims, dependencies, contradictions, kill chains, truth pressure.
   Emerges from the work through Postgres + pgvector + Apache AGE.

## The Governing Principle
If a feature requires more than **select → declare → done**, it is overcomplicated.

Select any grain of text. A chat box appears. Declare what it is in plain language.
The system caches it, enforces it going forward. One interaction pattern. Infinite
applications.

## What FORGE Is
- A template engine for complex interactive documents
- The software version of a system David already operates manually
- A place where serious work stops being broken into incompatible apps
- A tool where every word is addressable and every annotation is structured

## What FORGE Is Not
- Not a note-taking app
- Not an Obsidian clone
- Not a Notion replacement
- Not an AI chat wrapper
- Not trying to do everything

## The Line
FORGE is not trying to do everything. It is trying to stop serious work from
being broken into incompatible apps.

## The Killer Feature
The AI layer constrained by structure. Every other AI tool generates into the
void. FORGE's AI writes against real coordinates in a real graph. That's the
difference between a toy and a tool.

## The Proof of Need
John 1:29 — 15 words, 122 connections, 4 PaRDeS layers, commentary, notes,
evidence paths, structural isomorphisms, a reasoning graph. No existing app
holds all of that in one place. FORGE does.

## Three AI Partners (Background, Unconstrained)
- **Connector** — finds bridges across sources
- **Challenger** — catches contradictions between canonicals
- **Archivist** — finds gaps before you publish

After ingestion, these AIs are fully unconstrained. They build whatever internal
models the data demands and surface nothing until the user asks.

## Template System (The Real Product)
The ability to compose reusable interactive components into document templates:
- Drop a dropdown into the middle of a paragraph
- Add proof panels that expand to show kill conditions
- Insert equation translators that break down math term by term
- Create reading-level toggles (Easy / Standard / Academic / Proof)
- Build commentary panels with typed, expandable fields

Save the layout as a template. The next 60 articles use the same structure
without hand-coding each one.

## Aesthetic
Industrial forge. Dark workshop, not SaaS dashboard.
- Dark base: #050505
- Ember accents: #dc2626 (red), #f59e0b (amber)
- Typography: Crimson Text (prose), Oswald (display), Inter (UI), JetBrains Mono (code)
- Minimal animations. Functional transitions only. This is a work tool.

---
POF 2828 · Theophysics Research Initiative