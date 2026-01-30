# ATP: Push Notification Migration

## Prerequisites

- Device with existing push notifications enabled
- Device/browser for new user signup
- Server deployed with new code
- Ability to trigger cron job (`/push/deliver-notifications`)
- Jazz dev tools access
- `CRON_SECRET` from `.env`

## Trigger Cron Job

```bash
curl -X GET http://localhost:4321/api/push/deliver-notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

For local testing:

```bash
curl -X GET http://localhost:4321/api/push/deliver-notifications \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## ATP 1: Existing User Migration

**Goal:** Verify existing users migrate to group-owned settings and continue receiving notifications

### Pre-flight

1. Open Jazz dev tools as existing user with push enabled
2. Note `notificationSettings` owner (should be Account, not Group)

### Steps

| Step | Action                                                  | Expected                                                                                          |
| ---- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1    | Open app                                                | App loads                                                                                         |
| 2    | Check browser console                                   | `[Notifications] Migrating to shareable group` → `Migration complete` → `Registration successful` |
| 3    | Check Jazz dev tools                                    | `notificationSettings` owner is now Group with server as member                                   |
| 4    | Check `root.notificationSettingsRefs` on server account | Entry exists with your `userId`, recent `lastSyncedAt`, link to your settings                     |
| 5    | Verify notification settings UI                         | All previously registered devices still visible                                                   |
| 6    | Trigger cron job                                        | User appears in results, `success: true`                                                          |
| 7    | Receive push notification                               | Notification arrives on device                                                                    |

### Failure indicators

- Console shows `Migration failed` or `Registration failed`
- Devices disappeared from settings
- Server refs list empty or missing user
- Cron returns no results or `success: false`

---

## ATP 2: New User Push Setup

**Goal:** Verify new users can enable push and receive notifications

| Step | Action                                    | Expected                                         |
| ---- | ----------------------------------------- | ------------------------------------------------ |
| 1    | Sign up as new user                       | Account created                                  |
| 2    | Go to Settings → Notifications            | Page loads                                       |
| 3    | Enable push notifications, add device     | Device added, success toast                      |
| 4    | Check console                             | `Registration successful` (no migration message) |
| 5    | Check server's `notificationSettingsRefs` | New user entry exists                            |
| 6    | Trigger cron job                          | New user in results                              |
| 7    | Receive push notification                 | Notification arrives                             |

---

## ATP 3: Re-registration on App Open

**Goal:** Verify `latestReminderDueDate` updates on each app open

| Step | Action                                                                | Expected                                                       |
| ---- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1    | As existing user, create reminder for future date (e.g., 2 weeks out) | Reminder created                                               |
| 2    | Close and reopen app                                                  | App loads                                                      |
| 3    | Check console                                                         | `Registration successful`                                      |
| 4    | Check `notificationSettings` in Jazz dev tools                        | `latestReminderDueDate` matches furthest reminder (YYYY-MM-DD) |
| 5    | Check server ref                                                      | `lastSyncedAt` updated to recent time                          |

---

## ATP 4: Stale Ref Cleanup

**Goal:** Verify inactive users are cleaned up from server refs

| Step | Action                                                                            | Expected                                                              |
| ---- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1    | Register a test user                                                              | User in server refs                                                   |
| 2    | In Jazz dev tools, manually set `lastSyncedAt` to 31+ days ago                    | -                                                                     |
| 3    | Ensure user has no future reminders (or set `latestReminderDueDate` to past date) | -                                                                     |
| 4    | Trigger cron                                                                      | Console shows `Marking stale ref for removal`, user removed from refs |
| 5    | Open app as that user                                                             | Re-registers, back in refs                                            |

---

## Verification Checklist

- [ ] ATP 1: Existing user migration
- [ ] ATP 2: New user setup
- [ ] ATP 3: Re-registration updates
- [ ] ATP 4: Stale cleanup
