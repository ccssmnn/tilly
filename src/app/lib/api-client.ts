import { hc } from "hono/client"
import type { AppType } from "#server/main"

export const apiClient = hc<AppType>("/api")
