-- Verificar se a tabela notifications está habilitada para Realtime
-- Execute este SQL para garantir que as notificações funcionem em tempo real

-- Verificar se notifications está na publicação realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';

-- Se não retornar nenhuma linha, execute:
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Verificar políticas RLS para notifications
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'notifications'
ORDER BY policyname;

-- Verificar se as funções estão criando notificações corretamente
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_post_likes_count',
    'add_points_for_post',
    'add_points_for_comment',
    'add_points_for_chat'
  )
ORDER BY routine_name;

