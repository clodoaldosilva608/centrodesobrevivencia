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

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  category: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  modules: number;
  hours: number;
  lessons: string[];
  featured?: boolean;
}

const COURSES: Course[] = [
  {
    id: "essencial-sobrevivencia",
    title: "Essencial de Sobrevivência",
    subtitle: "O ponto de partida para todo sobrevivente",
    description:
      "Curso introdutório completo cobrindo os 5 pilares: água, fogo, abrigo, comida e resgate. Você sai com clareza do que fazer primeiro em qualquer situação de risco, das primeiras 24 horas até o resgate.",
    image: "/cursos/curso-essencial-sobrevivencia.webp",
    category: "Fundamentos",
    level: "Iniciante",
    modules: 6,
    hours: 8,
    lessons: ["A regra do 3", "Avaliação de cena", "Kit pessoal mínimo", "Plano de resgate", "Sinalização", "Psicologia do pânico"],
    featured: true,
  },
  {
    id: "purificacao-agua",
    title: "Purificação de Água na Natureza",
    subtitle: "Sem água você tem 3 dias. Aprenda a nunca ficar sem.",
    description:
      "Da coleta em rios turvos à destilação solar, este curso cobre todos os métodos de tratamento de água em campo. Inclui uso de filtros portáteis (LifeStraw, Sawyer), fervura eficiente, pastilhas cloradoras e destilação improvisada.",
    image: "/cursos/curso-purificacao-agua.webp",
    category: "Água",
    level: "Iniciante",
    modules: 5,
    hours: 6,
    lessons: ["Fontes seguras vs. contaminadas", "Filtro portátil passo a passo", "Fervura eficiente", "Pastilhas e cloro", "Destilação solar improvisada"],
  },
  {
    id: "fundamentos-bushcraft",
    title: "Fundamentos de Bushcraft",
    subtitle: "Viver com o que a floresta oferece",
    description:
      "O bushcraft não é só sobreviver — é habitar a natureza com habilidade. Este curso conecta os fundamentos do sobrevivencialismo com técnicas de bushcraft: fogo por atrito, abrigos de longa duração, ferramentas e cordoaria natural.",
    image: "/cursos/curso-fundamentos-bushcraft.webp",
    category: "Bushcraft",
    level: "Intermediário",
    modules: 7,
    hours: 10,
    lessons: ["Bow drill (fogo por atrito)", "Abrigo de longa duração", "Cordoaria natural", "Uso seguro de faca", "Processamento de lenha", "Fogueira tipológica", "Higiene de campo"],
  },
  {
    id: "navegacao-trilha",
    title: "Navegação e Trilha",
    subtitle: "Não se perca mais. Aprenda a ler o terreno.",
    description:
      "Navegação clássica com bússola e mapa topográfico, leitura de relevo, rumo reverso, intersecção de rumos e triangulação. Inclui navegação solar, pelo relevo e uso de GPS offline em emergência.",
    image: "/cursos/curso-navegacao-trilha.webp",
    category: "Navegação",
    level: "Intermediário",
    modules: 6,
    hours: 9,
    lessons: ["Leitura de mapa topográfico", "Bússola: rumo e azimute", "Triangulação", "Navegação solar", "Navegação por relevo", "GPS offline e waypoints"],
  },
  {
    id: "equipamentos-essenciais",
    title: "Equipamentos Essenciais",
    subtitle: "O gear certo pode salvar sua vida — saiba escolher",
    description:
      "Como montar seu kit de sobrevivência modular sem peso morto. Comparativo de mochilas, facas, filtros, lampiões, multisplash, roupas e calçados. Inclui checklist imprimível e guia de manutenção de campo.",
    image: "/cursos/curso-equipamentos-essenciais.webp",
    category: "Equipamentos",
    level: "Iniciante",
    modules: 5,
    hours: 7,
    lessons: ["Filosofia do kit modular", "Escolha de faca fixa", "Mochila ergonométrica", "Lanterna e lampião", "Manutenção e lubrificação"],
  },
  {
    id: "mente-forte",
    title: "Mente Forte: Psicologia da Sobrevivência",
    subtitle: "O corpo segue a mente. Treine a sua.",
    description:
      "Estudos militares mostram que 80% das mortes em situações de sobrevivência são causadas por pânico, não por falta de recursos. Este curso aborda concentração, controle de respiração, tomada de decisão sob estresse e resiliência emocional.",
    image: "/cursos/curso-mente-forte.webp",
    category: "Mentalidade",
    level: "Avançado",
    modules: 4,
    hours: 5,
    lessons: ["Respiração tática 4-4-4-4", "Regra STOP", "Decisão sob estresse", "Resiliência emocional"],
  },
  {
    id: "acampamento-autonomo",
    title: "Acampamento Autônomo",
    subtitle: "Passe 72h sozinho em campo — e goste",
    description:
      "Do select do local à desmontagem do acampamento, este curso coloca você em campo por 72 horas simuladas com gear mínimo. Inclui setup noturno, gerenciamento de bateria, sono reparador em campo e higiene prolongada.",
    image: "/cursos/curso-acampamento-autonomo.webp",
    category: "Campo",
    level: "Avançado",
    modules: 6,
    hours: 12,
    lessons: ["Seleção de local", "Setup noturno", "Sonífero natural", "Gestão de bateria", "Higiene prolongada", "Desmontagem sem rastro"],
  },
  {
    id: "dominio-do-fogo",
    title: "Domínio do Fogo",
    subtitle: "Da pederneira ao fogo de longa duração",
    description:
      "Tudo sobre fogo em condições adversas: pederneira (ferro-cério), isqueiros sob chuva, fogo por atrito (bow drill e hand drill), fogueiras tipológicas, manutenção noturna e extinção segura. Inclui prática com tinder úmido.",
    image: "/cursos/curso-dominio-do-fogo.webp",
    category: "Fogo",
    level: "Intermediário",
    modules: 5,
    hours: 8,
    lessons: ["Pederneira avançada", "Tinder úmido", "Bow drill", "Hand drill", "Fogo de longa duração"],
  },
  {
    id: "defesa-pessoal",
    title: "Defesa Pessoal e Combate Corpo a Corpo",
    subtitle: "Técnicas reais para o mundo real — não ringue",
    description:
      "Curso prático de autodefesa focado em situações reais de risco: golpes de imobilização, defesa contra agressores armados, projeções, finalizações e condicionamento físico específico. Inclui disciplina mental e protocolo de fuga antes de confronto.",
    image: "/cursos/curso-defesa-pessoal.webp",
    category: "Combate",
    level: "Avançado",
    modules: 6,
    hours: 12,
    lessons: ["Golpes e defesa base", "Defesa contra faca", "Projeções", "Finalizações", "Condicionamento físico", "Protocolo de fuga"],
  },
  {
    id: "construcao-abrigos",
    title: "Construção de Abrigos Naturais",
    subtitle: "Proteção, conforto e segurança em qualquer clima",
    description:
      "Aprenda a montar abrigos eficazes com materiais do terreno e lona: tarp, A-frame, cabana de galhos, abrigo iglu/ninja e Debris Hut. Inclui seleção de local, isolamento térmico do solo, impermeabilização e ventilação para fogueira interna.",
    image: "/cursos/curso-construcao-abrigos.webp",
    category: "Abrigo",
    level: "Intermediário",
    modules: 6,
    hours: 9,
    lessons: ["Seleção de local", "Tarp e A-frame", "Cabana de galhos", "Debris Hut", "Iglu ninja", "Fogueira interna segura"],
  },
  {
    id: "bug-out-bag",
    title: "Montagem de Bug Out Bag (BOB)",
    subtitle: "Seu kit de emergência para sair do imprevisto",
    description:
      "Como montar um BOB completo e leve: água, alimentação, abrigo, roupa, primeiros socorros, ferramentas, navegação, higiene, comunicação, luz e documentos. Inclui checklist imprimível e princípios de priorização por cenário.",
    image: "/cursos/curso-bug-out-bag.webp",
    category: "Equipamentos",
    level: "Iniciante",
    modules: 5,
    hours: 6,
    lessons: ["Filosofia do BOB", "Água e alimentação", "Primeiros socorros", "Ferramentas e navegação", "Documentos e comunicação"],
  },
];

const CATEGORIES = ["Todos", "Fundamentos", "Água", "Bushcraft", "Navegação", "Equipamentos", "Mentalidade", "Campo", "Fogo", "Combate", "Abrigo"];

const LEVELS = ["Todos", "Iniciante", "Intermediário", "Avançado"];

const Cursos = () => {
  const [category, setCategory] = useState("Todos");
  const [level, setLevel] = useState("Todos");
  const [search, setSearch] = useState("");
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

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

  const featured = COURSES.find((c) => c.featured)!;

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
              <Button onClick={() => setActiveCourse(featured)} className="gap-2 uppercase tracking-wider text-xs">
                <PlayCircle size={16} /> Ver módulos
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
          {CATEGORIES.map((cat) => (
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
          {LEVELS.map((lv) => (
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
              <div className="relative aspect-[4/5] overflow-hidden">
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
                  <button
                    onClick={() => setActiveCourse(course)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-heading uppercase tracking-wider text-xs px-4 py-2 rounded-md hover:opacity-90"
                  >
                    <PlayCircle size={14} /> Ver módulos
                  </button>
                </div>
              </div>

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
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock size={12} /> Acesso liberado após matrícula
                  </span>
                  <button
                    onClick={() => setActiveCourse(course)}
                    className="text-primary hover:underline text-xs font-semibold flex items-center gap-1"
                  >
                    Detalhes <ChevronRight size={12} />
                  </button>
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
