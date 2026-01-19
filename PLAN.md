# List Filter Button Enhancement

Expand `ListFilterButton` to include status filters and sorting options.

## Store Changes (`src/app/lib/store.ts`)

Add to `AppState` interface:

```ts
peopleSortMode: "recent" | "alphabetical"
setPeopleSortMode: (mode: "recent" | "alphabetical") => void
peopleStatusFilter: "active" | "deleted"
setPeopleStatusFilter: (filter: "active" | "deleted") => void

remindersStatusFilter: "active" | "done" | "deleted"
setRemindersStatusFilter: (filter: "active" | "done" | "deleted") => void

notesStatusFilter: "active" | "deleted"
setNotesStatusFilter: (filter: "active" | "deleted") => void
```

Add to zod schema, PersistedState, initialPersistedState, partialize, and rehydrate reset.

## Refactor `ListFilterButton` (`src/app/features/list-filter-button.tsx`)

New props:

```ts
{
  people: PersonWithSummary[]
  listFilter: string | null
  onListFilterChange: (filter: string | null) => void
  statusOptions: { value: string; labelKey: string }[]
  statusFilter: string
  onStatusFilterChange: (filter: string) => void
  sortOptions?: { value: string; labelKey: string }[]
  sortMode?: string
  onSortChange?: (mode: string) => void
}
```

Dropdown structure:

- **Lists** section (existing)
- Separator
- **Status** section (radio-style items)
- Separator (if sortOptions)
- **Sort** section (radio-style items, people only)

Button variant: `secondary` when `listFilter || statusFilter !== "active" || sortMode !== "recent"`

## Update Screens

| Screen    | Status options        | Sort options         | Default status | Default sort |
| --------- | --------------------- | -------------------- | -------------- | ------------ |
| People    | active, deleted       | recent, alphabetical | active         | recent       |
| Reminders | active, done, deleted | —                    | active         | —            |
| Notes     | active, deleted       | —                    | active         | —            |

Each screen applies filtering/sorting before rendering list.

## i18n Keys

Add to `messages.ui.ts`:

```ts
"filter.status": "Status"
"filter.status.active": "Active"
"filter.status.done": "Done"
"filter.status.deleted": "Deleted"
"filter.sort": "Sort"
"filter.sort.recent": "Recently updated"
"filter.sort.alphabetical": "Alphabetical"
```

## Files to Modify

1. `src/app/lib/store.ts`
2. `src/app/features/list-filter-button.tsx`
3. `src/app/routes/_app.people.index.tsx`
4. `src/app/routes/_app.reminders.tsx`
5. `src/app/routes/_app.notes.tsx`
6. `src/shared/intl/messages.ui.ts`

## Behavior Notes

- "recent" sort = by `updatedAt` (last modified)
- "alphabetical" sort = by full name string
- All filter states reset on new day (like search queries)
- Button highlights (`variant="secondary"`) when any non-default filter is active
