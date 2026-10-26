import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { turnMail, doneMail, endedMail } from './email';

export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
export const json = (d, s = 200) => Response.json(d, { status: s });
export const newToken = () => crypto.randomBytes(32).toString('base64url');
export const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');
const site = () => process.env.NEXT_PUBLIC_SITE_URL;
export const turnLink = (t) => `${site()}/play/${t}`;
export const comicLink = (id) => `${site()}/comic/${id}`;
export const dashLink = () => `${site()}/dashboard`;

export async function nextSlot(comicId, after) {
  const { data } = await db.from('slots').select('*').eq('comic_id', comicId).gt('idx', after).eq('skipped', false).order('idx').limit(1);
  return data?.[0] || null;
}
// Makes `slot` the active turn: fresh token (old one dies), timer reset, email if it belongs to an account.
export async function openSlot(comicId, slot, given) {
  const token = given || newToken();
  await db.from('slots').update({ token_hash: hash(token) }).match({ comic_id: comicId, idx: slot.idx });
  await db.from('comics').update({ current_idx: slot.idx, turn_started_at: new Date().toISOString(), last_reminder_at: null }).eq('id', comicId);
  if (slot.user_id) {
    const { data: p } = await db.from('profiles').select('email').eq('id', slot.user_id).single();
    if (p) await turnMail(p.email, turnLink(token));
  }
  return token;
}
// Marks the comic done. The returned one-time token lets the last drawer name it.
export async function finishComic(comicId) {
  const nameToken = newToken();
  await db.from('comics').update({ status: 'done', finished_at: new Date().toISOString(), name_token_hash: hash(nameToken) }).eq('id', comicId);
  return nameToken;
}
async function emails(comicId) {
  const { data } = await db.from('participants').select('profiles(email)').eq('comic_id', comicId);
  return (data || []).map((r) => r.profiles.email);
}
export async function sendFinal(comicId) {
  const { data: c } = await db.from('comics').select('title,emailed_at').eq('id', comicId).single();
  if (c.emailed_at) return;
  await db.from('comics').update({ emailed_at: new Date().toISOString() }).eq('id', comicId);
  for (const e of await emails(comicId)) await doneMail(e, c.title, comicLink(comicId));
}
export async function sendEnded(c, reason) { for (const e of await emails(c.id)) await endedMail(e, reason, comicLink(c.id)); }
