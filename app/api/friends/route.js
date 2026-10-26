import { db, json, befriend, dashLink } from '@/lib/db';
import { getUser, ensureProfile } from '@/lib/auth';
import { friendMail } from '@/lib/email';

const pick = (rows) => (rows || []).map((r) => r.p).filter(Boolean);

// GET: your friends plus requests waiting on you (incoming) and requests you sent (outgoing).
export async function GET() {
  const u = await getUser();
  if (!u) return json({ error: 'login-required' }, 401);
  const [f, inc, out] = await Promise.all([
    db.from('friendships').select('p:friend_id(id,name,email)').eq('user_id', u.id),
    db.from('friend_requests').select('p:from_id(id,name,email)').eq('to_id', u.id),
    db.from('friend_requests').select('p:to_id(id,email)').eq('from_id', u.id)]);
  return json({ friends: pick(f.data), incoming: pick(inc.data), outgoing: pick(out.data) });
}

// POST { email }: send a friend request. Says plainly what happened: sent, accepted, friends, pending, self or not-found.
export async function POST(req) {
  const u = await getUser();
  if (!u) return json({ error: 'login-required' }, 401);
  await ensureProfile(u);
  const e = String((await req.json()).email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return json({ error: 'bad-email' }, 400);
  const { data: found } = await db.from('profiles').select('id,email').ilike('email', e.replace(/[\\%_]/g, '\\$&')).limit(1);
  const t = found?.[0];
  let status = 'not-found';
  if (t && t.id === u.id) status = 'self';
  else if (t) {
    const [{ data: already }, { data: theirs }] = await Promise.all([
      db.from('friendships').select('user_id').match({ user_id: u.id, friend_id: t.id }),
      db.from('friend_requests').select('from_id').match({ from_id: t.id, to_id: u.id })]);
    if (already?.length) status = 'friends';
    else if (theirs?.length) { await befriend(u.id, t.id); status = 'accepted'; } // they already asked you, so this just accepts
    else {
      const { error } = await db.from('friend_requests').insert({ from_id: u.id, to_id: t.id });
      if (!error) { status = 'sent'; await friendMail(t.email, u.user_metadata?.name || u.email, `${process.env.NEXT_PUBLIC_SITE_URL}/friends`); }
      else if (error.code === '23505') status = 'pending'; // you already sent one
      else return json({ error: 'db' }, 500);
    }
  }
  return json({ status });
}
