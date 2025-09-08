// api/debug-prove-bot.ts
// Пробивает через Telegram Bot API, что текущий query_id принадлежит ИМЕННО вашему боту.
// Отправит 1 маленькое сообщение "✅ WebApp query matched this bot." пользователю, открывшему WebApp.

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

export default async function handler(req: any, res: any) {
  try {
    const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!token) return res.status(500).json({ ok:false, error:"missing bot token" });

    const rawHeader = String(req.headers["x-tg-initdata"] || "");
    const raw = normalizeInitData(rawHeader);
    if (!raw) return res.status(400).json({ ok:false, error:"missing initData header" });

    const params = new URLSearchParams(raw);
    const query_id = params.get("query_id");
    if (!query_id) return res.status(400).json({ ok:false, error:"no query_id in initData" });

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

    const url = "https://api.telegram.org/bot" + encodeURIComponent(token) + "/answerWebAppQuery";
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const j = await r.json().catch(()=>null);
    // ok:true -> query_id действительно принадлежит этому боту/токену
    // ok:false + WEBAPP_QUERY_NOT_FOUND -> initData подписан не этим ботом
    return res.status(j?.ok ? 200 : 400).json({ ok: !!j?.ok, telegram: j });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || "internal" });
  }
}
