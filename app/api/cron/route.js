import { db, json, sendFinal, sendEnded, dashLink } from '@/lib/db';
import { stalledMail } from '@/lib/email';

// Runs daily (vercel.json). Vercel sends "Authorization: Bearer $CRON_SECRET". Doing a query also keeps Supabase's free project awake.
export async function GET(req) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return json({ error: 'unauthorized' }, 401);
  const D = 864e5, now = Date.now();
  const { data: rows } = await db.from('comics').select('*').eq('status', 'active');
  let expired = 0, reminded = 0;
  for (const c of rows || []) {
    const age = now - new Date(c.turn_started_at).getTime();
    if (age > 21 * D) { // a single turn took over 3 weeks
      await db.from('comics').update({ status: 'expired', finished_at: new Date().toISOString() }).eq('id', c.id);
      await sendEnded(c, 'a turn took more than 3 weeks'); expired++;
    } else if (age > 7 * D && (!c.last_reminder_at || now - new Date(c.last_reminder_at).getTime() > 6.5 * D)) {
      const { data: p } = await db.from('profiles').select('email').eq('id', c.creator_id).single();
      if (p) await stalledMail(p.email, dashLink());
      await db.from('comics').update({ last_reminder_at: new Date().toISOString() }).eq('id', c.id); reminded++;
    }
  }
  // Finished but never named after a day: publish as untitled so people still get their email.
  const { data: unnamed } = await db.from('comics').select('id').eq('status', 'done').is('emailed_at', null).lt('finished_at', new Date(now - D).toISOString());
  for (const c of unnamed || []) { await db.from('comics').update({ title: 'Untitled comic', name_token_hash: null }).eq('id', c.id); await sendFinal(c.id); }
  return json({ expired, reminded, unnamed: unnamed?.length || 0, keepalive: true });
}
