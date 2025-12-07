# People Collaboration Feature

## Summary

Plus subscribers can share Person records with collaborators via invite links. Shared people appear in the normal people list with a shared indicator. Collaborators get full write access to person, notes, reminders, and images.

---

## Architecture

### Ownership Model

- New people are created with a Jazz `Group` as owner (creator becomes admin)
- Nested CoLists (notes, reminders) inherit the same Group owner
- Existing account-owned people are lazily migrated when first shared

### Sharing Flow (Revocable Invites)

1. Admin opens share dialog from person detail page
2. Clicks "Generate invite link" (Plus required)
3. If person not yet group-owned, migration happens transparently
4. System creates:
   - **InviteGroup**: A new Group for this specific invite
   - **InviteBridge**: A CoMap owned by InviteGroup, storing `personId`
   - InviteGroup is added as writer to PersonGroup
5. Jazz `createInviteLink(bridge)` generates URL with hash fragment
6. Collaborator opens link → `/app/invite` route
7. `useAcceptInvite()` processes the InviteBridge, user joins InviteGroup
8. App loads `bridge.personId` to get Person, adds to user's list
9. Both users now see the person with shared indicators

### Revoking Access

- Removing a collaborator removes their **InviteGroup** from PersonGroup
- All users who joined via the same invite link lose access together
- AlertDialog confirms removal, listing affected users
- Old invite links become useless (InviteGroup still exists but has no access to PersonGroup)

### Invite Link Expiry

- Empty InviteGroups (no one joined) are cleaned up after 7 days
- This effectively makes unused invite links expire

### Access Control

- **Admin**: Can generate invite links, remove collaborators, delete person
- **Writer**: Can edit person, notes, reminders (collaborators join as writers)
- **Without Plus**: Can open share dialog to manage existing collaborators, but cannot generate new invite links

---

## File Overview

| File                                       | Purpose                                                |
| ------------------------------------------ | ------------------------------------------------------ |
| `src/app/features/plus.ts`                 | `useHasPlusAccess()` hook                              |
| `src/shared/tools/person-create.ts`        | Creates people with Group ownership                    |
| `src/shared/schema/user.ts`                | InviteBridge schema for revocable invites              |
| `src/app/features/person-sharing.ts`       | Sharing utilities (migrate, invite, collaborators)     |
| `src/app/features/person-share-dialog.tsx` | Share UI with invite link + collaborator list          |
| `src/app/routes/_app.invite.tsx`           | Accept invite route (handles InviteBridge + revoked)   |
| `src/app/routes/_app.tsx`                  | Runs invite group cleanup on app load                  |
| `src/app/features/person-query.ts`         | Query with `$onError: "catch"` for inaccessible people |
| `src/app/routes/_app.people.index.tsx`     | Filters unauthorized people from list                  |
| `src/app/features/person-list-item.tsx`    | Shared icon indicator                                  |
| `src/app/features/person-details.tsx`      | Share button, shared badges, leave dialog              |
| `src/app/hooks/use-collaborators.ts`       | Hook to load collaborators for a person                |
| `src/server/features/chat-messages.ts`     | AI system prompt mentions sharing                      |
| `src/shared/intl/messages.people.ts`       | i18n strings (EN/DE)                                   |
| `src/shared/intl/messages.ui.ts`           | Invite-related i18n strings                            |

---

## Key Functions

### person-sharing.ts

```ts
createPersonInviteLink(person, userId) // Creates InviteGroup + InviteBridge, returns invite URL
getInviteGroupsWithMembers(person) // Returns invite groups with their member lists
removeCollaborator(person, accountId) // Removes user (and their InviteGroup) from group
removeInviteGroup(person, inviteGroupId) // Removes entire InviteGroup, revoking access for all its members
cleanupEmptyInviteGroups(person) // Removes InviteGroups with no members after 7 days
getPersonOwnerName(person) // Gets admin's display name
migratePersonToGroup(person, userId) // Converts account-owned → group-owned
```

### Lazy Migration

When sharing an existing person:

1. Create new Group (user becomes admin)
2. Create new Person with Group owner
3. Recreate all notes/reminders with Group owner
4. Replace old person in user's list
5. Mark old person as permanently deleted

---

## UI States

### Share Button (in actions dropdown)

- **Admin + Plus**: Enabled, opens share dialog
- **Admin + No Plus**: Disabled, shows "Requires Plus"
- **Non-admin**: Not shown

### Share Dialog

- **With Plus**: Can generate invite links
- **Without Plus**: Can view/remove existing collaborators, generate button disabled

### Person List Item

- Shows shared icon when `!me.canAdmin(person)`
- Tooltip: "Shared with you" (collaborator) or "Shared with others" (admin with collaborators)

### Person Details

- Badge: "Shared by {name}" for collaborators
- Badge: "Shared with {count} people" for admins with collaborators
- "Leave" action for collaborators (removes self from group)
