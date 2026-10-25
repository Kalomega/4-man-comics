import { json } from '@/lib/db';
import { getUser } from '@/lib/auth';
export async function GET() { const u = await getUser(); return json({ user: u ? { id: u.id, email: u.email } : null }); }
