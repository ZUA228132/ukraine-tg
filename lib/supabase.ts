import { createClient } from '@supabase/supabase-js';
import { env } from './env';

type Database = any;

export const supabaseService = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
