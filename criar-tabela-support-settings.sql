-- Criar tabela support_settings se não existir
CREATE TABLE IF NOT EXISTS public.support_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por key
CREATE INDEX IF NOT EXISTS idx_support_settings_key ON public.support_settings(key);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.support_settings ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.support_settings;
DROP POLICY IF EXISTS "Permitir escrita para usuários autenticados" ON public.support_settings;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para usuários autenticados"
  ON public.support_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir escrita para usuários autenticados
-- (Você pode restringir isso depois se necessário)
CREATE POLICY "Permitir escrita para usuários autenticados"
  ON public.support_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserir valores padrão se não existirem
INSERT INTO public.support_settings (key, value, description)
VALUES 
  ('app_primary_hue', '25', 'Matiz da cor primária do tema (0-360)'),
  ('app_primary_saturation', '95', 'Saturação da cor primária do tema (0-100)'),
  ('app_primary_lightness', '53', 'Luminosidade da cor primária do tema (0-100)'),
  ('app_name', 'Sociedade Nutra', 'Nome do aplicativo'),
  ('community_name', 'Comunidade dos Sócios', 'Nome da comunidade exibido no header'),
  ('auto_reply_enabled', 'true', 'Ativar/desativar mensagem automática de suporte'),
  ('auto_reply_message', 'Olá! Recebemos sua mensagem. Nossa equipe de suporte responderá em até 10 minutos. Obrigado pela paciência! 🙏', 'Conteúdo da mensagem automática enviada aos usuários')
ON CONFLICT (key) DO NOTHING;

-- Comentários na tabela
COMMENT ON TABLE public.support_settings IS 'Configurações gerais do sistema e tema';
COMMENT ON COLUMN public.support_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN public.support_settings.value IS 'Valor da configuração';
COMMENT ON COLUMN public.support_settings.description IS 'Descrição da configuração';

