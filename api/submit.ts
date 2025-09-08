import { supabase } from './_supabase.js';
import { validateInitData } from './_util.js';
export default async function handler(req, res){
  try{ if(req.method!=='POST') return res.status(405).json({ error:'method_not_allowed' });
    const v = validateInitData(String(req.headers['x-tg-initdata']||'')); if(!v.ok) return res.status(401).json({ error:v.reason });
    const { video_path, doc_path } = req.body || {}; if(!video_path || !doc_path) return res.status(400).json({ error:'missing_paths' });
    const { error } = await supabase.from('verifications').insert({ user_tg_id:v.user.id, video_path, doc_path, status:'pending' });
    if(error) return res.status(500).json({ error:'db_error', detail:error.message });
    return res.json({ ok:true });
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
