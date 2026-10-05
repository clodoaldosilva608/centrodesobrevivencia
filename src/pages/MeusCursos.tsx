import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Clock, Layers, ChevronRight, PlayCircle, Trophy, Loader2, Lock, BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMyEnrollments } from "@/hooks/useMyEnrollments";

const MeusCursos = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { rows, loading, enabled } = useMyEnrollments();

  if (!isAuthenticated) {
    return (
      <Layout>
        <SEO title="Meus Cursos — Centro de Sobrevivência" />
        <Section title="Meus Cursos" subtitle="Acompanhe seu progresso nas trilhas de aprendizado">
          <div className="text-center py-16 max-w-md mx-auto">
            <Lock size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-heading text-xl text-foreground tracking-wide mb-2">
              Faça login para acessar seus cursos
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Suas matrículas e progresso ficam salvos na sua conta.
            </p>
            <Button asChild className="gap-2 uppercase tracking-wider text-xs">
              <Link to="/login" state={{ from: "/perfil/meus-cursos" }}>
                Entrar <ChevronRight size={14} />
              </Link>
            </Button>
          </div>
        </Section>
      </Layout>
    );
  }

  // Totais
  const totalCourses = rows.length;
  const totalCompleted = rows.filter((r) => r.progressPercent === 100).length;
  const totalInProgress = totalCourses - totalCompleted;
  const avgProgress =
    totalCourses > 0
      ? Math.round(rows.reduce((acc, r) => acc + r.progressPercent, 0) / totalCourses)
      : 0;

  return (
    <Layout>
      <SEO title="Meus Cursos — Centro de Sobrevivência" description="Acompanhe seu progresso nos cursos matriculados." />

      <Section title="Meus Cursos" subtitle="Continue de onde parou e conclua sua trilha">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={GraduationCap} label="Cursos matriculados" value={totalCourses} />
          <StatCard icon={Trophy} label="Cursos concluídos" value={totalCompleted} />
          <StatCard icon={PlayCircle} label="Em andamento" value={totalInProgress} />
          <StatCard icon={Layers} label="Progresso médio" value={`${avgProgress}%`} />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty states */}
        {!loading && enabled && totalCourses === 0 && (
          <div className="text-center py-16 max-w-md mx-auto">
            <BookOpen size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <h2 className="font-heading text-xl text-foreground tracking-wide mb-2">
              Você ainda não se matriculou em nenhum curso
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Explore nosso catálogo com 11 cursos progressivos — do iniciante ao avançado.
            </p>
            <Button asChild className="gap-2 uppercase tracking-wider text-xs">
              <Link to="/cursos">
                Explorar cursos <ChevronRight size={14} />
              </Link>
            </Button>
          </div>
        )}

        {/* Feature disabled (DB not migrated) */}
        {!loading && !enabled && (
          <div className="text-center py-16 max-w-md mx-auto">
            <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8">
              <GraduationCap size={40} className="mx-auto text-primary mb-3" />
              <h2 className="font-heading text-lg text-foreground tracking-wide mb-2">
                Sistema de matrículas em ativação
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                O catálogo de cursos já está disponível para navegação. Em breve você poderá
                se matricular e acompanhar seu progresso aqui.
              </p>
              <Button asChild variant="outline" className="gap-2 uppercase tracking-wider text-xs border-primary text-primary">
                <Link to="/cursos">Ver catálogo de cursos</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Course grid */}
        {!loading && totalCourses > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((r, i) => (
              <motion.div
                key={r.course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors flex flex-col"
              >
                {/* Cover */}
                <Link to={`/cursos/${r.course.id}`} className="block relative aspect-video overflow-hidden">
                  <img
                    src={r.course.image}
                    alt={r.course.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  {r.progressPercent === 100 && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-white">
                      <Trophy size={10} /> Concluído
                    </span>
                  )}
                </Link>

                {/* Body */}
                <div className="flex-1 p-5 flex flex-col">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary mb-2 w-fit">
                    {r.course.category}
                  </span>
                  <h3 className="font-heading text-base text-foreground tracking-wide leading-tight">
                    {r.course.title}
                  </h3>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-bold text-primary">{r.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${r.progressPercent}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {r.completed_lessons.length} de {r.course.lessons.length} lições
                    </p>
                  </div>

                  {/* Meta + CTA */}
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={10} /> {r.course.hours}h
                    </span>
                    <Button
                      onClick={() => navigate(`/cursos/${r.course.id}`)}
                      size="sm"
                      className="gap-1 uppercase tracking-wider text-[11px] h-8"
                    >
                      {r.progressPercent === 0 ? "Começar" : r.progressPercent === 100 ? "Revisar" : "Continuar"}
                      <ChevronRight size={12} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {totalCourses > 0 && (
          <div className="text-center mt-10">
            <Button asChild variant="outline" className="gap-2 uppercase tracking-wider text-xs border-primary text-primary">
              <Link to="/cursos">
                Explorar mais cursos <ChevronRight size={14} />
              </Link>
            </Button>
          </div>
        )}
      </Section>
    </Layout>
  );
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

const StatCard = ({ icon: Icon, label, value }: StatCardProps) => (
  <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
      <Icon size={18} className="text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-lg font-heading text-foreground leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider truncate">{label}</p>
    </div>
  </div>
);

export default MeusCursos;
