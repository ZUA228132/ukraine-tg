import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { env } from '@/lib/env';
import { requireAuth } from '@/app/api/_util';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  if (!auth.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: 'missing_path' }, { status: 400 });

  const { data, error } = await supabaseService.storage.from(env.SUPABASE_STORAGE_BUCKET).createSignedUrl(path, 600);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
