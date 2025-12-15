-- Verificar e forçar acesso Diamond para vv9250400@gmail.com
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT 
  'Verificação de usuário' as etapa,
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  p.subscription_plan,
  p.subscription_expires_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'vv9250400@gmail.com';

-- 2. Forçar atualização para Diamond
UPDATE profiles
SET 
  subscription_plan = 'diamond',
  subscription_expires_at = NULL,
  updated_at = NOW()
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'vv9250400@gmail.com'
);

-- 3. Se o perfil não existe, criar
INSERT INTO profiles (user_id, username, subscription_plan, subscription_expires_at)
SELECT 
  id,
  split_part(email, '@', 1),
  'diamond',
  NULL
FROM auth.users 
WHERE email = 'vv9250400@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO UPDATE 
SET subscription_plan = 'diamond', 
    subscription_expires_at = NULL;

-- 4. Verificar resultado final
SELECT 
  'Resultado final' as etapa,
  u.id as user_id,
  u.email,
  p.username,
  p.subscription_plan,
  p.subscription_expires_at,
  CASE 
    WHEN p.subscription_plan = 'diamond' THEN '✓ ACESSO DIAMOND CONCEDIDO'
    ELSE '✗ ERRO - Acesso não concedido'
  END as status
FROM auth.users u
JOIN profiles p ON u.id = p.user_id
WHERE u.email = 'vv9250400@gmail.com';

