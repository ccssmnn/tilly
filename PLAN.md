# Server-Side Push Notification Settings Access

## Goal

Enable the server to access user notification settings directly without needing Clerk credentials, as a step toward removing Clerk dependency for E2E encryption.

## Current State

1. Cron job iterates all Clerk users, extracts `jazzAccountID` + `jazzAccountSecret` from `unsafeMetadata`
2. Per user: Creates a user worker, loads their `NotificationSettings` from their private Jazz data
3. `NotificationSettings` is owned by the user's private group (inherited from `UserAccountRoot`)
4. Server has no access to user data without credentials

## Target State

1. Server maintains a list of notification settings CoValue refs it can access
2. Client shares `NotificationSettings` with server worker on device setup / app start
3. Cron job iterates server's list directly, no Clerk iteration needed

---

## Schema Changes

### 1. `src/shared/schema/server.ts`

```typescript
import { NotificationSettings } from "./user"

let NotificationSettingsRef = co.map({
	notificationSettings: NotificationSettings,
	userId: z.string(), // for debugging
	lastSyncedAt: z.date(),
})

let ServerAccountRoot = co.map({
	notificationSettingsRefs: co.list(NotificationSettingsRef).optional(),
})

let ServerAccount = co.account({
	profile: co.map({ name: z.string() }),
	root: ServerAccountRoot,
})
```

### 2. `src/shared/schema/user.ts`

- Add `language` field to `NotificationSettings`
- Change creation to use its own group (not inherited from root)

---

## New Files

### 3. `src/server/features/push-register.ts`

- POST endpoint receiving `notificationSettingsId`
- Load settings via server worker (server must already be writer on group)
- Upsert ref in server's list (update `lastSyncedAt` if exists, otherwise add)

### 4. `src/app/hooks/use-register-notifications.ts`

- Hook called on app start
- Ensures `NotificationSettings` has proper group (migrates if needed)
- Adds server worker as collaborator to the group
- Calls registration endpoint with notification settings ID

---

## Modified Files

### 5. `src/app/features/notification-settings.tsx`

- After `addPushDevice`: trigger registration (can reuse the hook or call directly)

### 6. `src/server/features/push-cron.ts`

- Remove Clerk iteration entirely
- Iterate `notificationSettingsRefs` from server root
- Filter out refs with `lastSyncedAt` > 30 days (and remove them from list)
- Read language from `NotificationSettings.language`

---

## Migration Logic

When existing `NotificationSettings` doesn't have a shareable group (in `use-register-notifications.ts`):

1. Get existing group via `notificationSettings.$jazz.owner`
2. If group is user's private group (not shareable), create new group with user as owner
3. Add server worker as writer to group (using server account ID from env)
4. Create new `NotificationSettings` with that group, copy all data including new `language` field
5. Update `UserAccountRoot.notificationSettings` to point to new one

Detecting if group is shareable: Check if `group.id` starts with `co_z` (Group) vs account ID pattern.

---

## Implementation Order

1. [x] Update `NotificationSettings` schema to add `language` field
2. [x] Update `ServerAccount` schema with `NotificationSettingsRef` and root
3. [x] Create `push-register.ts` endpoint
4. [x] Create `use-register-notifications.ts` hook with migration logic
5. [x] Update `notification-settings.tsx` to trigger registration after device setup
6. [x] Refactor `push-cron.ts` to use server list instead of Clerk
7. [ ] Test migration path for existing users
8. [ ] Test new user flow
