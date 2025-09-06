import { env } from '@/lib/env';
import { extractTGUser, validateInitData } from '@/lib/tg';
import { isAdmin } from '@/lib/roles';

export function requireAuth(req: Request) {
  const initData = req.headers.get('x-tg-initdata') || '';
  const v = validateInitData(initData, env.TELEGRAM_BOT_TOKEN);
  if (!v.ok) {
    return { ok: false as const, status: 401, body: { error: 'invalid_initdata' } };
  }
  const user = extractTGUser(initData);
  if (!user) {
    return { ok: false as const, status: 400, body: { error: 'no_user' } };
  }
  return { ok: true as const, user, isAdmin: isAdmin(user.id), initData };
}
