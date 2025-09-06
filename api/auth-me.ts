import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase';
import { validateInitData } from './_util';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const initData = String(req.headers['x-tg-initdata'] || '');
  const v = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN || '');
  if (!v.ok) return res.status(401).json({ error: 'invalid_initdata' });
  const user = v.user;
  if (!user) return res.status(400).json({ error: 'no_user' });

  const admins = String(process.env.ADMIN_TG_IDS || '').split(',').map(s=>s.trim()).filter(Boolean);
  const role = admins.includes(String(user.id)) ? 'admin' : 'user';

  const { error } = await supabase.from('users').upsert({
    tg_id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    role,
  }, { onConflict: 'tg_id' });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ tg_id: user.id, first_name: user.first_name, last_name: user.last_name, username: user.username, role });
}
