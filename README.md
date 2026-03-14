# User Manual Project

This repo now contains two parallel tracks:
- the existing User Manual specimen and renderer
- a new first-pass TypeScript Islands sandbox core under `src/core`

## Run

Serve the directory with any static file server, for example:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/app/`.

To type-check the new sandbox core after installing dependencies:

```bash
npm install
npm run check
```

## Structure

- `src/core/`: TypeScript sandbox engine scaffold
- `sandboxes/example-sandbox/`: flat-registry example sandbox for CRUD and preview helpers
- `island/`: portable island package
- `island/schema/`: content model and structural rules
- `island/island.json`: island-level metadata and expression references
- `island/expressions/user-manual/expression.json`: expression metadata
- `island/expressions/user-manual/*/`: module folders with `module.json`, `scene.json`, and `pages/`
- `app/`: renderer implementation only

The new sandbox core is folder-agnostic and separate from the current User Manual renderer. It is designed around stable internal node types, sandbox label mappings, filesystem-backed editing, and editor-ready helpers for future UI work.

The sandbox scaffold uses:
- a virtual `root` identifier stored in `sandbox.json`
- `/nodes/<nodeId>/node.json` for metadata
- `/content/<nodeId>.md` for leaf content files
