# UUID-Auth — DB + Auth-Backend Design

**Date:** 2026-04-27
**Status:** Approved (design phase)
**Scope:** Datenbank-Tabelle `public.users` + Trigger + RLS-Policies, sodass Supabase Auth `auth.users` und unsere App-Tabelle automatisch synchron hält. Frontend-Flows (Erstbesuch, Login-mit-UUID) sind **nicht** Teil dieser Iteration.

## Hintergrund

Das Produkt soll ohne klassischen Email/Passwort-Login auskommen. Identität wird durch eine UUID repräsentiert, die der Browser entweder beim ersten Besuch erzeugt oder die der User manuell eingibt. Damit Supabase RLS funktioniert, brauchen wir trotzdem ein echtes JWT pro Session.

**Gewählter Auth-Mechanismus** (entschieden im Brainstorming):

- Synthetisches Email/Passwort-Mapping: `email = "<uuid>@thread-base.local"`, `password` deterministisch aus der UUID abgeleitet.
- Supabase Auth übernimmt JWT-Ausstellung, Refresh, Session-Persistence.
- Die UUID ist gleichzeitig Identifier *und* Geheimnis — wer die UUID kennt, ist eingeloggt.

Diese Spec beschreibt das DB-Fundament, auf dem dieser Mechanismus aufsetzt. Die Frontend-Integration (signUp/signIn-Aufrufe, UI für UUID-Eingabe) wird in einer eigenen Spec/Iteration designed.

## Goals

- `public.users` als kanonische App-User-Tabelle, 1:1 verknüpft mit `auth.users` über die UUID
- Automatisches Anlegen einer `public.users`-Zeile, sobald ein `auth.users`-Eintrag entsteht
- RLS so, dass jeder User nur seine eigene Zeile lesen/updaten kann
- Generierte TypeScript-Typen in `src/types/database.ts` aktualisiert und committed

## Non-Goals

- Keine Frontend-Änderungen (`src/stores/auth.ts`, `composables/useAuth.ts`, `router/guards.ts`, Views bleiben unverändert)
- Keine Login-/Welcome-Views
- Kein Auto-SignUp-Flow beim ersten Besuch
- Kein "Switch User per UUID"-UI
- Keine Anpassung an `supabase/config.toml` — `enable_confirmations = false` ist bereits gesetzt, SMTP ist lokal eh deaktiviert

## Auth-Konfiguration

`supabase/config.toml` bleibt unverändert. Relevante bestehende Werte:

- `[auth.email] enable_signup = true` — App-Code kann via `signUp` neue Auth-User anlegen
- `[auth.email] enable_confirmations = false` — keine Bestätigungs-Mail nötig, neuer User ist sofort aktiv
- Keine `[auth.email.smtp]`-Konfiguration aktiv — lokal landen Mails in Inbucket, im Remote-Projekt müsste SMTP nur konfiguriert werden, wenn echte Mails gesendet werden sollen (für unseren Flow nicht notwendig)

## Schema

Eine neue Migration:

```sql
-- public.users mirror of auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
```

**Spalten-Begründung:**

- `id uuid PK REFERENCES auth.users(id) ON DELETE CASCADE` — identische ID wie in `auth.users`. Wenn ein Auth-User gelöscht wird, geht die App-Zeile mit. Andere Tabellen werden zukünftig diese `id` als FK verwenden.
- `name text` (nullable) — App-spezifisches Profilfeld. Initial leer, kann vom User später gesetzt werden.
- `created_at timestamptz NOT NULL DEFAULT now()` — Standard-Audit-Spalte.

Tabellen- und Spaltennamen folgen Postgres-Konvention: lowercase, snake_case, plural.

## RLS-Policies

```sql
create policy "users_select_own"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
```

**Begründung:**

- `to authenticated` schließt anonyme Anfragen sofort aus, bevor die `using`-Bedingung evaluiert wird (Performance + klare Fehlermeldung).
- `(select auth.uid())` statt `auth.uid()` — Supabase-Best-Practice: das Init-Plan-Caching evaluiert den Subquery einmal pro Statement statt einmal pro Zeile.
- Keine `INSERT`-Policy: Inserts erfolgen ausschließlich über den Trigger (siehe unten), der als `security definer` läuft und RLS damit umgeht.
- Keine `DELETE`-Policy: Löschungen passieren nur als Cascade von `auth.users`. App-User können sich (in dieser Iteration) nicht selbst löschen.

## Trigger: auto-create on signup

```sql
create function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
  begin
    insert into public.users (id) values (new.id);
    return new;
  end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**Begründung:**

- `security definer` ist nötig, damit der Trigger `public.users` schreiben darf (Auth-User-Insert läuft in einem anderen Sicherheitskontext).
- `set search_path = ''` ist die Hardening-Empfehlung: voll-qualifizierte Tabellennamen, kein `search_path`-Hijacking.
- Keine Übernahme von `name` aus `auth.users.raw_user_meta_data` — wir setzen aktuell keinen Namen beim signUp und wollen die Schnittstelle minimal halten. Kann später erweitert werden.

## TypeScript-Typen

Nach `bun run db:reset` (oder Apply der Migration auf eine bestehende DB):

```sh
bun run db:types
```

Das überschreibt `src/types/database.ts`. Die Datei wird dann `public.users` mit folgender Form enthalten:

```ts
users: {
  Row: { id: string; name: string | null; created_at: string }
  Insert: { id: string; name?: string | null; created_at?: string }
  Update: { id?: string; name?: string | null; created_at?: string }
  Relationships: [{ foreignKeyName: ...; referencedRelation: 'users'; referencedColumns: ['id']; ... }]
}
```

Migration und regenerierte `database.ts` werden im selben Commit committed.

## Workflow

1. Migration-Datei erstellen (über `bun run db:diff -- -f uuid_auth_users` nach Schema-Änderung im Studio, oder direkt schreiben)
2. `bun run db:reset` — DB neu aufsetzen, Migration anwenden
3. `bun run db:types` — Typen regenerieren
4. Manuelle Verifikation (siehe unten)
5. Commit: Migration + `database.ts`

## Verifikation

Nach Implementierung manuell prüfen:

- [ ] `bun run db:reset` läuft fehlerfrei durch
- [ ] In Studio: `select * from public.users` liefert leeres Result
- [ ] In Studio: `select * from pg_policies where tablename = 'users'` zeigt beide Policies
- [ ] `supabase.auth.signUp({ email: '<test-uuid>@thread-base.local', password: '<test-uuid>' })` erzeugt sowohl eine Zeile in `auth.users` als auch eine in `public.users` mit identischer `id`
- [ ] Mit dem zurückgegebenen JWT: `supabase.from('users').select()` liefert genau die eigene Zeile, keine anderen
- [ ] Ohne JWT (anon): `supabase.from('users').select()` liefert ein leeres Array (RLS blockt)
- [ ] `bun run typecheck` ist grün

## Offene Fragen / Folge-Iterationen

- Frontend: signUp/signIn-Aufrufe, UI für Erstbesuch, UI für Login-mit-UUID, Anzeige der eigenen UUID — eigene Spec
- Pinia-Persist: aktuell nicht nötig, Supabase persistiert die Session selbst — Re-Evaluation, wenn weitere Stores dazukommen
- Spätere Erweiterung: `display_id bigserial` falls eine kurze, menschen-lesbare User-Nummer gebraucht wird