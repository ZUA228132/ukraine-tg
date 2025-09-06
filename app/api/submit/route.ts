import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { requireAuth } from '@/app/api/_util';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  const { user } = auth;

  const { videoPath, docPath } = await req.json();
  if (!videoPath || !docPath) return NextResponse.json({ error: 'missing_paths' }, { status: 400 });

  const { error } = await supabaseService.from('verifications').insert({
    user_tg_id: user.id,
    video_path: videoPath,
    doc_path: docPath,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
