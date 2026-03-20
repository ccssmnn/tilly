# eslint-plugin-architecture

ESLint plugin enforcing compositional architecture boundaries across frontend and backend features.

## Architecture model

Both frontend and backend enforce a flat dependency tree:

```
Frontend:  route → screen → widgets/parts    widgets → parts    parts → ∅
Backend:   router → handler → operations → lib    lib → ∅
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

Only composition-layer modules (`screens/**`, `widgets/**`, `handlers/**`, `operations/**`) may import leaf modules (`parts/**`, `lib/**`, `hooks/**`) from the same feature.

### `only-routes-may-import-screens`

Only `routes/**` and feature `index.ts` files may import from `screens/**`.

### `only-router-may-import-handlers`

Only files outside features (e.g. `src/server/main.ts`) and feature `index.ts` files may import from `handlers/**`. Handlers cannot import other handlers.

### `only-handlers-may-import-operations`

Only `handlers/**` (same feature) and feature `index.ts` files may import from `operations/**`. Operations cannot import other operations — this keeps the dependency tree flat.

### `no-feature-part-composition`

Leaf modules (`parts/**`, `lib/**`, `hooks/**`) must not compose other leaf modules of the same kind. Composition happens in screens, widgets, handlers, or operations.

- **Frontend parts**: must not render other parts (JSX check)
- **Backend lib**: must not import other lib (import check). Type-only imports are exempt.

### `no-local-subcomponents`

Files in `screens/**`, `widgets/**`, and `parts/**` must not define multiple PascalCase components where one renders another. Extract sub-components to the appropriate layer (widgets or parts).

### `no-widget-composition`

Files in `widgets/**` must not render widgets from other features. Same-feature widget composition is allowed.

### `no-utility-definitions-in-ui-modules`

Structural modules must not define utility functions or hooks. Extract to `hooks/` or `lib/`.

Applies to `screens/**`, `widgets/**`, `parts/**`, `handlers/**`, `operations/**` by default. Configurable via `structuralZones`. Functions reexported via `export { name }` are exempt (module's public API).

### `no-loose-feature-module-imports`

Feature modules that have been migrated to the structured layout must be imported through their `index.ts`.

## Configuration

All rules accept a `featureRoots` option to define where features live and which zones each root supports:

```js
{
  "architecture/no-deep-feature-imports": ["error", {
    featureRoots: [
      { path: "src/app/features", allowedZones: ["screens", "widgets", "parts", "hooks", "lib"] },
      { path: "src/server/features", allowedZones: ["handlers", "operations", "lib", "middleware", "apps"] },
      { path: "src/shared/features", allowedZones: ["lib"] },
    ]
  }]
}
```

Import-based rules also accept an `aliases` option for path alias resolution:

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

Both options have defaults matching the tilly tsconfig paths and standard app/server feature roots.

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
  operations/  ← business logic (composes lib)
  lib/         ← atomic standalone utilities (no lib→lib imports)
  index.ts     ← public API
```

## Limitations

- **No transitive analysis** — importing from a feature index that re-exports parts won't be flagged. The index IS the public API boundary.
- **Relative imports** — resolved via path joining, not TS module resolution. Aliases cover the main case.
- **`<Foo.Bar />` JSX patterns** — member expression component references are not tracked.
- **PascalCase heuristic** — all PascalCase function declarations and variable assignments are treated as potential components in `no-local-subcomponents`.
- **Utility detection heuristic** — `no-utility-definitions-in-ui-modules` identifies non-component, non-type top-level declarations.
- **Files outside the new structure** — flat files in `features/` classify as `unknown` and are ignored by all rules.

## Development

```sh
cd tools/eslint-plugin-architecture
bun install
bun run build    # tsc → dist/
bun test         # vitest
```
