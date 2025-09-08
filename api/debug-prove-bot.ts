// api/debug-prove-bot.ts
import { validateInitData } from './_util';

export default async function handler(req:any, res:any) {
  const header = String(req.headers['x-tg-initdata'] || '');
  const query  = typeof req.query?.initData === 'string' ? req.query.initData : '';
  const body   = (req.method !== 'GET' && req.headers['content-type']?.includes('application/json')) ? (req.body?.initData || '') : '';
  const initData = header || query || body || '';

  const result = validateInitData(initData);
  res.status(result.ok ? 200 : 400).json({
    ...result,
    // для прозрачности вернём providedHash и dcs (обрезанные)
    providedHash: (new URLSearchParams((initData||'').split('#')[0])).get('hash') || (new URLSearchParams((initData||'').split('#')[0])).get('signature') || ''
  });
}
