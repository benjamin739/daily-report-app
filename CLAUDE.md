# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server with Turbopack (http://localhost:3000). PWA is disabled in dev (see `next.config.ts`).
- `npm run build` — Production build with Turbopack.
- `npm start` — Run the production build.
- `npm run lint` — ESLint (`next/core-web-vitals` + `next/typescript`).

No test framework is configured in this repo.

The `@/*` path alias maps to `./src/*` (see `tsconfig.json`).

## Required environment variables

Set in `.env.local` (see `SETUP.md` for provisioning steps):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — used by the browser client.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used by route handlers via `getServiceClient()`.
- `NOTION_API_KEY`, `NOTION_DATABASE_ID` — used by `src/lib/notion.ts`.

## Architecture

This is a Next.js 15 App Router PWA (React 19, TypeScript, Tailwind v4) for construction foremen to submit daily site reports. It has **no database of its own** — it composes two external services:

- **Supabase** handles authentication and photo storage.
- **Notion** is the canonical store for submitted reports (one Notion page per report).

### Auth and roles

Auth is Supabase email/password. Roles live in `session.user.user_metadata.role` and are one of `"admin"` or `"foreman"`. Routing decisions are made client-side from this metadata:

- `src/app/page.tsx` redirects to `/admin/dashboard` or `/report` based on role.
- `/login` is the foreman entry point; `/admin` is the admin entry point and signs the user out if `role !== "admin"`.
- Foreman accounts are provisioned by admins via `/admin/foremen`, which posts to `/api/admin/foremen` and uses the Supabase **admin** API (`auth.admin.createUser` / `listUsers` / `deleteUser`) — so that route must run with the service role key.

There is no middleware-level route protection; every protected page checks `supabase.auth.getSession()` in a `useEffect` and redirects on its own.

### Supabase client pattern (`src/lib/supabase.ts`)

Two clients, used in different places:

- `supabase` (and `getSupabase()`) — lazy singleton built from the **anon** key. Safe for browser/client components. Exposed as a proxy that lazily resolves `.auth` and `.storage`.
- `getServiceClient()` — a **fresh** client built from `SUPABASE_SERVICE_ROLE_KEY` with `autoRefreshToken`/`persistSession` disabled. Only call this from server route handlers under `src/app/api/**`. Never import it into a `"use client"` file.

### Report submission flow

The `/report` page (`src/app/report/page.tsx`) drives a two-phase submit:

1. For each photo (site pictures + optional sign sheet), POST the file as `multipart/form-data` to `/api/upload-photo`. The handler uploads to the Supabase Storage bucket **`photos`** under `reports/<timestamp>-<rand>.<ext>` and returns `getPublicUrl(...)`. The bucket must be public because Notion embeds the URLs as `external` image blocks.
2. POST the form JSON (with the uploaded URLs) to `/api/submit-report`, which calls `createDailyReport(...)` in `src/lib/notion.ts`.

`createDailyReport` writes the report as a Notion page: structured fields go into page **properties**, while site photos and the sign sheet are appended as **image blocks** in the page body (under `Site Photos` / `Sign Sheet` headings).

### Notion schema coupling

`src/lib/notion.ts` hard-codes the Notion property names — `Name` (title), `Date`, `Project Name`, `Status` (select), `Activity`, `Foreman Name`, `Workers Names`, `Workers Hours`, `Tools`, `Tomorrow's Goal`, `Unforeseen`, `Safety Meeting` (checkbox). Adding or renaming a report field requires changes in **three** places that must stay in sync:

- The `DailyReportData` interface and the `properties` object in `src/lib/notion.ts`.
- The form state / payload in `src/app/report/page.tsx` and the destructuring in `src/app/api/submit-report/route.ts`.
- The Notion database itself (property of the matching type). `SETUP.md` lists the expected types.

Workers are a special case: the form keeps a `WorkerEntry[]` (name, start time, end time), but at submit time it serializes the list into two newline-joined strings — `workersNames` and `workersHours` — because the Notion database stores them as plain text fields. Time math (AM/PM → minutes → `Hh Mm`) is done client-side in `calcHours`.

The `Status` and `Project Name` selects are populated from hard-coded arrays at the top of `src/app/report/page.tsx` (`STATUSES`, `PROJECTS`). `Status` is a Notion `select` property, so any new value added here must also exist as an option in the Notion database.

### Admin dashboard

`/admin/dashboard` fetches `/api/admin/reports`, which queries the Notion database (sorted by `Date` desc, page size 50) and returns the raw `properties` blob. The dashboard renders status badges using a hard-coded color map that must stay in sync with the `STATUSES` list in the report page.

### PWA

`next.config.ts` wraps the config with `next-pwa` (writes service worker to `public/`, disabled in dev). The manifest is at `public/manifest.json` and is referenced from `src/app/layout.tsx`. Supabase Storage hostnames (`*.supabase.co`) are whitelisted in `images.remotePatterns`.

## Conventions

- Pages that need auth are client components (`"use client"`) and gate themselves via `supabase.auth.getSession()` in `useEffect`. Keep this pattern; don't introduce server-side session reads without also wiring up `@supabase/ssr` cookie handling.
- Keep service-role usage server-only. The split between `supabase` and `getServiceClient()` exists so the service key never reaches the client bundle.
- Notion property keys are typed loosely (`children: imageBlocks as any` in `notion.ts`); when adding properties, prefer fixing the type at the call site rather than widening the interface.
