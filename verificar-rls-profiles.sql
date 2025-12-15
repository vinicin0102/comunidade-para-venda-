-- =====================================================
-- VERIFICAR RLS POLICIES PARA PROFILES
-- =====================================================
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Verificar se RLS está habilitado
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 2. Ver todas as policies de UPDATE na tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'UPDATE'
ORDER BY policyname;

-- 3. Ver todas as policies da tabela profiles
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 4. Verificar se admin pode atualizar
-- (Execute como admin no Supabase SQL Editor)
SELECT 
  current_user,
  current_setting('request.jwt.claims', true)::json->>'email' as email;

