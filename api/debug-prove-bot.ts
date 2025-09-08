// api/debug-prove-bot.ts
// WARNING: This will call Telegram Bot API `answerWebAppQuery` using your server token
// and WILL send a tiny message to the user who opened the WebApp (once).
// Purpose: prove whether the current `query_id` belongs to *this* bot/token.
// If Telegram returns 400 with "WEBAPP_QUERY_NOT_FOUND" or similar -> initData was NOT signed by this bot.
import type { VercelRequest, VercelResponse } from "@vercel/node";

function normalizeInitData(input: string): string {
  if (!input) return "";
  let s = input.trim();
  const m = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m && m[1]) s = m[1];
  if (s[0] === "?" || s[0] === "#") s = s.slice(1);
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];
  return s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!token) return res.status(500).json({ ok:false, error:"missing bot token" });

    const rawHeader = String(req.headers["x-tg-initdata"] || "");
    const raw = normalizeInitData(rawHeader);
    if (!raw) return res.status(400).json({ ok:false, error:"missing initData header" });

    const params = new URLSearchParams(raw);
    const query_id = params.get("query_id");
    if (!query_id) return res.status(400).json({ ok:false, error:"no query_id in initData" });

    // Minimal InlineQueryResultArticle
    const body = {
      web_app_query_id: query_id,
      result: {
        type: "article",
        id: "1",
        title: "Debug OK",
        input_message_content: { message_text: "✅ WebApp query matched this bot." },
        description: "Temporary debug message",
      }
    };

    const url = "https://api.telegram.org/bot"+encodeURIComponent(token)+"/answerWebAppQuery";
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json().catch(()=>null);
    // j.ok === true -> this bot recognized the query_id (=> you are opening the correct bot)
    // j.ok === false and error_code=400 with WEBAPP_QUERY_NOT_FOUND -> wrong bot
    return res.status(j?.ok ? 200 : 400).json({ ok: !!j?.ok, telegram: j });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || "internal" });
  }
}
