// api/debug-token.ts
export default async function handler(req: any, res: any) {
  try {
    const t = process.env.TELEGRAM_BOT_TOKEN || "";
    const [botId, rest] = t.split(":");
    const tail6 = t ? t.slice(-6) : "";
    res.json({
      hasToken: !!t,
      botId: botId || null,       // число до двоеточия
      tokenTail6: tail6 || null,  // последние 6 символов
      envNote: "Проверь, что это именно Production-окружение на Vercel. Если открываешь Preview, там могут быть другие env."
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "internal" });
  }
}
