// api/debug-echo.ts
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
function safeDecode(s: string): string { try { return decodeURIComponent(s); } catch { return s; } }
const dcsRaw  = (pairs: Array<[string,string]>) => pairs.map(([k,v]) => `${k}=${v}`).join("\n");
const dcsDec  = (pairs: Array<[string,string]>) => pairs.map(([k,v]) => `${k}=${safeDecode(v)}`).join("\n");
const canonVal= (v:string) => { const d = safeDecode(v); const f=d.trim()[0]; if (f==="{"||f==="[") { try { return JSON.stringify(JSON.parse(d)); } catch { return d; } } return d; };
const dcsCan  = (pairs: Array<[string,string]>) => pairs.map(([k,v]) => `${k}=${canonVal(v)}`).join("\n");

export default async function handler(req: any, res: any) {
  try {
    const rawHeader = String(req.headers["x-tg-initdata"] || "");
    const raw = normalizeInitData(rawHeader);

    const parts = raw.split("&").filter(Boolean);
    const hashPair = parts.find(p => p.startsWith("hash="));
    const providedHash = hashPair ? hashPair.slice(5) : "";

    const pairs = parsePairs(raw);
    const keysUsed = pairs.map(([k]) => k);

    const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    const secretSha = token ? crypto.createHash("sha256").update(token).digest() : null;
    const secretDirect = token ? Buffer.from(token, "utf8") : null;

    const d1 = dcsRaw(pairs);
    const d2 = dcsDec(pairs);
    const d3 = dcsCan(pairs);

    const h1a = secretSha ? crypto.createHmac("sha256", secretSha).update(d1).digest("hex") : null;
    const h2a = secretSha ? crypto.createHmac("sha256", secretSha).update(d2).digest("hex") : null;
    const h3a = secretSha ? crypto.createHmac("sha256", secretSha).update(d3).digest("hex") : null;

    const h1b = secretDirect ? crypto.createHmac("sha256", secretDirect).update(d1).digest("hex") : null;
    const h2b = secretDirect ? crypto.createHmac("sha256", secretDirect).update(d2).digest("hex") : null;
    const h3b = secretDirect ? crypto.createHmac("sha256", secretDirect).update(d3).digest("hex") : null;

    const ok = Boolean(providedHash && token && [h1a,h2a,h3a,h1b,h2b,h3b].includes(providedHash));

    return res.status(ok ? 200 : 401).json({
      ok,
      providedHash,
      keysUsed,
      computed: { h1a, h2a, h3a, h1b, h2b, h3b },
      rawDcs: d1,
      decodedDcs: d2,
      canonicalDcs: d3,
      note: "hXa: secret=sha256(token); hXb: secret=token directly"
    });
  } catch (e: any) {
    return res.status(500).json({ ok:false, error: e?.message || "internal" });
  }
}
