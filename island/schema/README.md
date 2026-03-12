# Island Schema

This directory defines the portable structural model for Islands-aligned content.

## Hierarchy

Person -> Island -> Expression -> Page -> Block

## Separation

- `content/` stores the actual User Manual content and metadata.
- `schema/` defines how that content is organized and interpreted.
- `app/` renders the content but does not own it.

## Current package

- `content/island.json`: top-level person, island, theme, and expression manifest
- `content/expressions/user-manual/modules/*/module.json`: expression-level module metadata
- `content/expressions/user-manual/modules/*/scene.json`: module atmosphere overrides
- `content/expressions/user-manual/modules/*/pages/*.json`: portable page definitions
- `content/expressions/user-manual/modules/*/content/*.md`: lesson text sources

## Schema files

- `island.json`: top-level manifest schema
- `expression.json`: expression structure
- `module.json`: module metadata and page index entries
- `page.json`: renderable page and block definitions
- `scene.json`: atmosphere and styling metadata
