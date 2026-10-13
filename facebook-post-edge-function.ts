// Copy this entire file into Supabase Dashboard -> Edge Functions -> Deploy a new function -> Via Editor
// Function name: facebook-post

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method === 'GET') {
    return response({
      ok: true,
      service: 'bapto-facebook-post',
      platform: 'supabase-edge-functions',
      facebookConfigured: Boolean(
        Deno.env.get('FACEBOOK_PAGE_ID') && Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN')
      ),
    })
  }

  if (req.method !== 'POST') return response({ error: 'Method not allowed.' }, 405)

  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '')
  if (!jwt) return response({ error: 'Admin authentication is required.' }, 401)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const PAGE_ID = Deno.env.get('FACEBOOK_PAGE_ID') || ''
  const PAGE_TOKEN = Deno.env.get('FACEBOOK_PAGE_ACCESS_TOKEN') || ''
  const GRAPH_BASE = Deno.env.get('FACEBOOK_GRAPH_BASE') || 'https://graph.facebook.com'

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return response({ error: 'Supabase server environment is not available to the Edge Function.' }, 500)
  }
  if (!PAGE_ID || !PAGE_TOKEN) {
    return response({ error: 'Facebook Page ID or Page Access Token is missing from Supabase Edge Function secrets.' }, 503)
  }

  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${jwt}` },
    })
    if (!userRes.ok) return response({ error: 'Your admin session is invalid or expired.' }, 401)
    const user = await userRes.json()

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      {
        headers: {
          apikey: SERVICE_ROLE,
          Authorization: `Bearer ${SERVICE_ROLE}`,
          Accept: 'application/json',
        },
      },
    )
    const profiles = await profileRes.json().catch(() => [])
    if (!profileRes.ok || !Array.isArray(profiles) || profiles[0]?.role !== 'master_admin') {
      return response({ error: 'Only the Master Admin can publish automatically to Facebook.' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const title = String(body.title || 'BAP Technical Officials Update').trim()
    const message = String(body.message || '').trim()
    const link = /^https:\/\//i.test(String(body.link || '')) ? String(body.link) : ''
    const imageUrl = /^https:\/\//i.test(String(body.image_url || '')) ? String(body.image_url) : ''
    const caption = [title, message, link].filter(Boolean).join('\n\n').slice(0, 60000)

    const endpoint = imageUrl
      ? `${GRAPH_BASE}/${encodeURIComponent(PAGE_ID)}/photos`
      : `${GRAPH_BASE}/${encodeURIComponent(PAGE_ID)}/feed`

    const params = new URLSearchParams()
    params.set('access_token', PAGE_TOKEN)
    if (imageUrl) {
      params.set('url', imageUrl)
      params.set('caption', caption)
    } else {
      params.set('message', caption)
      if (link) params.set('link', link)
    }

    const fbRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const fbData = await fbRes.json().catch(() => ({}))

    if (!fbRes.ok) {
      return response({
        error: fbData?.error?.message || 'Facebook rejected the post.',
        facebook_error: fbData?.error || fbData,
      }, 502)
    }

    return response({ ok: true, id: fbData.post_id || fbData.id || null })
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Facebook publishing failed.' }, 500)
  }
})
