// api/_util.ts
// FINAL FIX: include 'signature' in DCS, exclude only 'hash'.
// - secret = sha256(TELEGRAM_BOT_TOKEN)
// - Keys except 'hash' sorted ASCII
// - JSON values canonicalized (JSON.parse -> JSON.stringify)
// - Supports multiple tokens in TELEGRAM_BOT_TOKENS_CSV for safe rotation
import crypto from 'crypto';

function normalizeInitData(input: string): string {
  if (!input) return '';
  let s = input.trim();
  const m = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m && m[1]) s = m[1];
  if (s[0] === '?' || s[0] === '#') s = s.slice(1);
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];
  return s;
}

function safeDecode(v: string): string {
  try { return decodeURIComponent(v); } catch { return v; }
}

function extractPairs(raw: string): Array<[string,string]> {
  const out: Array<[string,string]> = [];
  for (const p of raw.split('&')) {
    if (!p) continue;
    const i = p.indexOf('=');
    if (i <= 0) continue;
    const k = p.slice(0, i);
    const v = p.slice(i + 1);
    // IMPORTANT: exclude ONLY 'hash'; 'signature' must be INCLUDED if present
    if (k === 'hash') continue;
    out.push([k, v]);
  }
  out.sort((a,b)=> a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  return out;
}

function canonicalize(v: string): string {
  const dec = safeDecode(v).trim();
  if (dec.startsWith('{') || dec.startsWith('[')) {
    try { return JSON.stringify(JSON.parse(dec)); } catch { return dec; }
  }
  return dec;
}

function buildDCS(raw: string): string {
  const pairs = extractPairs(raw);
  return pairs.map(([k,v]) => `${k}=${canonicalize(v)}`).join('\n');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const A = Buffer.from(a, 'hex');
    const B = Buffer.from(b, 'hex');
    if (A.length !== B.length) return false;
    return crypto.timingSafeEqual(A, B);
  } catch { return false; }
}

export type Valid =
  | { ok:true; user:any; params:URLSearchParams; matched:{ tokenTail6:string } }
  | { ok:false; reason:string };

export function validateInitData(input: string): Valid {
  const raw = normalizeInitData(input);
  if (!raw) return { ok:false, reason:'missing initData' };

  const params = new URLSearchParams(raw);
  const providedHash = params.get('hash') || params.get('signature') || '';
  if (!providedHash) return { ok:false, reason:'missing hash' };

  const primary = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const extras = (process.env.TELEGRAM_BOT_TOKENS_CSV || '').split(',').map(s=>s.trim()).filter(Boolean);
  const tokens = [primary, ...extras].filter(Boolean);
  if (!tokens.length) return { ok:false, reason:'missing bot token' };

  const dcs = buildDCS(raw);

  for (const tok of tokens) {
    const secret = crypto.createHash('sha256').update(tok).digest();
    const h = crypto.createHmac('sha256', secret).update(dcs).digest('hex');
    if (timingSafeEqualHex(h, providedHash)) {
      // parse user
      let user: any = null;
      const u = params.get('user');
      if (u) { try { user = JSON.parse(safeDecode(u)); } catch {} }
      return { ok:true, user, params, matched: { tokenTail6: tok.slice(-6) } };
    }
  }
  return { ok:false, reason:'invalid signature' };
}

export function requireTelegramAuth(req:any, res:any) {
  const fromHeader = String(req.headers['x-tg-initdata'] || '');
  const fromQuery = typeof req.query?.initData === 'string' ? req.query.initData : '';
  let fromBody = '';
  if (req.method !== 'GET' && req.headers['content-type']?.includes('application/json')) {
    try { fromBody = req.body?.initData || ''; } catch {}
  }
  const result = validateInitData(fromHeader || fromQuery || fromBody);
  if (!result.ok) {
    res.status(401).json({ error: result.reason });
    return null;
  }
  return { user: result.user, params: result.params };
}
