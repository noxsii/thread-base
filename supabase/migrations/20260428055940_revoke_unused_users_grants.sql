-- Hide public.users from anon-key callers entirely.
-- RLS already blocked rows for anon, but the schema was still introspectable
-- via PostgREST and pg_graphql because anon retained Supabase's default GRANT
-- on public.*. After this revoke, anon REST/GraphQL calls return permission
-- denied and the table disappears from anonymous schema introspection.
revoke all on table public.users from anon;

-- Defense-in-depth: authenticated never inserts or deletes through the API.
-- Inserts are trigger-only (public.handle_new_user, security definer).
-- Deletes are cascade-only (from auth.users on user removal).
-- Removing these grants gives a clear "permission denied" instead of an
-- RLS-policy violation when something tries to write through the API.
revoke insert, delete on table public.users from authenticated;
