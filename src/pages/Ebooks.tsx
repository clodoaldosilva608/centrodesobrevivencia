import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import CategoryFilter from "@/components/CategoryFilter";
import EbookCard from "@/components/EbookCard";
import { ebooks } from "@/data/mockData";
import { BookOpen, Search } from "lucide-react";

const Ebooks = () => {
  const categories = useMemo(() => [...new Set(ebooks.map((e) => e.category))], []);
  const [selected, setSelected] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = selected === "Todos" ? ebooks : ebooks.filter((e) => e.category === selected);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selected, search]);

  return (
    <Layout>
      <Section
        title="Biblioteca de Sobrevivência"
        subtitle="Conhecimento essencial em formato digital — explore, aprenda e sobreviva"
      >
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mb-8"
        >
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por título, autor ou tema..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </motion.div>

        <CategoryFilter categories={categories} selected={selected} onSelect={setSelected} />

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <BookOpen size={14} />
          <span>
            {filtered.length} {filtered.length === 1 ? "e-book encontrado" : "e-books encontrados"}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-8">
          {filtered.map((e) => (
            <EbookCard key={e.id} {...e} />
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookOpen size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum e-book encontrado.</p>
            <button
              onClick={() => {
                setSelected("Todos");
                setSearch("");
              }}
              className="mt-3 text-primary text-sm hover:underline"
            >
              Limpar filtros
            </button>
          </motion.div>
        )}
      </Section>
    </Layout>
  );
};

export default Ebooks;
