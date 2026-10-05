/**
 * useCourseLessons — carrega vídeo-aulas de um curso a partir do Supabase.
 *
 * Fallback gracioso: se a tabela `course_lessons` ainda não existe no banco
 * (a migration não foi rodada), retorna `enabled: false` e o app mostra
 * "Em breve" para as lições.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface CourseLesson {
  id: string;
  course_id: string;
  lesson_index: number;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number;
  is_preview: boolean;
  updated_at: string;
}

interface UseCourseLessonsResult {
  lessons: CourseLesson[];
  loading: boolean;
  enabled: boolean; // false se tabela não existe ou erro de rede
  error: string | null;
  reload: () => void;
}

export function useCourseLessons(courseId: string | undefined): UseCourseLessonsResult {
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setLoading(false);
      setEnabled(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    supabase
      .from("course_lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_index", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          // Pode ser erro de tabela inexistente (codigo 42P01) ou de rede
          // Em qualquer caso, desabilita gracefully
          setEnabled(false);
          setError(error.message);
          setLessons([]);
        } else {
          setEnabled(true);
          setError(null);
          setLessons((data as CourseLesson[]) ?? []);
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setEnabled(false);
        setError((e as Error).message);
        setLessons([]);
        setLoading(false);
      });
  }, [courseId, reloadTick]);

  return {
    lessons,
    loading,
    enabled,
    error,
    reload: () => setReloadTick((t) => t + 1),
  };
}
