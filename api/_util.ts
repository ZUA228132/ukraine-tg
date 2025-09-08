import crypto from "crypto";

/** Allowed keys from Telegram docs (others игнорируем в подписи) */
const ALLOWED_KEYS = new Set([
  "auth_date",
  "can_send_after",
  "chat",
  "chat_instance",
  "chat_type",
  "hash",
  "query_id",
  "receiver",
  "start_param",
  "user",
]);

/** Нормализуем всё, что нам могли прислать, к RAW initData (без декодирования) */
function normalizeInitData(input: string): string {
  if (!input) return "";

  let s = input.trim();

  // Если прислали полный URL или hash c tgWebAppData=...
  // примеры:
  //  - https://host/page#tgWebAppData=query_id%3D...&tgWebAppVersion=...
  //  - #tgWebAppData=query_id%3D...&tgWebAppPlatform=...
  const m = s.match(/[#&?]tgWebAppData=([^&]+)/i);
  if (m && m[1]) {
    // ВАЖНО: не декодируем! tgWebAppData — это уже percent-encoded initData
    s = m[1];
  }

  // Срезаем ведущие ? или #
  if (s[0] === "?" || s[0] === "#") s = s.slice(1);

  // Если случайно прислали что-то вроде "initData=...", вытащим значение
  const m2 = s.match(/(?:^|[?&#])initData=([^&]+)/i);
  if (m2 && m2[1]) s = m2[1];

  // Если прислали целиком "hash=..." без остального — это точно не initData
  // (тут ничего не делаем; валидация ниже скажет invalid/missing)
  return s;
}

/** Собираем data_check_string строго из RAW пары ключ=значение, по правилам Telegram */
function buildDataCheckString(rawInitData: string): { dcs: string; providedHash: string } {
  const parts = rawInitData.split("&").filter(Boolean);

  // Достаём hash из RAW
  const hashPair = parts.find((p) => p.startsWith("hash="));
  const providedHash = hashPair ? hashPair.slice("hash=".length) : "";

  // Берём только разрешённые ключи (кроме hash), чтобы не сломаться от лишних параметров
  const kv: [string, string][] = [];
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq <= 0) continue;
    const k = p.slice(0, eq);
    if (k === "hash") continue;
    if (!ALLOWED_KEYS.has(k)) continue; // игнорируем мусорные ключи
    const v = p.slice(eq + 1); // ВНИМАНИЕ: v остаётся percent-encoded
    kv.push([k, v]);
  }

  // Сортировка по ключу (байтовая/лексикографическая)
  kv.sort((a, b) => a[0].localeCompare(b[0]));

  // Склейка "k=v" через \n — именно в таком виде ожидает Telegram
  const dcs = kv.map(([k, v]) => `${k}=${v}`).join("\n");
  return { dcs, providedHash };
}

/** Константное сравнение строк */
function timingSafeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Главная функция валидации initData */
export function validateInitData(input: string) {
  const raw = normalizeInitData(input);
  if (!raw) return { ok: false as const, reason: "missing initData" };

  const { dcs, providedHash } = buildDataCheckString(raw);
  if (!providedHash) return { ok: false as const, reason: "missing hash" };

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!botToken) return { ok: false as const, reason: "missing bot token" };

  // secret = sha256(BOT_TOKEN)
  const secret = crypto.createHash("sha256").update(botToken).digest();
  // HMAC-SHA256(data_check_string) в hex
  const computed = crypto.createHmac("sha256", secret).update(dcs).digest("hex");

  if (!timingSafeEqualHex(computed, providedHash)) {
    return { ok: false as const, reason: "invalid signature" };
  }

  // Подпись корректна — теперь можно парсить user (тут уже можно декодировать безопасно)
  const params = new URLSearchParams(raw);
  const userRaw = params.get("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  return { ok: true as const, user };
}
