# User Manual Project

This repo now contains two parallel tracks:
- the existing User Manual specimen and renderer
- a new first-pass TypeScript Islands sandbox core under `src/core`

## Product Split

There are two different products here:

- `User Manual`
  This is the public-facing website renderer currently served from `app/` and published at the live site.

- `Islands • Sandbox`
  This is the local editing product we are building for your desktop workflow. Its job is to open sandbox folders, create/edit files, and eventually drive changes that can be published to the live website.

Important: `Islands • Sandbox` is not yet a separate local UI application in this repo. What exists today is the first-pass core architecture for it under `src/core/` plus an example sandbox under `sandboxes/example-sandbox/`.

## Run

Serve the directory with any static file server, for example:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/app/`.

That URL is the `User Manual` renderer, not the future `Islands • Sandbox` editor.

To type-check the new sandbox core after installing dependencies:

```bash
npm install
npm run check
```

## Structure

- `src/core/`: first-pass core for `Islands • Sandbox`
- `sandboxes/example-sandbox/`: flat-registry sample sandbox used by `Islands • Sandbox`
- `island/`: portable island package
- `island/schema/`: content model and structural rules
- `island/island.json`: island-level metadata and expression references
- `island/expressions/user-manual/expression.json`: expression metadata
- `island/expressions/user-manual/*/`: module folders with `module.json`, `scene.json`, and `pages/`
- `app/`: `User Manual` public renderer implementation only

The `Islands • Sandbox` core is folder-agnostic and separate from the current User Manual renderer. It is designed around stable internal node types, sandbox label mappings, filesystem-backed editing, and editor-ready helpers for future UI work.

The sandbox scaffold uses:
- a virtual `root` identifier stored in `sandbox.json`
- `/nodes/<nodeId>/node.json` for metadata
- `/content/<nodeId>.md` for leaf content files
