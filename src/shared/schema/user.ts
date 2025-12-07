import { Group, co, z, type ResolveQuery } from "jazz-tools"
import { isBefore, isToday } from "date-fns"
import { cleanupInactiveLists } from "#shared/lib/jazz-list-utils"

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

export let InviteBridge = co.map({
	version: z.literal(1),
	personId: z.string(),
	createdAt: z.date(),
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
		initializeRootIfUndefined(account)
		initializeProfileIfUndefined(account)

		let { root } = await account.$jazz.ensureLoaded({
			resolve: { root: true },
		})

		if (!root.migrationVersion || root.migrationVersion < 1) {
			await runMigrationV1(account)
			root.$jazz.set("migrationVersion", 1)
		}
	})

let migrationResolveQuery = {
	notificationSettings: true,
	inactivePeople: true,
	people: {
		$each: {
			reminders: { $each: true },
			inactiveReminders: true,
			notes: { $each: true },
			inactiveNotes: true,
		},
	},
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
	let { root } = await account.$jazz.ensureLoaded({
		resolve: {
			root: migrationResolveQuery,
		},
	})

	// Initialize inactive lists if missing
	if (!root.inactivePeople) {
		root.$jazz.set("inactivePeople", co.list(Person).create([]))
	}

	for (let person of root.people.values()) {
		if (!person) continue
		if (!person.inactiveReminders) {
			person.$jazz.set(
				"inactiveReminders",
				co.list(Reminder).create([], person.$jazz.owner),
			)
		}
		if (!person.inactiveNotes) {
			person.$jazz.set(
				"inactiveNotes",
				co.list(Note).create([], person.$jazz.owner),
			)
		}
	}

	// Re-load with inactive lists now initialized
	let { root: loadedRoot } = await account.$jazz.ensureLoaded({
		resolve: {
			root: migrationResolveQuery,
		},
	})

	cleanupInactiveLists(loadedRoot.people, loadedRoot.inactivePeople, person => {
		let group = person.$jazz.owner
		if (!(group instanceof Group)) return
		for (let member of group.members) {
			if (member.role !== "admin") {
				group.removeMember(member.account)
			}
		}
	})
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
