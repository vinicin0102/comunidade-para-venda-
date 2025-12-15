-- =====================================================
-- VERIFICAR STATUS DO USUÁRIO vv9250400@gmail.com
-- =====================================================

-- 1. Verificar se o usuário existe em auth.users
SELECT 
  id as user_id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'vv9250400@gmail.com';

-- 2. Verificar perfil atual
SELECT 
  p.user_id,
  p.username,
  p.email,
  p.points,
  p.role,
  p.subscription_plan,
  p.created_at,
  p.updated_at,
  u.email as auth_email
FROM profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'vv9250400@gmail.com';

-- 3. Se não retornar nada, o perfil não existe
-- Se retornar, verifique os valores de points, role e subscription_plan

