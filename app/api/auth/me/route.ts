import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { requireAuth } from '@/app/api/_util';
import { isAdmin } from '@/lib/roles';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  const { user } = auth;

  const role = isAdmin(user.id) ? 'admin' : 'user';
  const { error } = await supabaseService.from('users').upsert({
    tg_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    role,
  }, { onConflict: 'tg_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...user, role });
}
