import crypto from 'crypto';
export function validateInitData(initData){
  if(!initData) return { ok:false, reason:'missing initData' };
  const parts = initData.split('&').filter(Boolean);
  const withoutHash = parts.filter(p=>!p.startsWith('hash='));
  const kv = withoutHash.map(p=>{ const i=p.indexOf('='); return [p.slice(0,i), p.slice(i+1)]; }).sort((a,b)=>a[0].localeCompare(b[0]));
  const dataCheckString = kv.map(([k,v])=>`${k}=${v}`).join('\n');
  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  if(!token) return { ok:false, reason:'missing bot token' };
  const secret = crypto.createHash('sha256').update(token).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const provided = (parts.find(p=>p.startsWith('hash=')) || '').slice(5);
  if(hmac !== provided) return { ok:false, reason:'invalid signature' };
  const params = new URLSearchParams(initData);
  const raw = params.get('user');
  const user = raw ? JSON.parse(raw) : null;
  return { ok:true, user };
}
