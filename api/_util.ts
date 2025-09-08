import crypto from "crypto";

/** Normalize to RAW initData string */
function normalizeInitData(input: string): string {
  if (!input) return "";
  let s = input.trim();
  const m = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m && m[1]) s = m[1];          // use raw tgWebAppData (percent-encoded)
  if (s[0] === "?" || s[0] === "#") s = s.slice(1);
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];
  return s;
}

/** Build data_check_string: include ALL keys EXCEPT 'hash' and 'signature' */
function buildDataCheckString(rawInitData: string): { dcs: string; providedHash: string } {
  const parts = rawInitData.split("&").filter(Boolean);
  const hashPair = parts.find((p) => p.startsWith("hash="));
  const providedHash = hashPair ? hashPair.slice(5) : "";

  const kv: [string, string][] = [];
  for (const p of parts) {
    const i = p.indexOf("="); if (i <= 0) continue;
    const k = p.slice(0, i);
    if (k === "hash" || k === "signature") continue; // <— ВАЖНО: исключаем
    const v = p.slice(i + 1);                         // keep percent-encoded
    kv.push([k, v]);
  }
  kv.sort((a, b) => a[0].localeCompare(b[0]));
  const dcs = kv.map(([k, v]) => `${k}=${v}`).join("\n");
  return { dcs, providedHash };
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function validateInitData(input: string) {
  const raw = normalizeInitData(input);
  if (!raw) return { ok: false as const, reason: "missing initData" };

  const { dcs, providedHash } = buildDataCheckString(raw);
  if (!providedHash) return { ok: false as const, reason: "missing hash" };

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!botToken) return { ok: false as const, reason: "missing bot token" };

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(dcs).digest("hex");

  if (!timingSafeEqualHex(computed, providedHash)) {
    return { ok: false as const, reason: "invalid signature" };
  }

  const params = new URLSearchParams(raw);
  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(userRaw) : null;
  return { ok: true as const, user };
}
