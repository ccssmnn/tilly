Final Plan: People Collaboration Feature
Summary
Enable Plus subscribers to share Person records with collaborators via invite links. Shared people appear in the normal people list with a shared indicator. Collaborators get full write access to person, notes, reminders, and images.
---
Implementation Tasks
1. Add useHasPlusAccess() hook
File: src/app/features/plus.ts
Add new hook alongside existing useAssistantAccess:
function useHasPlusAccess(): { hasPlusAccess: boolean; isLoading: boolean }
Reuses determineAccessStatus logic, returns simpler boolean.
---
2. Update Person creation with Group ownership
File: src/shared/tools/person-create.ts
- Create dedicated Group with creator as admin
- Create Person with { owner: group }
- Nested co.list() calls (notes, reminders) inherit owner via cascading
This ensures all new people are shareable from creation.
---
3. Create sharing utilities
New file: src/app/features/person-sharing.ts
export { migratePersonToGroup, createPersonInviteLink, getPersonCollaborators, removeCollaborator }
// For existing people (lazy migration)
async function migratePersonToGroup(person, me): Promise<Group>
// Generate invite URL with hash fragment
function createPersonInviteLink(person): string
// Load collaborators from group
async function getPersonCollaborators(person): Promise<Account[]>
// Admin removes a collaborator  
async function removeCollaborator(person, account): Promise<void>
---
4. Create share dialog component
New file: src/app/features/person-share-dialog.tsx
- Triggered from person detail page (share button, Plus only)
- Shows invite link with copy button + native share
- Lists current collaborators with remove buttons (admin only)
- Handles lazy migration if person not yet group-owned
---
5. Add invite route
New file: src/app/routes/_app.invite.tsx
- Route: /_app/invite
- Uses useAcceptInvite({ invitedObjectSchema: Person, forValueHint: "person" })
- On accept:
  1. Load the Person
  2. Push to root.people
  3. Send push notification to admin
  4. Navigate to /people/${personId}
---
6. Update people list query for error handling
File: src/app/features/person-query.ts
Add $onError: "catch" to handle inaccessible people:
people: {
  $each: {
    avatar: true,
    reminders: { $each: true },
    $onError: "catch",
  },
},
---
7. Update people list UI
File: src/app/routes/_app.people.index.tsx
- Filter out !person.$isLoaded entries (unauthorized)
- Add shared icon indicator when !me.canAdmin(person)
File: src/app/features/person-list-item.tsx
- Add small icon (e.g., People or PersonPlus) for shared people
---
8. Update person detail page
File: src/app/routes/_app.people.$personID.tsx
- Add share button (visible for Plus users who are admin)
- Handle unauthorized access (redirect or error state)
File: src/app/features/person-details.tsx
- Add "Shared" badge when person has collaborators
- Show collaborator avatars/count on badge hover/tap
---
9. Add push notification for invite acceptance
File: src/server/features/push-shared.ts (or new endpoint)
New function to notify admin when collaborator joins:
- Load admin's notification settings
- Send push: "{userName} joined {personName}"
May need a simple API endpoint for the client to call after accepting invite.
---
10. Update AI system prompt
File: src/server/features/chat-messages.ts
Add to system prompt:
> "Users can share people with collaborators via invite links from the person's detail page. You cannot create invite links—direct users to the share button in the UI."
---
11. Add i18n strings
Files: src/shared/intl/messages.*.ts
New keys:
- person.share.button - "Share"
- person.share.dialog.title - "Share {name}"
- person.share.inviteLink.label - "Invite link"
- person.share.inviteLink.copy - "Copy link"
- person.share.inviteLink.copied - "Copied!"
- person.share.collaborators.title - "Collaborators"
- person.share.collaborators.remove - "Remove"
- person.share.collaborators.empty - "No collaborators yet"
- person.share.requiresPlus - "Sharing requires Plus"
- person.shared.badge - "Shared"
- person.shared.indicator.tooltip - "Shared with you"
- invite.accepting - "Accepting invite..."
- invite.success - "You now have access to {name}"
- invite.error.invalid - "Invalid invite link"
- server.push.collaboratorJoined.title - "New collaborator"
- server.push.collaboratorJoined.body - "{userName} joined {personName}"
---
File Summary
| File | Action |
|------|--------|
| src/app/features/plus.ts | Add useHasPlusAccess() |
| src/shared/tools/person-create.ts | Create with Group owner |
| src/app/features/person-sharing.ts | New - sharing utilities |
| src/app/features/person-share-dialog.tsx | New - share UI |
| src/app/routes/_app.invite.tsx | New - accept invite route |
| src/app/features/person-query.ts | Add $onError: "catch" |
| src/app/routes/_app.people.index.tsx | Filter unauthorized, pass shared flag |
| src/app/features/person-list-item.tsx | Add shared icon |
| src/app/routes/_app.people.$personID.tsx | Share button, unauthorized handling |
| src/app/features/person-details.tsx | Shared badge |
| src/server/features/push-shared.ts | Add collaborator joined notification |
| src/server/features/chat-messages.ts | Update system prompt |
| src/shared/intl/messages.*.ts | Add i18n strings |
---
Order of Implementation
1. useHasPlusAccess() hook
2. Update createPerson() with Group ownership
3. Create person-sharing.ts utilities
4. Create share dialog component
5. Add share button to person details
6. Update people list query + UI for shared indicator
7. Create invite route
8. Add collaborator joined notification
9. Update system prompt
10. Add i18n strings throughout
