/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vgzguswtlcqvqzscxodb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4EojHKfSg2AVut8rcLp7NQ_a8Dif0It';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
