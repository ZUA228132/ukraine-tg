import { supabase } from './_supabase.js';
import { validateInitData } from './_util.js';
function isAdmin(id){ return String(process.env.ADMIN_TG_IDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(String(id)); }
export default async function handler(req, res){
  try{ const v = validateInitData(String(req.headers['x-tg-initdata']||'')); if(!v.ok) return res.status(401).json({ error:v.reason });
    if(!isAdmin(v.user.id)) return res.status(403).json({ error:'forbidden' });
    const { data, error } = await supabase.from('verifications').select('*').eq('status','pending').order('created_at', { ascending:true });
    if(error) return res.status(500).json({ error:'db_error', detail:error.message });
    return res.json(data);
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
