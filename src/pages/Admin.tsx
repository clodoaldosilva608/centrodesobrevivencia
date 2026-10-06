/**
 * Admin.tsx — Painel administrativo completo.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │ [logo] PAINEL ADMIN | user@email  [Ver site] [Sair] │   top bar (h-14)
 *   ├──────────┬──────────────────────────────────────────┤
 *   │ 👥 Users │                                          │
 *   │ 📦 Prods │            CONTENT AREA                  │
 *   │ 📚 Ebooks│            (scrollable)                  │
 *   │ 🎮 Games │                                          │
 *   │ 🏆 Chall │                                          │
 *   │ ⭐ Achiev│                                          │
 *   │ 📁 Categ │                                          │
 *   │ 📊 Stats │                                          │
 *   └──────────┘                                          │
 *      sidebar (w-14 mobile / w-48 desktop)
 *
 * Cada seção é um componente independente com próprio estado,
 * dialogs e handlers. Todas as operações Supabase são diretas
 * (sem wrappers em catalog.ts / admin-catalog.ts).
 */

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Package,
  BookOpen,
  Gamepad2,
  Trophy,
  Star,
  FolderTree,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  ExternalLink,
  LogOut,
  X,
  Link2,
  GraduationCap,
  PlayCircle,
  Clock,
} from "lucide-react";
import { COURSES } from "@/data/courses";
import { useAppSetting } from "@/hooks/useAppSetting";

// ─── Tipos ───────────────────────────────────────────────────────────────────

type SectionKey =
  | "users"
  | "products"
  | "ebooks"
  | "games"
  | "challenges"
  | "achievements"
  | "categories"
  | "courses"
  | "system";

type Difficulty = "Fácil" | "Médio" | "Difícil" | "Extremo";
type CategoryType = "product" | "ebook" | "game" | "challenge";

interface UserRow {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  is_admin: boolean;
  created_at: string;
}

interface UserFormState {
  id: string;
  full_name: string;
  username: string;
  is_admin: boolean;
  xp: number;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  full_description: string | null;
  benefits: string[] | null;
  price: string | null;
  image: string | null;
  specs: string[] | null;
  buy_link: string | null;
  affiliate_network: string | null;
  rating: number;
  in_stock: boolean;
  featured: boolean;
  sort_order: number;
}

interface ProductFormState {
  name: string;
  slug: string;
  category: string;
  description: string;
  full_description: string;
  price: string;
  image: string;
  specs: string;
  benefits: string;
  buy_link: string;
  affiliate_network: string;
  in_stock: boolean;
  featured: boolean;
}

interface EbookRow {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  description: string | null;
  synopsis: string | null;
  pages: number | null;
  category: string | null;
  image: string | null;
  pdf_url: string | null;
  price: string | null;
  is_free: boolean;
}

interface EbookFormState {
  title: string;
  slug: string;
  author: string;
  description: string;
  synopsis: string;
  pages: string;
  category: string;
  image: string;
  pdf_url: string;
  is_free: boolean;
}

interface GameRow {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  description: string | null;
  mechanic: string | null;
  objective: string | null;
  image: string | null;
  is_active: boolean;
}

interface GameFormState {
  name: string;
  slug: string;
  category: string;
  description: string;
  mechanic: string;
  objective: string;
  image: string;
  is_active: boolean;
}

interface ChallengeRow {
  id: string;
  title: string;
  description: string | null;
  difficulty: Difficulty | null;
  category: string | null;
  xp: number;
  deadline: string | null;
  is_active: boolean;
}

interface ChallengeFormState {
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  xp: string;
  deadline: string;
  is_active: boolean;
}

interface AchievementRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  xp_reward: number;
  category: string | null;
}

interface AchievementFormState {
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: string;
  category: string;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  description: string | null;
  created_at: string;
}

interface CategoryFormState {
  name: string;
  slug: string;
  type: CategoryType;
  description: string;
}

interface ActivityLogRow {
  id: string;
  user_id: string;
  activity_type: string;
  description: string | null;
  xp_awarded: number;
  metadata: unknown;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(s);
  }
}

function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(s);
  }
}

function toDatetimeLocal(s: string | null | undefined): string {
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function splitLines(s: string): string[] {
  return (s ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function initials(name: string): string {
  return (
    (name ?? "")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function toInt(v: string, fallback = 0): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? fallback : n;
}

// ─── UI primitives ───────────────────────────────────────────────────────────

function Loader({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
      <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="flex-1 text-sm leading-relaxed">{message}</div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="h-7 shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Repetir
        </Button>
      )}
    </div>
  );
}

function EmptyState({ message = "Nenhum item encontrado" }: { message?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-sm">
      {message}
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

function Toolbar({
  search,
  setSearch,
  onRefresh,
  onCreate,
  placeholder,
  createLabel,
}: {
  search: string;
  setSearch: (v: string) => void;
  onRefresh: () => void;
  onCreate: () => void;
  placeholder: string;
  createLabel: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between mb-4">
      <div className="relative w-full sm:max-w-xs">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-9 h-9"
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="h-9"
          title="Recarregar"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="sr-only">Recarregar</span>
        </Button>
        <Button size="sm" onClick={onCreate} className="h-9">
          <Plus className="h-3.5 w-3.5 mr-1" /> {createLabel}
        </Button>
      </div>
    </div>
  );
}

function ConfirmDelete({
  open,
  onClose,
  onConfirm,
  message,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" /> Confirmar exclusão
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SwitchField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="pr-3">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function ThumbImage({ src, alt, size = 40 }: { src: string | null; alt: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) {
    return (
      <div
        className="rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium shrink-0"
        style={{ width: size, height: size }}
      >
        {initials(alt).slice(0, 1) || "•"}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-md object-cover shrink-0 border"
      style={{ width: size, height: size }}
    />
  );
}

function AvatarThumb({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <div
        className="rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ width: 32, height: 32 }}
      >
        {initials(name)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-full object-cover shrink-0 border"
      style={{ width: 32, height: 32 }}
    />
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`text-left font-medium text-xs uppercase text-muted-foreground tracking-wide px-3 py-2.5 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}

function RowActions({
  onEdit,
  onDelete,
  editDisabled,
  deleteDisabled,
  editTitle,
  deleteTitle,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  editTitle?: string;
  deleteTitle?: string;
}) {
  return (
    <div className="flex gap-1 justify-end">
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onEdit}
        disabled={editDisabled}
        title={editTitle ?? "Editar"}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="sr-only">Editar</span>
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
        onClick={onDelete}
        disabled={deleteDisabled}
        title={deleteTitle ?? "Excluir"}
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="sr-only">Excluir</span>
      </Button>
    </div>
  );
}

// ─── Difficulty / status badges ─────────────────────────────────────────────

function DifficultyBadge({ d }: { d: Difficulty | null }) {
  if (!d) return <span className="text-muted-foreground">—</span>;
  const styles: Record<Difficulty, string> = {
    "Fácil": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    "Médio": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    "Difícil": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
    "Extremo": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[d]}`}>
      {d}
    </span>
  );
}

function CategoryTypeBadge({ t }: { t: CategoryType }) {
  const map: Record<CategoryType, { label: string; cls: string }> = {
    product: { label: "Produto", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" },
    ebook: { label: "E-book", cls: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" },
    game: { label: "Jogo", cls: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200" },
    challenge: { label: "Desafio", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  };
  const cfg = map[t];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function NetworkBadge({ n }: { n: string | null }) {
  if (!n) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="outline" className="text-[10px] uppercase">{n}</Badge>;
}

// ─── 1. Usuários ────────────────────────────────────────────────────────────

const emptyUserForm: UserFormState = {
  id: "",
  full_name: "",
  username: "",
  is_admin: false,
  xp: 0,
};

function UsersSection({
  onCountsChanged,
  currentUserId,
}: {
  onCountsChanged?: () => void;
  currentUserId?: string;
}) {
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, email, avatar_url, xp, level, is_admin, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Erro ao listar usuários: ${error.message}`);
      setItems((data ?? []) as UserRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setForm({
      id: u.id,
      full_name: u.full_name ?? "",
      username: u.username ?? "",
      is_admin: u.is_admin,
      xp: u.xp ?? 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyUserForm);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim() || null,
          username: form.username.trim() || null,
          is_admin: form.is_admin,
          xp: Number(form.xp) || 0,
        })
        .eq("id", form.id);
      if (error) throw new Error(`Erro ao salvar usuário: ${error.message}`);
      toast.success("Usuário atualizado com sucesso");
      closeDialog();
      await load();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      // Primeiro exclui o profile; auth.users deve ser excluído via admin SQL/edge function
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw new Error(`Erro ao excluir usuário: ${error.message}`);
      toast.success("Usuário excluído");
      setConfirmDelete(null);
      await load();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Usuários"
        description="Gerencie contas, permissões de admin e XP dos usuários."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={() => {
          toast.info("Criação de usuários é feita pelo fluxo de cadastro do app");
        }}
        placeholder="Buscar por nome, username, e-mail..."
        createLabel="Convidar"
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando usuários..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Usuário</Th>
              <Th>E-mail</Th>
              <Th>Admin</Th>
              <Th className="text-right">XP</Th>
              <Th className="text-right">Nível</Th>
              <Th>Criado em</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const isSelf = currentUserId === u.id;
              const name = u.full_name || u.username || "—";
              return (
                <tr key={u.id} className="border-t hover:bg-muted/20">
                  <Td>
                    <div className="flex items-center gap-2">
                      <AvatarThumb src={u.avatar_url} name={name} />
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[180px]">{name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          @{u.username ?? "—"}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{u.email ?? "—"}</Td>
                  <Td>
                    {u.is_admin ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 hover:bg-emerald-100">
                        Admin
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </Td>
                  <Td className="text-right font-mono">{u.xp ?? 0}</Td>
                  <Td className="text-right font-mono">{u.level ?? 0}</Td>
                  <Td className="text-muted-foreground">{formatDate(u.created_at)}</Td>
                  <Td>
                    <RowActions
                      onEdit={() => openEdit(u)}
                      onDelete={() => setConfirmDelete(u)}
                      deleteDisabled={isSelf}
                      editDisabled={false}
                      deleteTitle={isSelf ? "Não é possível excluir sua própria conta" : "Excluir"}
                    />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Nome completo" full>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ex.: João da Silva"
              />
            </Field>
            <Field label="Username">
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="joaosilva"
              />
            </Field>
            <Field label="XP">
              <Input
                type="number"
                value={String(form.xp)}
                onChange={(e) => setForm({ ...form, xp: toInt(e.target.value) })}
                placeholder="0"
              />
            </Field>
            <div className="sm:col-span-2">
              <SwitchField
                label="Administrador"
                description="Concede acesso ao painel administrativo"
                checked={form.is_admin}
                onChange={(v) => setForm({ ...form, is_admin: v })}
                disabled={currentUserId === editing?.id}
              />
              {currentUserId === editing?.id && (
                <p className="text-xs text-amber-600 mt-1.5">
                  Não é possível remover o próprio privilégio de admin.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir o usuário ${confirmDelete.full_name || confirmDelete.email || confirmDelete.id}? Esta ação remove o perfil do banco. A conta de autenticação pode precisar ser removida separadamente.`
            : ""
        }
      />
    </div>
  );
}

// ─── 2. Produtos ───────────────────────────────────────────────────────────

const emptyProductForm: ProductFormState = {
  name: "",
  slug: "",
  category: "",
  description: "",
  full_description: "",
  price: "",
  image: "",
  specs: "",
  benefits: "",
  buy_link: "",
  affiliate_network: "amazon",
  in_stock: true,
  featured: false,
};

const NETWORK_OPTIONS: { value: string; label: string }[] = [
  { value: "amazon", label: "Amazon" },
  { value: "mercadolivre", label: "Mercado Livre" },
  { value: "aliexpress", label: "AliExpress" },
  { value: "shopee", label: "Shopee" },
  { value: "magalu", label: "Magalu" },
  { value: "other", label: "Outro" },
];

function ProductsSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Importação por link
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [savingImport, setSavingImport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw new Error(`Erro ao listar produtos: ${error.message}`);
      setItems((data ?? []) as ProductRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-slug from name
  useEffect(() => {
    if (!dialogOpen) return;
    if (slugEdited) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, dialogOpen, slugEdited]);

  const filtered = items.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.slug ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProductForm);
    setSlugEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      category: p.category ?? "",
      description: p.description ?? "",
      full_description: p.full_description ?? "",
      price: p.price ?? "",
      image: p.image ?? "",
      specs: Array.isArray(p.specs) ? p.specs.join("\n") : "",
      benefits: Array.isArray(p.benefits) ? p.benefits.join("\n") : "",
      buy_link: p.buy_link ?? "",
      affiliate_network: p.affiliate_network ?? "amazon",
      in_stock: p.in_stock ?? false,
      featured: p.featured ?? false,
    });
    setSlugEdited(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyProductForm);
    setSlugEdited(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }
    const slug = slugify(form.slug) || slugify(form.name);
    if (!slug) {
      toast.error("Slug inválido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug,
        name: form.name.trim(),
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        full_description: form.full_description.trim() || null,
        price: form.price.trim() || null,
        image: form.image.trim() || null,
        specs: splitLines(form.specs),
        benefits: splitLines(form.benefits),
        buy_link: form.buy_link.trim() || null,
        affiliate_network: form.affiliate_network || null,
        in_stock: form.in_stock,
        featured: form.featured,
        sort_order: editing?.sort_order ?? 0,
        rating: editing?.rating ?? 0,
      };
      const { data, error } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw new Error(`Erro ao salvar produto: ${error.message}`);
      const next = editing
        ? items.map((p) => (p.id === (data as ProductRow).id ? (data as ProductRow) : p))
        : [...items, data as ProductRow];
      setItems(next);
      toast.success(editing ? "Produto atualizado" : "Produto criado");
      closeDialog();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("slug", confirmDelete.slug);
      if (error) throw new Error(`Erro ao excluir produto: ${error.message}`);
      setItems(items.filter((p) => p.id !== confirmDelete.id));
      toast.success("Produto excluído");
      setConfirmDelete(null);
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Importação por link ───
  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    setImportedProducts([]);
    try {
      const res = await fetch("/api/import-ml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail || "Erro ao importar");
      if (!data.products || data.products.length === 0) {
        throw new Error("Nenhum produto encontrado neste link.");
      }
      setImportedProducts(data.products);
      toast.success(`${data.products.length} produtos encontrados!`);
    } catch (e) {
      setImportError((e as Error).message);
      toast.error("Erro ao importar: " + (e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const handleSaveImported = async () => {
    setSavingImport(true);
    let saved = 0;
    let failed = 0;
    for (const p of importedProducts) {
      try {
        const slug = slugify(p.title || `produto-ml-${Date.now()}-${saved}`);
        const { error: upsertError } = await supabase
          .from("products")
          .upsert({
            slug,
            name: p.title || "Produto importado",
            category: p.category || "Importados",
            description: p.title || "",
            full_description: p.title || "",
            price: p.price || "",
            image: p.image || "",
            buy_link: p.buyLink || p.url || "",
            affiliate_network: "mercadolivre",
            in_stock: true,
            featured: false,
          }, { onConflict: "slug" });
        if (upsertError) throw upsertError;
        saved++;
      } catch {
        failed++;
      }
    }
    toast.success(`${saved} produtos importados!${failed > 0 ? ` (${failed} falharam)` : ""}`);
    setSavingImport(false);
    setImportOpen(false);
    setImportedProducts([]);
    setImportUrl("");
    load();
    onCountsChanged?.();
  };

  return (
    <div>
      <SectionHeader
        title="Produtos"
        description="Catálogo de equipamentos com links de afiliado."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={openCreate}
        placeholder="Buscar por nome, slug, categoria..."
        createLabel="Novo produto"
      />
      {/* Botão de importação por link */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setImportOpen(true); setImportError(null); setImportedProducts([]); }}
          className="gap-2"
        >
          <Link2 size={14} /> Importar por link (Mercado Livre)
        </Button>
      </div>
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando produtos..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Imagem</Th>
              <Th>Nome</Th>
              <Th>Categoria</Th>
              <Th className="text-right">Preço</Th>
              <Th>Rede</Th>
              <Th>Estoque</Th>
              <Th>Destaque</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/20">
                <Td>
                  <ThumbImage src={p.image} alt={p.name} size={40} />
                </Td>
                <Td>
                  <div className="font-medium truncate max-w-[220px]">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                    /{p.slug}
                  </div>
                </Td>
                <Td className="text-muted-foreground">{p.category ?? "—"}</Td>
                <Td className="text-right font-mono">{p.price ?? "—"}</Td>
                <Td>
                  <NetworkBadge n={p.affiliate_network} />
                </Td>
                <Td>
                  {p.in_stock ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Em estoque
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Esgotado</Badge>
                  )}
                </Td>
                <Td>
                  {p.featured ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      ★ Destaque
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(p)}
                    onDelete={() => setConfirmDelete(p)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <Field label="Nome" full>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Canivete Suíço Multifuncional"
              />
            </Field>
            <Field label="Slug" hint="Usado na URL (auto-gerado do nome)">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                placeholder="canivete-suico"
              />
            </Field>
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Cutelaria"
              />
            </Field>
            <Field label="Preço" hint="Texto livre (ex.: R$ 89,90)">
              <Input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="R$ 89,90"
              />
            </Field>
            <Field label="Imagem (URL)" full>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label="Descrição curta" full>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Resumo de 1-2 frases para o card"
              />
            </Field>
            <Field label="Descrição completa" full>
              <Textarea
                value={form.full_description}
                onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                rows={4}
                placeholder="Texto exibido na página de detalhes"
              />
            </Field>
            <Field label="Especificações (uma por linha)" full>
              <Textarea
                value={form.specs}
                onChange={(e) => setForm({ ...form, specs: e.target.value })}
                rows={4}
                placeholder={"Comprimento: 9 cm\nPeso: 80 g\nAço inoxidável"}
              />
            </Field>
            <Field label="Benefícios (um por linha)" full>
              <Textarea
                value={form.benefits}
                onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                rows={4}
                placeholder={"Compacto\nDurável\nMultiuso"}
              />
            </Field>
            <Field label="Link de compra (URL)" full>
              <Input
                value={form.buy_link}
                onChange={(e) => setForm({ ...form, buy_link: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label="Rede de afiliados">
              <NativeSelect
                value={form.affiliate_network}
                onChange={(v) => setForm({ ...form, affiliate_network: v })}
                options={NETWORK_OPTIONS}
              />
            </Field>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SwitchField
                label="Em estoque"
                description="Disponível para compra"
                checked={form.in_stock}
                onChange={(v) => setForm({ ...form, in_stock: v })}
              />
              <SwitchField
                label="Destaque"
                description="Exibir na home e em listagens destacadas"
                checked={form.featured}
                onChange={(v) => setForm({ ...form, featured: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir "${confirmDelete.name}" (slug: ${confirmDelete.slug})? Esta ação não pode ser desfeita.`
            : ""
        }
      />

      {/* Dialog de Importação por Link */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar produtos por link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole um link de lista de produtos do Mercado Livre (ex: meli.la/xxx) e a aplicação
              extrairá todos os produtos automaticamente.
            </p>
            <div className="flex gap-2">
              <Input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://meli.la/..."
                className="flex-1"
              />
              <Button onClick={handleImport} disabled={importing || !importUrl.trim()}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {importing ? "Buscando..." : "Buscar"}
              </Button>
            </div>
            {importError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/40 text-sm text-destructive">
                {importError}
              </div>
            )}
            {importedProducts.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <p className="text-sm font-medium text-foreground">
                  {importedProducts.length} produtos encontrados:
                </p>
                {importedProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    {p.image && (
                      <img src={p.image} alt="" className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{p.title}</p>
                      {p.price && <p className="text-xs text-muted-foreground">{p.price}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px]">ML</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveImported}
              disabled={savingImport || importedProducts.length === 0}
            >
              {savingImport ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Salvar {importedProducts.length > 0 ? `${importedProducts.length} ` : ""}produtos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── 3. E-books ─────────────────────────────────────────────────────────────

const emptyEbookForm: EbookFormState = {
  title: "",
  slug: "",
  author: "",
  description: "",
  synopsis: "",
  pages: "0",
  category: "",
  image: "",
  pdf_url: "",
  is_free: false,
};

function EbooksSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<EbookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EbookRow | null>(null);
  const [form, setForm] = useState<EbookFormState>(emptyEbookForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EbookRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("ebooks")
        .select("*")
        .order("title");
      if (error) throw new Error(`Erro ao listar e-books: ${error.message}`);
      setItems((data ?? []) as EbookRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (slugEdited) return;
    setForm((f) => ({ ...f, slug: slugify(f.title) }));
  }, [form.title, dialogOpen, slugEdited]);

  const filtered = items.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (e.title ?? "").toLowerCase().includes(q) ||
      (e.slug ?? "").toLowerCase().includes(q) ||
      (e.author ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEbookForm);
    setSlugEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (e: EbookRow) => {
    setEditing(e);
    setForm({
      title: e.title ?? "",
      slug: e.slug ?? "",
      author: e.author ?? "",
      description: e.description ?? "",
      synopsis: e.synopsis ?? "",
      pages: e.pages != null ? String(e.pages) : "0",
      category: e.category ?? "",
      image: e.image ?? "",
      pdf_url: e.pdf_url ?? "",
      is_free: e.is_free ?? false,
    });
    setSlugEdited(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyEbookForm);
    setSlugEdited(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o título do e-book");
      return;
    }
    const slug = slugify(form.slug) || slugify(form.title);
    if (!slug) {
      toast.error("Slug inválido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug,
        title: form.title.trim(),
        author: form.author.trim() || null,
        description: form.description.trim() || null,
        synopsis: form.synopsis.trim() || null,
        pages: form.pages.trim() ? toInt(form.pages) : null,
        category: form.category.trim() || null,
        image: form.image.trim() || null,
        pdf_url: form.pdf_url.trim() || null,
        is_free: form.is_free,
      };
      const { data, error } = await supabase
        .from("ebooks")
        .upsert(payload, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw new Error(`Erro ao salvar e-book: ${error.message}`);
      const next = editing
        ? items.map((e) => (e.id === (data as EbookRow).id ? (data as EbookRow) : e))
        : [...items, data as EbookRow];
      setItems(next);
      toast.success(editing ? "E-book atualizado" : "E-book criado");
      closeDialog();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("ebooks")
        .delete()
        .eq("slug", confirmDelete.slug);
      if (error) throw new Error(`Erro ao excluir e-book: ${error.message}`);
      setItems(items.filter((e) => e.id !== confirmDelete.id));
      toast.success("E-book excluído");
      setConfirmDelete(null);
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="E-books"
        description="Biblioteca de publicações e manuais digitais."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={openCreate}
        placeholder="Buscar por título, slug, autor..."
        createLabel="Novo e-book"
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando e-books..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Capa</Th>
              <Th>Título</Th>
              <Th>Autor</Th>
              <Th>Categoria</Th>
              <Th className="text-right">Páginas</Th>
              <Th>Gratuito</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-t hover:bg-muted/20">
                <Td>
                  <ThumbImage src={e.image} alt={e.title} size={40} />
                </Td>
                <Td>
                  <div className="font-medium truncate max-w-[220px]">{e.title}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                    /{e.slug}
                  </div>
                </Td>
                <Td className="text-muted-foreground">{e.author ?? "—"}</Td>
                <Td className="text-muted-foreground">{e.category ?? "—"}</Td>
                <Td className="text-right font-mono">{e.pages ?? "—"}</Td>
                <Td>
                  {e.is_free ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Gratuito
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">Pago</span>
                  )}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(e)}
                    onDelete={() => setConfirmDelete(e)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar e-book" : "Novo e-book"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <Field label="Título" full>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Manual de Sobrevivência Urbana"
              />
            </Field>
            <Field label="Slug" hint="Usado na URL (auto-gerado do título)">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                placeholder="manual-sobrevivencia-urbana"
              />
            </Field>
            <Field label="Autor">
              <Input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Ex.: João Sobrevivente"
              />
            </Field>
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Manual"
              />
            </Field>
            <Field label="Páginas">
              <Input
                type="number"
                value={form.pages}
                onChange={(e) => setForm({ ...form, pages: e.target.value })}
                placeholder="0"
              />
            </Field>
            <Field label="Capa (URL)" full>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label="PDF (URL)" full>
              <Input
                value={form.pdf_url}
                onChange={(e) => setForm({ ...form, pdf_url: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label="Descrição curta" full>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Resumo exibido no card"
              />
            </Field>
            <Field label="Sinopse" full>
              <Textarea
                value={form.synopsis}
                onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                rows={4}
                placeholder="Texto exibido na página de detalhes"
              />
            </Field>
            <div className="sm:col-span-2">
              <SwitchField
                label="Gratuito"
                description="Disponibiliza o PDF para download sem custo"
                checked={form.is_free}
                onChange={(v) => setForm({ ...form, is_free: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir o e-book "${confirmDelete.title}" (slug: ${confirmDelete.slug})?`
            : ""
        }
      />
    </div>
  );
}

// ─── 4. Jogos ───────────────────────────────────────────────────────────────

const emptyGameForm: GameFormState = {
  name: "",
  slug: "",
  category: "",
  description: "",
  mechanic: "",
  objective: "",
  image: "",
  is_active: true,
};

function GamesSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GameRow | null>(null);
  const [form, setForm] = useState<GameFormState>(emptyGameForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<GameRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("name");
      if (error) throw new Error(`Erro ao listar jogos: ${error.message}`);
      setItems((data ?? []) as GameRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (slugEdited) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, dialogOpen, slugEdited]);

  const filtered = items.filter((g) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (g.name ?? "").toLowerCase().includes(q) ||
      (g.slug ?? "").toLowerCase().includes(q) ||
      (g.category ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyGameForm);
    setSlugEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (g: GameRow) => {
    setEditing(g);
    setForm({
      name: g.name ?? "",
      slug: g.slug ?? "",
      category: g.category ?? "",
      description: g.description ?? "",
      mechanic: g.mechanic ?? "",
      objective: g.objective ?? "",
      image: g.image ?? "",
      is_active: g.is_active ?? false,
    });
    setSlugEdited(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyGameForm);
    setSlugEdited(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome do jogo");
      return;
    }
    const slug = slugify(form.slug) || slugify(form.name);
    if (!slug) {
      toast.error("Slug inválido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug,
        name: form.name.trim(),
        category: form.category.trim() || null,
        description: form.description.trim() || null,
        mechanic: form.mechanic.trim() || null,
        objective: form.objective.trim() || null,
        image: form.image.trim() || null,
        is_active: form.is_active,
      };
      const { data, error } = await supabase
        .from("games")
        .upsert(payload, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw new Error(`Erro ao salvar jogo: ${error.message}`);
      const next = editing
        ? items.map((g) => (g.id === (data as GameRow).id ? (data as GameRow) : g))
        : [...items, data as GameRow];
      setItems(next);
      toast.success(editing ? "Jogo atualizado" : "Jogo criado");
      closeDialog();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("games")
        .delete()
        .eq("slug", confirmDelete.slug);
      if (error) throw new Error(`Erro ao excluir jogo: ${error.message}`);
      setItems(items.filter((g) => g.id !== confirmDelete.id));
      toast.success("Jogo excluído");
      setConfirmDelete(null);
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Jogos"
        description="Jogos educativos de treinamento de sobrevivência."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={openCreate}
        placeholder="Buscar por nome, slug, categoria..."
        createLabel="Novo jogo"
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando jogos..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Imagem</Th>
              <Th>Nome</Th>
              <Th>Categoria</Th>
              <Th>Ativo</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-t hover:bg-muted/20">
                <Td>
                  <ThumbImage src={g.image} alt={g.name} size={40} />
                </Td>
                <Td>
                  <div className="font-medium truncate max-w-[220px]">{g.name}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                    /{g.slug}
                  </div>
                </Td>
                <Td className="text-muted-foreground">{g.category ?? "—"}</Td>
                <Td>
                  {g.is_active ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(g)}
                    onDelete={() => setConfirmDelete(g)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar jogo" : "Novo jogo"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <Field label="Nome" full>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Bússola Virtual"
              />
            </Field>
            <Field label="Slug" hint="Usado na URL (auto-gerado do nome)">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                placeholder="bussola-virtual"
              />
            </Field>
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Navegação"
              />
            </Field>
            <Field label="Imagem (URL)" full>
              <Input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <Field label="Descrição curta" full>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Resumo exibido no card"
              />
            </Field>
            <Field label="Mecânica" full hint="Como o jogo funciona">
              <Textarea
                value={form.mechanic}
                onChange={(e) => setForm({ ...form, mechanic: e.target.value })}
                rows={3}
                placeholder="O jogador interage..."
              />
            </Field>
            <Field label="Objetivo" full>
              <Textarea
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                rows={3}
                placeholder="O que o jogador precisa alcançar"
              />
            </Field>
            <div className="sm:col-span-2">
              <SwitchField
                label="Ativo"
                description="Exibir o jogo na lista pública"
                checked={form.is_active}
                onChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir o jogo "${confirmDelete.name}" (slug: ${confirmDelete.slug})?`
            : ""
        }
      />
    </div>
  );
}

// ─── 5. Desafios ────────────────────────────────────────────────────────────

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "Fácil", label: "Fácil" },
  { value: "Médio", label: "Médio" },
  { value: "Difícil", label: "Difícil" },
  { value: "Extremo", label: "Extremo" },
];

const emptyChallengeForm: ChallengeFormState = {
  title: "",
  description: "",
  difficulty: "Fácil",
  category: "",
  xp: "10",
  deadline: "",
  is_active: true,
};

function ChallengesSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChallengeRow | null>(null);
  const [form, setForm] = useState<ChallengeFormState>(emptyChallengeForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ChallengeRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Erro ao listar desafios: ${error.message}`);
      setItems((data ?? []) as ChallengeRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.title ?? "").toLowerCase().includes(q) ||
      (c.category ?? "").toLowerCase().includes(q) ||
      (c.difficulty ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyChallengeForm);
    setDialogOpen(true);
  };

  const openEdit = (c: ChallengeRow) => {
    setEditing(c);
    setForm({
      title: c.title ?? "",
      description: c.description ?? "",
      difficulty: c.difficulty ?? "Fácil",
      category: c.category ?? "",
      xp: c.xp != null ? String(c.xp) : "0",
      deadline: toDatetimeLocal(c.deadline),
      is_active: c.is_active ?? false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyChallengeForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Informe o título do desafio");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        difficulty: form.difficulty,
        category: form.category.trim() || null,
        xp: toInt(form.xp, 0),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        is_active: form.is_active,
      };
      if (editing) payload.id = editing.id;
      const { data, error } = await supabase
        .from("challenges")
        .upsert(payload)
        .select()
        .single();
      if (error) throw new Error(`Erro ao salvar desafio: ${error.message}`);
      const newRow = data as ChallengeRow;
      const next = editing
        ? items.map((c) => (c.id === newRow.id ? newRow : c))
        : [newRow, ...items];
      setItems(next);
      toast.success(editing ? "Desafio atualizado" : "Desafio criado");
      closeDialog();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw new Error(`Erro ao excluir desafio: ${error.message}`);
      setItems(items.filter((c) => c.id !== confirmDelete.id));
      toast.success("Desafio excluído");
      setConfirmDelete(null);
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Desafios"
        description="Missões diárias e semanais com recompensas em XP."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={openCreate}
        placeholder="Buscar por título, categoria, dificuldade..."
        createLabel="Novo desafio"
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando desafios..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Título</Th>
              <Th>Dificuldade</Th>
              <Th>Categoria</Th>
              <Th className="text-right">XP</Th>
              <Th>Prazo</Th>
              <Th>Ativo</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/20">
                <Td>
                  <div className="font-medium truncate max-w-[240px]">{c.title}</div>
                </Td>
                <Td>
                  <DifficultyBadge d={c.difficulty} />
                </Td>
                <Td className="text-muted-foreground">{c.category ?? "—"}</Td>
                <Td className="text-right font-mono">{c.xp ?? 0}</Td>
                <Td className="text-muted-foreground">{formatDateTime(c.deadline)}</Td>
                <Td>
                  {c.is_active ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(c)}
                    onDelete={() => setConfirmDelete(c)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar desafio" : "Novo desafio"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <Field label="Título" full>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex.: Identifique 5 plantas comestíveis"
              />
            </Field>
            <Field label="Descrição" full>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Instruções do desafio"
              />
            </Field>
            <Field label="Dificuldade">
              <NativeSelect
                value={form.difficulty}
                onChange={(v) => setForm({ ...form, difficulty: v as Difficulty })}
                options={DIFFICULTY_OPTIONS}
              />
            </Field>
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Botânica"
              />
            </Field>
            <Field label="XP">
              <Input
                type="number"
                value={form.xp}
                onChange={(e) => setForm({ ...form, xp: e.target.value })}
                placeholder="10"
              />
            </Field>
            <Field label="Prazo (data e hora)">
              <Input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <SwitchField
                label="Ativo"
                description="Disponibiliza o desafio para os usuários"
                checked={form.is_active}
                onChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir o desafio "${confirmDelete.title}"?`
            : ""
        }
      />
    </div>
  );
}

// ─── 6. Conquistas ──────────────────────────────────────────────────────────

const emptyAchievementForm: AchievementFormState = {
  code: "",
  name: "",
  description: "",
  icon: "",
  xp_reward: "10",
  category: "",
};

function AchievementsSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AchievementRow | null>(null);
  const [form, setForm] = useState<AchievementFormState>(emptyAchievementForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AchievementRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("code");
      if (error) throw new Error(`Erro ao listar conquistas: ${error.message}`);
      setItems((data ?? []) as AchievementRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.code ?? "").toLowerCase().includes(q) ||
      (a.name ?? "").toLowerCase().includes(q) ||
      (a.category ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAchievementForm);
    setDialogOpen(true);
  };

  const openEdit = (a: AchievementRow) => {
    setEditing(a);
    setForm({
      code: a.code ?? "",
      name: a.name ?? "",
      description: a.description ?? "",
      icon: a.icon ?? "",
      xp_reward: a.xp_reward != null ? String(a.xp_reward) : "0",
      category: a.category ?? "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyAchievementForm);
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast.error("Informe o código da conquista");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Informe o nome da conquista");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        xp_reward: toInt(form.xp_reward, 0),
        category: form.category.trim() || null,
      };
      const { data, error } = await supabase
        .from("achievements")
        .upsert(payload, { onConflict: "code" })
        .select()
        .single();
      if (error) throw new Error(`Erro ao salvar conquista: ${error.message}`);
      const newRow = data as AchievementRow;
      const next = editing
        ? items.map((a) => (a.id === newRow.id ? newRow : a))
        : [...items, newRow];
      setItems(next);
      toast.success(editing ? "Conquista atualizada" : "Conquista criada");
      closeDialog();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", confirmDelete.id);
      if (error) throw new Error(`Erro ao excluir conquista: ${error.message}`);
      setItems(items.filter((a) => a.id !== confirmDelete.id));
      toast.success("Conquista excluída");
      setConfirmDelete(null);
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Conquistas"
        description="Definições de medalhas e recompensas em XP."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={openCreate}
        placeholder="Buscar por código, nome, categoria..."
        createLabel="Nova conquista"
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando conquistas..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Código</Th>
              <Th>Ícone</Th>
              <Th>Nome</Th>
              <Th>Categoria</Th>
              <Th className="text-right">XP</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/20">
                <Td>
                  <Badge variant="secondary" className="font-mono">{a.code}</Badge>
                </Td>
                <Td>
                  <span className="text-lg" aria-hidden>
                    {a.icon ?? "•"}
                  </span>
                </Td>
                <Td>
                  <div className="font-medium truncate max-w-[220px]">{a.name}</div>
                  {a.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[280px]">
                      {a.description}
                    </div>
                  )}
                </Td>
                <Td className="text-muted-foreground">{a.category ?? "—"}</Td>
                <Td className="text-right font-mono">{a.xp_reward ?? 0}</Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(a)}
                    onDelete={() => setConfirmDelete(a)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conquista" : "Nova conquista"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <Field label="Código" hint="Identificador único (ex.: FIRST_STEPS)">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="FIRST_STEPS"
                className="font-mono"
              />
            </Field>
            <Field label="Ícone" hint="Emoji ou nome de ícone lucide">
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🎯"
              />
            </Field>
            <Field label="Nome" full>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Primeiros Passos"
              />
            </Field>
            <Field label="Descrição" full>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Como o usuário desbloqueia"
              />
            </Field>
            <Field label="Recompensa em XP">
              <Input
                type="number"
                value={form.xp_reward}
                onChange={(e) => setForm({ ...form, xp_reward: e.target.value })}
                placeholder="10"
              />
            </Field>
            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ex.: Onboarding"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir a conquista "${confirmDelete.name}" (${confirmDelete.code})?`
            : ""
        }
      />
    </div>
  );
}

// ─── 7. Categorias ──────────────────────────────────────────────────────────

const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: "product", label: "Produto" },
  { value: "ebook", label: "E-book" },
  { value: "game", label: "Jogo" },
  { value: "challenge", label: "Desafio" },
];

const emptyCategoryForm: CategoryFormState = {
  name: "",
  slug: "",
  type: "product",
  description: "",
};

function CategoriesSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<CategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw new Error(`Erro ao listar categorias: ${error.message}`);
      setItems((data ?? []) as CategoryRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (slugEdited) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, dialogOpen, slugEdited]);

  const filtered = items.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.slug ?? "").toLowerCase().includes(q) ||
      (c.type ?? "").toLowerCase().includes(q)
    );
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCategoryForm);
    setSlugEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryRow) => {
    setEditing(c);
    setForm({
      name: c.name ?? "",
      slug: c.slug ?? "",
      type: c.type ?? "product",
      description: c.description ?? "",
    });
    setSlugEdited(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyCategoryForm);
    setSlugEdited(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    const slug = slugify(form.slug) || slugify(form.name);
    if (!slug) {
      toast.error("Slug inválido");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug,
        type: form.type,
        description: form.description.trim() || null,
      };
      const { data, error } = await supabase
        .from("categories")
        .upsert(payload, { onConflict: "slug" })
        .select()
        .single();
      if (error) throw new Error(`Erro ao salvar categoria: ${error.message}`);
      const newRow = data as CategoryRow;
      const next = editing
        ? items.map((c) => (c.id === newRow.id ? newRow : c))
        : [...items, newRow];
      setItems(next);
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
      closeDialog();
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("slug", confirmDelete.slug);
      if (error) throw new Error(`Erro ao excluir categoria: ${error.message}`);
      setItems(items.filter((c) => c.id !== confirmDelete.id));
      toast.success("Categoria excluída");
      setConfirmDelete(null);
      onCountsChanged?.();
    } catch (e) {
      toast.error((e as Error).message);
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Categorias"
        description="Taxonomia compartilhada entre produtos, e-books, jogos e desafios."
      />
      <Toolbar
        search={search}
        setSearch={setSearch}
        onRefresh={load}
        onCreate={openCreate}
        placeholder="Buscar por nome, slug, tipo..."
        createLabel="Nova categoria"
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {loading ? (
        <Loader label="Carregando categorias..." />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Nome</Th>
              <Th>Slug</Th>
              <Th>Tipo</Th>
              <Th>Descrição</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/20">
                <Td>
                  <div className="font-medium truncate max-w-[200px]">{c.name}</div>
                </Td>
                <Td>
                  <code className="text-xs text-muted-foreground">/{c.slug}</code>
                </Td>
                <Td>
                  <CategoryTypeBadge t={c.type} />
                </Td>
                <Td>
                  <div className="text-muted-foreground truncate max-w-[300px]">
                    {c.description ?? "—"}
                  </div>
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(c)}
                    onDelete={() => setConfirmDelete(c)}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Nome" full>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Cutelaria"
              />
            </Field>
            <Field label="Slug" hint="Usado na URL (auto-gerado do nome)">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm({ ...form, slug: e.target.value });
                }}
                placeholder="cutelaria"
              />
            </Field>
            <Field label="Tipo">
              <NativeSelect
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v as CategoryType })}
                options={CATEGORY_TYPE_OPTIONS}
              />
            </Field>
            <Field label="Descrição" full>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Opcional"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDelete
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        busy={deleting}
        message={
          confirmDelete
            ? `Excluir a categoria "${confirmDelete.name}" (slug: ${confirmDelete.slug})?`
            : ""
        }
      />
    </div>
  );
}

// ─── 8. Sistema (stats + activity log) ──────────────────────────────────────

interface StatItem {
  key: string;
  label: string;
  value: number;
  loading: boolean;
}

function SystemSection() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [activities, setActivities] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tables = [
        "profiles",
        "products",
        "ebooks",
        "games",
        "challenges",
        "achievements",
        "categories",
        "waypoints",
        "routes",
        "activity_log",
      ];
      const labels: Record<string, string> = {
        profiles: "Usuários",
        products: "Produtos",
        ebooks: "E-books",
        games: "Jogos",
        challenges: "Desafios",
        achievements: "Conquistas",
        categories: "Categorias",
        waypoints: "Waypoints",
        routes: "Rotas",
        activity_log: "Logs de Atividade",
      };

      const countResults = await Promise.all(
        tables.map(async (t) => {
          try {
            const { count, error } = await supabase
              .from(t)
              .select("*", { count: "exact", head: true });
            if (error) {
              return { key: t, value: 0, loading: false, error: error.message };
            }
            return { key: t, value: count ?? 0, loading: false };
          } catch (e) {
            return { key: t, value: 0, loading: false, error: (e as Error).message };
          }
        })
      );

      setStats(
        countResults.map((r) => ({
          key: r.key,
          label: labels[r.key] ?? r.key,
          value: r.value,
          loading: r.loading,
        }))
      );

      // Activity log (últimos 200)
      const { data: logData, error: logError } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (logError) {
        throw new Error(`Erro ao carregar log de atividade: ${logError.message}`);
      }
      setActivities((logData ?? []) as ActivityLogRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activityTypes = Array.from(
    new Set(activities.map((a) => a.activity_type).filter(Boolean))
  ).sort();

  const filtered = filter
    ? activities.filter((a) => a.activity_type === filter)
    : activities;

  return (
    <div>
      <SectionHeader
        title="Sistema"
        description="Visão geral do banco de dados e auditoria de atividades."
      />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Contagens
        </h3>
        <Button variant="outline" size="sm" onClick={load} className="h-9">
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="sr-only">Recarregar</span>
        </Button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.length === 0 && loading ? (
          <div className="col-span-full">
            <Loader label="Carregando estatísticas..." />
          </div>
        ) : (
          stats.map((s) => (
            <Card key={s.key}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {s.label}
                </div>
                <div className="text-2xl font-semibold mt-1 font-mono">
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 truncate">
                  {s.key}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Log de Atividade
        </h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="act-filter" className="text-xs text-muted-foreground">
            Filtrar por tipo:
          </Label>
          <select
            id="act-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Todos</option>
            {activityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader label="Carregando log..." />
      ) : filtered.length === 0 ? (
        <EmptyState message="Nenhuma atividade registrada" />
      ) : (
        <TableShell>
          <thead className="bg-muted/40">
            <tr>
              <Th>Data / Hora</Th>
              <Th>User ID</Th>
              <Th>Tipo</Th>
              <Th>Descrição</Th>
              <Th className="text-right">XP</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/20">
                <Td className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(a.created_at)}
                </Td>
                <Td>
                  <code className="text-xs text-muted-foreground">
                    {a.user_id?.slice(0, 8) ?? "—"}…
                  </code>
                </Td>
                <Td>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {a.activity_type ?? "—"}
                  </Badge>
                </Td>
                <Td>
                  <div className="text-muted-foreground truncate max-w-[400px]">
                    {a.description ?? "—"}
                  </div>
                </Td>
                <Td className="text-right font-mono">{a.xp_awarded ?? 0}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

// ─── Courses Section ──────────────────────────────────────────────────────────

interface LessonRow {
  id: string;
  course_id: string;
  lesson_index: number;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number;
  is_preview: boolean;
  updated_at: string;
  channel_name?: string | null;
  channel_url?: string | null;
}

interface EnrollmentRow {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_lessons: number[];
  last_lesson_index: number;
  last_accessed_at: string | null;
  profile?: { full_name: string | null; email: string | null } | null;
}

function CoursesSection({ onCountsChanged }: { onCountsChanged?: () => void }) {
  const [activeTab, setActiveTab] = useState<"lessons" | "enrollments" | "migration" | "prices" | "purchases" | "channels">("lessons");
  const [selectedCourse, setSelectedCourse] = useState<string>(COURSES[0]?.id ?? "");
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [prices, setPrices] = useState<{ course_id: string; price_cents: number; promo_price_cents: number | null; is_active: boolean; currency: string }[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [editing, setEditing] = useState<LessonRow | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  const [savingSetting, setSavingSetting] = useState(false);

  // Setting toggle: courses_landing_status (coming_soon | live)
  const {
    value: landingStatus,
    loading: loadingLanding,
    setValue: setLandingStatus,
    reload: reloadLanding,
  } = useAppSetting<"coming_soon" | "live">("courses_landing_status", "coming_soon");

  const isLandingLive = landingStatus === "live";

  const toggleLandingStatus = async () => {
    setSavingSetting(true);
    const next = isLandingLive ? "coming_soon" : "live";
    const result = await setLandingStatus(next);
    setSavingSetting(false);
    if (result.ok) {
      toast.success(
        next === "live"
          ? "Landing page ATIVADA — 'Matrículas abertas'"
          : "Landing page DESATIVADA — 'Em breve'"
      );
      reloadLanding();
    } else {
      toast.error(`Erro: ${result.error}`);
    }
  };

  // Setting toggle: ebooks_download_enabled ('true' | 'false')
  const {
    value: ebooksDownloadValue,
    loading: loadingEbooksDownload,
    setValue: setEbooksDownload,
    reload: reloadEbooksDownload,
  } = useAppSetting<"true" | "false">("ebooks_download_enabled", "false");

  const canDownloadEbooks = ebooksDownloadValue === "true";

  const toggleEbooksDownload = async () => {
    setSavingSetting(true);
    const next = canDownloadEbooks ? "false" : "true";
    const result = await setEbooksDownload(next);
    setSavingSetting(false);
    if (result.ok) {
      toast.success(
        next === "true"
          ? "Download de e-books ATIVADO — botão 'Baixar PDF' visível"
          : "Download de e-books DESATIVADO — somente leitura na plataforma"
      );
      reloadEbooksDownload();
    } else {
      toast.error(`Erro: ${result.error}`);
    }
  };

  // Load lessons for selected course
  const loadLessons = useCallback(async (courseId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("lesson_index", { ascending: true });
      if (error) {
        setEnabled(false);
        setLessons([]);
      } else {
        setEnabled(true);
        setLessons((data as LessonRow[]) ?? []);
      }
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all enrollments (admin can see all via RLS)
  const loadEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .order("enrolled_at", { ascending: false })
        .limit(200);
      if (error) {
        setEnabled(false);
        setEnrollments([]);
      } else {
        // Enrich with profile data
        const userIds = Array.from(new Set((data ?? []).map((e: any) => e.user_id)));
        const profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", userIds);
          (profiles ?? []).forEach((p: any) => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
        const enriched: EnrollmentRow[] = (data ?? []).map((e: any) => ({
          ...e,
          profile: profilesMap[e.user_id] ?? null,
        }));
        setEnrollments(enriched);
        setEnabled(true);
      }
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all course prices
  const loadPrices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_prices")
        .select("*")
        .order("course_id");
      if (error) {
        setEnabled(false);
        setPrices([]);
      } else {
        setEnabled(true);
        setPrices(data ?? []);
      }
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all purchases (admin only)
  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("course_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        setEnabled(false);
        setPurchases([]);
      } else {
        setEnabled(true);
        setPurchases(data ?? []);
      }
    } catch {
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save price (upsert)
  const savePrice = async (courseId: string, priceCents: number, promoPriceCents: number | null, isActive: boolean) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      const { error } = await supabase
        .from("course_prices")
        .upsert({
          course_id: courseId,
          price_cents: priceCents,
          promo_price_cents: promoPriceCents,
          is_active: isActive,
          currency: "BRL",
          updated_by: userId,
        });
      if (error) throw error;
      toast.success("Preço salvo!");
      setEditingPrice(null);
      loadPrices();
      onCountsChanged?.();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === "lessons") loadLessons(selectedCourse);
    else if (activeTab === "enrollments") loadEnrollments();
    else if (activeTab === "prices") loadPrices();
    else if (activeTab === "purchases") loadPurchases();
    else if (activeTab === "channels") loadLessons(selectedCourse);
  }, [activeTab, selectedCourse, loadLessons, loadEnrollments, loadPrices, loadPurchases]);

  // Save lesson (create or update)
  const saveLesson = async (form: Partial<LessonRow> & { course_id: string; lesson_index: number }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      if (form.id) {
        const { error } = await supabase
          .from("course_lessons")
          .update({
            title: form.title,
            description: form.description,
            video_url: form.video_url,
            duration_minutes: form.duration_minutes ?? 0,
            is_preview: form.is_preview ?? false,
            updated_by: userId,
          })
          .eq("id", form.id);
        if (error) throw error;
        toast.success("Lição atualizada!");
      } else {
        const { error } = await supabase
          .from("course_lessons")
          .insert({
            course_id: form.course_id,
            lesson_index: form.lesson_index,
            title: form.title,
            description: form.description ?? null,
            video_url: form.video_url,
            duration_minutes: form.duration_minutes ?? 0,
            is_preview: form.is_preview ?? false,
            updated_by: userId,
          });
        if (error) throw error;
        toast.success("Lição criada!");
      }
      setEditing(null);
      loadLessons(selectedCourse);
      onCountsChanged?.();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Excluir esta lição?")) return;
    try {
      const { error } = await supabase.from("course_lessons").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lição excluída");
      loadLessons(selectedCourse);
      onCountsChanged?.();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  };

  const deleteEnrollment = async (id: string) => {
    if (!confirm("Remover esta matrícula?")) return;
    try {
      const { error } = await supabase.from("course_enrollments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Matrícula removida");
      loadEnrollments();
      onCountsChanged?.();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  };

  const selectedCourseObj = COURSES.find((c) => c.id === selectedCourse);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Cursos"
        subtitle="Gerencie vídeo-aulas, matrículas e progresso dos alunos"
        icon={GraduationCap}
        right={
          <button
            onClick={() => setShowMigration(!showMigration)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <AlertCircle size={12} /> {showMigration ? "Ocultar" : "Ver"} instruções de setup
          </button>
        }
      />

      {/* Migration help banner */}
      {showMigration && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
          <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-2 flex items-center gap-2">
            <AlertCircle size={14} className="text-primary" /> Configuração do banco
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Para habilitar matrículas e vídeo-aulas, rode o script SQL no Supabase:
          </p>
          <ol className="text-xs text-foreground/80 space-y-1 mb-3 list-decimal ml-5">
            <li>Acesse <a href="https://supabase.com/project/mbterwktxczsyevcudoz/sql/new" target="_blank" rel="noreferrer" className="text-primary hover:underline">Supabase SQL Editor</a></li>
            <li>Cole o conteúdo do arquivo <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">scripts/sql/courses_migration.sql</code></li>
            <li>Clique em "Run" (Ctrl+Enter)</li>
            <li>Recarregue esta página — as abas "Lições" e "Matrículas" ficarão ativas</li>
          </ol>
          <p className="text-[11px] text-muted-foreground">
            Sem migration, as páginas públicas de curso e a página Meus Cursos mostram "Em breve".
          </p>
        </div>
      )}

      {/* Landing toggle — controla badge "Em breve" / "Matrículas abertas" */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-1 flex items-center gap-2">
              <GraduationCap size={14} className="text-primary" /> Status da landing page
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Controla o que a seção "Cursos em Destaque" da home mostra.
              Em <strong>"Em breve"</strong>, badges âmbar aparecem nos cards.
              Em <strong>"Matrículas abertas"</strong>, badges esmeralda aparecem e o CTA vira primary.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loadingLanding ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                    isLandingLive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {isLandingLive ? "● Matrículas abertas" : "● Em breve"}
                </span>
                <Button
                  onClick={toggleLandingStatus}
                  disabled={savingSetting}
                  size="sm"
                  variant={isLandingLive ? "outline" : "default"}
                  className="gap-1 text-xs h-8"
                >
                  {savingSetting ? (
                    <><Loader2 size={12} className="animate-spin" /> Salvando...</>
                  ) : isLandingLive ? (
                    "Desativar"
                  ) : (
                    "Ativar matrículas"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* E-books download toggle — controla botão "Baixar PDF" vs "Somente leitura" */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-1 flex items-center gap-2">
              <BookOpen size={14} className="text-primary" /> E-books — modo de leitura
            </h3>
            <p className="text-xs text-muted-foreground max-w-xl">
              Controla como os usuários interagem com os e-books nas páginas de detalhe.
              Em <strong>"Somente leitura"</strong>, apenas o botão "Ler E-book Agora" aparece (leitura via iframe na plataforma).
              Em <strong>"Download liberado"</strong>, botão "Baixar PDF" adicional aparece.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loadingEbooksDownload ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <span
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                    canDownloadEbooks
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {canDownloadEbooks ? "● Download liberado" : "● Somente leitura"}
                </span>
                <Button
                  onClick={toggleEbooksDownload}
                  disabled={savingSetting}
                  size="sm"
                  variant={canDownloadEbooks ? "outline" : "default"}
                  className="gap-1 text-xs h-8"
                >
                  {savingSetting ? (
                    <><Loader2 size={12} className="animate-spin" /> Salvando...</>
                  ) : canDownloadEbooks ? (
                    "Bloquear download"
                  ) : (
                    "Liberar download"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("lessons")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === "lessons" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lições
        </button>
        <button
          onClick={() => setActiveTab("enrollments")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === "enrollments" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Matrículas
        </button>
        <button
          onClick={() => setActiveTab("prices")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === "prices" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Preços
        </button>
        <button
          onClick={() => setActiveTab("purchases")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === "purchases" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Compras
        </button>
        <button
          onClick={() => setActiveTab("channels")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wider transition-colors ${
            activeTab === "channels" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Canais
        </button>
      </div>

      {/* Lessons tab */}
      {activeTab === "lessons" && (
        <div className="space-y-4">
          {/* Course selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-1.5 text-sm text-foreground"
            >
              {COURSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLessons(selectedCourse)}
              className="gap-1 text-xs h-8"
            >
              <RefreshCw size={12} /> Recarregar
            </Button>
          </div>

          {!enabled && !loading && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <AlertCircle size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Tabela course_lessons não existe ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Veja as instruções de setup acima para rodar a migration SQL.
              </p>
            </div>
          )}

          {enabled && !loading && selectedCourseObj && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">
                  {lessons.length} de {selectedCourseObj.lessons.length} lições cadastradas
                </p>
                <Button
                  size="sm"
                  onClick={() =>
                    setEditing({
                      id: "",
                      course_id: selectedCourse,
                      lesson_index: lessons.length,
                      title: selectedCourseObj.lessons[lessons.length] ?? `Lição ${lessons.length + 1}`,
                      description: null,
                      video_url: "",
                      duration_minutes: 0,
                      is_preview: false,
                      updated_at: new Date().toISOString(),
                    })
                  }
                  className="gap-1 text-xs h-8"
                  disabled={lessons.length >= selectedCourseObj.lessons.length}
                >
                  <Plus size={12} /> Nova lição
                </Button>
              </div>

              <TableShell>
                <thead>
                  <tr className="border-b border-border">
                    <Th>#</Th>
                    <Th>Título</Th>
                    <Th>URL do vídeo</Th>
                    <Th>Duração</Th>
                    <Th>Preview</Th>
                    <Th>Ações</Th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l, i) => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-xs">{i + 1}</td>
                      <td className="p-3 text-sm text-foreground">{l.title}</td>
                      <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                        <a href={l.video_url} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                          <ExternalLink size={10} /> {l.video_url}
                        </a>
                      </td>
                      <td className="p-3 text-xs flex items-center gap-1 mt-3">
                        <Clock size={10} /> {l.duration_minutes} min
                      </td>
                      <td className="p-3">
                        {l.is_preview ? (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Grátis</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditing(l)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                            <Pencil size={12} className="text-foreground" />
                          </button>
                          <button onClick={() => deleteLesson(l.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Excluir">
                            <Trash2 size={12} className="text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>

              {lessons.length === 0 && <EmptyState message="Nenhuma lição cadastrada ainda. Clique em 'Nova lição'." />}
            </>
          )}

          {loading && <Loader label="Carregando lições..." />}
        </div>
      )}

      {/* Enrollments tab */}
      {activeTab === "enrollments" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadEnrollments} className="gap-1 text-xs h-8">
              <RefreshCw size={12} /> Recarregar
            </Button>
            <span className="text-xs text-muted-foreground">{enrollments.length} matrículas</span>
          </div>

          {!enabled && !loading && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <AlertCircle size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Tabela course_enrollments não existe ainda</p>
              <p className="text-xs text-muted-foreground mt-1">
                Veja as instruções de setup acima para rodar a migration SQL.
              </p>
            </div>
          )}

          {enabled && !loading && (
            <TableShell>
              <thead>
                <tr className="border-b border-border">
                  <Th>Aluno</Th>
                  <Th>Curso</Th>
                  <Th>Matriculado em</Th>
                  <Th>Progresso</Th>
                  <Th>Último acesso</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((e) => {
                  const course = COURSES.find((c) => c.id === e.course_id);
                  const totalLessons = course?.lessons.length ?? 0;
                  const completed = Array.isArray(e.completed_lessons) ? e.completed_lessons.length : 0;
                  const pct = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
                  return (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-sm text-foreground">
                        {e.profile?.full_name ?? "—"}
                        <div className="text-[10px] text-muted-foreground">{e.profile?.email ?? e.user_id.slice(0, 8)}</div>
                      </td>
                      <td className="p-3 text-sm text-foreground">{course?.title ?? e.course_id}</td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(e.enrolled_at)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-primary">{pct}%</span>
                          <span className="text-[10px] text-muted-foreground">{completed}/{totalLessons}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {e.last_accessed_at ? formatDate(e.last_accessed_at) : "—"}
                      </td>
                      <td className="p-3">
                        <button onClick={() => deleteEnrollment(e.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Remover matrícula">
                          <Trash2 size={12} className="text-destructive" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}

          {enabled && !loading && enrollments.length === 0 && (
            <EmptyState message="Nenhuma matrícula ainda. Quando alunos se matricularem, aparecem aqui." />
          )}

          {loading && <Loader label="Carregando matrículas..." />}
        </div>
      )}

      {/* Prices tab — CRUD para course_prices */}
      {activeTab === "prices" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadPrices} className="gap-1 text-xs h-8">
              <RefreshCw size={12} /> Recarregar
            </Button>
            <span className="text-xs text-muted-foreground">
              {prices.length} preços cadastrados · 11 cursos no catálogo
            </span>
          </div>

          {!enabled && !loading && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <AlertCircle size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Tabela course_prices não existe</p>
              <p className="text-xs text-muted-foreground mt-1">
                Veja as instruções de setup no topo desta seção.
              </p>
            </div>
          )}

          {enabled && !loading && (
            <TableShell>
              <thead>
                <tr className="border-b border-border">
                  <Th>Curso</Th>
                  <Th>Preço</Th>
                  <Th>Promo</Th>
                  <Th>Status</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>
              <tbody>
                {COURSES.map((c) => {
                  const p = prices.find((pr) => pr.course_id === c.id);
                  return (
                    <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-sm text-foreground">
                        {c.title}
                        <div className="text-[10px] text-muted-foreground">{c.id}</div>
                      </td>
                      <td className="p-3 text-sm text-foreground font-mono">
                        {p ? formatBRL(p.price_cents) : "—"}
                      </td>
                      <td className="p-3 text-sm text-foreground font-mono">
                        {p?.promo_price_cents ? formatBRL(p.promo_price_cents) : "—"}
                      </td>
                      <td className="p-3">
                        {p?.is_active ? (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Ativo</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Inativo</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button onClick={() => setEditingPrice(c.id)} className="p-1.5 rounded hover:bg-muted" title="Editar preço">
                          <Pencil size={12} className="text-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}
          {loading && <Loader label="Carregando preços..." />}

          {editingPrice && (
            <PriceEditDialog
              courseId={editingPrice}
              currentPrice={prices.find((p) => p.course_id === editingPrice)}
              onCancel={() => setEditingPrice(null)}
              onSave={savePrice}
            />
          )}
        </div>
      )}

      {/* Purchases tab — histórico de compras */}
      {activeTab === "purchases" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={loadPurchases} className="gap-1 text-xs h-8">
              <RefreshCw size={12} /> Recarregar
            </Button>
            <span className="text-xs text-muted-foreground">{purchases.length} compras</span>
          </div>

          {!enabled && !loading && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <AlertCircle size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Tabela course_purchases não existe</p>
              <p className="text-xs text-muted-foreground mt-1">
                Veja as instruções de setup no topo desta seção.
              </p>
            </div>
          )}

          {enabled && !loading && (
            <TableShell>
              <thead>
                <tr className="border-b border-border">
                  <Th>Cliente</Th>
                  <Th>Curso</Th>
                  <Th>Valor</Th>
                  <Th>Status</Th>
                  <Th>Criado</Th>
                  <Th>Pago em</Th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => {
                  const course = COURSES.find((c) => c.id === p.course_id);
                  return (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-sm text-foreground">
                        {p.customer_name || "—"}
                        <div className="text-[10px] text-muted-foreground">{p.customer_email || p.user_id.slice(0, 8)}</div>
                      </td>
                      <td className="p-3 text-sm text-foreground">{course?.title || p.course_id}</td>
                      <td className="p-3 text-sm font-mono">{formatBRL(p.amount_cents)}</td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          p.status === 'paid' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                          p.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                          p.status === 'expired' ? 'bg-muted text-muted-foreground' :
                          'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}>
                          {p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status === 'expired' ? 'Expirado' : p.status === 'refunded' ? 'Estornado' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{formatDate(p.created_at)}</td>
                      <td className="p-3 text-xs text-muted-foreground">{p.paid_at ? formatDate(p.paid_at) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}

          {enabled && !loading && purchases.length === 0 && (
            <EmptyState message="Nenhuma compra ainda. Quando clientes pagarem, aparecem aqui." />
          )}

          {loading && <Loader label="Carregando compras..." />}
        </div>
      )}

      {/* Channels tab — info de canal YouTube por lição */}
      {activeTab === "channels" && (
        <div className="space-y-4">
          {/* Course selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Curso:</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-1.5 text-sm text-foreground"
            >
              {COURSES.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLessons(selectedCourse)}
              className="gap-1 text-xs h-8"
            >
              <RefreshCw size={12} /> Recarregar
            </Button>
          </div>

          {!enabled && !loading && (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
              <AlertCircle size={28} className="mx-auto text-primary mb-2" />
              <p className="text-sm font-medium text-foreground">Tabela course_lessons não existe</p>
            </div>
          )}

          {enabled && !loading && (
            <>
              <p className="text-xs text-muted-foreground">
                {lessons.length} lições cadastradas · {lessons.filter((l) => l.channel_name).length} com canal identificado
              </p>
              <TableShell>
                <thead>
                  <tr className="border-b border-border">
                    <Th>#</Th>
                    <Th>Título</Th>
                    <Th>Canal do YouTube</Th>
                    <Th>Vídeo URL</Th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l, i) => (
                    <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3 text-xs">{i + 1}</td>
                      <td className="p-3 text-sm text-foreground">{l.title}</td>
                      <td className="p-3 text-sm">
                        {l.channel_url ? (
                          <a href={l.channel_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink size={10} /> {l.channel_name || "Ver canal"}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">{l.channel_name || "—"}</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                        <a href={l.video_url} target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                          <ExternalLink size={10} /> {l.video_url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
              {lessons.length === 0 && <EmptyState message="Nenhuma lição cadastrada neste curso." />}
            </>
          )}
          {loading && <Loader label="Carregando canais..." />}
        </div>
      )}

      {/* Edit/Create dialog */}
      {editing && (
        <LessonEditDialog
          lesson={editing}
          onCancel={() => setEditing(null)}
          onSave={saveLesson}
        />
      )}
    </div>
  );
}

function LessonEditDialog({
  lesson,
  onCancel,
  onSave,
}: {
  lesson: Partial<LessonRow> & { course_id: string; lesson_index: number };
  onCancel: () => void;
  onSave: (form: Partial<LessonRow> & { course_id: string; lesson_index: number }) => void;
}) {
  const [form, setForm] = useState({
    id: lesson.id ?? "",
    course_id: lesson.course_id,
    lesson_index: lesson.lesson_index,
    title: lesson.title ?? "",
    description: lesson.description ?? "",
    video_url: lesson.video_url ?? "",
    duration_minutes: lesson.duration_minutes ?? 0,
    is_preview: lesson.is_preview ?? false,
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar lição" : "Nova lição"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Título">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="URL do vídeo (YouTube, Vimeo ou MP4)">
            <Input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </Field>
          <Field label="Descrição (opcional)">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração (min)">
              <Input
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: toInt(e.target.value, 0) })}
              />
            </Field>
            <SwitchField
              label="Lição grátis (preview)"
              checked={form.is_preview}
              onChange={(v) => setForm({ ...form, is_preview: v })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.title.trim() || !form.video_url.trim()}
          >
            {form.id ? "Salvar alterações" : "Criar lição"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PriceEditDialog({
  courseId,
  currentPrice,
  onCancel,
  onSave,
}: {
  courseId: string;
  currentPrice?: { price_cents: number; promo_price_cents: number | null; is_active: boolean };
  onCancel: () => void;
  onSave: (courseId: string, priceCents: number, promoPriceCents: number | null, isActive: boolean) => void;
}) {
  const course = COURSES.find((c) => c.id === courseId);
  const [priceReais, setPriceReais] = useState<string>(
    currentPrice ? (currentPrice.price_cents / 100).toFixed(2).replace(".", ",") : "97,00"
  );
  const [promoReais, setPromoReais] = useState<string>(
    currentPrice?.promo_price_cents ? (currentPrice.promo_price_cents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [isActive, setIsActive] = useState(currentPrice?.is_active ?? true);

  const parseCents = (s: string): number => {
    if (!s.trim()) return 0;
    // aceita "97,00" ou "97.00" ou "97"
    const normalized = s.replace(/\./g, "").replace(/,/g, ".");
    const val = parseFloat(normalized);
    if (isNaN(val)) return 0;
    return Math.round(val * 100);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar preço — {course?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Field label="Preço (R$)">
            <Input
              value={priceReais}
              onChange={(e) => setPriceReais(e.target.value)}
              placeholder="97,00"
            />
          </Field>
          <Field label="Preço promocional (opcional)">
            <Input
              value={promoReais}
              onChange={(e) => setPromoReais(e.target.value)}
              placeholder="47,00"
            />
          </Field>
          <SwitchField label="Curso à venda (ativo)" checked={isActive} onChange={setIsActive} />
          <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
            Valor final: <strong className="text-foreground font-mono">
              R$ {(parseCents(promoReais) || parseCents(priceReais) || 0) / 100}
            </strong>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button
            onClick={() => onSave(courseId, parseCents(priceReais), promoReais.trim() ? parseCents(promoReais) : null, isActive)}
          >
            Salvar preço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// helper BRL formatting (usado em várias tabs)
function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

interface SidebarItem {
  key: SectionKey;
  label: string;
  short: string;
  icon: React.ElementType;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "users", label: "Usuários", short: "Users", icon: Users },
  { key: "products", label: "Produtos", short: "Prods", icon: Package },
  { key: "ebooks", label: "E-books", short: "Ebooks", icon: BookOpen },
  { key: "games", label: "Jogos", short: "Games", icon: Gamepad2 },
  { key: "challenges", label: "Desafios", short: "Chall", icon: Trophy },
  { key: "achievements", label: "Conquistas", short: "Achiev", icon: Star },
  { key: "categories", label: "Categorias", short: "Categ", icon: FolderTree },
  { key: "courses", label: "Cursos", short: "Cursos", icon: GraduationCap },
  { key: "system", label: "Sistema", short: "Stats", icon: BarChart3 },
];

function Sidebar({
  active,
  onChange,
  counts,
}: {
  active: SectionKey;
  onChange: (k: SectionKey) => void;
  counts: Partial<Record<SectionKey, number>>;
}) {
  return (
    <aside
      className="w-14 md:w-48 shrink-0 border-r bg-card overflow-y-auto"
      aria-label="Navegação do painel"
    >
      <nav className="flex flex-col p-2 gap-1">
        {SIDEBAR_ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          const count = counts[it.key];
          return (
            <button
              key={it.key}
              onClick={() => onChange(it.key)}
              className={`group flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={it.label}
            >
              <Icon className="h-4 w-4 shrink-0 mx-auto md:mx-0" />
              <span className="hidden md:inline flex-1 text-left truncate">
                {it.label}
              </span>
              {count != null && it.key !== "system" && (
                <span
                  className={`hidden md:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:bg-background"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── TopBar ─────────────────────────────────────────────────────────────────

function TopBar({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void | Promise<void>;
}) {
  return (
    <header className="h-14 shrink-0 border-b bg-card flex items-center px-3 sm:px-4 gap-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
          CS
        </div>
        <h1 className="text-sm sm:text-base font-semibold tracking-tight">
          <span className="hidden sm:inline">PAINEL ADMIN</span>
          <span className="sm:hidden">ADMIN</span>
        </h1>
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center text-xs text-muted-foreground truncate max-w-[260px]">
        <span className="truncate">{email}</span>
      </div>

      <Button asChild variant="outline" size="sm" className="h-9">
        <Link to="/" target="_blank" rel="noreferrer">
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">Ver site</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
        onClick={() => onLogout()}
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline ml-1">Sair</span>
      </Button>
    </header>
  );
}

// ─── Admin (default export) ─────────────────────────────────────────────────

export default function Admin() {
  const { user, logout } = useAuth();
  // Mantém o hook useToast referenciado (especificado no bloco de imports).
  // As notificações visíveis são exibidas via sonner (toast.success / toast.error).
  useToast();
  const [active, setActive] = useState<SectionKey>("users");
  const [counts, setCounts] = useState<Partial<Record<SectionKey, number>>>({});

  const reloadCounts = useCallback(async () => {
    try {
      const tables: SectionKey[] = [
        "users",
        "products",
        "ebooks",
        "games",
        "challenges",
        "achievements",
        "categories",
        "courses",
      ];
      const results = await Promise.all(
        tables.map(async (t) => {
          try {
            const { count, error } = await supabase
              .from(t)
              .select("*", { count: "exact", head: true });
            if (error) return [t, 0] as [SectionKey, number];
            return [t, count ?? 0] as [SectionKey, number];
          } catch {
            return [t, 0] as [SectionKey, number];
          }
        })
      );
      const next: Partial<Record<SectionKey, number>> = {};
      for (const [k, v] of results) next[k] = v;
      setCounts(next);
    } catch (e) {
      console.warn("[admin] reloadCounts falhou:", e);
    }
  }, []);

  useEffect(() => {
    reloadCounts();
  }, [reloadCounts]);

  const handleLogout = async () => {
    try {
      await logout();
      // O redirecionamento (rota protegida) cuida do resto.
    } catch (e) {
      toast.error(`Erro ao sair: ${(e as Error).message}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title="Painel Admin — Centro de Sobrevivência"
        description="Gerenciamento administrativo do Centro de Sobrevivência."
        noIndex
      />
      <TopBar email={user?.email ?? ""} onLogout={handleLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={active} onChange={setActive} counts={counts} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {active === "users" && (
            <UsersSection
              onCountsChanged={reloadCounts}
              currentUserId={user?.id}
            />
          )}
          {active === "products" && (
            <ProductsSection onCountsChanged={reloadCounts} />
          )}
          {active === "ebooks" && (
            <EbooksSection onCountsChanged={reloadCounts} />
          )}
          {active === "games" && (
            <GamesSection onCountsChanged={reloadCounts} />
          )}
          {active === "challenges" && (
            <ChallengesSection onCountsChanged={reloadCounts} />
          )}
          {active === "achievements" && (
            <AchievementsSection onCountsChanged={reloadCounts} />
          )}
          {active === "categories" && (
            <CategoriesSection onCountsChanged={reloadCounts} />
          )}
          {active === "courses" && (
            <CoursesSection onCountsChanged={reloadCounts} />
          )}
          {active === "system" && <SystemSection />}
        </main>
      </div>
    </div>
  );
}
