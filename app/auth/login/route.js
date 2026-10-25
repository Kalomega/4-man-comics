import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/auth';

// Starts Google sign-in. `next` (a path on this site) is remembered in a cookie and used by /auth/callback.
export async function GET(req) {
  const next = new URL(req.url).searchParams.get('next') || '/';
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` } });
  if (error || !data?.url) return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL));
  const res = NextResponse.redirect(data.url);
  res.cookies.set('next', next, { path: '/', maxAge: 600, httpOnly: true, sameSite: 'lax' });
  return res;
}
