export function GET() {
  return Response.json({
    ok: true,
    service: 'bapto-vercel-api',
    runtime: 'nodejs',
    facebookConfigured: Boolean(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
    supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
}
