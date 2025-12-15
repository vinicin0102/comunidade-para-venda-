-- =====================================================
-- VERIFICAR SITUAÇÃO - VERSÃO SIMPLES
-- =====================================================
-- Este script apenas verifica a situação atual,
-- SEM tentar modificar triggers ou funções do sistema
-- Execute no Supabase SQL Editor
-- =====================================================

-- 1. CONTAR TOTAL DE USUÁRIOS EM auth.users
SELECT 
  COUNT(*) as total_usuarios_auth,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as usuarios_confirmados,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as usuarios_nao_confirmados,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') as usuarios_ontem,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as usuarios_ultimos_7_dias
FROM auth.users;

-- 2. CONTAR TOTAL DE PERFIS EM profiles
SELECT 
  COUNT(*) as total_perfis,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') as perfis_ontem,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as perfis_ultimos_7_dias
FROM public.profiles;

-- 3. COMPARAÇÃO: USUÁRIOS vs PERFIS
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_usuarios_auth,
  (SELECT COUNT(*) FROM public.profiles) as total_perfis,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.profiles) as usuarios_sem_perfil;

-- 4. LISTAR USUÁRIOS DE ONTEM QUE NÃO TÊM PERFIL
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as data_cadastro_auth,
  u.email_confirmed_at as email_confirmado,
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
WHERE u.created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY u.created_at DESC;

-- 5. COMPARAÇÃO DIA A DIA (últimos 7 dias)
SELECT 
  DATE(u.created_at) as data,
  COUNT(DISTINCT u.id) as usuarios_criados,
  COUNT(DISTINCT p.user_id) as perfis_criados,
  COUNT(DISTINCT u.id) - COUNT(DISTINCT p.user_id) as diferenca
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id AND DATE(p.created_at) = DATE(u.created_at)
WHERE u.created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(u.created_at)
ORDER BY DATE(u.created_at) DESC;

-- 6. LISTAR TODOS OS USUÁRIOS SEM PERFIL
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as data_cadastro_auth,
  u.email_confirmed_at as email_confirmado,
  u.raw_user_meta_data->>'username' as username_metadata,
  u.raw_user_meta_data->>'full_name' as full_name_metadata,
  u.raw_user_meta_data->>'cpf' as cpf_metadata,
  u.raw_user_meta_data->>'telefone' as telefone_metadata,
  CASE 
    WHEN p.user_id IS NULL THEN '❌ SEM PERFIL'
    ELSE '✅ TEM PERFIL'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC;

