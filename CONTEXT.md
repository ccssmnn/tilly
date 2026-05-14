# Tilly — Domain Glossary

Vocabulary for navigating the codebase. Add terms here when a new concept earns a module of its own.

## Domain

- **Person** — central entity. Has `name`, optional `summary` (free-text, may contain hashtags = lists), `avatar`, and child collections of notes and reminders. Soft-deletable via `deletedAt`. (`src/shared/schema/user.ts`)
- **Note** — free-text entry attached to a Person. Optional title, content, images, `pinned`. Soft-deletable. Lives in `Person.notes` (active) or `Person.inactiveNotes` (kept for restore).
- **Reminder** — dated task attached to a Person. `text`, `dueAtDate`, optional `repeat` (interval + day/week/month/year), `done`. Soft-deletable. Same active/inactive split as notes.
- **List** — a hashtag in a Person's `summary`. Lists are not modeled as a separate CoValue; they are derived by parsing hashtags from `summary`. Adding a person to a list = inserting `#tag` into their summary. (Currently scattered across `people/lib`; see ADR-0001's deepening goals.)
- **Sharing** — a Person can be shared via an invite link. Sharing migrates the Person and its child notes/reminders into a new Group so the recipient has access. (`src/app/features/people/lib/person-sharing.ts`)
- **Assistant** — chat-driven AI that mutates the user's data via tools. Conversation state is persisted as `Assistant.stringifiedMessages` on the user account.

## Architecture

- **Module** — anything with an interface and an implementation: a function, a file, a feature folder.
- **Operation** — a mutation result returned by a core op. Shape: `{ operation: "create" | "update", current, previous? }`. The `current`/`previous` snapshots use the same shape as the AI tool's success output, so action-layer undo and chat-side undo read the same fields.
- **Deleted** — distinct mutation result for hard deletes. Shape: `{ operation: "delete", previous }`. No `current`, since the entity no longer exists.
- **Core op** — a function that performs a mutation against the Jazz schema and returns `Operation<T>` or `Deleted<T>`. Lives in `src/shared/tools/<entity>-<verb>.ts`. Takes a `worker: Loaded<UserAccount>` and reloads its dependencies fresh. Called directly by both the AI tool adapter and the UI action layer.
- **Tool** — an AI SDK tool, i.e. a description + zod input/output schemas the model uses to interact with the app. Defined per-entity via the `defineTool` primitive (`src/shared/tools/define-tool.ts`).
- **Action handler** — UI-side function (`src/app/features/<feature>/lib/*-actions.ts`) that calls a core op and adds toast feedback + undo.
- **Adapter** — concrete thing satisfying an interface at a seam. The `defineTool` primitive is the adapter at the AI SDK ↔ core op seam.
