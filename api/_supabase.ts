import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role key
  { auth: { persistSession: false } }
);

export const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'verifications';
