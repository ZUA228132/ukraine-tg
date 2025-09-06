import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase';
import { validateInitData } from './_util';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const initData = String(req.headers['x-tg-initdata'] || '');
  const v = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
  if (!v.ok) return res.status(401).json({ error: 'invalid_initdata' });
  const user = v.user;

  const { data, error } = await supabase.from('verifications').select('*').eq('user_tg_id', user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ items: data });
}
