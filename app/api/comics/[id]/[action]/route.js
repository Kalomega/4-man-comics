import { db, json, newToken, hash, nextSlot, openSlot, finishComic, sendFinal, sendEnded, turnLink } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { turnMail } from '@/lib/email';

// POST /api/comics/:id/(name|resend|skip|cancel)
export async function POST(req, { params }) {
  const { id, action } = await params;
  const body = await req.json().catch(() => ({}));
  const { data: c } = await db.from('comics').select('*').eq('id', id).maybeSingle();
  if (!c) return json({ error: 'not-found' }, 404);

  if (action === 'name') { // last drawer names the comic once, using the one-time nameToken from their submit response
    if (c.status !== 'done' || !c.name_token_hash || hash(body.nameToken || '') !== c.name_token_hash) return json({ error: 'forbidden' }, 403);
    const title = String(body.title || '').trim().slice(0, 60) || 'Untitled comic';
    await db.from('comics').update({ title, name_token_hash: null }).eq('id', id);
    await sendFinal(id);
    return json({ ok: true, title });
  }

  const u = await getUser();
  if (!u || u.id !== c.creator_id) return json({ error: 'forbidden' }, 403);
  if (c.status !== 'active') return json({ error: 'not-active' }, 409);
  const { data: cur } = await db.from('slots').select('*').match({ comic_id: id, idx: c.current_idx }).single();

  if (action === 'cancel') {
    await db.from('comics').update({ status: 'canceled', finished_at: new Date().toISOString() }).eq('id', id);
    await sendEnded(c, 'the creator canceled it');
    return json({ ok: true });
  }
  if (action === 'resend') { // new token, old link dies. Account holders are emailed; otherwise the creator gets the link to pass on.
    const token = newToken();
    await db.from('slots').update({ token_hash: hash(token) }).match({ comic_id: id, idx: cur.idx });
    if (cur.user_id) { const { data: p } = await db.from('profiles').select('email').eq('id', cur.user_id).single(); if (p) await turnMail(p.email, turnLink(token)); return json({ sent: true }); }
    return json({ link: turnLink(token) });
  }
  if (action === 'skip') { // invalidates their link and shortens the comic by one panel
    await db.from('slots').update({ skipped: true, token_hash: null }).match({ comic_id: id, idx: cur.idx });
    await db.from('comics').update({ total: c.total - 1 }).eq('id', id);
    const next = await nextSlot(id, cur.idx);
    if (!next) {
      const { count } = await db.from('slots').select('*', { count: 'exact', head: true }).eq('comic_id', id).not('panel_path', 'is', null);
      if (!count) { await db.from('comics').update({ status: 'canceled' }).eq('id', id); return json({ canceled: true }); }
      return json({ done: true, nameToken: await finishComic(id) });
    }
    const token = await openSlot(id, next);
    return json(next.user_id ? { nextHasAccount: true } : { link: turnLink(token) });
  }
  return json({ error: 'unknown-action' }, 404);
}
