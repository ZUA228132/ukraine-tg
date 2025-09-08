import { supabase } from './_supabase.js';
import { validateInitData } from './_util.js';
export default async function handler(req, res){
  try{ const v = validateInitData(String(req.headers['x-tg-initdata']||'')); if(!v.ok) return res.status(401).json({ error:v.reason });
    const { data, error } = await supabase.from('verifications').select('*').eq('user_tg_id', v.user.id).order('created_at', { ascending:false });
    if(error) return res.status(500).json({ error:'db_error', detail:error.message });
    return res.json(data);
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
