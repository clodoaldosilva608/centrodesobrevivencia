import { useState, useEffect, useCallback } from "react";
import { products as defaultProducts, ebooks as defaultEbooks, games as defaultGames, challenges as defaultChallenges, Product, Ebook, Game, Challenge } from "@/data/mockData";

const STORAGE_KEYS = {
  products: "sh_products",
  ebooks: "sh_ebooks",
  games: "sh_games",
  challenges: "sh_challenges",
};

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useDataStore() {
  const [products, setProducts] = useState<Product[]>(() => load(STORAGE_KEYS.products, defaultProducts));
  const [ebooksData, setEbooks] = useState<Ebook[]>(() => load(STORAGE_KEYS.ebooks, defaultEbooks));
  const [gamesData, setGames] = useState<Game[]>(() => load(STORAGE_KEYS.games, defaultGames));
  const [challengesData, setChallenges] = useState<Challenge[]>(() => load(STORAGE_KEYS.challenges, defaultChallenges));

  useEffect(() => save(STORAGE_KEYS.products, products), [products]);
  useEffect(() => save(STORAGE_KEYS.ebooks, ebooksData), [ebooksData]);
  useEffect(() => save(STORAGE_KEYS.games, gamesData), [gamesData]);
  useEffect(() => save(STORAGE_KEYS.challenges, challengesData), [challengesData]);

  const addProduct = useCallback((p: Product) => setProducts((prev) => [...prev, p]), []);
  const updateProduct = useCallback((id: string, p: Partial<Product>) => setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...p } : x))), []);
  const deleteProduct = useCallback((id: string) => setProducts((prev) => prev.filter((x) => x.id !== id)), []);

  const addEbook = useCallback((e: Ebook) => setEbooks((prev) => [...prev, e]), []);
  const updateEbook = useCallback((id: string, e: Partial<Ebook>) => setEbooks((prev) => prev.map((x) => (x.id === id ? { ...x, ...e } : x))), []);
  const deleteEbook = useCallback((id: string) => setEbooks((prev) => prev.filter((x) => x.id !== id)), []);

  const addGame = useCallback((g: Game) => setGames((prev) => [...prev, g]), []);
  const updateGame = useCallback((id: string, g: Partial<Game>) => setGames((prev) => prev.map((x) => (x.id === id ? { ...x, ...g } : x))), []);
  const deleteGame = useCallback((id: string) => setGames((prev) => prev.filter((x) => x.id !== id)), []);

  const addChallenge = useCallback((c: Challenge) => setChallenges((prev) => [...prev, c]), []);
  const updateChallenge = useCallback((id: number, c: Partial<Challenge>) => setChallenges((prev) => prev.map((x) => (x.id === id ? { ...x, ...c } : x))), []);
  const deleteChallenge = useCallback((id: number) => setChallenges((prev) => prev.filter((x) => x.id !== id)), []);

  const resetAll = useCallback(() => {
    setProducts(defaultProducts);
    setEbooks(defaultEbooks);
    setGames(defaultGames);
    setChallenges(defaultChallenges);
  }, []);

  return {
    products, addProduct, updateProduct, deleteProduct,
    ebooks: ebooksData, addEbook, updateEbook, deleteEbook,
    games: gamesData, addGame, updateGame, deleteGame,
    challenges: challengesData, addChallenge, updateChallenge, deleteChallenge,
    resetAll,
  };
}
