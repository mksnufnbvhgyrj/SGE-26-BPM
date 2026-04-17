/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'public-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas. A aplicação está rodando em modo de visualização local e as chamadas ao banco falharão.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
