import { co, z } from "jazz-tools"

export let ServerAccount = co.account({
	profile: co.map({ name: z.string() }),
	root: co.map({}),
})
