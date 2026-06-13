# Data Mirror and Global Engine

This continues the Markdown-first FORGE path toward the master vision without adding Electron, Tauri, Postgres, AI APIs, or BlockNote to this repo.

## Data Mirror

A content folder can now have a generated `_data/` mirror:

```bash
npm run forge -- mirror path/to/vault --dry-run
npm run forge -- mirror path/to/vault
```

The mirror command scans `.md`, `.markdown`, and `.txt` files while skipping noisy folders such as `.git`, `node_modules`, `exports`, `_data`, `_engines`, and hidden folders.

For each content file, FORGE creates a per-document output directory under `_data/`:

```text
vault/
  notes/essay.md
  _data/
    notes/essay/
      generated outputs go here
    manifest.json
```

The source Markdown stays clean. Generated outputs go to the mirror.

## Global Engine

A vault can also have an `_engines/` folder of YAML configs:

```bash
npm run forge -- engines path/to/vault
```

If missing, FORGE creates defaults for:

- `export_html`
- `statistics`

Each engine is intentionally small YAML:

```yaml
id: statistics
engine: statistics
enabled: true
trigger: manual
output_to: mirror_folder
```

## Run an Engine

Use dry-run before writing generated files:

```bash
npm run forge -- run-engine path/to/vault statistics --dry-run
npm run forge -- run-engine path/to/vault statistics
npm run forge -- run-engine path/to/vault export_html --dry-run
npm run forge -- run-engine path/to/vault export_html
```

Current built-in engines:

- `statistics` writes word/character counts into each document's mirror folder.
- `export_html` writes enriched HTML exports into each Markdown document's mirror folder.

## Why This Matches the Master Vision

The clean content folder remains the user's readable Markdown workspace. The mirror folder becomes the organized generated layer for reports, exports, statistics, scripts, audio, and future graph outputs. The YAML engine folder is the seed of the global engine system: capability equals config plus runner, and generated data never pollutes source prose.
