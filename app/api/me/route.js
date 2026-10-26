import { db, json } from '@/lib/db';
import { getUser } from '@/lib/auth';
export async function GET() {
  const u = await getUser();
  let pending = 0, turns = 0;
  if (u) {
    const [fr, mine] = await Promise.all([
      db.from('friend_requests').select('*', { count: 'exact', head: true }).eq('to_id', u.id),
      db.from('slots').select('idx,comics!inner(status,current_idx)').match({ user_id: u.id, skipped: false }).is('panel_path', null).eq('comics.status', 'active')]);
    pending = fr.count || 0;
    turns = (mine.data || []).filter((r) => r.idx === r.comics.current_idx).length; // comics waiting on you right now
  }
  return json({ user: u ? { id: u.id, email: u.email } : null, pending, turns });
}
