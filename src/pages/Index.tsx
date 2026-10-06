import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Compass,
  Globe,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Layers,
  Clock,
  Award,
  Map,
  Backpack,
  Siren,
  Radio,
  Tent,
  Flame,
  Droplets,
  HeartPulse,
  Mountain,
  Flashlight,
  Wrench,
  Crosshair,
  Heart,
  Zap,
  Brain,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import ContentCard from "@/components/ContentCard";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { MANUAL_URL } from "@/lib/manual";
import { supabase } from "@/lib/supabase";
import { useAppSetting } from "@/hooks/useAppSetting";
import { Loader2 } from "lucide-react";

/* ────────────────────────────────────────────────────────────────
 * Landing "poster": identidade visual da campanha do Centro de
 * Sobrevivência — grunge preto + laranja spray, tipografia Anton,
 * pinceladas Permanent Marker, bússola e topografia.
 * ──────────────────────────────────────────────────────────────── */

const features = [
  { icon: Map, label: "Mapa Tático", desc: "Globo 3D, camadas e medição de terreno" },
  { icon: Compass, label: "Bússola Tática", desc: "Norte verdadeiro, magnético e astros ao vivo" },
  { icon: Backpack, label: "MOCHILA", desc: "Kits prontos de 8h a 300h, editáveis" },
  { icon: Siren, label: "SOS", desc: "Strobo Morse com som e mensagens" },
  { icon: Radio, label: "Boletim", desc: "GDELT, FIRMS e AIS em tempo real" },
  { icon: Globe, label: "OSIRIS", desc: "Globo OSINT com alertas globais" },
];

const pilares = [
  {
    icon: Tent,
    titulo: "Bushcraft",
    desc: "Técnicas práticas para você se virar na natureza.",
  },
  {
    icon: Flame,
    titulo: "Fogo",
    desc: "Do zero ao fogo, com métodos confiáveis.",
  },
  {
    icon: Droplets,
    titulo: "Água",
    desc: "Encontre, trate e armazene com segurança.",
  },
  {
    icon: HeartPulse,
    titulo: "Primeiros Socorros",
    desc: "Cuide de você e de quem está com você.",
  },
  {
    icon: Compass,
    titulo: "Orientação",
    desc: "Navegue e encontre o seu caminho.",
  },
];

const aguaPassos = [
  { titulo: "ENCONTRE", desc: "fontes seguras na natureza" },
  { titulo: "TRATE SEMPRE", desc: "fervura, filtro ou químicos" },
  { titulo: "ARMAZENE", desc: "com segurança e higiene" },
  { titulo: "ECONOMIZE", desc: "cada gota faz diferença" },
];

const equipamentos = [
  {
    icon: Backpack,
    titulo: "Mochila",
    desc: "Organização e praticidade para sua jornada.",
  },
  {
    icon: Tent,
    titulo: "Barraca",
    desc: "Proteção contra o clima e os perigos da natureza.",
  },
  {
    icon: Flashlight,
    titulo: "Lanterna",
    desc: "Luz no escuro e segurança em qualquer situação.",
  },
  {
    icon: Wrench,
    titulo: "Canivete multiuso",
    desc: "Versatilidade para resolver imprevistos.",
  },
  {
    icon: Droplets,
    titulo: "Sistema de água",
    desc: "Hidratação é vida. Sempre com você.",
  },
];

const menteForte = [
  { icon: Crosshair, titulo: "Foco" },
  { icon: Brain, titulo: "Calma" },
  { icon: Zap, titulo: "Decisão" },
  { icon: Mountain, titulo: "Resiliência" },
];

const posters = [
  { src: "/posters/01-conhecimento-salva-vidas.jpg", title: "Conhecimento Salva Vidas" },
  { src: "/posters/02-agua-e-vida.jpg", title: "Água é Vida" },
  { src: "/posters/03-grade-cinco-temas.jpg", title: "Cinco Temas da Preparação" },
  { src: "/posters/04-seu-futuro-e-preparacao.jpg", title: "Seu Futuro é Preparação" },
  { src: "/posters/05-preparacao-e-liberdade.jpg", title: "Preparação é Liberdade" },
  { src: "/posters/06-mente-forte-sobrevive.jpg", title: "Mente Forte Sobrevive" },
  { src: "/posters/07-disciplina-gera-resultados.jpg", title: "Disciplina Gera Resultados" },
  { src: "/posters/08-equipamento-e-vida.jpg", title: "Equipamento é Vida" },
  { src: "/posters/09-grade-redes-sociais.jpg", title: "Série Redes Sociais" },
  { src: "/posters/10-sobrevivencia-nao-e-sorte.jpg", title: "Sobrevivência Não é Sorte" },
];

const pontosCardeais = [
  { d: "N", cls: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2", hot: true },
  { d: "E", cls: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2", hot: false },
  { d: "S", cls: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2", hot: false },
  { d: "O", cls: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2", hot: false },
];

/* Logo da campanha: montanha gêmea sobre selo laranja (pôsteres) */
const MountainLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect
      x="3"
      y="3"
      width="58"
      height="58"
      rx="5"
      fill="hsl(18 96% 48%)"
      transform="rotate(-2 32 32)"
    />
    <path d="M11 46 L25 20 L32.5 33 L41 15 L53 46 Z" fill="#0d0d0d" />
    <path d="M25 20 L28.6 26.6 L24.4 26.2 L21.8 30.4 Z" fill="#f2e8d5" />
    <path d="M41 15 L45.2 23.4 L40.6 22.8 L37.6 27.6 Z" fill="#f2e8d5" />
  </svg>
);

/* Cabeçalho de seção no estilo pôster */
const PosterHeader = ({
  kicker,
  title,
  accent,
  sub,
  center = false,
}: {
  kicker: string;
  title: string;
  accent?: string;
  sub?: string;
  center?: boolean;
}) => (
  <div className={`mb-10 ${center ? "text-center" : ""}`}>
    <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-tactical-orange mb-3">
      {kicker}
    </p>
    <h2 className="font-poster text-3xl sm:text-4xl md:text-5xl uppercase leading-[0.95] text-foreground">
      {title}
      {accent && <span className="text-tactical-orange"> {accent}</span>}
    </h2>
    <div className={`mt-4 h-1.5 w-28 hazard-stripes ${center ? "mx-auto" : ""}`} />
    {sub && (
      <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        {sub}
      </p>
    )}
  </div>
);

interface HomeProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  buyLink: string;
}

const Index = () => {
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [posterIdx, setPosterIdx] = useState<number | null>(null);
  const { value: coursesStatus, loading: loadingStatus } = useAppSetting<
    "coming_soon" | "live"
  >("courses_landing_status", "coming_soon");
  const isCoursesLive = coursesStatus === "live";

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("slug, name, category, description, price, image, buy_link")
          .order("featured", { ascending: false })
          .order("name", { ascending: true })
          .limit(6);
        if (error) throw error;
        setProducts(
          (data ?? []).map((r: any) => ({
            id: r.slug,
            name: r.name,
            category: r.category ?? "",
            description: r.description ?? "",
            price: r.price ?? "",
            image: r.image ?? "",
            buyLink: r.buy_link ?? "",
          })),
        );
      } catch (e) {
        console.error("Erro ao carregar produtos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Lightbox: fecha com ESC e trava a setas fora do intervalo */
  useEffect(() => {
    if (posterIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPosterIdx(null);
      if (e.key === "ArrowRight")
        setPosterIdx((i) => (i === null ? null : (i + 1) % posters.length));
      if (e.key === "ArrowLeft")
        setPosterIdx((i) =>
          i === null ? null : (i - 1 + posters.length) % posters.length,
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [posterIdx]);

  return (
    <Layout>
      <SEO
        title="Centro de Sobrevivência — Bushcraft e Aventura"
        description="Hub brasileiro de bushcraft e sobrevivencialismo: conhecimento que salva vidas — fogo, água, abrigo, orientação, equipamentos e o app Manual do Sobrevivente."
      />

      {/* ═══════════ HERO — SOBREVIVÊNCIA NÃO É SORTE ═══════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            aria-hidden="true"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover opacity-40"
          />
          {/* camadas grunge da campanha */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
          <div className="absolute inset-0 grunge-noise opacity-30" />
          <div className="absolute inset-0 spray-splatter opacity-70" />
          <div className="absolute bottom-0 right-0 w-[540px] h-[540px] topo-pattern opacity-60" />
          <div className="absolute left-0 top-0 h-full w-3 hazard-stripes opacity-50" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <MountainLogo className="w-16 h-16 md:w-20 md:h-20 mb-6 drop-shadow-[0_6px_18px_rgba(242,104,31,0.35)]" />

            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.35em] text-foreground/70 mb-5">
              Centro de Sobrevivência · Bushcraft &amp; Preparação
            </p>

            <h1 className="font-poster uppercase leading-[0.92] text-[13vw] sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="block text-foreground">Sobrevivência</span>
              <span className="block text-tactical-orange drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]">
                não é sorte.
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-2xl font-semibold text-foreground/90">
              É conhecimento, preparo e prática.
            </p>

            <div className="brush-badge mt-7 px-6 py-2.5 -rotate-2">
              <span className="font-brush text-xl md:text-2xl text-[#f2e8d5]">
                Prepare-se antes de precisar.
              </span>
            </div>

            <div className="mt-9 flex flex-wrap gap-4 justify-center">
              <a
                href={MANUAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3.5 rounded-md hover:opacity-90 transition-opacity text-sm flex items-center gap-2 shadow-[0_8px_24px_rgba(242,104,31,0.35)]"
              >
                <Compass className="w-4 h-4" />
                Abrir o Manual
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <Link
                to="/cursos"
                className="border-2 border-tactical-orange text-tactical-orange font-heading tracking-wider uppercase px-8 py-3.5 rounded-md hover:bg-tactical-orange/10 transition-colors text-sm"
              >
                Ver Cursos
              </Link>
            </div>

            <div className="mt-10 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-muted-foreground/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>Mapa tático</span>
              <span className="text-primary">·</span>
              <span>Bússola</span>
              <span className="text-primary">·</span>
              <span>MOCHILA</span>
              <span className="text-primary">·</span>
              <span>SOS Morse</span>
              <span className="text-primary">·</span>
              <span>Boletim</span>
              <span className="text-primary">·</span>
              <span>OSIRIS</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PILARES — CONHECIMENTO SALVA VIDAS ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 grunge-noise opacity-15" />
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// Conhecimento salva vidas"
            title="No Centro de Sobrevivência você aprende o que"
            accent="realmente importa."
            sub="Mais do que cursos: é preparação real. Cinco pilares que sustentam qualquer saída de casa — e qualquer imprevisto."
            center
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {pilares.map((p, i) => (
              <motion.div
                key={p.titulo}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <div className="mx-auto w-16 h-16 rounded-full border-2 border-tactical-orange flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(242,104,31,0.15)]">
                  <p.icon className="w-7 h-7 text-tactical-orange" strokeWidth={1.75} />
                </div>
                <h3 className="font-heading text-sm uppercase tracking-widest text-tactical-orange font-semibold">
                  {p.titulo}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[180px] mx-auto">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </div>
          <p className="text-center mt-12 font-brush text-2xl md:text-3xl text-tactical-orange -rotate-1">
            Mais do que cursos, é preparação real.
          </p>
        </div>
      </section>

      {/* ═══════════ MANUAL DO SOBREVIVENTE — O APP ═══════════ */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 tactical-grid opacity-40" />
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="poster-panel rounded-md p-6 md:p-10"
          >
            <div className="flex flex-col lg:flex-row gap-10 lg:items-center">
              <div className="flex-1 min-w-0">
                <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-tactical-orange border border-tactical-orange/40 bg-tactical-orange/10 px-2 py-1 mb-4">
                  O app da campanha · PWA offline
                </span>
                <h2 className="font-poster text-3xl md:text-5xl text-foreground uppercase leading-[0.95]">
                  Manual do{" "}
                  <span className="text-tactical-orange">Sobrevivente</span>
                </h2>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  O app tático que acompanha você em campo: mapa com globo 3D,
                  bússola de precisão com astros reais, mochilas prontas, SOS
                  com Morse e boletim de inteligência — tudo funcionando
                  offline no bolso.
                </p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {features.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-start gap-2 font-mono text-[11px] sm:text-xs text-foreground/85"
                    >
                      <ChevronRight
                        size={12}
                        className="text-tactical-orange mt-0.5 shrink-0"
                      />
                      <span>
                        <b className="text-foreground">{f.label}:</b>{" "}
                        {f.desc}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={MANUAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-primary text-primary-foreground font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-xs flex items-center gap-2"
                  >
                    Abrir o app <ExternalLink size={14} />
                  </a>
                  <a
                    href={`${MANUAL_URL}/dashboard`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-tactical-orange/50 text-tactical-orange font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:bg-tactical-orange/10 transition-colors text-xs"
                  >
                    Boletim de Inteligência
                  </a>
                </div>
              </div>
              {/* Rosa dos ventos */}
              <div className="flex-shrink-0 mx-auto">
                <div className="relative w-52 h-52 sm:w-64 sm:h-64">
                  <div className="absolute inset-0 rounded-full border-2 border-tactical-orange/30" />
                  <div className="absolute inset-5 rounded-full border border-border" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Compass
                      className="w-20 h-20 sm:w-24 sm:h-24 text-tactical-orange"
                      strokeWidth={1.25}
                    />
                  </div>
                  {pontosCardeais.map(({ d, cls, hot }) => (
                    <span
                      key={d}
                      className={`absolute font-mono text-[10px] px-1 bg-background ${
                        hot
                          ? "text-tactical-orange font-bold"
                          : "text-muted-foreground"
                      } ${cls}`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <p className="text-center font-mono text-[10px] text-muted-foreground mt-5 tracking-[0.2em]">
                  LAT -8.02421 · LON -34.87058
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ NÃO SE PERCA NO CAMINHO — BÚSSOLA ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 topo-pattern opacity-40" />
        <div className="absolute inset-0 grunge-noise opacity-15" />
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <PosterHeader
                kicker="// Orientação"
                title="Não se perca"
                accent="no caminho."
                sub="Saber se orientar pode salvar sua vida. A bússola tática do Manual entrega norte verdadeiro e magnético, Sol, Lua, Cruzeiro do Sul e Polaris em tempo real — mesmo sem sinal."
              />
              <ul className="space-y-4 mb-8">
                {[
                  "Use a bússola — leitura instantânea com o sensor do celular",
                  "Leia o terreno — MGRS, coordenadas e waypoints no mapa tático",
                  "Entenda o ambiente — astros ao vivo e rotação do mapa com o sensor",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rotate-45 bg-tactical-orange" />
                    <span className="text-sm md:text-base text-foreground/85 font-medium">
                      {t}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href={`${MANUAL_URL}/dashboard`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-7 py-3.5 rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                Abrir a Bússola Tática <ExternalLink size={15} />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative mx-auto w-72 h-72 sm:w-96 sm:h-96"
            >
              <div className="absolute inset-0 rounded-full border-2 border-tactical-orange/40" />
              <div className="absolute inset-4 rounded-full border border-tactical-orange/20" />
              <div className="absolute inset-10 rounded-full border border-border" />
              {/* agulha */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative w-1.5 h-32 sm:h-44">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-b-[56px] border-b-tactical-orange" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[7px] border-x-transparent border-t-[56px] border-t-muted-foreground/50" />
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground border-2 border-tactical-orange" />
              {pontosCardeais.map(({ d, cls, hot }) => (
                <span
                  key={d}
                  className={`absolute font-poster text-lg px-1.5 bg-background ${
                    hot ? "text-tactical-orange" : "text-foreground/70"
                  } ${cls}`}
                >
                  {d}
                </span>
              ))}
              <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 font-brush text-xl text-tactical-orange whitespace-nowrap">
                Use a bússola. Leia o terreno.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ ÁGUA É VIDA ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden border-y border-border">
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="poster-frame overflow-hidden rounded-sm">
                <img
                  src="/posters/02-agua-e-vida.jpg"
                  alt="Pôster Água é Vida — filtro de água portátil em rio"
                  loading="lazy"
                  decoding="async"
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -top-3 -left-3 w-14 h-14 hazard-stripes opacity-70 -rotate-12" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <PosterHeader
                kicker="// Água"
                title="Água"
                accent="é vida."
                sub="Em uma situação de sobrevivência, saber encontrar, avaliar, tratar e armazenar água pode ser fundamental. Conhecimento básico pode fazer uma grande diferença."
              />
              <ul className="space-y-5">
                {aguaPassos.map((p) => (
                  <li key={p.titulo} className="flex items-start gap-4">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rotate-45 bg-tactical-orange" />
                    <p className="text-sm md:text-base">
                      <span className="font-heading font-semibold uppercase tracking-wider text-tactical-orange">
                        {p.titulo}
                      </span>{" "}
                      <span className="text-foreground/80">— {p.desc}.</span>
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-8 font-brush text-2xl text-tactical-orange -rotate-1">
                Aprenda antes de precisar.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ EQUIPAMENTO É VIDA ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 grunge-noise opacity-15" />
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// Equipamento"
            title="Equipamento"
            accent="é vida."
            sub="Ter o equipamento certo não é luxo, é necessidade. Ele pode garantir sua segurança, seu conforto e aumentar suas chances de sobrevivência."
            center
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {equipamentos.map((e, i) => (
              <motion.div
                key={e.titulo}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="poster-panel rounded-md p-6 text-center"
              >
                <div className="mx-auto w-14 h-14 rounded-full border-2 border-tactical-orange flex items-center justify-center mb-4">
                  <e.icon className="w-6 h-6 text-tactical-orange" strokeWidth={1.75} />
                </div>
                <h3 className="font-heading text-sm uppercase tracking-widest text-tactical-orange font-semibold">
                  {e.titulo}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {e.desc}
                </p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="brush-badge px-6 py-2.5 -rotate-2">
              <span className="font-brush text-xl md:text-2xl text-[#f2e8d5]">
                Prepare-se. Equipe-se. Viva mais.
              </span>
            </div>
            <Link
              to="/equipamentos"
              className="inline-flex items-center gap-2 border-2 border-tactical-orange text-tactical-orange font-heading tracking-wider uppercase px-7 py-3 rounded-md hover:bg-tactical-orange/10 transition-colors text-sm"
            >
              Ver equipamentos <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ MENTE FORTE SOBREVIVE ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden border-y border-border">
        <div className="absolute inset-0 topo-pattern opacity-30" />
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <PosterHeader
                kicker="// Mentalidade"
                title="Mente forte"
                accent="sobrevive."
                sub="Nem todo desafio está no ambiente. Manter a calma, observar, pensar com clareza e tomar decisões conscientes são habilidades que também precisam ser treinadas."
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {menteForte.map((m, i) => (
                  <motion.div
                    key={m.titulo}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="border-l-2 border-tactical-orange/60 pl-3"
                  >
                    <m.icon className="w-6 h-6 text-tactical-orange mb-2" strokeWidth={1.75} />
                    <p className="font-heading text-xs uppercase tracking-widest text-foreground font-semibold">
                      {m.titulo}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div className="brush-badge px-5 py-2 -rotate-1">
                  <span className="font-brush text-lg md:text-xl text-[#f2e8d5]">
                    Controle o medo. Foque no próximo passo.
                  </span>
                </div>
                <Link
                  to="/cursos/mente-forte"
                  className="inline-flex items-center gap-1.5 text-tactical-orange hover:underline text-sm font-semibold uppercase tracking-wider"
                >
                  Curso Mente Forte <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="poster-frame overflow-hidden rounded-sm">
                <img
                  src="/posters/06-mente-forte-sobrevive.jpg"
                  alt="Pôster Mente Forte Sobrevive — explorador junto à fogueira ao anoitecer"
                  loading="lazy"
                  decoding="async"
                  className="w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 w-14 h-14 hazard-stripes opacity-70 rotate-12" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ A CAMPANHA — GALERIA DOS PÔSTERES ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 grunge-noise opacity-15" />
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// A campanha"
            title="Conhecimento"
            accent="salva vidas."
            sub="A identidade da marca em cartazes de rua: preto profundo, laranja spray e uma verdade simples — prepare-se antes de precisar. Toque para ampliar."
            center
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {posters.map((p, i) => (
              <motion.button
                key={p.src}
                type="button"
                onClick={() => setPosterIdx(i)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 5) * 0.06 }}
                whileHover={{ y: -6, rotate: i % 2 === 0 ? -1 : 1 }}
                className="poster-frame group relative overflow-hidden rounded-sm border border-border focus:outline-none focus:ring-2 focus:ring-tactical-orange cursor-zoom-in"
                aria-label={`Ampliar pôster ${p.title}`}
              >
                <img
                  src={p.src}
                  alt={`Pôster da campanha: ${p.title}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 pt-8 text-left">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-tactical-orange">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="font-heading text-xs uppercase tracking-wider text-foreground leading-tight">
                    {p.title}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {posterIdx !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setPosterIdx(null)}
            >
              <button
                type="button"
                className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center border border-tactical-orange/50 text-tactical-orange hover:bg-tactical-orange/10 rounded-sm"
                onClick={() => setPosterIdx(null)}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
              <button
                type="button"
                className="absolute left-3 sm:left-6 w-11 h-11 flex items-center justify-center border border-tactical-orange/50 text-tactical-orange hover:bg-tactical-orange/10 rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPosterIdx(
                    (i) =>
                      i === null ? null : (i - 1 + posters.length) % posters.length,
                  );
                }}
                aria-label="Pôster anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <motion.figure
                key={posterIdx}
                initial={{ opacity: 0, scale: 0.92, rotate: -0.5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.25 }}
                className="max-w-[min(92vw,560px)] max-h-[86vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={posters[posterIdx].src}
                  alt={`Pôster ampliado: ${posters[posterIdx].title}`}
                  className="w-full max-h-[78vh] object-contain poster-frame"
                />
                <figcaption className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.25em] text-tactical-orange">
                  {String(posterIdx + 1).padStart(2, "0")} /{" "}
                  {String(posters.length).padStart(2, "0")} ·{" "}
                  {posters[posterIdx].title}
                </figcaption>
              </motion.figure>
              <button
                type="button"
                className="absolute right-3 sm:right-6 w-11 h-11 flex items-center justify-center border border-tactical-orange/50 text-tactical-orange hover:bg-tactical-orange/10 rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setPosterIdx((i) => (i === null ? null : (i + 1) % posters.length));
                }}
                aria-label="Próximo pôster"
              >
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ═══════════ CURSOS EM DESTAQUE ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden border-t border-border">
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// Formação"
            title="Cursos em"
            accent="destaque."
            sub="Trilha progressiva de aprendizado — do iniciante ao avançado. Conhecimento que transforma preparo em hábito."
            center
          />
          <div className="flex justify-center mb-8">
            {loadingStatus ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isCoursesLive ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Matrículas abertas
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Em breve — matrículas abertas em breve
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                id: "essencial-sobrevivencia",
                title: "Essencial de Sobrevivência",
                cat: "Fundamentos",
                img: "/cursos/curso-essencial-sobrevivencia.webp",
              },
              {
                id: "dominio-do-fogo",
                title: "Domínio do Fogo",
                cat: "Fogo",
                img: "/cursos/curso-dominio-do-fogo.webp",
              },
              {
                id: "purificacao-agua",
                title: "Purificação de Água",
                cat: "Água",
                img: "/cursos/curso-purificacao-agua.webp",
              },
              {
                id: "mente-forte",
                title: "Mente Forte",
                cat: "Mentalidade",
                img: "/cursos/curso-mente-forte.webp",
              },
            ].map((c, i) => (
              <Link key={c.id} to={`/cursos/${c.id}`} className="group block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative overflow-hidden rounded-sm border border-border group-hover:border-tactical-orange/60 transition-colors"
                >
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={c.img}
                      alt={c.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  {!isCoursesLive && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/85 text-white backdrop-blur">
                      Em breve
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-tactical-orange text-[#121212] mb-1">
                      {c.cat}
                    </span>
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {c.title}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers size={12} className="text-tactical-orange" /> 11 cursos
              disponíveis
            </span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-tactical-orange" /> 92h+ de
              conteúdo
            </span>
            <span className="opacity-40">·</span>
            <span className="flex items-center gap-1">
              <Award size={12} className="text-tactical-orange" /> Iniciante ao
              avançado
            </span>
          </div>
          <div className="text-center mt-6">
            <Link
              to="/cursos"
              className={`inline-flex items-center gap-2 font-heading tracking-wider uppercase px-6 py-2.5 rounded-md transition-colors text-xs ${
                isCoursesLive
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border-2 border-tactical-orange text-tactical-orange hover:bg-tactical-orange/10"
              }`}
            >
              {isCoursesLive ? "Ver todos os cursos" : "Ver catálogo completo"}
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ EQUIPAMENTOS — PRODUTOS REAIS ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// Loja"
            title="Equipamentos de"
            accent="sobrevivência."
            sub="Gear essencial selecionado para qualquer aventura — direto do catálogo do Centro."
            center
          />
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-tactical-orange" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              Nenhum produto disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <ContentCard
                  key={p.id}
                  image={p.image}
                  title={p.name}
                  description={p.description}
                  link={`/equipamentos/${p.id}`}
                  buttonLabel="Ver Produto"
                  badge={p.category}
                  price={p.price}
                />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link
              to="/equipamentos"
              className="text-tactical-orange hover:underline text-sm font-semibold uppercase tracking-wider"
            >
              Ver todos os equipamentos →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ E-BOOKS ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden border-y border-border">
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// Biblioteca"
            title="E-books — conhecimento que"
            accent="salva vidas."
            center
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              {
                title: "Manual de Sobrevivência na Selva",
                author: "Carlos Mendes",
                image:
                  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop",
              },
              {
                title: "Bushcraft para Iniciantes",
                author: "Ana Ribeiro",
                image:
                  "https://images.unsplash.com/photo-1532011926-7a6d2eb8e0bc?w=400&h=560&fit=crop",
              },
              {
                title: "Guia de Acampamento Selvagem",
                author: "Pedro Alves",
                image:
                  "https://images.unsplash.com/photo-1512820790802-1b5b6c9e3e3a?w=400&h=560&fit=crop",
              },
              {
                title: "Encontrando Água na Natureza",
                author: "Marcos Silva",
                image:
                  "https://images.unsplash.com/photo-1551652171-ee1a0211e9d5?w=400&h=560&fit=crop",
              },
              {
                title: "Primeiros Socorros em Situações Extremas",
                author: "Dra. Juliana Costa",
                image:
                  "https://images.unsplash.com/photo-1584030629-9a1ad0d8d8e9?w=400&h=560&fit=crop",
              },
            ].map((e, i) => (
              <Link key={i} to="/ebooks" className="group block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative overflow-hidden rounded-sm border border-border group-hover:border-tactical-orange/60 transition-colors"
                >
                  <img
                    src={e.image}
                    alt={e.title}
                    className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent flex flex-col justify-end p-3">
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {e.author}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/ebooks"
              className="text-tactical-orange hover:underline text-sm font-semibold uppercase tracking-wider"
            >
              Ver todos os e-books →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ JOGOS ═══════════ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="relative container mx-auto px-4">
          <PosterHeader
            kicker="// Treino"
            title="Jogos de"
            accent="sobrevivência."
            sub="Aprenda jogando — cenários que treinam decisão, recursos e prioridade."
            center
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              {
                name: "Simulador de Floresta",
                image:
                  "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=300&fit=crop",
              },
              {
                name: "Construa seu Abrigo",
                image:
                  "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop",
              },
              {
                name: "Gerenciamento de Recursos",
                image:
                  "https://images.unsplash.com/photo-1551652855-d9d3d8e3e0e6?w=400&h=300&fit=crop",
              },
              {
                name: "Exploração de Território",
                image:
                  "https://images.unsplash.com/photo-1502920917128-1aa6c8e8e8e6?w=400&h=300&fit=crop",
              },
              {
                name: "Caça e Coleta",
                image:
                  "https://images.unsplash.com/photo-1547038963-2d4d6e3a4e0e?w=400&h=300&fit=crop",
              },
            ].map((g, i) => (
              <Link key={i} to="/jogos" className="group block">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="relative overflow-hidden rounded-sm border border-border group-hover:border-tactical-orange/60 transition-colors"
                >
                  <img
                    src={g.image}
                    alt={g.name}
                    className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end p-3">
                    <p className="text-sm font-medium text-foreground">
                      {g.name}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/jogos"
              className="text-tactical-orange hover:underline text-sm font-semibold uppercase tracking-wider"
            >
              Ver todos os jogos →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ MANIFESTO FINAL — SOBREVIVER É UMA ESCOLHA ═══════════ */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="absolute inset-0">
          <img
            src="/cursos/banner-manifesto.webp"
            alt="Sobreviver é escolha — conhecimento + prática + preparação = liberdade"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 grunge-noise opacity-20" />
          <div className="absolute right-0 top-0 h-full w-3 hazard-stripes opacity-50" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <MountainLogo className="w-14 h-14 mb-5" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-tactical-orange mb-3">
              // Manifesto
            </p>
            <h2 className="font-poster text-4xl sm:text-5xl md:text-6xl uppercase leading-[0.95] text-foreground">
              Sobreviver é{" "}
              <span className="text-tactical-orange">uma escolha.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-foreground/85 leading-relaxed">
              Não espere o momento certo. Comece hoje a se preparar para o
              inesperado — conhecimento + prática + preparação = liberdade.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <Link
                to="/cursos"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-7 py-3.5 rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                Comece agora <ChevronRight size={15} />
              </Link>
              <div className="brush-badge px-5 py-2 rotate-1">
                <span className="font-brush text-lg md:text-xl text-[#f2e8d5]">
                  Seu futuro você agradece.
                </span>
              </div>
            </div>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              centrodesobrevivencia.vercel.app
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
