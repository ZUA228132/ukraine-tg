import crypto from 'crypto';

/**
 * Validates Telegram WebApp initData using the RAW query string (no decoding).
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
export function validateInitData(initData: string) {
  if (!initData) return { ok: false as const, reason: 'missing initData' };

  // 1) Build data_check_string from RAW pairs (still percent-encoded), excluding 'hash'
  const parts = initData.split('&').filter(Boolean);
  const withoutHash = parts.filter(p => !p.startsWith('hash='));
  const keyVals = withoutHash.map(p => {
    const eq = p.indexOf('=');
    return [p.slice(0, eq), p.slice(eq + 1)] as [string, string];
  });
  keyVals.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = keyVals.map(([k, v]) => `${k}=${v}`).join('\n'); // RAW (not decoded)

  // 2) HMAC(secret = sha256(BOT_TOKEN), data = data_check_string)
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  if (!botToken) return { ok: false as const, reason: 'missing bot token' };
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  // 3) Extract provided hash from RAW string
  const hashPair = parts.find(p => p.startsWith('hash='));
  const providedHash = hashPair ? hashPair.slice('hash='.length) : '';

  if (computedHash !== providedHash) {
    return { ok: false as const, reason: 'invalid signature' };
  }

  // 4) Parse user after signature passes (safe to decode now)
  const params = new URLSearchParams(initData);
  const userRaw = params.get('user');
  const user = userRaw ? JSON.parse(userRaw) : null;

  return { ok: true as const, user };
}
