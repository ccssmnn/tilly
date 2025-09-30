import { Group, co, z, type ResolveQuery } from "jazz-tools"
import { isBefore, isToday } from "date-fns"

export {
	isDeleted,
	isPermanentlyDeleted,
	isDueToday,
	sortByDueAt,
	sortByUpdatedAt,
	sortByDeletedAt,
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
	reminders: co.list(Reminder),
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
	notificationSettings: NotificationSettings.optional(),
	usageTracking: UsageTracking.optional(),
	language: z.enum(["de", "en"]).optional(),
})

export let UserAccount = co
	.account({
		profile: UserProfile,
		root: UserAccountRoot,
	})
	.withMigration(async account => {
		initializeRootIfUndefined(account)
		initializeProfileIfUndefined(account)
		await markOldDeletedItemsAsPermanent(account)
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
				notificationSettings: NotificationSettings.create({
					version: 1,
					timezone: deviceTimezone,
					notificationTime: "12:00",
					pushDevices: [],
				}),
				language: navigator.language.startsWith("de") ? "de" : "en",
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

async function markOldDeletedItemsAsPermanent(
	account: Parameters<Parameters<typeof UserAccount.withMigration>[0]>[0],
) {
	let { root } = await account.$jazz.ensureLoaded({
		resolve: {
			root: migrationResolveQuery,
		},
	})
	if (!root.people) return

	let thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

	for (let person of root.people) {
		if (
			person.deletedAt &&
			!person.permanentlyDeletedAt &&
			person.deletedAt < thirtyDaysAgo
		) {
			person.$jazz.set("permanentlyDeletedAt", person.deletedAt)
		}

		for (let reminder of person.reminders) {
			if (
				reminder.deletedAt &&
				!reminder.permanentlyDeletedAt &&
				reminder.deletedAt < thirtyDaysAgo
			) {
				reminder.$jazz.set("permanentlyDeletedAt", reminder.deletedAt)
			}
		}

		for (let note of person.notes) {
			if (
				note.deletedAt &&
				!note.permanentlyDeletedAt &&
				note.deletedAt < thirtyDaysAgo
			) {
				note.$jazz.set("permanentlyDeletedAt", note.deletedAt)
			}
		}
	}
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
