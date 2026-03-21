import { useState } from "react";
import Layout from "@/components/Layout";
import { useDataStore } from "@/hooks/useDataStore";
import { Package, BookOpen, Gamepad2, Trophy, Pencil, Trash2, Plus, Search, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

type Tab = "produtos" | "ebooks" | "jogos" | "desafios";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "produtos", label: "Produtos", icon: Package },
  { key: "ebooks", label: "E-books", icon: BookOpen },
  { key: "jogos", label: "Jogos", icon: Gamepad2 },
  { key: "desafios", label: "Desafios", icon: Trophy },
];

const Admin = () => {
  const store = useDataStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("produtos");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const filterBySearch = (text: string) => text.toLowerCase().includes(search.toLowerCase());

  const openCreate = () => {
    setEditingId(null);
    setFormData({});
    setDialogOpen(true);
  };

  const openEdit = (id: string | number, data: Record<string, string>) => {
    setEditingId(id);
    setFormData(data);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (activeTab === "produtos") {
      if (editingId) {
        store.updateProduct(editingId as string, { name: formData.name, category: formData.category, description: formData.description, price: formData.price, image: formData.image || "" });
      } else {
        const id = formData.name?.toLowerCase().replace(/\s+/g, "-") || `prod-${Date.now()}`;
        store.addProduct({ id, name: formData.name || "", category: formData.category || "", description: formData.description || "", fullDescription: formData.description || "", benefits: [], price: formData.price || "R$ 0,00", image: formData.image || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=450&fit=crop", specs: [], buyLink: "#" });
      }
    } else if (activeTab === "ebooks") {
      if (editingId) {
        store.updateEbook(editingId as string, { title: formData.title, author: formData.author, category: formData.category, description: formData.description, pages: parseInt(formData.pages || "0") });
      } else {
        const id = formData.title?.toLowerCase().replace(/\s+/g, "-") || `ebook-${Date.now()}`;
        store.addEbook({ id, title: formData.title || "", author: formData.author || "", category: formData.category || "", description: formData.description || "", synopsis: formData.description || "", pages: parseInt(formData.pages || "100"), image: formData.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=450&fit=crop" });
      }
    } else if (activeTab === "jogos") {
      if (editingId) {
        store.updateGame(editingId as string, { name: formData.name, category: formData.category, description: formData.description, mechanic: formData.mechanic });
      } else {
        const id = formData.name?.toLowerCase().replace(/\s+/g, "-") || `game-${Date.now()}`;
        store.addGame({ id, name: formData.name || "", category: formData.category || "", description: formData.description || "", mechanic: formData.mechanic || "", objective: formData.description || "", image: formData.image || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=450&fit=crop" });
      }
    } else if (activeTab === "desafios") {
      if (editingId) {
        store.updateChallenge(editingId as number, { title: formData.title, category: formData.category, description: formData.description, difficulty: formData.difficulty as any, xp: parseInt(formData.xp || "0") });
      } else {
        store.addChallenge({ id: Date.now(), title: formData.title || "", category: formData.category || "", description: formData.description || "", difficulty: (formData.difficulty as any) || "Fácil", xp: parseInt(formData.xp || "50"), deadline: "7 dias" });
      }
    }
    setDialogOpen(false);
    toast({ title: editingId ? "Item atualizado!" : "Item criado!", description: "As alterações foram salvas com sucesso." });
  };

  const handleDelete = (id: string | number) => {
    if (activeTab === "produtos") store.deleteProduct(id as string);
    else if (activeTab === "ebooks") store.deleteEbook(id as string);
    else if (activeTab === "jogos") store.deleteGame(id as string);
    else store.deleteChallenge(id as number);
    toast({ title: "Item excluído", description: "O item foi removido com sucesso." });
  };

  const getFormFields = (): { key: string; label: string; type?: string }[] => {
    switch (activeTab) {
      case "produtos": return [{ key: "name", label: "Nome" }, { key: "category", label: "Categoria" }, { key: "description", label: "Descrição" }, { key: "price", label: "Preço" }, { key: "image", label: "URL da Imagem" }];
      case "ebooks": return [{ key: "title", label: "Título" }, { key: "author", label: "Autor" }, { key: "category", label: "Categoria" }, { key: "description", label: "Descrição" }, { key: "pages", label: "Páginas", type: "number" }, { key: "image", label: "URL da Capa" }];
      case "jogos": return [{ key: "name", label: "Nome" }, { key: "category", label: "Categoria" }, { key: "description", label: "Descrição" }, { key: "mechanic", label: "Mecânica" }, { key: "image", label: "URL da Imagem" }];
      case "desafios": return [{ key: "title", label: "Título" }, { key: "category", label: "Categoria" }, { key: "description", label: "Descrição" }, { key: "difficulty", label: "Dificuldade" }, { key: "xp", label: "XP", type: "number" }];
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-foreground tracking-wider uppercase">Painel Administrativo</h1>
            <p className="text-muted-foreground mt-1">Gerencie todo o conteúdo da plataforma</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { store.resetAll(); toast({ title: "Dados restaurados", description: "Conteúdo original restaurado." }); }}>
            <RotateCcw size={14} /> Restaurar Padrão
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Produtos", count: store.products.length, icon: Package },
            { label: "E-books", count: store.ebooks.length, icon: BookOpen },
            { label: "Jogos", count: store.games.length, icon: Gamepad2 },
            { label: "Desafios", count: store.challenges.length, icon: Trophy },
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
            <button key={t.key} onClick={() => { setActiveTab(t.key); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button className="gap-2" onClick={openCreate}><Plus size={16} /> Adicionar</Button>
        </div>

        {/* Table */}
        <div className="bg-gradient-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                  <th className="text-left p-4 text-muted-foreground font-medium hidden md:table-cell">Info</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "produtos" && store.products.filter((p) => filterBySearch(p.name)).map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                        <p className="text-foreground font-medium">{p.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{p.category}</td>
                    <td className="p-4 text-primary font-semibold hidden md:table-cell">{p.price}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p.id, { name: p.name, category: p.category, description: p.description, price: p.price, image: p.image })}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === "ebooks" && store.ebooks.filter((e) => filterBySearch(e.title)).map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={e.image} alt={e.title} className="w-8 h-10 rounded object-cover" />
                        <p className="text-foreground font-medium">{e.title}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{e.category}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{e.author} · {e.pages}p</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e.id, { title: e.title, author: e.author, category: e.category, description: e.description, pages: String(e.pages), image: e.image })}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === "jogos" && store.games.filter((g) => filterBySearch(g.name)).map((g) => (
                  <tr key={g.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={g.image} alt={g.name} className="w-10 h-10 rounded object-cover" />
                        <p className="text-foreground font-medium">{g.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{g.category}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{g.mechanic}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(g.id, { name: g.name, category: g.category, description: g.description, mechanic: g.mechanic, image: g.image })}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {activeTab === "desafios" && store.challenges.filter((c) => filterBySearch(c.title)).map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="text-foreground font-medium">{c.title}</p>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{c.category}</td>
                    <td className="p-4 hidden md:table-cell">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.difficulty === "Extremo" ? "bg-destructive/30 text-destructive" : c.difficulty === "Difícil" ? "bg-destructive/20 text-destructive" : c.difficulty === "Médio" ? "bg-primary/20 text-primary" : "bg-accent/30 text-accent-foreground"}`}>{c.difficulty}</span>
                      <span className="ml-2 text-primary font-semibold">+{c.xp} XP</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c.id, { title: c.title, category: c.category, description: c.description, difficulty: c.difficulty, xp: String(c.xp) })}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">{editingId ? "Editar Item" : "Novo Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {getFormFields().map((f) => (
                <div key={f.key}>
                  <label className="text-sm text-muted-foreground mb-1 block">{f.label}</label>
                  <Input type={f.type || "text"} value={formData[f.key] || ""} onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <Button className="w-full" onClick={handleSave}>{editingId ? "Salvar Alterações" : "Criar Item"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Admin;
