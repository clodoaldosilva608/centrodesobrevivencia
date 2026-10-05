import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import CategoryFilter from "@/components/CategoryFilter";
import EquipmentCard from "@/components/EquipmentCard";
import { supabase } from "@/lib/supabase";
import { Package, Search, Loader2 } from "lucide-react";
import SEO from "@/components/SEO";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  fullDescription: string;
  price: string;
  image: string;
  specs: string[];
  benefits: string[];
  buyLink: string;
  affiliateNetwork?: string | null;
  inStock?: boolean;
  featured?: boolean;
}

const Equipamentos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("Todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("featured", { ascending: false })
          .order("name", { ascending: true });
        if (error) throw error;
        setProducts((data ?? []).map((r: any) => ({
          id: r.slug,
          name: r.name,
          category: r.category ?? "",
          description: r.description ?? "",
          fullDescription: r.full_description ?? "",
          price: r.price ?? "",
          image: r.image ?? "",
          specs: Array.isArray(r.specs) ? r.specs : [],
          benefits: Array.isArray(r.benefits) ? r.benefits : [],
          buyLink: r.buy_link ?? "",
          affiliateNetwork: r.affiliate_network,
          inStock: r.in_stock,
          featured: r.featured,
        })));
      } catch (e) {
        console.error("Erro ao carregar produtos:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);

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
  }, [products, selected, search]);

  return (
    <Layout>
      <SEO title="Equipamentos Táticos — Gear de Sobrevivência" description="Catálogo de equipamentos de bushcraft, sobrevivencialismo e camping com reviews detalhados, especificações e opções de compra." />
      <Section title="Equipamentos de Sobrevivência" subtitle="Tudo que você precisa para qualquer expedição">
        {/* Hero banner ilustrativo */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-border mb-8"
        >
          <img
            src="/cursos/curso-equipamentos-essenciais.webp"
            alt="Kit de equipamentos essenciais de sobrevivência"
            loading="eager"
            decoding="async"
            className="w-full h-48 sm:h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
            <h3 className="font-heading text-xl md:text-2xl tracking-wider uppercase text-foreground">
              Kit essencial do sobrevivente
            </h3>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground max-w-xl">
              Mochila, faca fixa, filtro de água, mapa, bússola, lampião e multitool — o gear mínimo para qualquer cenário.
            </p>
          </div>
        </motion.div>

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
          {loading ? (
            <span>Carregando produtos...</span>
          ) : (
            <span>
              {filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </Section>
    </Layout>
  );
};

export default Equipamentos;
