/**
 * Camada de dados do catálogo (products, ebooks, games, challenges).
 *
 * Usa Supabase como fonte de verdade. Mantém compatibilidade com o
 * formato do mockData.ts antigo para que pages/components não precisem
 * mudar.
 *
 * Cache local em memória (5 min) para evitar re-fetch em mounts repetidos.
 */

import { supabase } from "@/lib/supabase";
import type {
  ProductsRow,
  EbooksRow,
  GamesRow,
  ChallengesRow,
  AchievementsRow,
  CategoriesRow,
} from "@/lib/supabase-types";

// ─── Tipos compatíveis com mockData antigo ─────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  fullDescription: string;
  benefits: string[];
  price: string;
  image: string;
  specs: string[];
  buyLink: string;
  // extras opcionais
  slug?: string;
  affiliateNetwork?: string | null;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  sortOrder?: number;
}

export interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  synopsis: string;
  pages: number;
  category: string;
  image: string;
  pdfUrl?: string;
  isFree?: boolean;
}

export interface Game {
  id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  mechanic: string;
  objective: string;
}

export interface Challenge {
  id: string | number;
  title: string;
  description: string;
  difficulty: "Fácil" | "Médio" | "Difícil" | "Extremo";
  category: string;
  xp: number;
  deadline: string;
}

// ─── Mappers (db row → app type) ────────────────────────────────────────────

const mapProduct = (r: ProductsRow): Product => ({
  id: r.slug,
  name: r.name,
  category: r.category ?? "",
  description: r.description ?? "",
  fullDescription: r.full_description ?? "",
  benefits: (Array.isArray(r.benefits) ? r.benefits : []) as string[],
  price: r.price ?? "",
  image: r.image ?? "",
  specs: (Array.isArray(r.specs) ? r.specs : []) as string[],
  buyLink: r.buy_link ?? "",
  slug: r.slug,
  affiliateNetwork: r.affiliate_network,
  rating: r.rating,
  inStock: r.in_stock,
  featured: r.featured,
  sortOrder: r.sort_order,
});

const mapEbook = (r: EbooksRow): Ebook => ({
  id: r.slug,
  title: r.title,
  author: r.author ?? "",
  description: r.description ?? "",
  synopsis: r.synopsis ?? "",
  pages: r.pages ?? 0,
  category: r.category ?? "",
  image: r.image ?? "",
  pdfUrl: r.pdf_url ?? undefined,
  isFree: r.is_free,
});

const mapGame = (r: GamesRow): Game => ({
  id: r.slug,
  name: r.name,
  category: r.category ?? "",
  description: r.description ?? "",
  image: r.image ?? "",
  mechanic: r.mechanic ?? "",
  objective: r.objective ?? "",
});

const mapChallenge = (r: ChallengesRow): Challenge => ({
  id: r.id,
  title: r.title,
  description: r.description ?? "",
  difficulty: (r.difficulty ?? "Médio") as Challenge["difficulty"],
  category: r.category ?? "",
  xp: r.xp,
  deadline: r.deadline ?? "",
});

// ─── Cache em memória (5 min) ───────────────────────────────────────────────

interface CacheEntry<T> { data: T; ts: number; }
const memCache = new Map<string, CacheEntry<unknown>>();
const TTL = 5 * 60 * 1000;

function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = memCache.get(key) as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.ts < TTL) return Promise.resolve(cached.data);
  return fn().then((data) => {
    memCache.set(key, { data, ts: Date.now() });
    return data;
  });
}

// ─── API pública ────────────────────────────────────────────────────────────

export const catalog = {
  /** Lista todos os produtos.Ordenado por sort_order e featured. */
  async listProducts(): Promise<Product[]> {
    return withCache("products", async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapProduct);
    });
  },

  async listEbooks(): Promise<Ebook[]> {
    return withCache("ebooks", async () => {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapEbook);
    });
  },

  async listGames(): Promise<Game[]> {
    return withCache("games", async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapGame);
    });
  },

  async listChallenges(): Promise<Challenge[]> {
    return withCache("challenges", async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .order("xp", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapChallenge);
    });
  },

  async listAchievements(): Promise<AchievementsRow[]> {
    return withCache("achievements", async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("xp_reward", { ascending: false });
      if (error) throw error;
      return data ?? [];
    });
  },

  async listCategories(type?: "product" | "ebook" | "game" | "challenge"): Promise<CategoriesRow[]> {
    const cacheKey = `categories-${type ?? "all"}`;
    return withCache(cacheKey, async () => {
      let q = supabase.from("categories").select("*").order("name", { ascending: true });
      if (type) q = q.eq("type", type);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    });
  },

  /** Limpa cache. */
  clearCache() {
    memCache.clear();
  },

  // ─── CRUD admin ─────────────────────────────────────────────────────────

  async upsertProduct(p: Partial<ProductsRow> & { slug: string; name: string }): Promise<ProductsRow> {
    // Sem onConflict:'slug', o Supabase usa PK (id UUID). Como Product.id é slug
    // (não UUID), upsert sem onConflict tenta inserir id='' e falha com
    // 'invalid input syntax for type uuid'.
    const { data, error } = await supabase
      .from("products")
      .upsert(p, { onConflict: "slug" })
      .select()
      .single();
    if (error) throw error;
    memCache.delete("products");
    return data;
  },

  /** Deleta por SLUG (Product.id é o slug, não o UUID do banco). */
  async deleteProduct(slug: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("slug", slug);
    if (error) throw error;
    memCache.delete("products");
  },

  async upsertEbook(e: Partial<EbooksRow> & { slug: string; title: string }): Promise<EbooksRow> {
    const { data, error } = await supabase
      .from("ebooks")
      .upsert(e, { onConflict: "slug" })
      .select()
      .single();
    if (error) throw error;
    memCache.delete("ebooks");
    return data;
  },

  /** Deleta por SLUG (Ebook.id é o slug, não o UUID do banco). */
  async deleteEbook(slug: string): Promise<void> {
    const { error } = await supabase.from("ebooks").delete().eq("slug", slug);
    if (error) throw error;
    memCache.delete("ebooks");
  },

  async upsertGame(g: Partial<GamesRow> & { slug: string; name: string }): Promise<GamesRow> {
    const { data, error } = await supabase
      .from("games")
      .upsert(g, { onConflict: "slug" })
      .select()
      .single();
    if (error) throw error;
    memCache.delete("games");
    return data;
  },

  /** Deleta por SLUG (Game.id é o slug, não o UUID do banco). */
  async deleteGame(slug: string): Promise<void> {
    const { error } = await supabase.from("games").delete().eq("slug", slug);
    if (error) throw error;
    memCache.delete("games");
  },

  async upsertChallenge(c: Partial<ChallengesRow> & { title: string }): Promise<ChallengesRow> {
    const { data, error } = await supabase.from("challenges").upsert(c).select().single();
    if (error) throw error;
    memCache.delete("challenges");
    return data;
  },

  async deleteChallenge(id: string): Promise<void> {
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) throw error;
    memCache.delete("challenges");
  },
};

export default catalog;
