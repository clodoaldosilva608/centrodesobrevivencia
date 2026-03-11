import Layout from "@/components/Layout";
import Section from "@/components/Section";
import ContentCard from "@/components/ContentCard";
import { games } from "@/data/mockData";

const Jogos = () => (
  <Layout>
    <Section title="Jogos de Sobrevivência" subtitle="Teste suas habilidades em cenários interativos">
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
  </Layout>
);

export default Jogos;
