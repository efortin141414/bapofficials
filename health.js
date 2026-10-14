export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    service: 'bapto-vercel-api',
    facebookConfigured: Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
  });
}
