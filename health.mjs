export function GET() {
  return Response.json({
    ok: true,
    service: 'bapto-vercel-api',
    runtime: 'vercel-web-api',
    facebookConfigured: Boolean(
      process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    ),
    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    )
  }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}
