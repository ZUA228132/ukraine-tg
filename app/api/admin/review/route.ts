import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { requireAuth } from '@/app/api/_util';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  if (!auth.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id, action, notes } = await req.json();
  if (!id || !['approve','reject'].includes(action)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const { error } = await supabaseService.from('verifications').update({ status: newStatus, notes }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
