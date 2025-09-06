import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { requireAuth } from '@/app/api/_util';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  const { user } = auth;

  const { data, error } = await supabaseService.from('verifications').select('*').eq('user_tg_id', user.id).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}
