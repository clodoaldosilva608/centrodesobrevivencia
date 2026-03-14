import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import CategoryFilter from "@/components/CategoryFilter";
import { ebooks } from "@/data/mockData";

const Ebooks = () => {
  const categories = useMemo(() => [...new Set(ebooks.map((e) => e.category))], []);
  const [selected, setSelected] = useState("Todos");

  const filtered = selected === "Todos" ? ebooks : ebooks.filter((e) => e.category === selected);

  return (
    <Layout>
      <Section title="Biblioteca de Sobrevivência" subtitle="Conhecimento essencial em formato digital">
        <CategoryFilter categories={categories} selected={selected} onSelect={setSelected} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {filtered.map((e) => (
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
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">Nenhum e-book encontrado nesta categoria.</p>
        )}
      </Section>
    </Layout>
  );
};

export default Ebooks;
