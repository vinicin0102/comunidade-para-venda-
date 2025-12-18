import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from './useAdmin';
import { toast } from 'sonner';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useCourses() {
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: ['courses', isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as Course[];
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: async (course: Partial<Course>) => {
      if (!isAdmin) throw new Error('Apenas administradores podem criar cursos');
      
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: course.title || '',
          description: course.description || null,
          cover_url: course.cover_url || null,
          order_index: course.order_index ?? 0,
          is_published: course.is_published ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Curso criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar curso');
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: async ({ id, ...course }: Partial<Course> & { id: string }) => {
      if (!isAdmin) throw new Error('Apenas administradores podem atualizar cursos');
      
      const { data, error } = await supabase
        .from('courses')
        .update({
          ...course,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Curso atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar curso');
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error('Apenas administradores podem excluir cursos');
      
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      toast.success('Curso excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir curso');
    },
  });
}

export function useReorderCourses() {
  const queryClient = useQueryClient();
  const isAdmin = useIsAdmin();

  return useMutation({
    mutationFn: async (updates: Array<{ id: string; order_index: number }>) => {
      if (!isAdmin) throw new Error('Apenas administradores podem reordenar cursos');
      
      const promises = updates.map(({ id, order_index }) =>
        supabase
          .from('courses')
          .update({ order_index })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Erro ao reordenar cursos');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

