import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, BUCKET } from './_supabase';
import { validateInitData } from './_util';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const initData = String(req.headers['x-tg-initdata'] || '');
  const v = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
  if (!v.ok) return res.status(401).json({ error: 'invalid_initdata' });
  const user = v.user;
  const admins = String(process.env.ADMIN_TG_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (!admins.includes(String(user.id))) return res.status(403).json({ error: 'forbidden' });

  const { path } = req.body || {};
  if (!path) return res.status(400).json({ error: 'missing_path' });
  const { data, error } = await (supabase as any).storage.from(BUCKET).createSignedUrl(path, 600);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ url: data.signedUrl });
}
