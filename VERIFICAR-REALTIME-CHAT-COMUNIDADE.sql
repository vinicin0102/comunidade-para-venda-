-- =====================================================
-- 🔍 VERIFICAR E HABILITAR REALTIME PARA chat_messages
-- =====================================================
-- Execute este script no Supabase SQL Editor para garantir
-- que o chat da comunidade funcione em tempo real
-- =====================================================

-- 1. Verificar se a tabela chat_messages está na publicação realtime
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'chat_messages';

-- 2. Habilitar realtime para chat_messages se não estiver habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    RAISE NOTICE '✅ Realtime habilitado para chat_messages';
  ELSE
    RAISE NOTICE 'ℹ️ Realtime já está habilitado para chat_messages';
  END IF;
END $$;

-- 3. Verificar novamente para confirmar
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'chat_messages';

-- 4. Verificar políticas RLS para INSERT e DELETE na tabela chat_messages
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'chat_messages'
ORDER BY cmd, policyname;

-- 5. Verificar se existe política para usuários deletarem suas próprias mensagens
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'chat_messages'
  AND cmd = 'DELETE'
  AND (qual LIKE '%user_id%' OR with_check LIKE '%user_id%');

-- 6. Criar política para usuários deletarem suas próprias mensagens (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE tablename = 'chat_messages' 
      AND policyname = 'Users can delete own messages'
      AND cmd = 'DELETE'
  ) THEN
    CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE 
      USING (auth.uid() = user_id);
    RAISE NOTICE '✅ Política criada: Users can delete own messages';
  ELSE
    RAISE NOTICE 'ℹ️ Política "Users can delete own messages" já existe';
  END IF;
END $$;

-- 7. Verificar estrutura da tabela chat_messages
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- =====================================================
-- APÓS EXECUTAR, O CHAT DA COMUNIDADE DEVE FUNCIONAR
-- EM TEMPO REAL E OS USUÁRIOS PODERÃO DELETAR SUAS
-- PRÓPRIAS MENSAGENS
-- =====================================================

