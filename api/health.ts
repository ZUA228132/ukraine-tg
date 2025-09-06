import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const env = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || null,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      ADMIN_TG_IDS: (process.env.ADMIN_TG_IDS || '').split(',').filter(Boolean).length
    };

    // light DB check: select 1 from users (may fail if table missing)
    const { error: dbError } = await supabase.from('users').select('tg_id').limit(1);
    const ok = !dbError;
    res.status(ok ? 200 : 500).json({ ok, env, dbError: dbError?.message || null });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'unknown' });
  }
}
