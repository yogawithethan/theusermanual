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

What now exists for `Islands • Sandbox`:
- a shared engine under `src/core/`
- a sample sandbox under `sandboxes/example-sandbox/`
- a separate local editor under `apps/sandbox/`

Important: `Islands • Sandbox` is now a separate local editor scaffold in the repo, but it is still not a packaged desktop app like Electron or Tauri.

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

To run the local `Islands • Sandbox` editor:

```bash
npm install
npm run sandbox
```

Then open `http://127.0.0.1:4321`.

If that port is already in use, run it on another local port:

```bash
PORT=4322 npm run sandbox
```

## Structure

- `apps/sandbox/`: local `Islands • Sandbox` editor
- `src/core/`: first-pass core for `Islands • Sandbox`
- `sandboxes/example-sandbox/`: flat-registry sample sandbox used by `Islands • Sandbox`
- `sandboxes/simple-card/`: minimal file-backed card used by the current editor
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

The local editor in `apps/sandbox/` is a lightweight local web shell backed by a small Node server. It is intentionally separate from the public site.

The current pass is intentionally much smaller:
- one centered editable card
- one contextual controls panel
- one Save action
- no raw JSON in the visible experience

The editor currently saves to `sandboxes/simple-card/card.json`. It is still not a packaged desktop app yet. Packaging, folder-picker support, and larger relational editing flows are follow-up work.
