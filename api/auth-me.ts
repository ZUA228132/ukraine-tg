import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase.js';
import { validateInitData } from './_util.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const initData = String(req.headers['x-tg-initdata'] || '');
    const v = validateInitData(initData);
    if (!v.ok) return res.status(401).json({ error: v.reason });

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

    if (error) {
      console.error('[auth-me] Supabase upsert error:', error.message);
      return res.status(500).json({ error: 'db_error', detail: error.message });
    }

    return res.json({ tg_id: user.id, first_name: user.first_name, last_name: user.last_name, username: user.username, role });
  } catch (e: any) {
    console.error('[auth-me] unexpected error:', e?.message);
    return res.status(500).json({ error: 'internal', detail: e?.message || 'unknown' });
  }
}
