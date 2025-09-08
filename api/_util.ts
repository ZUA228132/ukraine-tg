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

function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

// Canonicalize JSON-like values: JSON.parse -> JSON.stringify without spaces
function canonicalizeValue(key: string, rawValue: string): string {
  const dec = safeDecode(rawValue);
  if (!dec) return dec;
  const first = dec.trim()[0];
  if (first === "{" || first === "[") {
    try {
      const obj = JSON.parse(dec);
      return JSON.stringify(obj);
    } catch {
      return dec;
    }
  }
  return dec;
}

function buildVariants(raw: string) {
  const pairs = parsePairs(raw);
  const rawDcs = pairs.map(([k,v]) => `${k}=${v}`).join("\n");
  const decodedDcs = pairs.map(([k,v]) => `${k}=${safeDecode(v)}`).join("\n");
  const canonicalDcs = pairs.map(([k,v]) => `${k}=${canonicalizeValue(k, v)}`).join("\n");
  return { rawDcs, decodedDcs, canonicalDcs };
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

  const hashPair = raw.split("&").find((p) => p.startsWith("hash="));
  const providedHash = hashPair ? hashPair.slice(5) : "";
  if (!providedHash) return { ok: false as const, reason: "missing hash" };

  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return { ok: false as const, reason: "missing bot token" };
  const secret = crypto.createHash("sha256").update(token).digest();

  const { rawDcs, decodedDcs, canonicalDcs } = buildVariants(raw);

  const hRaw = crypto.createHmac("sha256", secret).update(rawDcs).digest("hex");
  const hDec = crypto.createHmac("sha256", secret).update(decodedDcs).digest("hex");
  const hCan = crypto.createHmac("sha256", secret).update(canonicalDcs).digest("hex");

  const ok = timingSafeEqualHex(hRaw, providedHash) || timingSafeEqualHex(hDec, providedHash) || timingSafeEqualHex(hCan, providedHash);
  if (!ok) return { ok: false as const, reason: "invalid signature" };

  const params = new URLSearchParams(raw);
  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(safeDecode(userRaw)) : null;
  return { ok: true as const, user };
}
