# eslint-plugin-architecture

ESLint plugin enforcing compositional architecture boundaries.

## Rules

### `no-deep-feature-imports`

Cross-feature imports must go through the feature's `index.ts` entrypoint.

```ts
// ❌
import { NoteItem } from "#app/features/notes/parts/NoteItem"

// ✅
import { NoteItem } from "#app/features/notes"
```

Same-feature deep imports are allowed. Type-only imports are exempt.

### `only-screens-and-widgets-may-import-parts`

Only `screens/**`, `widgets/**`, and the feature `index.ts` may import from `parts/**`.

### `only-routes-may-import-screens`

Only `routes/**` and feature `index.ts` files may import from `screens/**`.

### `no-feature-part-composition`

Files in `parts/**` must not render other parts. Parts are atomic — composition happens in screens and widgets.

Allowed in parts: DOM elements, shared UI (`#shared/ui/*`), app components (`#app/components/*`), hooks, and lib imports.

### `no-local-part-subcomponents`

Files in `parts/**` must not define multiple PascalCase components where one renders another. This prevents bypassing import rules by hiding composition chains in a single file.

Multiple components that don't render each other are allowed (e.g. sibling exports).

### `only-use-cases-may-compose-operations`

For server logic: only `use-cases/**` may import from `operations/**`. Operations must not import other operations.

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
  widgets/     ← public cross-feature composition boundaries
  parts/       ← atomic feature-specific UI
  hooks/       ← feature hooks
  lib/         ← feature logic
  index.ts     ← public API

src/app/components/   ← shared feature-agnostic composed UI
src/shared/ui/        ← shared atomic UI primitives
src/app/routes/       ← router (attaches screens to routes)

src/server/features/<feature>/
  handlers/    ← transport boundary
  use-cases/   ← orchestration
  operations/  ← atomic logic
```

## Limitations

- **No transitive analysis** — importing from a feature index that re-exports parts won't be flagged. The index IS the public API boundary.
- **Relative imports** — resolved via path joining, not TS module resolution. Aliases cover the main case.
- **`<Foo.Bar />` JSX patterns** — member expression component references are not tracked.
- **PascalCase heuristic** — all PascalCase function declarations and variable assignments (including call expressions like `createContext`, `memo`, `forwardRef`) are treated as potential components in `no-local-part-subcomponents`. False positives are unlikely since the rule only reports when one PascalCase identifier renders another.
- **Files outside the new structure** — flat files in `features/` (not yet migrated) classify as `unknown` and are ignored by all rules.

## Development

```sh
cd tools/eslint-plugin-architecture
bun install
bun run build    # tsc → dist/
bun test         # vitest
```
