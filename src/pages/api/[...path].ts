import type { APIRoute } from "astro"

import { Hono } from "hono"
import { app } from "../../server/main"

export let ALL: APIRoute = c => new Hono().route("/api", app).fetch(c.request)
