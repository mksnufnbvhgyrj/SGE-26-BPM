-- Execute este script no SQL Editor do seu painel do Supabase

CREATE TABLE IF NOT EXISTS app_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE app_store ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura e escrita apenas para usuários autenticados
CREATE POLICY "Permitir acesso autenticado" ON app_store
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
