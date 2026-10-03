import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, BookOpen, Gamepad2, Trophy, Pencil, Trash2, Plus, Search,
  X, AlertCircle, Loader2, Database, RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";
import catalog from "@/lib/catalog";
import type { Product, Ebook, Game, Challenge } from "@/lib/catalog";

type Tab = "produtos" | "ebooks" | "jogos" | "desafios";

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "produtos", label: "Produtos", icon: Package },
  { key: "ebooks", label: "E-books", icon: BookOpen },
  { key: "jogos", label: "Jogos", icon: Gamepad2 },
  { key: "desafios", label: "Desafios", icon: Trophy },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

interface FormState {
  // Campos comuns
  name: string; title: string; slug: string;
  category: string; description: string; image: string;
  // Products
  fullDescription: string; price: string; buyLink: string;
  affiliateNetwork: string; specs: string; benefits: string;
  inStock: boolean; featured: boolean;
  // Ebooks
  author: string; synopsis: string; pages: string;
  pdfUrl: string; isFree: boolean;
  // Games
  mechanic: string; objective: string;
  // Challenges
  difficulty: string; xp: string; deadline: string;
  // Para edit: id interno
  _id?: string;
}

const emptyForm: FormState = {
  name: "", title: "", slug: "", category: "", description: "", image: "",
  fullDescription: "", price: "", buyLink: "", affiliateNetwork: "amazon",
  specs: "", benefits: "", inStock: true, featured: false,
  author: "", synopsis: "", pages: "0", pdfUrl: "", isFree: true,
  mechanic: "", objective: "",
  difficulty: "Médio", xp: "100", deadline: "",
};

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("produtos");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      catalog.clearCache();
      const [p, e, g, c] = await Promise.all([
        catalog.listProducts(),
        catalog.listEbooks(),
        catalog.listGames(),
        catalog.listChallenges(),
      ]);
      setProducts(p); setEbooks(e); setGames(g); setChallenges(c);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const filterBySearch = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());

  const openCreate = () => {
    setEditing(emptyForm);
    setDialogOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditing({
      ...emptyForm,
      _id: p.id,
      name: p.name, slug: p.slug ?? p.id, category: p.category,
      description: p.description, fullDescription: p.fullDescription,
      price: p.price, image: p.image, buyLink: p.buyLink,
      affiliateNetwork: p.affiliateNetwork ?? "amazon",
      specs: p.specs.join("\n"),
      benefits: p.benefits.join("\n"),
      inStock: p.inStock ?? true,
      featured: p.featured ?? false,
    });
    setDialogOpen(true);
  };

  const openEditEbook = (e: Ebook) => {
    setEditing({
      ...emptyForm,
      _id: e.id, title: e.title, slug: e.id, author: e.author,
      category: e.category, description: e.description, synopsis: e.synopsis,
      pages: String(e.pages), image: e.image, pdfUrl: e.pdfUrl ?? "",
      isFree: e.isFree ?? true,
    });
    setDialogOpen(true);
  };

  const openEditGame = (g: Game) => {
    setEditing({
      ...emptyForm,
      _id: g.id, name: g.name, slug: g.id, category: g.category,
      description: g.description, image: g.image, mechanic: g.mechanic,
      objective: g.objective,
    });
    setDialogOpen(true);
  };

  const openEditChallenge = (c: Challenge) => {
    setEditing({
      ...emptyForm,
      _id: String(c.id), title: c.title, description: c.description,
      difficulty: c.difficulty, category: c.category, xp: String(c.xp),
      deadline: c.deadline,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (activeTab === "produtos") {
        const slug = editing.slug || slugify(editing.name);
        if (!editing.name || !slug) throw new Error("Nome é obrigatório");
        await catalog.upsertProduct({
          slug,
          name: editing.name,
          category: editing.category,
          description: editing.description,
          full_description: editing.fullDescription,
          benefits: editing.benefits.split("\n").map(s => s.trim()).filter(Boolean),
          price: editing.price,
          image: editing.image,
          specs: editing.specs.split("\n").map(s => s.trim()).filter(Boolean),
          buy_link: editing.buyLink,
          affiliate_network: editing.affiliateNetwork,
          in_stock: editing.inStock,
          featured: editing.featured,
        });
      } else if (activeTab === "ebooks") {
        const slug = editing.slug || slugify(editing.title);
        if (!editing.title || !slug) throw new Error("Título é obrigatório");
        await catalog.upsertEbook({
          slug,
          title: editing.title,
          author: editing.author,
          description: editing.description,
          synopsis: editing.synopsis,
          pages: parseInt(editing.pages) || 0,
          category: editing.category,
          image: editing.image,
          pdf_url: editing.pdfUrl || null,
          is_free: editing.isFree,
        });
      } else if (activeTab === "jogos") {
        const slug = editing.slug || slugify(editing.name);
        if (!editing.name || !slug) throw new Error("Nome é obrigatório");
        await catalog.upsertGame({
          slug,
          name: editing.name,
          category: editing.category,
          description: editing.description,
          mechanic: editing.mechanic,
          objective: editing.objective,
          image: editing.image,
          is_active: true,
        });
      } else if (activeTab === "desafios") {
        if (!editing.title) throw new Error("Título é obrigatório");
        await catalog.upsertChallenge({
          ...(editing._id ? { id: editing._id } : {}),
          title: editing.title,
          description: editing.description,
          difficulty: editing.difficulty as Challenge["difficulty"],
          category: editing.category,
          xp: parseInt(editing.xp) || 0,
          deadline: editing.deadline || null,
          is_active: true,
        });
      }
      toast({ title: "Salvo com sucesso!" });
      setDialogOpen(false);
      reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, type: Tab) => {
    if (!confirm("Confirma excluir este item?")) return;
    try {
      if (type === "produtos") await catalog.deleteProduct(id);
      else if (type === "ebooks") await catalog.deleteEbook(id);
      else if (type === "jogos") await catalog.deleteGame(id);
      else if (type === "desafios") await catalog.deleteChallenge(id);
      toast({ title: "Excluído" });
      reload();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  const seedFromMock = async () => {
    setSaving(true);
    setError(null);
    try {
      // Reusa o script de seed importando o mockData
      const { products: mp, ebooks: me, games: mg, challenges: mc } = await import("@/data/mockData");
      await Promise.all([
        catalog.upsertProduct.bind(null, undefined),
        // Implementação simplificada — chama upserts individuais
      ]);
      for (const p of mp) {
        await catalog.upsertProduct({
          slug: p.id, name: p.name, category: p.category,
          description: p.description, full_description: p.fullDescription,
          benefits: p.benefits, price: p.price, image: p.image,
          specs: p.specs, buy_link: p.buyLink, affiliate_network: "amazon",
          in_stock: true,
        });
      }
      for (const e of me) {
        await catalog.upsertEbook({
          slug: e.id, title: e.title, author: e.author,
          description: e.description, synopsis: e.synopsis,
          pages: e.pages, category: e.category, image: e.image, is_free: true,
        });
      }
      for (const g of mg) {
        await catalog.upsertGame({
          slug: g.id, name: g.name, category: g.category,
          description: g.description, mechanic: g.mechanic,
          objective: g.objective, image: g.image, is_active: true,
        });
      }
      // Challenges: como não tem slug unique, não usar upsert. Limpa e insere.
      for (const c of mc) {
        await catalog.upsertChallenge({
          title: c.title, description: c.description,
          difficulty: c.difficulty, category: c.category,
          xp: c.xp, deadline: c.deadline, is_active: true,
        });
      }
      toast({ title: "Seed concluído!", description: `${mp.length} produtos, ${me.length} ebooks, ${mg.length} jogos, ${mc.length} desafios importados.` });
      reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <SEO title="Administração — Centro de Sobrevivência" description="Gerencie produtos, e-books, jogos e desafios." />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
              Administração
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conectado como <strong>{user?.name}</strong> ({user?.email})
              {user?.isAdmin && <Badge className="ml-2">Admin</Badge>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={seedFromMock} disabled={saving}>
              <Database size={14} /> Importar mock data
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} /> Novo
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/40 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === t.key
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <t.icon size={16} /> {t.label}
              <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {t.key === "produtos" ? products.length :
                  t.key === "ebooks" ? ebooks.length :
                  t.key === "jogos" ? games.length :
                  challenges.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="pl-9" />
        </div>

        {/* Items */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === "produtos" && products.filter(p => filterBySearch(p.name + p.category)).map((p) => (
              <ItemRow key={p.id}
                title={p.name} subtitle={p.category} extra={p.price}
                image={p.image} featured={p.featured}
                onEdit={() => openEditProduct(p)}
                onDelete={() => handleDelete(p.id, "produtos")}
              />
            ))}
            {activeTab === "ebooks" && ebooks.filter(e => filterBySearch(e.title + e.author + e.category)).map((e) => (
              <ItemRow key={e.id}
                title={e.title} subtitle={`${e.author} · ${e.pages}p`} extra={e.category}
                image={e.image}
                onEdit={() => openEditEbook(e)}
                onDelete={() => handleDelete(e.id, "ebooks")}
              />
            ))}
            {activeTab === "jogos" && games.filter(g => filterBySearch(g.name + g.category)).map((g) => (
              <ItemRow key={g.id}
                title={g.name} subtitle={g.category} extra={g.mechanic}
                image={g.image}
                onEdit={() => openEditGame(g)}
                onDelete={() => handleDelete(g.id, "jogos")}
              />
            ))}
            {activeTab === "desafios" && challenges.filter(c => filterBySearch(c.title + c.category)).map((c) => (
              <ItemRow key={c.id}
                title={c.title} subtitle={`${c.difficulty} · ${c.xp} XP`} extra={c.category}
                onEdit={() => openEditChallenge(c)}
                onDelete={() => handleDelete(String(c.id), "desafios")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing._id ? "Editar" : "Novo"} — {activeTab}</DialogTitle>
          </DialogHeader>
          <AdminForm
            tab={activeTab}
            data={editing}
            onChange={setEditing}
          />
          {error && (
            <div className="mb-2 p-2 rounded bg-destructive/10 border border-destructive/40 text-xs text-foreground">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

const ItemRow = ({ title, subtitle, extra, image, featured, onEdit, onDelete }: {
  title: string; subtitle: string; extra?: string; image?: string;
  featured?: boolean; onEdit: () => void; onDelete: () => void;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
    {image && <img src={image} alt="" className="w-12 h-12 rounded object-cover" loading="lazy" />}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-foreground truncate">{title}</p>
        {featured && <Badge variant="default" className="text-[10px]">★</Badge>}
      </div>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
    {extra && <p className="text-xs text-muted-foreground hidden sm:block">{extra}</p>}
    <div className="flex gap-1">
      <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar"><Pencil size={16} /></Button>
      <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Excluir"><Trash2 size={16} /></Button>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const AdminForm = ({ tab, data, onChange }: {
  tab: Tab;
  data: FormState;
  onChange: (next: FormState) => void;
}) => {
  const set = (k: keyof FormState, v: string | boolean) => onChange({ ...data, [k]: v });

  return (
    <div className="space-y-4">
      {/* Common: name/title + slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tab === "ebooks" ? (
          <Field label="Título"><Input value={data.title} onChange={(e) => set("title", e.target.value)} /></Field>
        ) : tab === "desafios" ? (
          <Field label="Título"><Input value={data.title} onChange={(e) => set("title", e.target.value)} /></Field>
        ) : (
          <Field label="Nome"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
        )}
        {tab !== "desafios" && (
          <Field label="Slug (URL)"><Input value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado do nome" /></Field>
        )}
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Categoria"><Input value={data.category} onChange={(e) => set("category", e.target.value)} /></Field>
        {tab === "produtos" && (
          <Field label="Preço"><Input value={data.price} onChange={(e) => set("price", e.target.value)} placeholder="R$ 0,00" /></Field>
        )}
        {tab === "ebooks" && (
          <Field label="Páginas"><Input type="number" value={data.pages} onChange={(e) => set("pages", e.target.value)} /></Field>
        )}
        {tab === "desafios" && (
          <Field label="Dificuldade">
            <select value={data.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
              <option value="Fácil">Fácil</option>
              <option value="Médio">Médio</option>
              <option value="Difícil">Difícil</option>
              <option value="Extremo">Extremo</option>
            </select>
          </Field>
        )}
      </div>

      {/* Description */}
      <Field label="Descrição curta">
        <Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </Field>

      {/* Image URL */}
      {tab !== "desafios" && (
        <Field label="URL da imagem">
          <Input value={data.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
        </Field>
      )}

      {/* Products specifics */}
      {tab === "produtos" && (
        <>
          <Field label="Descrição completa">
            <Textarea value={data.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} rows={3} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Preço">
              <Input value={data.price} onChange={(e) => set("price", e.target.value)} placeholder="R$ 0,00" />
            </Field>
            <Field label="Rede de afiliados">
              <select value={data.affiliateNetwork} onChange={(e) => set("affiliateNetwork", e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm">
                <option value="amazon">Amazon Associates</option>
                <option value="mercadolivre">Mercado Livre Afiliados</option>
                <option value="aliexpress">AliExpress Affiliates</option>
                <option value="shopee">Shopee Affiliate</option>
                <option value="magalu">Magalu Lu</option>
                <option value="other">Outro</option>
              </select>
            </Field>
          </div>
          <Field label="Link de afiliado (buy_link)">
            <Input value={data.buyLink} onChange={(e) => set("buyLink", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Especificações (uma por linha)">
            <Textarea value={data.specs} onChange={(e) => set("specs", e.target.value)} rows={3} placeholder={"45 litros\nNylon 900D\nImpermeável"} />
          </Field>
          <Field label="Benefícios (um por linha)">
            <Textarea value={data.benefits} onChange={(e) => set("benefits", e.target.value)} rows={3} placeholder={"Alta durabilidade\nImpermeável"} />
          </Field>
          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2">
              <Switch checked={data.inStock} onCheckedChange={(v) => set("inStock", v)} />
              <span className="text-sm">Em estoque</span>
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={data.featured} onCheckedChange={(v) => set("featured", v)} />
              <span className="text-sm">Destaque</span>
            </label>
          </div>
        </>
      )}

      {/* Ebooks specifics */}
      {tab === "ebooks" && (
        <>
          <Field label="Autor"><Input value={data.author} onChange={(e) => set("author", e.target.value)} /></Field>
          <Field label="Sinopse"><Textarea value={data.synopsis} onChange={(e) => set("synopsis", e.target.value)} rows={3} /></Field>
          <Field label="PDF URL (opcional)"><Input value={data.pdfUrl} onChange={(e) => set("pdfUrl", e.target.value)} /></Field>
          <label className="flex items-center gap-2 pt-2">
            <Switch checked={data.isFree} onCheckedChange={(v) => set("isFree", v)} />
            <span className="text-sm">E-book gratuito</span>
          </label>
        </>
      )}

      {/* Games specifics */}
      {tab === "jogos" && (
        <>
          <Field label="Mecânica"><Textarea value={data.mechanic} onChange={(e) => set("mechanic", e.target.value)} rows={2} /></Field>
          <Field label="Objetivo"><Textarea value={data.objective} onChange={(e) => set("objective", e.target.value)} rows={2} /></Field>
        </>
      )}

      {/* Challenges specifics */}
      {tab === "desafios" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="XP">
            <Input type="number" value={data.xp} onChange={(e) => set("xp", e.target.value)} />
          </Field>
          <Field label="Deadline (data/hora)">
            <Input type="datetime-local" value={data.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  );
};

export default Admin;
