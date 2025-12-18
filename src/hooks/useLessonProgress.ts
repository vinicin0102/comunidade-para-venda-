import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useLessonProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: completedLessons = [], isLoading } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((p) => p.lesson_id);
    },
    enabled: !!user,
  });

  const markComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("lesson_progress").insert({
        user_id: user.id,
        lesson_id: lessonId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      toast.success("Aula marcada como concluída!");
    },
    onError: () => {
      toast.error("Erro ao marcar aula como concluída");
    },
  });

  const markIncomplete = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("lesson_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      toast.success("Progresso removido");
    },
    onError: () => {
      toast.error("Erro ao remover progresso");
    },
  });

  const isCompleted = (lessonId: string) => completedLessons.includes(lessonId);

  const toggleComplete = (lessonId: string) => {
    if (isCompleted(lessonId)) {
      markIncomplete.mutate(lessonId);
    } else {
      markComplete.mutate(lessonId);
    }
  };

  return {
    completedLessons,
    isLoading,
    isCompleted,
    toggleComplete,
    markComplete: markComplete.mutate,
    markIncomplete: markIncomplete.mutate,
  };
}
