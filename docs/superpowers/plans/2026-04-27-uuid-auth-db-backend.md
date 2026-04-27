# UUID-Auth — DB Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Wichtig:** Der User hat eine projektweite Regel — **keine `git commit`-Schritte ohne explizite Freigabe**. Dieser Plan stoppt nach erfolgreicher Verifikation und übergibt dem User den staged-but-uncommitted Zustand. Niemals selbst committen.

**Goal:** Datenbank-Fundament für UUID-Auth aufsetzen — `public.users`-Tabelle synchronisiert per Trigger mit `auth.users`, RLS-Policies erlauben jedem User nur Zugriff auf die eigene Zeile.

**Architecture:** Eine einzelne Supabase-Migration erstellt die Tabelle, zwei RLS-Policies (`select_own`, `update_own`) und einen `AFTER INSERT`-Trigger auf `auth.users`. Der Trigger ist `SECURITY DEFINER` mit `search_path = ''`. Verifikation erfolgt über Schema-Introspection (psql) und einen End-to-End-signUp-Test gegen die lokale Auth-API (curl + psql).

**Tech Stack:** Supabase CLI (Postgres 17 lokal via Docker), `@supabase/supabase-js`, Bun, vue-tsc, psql, curl, jq.

**Spec:** `docs/superpowers/specs/2026-04-27-uuid-auth-design.md`

**Files:**
- Create: `supabase/migrations/<timestamp>_uuid_auth_users.sql` (Timestamp wird vom Supabase CLI vergeben)
- Modify (regenerate): `src/types/database.ts`

---

### Task 1: Pre-Flight — Lokaler Supabase-Stack läuft

**Files:** keine

- [ ] **Schritt 1: Status prüfen**

Run: `bun run db:status`

Expected (wenn Stack läuft): Tabelle mit `API URL`, `DB URL`, `Studio URL`, `JWT secret`, `anon key`, `service_role key`, etc.

Wenn Output stattdessen `supabase local development setup is not running` o.ä.: weiter zu Schritt 2.

- [ ] **Schritt 2: Stack starten (nur wenn Schritt 1 zeigt, dass er nicht läuft)**

Run: `bun run db:start`

Expected: Am Ende ein "Started supabase local development setup" mit der gleichen Tabelle wie in Schritt 1.

---

### Task 2: Empty Migration File erzeugen

**Files:**
- Create: `supabase/migrations/<auto-timestamp>_uuid_auth_users.sql` (leer)

- [ ] **Schritt 1: Migration-Datei via Supabase CLI generieren**

Run: `bunx supabase migration new uuid_auth_users`

Expected: `Created new migration at supabase/migrations/<UTC-timestamp>_uuid_auth_users.sql`. Die Datei ist leer (0 Bytes oder nur Kommentar).

- [ ] **Schritt 2: Den Pfad der neuen Datei festhalten**

Run: `ls -1t supabase/migrations/*_uuid_auth_users.sql | head -1`

Expected: Genau ein Pfad, mit aktuellem UTC-Timestamp am Anfang. Diesen Pfad merken — er wird im nächsten Task befüllt.

---

### Task 3: Migration SQL schreiben

**Files:**
- Modify: `supabase/migrations/<timestamp>_uuid_auth_users.sql` (komplett befüllen)

- [ ] **Schritt 1: Datei vollständig mit folgendem Inhalt überschreiben**

```sql
-- public.users mirrors auth.users — every signUp creates a row here too
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- RLS: User darf nur seine eigene Zeile lesen / aendern
create policy "users_select_own"
  on public.users for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own"
  on public.users for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Inserts: nur via Trigger (security definer); keine policy fuer authenticated
-- Deletes: nur via Cascade von auth.users; keine policy fuer authenticated

-- Trigger: bei jedem neuen auth.users-Eintrag automatisch eine public.users-Zeile anlegen
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

- [ ] **Schritt 2: Datei-Inhalt verifizieren**

Run: `cat supabase/migrations/*_uuid_auth_users.sql | grep -c "create policy"`

Expected: `2`

Run: `cat supabase/migrations/*_uuid_auth_users.sql | grep -c "create trigger"`

Expected: `1`

---

### Task 4: Migration anwenden

**Files:** keine (nur DB-Operation)

- [ ] **Schritt 1: DB resetten und alle Migrationen frisch anwenden**

Run: `bun run db:reset`

Expected: Output durchläuft alle Migrationen in chronologischer Reihenfolge. Letzte Zeilen enthalten `Applying migration <timestamp>_uuid_auth_users.sql...` ohne Fehler. Abschluss mit `Finished supabase db reset on branch main.` oder vergleichbar.

Wenn ein SQL-Fehler erscheint: Output lesen, in der Migration-Datei korrigieren, `bun run db:reset` erneut laufen lassen.

---

### Task 5: Schema-Verifikation via psql

**Files:** keine (nur read-only Queries)

- [ ] **Schritt 1: Connection-String setzen**

Run:
```bash
DB_URL=$(bun run db:status 2>/dev/null | awk -F': +' '/DB URL/ {print $2}')
echo "DB_URL=$DB_URL"
```

Expected: `DB_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres`

- [ ] **Schritt 2: Tabelle `public.users` existiert mit den richtigen Spalten und FK**

Run:
```bash
psql "$DB_URL" -c "\d public.users"
```

Expected: Output zeigt drei Spalten:
- `id` `uuid` `not null`
- `name` `text` (nullable)
- `created_at` `timestamp with time zone` `not null default now()`

Sowie Foreign-Key-Constraint `users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE` und Primary Key auf `id`.

- [ ] **Schritt 3: RLS ist enabled**

Run:
```bash
psql "$DB_URL" -tAc "select relrowsecurity from pg_class where oid = 'public.users'::regclass"
```

Expected: `t`

- [ ] **Schritt 4: Beide Policies existieren**

Run:
```bash
psql "$DB_URL" -c "select policyname, cmd, roles from pg_policies where schemaname='public' and tablename='users' order by policyname"
```

Expected: Genau zwei Zeilen:
- `users_select_own | SELECT | {authenticated}`
- `users_update_own | UPDATE | {authenticated}`

- [ ] **Schritt 5: Trigger und Funktion existieren**

Run:
```bash
psql "$DB_URL" -c "select trigger_name, event_manipulation, event_object_schema, event_object_table from information_schema.triggers where trigger_name='on_auth_user_created'"
```

Expected: Eine Zeile: `on_auth_user_created | INSERT | auth | users`

Run:
```bash
psql "$DB_URL" -tAc "select prosecdef from pg_proc where proname='handle_new_user' and pronamespace = 'public'::regnamespace"
```

Expected: `t` (security definer ist gesetzt)

---

### Task 6: End-to-End — signUp erzeugt Eintrag in beiden Tabellen

**Files:** keine

- [ ] **Schritt 1: Publishable Key und API-URL auslesen**

Run:
```bash
PK=$(bun run db:status 2>/dev/null | awk -F': +' '/Publishable key|anon key/ {print $2; exit}')
API_URL=$(bun run db:status 2>/dev/null | awk -F': +' '/API URL/ {print $2}')
echo "API_URL=$API_URL"
echo "PK=${PK:0:20}..."
```

Expected: `API_URL=http://127.0.0.1:54321` und ein Key, der mit `sb_publishable_` oder `eyJ` (legacy) anfängt.

Wenn `PK` leer ist: `bun run db:status` per Hand inspizieren, Variablennamen anpassen.

- [ ] **Schritt 2: Eine Test-UUID erzeugen und gegen die Auth-API signUp-Aufruf machen**

Run:
```bash
TEST_UUID=$(uuidgen | tr 'A-Z' 'a-z')
echo "TEST_UUID=$TEST_UUID"
curl -s -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $PK" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_UUID@thread-base.local\",\"password\":\"$TEST_UUID\"}" \
  | jq '{ id: .user.id, email: .user.email, has_session: (.session != null) }'
```

Expected: JSON-Output mit `id` gleich `$TEST_UUID`, `email` gleich `<TEST_UUID>@thread-base.local`, `has_session: true`.

Wenn die Antwort einen Fehler enthält (z.B. "Email address ... is invalid"): siehe "Bekannte Stolpersteine" am Ende des Plans.

- [ ] **Schritt 3: `auth.users` hat die neue Zeile**

Run:
```bash
psql "$DB_URL" -tAc "select id, email from auth.users where id = '$TEST_UUID'"
```

Expected: Eine Zeile, `<TEST_UUID>|<TEST_UUID>@thread-base.local`.

- [ ] **Schritt 4: `public.users` hat eine korrespondierende Zeile (Trigger funktioniert)**

Run:
```bash
psql "$DB_URL" -tAc "select id, name, created_at is not null from public.users where id = '$TEST_UUID'"
```

Expected: Eine Zeile, `<TEST_UUID>||t` (`name` ist NULL, `created_at` ist gesetzt).

- [ ] **Schritt 5: Access-Token aus dem signUp-Response holen (für RLS-Check)**

Run:
```bash
ACCESS_TOKEN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $PK" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_UUID@thread-base.local\",\"password\":\"$TEST_UUID\"}" \
  | jq -r '.access_token')
echo "ACCESS_TOKEN=${ACCESS_TOKEN:0:20}..."
```

Expected: Variable enthält ein JWT, das mit `eyJ` beginnt. Wenn `null`: signUp hat (wegen `enable_confirmations = false`) bereits eine Session zurückgegeben, dann statt eines neuen Token-Calls direkt aus dem signUp-Response in Schritt 2 lesen.

- [ ] **Schritt 6: Mit Test-User-JWT genau die eigene Zeile sehen**

Run:
```bash
curl -s "$API_URL/rest/v1/users?select=id" \
  -H "apikey: $PK" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  | jq .
```

Expected: Array mit genau einem Eintrag, `[{"id":"<TEST_UUID>"}]`. Andere User (falls die DB welche enthielte) wären hier nicht zu sehen.

- [ ] **Schritt 7: Ohne JWT (anon) leeres Array**

Run:
```bash
curl -s "$API_URL/rest/v1/users?select=id" \
  -H "apikey: $PK" \
  | jq .
```

Expected: `[]`. Die `to authenticated`-Klausel der Policies sperrt den `anon`-Role komplett aus, sodass PostgREST ein leeres Array statt einer 401 zurückgibt.

- [ ] **Schritt 8: Test-User aufräumen**

Run:
```bash
psql "$DB_URL" -c "delete from auth.users where id = '$TEST_UUID'"
psql "$DB_URL" -tAc "select count(*) from public.users where id = '$TEST_UUID'"
```

Expected nach Delete: Cascade hat zugeschlagen, Count ist `0`. Damit ist auch verifiziert, dass `ON DELETE CASCADE` greift.

- [ ] **Schritt 9: Schritt-Zähler aktualisieren — alle 5 Spec-Verifikationspunkte gedeckt**

Sanity-Check, kein Kommando: Bestätige für dich, dass alle Punkte aus der Spec-Verifikations-Sektion abgehakt sind:
1. db:reset läuft sauber → Task 4
2. signUp erzeugt Zeilen in beiden Tabellen → Schritte 2-4
3. JWT-User sieht nur eigene Zeile → Schritt 6
4. Anon sieht leeres Array → Schritt 7
5. Cascade beim Delete → Schritt 8

---

### Task 7: TypeScript-Typen regenerieren und typecheck

**Files:**
- Modify (regenerate): `src/types/database.ts`

- [ ] **Schritt 1: Typen generieren**

Run: `bun run db:types`

Expected: Kein Konsolen-Output, keine Fehler. `src/types/database.ts` wird überschrieben.

- [ ] **Schritt 2: Generierte Datei enthält `users`-Tabelle**

Run: `grep -A2 "users:" src/types/database.ts | head -10`

Expected: Zeilen, die zeigen, dass innerhalb von `Tables` ein `users`-Eintrag mit `Row`/`Insert`/`Update` existiert. Konkret sollte mindestens `id: string`, `name: string | null`, `created_at: string` zu sehen sein.

- [ ] **Schritt 3: Projektweiter TypeScript-Check**

Run: `bun run typecheck`

Expected: Kein Output, Exit-Code 0. Keine Fehler in `src/`.

- [ ] **Schritt 4: Linter und Tests**

Run: `bun run lint && bun run test:run`

Expected: oxlint findet keine Fehler. Vitest läuft alle bestehenden Tests grün.

---

### Task 8: Hand-Off — User entscheidet über Commit

**Files:** keine

- [ ] **Schritt 1: Status anzeigen**

Run: `git status`

Expected: Zwei Änderungen als untracked/modified:
- `supabase/migrations/<timestamp>_uuid_auth_users.sql` (untracked)
- `src/types/database.ts` (modified)

- [ ] **Schritt 2: NICHT committen**

Stattdessen den User informieren:

> "Implementation fertig und verifiziert. Migration und regenerierte Typen liegen unstaged auf der Platte. Sag Bescheid, wenn ich sie für dich stagen oder committen soll — sonst übernimmst du das selbst."

Der User entscheidet, ob/wie der Commit aussieht. **Niemals proaktiv `git add` oder `git commit` ausführen.**

---

## Bekannte Stolpersteine

- **`bun run db:status`-Parsing**: Das Output-Format kann zwischen CLI-Versionen leicht variieren ("anon key" vs. "Publishable key", Anzahl Leerzeichen). Wenn die awk-Filter in Task 5/6 leer zurückgeben: Output manuell anschauen und Variablennamen anpassen.

- **Email-Validierung**: Sollte `<uuid>@thread-base.local` von Supabase Auth abgewiesen werden (z.B. mit `email_address_invalid`), Alternative-Domain `thread-base.test` oder `example.com` testen. `.local` ist RFC-konform aber manche Validatoren sind strikt. Falls Anpassung nötig: Spec-Update vermerken, weil das Frontend-Mapping davon betroffen sein wird.

- **Doppelter signUp**: Wenn `bunx supabase migration new` versehentlich zweimal lief, gibt es zwei leere `_uuid_auth_users.sql`-Dateien. `ls -1t` nimmt die neueste — die andere löschen, bevor `db:reset` läuft.

- **Port-Konflikte**: `bun run db:start` schlägt fehl, wenn Port 54321/54322/54323 schon belegt sind. `bun run db:stop` zuerst.