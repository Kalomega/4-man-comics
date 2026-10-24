import { db, json } from '@/lib/db';
import { getUser } from '@/lib/auth';

// GET: finished/ended comics are public (unguessable id). Active ones need a participant login and show status only.
export async function GET(_req, { params }) {
  const { id } = await params;
  const { data: c } = await db.from('comics').select('*').eq('id', id).maybeSingle();
  if (!c) return json({ error: 'not-found' }, 404);
  const { data: slots } = await db.from('slots').select('idx,user_id,panel_path,profiles(name)').eq('comic_id', id).order('idx');
  if (c.status !== 'active') {
    const paths = slots.filter((s) => s.panel_path).map((s) => s.panel_path);
    const { data } = paths.length ? await db.storage.from('panels').createSignedUrls(paths, 3600) : { data: [] };
    return json({ status: c.status, title: c.title, panels: (data || []).map((d) => d.signedUrl) });
  }
  const u = await getUser();
  const { data: me } = u ? await db.from('participants').select('user_id').match({ comic_id: id, user_id: u.id }).maybeSingle() : { data: null };
  if (!me) return json({ error: 'forbidden' }, 403);
  const cur = slots.find((s) => s.idx === c.current_idx);
  return json({ status: 'active', panel: slots.filter((s) => s.panel_path).length + 1, total: c.total,
    loop: c.loops ? Math.floor(c.current_idx / c.players) + 1 : null, loops: c.loops + 1,
    waitingOn: cur?.profiles?.name || null, isCreator: c.creator_id === u.id, turnStartedAt: c.turn_started_at });
}
