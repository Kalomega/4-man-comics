import { NextResponse } from 'next/server';
import { supabaseServer, ensureProfile } from '@/lib/auth';

export async function GET(req) {
  const url = new URL(req.url), code = url.searchParams.get('code');
  const next = url.searchParams.get('next');
  const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  if (code) {
    const sb = await supabaseServer();
    const { data } = await sb.auth.exchangeCodeForSession(code);
    if (data?.user) await ensureProfile(data.user);
  }
  return NextResponse.redirect(new URL(dest, process.env.NEXT_PUBLIC_SITE_URL));
}
