// api/debug-getme.ts
export default async function handler(req: any, res: any) {
  try {
    const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    if (!token) return res.status(500).json({ ok:false, error:"missing bot token" });
    const url = "https://api.telegram.org/bot" + encodeURIComponent(token) + "/getMe";
    const r = await fetch(url);
    const j = await r.json().catch(()=>null);
    // Don't leak token; just forward useful bits
    res.json({
      ok: j?.ok ?? false,
      result: j?.result ? {
        id: j.result.id,
        is_bot: j.result.is_bot,
        first_name: j.result.first_name,
        username: j.result.username,
        can_join_groups: j.result.can_join_groups,
        can_read_all_group_messages: j.result.can_read_all_group_messages,
        supports_inline_queries: j.result.supports_inline_queries,
      } : null
    });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e?.message || "internal" });
  }
}
