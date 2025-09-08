import crypto from "crypto";

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

function parsePairs(raw: string): Array<[string,string]> {
  const out: Array<[string,string]> = [];
  for (const p of raw.split("&")) {
    if (!p) continue;
    const i = p.indexOf("=");
    if (i <= 0) continue;
    const k = p.slice(0, i);
    const v = p.slice(i + 1);
    if (k === "hash" || k === "signature") continue;
    out.push([k, v]);
  }
  out.sort((a,b)=> (a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0)));
  return out;
}

function dcsRaw(pairs: Array<[string,string]>): string {
  return pairs.map(([k,v]) => `${k}=${v}`).join("\n");
}
function dcsDecoded(pairs: Array<[string,string]>): string {
  return pairs.map(([k,v]) => `${k}=${safeDecode(v)}`).join("\n");
}
function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

export default async function handler(req: any, res: any) {
  try {
    const rawHeader = String(req.headers["x-tg-initdata"] || "");
    const raw = normalizeInitData(rawHeader);

    const parts = raw.split("&").filter(Boolean);
    const hashPair = parts.find(p => p.startsWith("hash="));
    const providedHash = hashPair ? hashPair.slice(5) : "";

    const pairs = parsePairs(raw);
    const keysUsed = pairs.map(([k]) => k);

    const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    const secret = botToken ? crypto.createHash("sha256").update(botToken).digest() : null;

    const d1 = dcsRaw(pairs);
    const d2 = dcsDecoded(pairs);

    const h1 = secret ? crypto.createHmac("sha256", secret).update(d1).digest("hex") : null;
    const h2 = secret ? crypto.createHmac("sha256", secret).update(d2).digest("hex") : null;

    const ok = Boolean(secret && providedHash && (h1 === providedHash || h2 === providedHash));

    return res.status(ok ? 200 : 401).json({
      ok,
      reason: ok ? null
        : !raw ? "missing initData"
        : !providedHash ? "missing hash"
        : !botToken ? "missing bot token"
        : "invalid signature",
      snippet: raw ? raw.slice(0, 160) + (raw.length > 160 ? "…" : "") : null,
      providedHash: providedHash ? providedHash.slice(0, 16) + "…" : null,
      computedRaw: h1 ? h1.slice(0, 16) + "…" : null,
      computedDecoded: h2 ? h2.slice(0, 16) + "…" : null,
      length: raw.length,
      keysUsed,
      dcsRawSnippet: d1 ? d1.slice(0, 160) + (d1.length > 160 ? "…" : "") : null,
      dcsDecodedSnippet: d2 ? d2.slice(0, 160) + (d2.length > 160 ? "…" : "") : null
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "internal" });
  }
}
