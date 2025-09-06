import { env } from './env';

export function isAdmin(tgId: number): boolean {
  return env.ADMIN_TG_IDS.includes(String(tgId));
}
