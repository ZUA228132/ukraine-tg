import crypto from 'crypto';

export type TGUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export function parseInitData(initData: string): URLSearchParams {
  return new URLSearchParams(initData);
}

export function validateInitData(initData: string, botToken: string): { ok: true } | { ok: false; reason: string } {
  try {
    const params = parseInitData(initData);
    const hash = params.get('hash');
    if (!hash) return { ok: false, reason: 'missing hash' };

    const entries = Array.from(params.entries())
      .filter(([k]) => k !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secret = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secret).update(entries).digest('hex');

    if (hmac !== hash) return { ok: false, reason: 'invalid signature' };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'exception' };
  }
}

export function extractTGUser(initData: string) {
  const params = parseInitData(initData);
  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    const obj = JSON.parse(userRaw);
    return { id: obj.id, first_name: obj.first_name, last_name: obj.last_name, username: obj.username };
  } catch { return null; }
}
