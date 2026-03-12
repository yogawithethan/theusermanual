# Island Package

This folder is the portable source of truth for the User Manual island package.

- `schema/` describes the content model.
- `island.json` contains island-level identity and expression references.
- `expressions/user-manual/` is the expression package containing `expression.json` and module folders.

The renderer in `/app` should only read from here.
