import { supabase, BUCKET } from './_supabase.js';
import { validateInitData } from './_util.js';
import { randomUUID } from 'crypto';
export default async function handler(req, res){
  try{ if(req.method!=='POST') return res.status(405).json({ error:'method_not_allowed' });
    const v = validateInitData(String(req.headers['x-tg-initdata']||''));
    if(!v.ok) return res.status(401).json({ error:v.reason });
    const u = v.user; const url = new URL(req.url, 'http://localhost');
    const filename = url.searchParams.get('filename'); const kind = url.searchParams.get('kind');
    if(!filename || !kind) return res.status(400).json({ error:'bad_request' });
    const path = `${u.id}/${randomUUID()}-${filename}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if(error) return res.status(500).json({ error:'storage_error', detail:error.message });
    return res.json({ path, uploadUrl: data.signedUrl, token: data.token });
  }catch(e){ res.status(500).json({ error:'internal', detail:e?.message||'unknown' }); }
}
