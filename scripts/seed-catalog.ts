/**
 * Seed: importa os dados do mockData.ts para o Supabase.
 *
 * Uso: npx tsx scripts/seed-catalog.ts
 *
 * Pré-requisitos:
 *  - .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou os defaults no supabase.ts)
 *  - Schema aplicado (supabase/schema.sql)
 *  - Estar logado como admin (ou executar via service_role)
 *
 * Idempotente: produtos/ebooks/games com mesmo slug são atualizados, não duplicados.
 */

import { supabase } from "../src/lib/supabase";
import { products as mockProducts, ebooks as mockEbooks, games as mockGames, challenges as mockChallenges } from "../src/data/mockData";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function upsertProducts() {
  const rows = mockProducts.map((p) => ({
    slug: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    full_description: p.fullDescription,
    benefits: p.benefits,
    price: p.price,
    image: p.image,
    specs: p.specs,
    buy_link: p.buyLink,
    affiliate_network: "amazon",
    in_stock: true,
    featured: false,
    sort_order: 0,
  }));
  const { data, error } = await supabase.from("products").upsert(rows, { onConflict: "slug" }).select("id,name");
  if (error) throw new Error("products: " + error.message);
  console.log(`✓ ${data?.length ?? 0} produtos inseridos/atualizados`);
}

async function upsertEbooks() {
  const rows = mockEbooks.map((e) => ({
    slug: e.id,
    title: e.title,
    author: e.author,
    description: e.description,
    synopsis: e.synopsis,
    pages: e.pages,
    category: e.category,
    image: e.image,
    is_free: true,
    sort_order: 0,
  }));
  const { data, error } = await supabase.from("ebooks").upsert(rows, { onConflict: "slug" }).select("id,title");
  if (error) throw new Error("ebooks: " + error.message);
  console.log(`✓ ${data?.length ?? 0} e-books inseridos/atualizados`);
}

async function upsertGames() {
  const rows = mockGames.map((g) => ({
    slug: g.id,
    name: g.name,
    category: g.category,
    description: g.description,
    mechanic: g.mechanic,
    objective: g.objective,
    image: g.image,
    is_active: true,
    sort_order: 0,
  }));
  const { data, error } = await supabase.from("games").upsert(rows, { onConflict: "slug" }).select("id,name");
  if (error) throw new Error("games: " + error.message);
  console.log(`✓ ${data?.length ?? 0} jogos inseridos/atualizados`);
}

async function upsertChallenges() {
  const rows = mockChallenges.map((c) => ({
    title: c.title,
    description: c.description,
    difficulty: c.difficulty,
    category: c.category,
    xp: c.xp,
    deadline: c.deadline,
    is_active: true,
  }));
  // challenges não tem slug unico, entao usamos insert (vira duplicado se rodar 2x).
  // Para idempotência, primeiro deleta tudo e re-insere.
  const { error: delErr } = await supabase.from("challenges").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) console.warn("warn: não foi possível limpar challenges:", delErr.message);
  const { data, error } = await supabase.from("challenges").insert(rows).select("id,title");
  if (error) throw new Error("challenges: " + error.message);
  console.log(`✓ ${data?.length ?? 0} desafios inseridos`);
}

async function main() {
  console.log("Iniciando seed do catálogo no Supabase…\n");
  try {
    await upsertProducts();
    await upsertEbooks();
    await upsertGames();
    await upsertChallenges();
    console.log("\n✅ Seed concluído com sucesso!");
  } catch (e) {
    console.error("\n❌ ERRO:", (e as Error).message);
    process.exit(1);
  }
}

main();
