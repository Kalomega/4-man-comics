import { db, json, befriend, isUuid } from '@/lib/db';
import { getUser } from '@/lib/auth';

// POST /api/friends/(accept|decline|cancel|remove)  body: { id } = the other person's user id
export async function POST(req, { params }) {
  const { action } = await params;
  const u = await getUser();
  if (!u) return json({ error: 'login-required' }, 401);
  const { id } = await req.json();
  if (!isUuid(id)) return json({ error: 'bad-id' }, 400);
  if (action === 'accept') {
    const { data } = await db.from('friend_requests').select('from_id').match({ from_id: id, to_id: u.id });
    if (!data?.length) return json({ error: 'no-request' }, 404);
    await befriend(u.id, id);
  } else if (action === 'decline') await db.from('friend_requests').delete().match({ from_id: id, to_id: u.id });
  else if (action === 'cancel') await db.from('friend_requests').delete().match({ from_id: u.id, to_id: id });
  else if (action === 'remove') await db.from('friendships').delete().or(`and(user_id.eq.${u.id},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${u.id})`);
  else return json({ error: 'unknown-action' }, 404);
  return json({ ok: true });
}
