# KIMI BUILD PROMPT — FORGE React Shell
## POF 2828 | June 10, 2026

## THE JOB

Build a React app (Vite + React + TypeScript) that acts as a wrapper/frame
around existing HTML articles from faiththruphysics.com.

The articles are static HTML. They don't get rewritten. The React shell
loads them into a content area and provides:

1. A unified frame (topbar, sidebar navigation, footer)
2. Layer toggle buttons that activate depth layers
3. Subdomain/series navigation
4. The existing dark industrial theme

## WHAT ALREADY EXISTS

### Shared JavaScript layers (shared/js/)
These are vanilla JS files that ALREADY WORK. The React shell just needs
to call them to activate/deactivate:

- `claim-layer.js` — highlights claims, shows evidence underneath
- `mtl-equation.js` — math translation: equations with plain-English breakdowns
- `glossary-layer.js` — glossary hover/click with term definitions
- `glossary-linker.js` — auto-links glossary terms in body text
- `mda-browser-tts.js` — text-to-speech for articles

### Shared CSS (shared/css/)
- `claim-layer.css`, `mtl-equation.css`, `glossary-layer.css`, `theophysics.css`

### Shared Data (shared/data/)
- `mtl-equations.json` — equation definitions for math translation
- `glossary.json`, `glossary_data_full.json` — term definitions
- `eq-id-mapping.json` — maps equation IDs across articles

### Sample Articles (content/)
6 articles showing different template styles and feature levels.
See README.md for the full list.

## THE FRAME

Extract from the existing articles. Every article already has:

```
topbar     — sticky nav bar (back link, series name, next article)
sidebar    — series info, part counter, navigation
hero       — title, subtitle, part number, gradient accent
content    — the article body (sections marked with BEGIN:COMPONENT)
bottom-nav — prev/next article, series landing link
```

The React shell becomes the ONE place this frame lives. Articles plug
into the content area. The frame handles:

- Series navigation (MDA = 61 articles, GTQ = 26, Isomorphisms = 38)
- Layer toggles (row of buttons: Math | Claims | Glossary | TTS)
- Subdomain routing (/moral-decline/, /isomorphism/, /proof-explorer/, etc.)
- Responsive layout (mobile-first, the articles are already responsive)

## THEME TOKENS

```
--dark:        #050505
--card:        #0a0a0a
--accent:      #dc2626 (red)
--accent-dim:  #991b1b
--amber:       #f59e0b
--amber-dim:   #b45309
--text:        #d1d5db
--text-bright: #f9fafb

Font serif:    'Crimson Text', Georgia, serif
Font display:  'Oswald', Impact, sans-serif
Font sans:     'Inter', system-ui, sans-serif
Font mono:     'JetBrains Mono', monospace
```

## LAYER TOGGLE UI

A row of small buttons attached to each article section:

```
[ Math ] [ Claims ] [ Glossary ] [ TTS ] [ Audio ]
```

Each button activates/deactivates the corresponding shared JS layer.
The layers work by modifying the DOM of the loaded article HTML —
adding overlays, highlights, expandable panels.

When a layer is active, its button is lit (accent color).
When inactive, it's dim (gray).

Multiple layers can be active simultaneously.

## ARTICLE LOADING

Option A (simplest): iframe that loads the article HTML file.
React controls the frame around it, passes messages to the iframe
to activate/deactivate layers via postMessage.

Option B (tighter integration): fetch the article HTML, inject it
into a React container via dangerouslySetInnerHTML, then run the
shared JS layer scripts against the injected DOM.

Start with Option A. It's less work and the articles work standalone.

## ELECTRON (LATER)

The React app runs in the browser first (deploy to Cloudflare Pages
or faiththruphysics.com). Electron wraps it later as a desktop app.
Don't build Electron-specific features yet — just make the React
web app work.

## FILE STRUCTURE

```
Forge-electron/
├── content/           — sample articles (static HTML)
├── shared/            — existing JS/CSS/data layers
├── src/               — React app source
│   ├── components/
│   │   ├── Frame.tsx      — the wrapper (topbar + sidebar + footer)
│   │   ├── ContentArea.tsx — loads article HTML
│   │   ├── LayerToggles.tsx — layer activation buttons
│   │   └── SeriesNav.tsx   — series navigation
│   ├── App.tsx
│   └── main.tsx
├── docs/
├── README.md
├── KIMI_BUILD_PROMPT.md
└── package.json
```

## RULES

1. Articles are static HTML — never rewrite them
2. Shared JS layers already work — activate them, don't rebuild them
3. Match the existing dark theme exactly — this isn't a new design
4. Mobile-first — articles are already responsive, frame must be too
5. Multiple layers can be active simultaneously
6. Start with web (Vite), Electron comes later