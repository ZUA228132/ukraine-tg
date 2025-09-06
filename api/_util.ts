import crypto from 'crypto';

export function validateInitData(initData: string) {
  const params = new URLSearchParams(initData || '');
  const hash = params.get('hash');
  if (!hash) return { ok: false as const, reason: 'missing hash' };

  const entries = Array.from(params.entries())
    .filter(([k]) => k !== 'hash')
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHash('sha256')
    .update(process.env.TELEGRAM_BOT_TOKEN || '')
    .digest();

  const hmac = crypto.createHmac('sha256', secret)
    .update(entries)
    .digest('hex');

  if (hmac !== hash) return { ok: false as const, reason: 'invalid signature' };

  const raw = params.get('user');
  const user = raw ? JSON.parse(raw) : null;
  return { ok: true as const, user };
}
