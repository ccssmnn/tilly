import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

let blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.string(),
		tags: z.array(z.string()),
		ogImage: z.string().optional(),
	}),
})

export let collections = { blog }
