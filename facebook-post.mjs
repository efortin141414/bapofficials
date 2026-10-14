function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export function GET() {
  return json({
    ok: false,
    error: 'Method not allowed. Use POST.'
  }, 405);
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return json({ error: 'Admin authentication is required.' }, 401);
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const GRAPH_BASE = process.env.FACEBOOK_GRAPH_BASE || 'https://graph.facebook.com';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: 'Server Supabase environment variables are not configured.' }, 500);
  }

  if (!PAGE_ID || !PAGE_TOKEN) {
    return json({ error: 'Facebook Page automation is not configured in Vercel Environment Variables.' }, 503);
  }

  try {
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      }
    });

    if (!userResponse.ok) {
      return json({ error: 'Your admin session is invalid or expired.' }, 401);
    }

    const user = await userResponse.json();

    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    const profiles = await profileResponse.json();

    if (
      !profileResponse.ok ||
      !Array.isArray(profiles) ||
      profiles[0]?.role !== 'master_admin'
    ) {
      return json({ error: 'Only the Master Admin can publish automatically to Facebook.' }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const title = String(body.title || 'BAP Technical Officials Update').trim();
    const message = String(body.message || '').trim();
    const link = /^https:\/\//i.test(String(body.link || '')) ? String(body.link) : '';
    const image = /^https:\/\//i.test(String(body.image_url || '')) ? String(body.image_url) : '';
    const caption = [title, message, link].filter(Boolean).join('\n\n').slice(0, 60000);

    const endpoint = image
      ? `${GRAPH_BASE}/${encodeURIComponent(PAGE_ID)}/photos`
      : `${GRAPH_BASE}/${encodeURIComponent(PAGE_ID)}/feed`;

    const params = new URLSearchParams();
    params.set('access_token', PAGE_TOKEN);

    if (image) {
      params.set('url', image);
      params.set('caption', caption);
    } else {
      params.set('message', caption);
      if (link) params.set('link', link);
    }

    const facebookResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await facebookResponse.json().catch(() => ({}));

    if (!facebookResponse.ok) {
      return json({
        error: data?.error?.message || 'Facebook rejected the post.',
        facebook_error: data?.error || data
      }, 502);
    }

    return json({
      ok: true,
      id: data.post_id || data.id || null
    });
  } catch (error) {
    return json({
      error: error?.message || 'Facebook publishing failed.'
    }, 500);
  }
}
