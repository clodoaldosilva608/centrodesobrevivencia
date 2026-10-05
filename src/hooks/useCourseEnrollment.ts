/**
 * useCourseEnrollment — gerencia matrícula e progresso do usuário em um curso.
 *
 * Fallback gracioso: se a tabela `course_enrollments` ainda não existe no banco,
 * retorna `enabled: false` e a página de detalhe mostra "Faça login para matricular"
 * sem chamar o banco em loops.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_lessons: number[];
  last_lesson_index: number;
  last_accessed_at: string;
}

interface UseCourseEnrollmentResult {
  enrollment: CourseEnrollment | null;
  loading: boolean;
  enabled: boolean; // false se tabela não existe ou user não logado
  isEnrolled: boolean;
  progressPercent: number; // 0-100 baseado em lições concluídas / total
  enroll: () => Promise<{ ok: boolean; error?: string }>;
  markLessonCompleted: (lessonIndex: number) => Promise<{ ok: boolean; error?: string }>;
  setLastLesson: (lessonIndex: number) => Promise<void>;
  reload: () => void;
}

export function useCourseEnrollment(
  courseId: string | undefined,
  totalLessons: number
): UseCourseEnrollmentResult {
  const { user, isAuthenticated } = useAuth();
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  // Carrega matrícula do banco
  useEffect(() => {
    if (!courseId || !user) {
      setEnrollment(null);
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
      .eq("course_id", courseId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setEnabled(false);
          setEnrollment(null);
        } else {
          setEnabled(true);
          setEnrollment((data as CourseEnrollment | null) ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setEnabled(false);
        setEnrollment(null);
        setLoading(false);
      });
  }, [courseId, user, reloadTick]);

  // Cria matrícula no banco
  const enroll = useCallback(async () => {
    if (!courseId || !user) return { ok: false, error: "Usuário não logado" };
    const { data, error } = await supabase
      .from("course_enrollments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        completed_lessons: [],
        last_lesson_index: 0,
      })
      .select("*")
      .single();
    if (error) {
      // Se já existe (unique constraint), busca
      if (error.code === "23505") {
        const { data: existing } = await supabase
          .from("course_enrollments")
          .select("*")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();
        if (existing) {
          setEnrollment(existing as CourseEnrollment);
          return { ok: true };
        }
      }
      return { ok: false, error: error.message };
    }
    setEnrollment(data as CourseEnrollment);
    return { ok: true };
  }, [courseId, user]);

  // Marca lição como concluída via RPC idempotente
  const markLessonCompleted = useCallback(
    async (lessonIndex: number) => {
      if (!courseId || !user) return { ok: false, error: "Não logado" };
      // Tenta usar o RPC; se falhar (tabela/função não existe), atualiza localmente
      const { data, error } = await supabase.rpc("mark_lesson_completed", {
        p_course_id: courseId,
        p_lesson_index: lessonIndex,
      });
      if (error) {
        // Fallback manual: update direto do array
        const current = enrollment?.completed_lessons ?? [];
        if (!current.includes(lessonIndex)) {
          const next = [...current, lessonIndex];
          const { error: updErr } = await supabase
            .from("course_enrollments")
            .update({
              completed_lessons: next,
              last_lesson_index: lessonIndex,
            })
            .eq("user_id", user.id)
            .eq("course_id", courseId);
          if (updErr) return { ok: false, error: updErr.message };
          setEnrollment((e) =>
            e
              ? { ...e, completed_lessons: next, last_lesson_index: lessonIndex }
              : e
          );
        }
        return { ok: true };
      }
      if (data) {
        setEnrollment(data as CourseEnrollment);
      }
      return { ok: true };
    },
    [courseId, user, enrollment]
  );

  // Atualiza última lição acessada (sem marcar como concluída)
  const setLastLesson = useCallback(
    async (lessonIndex: number) => {
      if (!courseId || !user || !enrollment) return;
      // Otimização: só atualiza se mudou
      if (enrollment.last_lesson_index === lessonIndex) return;
      const { error } = await supabase
        .from("course_enrollments")
        .update({ last_lesson_index: lessonIndex })
        .eq("user_id", user.id)
        .eq("course_id", courseId);
      if (!error) {
        setEnrollment((e) => (e ? { ...e, last_lesson_index: lessonIndex } : e));
      }
    },
    [courseId, user, enrollment]
  );

  const isEnrolled = !!enrollment;
  const completedCount = enrollment?.completed_lessons?.length ?? 0;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return {
    enrollment,
    loading,
    enabled: enabled && isAuthenticated,
    isEnrolled,
    progressPercent,
    enroll,
    markLessonCompleted,
    setLastLesson,
    reload: () => setReloadTick((t) => t + 1),
  };
}
