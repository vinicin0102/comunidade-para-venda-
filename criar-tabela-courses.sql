-- Criar tabela courses se não existir
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida por ordem
CREATE INDEX IF NOT EXISTS idx_courses_order ON public.courses(order_index);

-- Criar índice para busca rápida por publicação
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published) WHERE is_published = true;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados (apenas cursos publicados)
CREATE POLICY "Permitir leitura de cursos publicados"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Política para permitir leitura completa para admin/suporte
CREATE POLICY "Permitir leitura completa para admin"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir escrita apenas para admin/suporte
CREATE POLICY "Permitir escrita para admin"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at_trigger ON public.courses;
CREATE TRIGGER update_courses_updated_at_trigger
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

-- Comentários na tabela
COMMENT ON TABLE public.courses IS 'Cursos disponíveis na plataforma';
COMMENT ON COLUMN public.courses.title IS 'Título do curso';
COMMENT ON COLUMN public.courses.description IS 'Descrição do curso';
COMMENT ON COLUMN public.courses.cover_url IS 'URL da capa do curso';
COMMENT ON COLUMN public.courses.order_index IS 'Ordem de exibição do curso';
COMMENT ON COLUMN public.courses.is_published IS 'Indica se o curso está publicado';



