-- 🔍 Script para Verificar e Restaurar Dados do Usuário
-- Execute este script no Supabase SQL Editor

-- 1️⃣ VERIFICAR DADOS DO USUÁRIO
-- Substitua 'seu-email@exemplo.com' pelo email da sua conta

SELECT 
  p.id,
  p.user_id,
  p.username,
  p.email,
  p.points,
  p.subscription_plan,
  p.subscription_expires_at,
  p.tier,
  p.role,
  p.is_banned,
  p.banned_until,
  p.is_muted,
  p.mute_until,
  p.posts_count,
  p.likes_given_count,
  p.comments_given_count,
  p.consecutive_days,
  p.created_at,
  p.updated_at,
  u.email as auth_email,
  u.created_at as user_created_at
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.user_id
WHERE u.email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL
   OR p.email = 'seu-email@exemplo.com';  -- ⚠️ SUBSTITUA PELO SEU EMAIL

-- 2️⃣ VERIFICAR ASSINATURAS NA TABELA subscriptions
-- (se você tiver a tabela subscriptions)

SELECT 
  s.*,
  p.username,
  p.email
FROM subscriptions s
LEFT JOIN profiles p ON p.user_id = s.user_id
WHERE p.email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL
   OR s.user_id IN (
     SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
   );

-- 3️⃣ RESTAURAR ASSINATURA DIAMOND (se necessário)
-- ⚠️ CUIDADO: Execute apenas se você realmente tinha Diamond antes!

-- Primeiro, encontre o user_id:
-- SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- Depois, atualize o perfil:
-- UPDATE profiles
-- SET 
--   subscription_plan = 'diamond',
--   subscription_expires_at = (CURRENT_TIMESTAMP + INTERVAL '1 year')::text
-- WHERE user_id = 'SEU_USER_ID_AQUI';  -- ⚠️ SUBSTITUA PELO SEU USER_ID

-- 4️⃣ VERIFICAR PONTOS E CONTAGENS
-- Ver se os pontos estão corretos

SELECT 
  p.username,
  p.email,
  p.points,
  p.posts_count,
  p.likes_given_count,
  p.comments_given_count,
  (SELECT COUNT(*) FROM posts WHERE user_id = p.user_id) as posts_real_count,
  (SELECT COUNT(*) FROM likes WHERE user_id = p.user_id) as likes_real_count,
  (SELECT COUNT(*) FROM comments WHERE user_id = p.user_id) as comments_real_count
FROM profiles p
WHERE p.email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL
   OR p.user_id IN (
     SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'
   );

-- 5️⃣ CORRIGIR CONTAGENS (se necessário)
-- Atualiza as contagens baseado nos dados reais

-- UPDATE profiles p
-- SET 
--   posts_count = (SELECT COUNT(*) FROM posts WHERE user_id = p.user_id),
--   likes_given_count = (SELECT COUNT(*) FROM likes WHERE user_id = p.user_id),
--   comments_given_count = (SELECT COUNT(*) FROM comments WHERE user_id = p.user_id)
-- WHERE p.email = 'seu-email@exemplo.com';  -- ⚠️ SUBSTITUA PELO SEU EMAIL

-- 6️⃣ VERIFICAR POSTS DO USUÁRIO
SELECT 
  id,
  content,
  created_at,
  likes_count,
  comments_count
FROM posts
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com'  -- ⚠️ SUBSTITUA PELO SEU EMAIL
)
ORDER BY created_at DESC
LIMIT 10;

