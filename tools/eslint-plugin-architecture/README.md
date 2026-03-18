# eslint-plugin-architecture

ESLint plugin enforcing compositional architecture boundaries across frontend and backend features.

## Architecture model

Both frontend and backend enforce a flat dependency tree with max 2 layers of composition depth:

```
Frontend:  route → screen → widgets/parts    widgets → parts    parts → ∅
Backend:   router → handler → operations/parts    operations → parts    parts → ∅
```

## Rules

### `no-deep-feature-imports`

Cross-feature imports must go through the feature's `index.ts` entrypoint.

```ts
// ❌
import { NoteItem } from "#app/features/notes/parts/NoteItem"

// ✅
import { NoteItem } from "#app/features/notes"
```

Same-feature deep imports are allowed. Type-only imports are exempt. Routes may deep-import screens, the router may deep-import handlers.

### `only-screens-and-widgets-may-import-parts`

Only `screens/**`, `widgets/**`, `handlers/**`, and `operations/**` may import from `parts/**` (same feature only).

### `only-routes-may-import-screens`

Only `routes/**` and feature `index.ts` files may import from `screens/**`.

### `only-router-may-import-handlers`

Only files outside features (e.g. `src/server/main.ts`) and feature `index.ts` files may import from `handlers/**`. Handlers cannot import other handlers.

### `only-handlers-may-import-operations`

Only `handlers/**` (same feature) and feature `index.ts` files may import from `operations/**`. Operations cannot import other operations — this keeps the dependency tree flat.

### `no-feature-part-composition`

Files in `parts/**` must not compose other parts. Parts are atomic — composition happens in screens, widgets, handlers, or operations.

- **Frontend parts**: must not render other parts (JSX check)
- **Backend parts**: must not import other parts (import check)

### `no-local-part-subcomponents`

Files in `parts/**` must not define multiple PascalCase components where one renders another.

### `no-widget-composition`

Files in `widgets/**` must not render widgets from other features. Same-feature widget composition is allowed.

### `no-local-widget-subcomponents`

Files in `widgets/**` must not define multiple PascalCase components where one renders another. Extract sub-components into `parts/**`.

### `no-utility-definitions-in-ui-modules`

Structural modules must not define utility functions or hooks. Extract to `hooks/` or `lib/`.

- **Frontend**: applies to `screens/**`, `widgets/**`, `parts/**`
- **Backend**: applies to `handlers/**` only (operations and parts ARE the business logic)

### `no-loose-feature-module-imports`

Feature modules that have been migrated to the structured layout must be imported through their `index.ts`.

## Configuration

All import-based rules accept an `aliases` option:

```js
{
  "architecture/no-deep-feature-imports": ["error", {
    aliases: {
      "#app": "src/app",
      "#shared": "src/shared",
      "#server": "src/server"
    }
  }]
}
```

Defaults match the tilly tsconfig paths.

## Expected directory structure

```
src/app/features/<feature>/
  screens/     ← route-attached feature pages
  widgets/     ← reusable cross-feature composition boundaries
  parts/       ← atomic feature-specific UI
  hooks/       ← feature hooks
  lib/         ← feature logic
  index.ts     ← public API

src/app/components/   ← shared feature-agnostic composed UI
src/shared/ui/        ← shared atomic UI primitives
src/app/routes/       ← router (attaches screens to routes)

src/server/features/<feature>/
  handlers/    ← transport boundary (called by router)
  operations/  ← reusable cross-feature business logic
  parts/       ← atomic business logic
  lib/         ← feature utilities
  index.ts     ← public API
```

## Limitations

- **No transitive analysis** — importing from a feature index that re-exports parts won't be flagged. The index IS the public API boundary.
- **Relative imports** — resolved via path joining, not TS module resolution. Aliases cover the main case.
- **`<Foo.Bar />` JSX patterns** — member expression component references are not tracked.
- **PascalCase heuristic** — all PascalCase function declarations and variable assignments are treated as potential components in `no-local-part-subcomponents` and `no-local-widget-subcomponents`.
- **Utility detection heuristic** — `no-utility-definitions-in-ui-modules` identifies non-component, non-type top-level declarations.
- **Files outside the new structure** — flat files in `features/` classify as `unknown` and are ignored by all rules.

## Development

```sh
cd tools/eslint-plugin-architecture
bun install
bun run build    # tsc → dist/
bun test         # vitest
```
