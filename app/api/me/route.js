import { db, json } from '@/lib/db';
import { getUser } from '@/lib/auth';
export async function GET() {
  const u = await getUser();
  let pending = 0;
  if (u) { const { count } = await db.from('friend_requests').select('*', { count: 'exact', head: true }).eq('to_id', u.id); pending = count || 0; }
  return json({ user: u ? { id: u.id, email: u.email } : null, pending });
}
