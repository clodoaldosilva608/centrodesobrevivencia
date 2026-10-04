/**
 * Camada de dados admin — operações privilegiadas que só funcionam para
 * usuários com `is_admin = TRUE` (verificado via RLS policies).
 *
 * Diferente do `catalog.ts` (anônimo), estas operações NÃO fazem cache porque
 * representam dados em tempo real (atividade, contagem de usuários, etc.).
 */

import { supabase } from "@/lib/supabase";
import type {
  ProfilesRow, ProfilesUpdate,
  CategoriesRow, CategoriesInsert,
  AchievementsRow, AchievementsInsert,
  ActivityLogRow, UserAchievementsRow,
  UserChallengesRow,
} from "@/lib/supabase-types";

// ─── Users ─────────────────────────────────────────────────────────────────

export interface AdminUserList {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  provider: string | null;
  xp: number;
  level: number;
  streak_days: number;
  is_admin: boolean;
  last_active_date: string | null;
  created_at: string;
  /** counts de relações */
  waypoints_count?: number;
  routes_count?: number;
  achievements_count?: number;
  challenges_completed?: number;
}

export const admin = {
  // ─── Users ──────────────────────────────────────────────────────────────

  async listUsers(opts: { page?: number; perPage?: number; search?: string } = {}): Promise<{ data: AdminUserList[]; total: number }> {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (opts.search) {
      const s = opts.search.trim();
      q = q.or(`email.ilike.%${s}%,full_name.ilike.%${s}%,username.ilike.%${s}%`);
    }

    const { data, error, count } = await q;
    if (error) throw error;

    // Para cada user, buscar contagens (waypoints, routes, achievements)
    const enriched: AdminUserList[] = [];
    for (const u of (data ?? []) as ProfilesRow[]) {
      const [wp, rt, ac, ch] = await Promise.all([
        supabase.from("waypoints").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("routes").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", u.id),
        supabase.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", u.id),
      ]);
      enriched.push({
        ...u,
        waypoints_count: wp.count ?? 0,
        routes_count: rt.count ?? 0,
        achievements_count: ac.count ?? 0,
        challenges_completed: ch.count ?? 0,
      });
    }

    return { data: enriched, total: count ?? 0 };
  },

  async updateUser(id: string, patch: ProfilesUpdate): Promise<ProfilesRow> {
    const { data, error } = await supabase.from("profiles").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async toggleAdmin(id: string, isAdmin: boolean): Promise<{ applied: boolean; currentIsAdmin: boolean }> {
    // Retorna info sobre se a mudança foi realmente aplicada (a trigger BEFORE
    // protect_is_admin pode bloquear auto-demotion ou demotion por não-admin,
    // silenciosamente mantendo OLD.is_admin. Por isso precisamos verificar o
    // valor real no banco após o update para dar feedback correto ao usuário.)
    const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", id);
    if (error) throw error;
    // Verificar o valor real no banco (trigger pode ter revertido)
    const { data: updated, error: e2 } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", id)
      .single();
    if (e2) throw e2;
    const currentIsAdmin = updated?.is_admin ?? false;
    return {
      applied: currentIsAdmin === isAdmin,
      currentIsAdmin,
    };
  },

  async adjustXP(id: string, deltaXP: number): Promise<void> {
    // Primeiro lê o XP atual
    const { data: u, error: e1 } = await supabase.from("profiles").select("xp").eq("id", id).single();
    if (e1) throw e1;
    const newXP = Math.max(0, (u.xp ?? 0) + deltaXP);
    const { error: e2 } = await supabase.from("profiles").update({ xp: newXP }).eq("id", id);
    if (e2) throw e2;
  },

  async deleteUser(id: string): Promise<void> {
    // Deleta o profile; trigger CASCADE remove waypoints, routes, etc.
    // auth.users entry permanece (apenas admin pode remover via Admin API).
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
  },

  // ─── Categories ──────────────────────────────────────────────────────────

  async listCategories(): Promise<CategoriesRow[]> {
    const { data, error } = await supabase.from("categories").select("*").order("type, name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async upsertCategory(c: CategoriesInsert): Promise<CategoriesRow> {
    const { data, error } = await supabase.from("categories").upsert(c, { onConflict: "slug" }).select().single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  // ─── Achievements ────────────────────────────────────────────────────────

  async listAchievements(): Promise<AchievementsRow[]> {
    const { data, error } = await supabase.from("achievements").select("*").order("xp_reward", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async upsertAchievement(a: AchievementsInsert): Promise<AchievementsRow> {
    const { data, error } = await supabase.from("achievements").upsert(a, { onConflict: "code" }).select().single();
    if (error) throw error;
    return data;
  },

  async deleteAchievement(id: string): Promise<void> {
    const { error } = await supabase.from("achievements").delete().eq("id", id);
    if (error) throw error;
  },

  // ─── User Achievements (conquistas desbloqueadas) ─────────────────────────

  async listUserAchievements(userId: string): Promise<(UserAchievementsRow & { achievement?: AchievementsRow })[]> {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as (UserAchievementsRow & { achievement?: AchievementsRow })[];
  },

  async grantAchievement(userId: string, achievementId: string): Promise<void> {
    const { error } = await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
    });
    if (error && !error.message.includes("duplicate")) throw error;
  },

  async revokeAchievement(userId: string, achievementId: string): Promise<void> {
    const { error } = await supabase
      .from("user_achievements")
      .delete()
      .eq("user_id", userId)
      .eq("achievement_id", achievementId);
    if (error) throw error;
  },

  // ─── Activity Log ─────────────────────────────────────────────────────────

  async listActivityLog(opts: { userId?: string; page?: number; perPage?: number; type?: string } = {}): Promise<{ data: ActivityLogRow[]; total: number }> {
    const page = opts.page ?? 1;
    const perPage = opts.perPage ?? 50;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let q = supabase
      .from("activity_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (opts.userId) q = q.eq("user_id", opts.userId);
    if (opts.type) q = q.eq("activity_type", opts.type);

    const { data, error, count } = await q;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  },

  // ─── Stats (dashboard) ───────────────────────────────────────────────────

  async stats(): Promise<{
    users: number;
    products: number;
    ebooks: number;
    games: number;
    challenges: number;
    achievements: number;
    categories: number;
    waypoints: number;
    routes: number;
    activityLog: number;
  }> {
    const tables = ["profiles", "products", "ebooks", "games", "challenges", "achievements", "categories", "waypoints", "routes", "activity_log"];
    const results = await Promise.all(
      tables.map(async (t) => {
        const r = await supabase.from(t).select("id", { count: "exact", head: true });
        return [t, r.count ?? 0] as const;
      })
    );
    const obj = Object.fromEntries(results) as Record<string, number>;
    return {
      users: obj.profiles,
      products: obj.products,
      ebooks: obj.ebooks,
      games: obj.games,
      challenges: obj.challenges,
      achievements: obj.achievements,
      categories: obj.categories,
      waypoints: obj.waypoints,
      routes: obj.routes,
      activityLog: obj.activity_log,
    };
  },

  // ─── Affiliate click tracking ────────────────────────────────────────────

  async logAffiliateClick(opts: {
    userId?: string;
    productId: string;
    productName: string;
    buyLink: string;
    affiliateNetwork?: string | null;
  }): Promise<void> {
    if (!opts.userId) return; // anônimo não rastreamos (RLS exige user_id)
    try {
      await supabase.from("activity_log").insert({
        user_id: opts.userId,
        activity_type: "affiliate_click",
        description: `Clique em produto: ${opts.productName}`,
        xp_awarded: 0,
        metadata: {
          product_id: opts.productId,
          product_name: opts.productName,
          buy_link: opts.buyLink,
          affiliate_network: opts.affiliateNetwork ?? null,
        },
      });
    } catch (e) {
      console.warn("[admin] logAffiliateClick:", (e as Error).message);
    }
  },
};

export default admin;
