# FORGE — File-Oriented Research Graph Engine
## The React shell that wraps faiththruphysics.com articles

FORGE is a React wrapper that provides a unified reading experience for
Theophysics articles. It wraps existing HTML articles in a common frame
with layer toggles, commentary panels, and navigation.

## Architecture

```
React Shell (the frame)
├── Topbar — site navigation, series info
├── Sidebar — article TOC, layer toggles
├── Content Area — loads existing HTML articles as-is
├── Layer Toggles — activate/deactivate depth layers
│   ├── Math Translation Layer (shared/js/mtl-equation.js)
│   ├── Claim Layer (shared/js/claim-layer.js)
│   ├── Glossary Layer (shared/js/glossary-layer.js)
│   └── TTS Audio (shared/js/mda-browser-tts.js)
└── Footer — series navigation, prev/next
```

**The articles don't get rewritten.** They plug into the shell as content.
The shared JS/CSS layers already exist and activate/deactivate based on
which layer the user selects.

## What's in this repo

### content/ — Sample articles (6 best representatives)
- `moral-decline/MDA-043-amish-proof-THE-PROOF.html` — Most feature-complete (MTL, Glossary, Audio, MathJax, Tabs)
- `moral-decline/MDA-030-trinity-mechanism.html` — Framework showcase with equations
- `moral-decline/MDA-040-statistical-synthesis.html` — Heavy data/tables article
- `moral-decline/MDA-005-empirical-evidence.html` — Evidence presentation
- `moral-decline/mda-part-01-measuring-moral-health.html` — Clean baseline (simplest article)
- `proof-explorer/mda-proof-packet.html` — Proof layer viewer (different architecture)
- `isomorphism/iso-003_entropy_sin.html` — Isomorphism template (different style family)
- `homepage-index.html` — The main site homepage

### shared/ — Existing layer implementations (ALREADY BUILT)
- `js/claim-layer.js` — Claims/evidence layer (built, not yet wired into articles)
- `js/mtl-equation.js` — Math Translation Layer (active in articles)
- `js/glossary-layer.js` — Glossary hover/click layer (active)
- `js/glossary-linker.js` — Auto-links glossary terms
- `js/mda-browser-tts.js` — Text-to-speech
- `css/claim-layer.css` — Claims styling
- `css/mtl-equation.css` — Math translation styling
- `css/glossary-layer.css` — Glossary styling
- `css/theophysics.css` — Base theme
- `data/mtl-equations.json` — Equation definitions
- `data/glossary.json` — Glossary terms
- `data/glossary_data_full.json` — Full glossary data
- `data/eq-id-mapping.json` — Equation ID mapping

### docs/ — Architecture and build docs

## Design

### Theme (from existing articles)
- Background: `#050505` (near black)
- Card: `#0a0a0a`
- Accent: `#dc2626` (red)
- Secondary: `#f59e0b` (amber)
- Serif: Crimson Text
- Display: Oswald
- Sans: Inter
- Mono: JetBrains Mono

### Article component markers
Every article uses `<!-- BEGIN:COMPONENT:type:name -->` / `<!-- END:COMPONENT:type:name -->` markers.
Types: topbar, sidebar, hero, content, section, executive-summary, cta
The React shell reads these markers to know where sections are.

### Two interaction patterns
1. **Section-level toggles** — Easy/Academic/Math/Claims buttons per section, switching reading depth
2. **Inline expansion** — specific sentences expand to show claims, evidence, kill conditions underneath

## For Kimi (React Template Build)

Build a React app (Vite + React + TypeScript) that:
1. Renders the frame (topbar, sidebar, content area, footer)
2. Loads any article HTML into the content area
3. Adds layer toggle buttons that activate the existing shared/js layers
4. Matches the dark industrial theme from the articles
5. Handles multiple template styles (MDA, Isomorphism, Proof Explorer)

The shared JS layers are vanilla JavaScript. The React shell calls them
to activate/deactivate. The articles are static HTML. React doesn't
rewrite them — it wraps them.

---
POF 2828 · Theophysics Research Initiative · June 2026