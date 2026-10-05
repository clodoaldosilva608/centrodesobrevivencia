import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Layers,
  Award,
  ChevronRight,
  Search,
  Filter,
  Lock,
  PlayCircle,
} from "lucide-react";
import { COURSES, COURSE_CATEGORIES, COURSE_LEVELS, getFeaturedCourse, type Course } from "@/data/courses";

const Cursos = () => {
  const [category, setCategory] = useState("Todos");
  const [level, setLevel] = useState("Todos");
  const [search, setSearch] = useState("");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const featured = getFeaturedCourse();

  const filtered = useMemo(() => {
    let result = COURSES;
    if (category !== "Todos") result = result.filter((c) => c.category === category);
    if (level !== "Todos") result = result.filter((c) => c.level === level);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.lessons.some((l) => l.toLowerCase().includes(q))
      );
    }
    return result;
  }, [category, level, search]);

  return (
    <Layout>
      <SEO
        title="Cursos de Sobrevivência e Bushcraft"
        description="Cursos práticos e progressivos de sobrevivência, bushcraft, navegação, fogo, água, equipamentos e psicologia. Aprenda com método, do iniciante ao avançado."
      />

      {/* HERO with featured course */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={featured.image}
            alt={featured.title}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-10 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground mb-4">
              <Award size={12} /> Curso em destaque
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-wider uppercase text-foreground leading-tight">
              {featured.title}
            </h1>
            <p className="mt-3 text-base md:text-lg text-muted-foreground">{featured.subtitle}</p>
            <p className="mt-4 text-sm text-foreground/80 leading-relaxed line-clamp-3">{featured.description}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Layers size={14} /> {featured.modules} módulos</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {featured.hours}h de conteúdo</span>
              <span className="flex items-center gap-1.5"><Award size={14} /> Nível {featured.level}</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="gap-2 uppercase tracking-wider text-xs">
                <Link to={`/cursos/${featured.id}`}>
                  <PlayCircle size={16} /> Ver curso completo
                </Link>
              </Button>
              <Link
                to="/login"
                className="border border-primary text-primary font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:bg-primary/10 transition-colors text-xs flex items-center gap-2"
              >
                Matricular <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Section
        title="Cursos Disponíveis"
        subtitle="Trilha de aprendizado progressiva, do iniciante ao avançado"
      >
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar curso por título, tema ou lição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </motion.div>

        {/* Category filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <Filter size={14} className="text-muted-foreground" />
          {COURSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Level filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <span className="text-xs text-muted-foreground">Nível:</span>
          {COURSE_LEVELS.map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                level === lv
                  ? "bg-primary/15 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lv}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Layers size={14} />
          <span>
            {filtered.length} {filtered.length === 1 ? "curso encontrado" : "cursos encontrados"}
          </span>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/50 transition-colors flex flex-col"
            >
              {/* Cover */}
              <Link to={`/cursos/${course.id}`} className="block relative aspect-[4/5] overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

                {/* Category badge */}
                <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-background/85 backdrop-blur text-foreground">
                  {course.category}
                </span>

                {/* Level badge */}
                <span
                  className={`absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur ${
                    course.level === "Iniciante"
                      ? "bg-emerald-500/80 text-white"
                      : course.level === "Intermediário"
                      ? "bg-amber-500/80 text-white"
                      : "bg-rose-500/80 text-white"
                  }`}
                >
                  {course.level}
                </span>

                {/* Hover preview */}
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider text-xs px-4 py-2 rounded-md">
                    <PlayCircle size={14} /> Ver curso completo
                  </span>
                </div>
              </Link>

              {/* Body */}
              <div className="flex-1 p-5 flex flex-col">
                <h3 className="font-heading text-lg text-foreground tracking-wide leading-tight">
                  {course.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground italic">{course.subtitle}</p>
                <p className="mt-3 text-sm text-foreground/80 line-clamp-3 flex-1">{course.description}</p>

                {/* Meta */}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers size={12} /> {course.modules} mód.</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {course.hours}h</span>
                </div>

                {/* CTA */}
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() => setActiveCourse(course)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Layers size={12} /> Prévia dos módulos
                  </button>
                  <Link
                    to={`/cursos/${course.id}`}
                    className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                  >
                    Detalhes <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Layers size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum curso encontrado com esses filtros.</p>
            <button
              onClick={() => {
                setCategory("Todos");
                setLevel("Todos");
                setSearch("");
              }}
              className="mt-3 text-primary text-sm hover:underline"
            >
              Limpar filtros
            </button>
          </motion.div>
        )}
      </Section>

      {/* Course modal */}
      {activeCourse && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setActiveCourse(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover */}
            <div className="relative aspect-video overflow-hidden rounded-t-2xl">
              <img src={activeCourse.image} alt={activeCourse.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              <button
                onClick={() => setActiveCourse(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-background"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                  {activeCourse.category}
                </span>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    activeCourse.level === "Iniciante"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : activeCourse.level === "Intermediário"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {activeCourse.level}
                </span>
              </div>

              <h3 className="font-heading text-2xl text-foreground tracking-wide">{activeCourse.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground italic">{activeCourse.subtitle}</p>
              <p className="mt-4 text-sm text-foreground/80 leading-relaxed">{activeCourse.description}</p>

              {/* Modules */}
              <div className="mt-6">
                <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                  <Layers size={14} /> Módulos do curso
                </h4>
                <ul className="space-y-2">
                  {activeCourse.lessons.map((lesson, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors"
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-foreground/90">{lesson}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Meta + CTA */}
              <div className="mt-6 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Layers size={12} /> {activeCourse.modules} módulos</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {activeCourse.hours}h</span>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider text-xs px-5 py-2.5 rounded-md hover:opacity-90"
                >
                  Matricular <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </Layout>
  );
};

export default Cursos;
