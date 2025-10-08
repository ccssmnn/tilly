---
title: "How to Self-Host Tilly"
description: "A complete guide to hosting your own instance of Tilly with full control over your data and infrastructure"
pubDate: "October 7 2025"
tags: ["technical"]
ogImage: "/blog/self-hosting/og.png"
---

Tilly is open source because I believe personal software like this should never hold your data hostage. I also think Tilly feels really good to use, and I want to show how easy it is to run your own instance and migrate your data over.

## Why Self-Host?

You might want to self-host Tilly because:

- **It fits within free tiers**: Vercel, Clerk, and Gemini all have generous free tiers sufficient for personal use
- **You want to learn**: See how easy it can be to deploy a modern web app
- **You are in control**: Run Tilly on your terms, your infrastructure
- **You want to tweak it**: Customize Tilly just for you, e.g. tune `index.css` to get a different style (Tilly is built on shadcn/ui)

## But My Data?

Tilly has both data import and export via JSON (in Settings). You can:

- Export from the official deployment and use your data in development or your own deployment (I use this myself for debugging)
- Move your data between instances anytime
- Come back to the official version whenever you want (I'd love that 😊)

No lock-in, ever.

## What You'll Need

To deploy Tilly exactly as I do, you'll need:

- **GitHub account** - To fork the repository
- **Vercel account** - For deployment, you can use other platforms as well. Many support Astro. Vercel is what I use.
- **Clerk account** - For authentication (I also use Clerk for payments, but payments can be disabled via env variable)
- **Google Cloud account** - For Gemini AI API key
- **Jazz Cloud account** - For encrypted sync storage
- **A domain** - Or subdomain for your instance

Tilly is a single Astro project with everything in one place, making it easy to understand and deploy. All these services have free tiers that are more than sufficient for personal use.

## Deployment Steps

### 1. Fork the Repository

Go to [github.com/ccssmnn/tilly](https://github.com/ccssmnn/tilly) and fork the repository to your account.

### 2. Set Up Clerk

1. Create a free account at [clerk.com](https://clerk.com)
2. Create a new application and configure it for your domain/subdomain
3. Retrieve your API keys (publishable and secret)

### 3. Get Google Gemini API Key

1. Create a Google Cloud account if you don't have one
2. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Create a Gemini API key

### 4. Set Up Jazz Cloud

1. Sign up at [jazz.tools](https://jazz.tools)
2. Create a new project
3. Get your sync server URL and worker credentials

### 5. Deploy to Vercel

1. Create a Vercel account
2. Create a new project and import your forked repository
3. Add all environment variables (see `.env.example` or the Astro config file for all required variables):
   - Clerk keys
   - Google Gemini API key
   - Jazz Cloud credentials
   - VAPID keys for push notifications (generate with `npx web-push generate-vapid-keys`)
   - Set `PUBLIC_ENABLE_PAYWALL=false` to skip subscription checks in the UI and on the server
   - Configure `WEEKLY_BUDGET` and AI token costs as you prefer

Weekly usage limits will be enforced, but the subscription check is skipped when the paywall is disabled.

### 6. Configure Your Domain

Set up your domain or subdomain in Vercel's project settings.

### 7. Deploy

Hit deploy! Vercel will build and deploy your Tilly instance.

### 8. (Optional) Import Your Data

If you're using the official Tilly deployment, you can export all your data as JSON and import it into your self-hosted instance. This works in both directions, you can always move your data back if needed (please do 😊).

## Bonus: Skip Website

If you don't want to land on the marketing or blog sites when visiting your instance, you can configure `vercel.json` to redirect traffic. By default, Vercel serves everything, but you can configure it to only serve the PWA (`/app`) and API routes (`/api`).

Check the `vercel.json` file in the repository to see the current configuration and adjust the rewrites as needed.

---

That's it! You now have your own Tilly instance with full control over your data. The entire setup takes maybe 30 minutes, and you can always move your data between instances using JSON export/import.

Self-hosting Tilly is genuinely easy, and I want to keep it that way. If you run into issues, open an issue on [GitHub](https://github.com/ccssmnn/tilly). I'm happy to help.
