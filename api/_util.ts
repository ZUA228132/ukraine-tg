import crypto from 'crypto';

export function parseInitData(initData: string): URLSearchParams {
  return new URLSearchParams(initData);
}

export function validateInitData(initData: string, botToken: string): { ok: true, user: any } | { ok: false; reason: string } {
  try {
    const params = parseInitData(initData);
    const hash = params.get('hash');
    if (!hash) return { ok: false, reason: 'missing hash' } as const;

    const entries = Array.from(params.entries())
      .filter(([k]) => k !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secret = crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN || '').digest();
    const hmac = crypto.createHmac('sha256', secret).update(entries).digest('hex');
    if (hmac !== hash) return { ok: false, reason: 'invalid signature' } as const;

    const userRaw = params.get('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { ok: true, user };
  } catch (e) {
    return { ok: false, reason: 'exception' } as const;
  }
}
