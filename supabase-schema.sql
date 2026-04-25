-- Execute este script no SQL Editor do seu painel do Supabase

CREATE TABLE IF NOT EXISTS app_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Criar índice para melhorar a performance de consultas por chave
CREATE INDEX IF NOT EXISTS app_store_key_idx ON app_store(key);

-- Habilitar RLS (Row Level Security)
ALTER TABLE app_store ENABLE ROW LEVEL SECURITY;

-- Criar política para leitura e escrita para acesso anônimo (ajuste conforme necessário para produção)
CREATE POLICY "Permitir acesso anonimo" ON app_store
  FOR ALL
  USING (true)
  WITH CHECK (true);
