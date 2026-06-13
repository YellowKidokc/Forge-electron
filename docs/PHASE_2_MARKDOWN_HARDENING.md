# Phase 2 — Markdown Hardening

Phase 2 keeps FORGE boring, local, and Markdown-first. The engine still treats the `.md` file as the source of truth, while sidecar JSON files and HTML exports make the document addressable.

## What Phase 2 Adds

- Existing `<!-- forge:id=... -->` and `<!-- forge:block=... -->` comments are preserved during parsing.
- Duplicate block IDs are reported and auto-repaired in parser output with `-002`, `-003`, and later suffixes.
- `stamp` can add missing FORGE comments to a Markdown file after creating a `.bak` backup.
- `validate` checks parsed Markdown, `.forge.json`, `.layers.json`, and `.claims.json` references.
- HTML export now includes a table of contents, visible anchors, copy-link buttons, and document metadata.
- `export-folder` recursively exports Markdown folders while skipping hidden folders, `.git`, `node_modules`, and `exports`.
- `import-folder` intakes large Markdown/text folders into a local vault manifest.
- HTML exports expose left/right sliding columns for organization and layer metadata.
- `_data/` mirrors keep generated outputs separate from clean Markdown.
- `_engines/` YAML configs define small global engine runners.
- Tests cover core parser, ID, validation, and missing-sidecar behavior.

## Parse a Markdown File

```bash
npm run forge -- parse samples/article.md
```

This writes:

```text
samples/article.forge.json
```

Existing FORGE IDs are preserved by default. The explicit option is also accepted:

```bash
npm run forge -- parse samples/article.md --preserve-ids
```

## Stamp IDs Into Markdown

```bash
npm run forge -- stamp samples/article.md
```

Stamping adds missing comments only:

- headings receive `<!-- forge:id=... -->` on the heading line
- paragraphs, blockquotes, lists, code blocks, and math blocks receive `<!-- forge:block=... -->` after the block

Before modifying the Markdown file, FORGE creates:

```text
samples/article.md.bak
```

### Stamp Dry Run

```bash
npm run forge -- stamp samples/article.md --dry-run
```

Dry-run prints the comments that would be added and does not write anything.

## Validate Sidecars

```bash
npm run forge -- validate samples/article.md
```

Validation checks that:

- Markdown can be parsed
- `.forge.json` exists
- `.forge.json` block IDs match parsed Markdown IDs
- `.layers.json` references valid block IDs
- `.claims.json` references valid block IDs
- duplicate IDs are reported
- missing `.layers.json` and `.claims.json` files are warnings, not failures

## Export One File

```bash
npm run forge -- export samples/article.md
```

This writes:

```text
exports/article.html
```

The export includes the original rendered Markdown, `data-forge-block` attributes, layer tabs, claims, table of contents, block anchors, copy-link buttons, and a metadata panel.

## Batch Export a Folder

```bash
npm run forge -- export-folder samples
```

FORGE recursively finds `.md` files and writes exports to:

```text
exports/<relative-path>/<filename>.html
```

Dry-run mode shows the planned exports without writing files:

```bash
npm run forge -- export-folder samples --dry-run
```

## Import Many Notes

```bash
npm run forge -- import-folder path/to/notes --vault vault/notes --dry-run
npm run forge -- import-folder path/to/notes --vault vault/notes
```

The importer accepts `.md`, `.markdown`, and `.txt` files, preserves relative paths, skips hidden/noisy folders, and writes `vault/notes/manifest.json`.

## Sliding Export Columns

HTML exports include a left files/organization column and a right layers/metadata column. Use `Toggle files` and `Toggle layers` in the export to slide either side in or out.

## Data Mirror and Global Engines

```bash
npm run forge -- mirror path/to/vault --dry-run
npm run forge -- engines path/to/vault
npm run forge -- run-engine path/to/vault statistics --dry-run
```

The mirror writes generated outputs under `_data/`; engines live under `_engines/`. See `docs/DATA_MIRROR_AND_GLOBAL_ENGINE.md`.

## Safety Rules

1. Markdown remains the source of truth.
2. Stamping never rewrites prose intentionally; it only appends FORGE comments.
3. Stamping creates a `.bak` backup before modifying a file.
4. Dry-run is available for stamping and folder export.
5. Missing optional sidecars are warnings, not crashes.
6. Existing FORGE IDs are preserved unless a collision requires a repaired suffix.
7. No Electron, Postgres, AI API, or BlockNote dependency is required for this phase.

## Known Limitations

- The Markdown parser is intentionally small and does not implement the entire CommonMark specification.
- Inline Markdown rendering is minimal and only supports basic emphasis, strong text, and inline code.
- Nested lists are treated as a single list block but are not deeply structured.
- Link-copying uses the browser clipboard API when available.
- Duplicate explicit IDs are repaired in parsed/exported output; use `stamp --dry-run` and `validate` before stamping large documents.
