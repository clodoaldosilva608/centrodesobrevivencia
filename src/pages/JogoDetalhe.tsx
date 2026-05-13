import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { games } from "@/data/mockData";
import { ArrowLeft, Gamepad2, Target, Cog } from "lucide-react";

const JOGAR_ROUTE: Record<string, string> = {
  "simulador-floresta": "/jogos/simulador-sobrevivencia-floresta",
};

const JogoDetalhe = () => {
  const { id } = useParams();
  const game = games.find((g) => g.id === id);

  if (!game) {
    return (
      <Layout>
        <SEO
          title="Jogo não encontrado — Survival Hub"
          description="O jogo que você procura não está disponível."
          noIndex
        />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Jogo não encontrado.</p>
          <Link to="/jogos" className="text-primary hover:underline mt-4 inline-block">
            Voltar aos jogos
          </Link>
        </div>
      </Layout>
    );
  }

  const playRoute = JOGAR_ROUTE[game.id];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    description: game.description,
    image: game.image,
    genre: game.category,
    gamePlatform: "Web Browser",
  };

  return (
    <Layout>
      <SEO
        title={`${game.name} — Jogos`}
        description={game.description}
        image={game.image}
        type="website"
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-12">
        <Link
          to="/jogos"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8"
        >
          <ArrowLeft size={16} /> Voltar aos jogos
        </Link>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-video md:aspect-square rounded-lg overflow-hidden border border-border">
            <img src={game.image} alt={game.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">
              {game.category}
            </span>
            <h1 className="font-heading text-3xl text-foreground tracking-wider mt-3">
              {game.name}
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">{game.description}</p>

            <div className="mt-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
                <Cog size={16} className="text-primary" /> Mecânica
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{game.mechanic}</p>
            </div>

            <div className="mt-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
                <Target size={16} className="text-primary" /> Objetivo
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{game.objective}</p>
            </div>

            {playRoute ? (
              <Link
                to={playRoute}
                className="mt-8 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2"
              >
                <Gamepad2 size={16} /> Jogar Agora
              </Link>
            ) : (
              <div className="mt-8 inline-flex items-center gap-2 bg-muted text-muted-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md">
                <Gamepad2 size={16} /> Em Breve
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JogoDetalhe;
