export default {
	project: "tilly",
	worktrees: {
		dir: "../tilly.worktrees",
		setup: 'bun "$WORK_SOURCE_ROOT/scripts/work-setup.ts"',
	},
	commands: {
		sync: {
			run: 'bunx jazz-run sync --port "$PORT" --host "$HOST"',
			autoStart: true,
			route: true,
		},
		web: {
			run: 'PUBLIC_JAZZ_SYNC_SERVER="wss://sync.${WORK_WORKSPACE}.tilly.localhost" astro dev --port "$PORT" --host "$HOST"',
			autoStart: true,
			route: true,
		},
	},
}
