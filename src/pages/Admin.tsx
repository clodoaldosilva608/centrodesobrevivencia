import { useState } from "react";
import Layout from "@/components/Layout";
import { products, ebooks, games, challenges } from "@/data/mockData";
import { Package, BookOpen, Gamepad2, Trophy, Pencil, Trash2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Tab = "produtos" | "ebooks" | "jogos" | "desafios";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "produtos", label: "Produtos", icon: Package },
  { key: "ebooks", label: "E-books", icon: BookOpen },
  { key: "jogos", label: "Jogos", icon: Gamepad2 },
  { key: "desafios", label: "Desafios", icon: Trophy },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>("produtos");
  const [search, setSearch] = useState("");

  const filterBySearch = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground tracking-wider uppercase">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie todo o conteúdo da plataforma</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Produtos", count: products.length, icon: Package },
            { label: "E-books", count: ebooks.length, icon: BookOpen },
            { label: "Jogos", count: games.length, icon: Gamepad2 },
            { label: "Desafios", count: challenges.length, icon: Trophy },
          ].map((s) => (
            <div key={s.label} className="bg-gradient-card rounded-lg border border-border p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading text-foreground">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button className="gap-2">
            <Plus size={16} /> Adicionar
          </Button>
        </div>

        {/* Content Tables */}
        <div className="bg-gradient-card rounded-lg border border-border overflow-hidden">
          {activeTab === "produtos" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Produto</th>
                    <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Preço</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.filter((p) => filterBySearch(p.name)).map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="text-foreground font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 md:hidden">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{p.category}</td>
                      <td className="p-4 text-primary font-semibold">{p.price}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon"><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "ebooks" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">E-book</th>
                    <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Autor</th>
                    <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Páginas</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ebooks.filter((e) => filterBySearch(e.title)).map((e) => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={e.image} alt={e.title} className="w-8 h-10 rounded object-cover" />
                          <div>
                            <p className="text-foreground font-medium">{e.title}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{e.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{e.author}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{e.category}</td>
                      <td className="p-4 text-muted-foreground">{e.pages}p</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon"><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "jogos" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Jogo</th>
                    <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                    <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Mecânica</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {games.filter((g) => filterBySearch(g.name)).map((g) => (
                    <tr key={g.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={g.image} alt={g.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="text-foreground font-medium">{g.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{g.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{g.category}</td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{g.mechanic}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon"><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "desafios" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Desafio</th>
                    <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Dificuldade</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">XP</th>
                    <th className="text-right p-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {challenges.filter((c) => filterBySearch(c.title)).map((c) => (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="text-foreground font-medium">{c.title}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{c.category}</p>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{c.category}</td>
                      <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          c.difficulty === "Extremo" ? "bg-destructive/30 text-destructive" :
                          c.difficulty === "Difícil" ? "bg-destructive/20 text-destructive" :
                          c.difficulty === "Médio" ? "bg-primary/20 text-primary" :
                          "bg-accent/30 text-accent-foreground"
                        }`}>
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="p-4 text-primary font-semibold">+{c.xp}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon"><Pencil size={14} /></Button>
                          <Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
