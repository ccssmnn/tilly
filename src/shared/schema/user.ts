import { Group, co, z, type ResolveQuery } from "jazz-tools"
import { isBefore, isToday } from "date-fns"

export {
	isDeleted,
	isPermanentlyDeleted,
	isDueToday,
	sortByDueAt,
	sortByCreatedAt,
	sortByUpdatedAt,
	sortByDeletedAt,
	hasDueReminders,
}

export let PushDevice = z.object({
	isEnabled: z.boolean(),
	deviceName: z.string(),
	endpoint: z.string(),
	keys: z.object({
		p256dh: z.string(),
		auth: z.string(),
	}),
})

export let NotificationSettings = co.map({
	version: z.literal(1),
	timezone: z.string().optional(),
	notificationTime: z.string().optional(),
	lastDeliveredAt: z.date().optional(),
	pushDevices: z.array(PushDevice),
})

export let Assistant = co.map({
	version: z.literal(1),
	stringifiedMessages: co.list(z.string()),
	submittedAt: z.date().optional(),
	abortRequestedAt: z.date().optional(),
	clearChatHintDismissedAt: z.date().optional(),
	notificationCheckId: z.string().optional(),
	notificationAcknowledgedId: z.string().optional(),
	notifyOnComplete: z.boolean().optional(),
	errorMessage: z.string().optional(),
})

export let UsageTracking = co.map({
	version: z.literal(5),
	userId: z.string(),
	weeklyPercentUsed: z.number().optional(),
	resetDate: z.date(),
})

export let Note = co.map({
	version: z.literal(1),
	title: z.string().optional(),
	content: z.string(),
	images: co.list(co.image()).optional(),
	imageCount: z.number().optional(),
	pinned: z.boolean().optional(),
	deletedAt: z.date().optional(),
	permanentlyDeletedAt: z.date().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

export let Reminder = co.map({
	version: z.literal(1),
	text: z.string(),
	dueAtDate: z.string(),
	repeat: z
		.object({
			interval: z.number().min(1),
			unit: z.enum(["day", "week", "month", "year"]),
		})
		.optional(),
	done: z.boolean(),
	deletedAt: z.date().optional(),
	permanentlyDeletedAt: z.date().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

export let Person = co.map({
	version: z.literal(1),
	name: z.string(),
	summary: z.string().optional(),
	avatar: co.image().optional(),
	notes: co.list(Note),
	inactiveNotes: co.list(Note).optional(),
	reminders: co.list(Reminder),
	inactiveReminders: co.list(Reminder).optional(),
	deletedAt: z.date().optional(),
	permanentlyDeletedAt: z.date().optional(),
	createdAt: z.date(),
	updatedAt: z.date(),
})

export let UserProfile = co.profile({
	name: z.string(),
})

export let Settings = co.map({
	version: z.literal(1),
})

export let UserAccountRoot = co.map({
	people: co.list(Person),
	inactivePeople: co.list(Person).optional(),
	notificationSettings: NotificationSettings.optional(),
	usageTracking: UsageTracking.optional(),
	language: z.enum(["de", "en"]).optional(),
	assistant: Assistant.optional(),
	migrationVersion: z.number().optional(),
})

export let UserAccount = co
	.account({
		profile: UserProfile,
		root: UserAccountRoot,
	})
	.withMigration(async account => {
		console.log("[Jazz]: Running migration...")
		initializeRootIfUndefined(account)
		initializeProfileIfUndefined(account)

		// Only run v1 migration if not already done
		if (
			account.root?.$isLoaded &&
			(!account.root.migrationVersion || account.root.migrationVersion < 1)
		) {
			await runMigrationV1(account)
			account.root.$jazz.set("migrationVersion", 1)
		}
	})

let migrationResolveQuery = {
	notificationSettings: true,
	people: { $each: { reminders: { $each: true }, notes: { $each: true } } },
} satisfies ResolveQuery<typeof UserAccountRoot>

function initializeRootIfUndefined(
	account: Parameters<Parameters<typeof UserAccount.withMigration>[0]>[0],
) {
	if (account.root === undefined) {
		let deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
		account.$jazz.set(
			"root",
			UserAccountRoot.create({
				people: co.list(Person).create([]),
				inactivePeople: co.list(Person).create([]),
				notificationSettings: NotificationSettings.create({
					version: 1,
					timezone: deviceTimezone,
					notificationTime: "12:00",
					pushDevices: [],
				}),
				language: navigator.language.startsWith("de") ? "de" : "en",
				assistant: Assistant.create({
					version: 1,
					stringifiedMessages: co.list(z.string()).create([]),
					notifyOnComplete: true,
				}),
				migrationVersion: 1,
			}),
		)
	}
}

function initializeProfileIfUndefined(
	account: Parameters<Parameters<typeof UserAccount.withMigration>[0]>[0],
) {
	if (account.profile === undefined) {
		let group = Group.create()
		group.addMember("everyone", "reader")
		account.$jazz.set(
			"profile",
			UserProfile.create({ name: "Anonymous" }, group),
		)
	}
}

async function runMigrationV1(
	account: Parameters<Parameters<typeof UserAccount.withMigration>[0]>[0],
) {
	console.log("[Jazz]: Running migration v1...")

	let { root } = await account.$jazz.ensureLoaded({
		resolve: {
			root: migrationResolveQuery,
		},
	})

	// Initialize inactive arrays if they don't exist
	if (root.$isLoaded && !root.inactivePeople) {
		root.$jazz.set("inactivePeople", co.list(Person).create([]))
	}

	let thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

	// Process people and move to inactive if deleted
	let peopleToRemove: number[] = []
	for (let i = 0; i < root.people.length; i++) {
		let person = root.people[i]
		if (!person) continue

		// Initialize inactive arrays for this person if needed
		if (!person.inactiveReminders) {
			person.$jazz.set("inactiveReminders", co.list(Reminder).create([]))
		}
		if (!person.inactiveNotes) {
			person.$jazz.set("inactiveNotes", co.list(Note).create([]))
		}

		// Handle permanently deleted person (>30 days)
		if (
			person.deletedAt &&
			!person.permanentlyDeletedAt &&
			person.deletedAt < thirtyDaysAgo
		) {
			person.$jazz.set("permanentlyDeletedAt", person.deletedAt)
		}

		// Remove permanently deleted people from array
		if (person.permanentlyDeletedAt) {
			peopleToRemove.push(i)
			continue
		}

		// Move deleted person to inactivePeople
		if (person.deletedAt && root.inactivePeople?.$isLoaded) {
			root.inactivePeople.$jazz.push(person)
			peopleToRemove.push(i)
			continue
		}

		// Process reminders for this person
		let remindersToRemove: number[] = []
		for (let j = 0; j < person.reminders.length; j++) {
			let reminder = person.reminders[j]
			if (!reminder) continue

			// Mark old deleted items as permanent
			if (
				reminder.deletedAt &&
				!reminder.permanentlyDeletedAt &&
				reminder.deletedAt < thirtyDaysAgo
			) {
				reminder.$jazz.set("permanentlyDeletedAt", reminder.deletedAt)
			}

			// Remove permanently deleted reminders
			if (reminder.permanentlyDeletedAt) {
				remindersToRemove.push(j)
				continue
			}

			// Move done or deleted reminders to inactive
			if (
				(reminder.done || reminder.deletedAt) &&
				person.inactiveReminders?.$isLoaded
			) {
				person.inactiveReminders.$jazz.push(reminder)
				remindersToRemove.push(j)
			}
		}

		// Remove in reverse order to maintain indices
		if (person.reminders.$isLoaded) {
			for (let j = remindersToRemove.length - 1; j >= 0; j--) {
				person.reminders.$jazz.splice(remindersToRemove[j], 1)
			}
		}

		// Process notes for this person
		let notesToRemove: number[] = []
		for (let j = 0; j < person.notes.length; j++) {
			let note = person.notes[j]
			if (!note) continue

			// Mark old deleted items as permanent
			if (
				note.deletedAt &&
				!note.permanentlyDeletedAt &&
				note.deletedAt < thirtyDaysAgo
			) {
				note.$jazz.set("permanentlyDeletedAt", note.deletedAt)
			}

			// Remove permanently deleted notes
			if (note.permanentlyDeletedAt) {
				notesToRemove.push(j)
				continue
			}

			// Move deleted notes to inactive
			if (note.deletedAt && person.inactiveNotes?.$isLoaded) {
				person.inactiveNotes.$jazz.push(note)
				notesToRemove.push(j)
			}
		}

		// Remove in reverse order to maintain indices
		if (person.notes.$isLoaded) {
			for (let j = notesToRemove.length - 1; j >= 0; j--) {
				person.notes.$jazz.splice(notesToRemove[j], 1)
			}
		}
	}

	// Remove people in reverse order to maintain indices
	if (root.people.$isLoaded) {
		for (let i = peopleToRemove.length - 1; i >= 0; i--) {
			root.people.$jazz.splice(peopleToRemove[i], 1)
		}
	}

	console.log("[Jazz]: Migration v1 complete")
}

function isDeleted(item: {
	deletedAt?: Date
	permanentlyDeletedAt?: Date
}): boolean {
	return item.permanentlyDeletedAt !== undefined || item.deletedAt !== undefined
}

function isPermanentlyDeleted(item: { permanentlyDeletedAt?: Date }): boolean {
	return item.permanentlyDeletedAt !== undefined
}

function isDueToday(reminder: { dueAtDate: string }): boolean {
	let dateToCheck = new Date(reminder.dueAtDate)
	return isToday(dateToCheck) || isBefore(dateToCheck, new Date())
}

function sortByDueAt<T extends { dueAtDate: string }>(arr: Array<T>): Array<T> {
	return arr.sort((a, b) => {
		return new Date(a.dueAtDate).getTime() - new Date(b.dueAtDate).getTime()
	})
}

function sortByCreatedAt<
	T extends {
		createdAt?: Date
		$jazz: {
			createdAt: number
		}
	},
>(arr: Array<T>): Array<T> {
	return arr.sort((a, b) => {
		let aTime = (a.createdAt || new Date(a.$jazz.createdAt)).getTime()
		let bTime = (b.createdAt || new Date(b.$jazz.createdAt)).getTime()
		return bTime - aTime
	})
}

function sortByUpdatedAt<
	T extends {
		updatedAt?: Date
		createdAt?: Date
		$jazz: {
			lastUpdatedAt: number
			createdAt: number
		}
	},
>(arr: Array<T>): Array<T> {
	return arr.sort((a, b) => {
		let aTime = (
			a.updatedAt ||
			a.createdAt ||
			new Date(a.$jazz.lastUpdatedAt || a.$jazz.createdAt)
		).getTime()
		let bTime = (
			b.updatedAt ||
			b.createdAt ||
			new Date(b.$jazz.lastUpdatedAt || b.$jazz.createdAt)
		).getTime()
		return bTime - aTime
	})
}

function sortByDeletedAt<
	T extends {
		deletedAt?: Date
		updatedAt?: Date
		createdAt?: Date
		$jazz: {
			lastUpdatedAt: number
			createdAt: number
		}
	},
>(arr: Array<T>): Array<T> {
	return arr.sort((a, b) => {
		let aTime =
			a.deletedAt?.getTime() ??
			(
				a.updatedAt ||
				a.createdAt ||
				new Date(a.$jazz.lastUpdatedAt || a.$jazz.createdAt)
			).getTime()
		let bTime =
			b.deletedAt?.getTime() ??
			(
				b.updatedAt ||
				b.createdAt ||
				new Date(b.$jazz.lastUpdatedAt || b.$jazz.createdAt)
			).getTime()
		return bTime - aTime
	})
}

function hasDueReminders(person: {
	reminders?: {
		$isLoaded?: boolean
		values?: () => Array<{ done?: boolean; dueAtDate?: string }>
	}
}): boolean {
	if (!person.reminders || !person.reminders.$isLoaded) return false
	for (let reminder of person.reminders.values?.() || []) {
		if (!reminder.done && isDueToday(reminder as { dueAtDate: string })) {
			return true
		}
	}
	return false
}
