import { createClient } from 'jsr:@supabase/supabase-js@2'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'method_not_allowed' },
      { status: 405, headers: corsHeaders },
    )
  }

  let body: { uuid?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json(
      { error: 'invalid_json' },
      { status: 400, headers: corsHeaders },
    )
  }

  const uuid = typeof body.uuid === 'string' ? body.uuid.toLowerCase() : ''
  if (!UUID_REGEX.test(uuid)) {
    return Response.json(
      { error: 'invalid_uuid' },
      { status: 400, headers: corsHeaders },
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'server_misconfigured' },
      { status: 500, headers: corsHeaders },
    )
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin.auth.admin.createUser({
    id: uuid,
    email: `${uuid}@thread-base.local`,
    password: uuid,
    email_confirm: true,
  })

  if (error) {
    return Response.json(
      { error: error.message },
      { status: error.status ?? 500, headers: corsHeaders },
    )
  }

  return Response.json(
    { ok: true, id: data.user!.id },
    { status: 201, headers: corsHeaders },
  )
})