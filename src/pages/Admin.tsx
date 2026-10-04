/**
 * Admin.tsx — Painel administrativo expandido (5 abas).
 *
 * Estrutura:
 *   1. Usuários     — gestão de usuários (perfil, admin, XP, conquistas)
 *   2. Loja         — produtos + categorias
 *   3. Conteúdo     — e-books + jogos
 *   4. Gamificação  — desafios + conquistas
 *   5. Sistema      — dashboard de estatísticas + log de atividade
 *
 * Cada aba é um componente independente (próprio estado, próprios diálogos)
 * para evitar re-render global ao trocar de aba.
 */

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, BookOpen, Gamepad2, Trophy, Pencil, Trash2, Plus, Search,
  X, AlertCircle, Loader2, Database, RefreshCw, Users, ShoppingBag,
  Book, Award, Activity, Shield, ChevronUp, ChevronDown, Eye, Zap,
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
import admin from "@/lib/admin-catalog";
import type { Product, Ebook, Game, Challenge } from "@/lib/catalog";
import type { AdminUserList } from "@/lib/admin-catalog";
import type { CategoriesRow, AchievementsRow, ActivityLogRow } from "@/lib/supabase-types";
import { products as mockProducts, ebooks as mockEbooks, games as mockGames, challenges as mockChallenges } from "@/data/mockData";

// ─── Tipos ──────────────────────────────────────────────────────────────────

type Tab = "usuarios" | "loja" | "conteudo" | "gamificacao" | "sistema";

type CategoryType = "product" | "ebook" | "game" | "challenge";
type Difficulty = "Fácil" | "Médio" | "Difícil" | "Extremo";

interface ProductFormState {
  _id?: string;
  name: string; slug: string; category: string;
  description: string; fullDescription: string;
  price: string; image: string; specs: string; benefits: string;
  buyLink: string; affiliateNetwork: string;
  inStock: boolean; featured: boolean;
}
interface CategoryFormState {
  _id?: string;
  name: string; slug: string;
  type: CategoryType; description: string;
}
interface EbookFormState {
  _id?: string;
  title: string; slug: string; author: string;
  description: string; synopsis: string;
  pages: string; category: string; image: string;
  pdfUrl: string; isFree: boolean;
}
interface GameFormState {
  _id?: string;
  name: string; slug: string; category: string;
  description: string; mechanic: string; objective: string;
  image: string; isActive: boolean;
}
interface ChallengeFormState {
  _id?: string;
  title: string; description: string;
  difficulty: Difficulty; category: string;
  xp: string; deadline: string; isActive: boolean;
}
interface AchievementFormState {
  _id?: string;
  code: string; name: string; description: string;
  icon: string; xpReward: string; category: string;
}
interface UserFormState {
  _id: string;
  fullName: string; username: string;
  isAdmin: boolean; xpDelta: string;
}

// ─── Constantes ────────────────────────────────────────────────────────────

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "usuarios", label: "Usuários", icon: Users },
  { key: "loja", label: "Loja", icon: ShoppingBag },
  { key: "conteudo", label: "Conteúdo", icon: Book },
  { key: "gamificacao", label: "Gamificação", icon: Award },
  { key: "sistema", label: "Sistema", icon: Activity },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const emptyProductForm: ProductFormState = {
  name: "", slug: "", category: "", description: "", fullDescription: "",
  price: "", image: "", specs: "", benefits: "", buyLink: "",
  affiliateNetwork: "amazon", inStock: true, featured: false,
};
const emptyCategoryForm: CategoryFormState = {
  name: "", slug: "", type: "product", description: "",
};
const emptyEbookForm: EbookFormState = {
  title: "", slug: "", author: "", description: "", synopsis: "",
  pages: "0", category: "", image: "", pdfUrl: "", isFree: true,
};
const emptyGameForm: GameFormState = {
  name: "", slug: "", category: "", description: "", mechanic: "",
  objective: "", image: "", isActive: true,
};
const emptyChallengeForm: ChallengeFormState = {
  title: "", description: "", difficulty: "Médio", category: "",
  xp: "100", deadline: "", isActive: true,
};
const emptyAchievementForm: AchievementFormState = {
  code: "", name: "", description: "", icon: "🏆", xpReward: "100", category: "",
};
const emptyUserForm: UserFormState = {
  _id: "", fullName: "", username: "", isAdmin: false, xpDelta: "0",
};

const AFFILIATE_NETWORKS = [
  { value: "amazon", label: "Amazon Associates" },
  { value: "mercadolivre", label: "Mercado Livre Afiliados" },
  { value: "aliexpress", label: "AliExpress Affiliates" },
  { value: "shopee", label: "Shopee Affiliate" },
  { value: "magalu", label: "Magalu Lu" },
  { value: "other", label: "Outro" },
];

// ─── Helpers de UI ─────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const ErrorBanner = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/40 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      <p className="text-sm text-foreground">{message}</p>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="text-center py-12 text-muted-foreground text-sm">{label}</div>
);

interface ToolbarProps {
  search: string;
  setSearch: (s: string) => void;
  onReload: () => void;
  loading: boolean;
  saving?: boolean;
  onNew?: () => void;
  newLabel?: string;
  extra?: React.ReactNode;
}

const Toolbar = ({ search, setSearch, onReload, loading, saving, onNew, newLabel = "Novo", extra }: ToolbarProps) => (
  <div className="flex flex-col sm:flex-row gap-2 mb-4">
    <div className="relative flex-1">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar…"
        className="pl-9"
      />
    </div>
    <div className="flex gap-2 flex-wrap">
      {extra}
      <Button variant="outline" size="sm" onClick={onReload} disabled={loading}>
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
      </Button>
      {onNew && (
        <Button size="sm" onClick={onNew} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={14} />}
          {newLabel}
        </Button>
      )}
    </div>
  </div>
);

const initialsOf = (name: string | null | undefined): string => {
  const s = (name ?? "").trim();
  if (!s) return "?";
  return s.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
};

const fmtDate = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

interface RowBadge { label: string; variant?: "default" | "secondary" | "destructive" | "outline" }

interface ItemRowProps {
  title: string;
  subtitle?: string;
  extra?: string;
  image?: string;
  featured?: boolean;
  badges?: RowBadge[];
  onEdit: () => void;
  onDelete: () => void;
  extraActions?: React.ReactNode;
}

const ItemRow = ({ title, subtitle, extra, image, featured, badges = [], onEdit, onDelete, extraActions }: ItemRowProps) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
    {image ? (
      <img src={image} alt="" loading="lazy" className="w-12 h-12 rounded object-cover shrink-0" />
    ) : null}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-foreground truncate">{title}</p>
        {featured && <Badge variant="default" className="text-[10px]">★</Badge>}
        {badges.map((b, i) => (
          <Badge key={i} variant={b.variant ?? "secondary"} className="text-[10px]">{b.label}</Badge>
        ))}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
    </div>
    {extra && <p className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">{extra}</p>}
    <div className="flex gap-1 shrink-0">
      {extraActions}
      <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar"><Pencil size={16} /></Button>
      <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Excluir"><Trash2 size={16} /></Button>
    </div>
  </div>
);

// ─── Componente principal ───────────────────────────────────────────────────

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("usuarios");
  const [counts, setCounts] = useState<Record<Tab, number>>({
    usuarios: 0, loja: 0, conteudo: 0, gamificacao: 0, sistema: 0,
  });

  const reloadCounts = useCallback(async () => {
    try {
      const s = await admin.stats();
      setCounts({
        usuarios: s.users,
        loja: s.products + s.categories,
        conteudo: s.ebooks + s.games,
        gamificacao: s.challenges + s.achievements,
        sistema: s.activityLog,
      });
    } catch (err) {
      console.warn("[admin] stats:", (err as Error).message);
    }
  }, []);

  useEffect(() => { reloadCounts(); }, [reloadCounts]);

  return (
    <Layout>
      <SEO
        title="Administração — Centro de Sobrevivência"
        description="Painel administrativo: usuários, loja, conteúdo, gamificação e sistema."
        noIndex
      />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl uppercase tracking-wider text-foreground">
              Administração
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Conectado como <strong>{user?.name}</strong> ({user?.email})
              {user?.isAdmin && (
                <Badge className="ml-2 gap-1"><Shield size={10} /> Admin</Badge>
              )}
            </p>
          </div>
        </div>

        {/* Abas */}
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
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Conteúdo da aba ativa */}
        {activeTab === "usuarios" && <UsuariosTab onDataChanged={reloadCounts} />}
        {activeTab === "loja" && <LojaTab onDataChanged={reloadCounts} />}
        {activeTab === "conteudo" && <ConteudoTab onDataChanged={reloadCounts} />}
        {activeTab === "gamificacao" && <GamificacaoTab onDataChanged={reloadCounts} />}
        {activeTab === "sistema" && <SistemaTab onDataChanged={reloadCounts} />}
      </div>
    </Layout>
  );
};

// ─── Aba 1: Usuários ────────────────────────────────────────────────────────

/**
 * Aba Usuários — lista paginada de usuários (profiles) com:
 *  - Busca por email/nome/username (via admin.listUsers)
 *  - Editar perfil (nome, username, is_admin, ajustar XP)
 *  - Promover/Rebaixer admin (toggle rápido)
 *  - Ver conquistas do usuário (conceder / revogar)
 *  - Excluir usuário (com confirmação)
 */

const UsuariosTab = ({ onDataChanged }: { onDataChanged: () => void }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserList[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserFormState>(emptyUserForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [achUser, setAchUser] = useState<AdminUserList | null>(null);

  const reload = useCallback(async (searchStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await admin.listUsers({ page: 1, perPage: 100, search: searchStr });
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => reload(search), 350);
    return () => clearTimeout(t);
  }, [search, reload]);

  const openEdit = (u: AdminUserList) => {
    setEditing({
      _id: u.id,
      fullName: u.full_name ?? "",
      username: u.username ?? "",
      isAdmin: u.is_admin,
      xpDelta: "0",
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await admin.updateUser(editing._id, {
        full_name: editing.fullName || null,
        username: editing.username || null,
        is_admin: editing.isAdmin,
      });
      const delta = parseInt(editing.xpDelta) || 0;
      if (delta !== 0) {
        await admin.adjustXP(editing._id, delta);
      }
      toast({ title: "Usuário atualizado!" });
      setDialogOpen(false);
      reload(search);
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAdmin = async (u: AdminUserList) => {
    try {
      await admin.toggleAdmin(u.id, !u.is_admin);
      toast({ title: u.is_admin ? "Removido admin" : "Promovido a admin" });
      reload(search);
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async (u: AdminUserList) => {
    if (!confirm(`Excluir usuário "${u.full_name ?? u.email ?? u.id}"?\nIsso remove waypoints, rotas, conquistas e desafios associados.`)) return;
    try {
      await admin.deleteUser(u.id);
      toast({ title: "Usuário excluído" });
      reload(search);
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <div>
      <Toolbar
        search={search}
        setSearch={setSearch}
        onReload={() => reload(search)}
        loading={loading}
      />
      <ErrorBanner message={error} />

      {loading ? <LoadingState /> : users.length === 0 ? (
        <EmptyState label="Nenhum usuário encontrado." />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {initialsOf(u.full_name ?? u.username)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground truncate">
                    {u.full_name ?? u.username ?? u.email ?? "Sem nome"}
                  </p>
                  {u.is_admin && (
                    <Badge variant="default" className="text-[10px] gap-1">
                      <Shield size={10} /> Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {u.email ?? "—"} · Lvl {u.level} · {u.xp} XP ·
                  WP {u.waypoints_count ?? 0} / RT {u.routes_count ?? 0} / AC {u.achievements_count ?? 0}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Último acesso: {u.last_active_date ?? "—"}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setAchUser(u)}
                  aria-label="Ver conquistas"
                  title="Ver conquistas"
                >
                  <Trophy size={16} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(u)}
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleToggleAdmin(u)}
                  aria-label={u.is_admin ? "Rebaixar admin" : "Promover a admin"}
                  title={u.is_admin ? "Rebaixer admin" : "Promover a admin"}
                >
                  {u.is_admin ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(u)}
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diálogo editar usuário */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Nome completo">
              <Input
                value={editing.fullName}
                onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
              />
            </Field>
            <Field label="Username">
              <Input
                value={editing.username}
                onChange={(e) => setEditing({ ...editing, username: e.target.value })}
              />
            </Field>
            <label className="flex items-center gap-2">
              <Switch
                checked={editing.isAdmin}
                onCheckedChange={(v) => setEditing({ ...editing, isAdmin: v })}
              />
              <span className="text-sm flex items-center gap-1">
                <Shield size={12} /> Administrador
              </span>
            </label>
            <Field label="Ajustar XP (delta — pode ser negativo)">
              <Input
                type="number"
                value={editing.xpDelta}
                onChange={(e) => setEditing({ ...editing, xpDelta: e.target.value })}
              />
            </Field>
          </div>
          {error && <div className="text-xs text-destructive">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo conquistas do usuário */}
      <UserAchievementsDialog user={achUser} onClose={() => setAchUser(null)} />
    </div>
  );
};

/**
 * UserAchievementsDialog — mostra todas as conquistas cadastradas e quais o
 * usuário já possui. Permite conceder / revogar cada uma individualmente.
 */

const UserAchievementsDialog = ({ user, onClose }: { user: AdminUserList | null; onClose: () => void }) => {
  const { toast } = useToast();
  const [all, setAll] = useState<AchievementsRow[]>([]);
  const [mine, setMine] = useState<AchievementsRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allAch, userAch] = await Promise.all([
        admin.listAchievements(),
        admin.listUserAchievements(user.id),
      ]);
      setAll(allAch);
      setMine(userAch.map((r) => r.achievement).filter(Boolean) as AchievementsRow[]);
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const has = (id: string) => mine.some((a) => a.id === id);

  const toggle = async (a: AchievementsRow) => {
    if (!user) return;
    try {
      if (has(a.id)) {
        await admin.revokeAchievement(user.id, a.id);
        setMine((prev) => prev.filter((x) => x.id !== a.id));
        toast({ title: "Conquista revogada", description: a.name });
      } else {
        await admin.grantAchievement(user.id, a.id);
        setMine((prev) => [...prev, a]);
        toast({ title: "Conquista concedida!", description: `${a.name} (+${a.xp_reward} XP)` });
      }
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy size={16} /> Conquistas — {user?.full_name ?? user?.email}
          </DialogTitle>
        </DialogHeader>
        {loading ? <LoadingState /> : all.length === 0 ? (
          <EmptyState label="Nenhuma conquista cadastrada." />
        ) : (
          <div className="space-y-2">
            {all.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded border border-border">
                <div className="text-2xl">{a.icon ?? "🏆"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-2">
                    {a.name}
                    <Badge variant="outline" className="text-[10px]">{a.code}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.description ?? "—"} · +{a.xp_reward} XP
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={has(a.id) ? "default" : "outline"}
                  onClick={() => toggle(a)}
                >
                  {has(a.id) ? "Revogar" : "Conceder"}
                </Button>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Aba 2: Loja (Produtos + Categorias) ───────────────────────────────────

/**
 * Aba Loja — gestão de produtos e categorias.
 * Mostra duas sub-seções na mesma tela:
 *   • Produtos    — CRUD via catalog.upsertProduct / deleteProduct
 *   • Categorias  — CRUD via admin.upsertCategory / deleteCategory
 * Botão "Importar mock data" chama catalog.upsertProduct/upsertEbook/upsertGame/
 * upsertChallenge para todos os itens do mockData, com try/catch por item.
 */

const LojaTab = ({ onDataChanged }: { onDataChanged: () => void }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoriesRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productDialog, setProductDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [productEditing, setProductEditing] = useState<ProductFormState>(emptyProductForm);
  const [categoryEditing, setCategoryEditing] = useState<CategoryFormState>(emptyCategoryForm);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      catalog.clearCache();
      const [p, c] = await Promise.all([
        catalog.listProducts(),
        admin.listCategories(),
      ]);
      setProducts(p);
      setCategories(c);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Filtros client-side
  const lowerSearch = search.toLowerCase();
  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.category} ${p.affiliateNetwork ?? ""}`.toLowerCase().includes(lowerSearch)
  );
  const filteredCategories = categories.filter((c) =>
    `${c.name} ${c.slug} ${c.type} ${c.description ?? ""}`.toLowerCase().includes(lowerSearch)
  );

  // Handlers de produto
  const openEditProduct = (p: Product) => {
    setProductEditing({
      _id: p.id,
      name: p.name,
      slug: p.slug ?? p.id,
      category: p.category,
      description: p.description,
      fullDescription: p.fullDescription,
      price: p.price,
      image: p.image,
      specs: p.specs.join("\n"),
      benefits: p.benefits.join("\n"),
      buyLink: p.buyLink,
      affiliateNetwork: p.affiliateNetwork ?? "amazon",
      inStock: p.inStock ?? true,
      featured: p.featured ?? false,
    });
    setError(null);
    setProductDialog(true);
  };

  const handleSaveProduct = async () => {
    setSaving(true);
    setError(null);
    try {
      const slug = productEditing.slug || slugify(productEditing.name);
      if (!productEditing.name || !slug) throw new Error("Nome é obrigatório");
      await catalog.upsertProduct({
        ...(productEditing._id ? { id: productEditing._id } : {}),
        slug,
        name: productEditing.name,
        category: productEditing.category,
        description: productEditing.description,
        full_description: productEditing.fullDescription,
        benefits: productEditing.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        price: productEditing.price,
        image: productEditing.image,
        specs: productEditing.specs.split("\n").map((s) => s.trim()).filter(Boolean),
        buy_link: productEditing.buyLink,
        affiliate_network: productEditing.affiliateNetwork,
        in_stock: productEditing.inStock,
        featured: productEditing.featured,
      });
      toast({ title: "Produto salvo!" });
      setProductDialog(false);
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Confirma excluir este produto?")) return;
    try {
      await catalog.deleteProduct(id);
      toast({ title: "Produto excluído" });
      reload();
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  // Handlers de categoria
  const openEditCategory = (c: CategoriesRow) => {
    setCategoryEditing({
      _id: c.id,
      name: c.name,
      slug: c.slug,
      type: c.type,
      description: c.description ?? "",
    });
    setError(null);
    setCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    setSaving(true);
    setError(null);
    try {
      const slug = categoryEditing.slug || slugify(categoryEditing.name);
      if (!categoryEditing.name || !slug) throw new Error("Nome é obrigatório");
      await admin.upsertCategory({
        ...(categoryEditing._id ? { id: categoryEditing._id } : {}),
        name: categoryEditing.name,
        slug,
        type: categoryEditing.type,
        description: categoryEditing.description || null,
      });
      toast({ title: "Categoria salva!" });
      setCategoryDialog(false);
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Confirma excluir esta categoria?")) return;
    try {
      await admin.deleteCategory(id);
      toast({ title: "Categoria excluída" });
      reload();
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  // Importar mock data (todos os tipos)
  const seedFromMock = async () => {
    if (!confirm("Importar todos os mock data (produtos, e-books, jogos, desafios)?")) return;
    setSaving(true);
    setError(null);
    try {
      let okP = 0, failP = 0, okE = 0, failE = 0, okG = 0, failG = 0, okC = 0, failC = 0;
      for (const p of mockProducts) {
        try {
          await catalog.upsertProduct({
            slug: p.id, name: p.name, category: p.category,
            description: p.description, full_description: p.fullDescription,
            benefits: p.benefits, price: p.price, image: p.image,
            specs: p.specs, buy_link: p.buyLink, affiliate_network: "amazon",
            in_stock: true,
          });
          okP++;
        } catch { failP++; }
      }
      for (const e of mockEbooks) {
        try {
          await catalog.upsertEbook({
            slug: e.id, title: e.title, author: e.author,
            description: e.description, synopsis: e.synopsis,
            pages: e.pages, category: e.category, image: e.image, is_free: true,
          });
          okE++;
        } catch { failE++; }
      }
      for (const g of mockGames) {
        try {
          await catalog.upsertGame({
            slug: g.id, name: g.name, category: g.category,
            description: g.description, mechanic: g.mechanic,
            objective: g.objective, image: g.image, is_active: true,
          });
          okG++;
        } catch { failG++; }
      }
      for (const c of mockChallenges) {
        try {
          await catalog.upsertChallenge({
            title: c.title, description: c.description,
            difficulty: c.difficulty, category: c.category,
            xp: c.xp, deadline: c.deadline || null, is_active: true,
          });
          okC++;
        } catch { failC++; }
      }
      const totalOk = okP + okE + okG + okC;
      const totalFail = failP + failE + failG + failC;
      toast({
        title: "Importação concluída",
        description: `${totalOk} itens importados (${totalFail} falhas). P:${okP}/${failP} E:${okE}/${failE} G:${okG}/${failG} C:${okC}/${failC}`,
      });
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
      toast({ title: "Erro na importação", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        setSearch={setSearch}
        onReload={reload}
        loading={loading}
        saving={saving}
        onNew={() => { setProductEditing(emptyProductForm); setError(null); setProductDialog(true); }}
        newLabel="Novo produto"
        extra={
          <Button variant="outline" size="sm" onClick={seedFromMock} disabled={saving}>
            <Database size={14} /> Importar mock data
          </Button>
        }
      />
      <ErrorBanner message={error} />

      {/* Produtos */}
      <section>
        <h2 className="font-heading uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
          <Package size={14} /> Produtos ({filteredProducts.length})
        </h2>
        {loading ? <LoadingState /> : filteredProducts.length === 0 ? (
          <EmptyState label="Nenhum produto." />
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((p) => (
              <ItemRow
                key={p.id}
                title={p.name}
                subtitle={`${p.category} · ${p.affiliateNetwork ?? "—"}`}
                extra={p.price}
                image={p.image}
                featured={p.featured}
                badges={[
                  ...(p.inStock === false ? [{ label: "Sem estoque", variant: "destructive" as const }] : []),
                  ...(p.featured ? [{ label: "Destaque" }] : []),
                ]}
                onEdit={() => openEditProduct(p)}
                onDelete={() => handleDeleteProduct(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Categorias */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading uppercase tracking-wider text-sm flex items-center gap-2">
            <Package size={14} /> Categorias ({filteredCategories.length})
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setCategoryEditing(emptyCategoryForm); setError(null); setCategoryDialog(true); }}
          >
            <Plus size={14} /> Nova categoria
          </Button>
        </div>
        {filteredCategories.length === 0 ? (
          <EmptyState label="Nenhuma categoria." />
        ) : (
          <div className="space-y-2">
            {filteredCategories.map((c) => (
              <ItemRow
                key={c.id}
                title={c.name}
                subtitle={`/${c.slug} · tipo: ${c.type}${c.description ? " · " + c.description : ""}`}
                badges={[{ label: c.type, variant: "outline" as const }]}
                onEdit={() => openEditCategory(c)}
                onDelete={() => handleDeleteCategory(c.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Diálogo produto */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{productEditing._id ? "Editar" : "Novo"} produto</DialogTitle>
          </DialogHeader>
          <ProductForm data={productEditing} onChange={setProductEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveProduct} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo categoria */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{categoryEditing._id ? "Editar" : "Nova"} categoria</DialogTitle>
          </DialogHeader>
          <CategoryForm data={categoryEditing} onChange={setCategoryEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Aba 3: Conteúdo (E-books + Jogos) ─────────────────────────────────────

/**
 * Aba Conteúdo — gestão de e-books e jogos.
 *   • E-books — CRUD via catalog.upsertEbook / deleteEbook
 *   • Jogos   — CRUD via catalog.upsertGame / deleteGame
 */

const ConteudoTab = ({ onDataChanged }: { onDataChanged: () => void }) => {
  const { toast } = useToast();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ebookDialog, setEbookDialog] = useState(false);
  const [gameDialog, setGameDialog] = useState(false);
  const [ebookEditing, setEbookEditing] = useState<EbookFormState>(emptyEbookForm);
  const [gameEditing, setGameEditing] = useState<GameFormState>(emptyGameForm);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      catalog.clearCache();
      const [e, g] = await Promise.all([
        catalog.listEbooks(),
        catalog.listGames(),
      ]);
      setEbooks(e);
      setGames(g);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const lowerSearch = search.toLowerCase();
  const filteredEbooks = ebooks.filter((e) =>
    `${e.title} ${e.author} ${e.category}`.toLowerCase().includes(lowerSearch)
  );
  const filteredGames = games.filter((g) =>
    `${g.name} ${g.category}`.toLowerCase().includes(lowerSearch)
  );

  // E-book handlers
  const openEditEbook = (e: Ebook) => {
    setEbookEditing({
      _id: e.id,
      title: e.title, slug: e.id, author: e.author,
      description: e.description, synopsis: e.synopsis,
      pages: String(e.pages), category: e.category, image: e.image,
      pdfUrl: e.pdfUrl ?? "", isFree: e.isFree ?? true,
    });
    setError(null);
    setEbookDialog(true);
  };

  const handleSaveEbook = async () => {
    setSaving(true);
    setError(null);
    try {
      const slug = ebookEditing.slug || slugify(ebookEditing.title);
      if (!ebookEditing.title || !slug) throw new Error("Título é obrigatório");
      await catalog.upsertEbook({
        ...(ebookEditing._id ? { id: ebookEditing._id } : {}),
        slug,
        title: ebookEditing.title,
        author: ebookEditing.author,
        description: ebookEditing.description,
        synopsis: ebookEditing.synopsis,
        pages: parseInt(ebookEditing.pages) || 0,
        category: ebookEditing.category,
        image: ebookEditing.image,
        pdf_url: ebookEditing.pdfUrl || null,
        is_free: ebookEditing.isFree,
      });
      toast({ title: "E-book salvo!" });
      setEbookDialog(false);
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEbook = async (id: string) => {
    if (!confirm("Confirma excluir este e-book?")) return;
    try {
      await catalog.deleteEbook(id);
      toast({ title: "E-book excluído" });
      reload();
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  // Game handlers
  const openEditGame = (g: Game) => {
    setGameEditing({
      _id: g.id,
      name: g.name, slug: g.id, category: g.category,
      description: g.description, mechanic: g.mechanic,
      objective: g.objective, image: g.image, isActive: true,
    });
    setError(null);
    setGameDialog(true);
  };

  const handleSaveGame = async () => {
    setSaving(true);
    setError(null);
    try {
      const slug = gameEditing.slug || slugify(gameEditing.name);
      if (!gameEditing.name || !slug) throw new Error("Nome é obrigatório");
      await catalog.upsertGame({
        ...(gameEditing._id ? { id: gameEditing._id } : {}),
        slug,
        name: gameEditing.name,
        category: gameEditing.category,
        description: gameEditing.description,
        mechanic: gameEditing.mechanic,
        objective: gameEditing.objective,
        image: gameEditing.image,
        is_active: gameEditing.isActive,
      });
      toast({ title: "Jogo salvo!" });
      setGameDialog(false);
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (!confirm("Confirma excluir este jogo?")) return;
    try {
      await catalog.deleteGame(id);
      toast({ title: "Jogo excluído" });
      reload();
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        setSearch={setSearch}
        onReload={reload}
        loading={loading}
        saving={saving}
        onNew={() => { setEbookEditing(emptyEbookForm); setError(null); setEbookDialog(true); }}
        newLabel="Novo e-book"
      />
      <ErrorBanner message={error} />

      {/* E-books */}
      <section>
        <h2 className="font-heading uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
          <BookOpen size={14} /> E-books ({filteredEbooks.length})
        </h2>
        {loading ? <LoadingState /> : filteredEbooks.length === 0 ? (
          <EmptyState label="Nenhum e-book." />
        ) : (
          <div className="space-y-2">
            {filteredEbooks.map((e) => (
              <ItemRow
                key={e.id}
                title={e.title}
                subtitle={`${e.author} · ${e.pages}p · ${e.category}`}
                image={e.image}
                badges={[{ label: e.isFree === false ? "Pago" : "Gratuito", variant: e.isFree === false ? "outline" : "default" }]}
                onEdit={() => openEditEbook(e)}
                onDelete={() => handleDeleteEbook(e.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Jogos */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading uppercase tracking-wider text-sm flex items-center gap-2">
            <Gamepad2 size={14} /> Jogos ({filteredGames.length})
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setGameEditing(emptyGameForm); setError(null); setGameDialog(true); }}
          >
            <Plus size={14} /> Novo jogo
          </Button>
        </div>
        {filteredGames.length === 0 ? (
          <EmptyState label="Nenhum jogo." />
        ) : (
          <div className="space-y-2">
            {filteredGames.map((g) => (
              <ItemRow
                key={g.id}
                title={g.name}
                subtitle={`${g.category} · ${g.mechanic}`}
                image={g.image}
                badges={[{ label: "Ativo", variant: "default" }]}
                onEdit={() => openEditGame(g)}
                onDelete={() => handleDeleteGame(g.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Diálogo e-book */}
      <Dialog open={ebookDialog} onOpenChange={setEbookDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{ebookEditing._id ? "Editar" : "Novo"} e-book</DialogTitle>
          </DialogHeader>
          <EbookForm data={ebookEditing} onChange={setEbookEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEbookDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEbook} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo jogo */}
      <Dialog open={gameDialog} onOpenChange={setGameDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{gameEditing._id ? "Editar" : "Novo"} jogo</DialogTitle>
          </DialogHeader>
          <GameForm data={gameEditing} onChange={setGameEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setGameDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveGame} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Aba 4: Gamificação (Desafios + Conquistas) ──────────────────────────

/**
 * Aba Gamificação — gestão de desafios e conquistas.
 *   • Desafios    — CRUD via catalog.upsertChallenge / deleteChallenge
 *   • Conquistas  — CRUD via admin.upsertAchievement / deleteAchievement
 */

const GamificacaoTab = ({ onDataChanged }: { onDataChanged: () => void }) => {
  const { toast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [achievements, setAchievements] = useState<AchievementsRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challengeDialog, setChallengeDialog] = useState(false);
  const [achievementDialog, setAchievementDialog] = useState(false);
  const [challengeEditing, setChallengeEditing] = useState<ChallengeFormState>(emptyChallengeForm);
  const [achievementEditing, setAchievementEditing] = useState<AchievementFormState>(emptyAchievementForm);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      catalog.clearCache();
      const [c, a] = await Promise.all([
        catalog.listChallenges(),
        admin.listAchievements(),
      ]);
      setChallenges(c);
      setAchievements(a);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const lowerSearch = search.toLowerCase();
  const filteredChallenges = challenges.filter((c) =>
    `${c.title} ${c.category} ${c.difficulty}`.toLowerCase().includes(lowerSearch)
  );
  const filteredAchievements = achievements.filter((a) =>
    `${a.name} ${a.code} ${a.category ?? ""}`.toLowerCase().includes(lowerSearch)
  );

  // Challenge handlers
  const openEditChallenge = (c: Challenge) => {
    setChallengeEditing({
      _id: String(c.id),
      title: c.title, description: c.description,
      difficulty: c.difficulty, category: c.category,
      xp: String(c.xp), deadline: c.deadline, isActive: true,
    });
    setError(null);
    setChallengeDialog(true);
  };

  const handleSaveChallenge = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!challengeEditing.title) throw new Error("Título é obrigatório");
      await catalog.upsertChallenge({
        ...(challengeEditing._id ? { id: challengeEditing._id } : {}),
        title: challengeEditing.title,
        description: challengeEditing.description,
        difficulty: challengeEditing.difficulty,
        category: challengeEditing.category,
        xp: parseInt(challengeEditing.xp) || 0,
        deadline: challengeEditing.deadline || null,
        is_active: challengeEditing.isActive,
      });
      toast({ title: "Desafio salvo!" });
      setChallengeDialog(false);
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Confirma excluir este desafio?")) return;
    try {
      await catalog.deleteChallenge(id);
      toast({ title: "Desafio excluído" });
      reload();
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  // Achievement handlers
  const openEditAchievement = (a: AchievementsRow) => {
    setAchievementEditing({
      _id: a.id,
      code: a.code,
      name: a.name,
      description: a.description ?? "",
      icon: a.icon ?? "🏆",
      xpReward: String(a.xp_reward),
      category: a.category ?? "",
    });
    setError(null);
    setAchievementDialog(true);
  };

  const handleSaveAchievement = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!achievementEditing.code || !achievementEditing.name) {
        throw new Error("Código e nome são obrigatórios");
      }
      await admin.upsertAchievement({
        ...(achievementEditing._id ? { id: achievementEditing._id } : {}),
        code: achievementEditing.code,
        name: achievementEditing.name,
        description: achievementEditing.description || null,
        icon: achievementEditing.icon || null,
        xp_reward: parseInt(achievementEditing.xpReward) || 0,
        category: achievementEditing.category || null,
      });
      toast({ title: "Conquista salva!" });
      setAchievementDialog(false);
      reload();
      onDataChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("Confirma excluir esta conquista?")) return;
    try {
      await admin.deleteAchievement(id);
      toast({ title: "Conquista excluída" });
      reload();
      onDataChanged();
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        setSearch={setSearch}
        onReload={reload}
        loading={loading}
        saving={saving}
        onNew={() => { setChallengeEditing(emptyChallengeForm); setError(null); setChallengeDialog(true); }}
        newLabel="Novo desafio"
      />
      <ErrorBanner message={error} />

      {/* Desafios */}
      <section>
        <h2 className="font-heading uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
          <Trophy size={14} /> Desafios ({filteredChallenges.length})
        </h2>
        {loading ? <LoadingState /> : filteredChallenges.length === 0 ? (
          <EmptyState label="Nenhum desafio." />
        ) : (
          <div className="space-y-2">
            {filteredChallenges.map((c) => (
              <ItemRow
                key={c.id}
                title={c.title}
                subtitle={`${c.difficulty} · ${c.category} · ${c.xp} XP`}
                extra={c.deadline ? fmtDate(c.deadline) : "—"}
                badges={[{ label: c.difficulty, variant: c.difficulty === "Extremo" ? "destructive" : "secondary" }]}
                onEdit={() => openEditChallenge(c)}
                onDelete={() => handleDeleteChallenge(String(c.id))}
              />
            ))}
          </div>
        )}
      </section>

      {/* Conquistas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading uppercase tracking-wider text-sm flex items-center gap-2">
            <Award size={14} /> Conquistas ({filteredAchievements.length})
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setAchievementEditing(emptyAchievementForm); setError(null); setAchievementDialog(true); }}
          >
            <Plus size={14} /> Nova conquista
          </Button>
        </div>
        {filteredAchievements.length === 0 ? (
          <EmptyState label="Nenhuma conquista." />
        ) : (
          <div className="space-y-2">
            {filteredAchievements.map((a) => (
              <ItemRow
                key={a.id}
                title={`${a.icon ?? "🏆"} ${a.name}`}
                subtitle={`${a.code} · ${a.category ?? "—"} · +${a.xp_reward} XP`}
                extra={a.description ?? ""}
                badges={[{ label: `+${a.xp_reward} XP`, variant: "default" }]}
                onEdit={() => openEditAchievement(a)}
                onDelete={() => handleDeleteAchievement(a.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Diálogo desafio */}
      <Dialog open={challengeDialog} onOpenChange={setChallengeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{challengeEditing._id ? "Editar" : "Novo"} desafio</DialogTitle>
          </DialogHeader>
          <ChallengeForm data={challengeEditing} onChange={setChallengeEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setChallengeDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveChallenge} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo conquista */}
      <Dialog open={achievementDialog} onOpenChange={setAchievementDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{achievementEditing._id ? "Editar" : "Nova"} conquista</DialogTitle>
          </DialogHeader>
          <AchievementForm data={achievementEditing} onChange={setAchievementEditing} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAchievementDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveAchievement} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Aba 5: Sistema (Estatísticas + Log de atividade) ──────────────────────

/**
 * Aba Sistema — dashboard com contagens das principais tabelas e viewer do
 * log de atividade com filtro por user_id e activity_type. Paginação de 50
 * itens por página.
 */

interface StatsData {
  users: number; products: number; ebooks: number; games: number;
  challenges: number; achievements: number; categories: number;
  waypoints: number; routes: number; activityLog: number;
}

const SistemaTab = ({ onDataChanged }: { onDataChanged: () => void }) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activity, setActivity] = useState<ActivityLogRow[]>([]);
  const [searchUserId, setSearchUserId] = useState("");
  const [searchType, setSearchType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const PER_PAGE = 50;

  const reloadStats = useCallback(async () => {
    try {
      const s = await admin.stats();
      setStats({
        users: s.users, products: s.products, ebooks: s.ebooks, games: s.games,
        challenges: s.challenges, achievements: s.achievements,
        categories: s.categories, waypoints: s.waypoints,
        routes: s.routes, activityLog: s.activityLog,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  const reloadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, total: t } = await admin.listActivityLog({
        page,
        perPage: PER_PAGE,
        userId: searchUserId || undefined,
        type: searchType || undefined,
      });
      setActivity(data);
      setTotal(t);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, searchUserId, searchType]);

  useEffect(() => { reloadStats(); }, [reloadStats]);
  useEffect(() => {
    const t = setTimeout(() => reloadActivity(), 300);
    return () => clearTimeout(t);
  }, [reloadActivity]);

  const statsCards: { label: string; value: number; icon: React.ElementType }[] = stats ? [
    { label: "Usuários", value: stats.users, icon: Users },
    { label: "Produtos", value: stats.products, icon: ShoppingBag },
    { label: "E-books", value: stats.ebooks, icon: Book },
    { label: "Jogos", value: stats.games, icon: Gamepad2 },
    { label: "Desafios", value: stats.challenges, icon: Trophy },
    { label: "Conquistas", value: stats.achievements, icon: Award },
    { label: "Categorias", value: stats.categories, icon: Package },
    { label: "Waypoints", value: stats.waypoints, icon: Zap },
    { label: "Rotas", value: stats.routes, icon: Eye },
    { label: "Logs", value: stats.activityLog, icon: Activity },
  ] : [];

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />

      {/* Dashboard de estatísticas */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-heading uppercase tracking-wider text-sm flex items-center gap-2">
            <Activity size={14} /> Estatísticas do sistema
          </h2>
          <Button variant="outline" size="sm" onClick={() => { reloadStats(); onDataChanged(); }}>
            <RefreshCw size={14} /> Atualizar
          </Button>
        </div>
        {!stats ? <LoadingState /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {statsCards.map((c) => (
              <div key={c.label} className="p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <c.icon size={12} /> {c.label}
                </div>
                <p className="font-mono text-2xl font-bold text-foreground mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Log de atividade */}
      <section>
        <h2 className="font-heading uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
          <Database size={14} /> Log de atividade
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <Input
            placeholder="Filtrar por user_id (UUID completo ou prefixo)"
            value={searchUserId}
            onChange={(e) => { setSearchUserId(e.target.value); setPage(1); }}
            className="font-mono text-xs"
          />
          <Input
            placeholder="Filtrar por activity_type (ex: waypoint_created)"
            value={searchType}
            onChange={(e) => { setSearchType(e.target.value); setPage(1); }}
            className="text-xs"
          />
          <Button variant="outline" size="sm" onClick={reloadActivity} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
          </Button>
        </div>

        {loading ? <LoadingState /> : activity.length === 0 ? (
          <EmptyState label="Nenhuma atividade encontrada." />
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Criado em</th>
                  <th className="text-left p-2 font-medium">User</th>
                  <th className="text-left p-2 font-medium">Tipo</th>
                  <th className="text-left p-2 font-medium">Descrição</th>
                  <th className="text-right p-2 font-medium">XP</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-2 whitespace-nowrap text-xs text-muted-foreground">
                      {fmtDate(a.created_at)}
                    </td>
                    <td className="p-2 font-mono text-xs">
                      {a.user_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {a.activity_type}
                      </Badge>
                    </td>
                    <td className="p-2">{a.description ?? "—"}</td>
                    <td className="p-2 text-right font-mono text-xs">
                      {a.xp_awarded > 0 ? `+${a.xp_awarded}` : a.xp_awarded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} itens
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronDown className="rotate-90" size={14} /> Anterior
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima <ChevronUp className="-rotate-90" size={14} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

// ─── Formulários (sub-componentes) ─────────────────────────────────────────

const ProductForm = ({ data, onChange }: { data: ProductFormState; onChange: (d: ProductFormState) => void }) => {
  const set = <K extends keyof ProductFormState>(k: K, v: ProductFormState[K]) =>
    onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome *"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Slug (URL)"><Input value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado do nome" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Categoria"><Input value={data.category} onChange={(e) => set("category", e.target.value)} /></Field>
        <Field label="Preço"><Input value={data.price} onChange={(e) => set("price", e.target.value)} placeholder="R$ 0,00" /></Field>
      </div>
      <Field label="Descrição curta"><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={2} /></Field>
      <Field label="Descrição completa"><Textarea value={data.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} rows={3} /></Field>
      <Field label="URL da imagem"><Input value={data.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Rede de afiliados">
          <select
            value={data.affiliateNetwork}
            onChange={(e) => set("affiliateNetwork", e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
          >
            {AFFILIATE_NETWORKS.map((n) => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Link de afiliado (buy_link)">
          <Input value={data.buyLink} onChange={(e) => set("buyLink", e.target.value)} placeholder="https://…" />
        </Field>
      </div>
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
    </div>
  );
};

const CategoryForm = ({ data, onChange }: { data: CategoryFormState; onChange: (d: CategoryFormState) => void }) => {
  const set = <K extends keyof CategoryFormState>(k: K, v: CategoryFormState[K]) =>
    onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <Field label="Nome *"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <Field label="Slug (URL)"><Input value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado do nome" /></Field>
      <Field label="Tipo">
        <select
          value={data.type}
          onChange={(e) => set("type", e.target.value as CategoryType)}
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
        >
          <option value="product">Produto</option>
          <option value="ebook">E-book</option>
          <option value="game">Jogo</option>
          <option value="challenge">Desafio</option>
        </select>
      </Field>
      <Field label="Descrição"><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={2} /></Field>
    </div>
  );
};

const EbookForm = ({ data, onChange }: { data: EbookFormState; onChange: (d: EbookFormState) => void }) => {
  const set = <K extends keyof EbookFormState>(k: K, v: EbookFormState[K]) =>
    onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Título *"><Input value={data.title} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Slug (URL)"><Input value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado do título" /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Autor"><Input value={data.author} onChange={(e) => set("author", e.target.value)} /></Field>
        <Field label="Páginas"><Input type="number" value={data.pages} onChange={(e) => set("pages", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Categoria"><Input value={data.category} onChange={(e) => set("category", e.target.value)} /></Field>
        <Field label="PDF URL (opcional)"><Input value={data.pdfUrl} onChange={(e) => set("pdfUrl", e.target.value)} placeholder="https://…" /></Field>
      </div>
      <Field label="Descrição curta"><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={2} /></Field>
      <Field label="Sinopse"><Textarea value={data.synopsis} onChange={(e) => set("synopsis", e.target.value)} rows={3} /></Field>
      <Field label="URL da capa"><Input value={data.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></Field>
      <label className="flex items-center gap-2 pt-2">
        <Switch checked={data.isFree} onCheckedChange={(v) => set("isFree", v)} />
        <span className="text-sm">E-book gratuito</span>
      </label>
    </div>
  );
};

const GameForm = ({ data, onChange }: { data: GameFormState; onChange: (d: GameFormState) => void }) => {
  const set = <K extends keyof GameFormState>(k: K, v: GameFormState[K]) =>
    onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome *"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Slug (URL)"><Input value={data.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-gerado do nome" /></Field>
      </div>
      <Field label="Categoria"><Input value={data.category} onChange={(e) => set("category", e.target.value)} /></Field>
      <Field label="Descrição"><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={2} /></Field>
      <Field label="URL da imagem"><Input value={data.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…" /></Field>
      <Field label="Mecânica"><Textarea value={data.mechanic} onChange={(e) => set("mechanic", e.target.value)} rows={2} /></Field>
      <Field label="Objetivo"><Textarea value={data.objective} onChange={(e) => set("objective", e.target.value)} rows={2} /></Field>
      <label className="flex items-center gap-2 pt-2">
        <Switch checked={data.isActive} onCheckedChange={(v) => set("isActive", v)} />
        <span className="text-sm">Jogo ativo</span>
      </label>
    </div>
  );
};

const ChallengeForm = ({ data, onChange }: { data: ChallengeFormState; onChange: (d: ChallengeFormState) => void }) => {
  const set = <K extends keyof ChallengeFormState>(k: K, v: ChallengeFormState[K]) =>
    onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <Field label="Título *"><Input value={data.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Dificuldade">
          <select
            value={data.difficulty}
            onChange={(e) => set("difficulty", e.target.value as Difficulty)}
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
          >
            <option value="Fácil">Fácil</option>
            <option value="Médio">Médio</option>
            <option value="Difícil">Difícil</option>
            <option value="Extremo">Extremo</option>
          </select>
        </Field>
        <Field label="Categoria"><Input value={data.category} onChange={(e) => set("category", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="XP"><Input type="number" value={data.xp} onChange={(e) => set("xp", e.target.value)} /></Field>
        <Field label="Deadline (data/hora)"><Input type="datetime-local" value={data.deadline} onChange={(e) => set("deadline", e.target.value)} /></Field>
      </div>
      <Field label="Descrição"><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={3} /></Field>
      <label className="flex items-center gap-2 pt-2">
        <Switch checked={data.isActive} onCheckedChange={(v) => set("isActive", v)} />
        <span className="text-sm">Desafio ativo</span>
      </label>
    </div>
  );
};

const AchievementForm = ({ data, onChange }: { data: AchievementFormState; onChange: (d: AchievementFormState) => void }) => {
  const set = <K extends keyof AchievementFormState>(k: K, v: AchievementFormState[K]) =>
    onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Código *"><Input value={data.code} onChange={(e) => set("code", e.target.value)} placeholder="ex: first_waypoint" /></Field>
        <Field label="Ícone (emoji)"><Input value={data.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🏆" /></Field>
      </div>
      <Field label="Nome *"><Input value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Recompensa XP"><Input type="number" value={data.xpReward} onChange={(e) => set("xpReward", e.target.value)} /></Field>
        <Field label="Categoria"><Input value={data.category} onChange={(e) => set("category", e.target.value)} /></Field>
      </div>
      <Field label="Descrição"><Textarea value={data.description} onChange={(e) => set("description", e.target.value)} rows={2} /></Field>
    </div>
  );
};

export default Admin;
