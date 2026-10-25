import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/auth';
export async function GET() {
  await (await supabaseServer()).auth.signOut();
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL));
}
