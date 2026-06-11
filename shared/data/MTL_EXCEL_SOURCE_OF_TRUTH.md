# MTL Excel Source Of Truth

Status: locked workflow decision, 2026-06-04.

The Math Translation Layer website data is hand-authored in Excel. The website must not generate translations from LaTeX, TypeScript, npm, or the old CSV wrapper.

## Canonical Editable Workbook

`X:\Backside\stations\math-translation-layer.station\data\math_translation_table_updated_1.xlsx`

David updates this workbook as rows are completed.

Current source copy received:

`\\dlowenas\HPWorkstation\Desktop\math_translation_table_updated_1.xlsx`

## Export Target

`\\dlowenas\HPWorkstation\Desktop\Master HTMl\_____ KIMI WORKFLOW\shared\data\mtl-equations.json`

The JSON is a built artifact. Do not hand-edit it except for emergency debugging.

## Website Contract

Article HTML references an equation by id:

```html
<details class="math-translation-block" data-eq-id="eq_001">
  <summary>What this equation says in English</summary>
  <div class="mtl-body"></div>
</details>
```

The page JavaScript loads `shared/data/mtl-equations.json`, finds the matching `id`, and fills the callout from the pre-written `easy` field. TTS uses `audioSafe`.

Only two fields are required:

- `easy` - on-screen human explanation
- `audioSafe` - spoken/TTS-safe version

`standard` and `academic` are optional compatibility fields. If blank, the exporter falls them back to `easy` so old UI shells do not break.

## Important ID Rule

The id in `data-eq-id` must match the Excel `id` exactly. If an existing article uses an article-scoped id such as `MDA-030-trinity-mechanism-EQ-005`, either change the article id to the Excel id or add an explicit alias column before export. Do not guess.

## Export Command

From `_____ KIMI WORKFLOW`:

```cmd
scripts\RUN_export_mtl.cmd
```

The exporter preserves the workbook content. It marks rows missing `easy` or `audioSafe` as `needs_review` instead of inventing placeholder language.
