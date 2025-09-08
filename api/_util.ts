import crypto from "crypto";

/** Normalize RAW initData string */
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
function dcsRaw(pairs: Array<[string,string]>): string { return pairs.map(([k,v]) => `${k}=${v}`).join("\n"); }
function dcsDecoded(pairs: Array<[string,string]>): string { return pairs.map(([k,v]) => `${k}=${safeDecode(v)}`).join("\n"); }
function canonicalizeValue(rawValue: string): string {
  const dec = safeDecode(rawValue);
  const first = dec.trim()[0];
  if (first === "{" || first === "[") {
    try { return JSON.stringify(JSON.parse(dec)); } catch { return dec; }
  }
  return dec;
}
function dcsCanonical(pairs: Array<[string,string]>): string { return pairs.map(([k,v]) => `${k}=${canonicalizeValue(v)}`).join("\n"); }

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch { return false; }
}

export function validateInitData(input: string) {
  const raw = normalizeInitData(input);
  if (!raw) return { ok: false as const, reason: "missing initData" };

  const hashPair = raw.split("&").find((p) => p.startsWith("hash="));
  const providedHash = hashPair ? hashPair.slice(5) : "";
  if (!providedHash) return { ok: false as const, reason: "missing hash" };

  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return { ok: false as const, reason: "missing bot token" };
  const secretSha = crypto.createHash("sha256").update(token).digest();
  const secretDirect = Buffer.from(token, "utf8");

  const pairs = parsePairs(raw);
  const d1 = dcsRaw(pairs);
  const d2 = dcsDecoded(pairs);
  const d3 = dcsCanonical(pairs);

  const h1a = crypto.createHmac("sha256", secretSha).update(d1).digest("hex");
  const h2a = crypto.createHmac("sha256", secretSha).update(d2).digest("hex");
  const h3a = crypto.createHmac("sha256", secretSha).update(d3).digest("hex");

  const h1b = crypto.createHmac("sha256", secretDirect).update(d1).digest("hex");
  const h2b = crypto.createHmac("sha256", secretDirect).update(d2).digest("hex");
  const h3b = crypto.createHmac("sha256", secretDirect).update(d3).digest("hex");

  const ok = [h1a,h2a,h3a,h1b,h2b,h3b].some(h => timingSafeEqualHex(h, providedHash));
  if (!ok) return { ok: false as const, reason: "invalid signature" };

  const params = new URLSearchParams(raw);
  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(safeDecode(userRaw)) : null;
  return { ok: true as const, user };
}
