# thread-base

Vue 3 + TypeScript + Bun + Supabase project. Capacitor (mobile) is planned but not yet integrated.

The full design lives in `docs/superpowers/specs/2026-04-27-thread-base-scaffold-design.md`. This file is the working cheat sheet — read the spec when you need the full reasoning.

## Stack (locked-in)

| Concern                   | Choice                                                   | Don't suggest                                   |
| ------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Build                     | Vite                                                     | Webpack, Nuxt (no SSR needed)                   |
| Package manager + runtime | **Bun**                                                  | npm, pnpm, yarn                                 |
| UI                        | Vue 3, Composition API, `<script setup>`                 | Options API                                     |
| Routing                   | Vue Router 4                                             | —                                               |
| State                     | Pinia (composition style)                                | Vuex                                            |
| Styling                   | **Tailwind CSS v4** (`@tailwindcss/vite`)                | Tailwind v3, PostCSS config files               |
| Lint                      | **oxlint**                                               | ESLint (user explicitly chose oxlint for speed) |
| Format                    | Prettier                                                 | —                                               |
| Tests                     | Vitest + `@vue/test-utils`, jsdom env                    | Jest                                            |
| Backend client            | `@supabase/supabase-js` (typed via generated `Database`) | —                                               |
| Backend tooling           | Supabase CLI (Homebrew install)                          | npm-installed CLI                               |

**Tooling preference rule (user feedback):** always use the latest/best stable tool. If you're tempted to fall back to an older option "for stability," flag the tradeoff explicitly first.

## Commands

```sh
bun install                 # install deps

bun run dev                 # Vite dev server
bun run build               # vue-tsc -b && vite build
bun run preview             # serve production build

bun run test                # Vitest watch
bun run test:run            # Vitest one-shot (CI)

bun run lint                # oxlint
bun run lint:fix            # oxlint --fix
bun run format              # prettier --write .
bun run typecheck           # vue-tsc --noEmit

# Supabase (local stack via Docker)
bun run db:start            # supabase start
bun run db:stop             # supabase stop
bun run db:status           # show ports + keys
bun run db:reset            # recreate DB from migrations + seed
bun run db:diff -- -f name  # generate migration from current DB state
bun run db:types            # regenerate src/types/database.ts
bun run db:link -- --project-ref <ref>   # link remote project
bun run db:push             # push migrations to remote
```

## Project layout

```
src/
├── main.ts            # bootstrap: Pinia → auth.initialize() → Router → mount
├── App.vue
├── assets/main.css    # @import "tailwindcss";
├── lib/               # external service clients (Supabase only for now)
│   └── supabase.ts
├── stores/            # Pinia stores
│   └── auth.ts
├── composables/       # Vue-reactive helpers
│   └── useAuth.ts
├── router/
│   ├── index.ts
│   └── guards.ts      # requireAuth
├── types/
│   └── database.ts    # GENERATED — do not hand-edit; regenerate via bun run db:types
└── views/

supabase/              # versioned: config.toml, migrations/, seed.sql
```

Path alias: `@/*` → `src/*` (configured in `tsconfig.app.json` and via `vite-tsconfig-paths`).

## Architectural rules

### Auth

- **Components use `useAuth()`** from `composables/useAuth.ts` — never import `useAuthStore` directly. The Pinia store is an internal implementation detail.
- **`auth.initialize()` runs before `app.mount()`** in `main.ts`. Don't move this — it prevents render flicker and a race with `requireAuth`.
- **Never hardcode `window.location.origin`** in auth redirect URLs. They must be configurable because Capacitor will need a custom URL scheme later.
- **`onAuthStateChange` is subscribed exactly once** (inside `initialize()`). Don't subscribe again in components.

### Service clients

- One shared `supabase` client in `src/lib/supabase.ts`. Don't `createClient()` elsewhere.
- The `Database` generic comes from `src/types/database.ts`. After any schema change, run `bun run db:types` and commit the regenerated file.

### Layer boundaries

- `lib/` — non-Vue service clients
- `composables/` — Vue reactive helpers, return reactive refs/computeds
- `stores/` — Pinia state, internal to feature modules
- `views/` — route-level components
- `components/` — reusable UI (created when needed; not in initial scaffold)

## DB workflow

1. `bun run db:start` — first run pulls Docker images
2. Make schema changes (via SQL editor at the local Studio URL, or by editing migrations directly)
3. `bun run db:diff -- -f my_change` — captures current state as a new migration file
4. `bun run db:types` — regenerates TS types from the local DB
5. Commit migration file + regenerated `database.ts` together
6. `bun run db:push` — apply to remote (after `bun run db:link`)

Never edit `src/types/database.ts` by hand. It will be overwritten.

## Capacitor (planned, not yet integrated)

Constraints to maintain so the future Capacitor add works smoothly:

- **No Node-only APIs in `src/`** — must run in browser/WebView
- **Auth redirect URLs configurable** — Mobile will need `app.threadbase://auth/callback` (or similar) instead of `https://`
- **Router** uses `createWebHistory` for now; may switch to `createWebHashHistory` or use Capacitor deep-link config when Mobile is added

## Environment variables

```
.env.example       # committed, lists required vars
.env.local         # gitignored, real values
```

Required:

- `VITE_SUPABASE_URL` — `http://127.0.0.1:54321` for local, project URL for remote
- `VITE_SUPABASE_ANON_KEY` — printed by `bun run db:status`

## Out of scope (current scaffold)

- Login/signup/password-reset views — coming later
- Application domain schema and features — coming later
- CI/CD, deployment config — coming later
- Capacitor integration — coming later
- Storybook, Playwright — not planned
