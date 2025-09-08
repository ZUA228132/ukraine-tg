// api/debug-echo.ts
// Full DCS debug: returns FULL data_check_string (raw & decoded) to pinpoint HMAC mismatch.
// Use only for debugging; remove after success to avoid leaking long payloads.
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
    if (k === "hash" || k === "signature") continue; // exclude from DCS
    out.push([k, v]);
  }
  // bytewise lexicographic order
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

    const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
    const secret = token ? crypto.createHash("sha256").update(token).digest() : null;

    const rawDcs = dcsRaw(pairs);
    const decDcs = dcsDecoded(pairs);

    const hRaw = secret ? crypto.createHmac("sha256", secret).update(rawDcs).digest("hex") : null;
    const hDec = secret ? crypto.createHmac("sha256", secret).update(decDcs).digest("hex") : null;

    const ok = Boolean(secret && providedHash && (hRaw === providedHash || hDec === providedHash));

    return res.status(ok ? 200 : 401).json({
      ok,
      reason: ok
        ? null
        : !raw ? "missing initData"
        : !providedHash ? "missing hash"
        : !token ? "missing bot token"
        : "invalid signature",
      providedHash,
      computedRaw: hRaw,
      computedDecoded: hDec,
      keysUsed,
      rawDcs,       // FULL strings for manual check
      decodedDcs: decDcs,
      note: "Remove this endpoint in production; it exposes full DCS for debugging only."
    });
  } catch (e: any) {
    return res.status(500).json({ ok:false, error: e?.message || "internal" });
  }
}
