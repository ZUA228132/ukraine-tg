import { supabase } from './_supabase.js';
export default async function handler(req, res){
  try{ const env={ SUPABASE_URL:!!process.env.SUPABASE_URL, SUPABASE_ANON_KEY:!!process.env.SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY:!!process.env.SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET:process.env.SUPABASE_STORAGE_BUCKET||null, TELEGRAM_BOT_TOKEN:!!process.env.TELEGRAM_BOT_TOKEN, ADMIN_TG_IDS:(process.env.ADMIN_TG_IDS||'').split(',').filter(Boolean).length };
    const { error:dbError } = await supabase.from('users').select('tg_id').limit(1);
    res.status(dbError?500:200).json({ ok:!dbError, env, dbError: dbError?.message || null });
  }catch(e){ res.status(500).json({ ok:false, error:e?.message||'unknown' }); }
}
