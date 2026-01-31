# Scavenger Hunt App

A mobile-optimized web app for creating and running scavenger hunts. Built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, and **Supabase** (Postgres + Auth).

## Features

- **Admin interface** – Create and manage hunts, cluesets, and clues (auth and admin role required).
- **Team interface** – Join a hunt with a code, solve clues in order, submit answers and media.
- **Auth** – Supabase Auth (magic link). Middleware protects routes; admin routes require an `admin` role.
- **Clue types** – Standard clues, Express Pass (time bonus), Road Block (skip/block).
- **Progress** – Teams see current clue, history, and completion; admins see submissions and progress.

## Prerequisites

- **Node.js 18+** and npm (or yarn/pnpm)
- **Supabase project** – for database and auth

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/jaedynlee/scav.git
cd scav
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get both from the Supabase dashboard: **Project Settings → API**. The app will throw at runtime if these are missing.

### 3. Supabase setup

- Create a Supabase project and run the schema (tables: `hunts`, `clue_sets`, `clues`, `teams`, `team_progress`, `answer_submissions`, `user_roles`, `roles`, etc. as used by the DAOs).
- Enable Email (magic link) auth in **Authentication → Providers**.
- For admin access: ensure a `roles` table (e.g. `name`: `admin`) and `user_roles` linking `auth.users` to roles; the middleware reads `user_roles` joined to `roles` to allow access to `/admin/*`.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/auth` if unauthenticated; after signing in with a magic link, you can use the home page (join code) or, if your user has the admin role, the admin dashboard.

## Developer experience

### Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server (default port 3000, HMR) |
| `npm run build` | Production build |
| `npm start` | Run production server after `build` |
| `npm run lint` | Run Next.js ESLint |

### Path aliases

TypeScript and the app use the `@/` alias for the project root (see `tsconfig.json`). Import from paths like:

- `@/app/supabaseClient`
- `@/lib/dao/hunt`
- `@/lib/models/types`
- `@/components/shared/Button`

### Project structure

```
app/
  admin/              # Admin UI (hunts, cluesets, clues, teams)
  auth/               # Login (magic link), callback, useUserRole
  team/               # Team UI: [teamId], answers
  layout.tsx, page.tsx, globals.css
  supabaseClient.ts   # Single Supabase client

components/
  admin/              # AnswerSubmissions, ImageUpload
  clue/               # ExpressPassCard, RoadBlockCard
  shared/             # Button, Card, Input, Textarea, etc.
  team/               # AnswerInput, ClueDisplay, etc.

lib/
  dao/                # Data access: hunt, clue, team, gameLogic
  models/types.ts     # Hunt, Clue, Team, TeamProgress, etc.
  services/           # teams.ts (and other services)
  utils/              # casing (snake_case ↔ camelCase), format
```

### Data layer

- **Supabase** is the only backend: Postgres + Auth. No separate API server.
- **DAOs** in `lib/dao/` wrap Supabase client calls and use `lib/utils/casing` for snake_case ↔ camelCase with the DB.
- **Types** live in `lib/models/types.ts`; use them in app and DAO code for consistency.

### Auth and routing

- **Middleware** (`middleware.ts`) runs on all app routes. It:
  - Allows `/auth` and `/auth/callback` without a session.
  - For `/admin/*`: requires a session and an `admin` role (via `user_roles` + `roles`).
  - For other routes: requires a valid session (redirects to `/auth` with `redirectTo`).
- **Session** is passed via an `authSession` cookie (set in auth callback). Role is resolved in middleware via Supabase REST (`user_roles` + `roles`).
- **Hooks** – `useUserRole` in `app/auth/hooks/useUserRole.ts` for admin detection in the UI.

### Linting and types

- Run `npm run lint` before committing.
- Use strict TypeScript; fix type errors in the IDE or with `npx tsc --noEmit` if you add a type-check script.

### Local auth testing

1. Use a real email for magic link; open the link from the same origin (e.g. `http://localhost:3000/auth/callback?...`).
2. Ensure your Supabase Auth URL is correct for localhost if you use redirects.
3. Grant yourself the admin role in `user_roles` so you can access `/admin/*`.

## Building for production

```bash
npm run build
npm start
```

Set the same env vars in your hosting (Vercel, etc.) and configure Supabase redirect URLs for your production domain.

## How to use (end users)

### Teams

1. Open the app and sign in (magic link) if prompted.
2. Enter the **join code** from the organizer and click **Join**.
3. You’re taken to the team view: current clue, answer input, media upload if allowed, and progress.
4. Submit answers; correct answers advance the team. Finish all required clues to complete the hunt.

### Admins

1. Sign in with a user that has the **admin** role.
2. Go to **Admin dashboard** (link on home or `/admin/hunts`).
3. **Hunts** – Create hunts, set status (draft → active → completed). Active hunts get a join code; share it with teams.
4. **ClueSets & Clues** – From a hunt, add cluesets and clues. Configure prompt, correct answer, clue type (normal, Express Pass, Road Block), media allowed, and images.
5. **Teams** – From a hunt, view teams and their progress; open a team to see answer submissions and timing.

## Tech stack

- **Next.js 16** – App Router, server/client components
- **React 19** – UI
- **TypeScript** – Strict mode, path alias `@/`
- **Tailwind CSS 4** – Styling
- **Supabase** – Postgres database and Auth (magic link)

## License

ISC
