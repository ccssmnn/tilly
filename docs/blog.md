# Blog Posts

## Structure

```
src/content/blog/{slug}/
  en.md
  de.md
public/blog/{slug}/
  og.png
```

## Frontmatter

```yaml
---
title: "Post Title"
description: "Meta description"
pubDate: "October 7 2025"
tags: ["technical"]
ogImage: "/blog/post-slug/og.png" # Optional
---
```

## OG Images

```bash
bun scripts/og.tsx \
  --heading="Title" \
  --tagline="Tagline" \
  --out=public/blog/slug/og.png
```

Images are 1200x630px. Use short, punchy text.
