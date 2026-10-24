import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from './db';

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => jar.getAll(), setAll: (list) => { try { list.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {} } } });
}
export async function getUser() { const { data } = await (await supabaseServer()).auth.getUser(); return data.user; }
export async function ensureProfile(u) {
  await db.from('profiles').upsert({ id: u.id, email: u.email, name: u.user_metadata?.name || u.email.split('@')[0] });
}
