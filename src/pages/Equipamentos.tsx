import Layout from "@/components/Layout";
import Section from "@/components/Section";
import ContentCard from "@/components/ContentCard";
import { products } from "@/data/mockData";

const Equipamentos = () => (
  <Layout>
    <Section title="Equipamentos de Sobrevivência" subtitle="Tudo que você precisa para qualquer expedição">
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
    </Section>
  </Layout>
);

export default Equipamentos;
