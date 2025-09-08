import { supabase } from './_supabase.js';
import { validateInitData } from './_util.js';
function isAdmin(id){ return String(process.env.ADMIN_TG_IDS||'').split(',').map(s=>s.trim()).filter(Boolean).includes(String(id)); }
export default async function handler(req, res){
  try{ if(req.method!=='POST') return res.status(405).json({ error:'method_not_allowed' });
    const v = validateInitData(String(req.headers['x-tg-initdata']||'')); if(!v.ok) return res.status(401).json({ error:v.reason });
    if(!isAdmin(v.user.id)) return res.status(403).json({ error:'forbidden' });
    const { id, action, notes } = req.body || {}; if(!id || !action) return res.status(400).json({ error:'bad_request' });
    const status = action==='approve' ? 'approved' : 'rejected';
    const { error } = await supabase.from('verifications').update({ status, notes: notes||null }).eq('id', id);
    if(error) return res.status(500).json({ error:'db_error', detail:error.message });
    return res.json({ ok:true, status });
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
