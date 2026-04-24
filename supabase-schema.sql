-- Execute este script no SQL Editor do seu painel do Supabase

CREATE TABLE IF NOT EXISTS app_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE app_store ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura e escrita pública (para fins de demonstração/desenvolvimento)
-- Em produção, você deve restringir isso apenas para usuários autenticados
CREATE POLICY "Permitir acesso total" ON app_store
  FOR ALL
  USING (true)
  WITH CHECK (true);
