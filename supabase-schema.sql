-- Execute este script no SQL Editor do seu painel do Supabase

-- Dropar tabela anterior caso já exista com "key" como PK
DROP TABLE IF EXISTS app_store CASCADE;

-- Criar tabela de armazenamento (agora por usuário referenciado)
CREATE TABLE IF NOT EXISTS app_store (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE app_store ENABLE ROW LEVEL SECURITY;

-- Política isolada para segurança multiusuário por app_store
CREATE POLICY "Leitura e Gravação permitida somente ao dono"
  ON app_store
  FOR ALL
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Tabela de Perfis de Usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Função para criar perfil automaticamente no cadastro do usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparada após o cadastro na auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função utilitária para checar se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
