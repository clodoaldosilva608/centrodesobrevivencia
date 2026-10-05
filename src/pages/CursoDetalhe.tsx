import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Layers,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Users,
  Lock,
  PlayCircle,
  Flame,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { getCourseById, getRelatedCourses, COURSES } from "@/data/courses";

const LEVEL_STYLES: Record<string, string> = {
  Iniciante: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Intermediário: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Avançado: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

const CursoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const course = id ? getCourseById(id) : undefined;

  // Scroll to top on course change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  // 404 fallback
  if (!course) {
    return (
      <Layout>
        <SEO title="Curso não encontrado — Centro de Sobrevivência" />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-heading text-3xl tracking-wider uppercase text-foreground">
            Curso não encontrado
          </h1>
          <p className="mt-3 text-muted-foreground">
            O curso que você buscou não existe ou foi removido.
          </p>
          <Button asChild className="mt-6 gap-2 uppercase tracking-wider text-xs">
            <Link to="/cursos">
              <ChevronLeft size={14} /> Voltar para a lista de cursos
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const related = getRelatedCourses(course, 3);
  const levelClass = LEVEL_STYLES[course.level] ?? "";

  return (
    <Layout>
      <SEO
        title={`${course.title} — Centro de Sobrevivência`}
        description={course.description}
        type="article"
      />

      {/* ========================= HERO ========================= */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
              <ChevronRight size={10} />
              <Link to="/cursos" className="hover:text-foreground transition-colors">Cursos</Link>
              <ChevronRight size={10} />
              <span className="text-foreground truncate">{course.category}</span>
            </nav>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                {course.category}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${levelClass}`}>
                {course.level}
              </span>
              {course.featured && (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground flex items-center gap-1">
                  <Award size={10} /> Em destaque
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-wider uppercase text-foreground leading-tight">
              {course.title}
            </h1>
            <p className="mt-3 text-base md:text-lg text-muted-foreground italic">
              {course.subtitle}
            </p>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Layers size={14} /> {course.modules} módulos</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {course.hours}h de conteúdo</span>
              {course.instructor && (
                <span className="flex items-center gap-1.5"><Users size={14} /> {course.instructor}</span>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="gap-2 uppercase tracking-wider text-xs h-11">
                <Link to="/login">
                  Matricular agora <ChevronRight size={14} />
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/cursos")}
                className="gap-2 uppercase tracking-wider text-xs h-11 border-primary text-primary hover:bg-primary/10"
              >
                <ChevronLeft size={14} /> Voltar
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================= BODY ========================= */}
      <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left column — main content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-xl md:text-2xl tracking-wider uppercase text-foreground mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-primary" /> Sobre o curso
              </h2>
              <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                {course.description}
              </p>
              {course.longDescription && (
                <p className="mt-4 text-sm md:text-base text-foreground/80 leading-relaxed">
                  {course.longDescription}
                </p>
              )}
            </motion.div>

            {/* Atmospheric image (only for courses that have one) */}
            {course.atmosphericImage && (
              <motion.figure
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-2xl border border-border"
              >
                <img
                  src={course.atmosphericImage}
                  alt={`Atmosfera — ${course.title}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-56 sm:h-72 md:h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <p className="font-heading text-base md:text-lg uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Flame size={16} className="text-primary" /> Prática em condições reais
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Conteúdo aplicado em campo — não só teoria.
                  </p>
                </figcaption>
              </motion.figure>
            )}

            {/* What you'll learn */}
            {course.learn && course.learn.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-heading text-xl md:text-2xl tracking-wider uppercase text-foreground mb-4 flex items-center gap-2">
                  <Target size={18} className="text-primary" /> O que você vai aprender
                </h2>
                <ul className="space-y-3">
                  {course.learn.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                      <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                        <Check size={12} />
                      </span>
                      <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Modules */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-xl md:text-2xl tracking-wider uppercase text-foreground mb-4 flex items-center gap-2">
                <Layers size={18} className="text-primary" /> Módulos do curso
              </h2>
              <div className="space-y-2">
                {course.lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors"
                  >
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{lesson}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Módulo {idx + 1} de {course.lessons.length} · ~{Math.ceil(course.hours * 60 / course.lessons.length)} min
                      </p>
                    </div>
                    <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right column — sidebar */}
          <aside className="space-y-6">
            {/* Course summary card */}
            <div className="rounded-2xl border border-border bg-card p-6 sticky top-20">
              <h3 className="font-heading text-base tracking-wider uppercase text-foreground mb-4">
                Resumo do curso
              </h3>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><Layers size={12} /> Módulos</dt>
                  <dd className="font-medium text-foreground">{course.modules}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><Clock size={12} /> Duração</dt>
                  <dd className="font-medium text-foreground">{course.hours} horas</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground flex items-center gap-1.5"><Award size={12} /> Nível</dt>
                  <dd className="font-medium text-foreground">{course.level}</dd>
                </div>
                {course.instructor && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground flex items-center gap-1.5"><Users size={12} /> Instrutor</dt>
                    <dd className="font-medium text-foreground">{course.instructor}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <Button asChild className="w-full gap-2 uppercase tracking-wider text-xs h-11">
                  <Link to="/login">
                    Matricular <ChevronRight size={14} />
                  </Link>
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  <Lock size={10} className="inline mr-1" />
                  Acesso liberado após matrícula
                </p>
              </div>
            </div>

            {/* Audience */}
            {course.audience && (
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <h3 className="font-heading text-sm tracking-wider uppercase text-foreground mb-2 flex items-center gap-2">
                  <Users size={14} className="text-primary" /> Para quem é este curso
                </h3>
                <p className="text-xs text-foreground/80 leading-relaxed">{course.audience}</p>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && (
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <h3 className="font-heading text-sm tracking-wider uppercase text-foreground mb-2 flex items-center gap-2">
                  <Target size={14} className="text-primary" /> Pré-requisitos
                </h3>
                <ul className="space-y-1.5">
                  {course.prerequisites.map((p, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                      <ArrowRight size={10} className="mt-1 text-primary flex-shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ========================= RELATED COURSES ========================= */}
      {related.length > 0 && (
        <section className="bg-card/50 border-t border-border py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="font-heading text-2xl md:text-3xl tracking-wider uppercase text-foreground">
                Cursos relacionados
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Continue sua trilha de aprendizado
              </p>
              <div className="mt-4 w-16 h-1 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rc, i) => (
                <Link key={rc.id} to={`/cursos/${rc.id}`} className="group block">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <img
                        src={rc.image}
                        alt={rc.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/85 text-primary-foreground mb-1">
                        {rc.category}
                      </span>
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">{rc.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rc.modules} módulos · {rc.hours}h
                      </p>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/cursos"
                className="inline-flex items-center gap-2 border border-primary text-primary font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:bg-primary/10 transition-colors text-xs"
              >
                <ChevronLeft size={14} /> Ver todos os cursos
              </Link>
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default CursoDetalhe;
