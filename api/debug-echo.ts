// api/debug-echo.ts
import crypto from "crypto";

const ALLOWED_KEYS = new Set([
  "auth_date","can_send_after","chat","chat_instance","chat_type",
  "hash","query_id","receiver","start_param","user",
]);

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

function buildDCS(raw: string) {
  const parts = raw.split("&").filter(Boolean);
  const hashPair = parts.find((p) => p.startsWith("hash="));
  const providedHash = hashPair ? hashPair.slice(5) : "";

  const kv: [string,string][] = [];
  for (const p of parts) {
    const i = p.indexOf("="); if (i <= 0) continue;
    const k = p.slice(0, i);
    if (k === "hash") continue;
    if (!ALLOWED_KEYS.has(k)) continue;
    const v = p.slice(i + 1);
    kv.push([k, v]);
  }
  kv.sort((a, b) => a[0].localeCompare(b[0]));
  const dcs = kv.map(([k,v]) => `${k}=${v}`).join("\n");
  return { dcs, providedHash };
}

export default async function handler(req: any, res: any) {
  try {
    const rawHeader = String(req.headers["x-tg-initdata"] || "");
    const raw = normalizeInitData(rawHeader);
    const { dcs, providedHash } = buildDCS(raw);

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const secret = botToken ? crypto.createHash("sha256").update(botToken).digest() : null;
    const computedHash = secret ? crypto.createHmac("sha256", secret).update(dcs).digest("hex") : null;
    const ok = Boolean(secret && providedHash && computedHash === providedHash);

    return res.status(ok ? 200 : 401).json({
      ok,
      reason: ok
        ? null
        : !raw
          ? "missing initData"
          : !providedHash
            ? "missing hash"
            : !botToken
              ? "missing bot token"
              : "invalid signature",
      snippet: raw ? raw.slice(0, 120) + (raw.length > 120 ? "…" : "") : null,
      providedHash: providedHash ? providedHash.slice(0, 16) + "…" : null,
      computedHash: computedHash ? computedHash.slice(0, 16) + "…" : null,
      length: raw.length
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "internal" });
  }
}
