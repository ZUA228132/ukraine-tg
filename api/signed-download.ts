import { supabase, BUCKET } from './_supabase.js';
import { validateInitData } from './_util.js';
export default async function handler(req, res){
  try{ const v = validateInitData(String(req.headers['x-tg-initdata']||'')); if(!v.ok) return res.status(401).json({ error:v.reason });
    const url = new URL(req.url, 'http://localhost'); const path = url.searchParams.get('path'); if(!path) return res.status(400).json({ error:'missing_path' });
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
    if(error) return res.status(500).json({ error:'storage_error', detail:error.message });
    return res.redirect(302, data.signedUrl);
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
