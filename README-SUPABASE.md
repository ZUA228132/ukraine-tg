# Supabase подготовка

## 1. SQL
- Supabase → SQL Editor
- Вставь содержимое `supabase/schema.sql` → Run
- Новый запрос → вставь `supabase/policies.sql` → Run

## 2. Storage
- Supabase → Storage → Buckets → Create bucket
  - Name: verifications
  - Privacy: Private

## 3. Переменные окружения (Vercel)
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET=verifications
- TELEGRAM_BOT_TOKEN
- ADMIN_TG_IDS

## 4. Тест
- Запускай миниапп из Telegram
- Или открой /admin.html и вставь initData вручную
