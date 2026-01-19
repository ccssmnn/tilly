# Move Push Notification Decision to Service Worker

## Goal

Remove reminder-checking logic from server. Instead:

1. Client syncs reminders to SW
2. Server sends "wake" push if past notification time + not delivered today
3. SW decides whether to show notification based on local reminder cache

## Files to Modify

| File                                                 | Changes                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/app/lib/service-worker.ts`                      | Add `SET_REMINDERS` message + `syncRemindersToServiceWorker` fn                |
| `src/app/sw.ts`                                      | Handle `SET_REMINDERS`, reminder cache, check due count, interpolate `{count}` |
| `src/app/main.tsx`                                   | Call `useSyncRemindersToServiceWorker` in `RouterWithJazz`                     |
| `src/server/features/push-cron.ts`                   | Remove `hasDueNotifications`, `getDueReminderCount`, simplify pipeline         |
| `src/server/features/push-shared.ts`                 | Remove `peopleQuery`, remove `count` from payload                              |
| **New:** `src/app/hooks/use-sync-reminders-to-sw.ts` | Hook to watch reminders and sync                                               |

## Implementation

### 1. `src/app/lib/service-worker.ts`

Add message type and sync fn:

```ts
type ReminderData = { id: string; dueAtDate: string }

function syncRemindersToServiceWorker(
	userId: string,
	reminders: ReminderData[],
) {
	if (!navigator.serviceWorker?.controller) return
	navigator.serviceWorker.controller.postMessage({
		type: "SET_REMINDERS",
		userId,
		reminders,
	})
}
```

### 2. `src/app/hooks/use-sync-reminders-to-sw.ts` (new)

```ts
// - useAccount with resolve for people.reminders
// - useUser for userId
// - Extract { id, dueAtDate } for active, non-deleted reminders
// - useEffect: call syncRemindersToServiceWorker on change
```

### 3. `src/app/main.tsx`

In `RouterWithJazz` (inside Jazz provider):

```ts
useSyncRemindersToServiceWorker()
```

### 4. `src/app/sw.ts`

Add reminder cache:

```ts
let REMINDERS_CACHE = "tilly-reminders-v1"

// Handle SET_REMINDERS message
// Store: { [userId]: { id, dueAtDate }[] }

// New fn: getDueReminderCount(userId)
// - Read cache for userId
// - Compare dueAtDate <= today (client timezone)
// - Return count

// Modify validateAuthAndShowNotification:
// - After userId validation
// - let count = getDueReminderCount(userId)
// - if count === 0: suppress
// - else: showNotification with count

// Modify showNotification:
// - Replace {count} in title/body with actual count
```

### 5. `src/server/features/push-cron.ts`

Remove:

- `hasDueNotifications` pipeline step
- `getDueReminderCount` fn
- `peopleQuery` import

Simplify pipeline:

```ts
loadNotificationSettings
  → shouldReceiveNotification
  → getDevices
  → processDevicesPipeline
```

Update `createLocalizedNotificationPayload`:

- Use `{count}` placeholder in text (SW replaces)
- Remove actual count param

### 6. `src/server/features/push-shared.ts`

- Remove `peopleQuery` export
- Remove `count` from `NotificationPayload` type

## Data Flow

```
CLIENT                    SW                         SERVER
  |                       |                            |
  |--SET_REMINDERS------->|                            |
  |  {userId, reminders}  |--store cache               |
  |                       |                            |
  |                       |<------push (userId)--------|
  |                       |                            |
  |                       |--check cache for userId    |
  |                       |--count = getDueReminders() |
  |                       |--if count > 0: show        |
  |                       |--replace {count} in text   |
  |                       |--else: suppress            |
```

## Notes

- Timezone: server checks notification time using `notificationSettings.timezone`, SW uses client's implicit timezone for due date comparison
- Stale cache: acceptable if user offline for days
- Server always sends push if time conditions met (doesn't check reminder count)
