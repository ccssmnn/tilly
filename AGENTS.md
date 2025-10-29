# Claude Development Guidelines

## Code Style Preferences

### General Principles

- High information density in both code and text
- Optimize for readability over verbosity
- No comments unless absolutely necessary for complex logic
- Split files when top-down readability is compromised
- **NEVER use type casts (`as any`, `as SomeType`, etc.) - Fix types properly instead**

### TypeScript Best Practices

- **NEVER use `any` type** - Always infer or define proper types
- **Use framework type systems** - Leverage Jazz-tools' `co.loaded<>` and `ResolveQuery<>`
- **Extract types from existing objects** - Use `Parameters<typeof fn>[0]` and `NonNullable<T>`
- **Define helper types** - Create meaningful type aliases for complex nested types
- **Type function parameters and returns** - Be explicit about what functions expect and return
- **Use `tryCatch` wrapper** - Wrap async operations for proper error handling with types

**Type Definition Examples:**

```ts
// ✅ Good: Extract types from Jazz schemas
type ReminderData = Parameters<typeof Reminder.create>[0]
type LoadedUser = co.loaded<typeof UserAccount, typeof query>
type NotificationSettings = NonNullable<LoadedUser["root"]["notificationSettings"]>

// ✅ Good: Define clear function signatures
function updateReminder(
  updates: Partial<ReminderData>,
  options: { userId: string }
): Promise<ReminderUpdated>

// ✅ Good: Use tryCatch for error handling
let result = await tryCatch(someAsyncOperation())
if (!result.ok) return { error: result.error }

// ❌ Bad: Using any
function handleUser(user: any) { ... }

// ❌ Bad: Type casting
let data = response as SomeType
```

### Variable Declarations

- Use `let` over `const`
- Only export what needs to be exported
- No default exports

### Functions

- Use `function() {}` over `() => {}` for named functions
- Arrow functions acceptable for inline/anonymous usage

### File Organization

**Universal Module Structure:**

1. **Imports** - External and internal imports at the top
2. **Export declarations** - `export { ... }` and `export type { ... }` immediately after imports
3. **Main functions/components** - Primary exports, kept lean and focused
4. **Helper functions** - Utilities, handlers, types, and constants at the bottom

**Component Modules (.tsx):**

- Extract business logic to module-scope handler functions
- Keep components focused on UI state and rendering
- Place handlers like `handleNoteEdit`, `handleReminderDelete` at bottom
- Custom hooks go after components but before handlers

**Tool/API Modules (.ts):**

- Main operation functions first (like `updateReminder`)
- Helper functions and calculations in middle
- Constants, errors, and type definitions at bottom
- AI tool definitions and execute functions last

**Component Example:**

```ts
import { Button } from "#shared/ui/button"
import { updateNote } from "#shared/tools/note-update"

export { NoteListItem }

function NoteListItem({ note, person }) {
  let [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Button onClick={() => {
      setDialogOpen(false)
      handleNoteEdit(data, person.id, note.id)
    }}>
      Edit
    </Button>
  )
}

function useCustomHook(param: string) {
  return { ref, state }
}

async function handleNoteEdit(data, personId, noteId) {
  // Business logic with error handling and undo
}
```

**Tool/API Example:**

```ts
import { tool } from "ai"
import { Person, Reminder } from "#shared/schema/user"
import { tryCatch } from "#shared/trycatch"
import type { co } from "jazz-tools"

export { updateReminder, updateReminderTool, updateReminderExecute }
export type { ReminderData, ReminderUpdated }

async function updateReminder(
	updates: Partial<ReminderData>,
	options: { userId: string; personId: string },
): Promise<ReminderUpdated> {
	let personResult = await tryCatch(Person.load(options.personId))
	if (!personResult.ok) throw errors.PERSON_NOT_FOUND

	// Main business logic with proper types
	return { operation: "update", current, previous, _ref }
}

function calculateNextDueDate(reminder: co.loaded<typeof Reminder>): Date {
	// Helper calculations with proper Jazz-tools types
}

let errors = {
	PERSON_NOT_FOUND: "person not found",
} as const

type ReminderData = Parameters<typeof Reminder.create>[0]
type ReminderUpdated = {
	operation: "update"
	current: ReminderData
	previous: ReminderData
	_ref: co.loaded<typeof Reminder>
}

let updateReminderTool = tool({
	/* AI tool definition */
})
```

**Benefits:**

- Instant navigation: see exports → jump to implementation
- Clear separation: UI vs business logic vs types
- Consistent patterns across component and utility modules
- Better maintainability and testability

## Useful Commands

### Development

```bash
pnpm check          # TypeScript compilation check
pnpm build          # Build for production
# NOTE: Never start dev server - use pnpm check for validation
```

### Code Quality

```bash
# Run these after making changes to ensure code correctness
pnpm check          # Always run after code changes
# IMPORTANT: Never use pnpm dev - only use pnpm check for validation
```

## Project Structure Notes

### Operations Pattern

- Centralized CRUD operations in `operations.ts` files
- Consistent return structure with `current`/`previous` data
- Built-in undo functionality via `undo*Operation()` functions
- Error handling with `tryCatch` wrapper

### Storage

- Uses IndexedDB via `idb-keyval` for persistence (supports File objects)
- Custom Zustand middleware for complex object serialization
- Graceful fallback to initial state on data corruption

### AI Tools

- Tool functions in `tools.ts` files use operations internally
- Return sanitized data (exclude `_ref` properties)
- No file upload support in AI tools

### Blog Posts

Blog posts live in `src/content/blog/` organized by post slug, with locale-specific markdown files:

```
src/content/blog/
  self-hosting/
    en.md
    de.md
public/blog/
  self-hosting/
    og.png
```

**Frontmatter Schema:**

```yaml
---
title: "Post Title"
description: "Post description for meta tags"
pubDate: "October 7 2025"
tags: ["technical"]
ogImage: "/blog/post-slug/og.png" # Optional, falls back to /og.png
---
```

**Creating OG Images:**

```bash
# Generate blog-specific OG image
pnpm tsx scripts/og.tsx \
  --heading="Your Title" \
  --tagline="Your Tagline" \
  --out=public/blog/your-slug/og.png

# Add to frontmatter
ogImage: "/blog/your-slug/og.png"
```

**Key Points:**

- Colocate OG images with posts in `public/blog/{slug}/`
- Use short, punchy text for headings (rendered at 96px)
- Taglines appear below at 48px
- Images are 1200x630px optimized for social sharing
