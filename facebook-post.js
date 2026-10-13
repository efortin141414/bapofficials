module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Admin authentication is required.' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const GRAPH_BASE = process.env.FACEBOOK_GRAPH_BASE || 'https://graph.facebook.com';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Server Supabase environment variables are not configured.' });
  }
  if (!PAGE_ID || !PAGE_TOKEN) {
    return res.status(503).json({ error: 'Facebook Page automation is not configured in Vercel Environment Variables.' });
  }

  try {
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    });
    if (!userResponse.ok) {
      return res.status(401).json({ error: 'Your admin session is invalid or expired.' });
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
    if (!profileResponse.ok || !Array.isArray(profiles) || profiles[0]?.role !== 'master_admin') {
      return res.status(403).json({ error: 'Only the Master Admin can publish automatically to Facebook.' });
    }

    const body = req.body || {};
    const title = String(body.title || 'BAP Technical Officials Update').trim();
    const message = String(body.message || '').trim();
    const link = /^https:\/\//i.test(String(body.link || '')) ? String(body.link) : '';
    const image = /^https:\/\//i.test(String(body.image_url || '')) ? String(body.image_url) : '';
    const caption = [title, message, link].filter(Boolean).join('\n\n').slice(0, 60000);

    const endpoint = image
      ? `${GRAPH_BASE}/${PAGE_ID}/photos`
      : `${GRAPH_BASE}/${PAGE_ID}/feed`;

    const params = new URLSearchParams();
    params.set('access_token', PAGE_TOKEN);
    if (image) {
      params.set('url', image);
      params.set('caption', caption);
    } else {
      params.set('message', caption);
      if (link) params.set('link', link);
    }

    const fbResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await fbResponse.json();

    if (!fbResponse.ok) {
      return res.status(502).json({
        error: data?.error?.message || 'Facebook rejected the post.',
        facebook_error: data?.error || data
      });
    }

    return res.status(200).json({ ok: true, id: data.post_id || data.id || null });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Facebook publishing failed.' });
  }
};
