# TypeScript Conventions

## Strict Rules

- **Never use `any`** - infer or define proper types
- **Never use type casts** (`as any`, `as SomeType`) - fix types properly
- No comments unless absolutely necessary

## Declarations

- Use `let` over `const`
- Use `function() {}` over `() => {}` for named functions
- No default exports
- Only export what needs to be exported

## Type Patterns

```ts
// Extract from Jazz schemas
type ReminderData = Parameters<typeof Reminder.create>[0]
type LoadedUser = co.loaded<typeof UserAccount, typeof query>
type Settings = NonNullable<LoadedUser["root"]["settings"]>

// Use tryCatch for async error handling
let result = await tryCatch(someAsyncOperation())
if (!result.ok) return { error: result.error }
```
