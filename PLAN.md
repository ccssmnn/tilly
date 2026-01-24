# Jazz 0.20 Permanent Deletion Implementation

Replace `permanentlyDeletedAt` marker pattern with actual CoValue deletion using `deleteCoValues`.

## Phase 1: Create deletion utilities

**New file: `src/shared/lib/delete-covalue.ts`**

- `permanentlyDeleteNote(noteId)` - deletes note + all images
- `permanentlyDeleteReminder(reminderId)` - deletes reminder
- `permanentlyDeletePerson(personId)` - deletes person + avatar + notes (w/ images) + reminders + inactive lists

## Phase 2: Schema changes

**`src/shared/schema/user.ts`**

- Remove `permanentlyDeletedAt` from `Note`, `Reminder`, `Person`
- Remove `isPermanentlyDeleted` helper

## Phase 3: Update tools

**`src/shared/tools/note-update.ts`**

- Remove `permanentlyDeletedAt` handling, call `permanentlyDeleteNote()`

**`src/shared/tools/reminder-update.ts`**

- Remove `permanentlyDeletedAt` handling, call `permanentlyDeleteReminder()`

**`src/shared/tools/person-update.ts`**

- Remove `permanentlyDeletedAt` handling, call `permanentlyDeletePerson()`

## Phase 4: Update cleanup hook

**`src/app/hooks/use-cleanups.ts`**

- Change `markStaleAsPermanentlyDeleted` to call deletion utilities
- Remove `permanentlyDeletedAt` checks

## Phase 5: Update UI components

- `note-list-item.tsx` - call `permanentlyDeleteNote()`
- `reminder-list-item.tsx` - call `permanentlyDeleteReminder()`
- `person-list-item.tsx` - call `permanentlyDeletePerson()`

## Phase 6: Update filters/hooks

Remove `isPermanentlyDeleted` checks (deleted items won't exist):

- `note-filters.ts`
- `reminder-filters.ts`
- `person-filters.ts`
- `note-hooks.ts`
- `reminder-hooks.ts`
- `note-read.ts`
- `reminder-read.ts`
- `person-read.ts`
- `personalized-prompts.ts`

## Phase 7: Update settings delete all

**`src/app/routes/_app.settings.tsx`**

- Call `permanentlyDeletePerson()` for each person
- Clear assistant, notification settings, usage tracking

## Phase 8: Update data import/export

- `data-file-schema.ts` - remove `permanentlyDeletedAt` from schemas
- `data-upload-button.tsx` - skip items with `permanentlyDeletedAt`
- `data-download-button.tsx` - remove `permanentlyDeletedAt` from export

## Phase 9: Update share dialog

**`src/app/features/person-share-dialog.tsx`**

- `migratePersonToGroup` - call `permanentlyDeletePerson()` instead of marker
- `migrateChildrenToGroup` - remove `permanentlyDeletedAt` copying

## Phase 10: Update tests

- `person-filters.test.ts`
- `note-filters.test.ts`
- `reminder-filters.test.ts`

## Files summary

| Category | Files                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| New      | `src/shared/lib/delete-covalue.ts`                                                                               |
| Schema   | `user.ts`                                                                                                        |
| Tools    | `note-update.ts`, `reminder-update.ts`, `person-update.ts`, `note-read.ts`, `reminder-read.ts`, `person-read.ts` |
| Hooks    | `use-cleanups.ts`                                                                                                |
| Filters  | `note-filters.ts`, `reminder-filters.ts`, `person-filters.ts`, `note-hooks.ts`, `reminder-hooks.ts`              |
| UI       | `note-list-item.tsx`, `reminder-list-item.tsx`, `person-list-item.tsx`, `person-share-dialog.tsx`                |
| Data     | `data-file-schema.ts`, `data-upload-button.tsx`, `data-download-button.tsx`                                      |
| Routes   | `_app.settings.tsx`, `_app.people.index.tsx`                                                                     |
| Other    | `personalized-prompts.ts`, `note-update-ui.tsx`                                                                  |
| Tests    | `*-filters.test.ts` (3 files)                                                                                    |
