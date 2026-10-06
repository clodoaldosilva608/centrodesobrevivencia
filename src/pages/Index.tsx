import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Compass,
  Globe,
  ExternalLink,
  Layers,
  Clock,
  Award,
  ChevronRight,
  Map,
  Backpack,
  Siren,
  Radio,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import Section from "@/components/Section";
import ContentCard from "@/components/ContentCard";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { MANUAL_URL } from "@/lib/manual";
import { supabase } from "@/lib/supabase";
import { useAppSetting } from "@/hooks/useAppSetting";
import { Loader2 } from "lucide-react";

const features = [
  {
    icon: Map,
    label: "Mapa Tático",
    desc: "Globo 3D, camadas e medição de terreno",
  },
  {
    icon: Compass,
    label: "Bússola Tática",
    desc: "Norte verdadeiro, magnético e astros ao vivo",
  },
  {
    icon: Backpack,
    label: "MOCHILA",
    desc: "Kits prontos de 8h a 300h, editáveis",
  },
  { icon: Siren, label: "SOS", desc: "Strobo Morse com som e mensagens" },
  { icon: Radio, label: "Boletim", desc: "GDELT, FIRMS e AIS em tempo real" },
  { icon: Globe, label: "OSIRIS", desc: "Globo OSINT com alertas globais" },
];

const manualFeatures = [
  "Mapa tático com globo 3D e camadas",
  "Bússola: norte verdadeiro e magnético",
  "Cruzeiro do Sul e Polaris em tempo real",
  "MOCHILA: kits 8h · 12h · 48h · 72h · 300h",
  "SOS: strobo Morse com som e mensagens",
  "Boletim: GDELT · NASA FIRMS · AIS",
  "Nível de bolha em qualquer posição",
  "Offline-ready — instale como app",
];

const pontosCardeais = [
  {
    d: "N",
    cls: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
    hot: true,
  },
  { d: "E", cls: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2" },
  { d: "S", cls: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" },
  { d: "O", cls: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" },
];

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

  return (
    <Layout>
      <SEO
        title="Centro de Sobrevivência — Bushcraft e Aventura"
        description="Hub brasileiro de bushcraft e sobrevivencialismo: equipamentos, e-books, simuladores, mapa interativo, bússola tática e desafios para aventureiros."
      />
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBg}
            alt=""
            aria-hidden="true"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
          <div className="absolute inset-0 tactical-grid opacity-40" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-tactical-orange mb-4 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-tactical-green animate-pulse" />
              Sistema tático online · PWA offline-ready
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl tracking-widest uppercase leading-tight">
              <span className="text-foreground">Sobrevivência é </span>
              <span className="text-gradient-survival">Conhecimento</span>
              <br />
              <span className="text-foreground">Conhecimento é </span>
              <span className="text-gradient-survival">Poder</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              O hub definitivo para bushcraft, sobrevivencialismo e aventura.
              Equipe-se. Aprenda. Sobreviva.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <a
                href={MANUAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Abrir o Manual
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <Link
                to="/equipamentos"
                className="border border-primary text-primary font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:bg-primary/10 transition-colors text-sm"
              >
                Explorar Equipamentos
              </Link>
              <Link
                to="/simulador"
                className="border border-border text-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:bg-muted transition-colors text-sm"
              >
                Iniciar Simulador
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

      {/* Features strip — a versão atual do Manual */}
      <section className="bg-card border-y border-border py-12">
        <div className="container mx-auto px-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-tactical-orange text-center mb-8">
            // A versão atual do Manual do Sobrevivente
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <f.icon className="mx-auto h-8 w-8 text-primary mb-3" />
                <h2 className="font-heading text-sm uppercase tracking-wider text-foreground">
                  {f.label}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MANUAL DO SOBREVIVENTE — destaque da versão atual */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 tactical-grid opacity-50" />
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hud-panel rounded-lg p-6 md:p-10"
          >
            <div className="flex flex-col lg:flex-row gap-10 lg:items-center">
              <div className="flex-1 min-w-0">
                <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-tactical-orange border border-tactical-orange/40 bg-tactical-orange/10 px-2 py-1 rounded-full mb-4">
                  Versão atual · PWA offline
                </span>
                <h2 className="font-heading text-2xl md:text-4xl text-foreground uppercase tracking-wider leading-tight">
                  Manual do{" "}
                  <span className="text-gradient-survival">Sobrevivente</span>
                </h2>
                <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                  O app tático que acompanha você em campo: mapa com globo 3D,
                  bússola de precisão com astros reais, mochilas prontas, SOS
                  com Morse e boletim de inteligência — tudo funcionando offline
                  no bolso.
                </p>
                <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {manualFeatures.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 font-mono text-[11px] sm:text-xs text-foreground/85"
                    >
                      <ChevronRight
                        size={12}
                        className="text-tactical-orange mt-0.5 shrink-0"
                      />
                      {f}
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
              {/* Rosa dos ventos HUD */}
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

      {/* OSIRIS banner — inteligência global em tempo real */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border-2 border-primary/30 bg-card/80 backdrop-blur p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Globe size={36} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-tactical-orange bg-tactical-orange/10 border border-tactical-orange/40 px-2 py-1 rounded-full mb-2">
                Novo · Inteligência em tempo real
              </span>
              <h2 className="font-heading text-xl md:text-2xl text-foreground uppercase tracking-wider mb-2">
                Visão OSIRIS
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                Globo 3D com satélites, câmeras ao vivo, terremotos, incêndios,
                conflitos e notícias 24/7. Dados de fontes públicas como USGS,
                NASA FIRMS, NOAA e emissoras internacionais, integrados ao
                Centro de Sobrevivência.
              </p>
            </div>
            <Link
              to="/visao-osiris"
              className="flex-shrink-0 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
            >
              Abrir Globo 3D <ExternalLink size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Cursos em destaque */}
      <Section
        title="Cursos em Destaque"
        subtitle="Trilha progressiva de aprendizado — do iniciante ao avançado"
      >
        {/* Status badge — controlado por app_settings (toggleable via Admin) */}
        <div className="flex justify-center mb-6">
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
                className="relative overflow-hidden rounded-lg border border-border group-hover:border-primary/50 transition-colors"
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
                {/* "Em breve" overlay quando toggle está desligado */}
                {!isCoursesLive && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-500/85 text-white backdrop-blur">
                    Em breve
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/85 text-primary-foreground mb-1">
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
            <Layers size={12} /> 11 cursos disponíveis
          </span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> 92h+ de conteúdo
          </span>
          <span className="opacity-40">·</span>
          <span className="flex items-center gap-1">
            <Award size={12} /> Iniciante ao avançado
          </span>
        </div>
        <div className="text-center mt-6">
          <Link
            to="/cursos"
            className={`inline-flex items-center gap-2 font-heading tracking-wider uppercase px-6 py-2.5 rounded-md transition-colors text-xs ${
              isCoursesLive
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "border border-primary text-primary hover:bg-primary/10"
            }`}
          >
            {isCoursesLive ? "Ver todos os cursos" : "Ver catálogo completo"}
            <ChevronRight size={14} />
          </Link>
        </div>
      </Section>

      {/* Equipamentos — produtos reais do Supabase */}
      <Section
        title="Equipamentos de Sobrevivência"
        subtitle="Gear essencial para qualquer aventura"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            className="text-primary hover:underline text-sm font-semibold"
          >
            Ver todos os equipamentos →
          </Link>
        </div>
      </Section>

      {/* E-books */}
      <Section
        title="E-books"
        subtitle="Conhecimento que salva vidas"
        className="bg-card/50"
      >
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
                className="relative overflow-hidden rounded-lg border border-border group-hover:border-primary/50 transition-colors"
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
            className="text-primary hover:underline text-sm font-semibold"
          >
            Ver todos os e-books →
          </Link>
        </div>
      </Section>

      {/* Jogos */}
      <Section title="Jogos de Sobrevivência" subtitle="Aprenda jogando">
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
                className="relative overflow-hidden rounded-lg border border-border group-hover:border-primary/50 transition-colors"
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
            className="text-primary hover:underline text-sm font-semibold"
          >
            Ver todos os jogos →
          </Link>
        </div>
      </Section>

      {/* Manifesto CTA — filosofia da marca */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/cursos/banner-manifesto.webp"
            alt="Sobreviver é escolha — conhecimento + prática + preparação = liberdade"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
        </div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl"
          >
            <span className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-tactical-orange bg-tactical-orange/10 border border-tactical-orange/40 px-2 py-1 rounded-full mb-4">
              Manifesto
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl tracking-wider uppercase text-foreground leading-tight">
              Sobreviver é escolha
            </h2>
            <p className="mt-3 text-base sm:text-lg text-foreground/85 leading-relaxed">
              Conhecimento + prática + preparação = liberdade. O Centro de
              Sobrevivência é mais que um app — é um estilo de vida para quem
              leva preparo a sério.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/cursos"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:opacity-90 transition-opacity text-xs"
              >
                Comece agora <ChevronRight size={14} />
              </Link>
              <Link
                to="/comunidade"
                className="border border-border text-foreground font-heading tracking-wider uppercase px-6 py-3 rounded-md hover:bg-muted transition-colors text-xs"
              >
                Entrar na comunidade
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
