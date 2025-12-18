import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from './useAdmin';
import { toast } from 'sonner';

export interface ExternalLink {
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  vturb_code: string | null;
  pdf_url: string | null;
  external_links: ExternalLink[];
  order_index: number;
  is_published: boolean;
  duration_minutes: number;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  order_index: number;
  is_published: boolean;
  is_locked: boolean;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export function useModules() {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ['modules', isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Module[];
    },
  });
}

export function useLessons(moduleId?: string) {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ['lessons', moduleId, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (moduleId) {
        query = query.eq('module_id', moduleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(lesson => ({
        ...lesson,
        external_links: (lesson.external_links as unknown as ExternalLink[]) || []
      })) as Lesson[];
    },
    enabled: !!moduleId || isAdmin,
  });
}

export function useModulesWithLessons() {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ['modules-with-lessons', isAdmin],
    queryFn: async () => {
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (modulesError) throw modulesError;

      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      const modulesWithLessons = (modules as Module[]).map(module => ({
        ...module,
        lessons: (lessons as any[])
          .filter(lesson => lesson.module_id === module.id)
          .map(lesson => ({
            ...lesson,
            external_links: (lesson.external_links as unknown as ExternalLink[]) || []
          })) as Lesson[]
      }));

      return modulesWithLessons;
    },
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return {
        ...data,
        external_links: (data.external_links as unknown as ExternalLink[]) || []
      } as Lesson;
    },
    enabled: !!lessonId,
  });
}

// Admin mutations
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('modules')
        .insert(module)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar módulo: ' + error.message);
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...module }: Partial<Module> & { id: string }) => {
      const { data, error } = await supabase
        .from('modules')
        .update(module)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Módulo atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar módulo: ' + error.message);
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Módulo excluído!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir módulo: ' + error.message);
    },
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          ...lesson,
          external_links: lesson.external_links as any
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Aula criada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar aula: ' + error.message);
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...lesson }: Partial<Lesson> & { id: string }) => {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          ...lesson,
          external_links: lesson.external_links as any
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Aula atualizada!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar aula: ' + error.message);
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['modules-with-lessons'] });
      toast.success('Aula excluída!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir aula: ' + error.message);
    },
  });
}
