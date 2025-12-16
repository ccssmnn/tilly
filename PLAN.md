# Swipe Gestures Implementation Plan

## Overview

Add iOS-style swipe gestures to list items for touch devices while keeping dropdown functionality for all devices. Swipe gestures reveal action buttons; swiping all the way triggers the primary action.

## Swipe Actions Summary

### Non-deleted Items

| Item Type | Swipe Left | Swipe Right (Primary) | Swipe Right (Secondary) |
|-----------|------------|----------------------|-------------------------|
| **Note** | Delete (red) | Pin/Unpin (blue) | Edit |
| **Reminder** | Delete (red) | Mark Done/Undone (green) | Edit |
| **Person** | Delete (red) | Add Note (blue) | Add Reminder |

### Deleted Items (Universal)

| Swipe Left | Swipe Right (Primary) |
|------------|----------------------|
| Permanently Delete (red) | Restore (green) |

## Implementation Steps

### Step 1: Create `SwipeableListItem` Component

**File:** `src/shared/ui/swipeable-list-item.tsx`

Create a reusable component based on the reference implementation with:

- Props interface:
  ```typescript
  type SwipeAction = {
    icon: LucideIcon | React.ComponentType
    label: string
    color: string
    onAction: () => void | Promise<void>
  }

  type SwipeableListItemProps = {
    children: React.ReactNode
    leftAction?: SwipeAction           // Single action on swipe left
    rightActions?: {                   // Up to 2 actions on swipe right
      primary: SwipeAction
      secondary?: SwipeAction
    }
    onTap?: () => void                 // Optional tap handler
    disabled?: boolean                 // Disable swipe gestures
    className?: string
  }
  ```

- Adapt the reference implementation:
  - Remove the demo styles, use Tailwind classes
  - Support only 1 action on left side (simplify ActionsGroup for left)
  - Support 1-2 actions on right side (keep ActionsGroup logic for right)
  - Make height flexible (auto height instead of fixed 80px)
  - Integrate with the app's color scheme (use CSS variables)
  - Only enable on touch devices (check `pointer: coarse` media query or pointer events)

### Step 2: Create Swipe Action Configurations

**File:** `src/app/features/swipe-actions.tsx`

Create helper functions/configs for each item type:

```typescript
// Note swipe actions
export function useNoteSwipeActions(note, operations): SwipeableListItemProps["leftAction" | "rightActions"]

// Reminder swipe actions
export function useReminderSwipeActions(reminder, operations): SwipeableListItemProps["leftAction" | "rightActions"]

// Person swipe actions
export function usePersonSwipeActions(person, operations): SwipeableListItemProps["leftAction" | "rightActions"]
```

### Step 3: Update `NoteListItem`

**File:** `src/app/features/note-list-item.tsx`

- Wrap `NoteItemContainer` with `SwipeableListItem`
- For non-deleted notes:
  - Left: Delete
  - Right primary: Pin/Unpin (toggle based on current state)
  - Right secondary: Edit (opens edit dialog)
- For deleted notes:
  - Left: Permanently Delete
  - Right primary: Restore
- Keep dropdown functionality (dropdown opens on tap)

### Step 4: Update `ReminderListItem`

**File:** `src/app/features/reminder-list-item.tsx`

- Wrap `ReminderItemContainer` with `SwipeableListItem`
- For active reminders:
  - Left: Delete
  - Right primary: Mark Done
  - Right secondary: Edit (opens edit dialog)
- For done reminders:
  - Left: Delete
  - Right primary: Mark Undone
  - Right secondary: (none or Edit?)
- For deleted reminders:
  - Left: Permanently Delete
  - Right primary: Restore
- Keep dropdown functionality

### Step 5: Update `PersonListItem`

**File:** `src/app/features/person-list-item.tsx`

- Wrap the Link/container with `SwipeableListItem`
- For non-deleted persons:
  - Left: Delete
  - Right primary: Add Note (opens note dialog)
  - Right secondary: Add Reminder (opens reminder dialog)
- For deleted persons:
  - Left: Permanently Delete
  - Right primary: Restore
- **Note:** Tap still navigates to person detail page (not dropdown)
- Need to add operations hook similar to notes/reminders

### Step 6: Add Person Operations Hook

**File:** `src/app/features/person-list-item.tsx`

Create `usePersonItemOperations` hook with:
- `deletePerson()`
- `restore()`
- `deletePermanently()`
- `addNote()` - opens dialog
- `addReminder()` - opens dialog

### Step 7: Add Touch Detection Utility

**File:** `src/app/lib/utils.ts`

Add utility to detect touch devices:
```typescript
export function isTouchDevice(): boolean
// or use a hook: useIsTouchDevice()
```

The swipe component should:
- Enable swipe gestures only on touch devices
- On non-touch devices, still render children but without swipe functionality

## Technical Considerations

1. **Motion/React Integration**: The app already uses `motion/react` (see imports in existing files)

2. **Gesture Conflicts**:
   - Swipe gestures should not interfere with scrolling
   - Use `touch-action: pan-y` to allow vertical scrolling
   - Only capture horizontal swipes

3. **Animation Performance**:
   - Use `useSpring` for smooth animations
   - Use `transform` and `opacity` for GPU-accelerated animations

4. **Accessibility**:
   - Swipe actions should also be available via dropdown (for keyboard/screen reader users)
   - The swipe is a shortcut, not the only way to access actions

5. **State Management**:
   - After a swipe action completes, reset the swipe position
   - Handle loading states during async operations

## File Changes Summary

| File | Change Type |
|------|-------------|
| `src/shared/ui/swipeable-list-item.tsx` | **New file** |
| `src/app/features/swipe-actions.tsx` | **New file** (optional, could inline) |
| `src/app/features/note-list-item.tsx` | Modify |
| `src/app/features/reminder-list-item.tsx` | Modify |
| `src/app/features/person-list-item.tsx` | Modify |
| `src/app/lib/utils.ts` | Modify (add touch detection) |

## Testing Checklist

- [ ] Swipe left reveals delete action on all item types
- [ ] Swipe right reveals primary + secondary actions
- [ ] Full swipe triggers primary action
- [ ] Partial swipe (>25%) keeps actions visible, <25% snaps back
- [ ] Deleted items show restore/permanently delete actions
- [ ] Tap still opens dropdown (notes/reminders) or navigates (persons)
- [ ] Works smoothly on iOS Safari
- [ ] Works smoothly on Android Chrome
- [ ] Doesn't interfere with vertical scrolling
- [ ] Desktop users see no swipe UI, only dropdown/click behavior
