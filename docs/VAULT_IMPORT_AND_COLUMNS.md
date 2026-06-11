# Vault Import and Sliding Columns

FORGE now keeps the Markdown engine boring while preparing the Obsidian-style workspace shape:

```text
left sliding column   center document surface   right sliding column
files / organization  Markdown export/content   layers / metadata / claims
```

This is still plain local tooling. There is no Electron shell, no Postgres, no AI API, and no BlockNote dependency in this step.

## Import a Large Folder of Notes

Use `import-folder` to intake many Markdown and text files into a local vault folder while preserving the source folder structure:

```bash
npm run forge -- import-folder path/to/notes --vault vault/notes
```

Supported intake file types:

- `.md`
- `.markdown`
- `.txt`

The importer skips noisy folders:

- `.git`
- `node_modules`
- `exports`
- hidden folders such as `.obsidian` or `.trash`

The importer writes:

```text
vault/notes/manifest.json
```

The manifest records the original source root, import timestamp, file count, relative paths, and whether each file is Markdown or plain text.

## Dry-Run Import

Before copying a large folder, use dry-run:

```bash
npm run forge -- import-folder path/to/notes --vault vault/notes --dry-run
```

Dry-run prints every planned copy and does not modify the vault.

## Sliding Columns in HTML Exports

Generated HTML exports now include two slideable side columns:

- **Left column:** file/organization context and document outline.
- **Center column:** the rendered Markdown document.
- **Right column:** metadata, layer status, claims/commentary context.

Use the export buttons:

- `Toggle files`
- `Toggle layers`

These buttons collapse or restore the left and right columns with plain CSS and minimal JavaScript. The columns are intentionally implemented in the static export first so the later Electron shell can wrap the same mental model without changing the Markdown source.

## Why This Matters

The left side is where bulk imported notes and text files will become navigable organization. The right side is where FORGE layers, claims, metadata, and commentary can appear without polluting the Markdown document.

Markdown remains the source of truth. Sidebars are presentation and organization only.
