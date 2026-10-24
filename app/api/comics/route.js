import { db, json, newToken, hash } from '@/lib/db';
import { getUser, ensureProfile } from '@/lib/auth';

// POST: start a comic. Login required so the creator can get reminders and manage it.
// body: { players: 3-10, loops: 0-2, friends: { "<playerIndex>": "<friend user id>" } }
export async function POST(req) {
  const u = await getUser();
  if (!u) return json({ error: 'login-required' }, 401);
  await ensureProfile(u);
  const { players, loops = 0, friends = {} } = await req.json();
  if (!Number.isInteger(players) || players < 3 || players > 10 || ![0, 1, 2].includes(loops)) return json({ error: 'bad-options' }, 400);
  const total = players * (loops + 1);
  const wanted = Object.values(friends);
  const { data: ok } = wanted.length ? await db.from('friendships').select('friend_id').eq('user_id', u.id).in('friend_id', wanted) : { data: [] };
  const allowed = new Set((ok || []).map((r) => r.friend_id));
  const { data: comic, error } = await db.from('comics').insert({ creator_id: u.id, players, loops, total }).select().single();
  if (error) return json({ error: 'db' }, 500);
  const token = newToken();
  const slots = Array.from({ length: total }, (_, idx) => {
    const pi = idx % players, f = friends[pi];
    return { comic_id: comic.id, idx, player_index: pi, user_id: pi === 0 ? u.id : allowed.has(f) ? f : null, token_hash: idx === 0 ? hash(token) : null };
  });
  await db.from('slots').insert(slots);
  const people = new Set([u.id, ...slots.map((s) => s.user_id).filter(Boolean)]);
  await db.from('participants').insert([...people].map((user_id) => ({ comic_id: comic.id, user_id })));
  return json({ comicId: comic.id, token }); // creator draws panel 1 at /play/<token>
}

// GET: comics the logged-in user created or was added to (dashboard).
export async function GET() {
  const u = await getUser();
  if (!u) return json({ error: 'login-required' }, 401);
  const { data } = await db.from('participants').select('comics(id,title,status,players,loops,total,current_idx,creator_id,turn_started_at)').eq('user_id', u.id);
  return json({ comics: (data || []).map((r) => ({ ...r.comics, isCreator: r.comics.creator_id === u.id })) });
}
