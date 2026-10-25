import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer, ensureProfile } from '@/lib/auth';

export async function GET(req) {
  const code = new URL(req.url).searchParams.get('code');
  const jar = await cookies();
  const next = jar.get('next')?.value || '/';
  const dest = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  if (code) {
    const { data } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
    if (data?.user) await ensureProfile(data.user);
  }
  const res = NextResponse.redirect(new URL(dest, process.env.NEXT_PUBLIC_SITE_URL));
  res.cookies.delete('next');
  return res;
}
