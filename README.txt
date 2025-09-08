REAL HMAC FINAL CHECK
----------------------
Files:
- api/_util.ts          : trims TELEGRAM_BOT_TOKEN and computes HMAC (RAW + decoded), excluding 'hash' and 'signature'.
- api/debug-getme.ts    : fetches Bot API getMe using env token and returns bot username/id (to verify correct bot).

Steps:
1) Replace files, commit, Deploy without cache.
2) Open /api/debug-getme to confirm bot 'username' matches the bot you're opening WebApp from.
3) Open /debug.html inside Telegram: expect HMAC OK.
