# User Manual Project

Initial project structure for the first User Manual implementation using the Islands architecture.
The current renderer is intentionally simple: it loads the first module and first page from the island content package.

## Run

Serve the directory with any static file server, for example:

```bash
python3 -m http.server
```

Then open `http://localhost:8000/app/`.

## Structure

- `island/`: portable island package
- `island/schema/`: content model and structural rules
- `island/island.json`: island-level metadata and expression references
- `island/expressions/user-manual/expression.json`: expression metadata
- `island/expressions/user-manual/*/`: module folders with `module.json`, `scene.json`, and `pages/`
- `app/`: renderer implementation only

The intended split follows `Person -> Island -> Expression -> Page -> Block`, with schema and content staying portable outside the renderer.
