import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import ContentCard from "@/components/ContentCard";
import CategoryFilter from "@/components/CategoryFilter";
import { products } from "@/data/mockData";

const Equipamentos = () => {
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], []);
  const [selected, setSelected] = useState("Todos");

  const filtered = selected === "Todos" ? products : products.filter((p) => p.category === selected);

  return (
    <Layout>
      <Section title="Equipamentos de Sobrevivência" subtitle="Tudo que você precisa para qualquer expedição">
        <CategoryFilter categories={categories} selected={selected} onSelect={setSelected} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
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
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">Nenhum produto encontrado nesta categoria.</p>
        )}
      </Section>
    </Layout>
  );
};

export default Equipamentos;
