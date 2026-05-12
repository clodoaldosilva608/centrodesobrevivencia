import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Compass, Flame, Mountain, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import Section from "@/components/Section";
import ContentCard from "@/components/ContentCard";
import Layout from "@/components/Layout";
import { products, ebooks, games, challenges } from "@/data/mockData";

const features = [
  { icon: Shield, label: "Equipamentos", desc: "Gear tático e ferramentas essenciais" },
  { icon: Flame, label: "Conhecimento", desc: "E-books e guias de sobrevivência" },
  { icon: Mountain, label: "Aventura", desc: "Jogos e simuladores interativos" },
  { icon: Compass, label: "Exploração", desc: "Mapa e desafios semanais" },
];

const Index = () => {
  return (
    <Layout>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" aria-hidden="true" width={1920} height={1080} fetchPriority="high" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
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
              <Link
                to="/equipamentos"
                className="bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                Explorar Equipamentos
              </Link>
              <Link
                to="/bussola"
                className="border border-primary text-primary font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:bg-primary/10 transition-colors text-sm flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Bússola Tática
              </Link>
              <Link
                to="/simulador"
                className="border border-border text-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:bg-muted transition-colors text-sm"
              >
                Iniciar Simulador
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features strip */}
      <section className="bg-card border-y border-border py-12">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
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
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground">{f.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Equipamentos */}
      <Section title="Equipamentos" subtitle="Gear essencial para qualquer aventura">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 3).map((p) => (
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
        <div className="text-center mt-8">
          <Link to="/equipamentos" className="text-primary hover:underline text-sm font-semibold">
            Ver todos os equipamentos →
          </Link>
        </div>
      </Section>

      {/* E-books */}
      <Section title="E-books" subtitle="Conhecimento que salva vidas" className="bg-card/50">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          {ebooks.map((e) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <Link to={`/ebooks/${e.id}`}>
                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border">
                  <img src={e.image} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 className="mt-3 font-heading text-sm text-foreground tracking-wide line-clamp-2">{e.title}</h3>
                <p className="text-xs text-muted-foreground">{e.author}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Jogos */}
      <Section title="Jogos Interativos" subtitle="Teste suas habilidades de sobrevivência">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((g) => (
            <ContentCard
              key={g.id}
              image={g.image}
              title={g.name}
              description={g.description}
              link={`/jogos/${g.id}`}
              buttonLabel="Jogar"
            />
          ))}
        </div>
      </Section>

      {/* Desafios */}
      <Section title="Desafios da Semana" subtitle="Conquiste XP e suba de nível" className="bg-card/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {challenges.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-gradient-card rounded-lg border border-border p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  c.difficulty === "Extremo" ? "bg-destructive/30 text-destructive" :
                  c.difficulty === "Difícil" ? "bg-destructive/20 text-destructive" :
                  c.difficulty === "Médio" ? "bg-primary/20 text-primary" :
                  "bg-accent/30 text-accent-foreground"
                }`}>
                  {c.difficulty}
                </span>
                <span className="text-primary font-heading text-sm">+{c.xp} XP</span>
              </div>
              <h3 className="font-heading text-foreground tracking-wide">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">Prazo: {c.deadline}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    </Layout>
  );
};

export default Index;
