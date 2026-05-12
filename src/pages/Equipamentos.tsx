import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import CategoryFilter from "@/components/CategoryFilter";
import EquipmentCard from "@/components/EquipmentCard";
import { products } from "@/data/mockData";
import { Package, Search } from "lucide-react";
import SEO from "@/components/SEO";

const Equipamentos = () => {
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], []);
  const [selected, setSelected] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = selected === "Todos" ? products : products.filter((p) => p.category === selected);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selected, search]);

  return (
    <Layout>
      <SEO title="Equipamentos Táticos — Gear de Sobrevivência" description="Catálogo de equipamentos de bushcraft, sobrevivencialismo e camping com reviews detalhados, especificações e opções de compra." />
      <Section title="Equipamentos de Sobrevivência" subtitle="Tudo que você precisa para qualquer expedição">
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
              placeholder="Buscar equipamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </motion.div>

        <CategoryFilter categories={categories} selected={selected} onSelect={setSelected} />

        {/* Results count */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <Package size={14} />
          <span>
            {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
          {filtered.map((p) => (
            <EquipmentCard key={p.id} {...p} />
          ))}
        </div>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Package size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
            <button
              onClick={() => { setSelected("Todos"); setSearch(""); }}
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

export default Equipamentos;
