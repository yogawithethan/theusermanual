# Island Schema

This directory defines the portable structural model for Islands-aligned content.

## Hierarchy

Person -> Island -> Expression -> Page -> Block

## Separation

- expression folders store the actual User Manual content and metadata.
- `schema/` defines how that content is organized and interpreted.
- `app/` renders the content but does not own it.

## Current package

- `island.json`: top-level person, island, theme, and expression references
- `user-manual/expression.json`: expression-level metadata
- `user-manual/*/module.json`: module metadata
- `user-manual/*/scene.json`: module atmosphere overrides
- `user-manual/*/*.json`: portable page definitions
- `user-manual/*/*.md`: lesson text sources

## Schema files

- `island.json`: top-level manifest schema
- `expression.json`: expression structure
- `module.json`: module metadata and page index entries
- `page.json`: renderable page and block definitions
- `scene.json`: atmosphere and styling metadata
