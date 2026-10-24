import { db, json, hash, nextSlot, openSlot, finishComic, turnLink } from '@/lib/db';
import { getUser, ensureProfile } from '@/lib/auth';
import { turnMail } from '@/lib/email';

async function findTurn(token) {
  const { data: s } = await db.from('slots').select('*, comics(*)').eq('token_hash', hash(token)).maybeSingle();
  if (!s || s.panel_path || s.skipped || s.comics.status !== 'active' || s.comics.current_idx !== s.idx) return null;
  return s;
}

// GET: what the current player is allowed to know: previous panel + last flag + player/loop counts. Never their position.
export async function GET(_req, { params }) {
  const s = await findTurn((await params).token);
  if (!s) return json({ error: 'invalid-or-used' }, 404);
  const c = s.comics;
  const { data: prev } = await db.from('slots').select('panel_path').eq('comic_id', c.id).lt('idx', s.idx).not('panel_path', 'is', null).order('idx', { ascending: false }).limit(1);
  const prevUrl = prev?.[0] ? (await db.storage.from('panels').createSignedUrl(prev[0].panel_path, 3600)).data.signedUrl : null;
  return json({ prevUrl, isLast: !(await nextSlot(c.id, s.idx)), players: c.players, loops: c.loops, loggedIn: !!(await getUser()) });
}

// POST { png: dataURL, mode: 'email'|'link', email? }  (mode only needed when the next player has no account)
export async function POST(req, { params }) {
  const s = await findTurn((await params).token);
  if (!s) return json({ error: 'invalid-or-used' }, 404);
  const c = s.comics, { png, mode, email } = await req.json();
  if (typeof png !== 'string' || !png.startsWith('data:image/png;base64,') || png.length > 4_000_000) return json({ error: 'bad-image' }, 400);
  const next = await nextSlot(c.id, s.idx);
  if (next && !next.user_id) {
    if (mode === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) return json({ error: 'bad-email' }, 400);
    if (mode !== 'email' && mode !== 'link') return json({ error: 'choose-delivery' }, 400);
  }
  const path = `${c.id}/${s.idx}.png`;
  const up = await db.storage.from('panels').upload(path, Buffer.from(png.split(',')[1], 'base64'), { contentType: 'image/png', upsert: true });
  if (up.error) return json({ error: 'upload' }, 500);
  const user = await getUser();
  if (user) { await ensureProfile(user); await db.from('participants').upsert({ comic_id: c.id, user_id: user.id }); }
  // Burn the token and claim the slot in one step; if someone else already did, stop.
  const { data: claimed } = await db.from('slots').update({ panel_path: path, token_hash: null, user_id: user?.id ?? s.user_id }).match({ comic_id: c.id, idx: s.idx }).is('panel_path', null).select();
  if (!claimed?.length) return json({ error: 'invalid-or-used' }, 409);
  if (!next) return json({ done: true, comicId: c.id, nameToken: await finishComic(c.id) });
  const token = await openSlot(c.id, next); // emails the next player automatically if they have an account
  if (next.user_id) return json({ nextHasAccount: true });
  if (mode === 'email') { await turnMail(email, turnLink(token)); return json({ sent: true }); } // address is never stored
  return json({ link: turnLink(token) });
}
