/**
 * Tipos do banco de dados Supabase.
 *
 * Mantidos em sincronia manualmente com supabase/schema.sql.
 * Para regenerar automaticamente: `supabase gen types --project-id mbterwktxczsyevcudoz`
 * (precisa do Supabase CLI autenticado).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          provider: string | null;
          xp: number;
          level: number;
          streak_days: number;
          last_active_date: string | null;
          is_admin: boolean;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          xp?: number;
          level?: number;
          streak_days?: number;
          last_active_date?: string | null;
          is_admin?: boolean;
          settings?: Json;
        };
        Update: Partial<ProfilesInsert>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: "product" | "ebook" | "game" | "challenge";
          description: string | null;
          created_at: string;
        };
        Insert: Omit<CategoriesRow, "id" | "created_at"> & { id?: string };
        Update: Partial<CategoriesInsert>;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: string | null;
          category_id: string | null;
          description: string | null;
          full_description: string | null;
          benefits: Json;
          price: string | null;
          image: string | null;
          images: Json;
          specs: Json;
          buy_link: string | null;
          affiliate_network: string | null;
          rating: number;
          in_stock: boolean;
          featured: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<ProductsRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
        };
        Update: Partial<ProductsInsert>;
      };
      ebooks: {
        Row: {
          id: string;
          slug: string;
          title: string;
          author: string | null;
          description: string | null;
          synopsis: string | null;
          pages: number | null;
          category: string | null;
          category_id: string | null;
          image: string | null;
          pdf_url: string | null;
          price: string | null;
          is_free: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<EbooksRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<EbooksInsert>;
      };
      games: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: string | null;
          category_id: string | null;
          description: string | null;
          mechanic: string | null;
          objective: string | null;
          image: string | null;
          thumbnail: string | null;
          is_active: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<GamesRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<GamesInsert>;
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          difficulty: "Fácil" | "Médio" | "Difícil" | "Extremo" | null;
          category: string | null;
          xp: number;
          deadline: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<ChallengesRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<ChallengesInsert>;
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon: string | null;
          xp_reward: number;
          category: string | null;
          created_at: string;
        };
        Insert: Omit<AchievementsRow, "id" | "created_at"> & { id?: string };
        Update: Partial<AchievementsInsert>;
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: Partial<UserAchievementsInsert>;
      };
      user_challenges: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          completed_at: string;
          xp_awarded: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          completed_at?: string;
          xp_awarded?: number;
        };
        Update: Partial<UserChallengesInsert>;
      };
      waypoints: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          lat: number;
          lng: number;
          type: string;
          note: string | null;
          color: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          lat: number;
          lng: number;
          type?: string;
          note?: string | null;
          color?: string;
          metadata?: Json;
        };
        Update: Partial<WaypointsInsert>;
      };
      routes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          points: Json;
          elevations: Json;
          distance_km: number | null;
          ascent_m: number | null;
          descent_m: number | null;
          estimated_time_min: number | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          points: Json;
          elevations?: Json;
          distance_km?: number | null;
          ascent_m?: number | null;
          descent_m?: number | null;
          estimated_time_min?: number | null;
          notes?: string | null;
          metadata?: Json;
        };
        Update: Partial<RoutesInsert>;
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          description: string | null;
          xp_awarded: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          description?: string | null;
          xp_awarded?: number;
          metadata?: Json;
        };
        Update: Partial<ActivityLogInsert>;
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_seen_date: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_seen_date?: string | null;
          updated_at?: string;
        };
        Update: Partial<StreaksInsert>;
      };
      daily_missions: {
        Row: {
          id: string;
          user_id: string;
          mission_date: string;
          missions: Json;
          completed_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_date: string;
          missions: Json;
          completed_count?: number;
          created_at?: string;
        };
        Update: Partial<DailyMissionsInsert>;
      };
      course_lessons: {
        Row: {
          id: string;
          course_id: string;
          lesson_index: number;
          title: string;
          description: string | null;
          video_url: string;
          duration_minutes: number;
          is_preview: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          lesson_index: number;
          title: string;
          description?: string | null;
          video_url: string;
          duration_minutes?: number;
          is_preview?: boolean;
          updated_by?: string | null;
        };
        Update: Partial<{
          title: string;
          description: string | null;
          video_url: string;
          duration_minutes: number;
          is_preview: boolean;
          updated_by: string | null;
        }>;
      };
      course_enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          enrolled_at: string;
          completed_lessons: number[];
          last_lesson_index: number;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          enrolled_at?: string;
          completed_lessons?: number[];
          last_lesson_index?: number;
        };
        Update: Partial<{
          completed_lessons: number[];
          last_lesson_index: number;
        }>;
      };
      app_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<{
          value: string;
          description: string | null;
          updated_by: string | null;
        }>;
      };
      course_prices: {
        Row: {
          course_id: string;
          price_cents: number;
          currency: string;
          is_active: boolean;
          promo_price_cents: number | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          course_id: string;
          price_cents: number;
          currency?: string;
          is_active?: boolean;
          promo_price_cents?: number | null;
          updated_by?: string | null;
        };
        Update: Partial<{
          price_cents: number;
          currency: string;
          is_active: boolean;
          promo_price_cents: number | null;
          updated_by: string | null;
        }>;
      };
      course_purchases: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          amount_cents: number;
          currency: string;
          status: "pending" | "paid" | "refunded" | "expired" | "cancelled";
          cakto_charge_id: string | null;
          cakto_payment_url: string | null;
          cakto_pix_qr_code: string | null;
          cakto_pix_qr_image: string | null;
          cakto_raw_response: Json | null;
          created_at: string;
          paid_at: string | null;
          expires_at: string | null;
          customer_name: string | null;
          customer_email: string | null;
          customer_document: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          amount_cents: number;
          currency?: string;
          status?: "pending" | "paid" | "refunded" | "expired" | "cancelled";
          cakto_charge_id?: string | null;
          cakto_payment_url?: string | null;
          cakto_pix_qr_code?: string | null;
          cakto_pix_qr_image?: string | null;
          cakto_raw_response?: Json | null;
          paid_at?: string | null;
          expires_at?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_document?: string | null;
        };
        Update: Partial<{
          status: "pending" | "paid" | "refunded" | "expired" | "cancelled";
          cakto_charge_id: string | null;
          cakto_payment_url: string | null;
          cakto_pix_qr_code: string | null;
          cakto_pix_qr_image: string | null;
          paid_at: string | null;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      mark_lesson_completed: {
        Args: { p_course_id: string; p_lesson_index: number };
        Returns: Database["public"]["Tables"]["course_enrollments"]["Row"];
      };
      is_course_paid: {
        Args: { p_course_id: string };
        Returns: boolean;
      };
      auto_enroll_after_payment: {
        Args: { p_user_id: string; p_course_id: string };
        Returns: void;
      };
    };
    Enums: {
      category_type: "product" | "ebook" | "game" | "challenge";
      challenge_difficulty: "Fácil" | "Médio" | "Difícil" | "Extremo";
    };
  };
}

// Aliases para tipos Row/Insert/Update (referências comuns)
export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfilesInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfilesUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type CategoriesRow = Database["public"]["Tables"]["categories"]["Row"];
export type CategoriesInsert = Database["public"]["Tables"]["categories"]["Insert"];
export type CategoriesUpdate = Database["public"]["Tables"]["categories"]["Update"];

export type ProductsRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductsInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductsUpdate = Database["public"]["Tables"]["products"]["Update"];

export type EbooksRow = Database["public"]["Tables"]["ebooks"]["Row"];
export type EbooksInsert = Database["public"]["Tables"]["ebooks"]["Insert"];
export type EbooksUpdate = Database["public"]["Tables"]["ebooks"]["Update"];

export type GamesRow = Database["public"]["Tables"]["games"]["Row"];
export type GamesInsert = Database["public"]["Tables"]["games"]["Insert"];
export type GamesUpdate = Database["public"]["Tables"]["games"]["Update"];

export type ChallengesRow = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengesInsert = Database["public"]["Tables"]["challenges"]["Insert"];
export type ChallengesUpdate = Database["public"]["Tables"]["challenges"]["Update"];

export type AchievementsRow = Database["public"]["Tables"]["achievements"]["Row"];
export type AchievementsInsert = Database["public"]["Tables"]["achievements"]["Insert"];
export type AchievementsUpdate = Database["public"]["Tables"]["achievements"]["Update"];

export type UserAchievementsRow = Database["public"]["Tables"]["user_achievements"]["Row"];
export type UserAchievementsInsert = Database["public"]["Tables"]["user_achievements"]["Insert"];
export type UserAchievementsUpdate = Database["public"]["Tables"]["user_achievements"]["Update"];

export type UserChallengesRow = Database["public"]["Tables"]["user_challenges"]["Row"];
export type UserChallengesInsert = Database["public"]["Tables"]["user_challenges"]["Insert"];
export type UserChallengesUpdate = Database["public"]["Tables"]["user_challenges"]["Update"];

export type WaypointsRow = Database["public"]["Tables"]["waypoints"]["Row"];
export type WaypointsInsert = Database["public"]["Tables"]["waypoints"]["Insert"];
export type WaypointsUpdate = Database["public"]["Tables"]["waypoints"]["Update"];

export type RoutesRow = Database["public"]["Tables"]["routes"]["Row"];
export type RoutesInsert = Database["public"]["Tables"]["routes"]["Insert"];
export type RoutesUpdate = Database["public"]["Tables"]["routes"]["Update"];

export type ActivityLogRow = Database["public"]["Tables"]["activity_log"]["Row"];
export type ActivityLogInsert = Database["public"]["Tables"]["activity_log"]["Insert"];

export type StreaksRow = Database["public"]["Tables"]["streaks"]["Row"];
export type StreaksInsert = Database["public"]["Tables"]["streaks"]["Insert"];

export type DailyMissionsRow = Database["public"]["Tables"]["daily_missions"]["Row"];
export type DailyMissionsInsert = Database["public"]["Tables"]["daily_missions"]["Insert"];
