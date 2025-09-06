import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { env } from '@/lib/env';
import { requireAuth } from '@/app/api/_util';

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status });
  const { user } = auth;

  const { kind, filename } = await req.json();
  if (!['video','doc'].includes(kind)) return NextResponse.json({ error: 'bad_kind' }, { status: 400 });
  if (!filename) return NextResponse.json({ error: 'missing_filename' }, { status: 400 });

  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0,10).replace(/-/g,'');
  const objectPath = `user/${user.id}/${yyyymmdd}/${Date.now()}_${kind}_${filename}`;

  const { data, error } = await supabaseService.storage.from(env.SUPABASE_STORAGE_BUCKET).createSignedUploadUrl(objectPath, 600);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ uploadUrl: data?.signedUrl, token: data?.token, path: objectPath });
}
