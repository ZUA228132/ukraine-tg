import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase';
import { validateInitData } from './_util';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const initData = String(req.headers['x-tg-initdata'] || '');
  const v = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
  if (!v.ok) return res.status(401).json({ error: 'invalid_initdata' });
  const user = v.user;
  const admins = String(process.env.ADMIN_TG_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
  if (!admins.includes(String(user.id))) return res.status(403).json({ error: 'forbidden' });

  const status = String(req.query.status || '');
  let query = supabase.from('verifications').select('*').order('created_at', { ascending: false });
  if (status) query = (query as any).eq('status', status);
  const { data, error } = await (query as any);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ items: data });
}
