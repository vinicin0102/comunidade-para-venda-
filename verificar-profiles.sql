-- Verificar estrutura da tabela profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- Ver um exemplo de registro
SELECT * FROM profiles LIMIT 1;


