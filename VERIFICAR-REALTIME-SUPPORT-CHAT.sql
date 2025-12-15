-- =====================================================
-- 🔍 VERIFICAR E HABILITAR REALTIME PARA support_chat
-- =====================================================
-- Este script verifica se o realtime está habilitado
-- para a tabela support_chat e habilita se necessário
-- =====================================================

-- 1. Verificar se a tabela support_chat está na publicação realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'support_chat';

-- 2. Habilitar realtime para support_chat se não estiver habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'support_chat'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat;
    RAISE NOTICE '✅ Realtime habilitado para support_chat';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime já está habilitado para support_chat';
  END IF;
END $$;

-- 3. Verificar novamente para confirmar
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'support_chat';

-- 4. Verificar se a tabela support_settings também precisa de realtime (opcional)
-- SELECT 
--   schemaname,
--   tablename
-- FROM pg_publication_tables
-- WHERE pubname = 'supabase_realtime'
--   AND tablename = 'support_settings';

