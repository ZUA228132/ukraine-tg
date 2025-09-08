// api/debug-prove-bot.ts
// Проверяет, принадлежит ли query_id текущему BOT_TOKEN через answerWebAppQuery.
// Берёт initData из заголовка x-tg-initdata ИЛИ из ?initData= / body.initData.
function normalizeInitData(s: string) {
  if (!s) return "";
  s = s.trim();
  // если передали весь tgWebAppData или ?initData=...
  const m1 = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m1 && m1[1]) s = m1[1];
  if (s[0] === "?" || s[0] === "#") s = s.slice(1);
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];
  return s;
}

export default async function handler(req: any, res: any) {
  try {
    const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!token) return res.status(500).json({ ok:false, error:"missing bot token" });

    const fromHeader = String(req.headers["x-tg-initdata"] || "");
    const fromQuery  = typeof req.query?.initData === "string" ? req.query.initData : "";
    let fromBody = "";
    if (req.method !== "GET" && req.headers["content-type"]?.includes("application/json")) {
      try { fromBody = req.body?.initData || ""; } catch {}
    }
    const raw = normalizeInitData(fromHeader || fromQuery || fromBody);
    if (!raw) return res.status(400).json({ ok:false, error:"missing initData (header/query/body)" });

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
    // ok:true -> этот BOT_TOKEN «узнал» query_id; иначе WEBAPP_QUERY_NOT_FOUND -> другой бот
    return res.status(j?.ok ? 200 : 400).json({ ok: !!j?.ok, telegram: j });
  } catch (e:any) {
    return res.status(500).json({ ok:false, error: e?.message || "internal" });
  }
}
