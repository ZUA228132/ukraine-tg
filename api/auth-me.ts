import { supabase } from './_supabase.js';
import { validateInitData } from './_util.js';
export default async function handler(req, res){
  try{ if(req.method!=='POST') return res.status(405).json({ error:'method_not_allowed' });
    const v = validateInitData(String(req.headers['x-tg-initdata']||''));
    if(!v.ok) return res.status(401).json({ error:v.reason });
    const u = v.user; if(!u) return res.status(400).json({ error:'no_user' });
    const admins = String(process.env.ADMIN_TG_IDS||'').split(',').map(s=>s.trim()).filter(Boolean);
    const role = admins.includes(String(u.id)) ? 'admin' : 'user';
    const { error } = await supabase.from('users').upsert({ tg_id:u.id, first_name:u.first_name, last_name:u.last_name, username:u.username, role }, { onConflict:'tg_id' });
    if(error) return res.status(500).json({ error:'db_error', detail:error.message });
    return res.json({ tg_id:u.id, first_name:u.first_name, last_name:u.last_name, username:u.username, role });
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
