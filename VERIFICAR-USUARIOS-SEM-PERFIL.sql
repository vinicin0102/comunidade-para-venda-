-- =====================================================
-- VERIFICAR USUÁRIOS SEM PERFIL NA TABELA PROFILES
-- =====================================================
-- Este script identifica usuários que estão em auth.users
-- mas não têm perfil na tabela profiles
-- =====================================================

-- Listar usuários que estão em auth.users mas não têm perfil
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as data_cadastro,
  u.raw_user_meta_data->>'username' as username_metadata,
  u.raw_user_meta_data->>'full_name' as full_name_metadata,
  u.raw_user_meta_data->>'cpf' as cpf_metadata,
  u.raw_user_meta_data->>'telefone' as telefone_metadata,
  u.raw_user_meta_data->>'data_nascimento' as data_nascimento_metadata,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ SEM PERFIL'
    ELSE '✅ TEM PERFIL'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;

-- Contar quantos usuários estão sem perfil
SELECT 
  COUNT(*) as total_usuarios_sem_perfil,
  COUNT(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL) as usuarios_confirmados_sem_perfil,
  COUNT(*) FILTER (WHERE u.email_confirmed_at IS NULL) as usuarios_nao_confirmados_sem_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- =====================================================
-- CRIAR PERFIS PARA USUÁRIOS QUE NÃO TÊM
-- =====================================================
-- Execute este bloco para criar perfis automaticamente
-- =====================================================

INSERT INTO public.profiles (
  user_id,
  username,
  full_name,
  avatar_url,
  cpf,
  data_nascimento,
  telefone,
  email
)
SELECT 
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'username',
    split_part(u.email, '@', 1)
  ) as username,
  COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  u.raw_user_meta_data->>'cpf' as cpf,
  CASE 
    WHEN u.raw_user_meta_data->>'data_nascimento' IS NOT NULL 
    THEN (u.raw_user_meta_data->>'data_nascimento')::DATE
    ELSE NULL
  END as data_nascimento,
  u.raw_user_meta_data->>'telefone' as telefone,
  u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Verificar quantos perfis foram criados
SELECT 
  COUNT(*) as perfis_criados
FROM public.profiles p
WHERE p.created_at >= NOW() - INTERVAL '1 minute';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Verificar se ainda há usuários sem perfil
SELECT 
  COUNT(*) as usuarios_ainda_sem_perfil
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

