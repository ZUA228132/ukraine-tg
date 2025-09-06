import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, BUCKET } from './_supabase';
import { validateInitData } from './_util';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const initData = String(req.headers['x-tg-initdata'] || '');
  const v = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
  if (!v.ok) return res.status(401).json({ error: 'invalid_initdata' });
  const user = v.user;

  const { kind, filename } = req.body || {};
  if (!['video','doc'].includes(kind)) return res.status(400).json({ error: 'bad_kind' });
  if (!filename) return res.status(400).json({ error: 'missing_filename' });

  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0,10).replace(/-/g,'');
  const objectPath = `user/${user.id}/${yyyymmdd}/${Date.now()}_${kind}_${filename}`;

  const { data, error } = await (supabase as any).storage.from(BUCKET).createSignedUploadUrl(objectPath, 600);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ uploadUrl: data?.signedUrl, token: data?.token, path: objectPath });
}
