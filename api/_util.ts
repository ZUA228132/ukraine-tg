// api/_util.ts
// Надёжная валидация Telegram initData по HMAC.
// - секрeт = sha256(TELEGRAM_BOT_TOKEN)
// - DCS = ключи (кроме hash/signature) в алфавитном порядке
// - значения JSON (например, user) канонизируются: JSON.parse -> JSON.stringify
// - сравнение хэшей timing-safe
import crypto from "crypto";

function normalizeInitData(input: string): string {
  if (!input) return "";
  let s = input.trim();

  // Мог прийти весь tgWebAppData или ?initData=...
  const m = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m && m[1]) s = m[1];
  if (s[0] === "?" || s[0] === "#") s = s.slice(1);
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];

  return s;
}

function parsePairs(raw: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const p of raw.split("&")) {
    if (!p) continue;
    const i = p.indexOf("=");
    if (i <= 0) continue;
    const k = p.slice(0, i);
    const v = p.slice(i + 1); // оставляем percent-encoded
    if (k === "hash" || k === "signature") continue; // эти ключи НЕ участвуют в DCS
    out.push([k, v]);
  }
  // строго по алфавиту (byte-wise)
  out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return out;
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function canonicalizeValue(rawValue: string): string {
  // Если значение похоже на JSON — парсим и сериализуем канонично
  const dec = safeDecode(rawValue);
  const t = dec.trim();
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(dec));
    } catch {
      // если вдруг это невалидный JSON — берём как есть (decoded)
      return dec;
    }
  }
  return dec;
}

function buildDataCheckString(raw: string): string {
  const pairs = parsePairs(raw);
  // Формируем DCS из канонизированных значений
  return pairs.map(([k, v]) => `${k}=${canonicalizeValue(v)}`).join("\n");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const A = Buffer.from(a, "hex");
    const B = Buffer.from(b, "hex");
    if (A.length !== B.length) return false;
    return crypto.timingSafeEqual(A, B);
  } catch {
    return false;
  }
}

export type ValidInit =
  | { ok: true; user: any; params: URLSearchParams }
  | { ok: false; reason: string };

export function validateInitData(input: string): ValidInit {
  const raw = normalizeInitData(input);
  if (!raw) return { ok: false, reason: "missing initData" };

  const params = new URLSearchParams(raw);
  const providedHash = params.get("hash") || params.get("signature") || "";
  if (!providedHash) return { ok: false, reason: "missing hash" };

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) return { ok: false, reason: "missing bot token" };

  // секрет = sha256(bot_token)
  const secret = crypto.createHash("sha256").update(botToken).digest();

  // канонический data_check_string
  const dcs = buildDataCheckString(raw);

  // HMAC
  const computed = crypto.createHmac("sha256", secret).update(dcs).digest("hex");

  if (!timingSafeEqualHex(computed, providedHash)) {
    return { ok: false, reason: "invalid signature" };
  }

  // user может быть percent-encoded JSON
  let user: any = null;
  const userRaw = params.get("user");
  if (userRaw) {
    try {
      user = JSON.parse(safeDecode(userRaw));
    } catch {
      user = null;
    }
  }

  return { ok: true, user, params };
}

/**
 * Упрощённый helper для API-роутов:
 *  - читает initData из заголовка x-tg-initdata, либо из body.initData, либо из query.initData
 *  - кидает 401 при невалидной подписи
 */
export function requireTelegramAuth(req: any, res: any): { user: any; params: URLSearchParams } | null {
  const fromHeader = String(req.headers["x-tg-initdata"] || "");
  const fromQuery = typeof req.query?.initData === "string" ? req.query.initData : "";
  let fromBody = "";
  if (req.method !== "GET" && req.headers["content-type"]?.includes("application/json")) {
    try {
      fromBody = req.body?.initData || "";
    } catch {}
  }
  const raw = fromHeader || fromQuery || fromBody;
  const result = validateInitData(raw);
  if (!result.ok) {
    res.status(401).json({ error: result.reason });
    return null;
  }
  return { user: result.user, params: result.params };
}
