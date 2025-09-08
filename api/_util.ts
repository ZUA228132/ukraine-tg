import crypto from "crypto";

/** Normalize to RAW initData string (no decoding here) */
function normalizeInitData(input: string): string {
  if (!input) return "";
  let s = input.trim();
  const m = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m && m[1]) s = m[1];          // keep percent-encoded tgWebAppData
  if (s[0] === "?" || s[0] === "#") s = s.slice(1);
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];
  return s;
}

/** Split into pairs from a RAW query string */
function parsePairs(raw: string): Array<[string,string]> {
  const out: Array<[string,string]> = [];
  for (const p of raw.split("&")) {
    if (!p) continue;
    const i = p.indexOf("=");
    if (i <= 0) continue;
    const k = p.slice(0, i);
    const v = p.slice(i + 1); // RAW (still percent-encoded)
    if (k === "hash" || k === "signature") continue; // exclude
    out.push([k, v]);
  }
  // bytewise/lexicographic sort
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

  // extract provided hash from RAW
  const hashMatch = raw.split("&").find(p => p.startsWith("hash="));
  const providedHash = hashMatch ? hashMatch.slice(5) : "";
  if (!providedHash) return { ok: false as const, reason: "missing hash" };

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!botToken) return { ok: false as const, reason: "missing bot token" };
  const secret = crypto.createHash("sha256").update(botToken).digest();

  const pairs = parsePairs(raw);
  const dcs1 = dcsRaw(pairs);               // RAW values
  const dcs2 = dcsDecoded(pairs);           // URL-decoded values

  const h1 = crypto.createHmac("sha256", secret).update(dcs1).digest("hex");
  const h2 = crypto.createHmac("sha256", secret).update(dcs2).digest("hex");

  const ok = timingSafeEqualHex(h1, providedHash) || timingSafeEqualHex(h2, providedHash);
  if (!ok) return { ok: false as const, reason: "invalid signature" };

  // parse user after success (safe to decode)
  const params = new URLSearchParams(raw);
  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  return { ok: true as const, user };
}
