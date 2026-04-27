# thread-base

Vue 3 + TypeScript + Bun + Supabase scaffold.

## Prerequisites

- [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- [Supabase CLI](https://supabase.com/docs/guides/cli): `brew install supabase/tap/supabase`
- Docker (for the local Supabase stack)

## Setup

1. Install dependencies:
   ```sh
   bun install
   ```
2. Start the local Supabase stack (downloads Docker images on first run):
   ```sh
   bun run db:start
   ```
3. Copy environment template and fill in values:
   ```sh
   cp .env.example .env.local
   bun run db:status   # prints API URL + anon key
   ```
   Paste the values into `.env.local`.
4. Generate database types:
   ```sh
   bun run db:types
   ```
5. Start the dev server:
   ```sh
   bun run dev
   ```

## Common commands

| Command                                  | Description                        |
| ---------------------------------------- | ---------------------------------- |
| `bun run dev`                            | Vite dev server                    |
| `bun run build`                          | Production build                   |
| `bun run preview`                        | Serve production build locally     |
| `bun run test`                           | Vitest (watch)                     |
| `bun run test:run`                       | Vitest (one-shot)                  |
| `bun run lint`                           | oxlint                             |
| `bun run format`                         | Prettier                           |
| `bun run typecheck`                      | Type-check only                    |
| `bun run db:start` / `db:stop`           | Local Supabase stack               |
| `bun run db:reset`                       | Recreate DB from migrations + seed |
| `bun run db:diff -- -f name`             | Generate migration                 |
| `bun run db:types`                       | Regenerate `src/types/database.ts` |
| `bun run db:link -- --project-ref <ref>` | Link remote project                |
| `bun run db:push`                        | Push migrations to remote          |

See `CLAUDE.md` for architectural rules and conventions.

## Coming later

- Login / signup / password-reset views
- Capacitor (mobile apps)
- CI/CD
