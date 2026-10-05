/**
 * useMyEnrollments — lista todas as matrículas do usuário logado.
 * Usado na página /perfil/meus-cursos.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { COURSES } from "@/data/courses";
import type { Course } from "@/data/courses";

export interface MyEnrollmentRow {
  course: Course;
  enrolled_at: string;
  completed_lessons: number[];
  last_lesson_index: number;
  last_accessed_at: string;
  progressPercent: number;
}

interface UseMyEnrollmentsResult {
  rows: MyEnrollmentRow[];
  loading: boolean;
  enabled: boolean;
  reload: () => void;
}

export function useMyEnrollments(): UseMyEnrollmentsResult {
  const { user, isAuthenticated } = useAuth();
  const [rows, setRows] = useState<MyEnrollmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setRows([]);
      setLoading(false);
      setEnabled(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    supabase
      .from("course_enrollments")
      .select("*")
      .eq("user_id", user.id)
      .order("last_accessed_at", { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setEnabled(false);
          setRows([]);
        } else {
          setEnabled(true);
          const enriched: MyEnrollmentRow[] = (data ?? [])
            .map((e: any) => {
              const course = COURSES.find((c) => c.id === e.course_id);
              if (!course) return null;
              const total = course.lessons.length;
              const completed = Array.isArray(e.completed_lessons) ? e.completed_lessons.length : 0;
              return {
                course,
                enrolled_at: e.enrolled_at,
                completed_lessons: Array.isArray(e.completed_lessons) ? e.completed_lessons : [],
                last_lesson_index: e.last_lesson_index ?? 0,
                last_accessed_at: e.last_accessed_at,
                progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
              } as MyEnrollmentRow;
            })
            .filter((r): r is MyEnrollmentRow => r !== null);
          setRows(enriched);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setEnabled(false);
        setRows([]);
        setLoading(false);
      });
  }, [user, isAuthenticated, reloadTick]);

  return {
    rows,
    loading,
    enabled,
    reload: () => setReloadTick((t) => t + 1),
  };
}
