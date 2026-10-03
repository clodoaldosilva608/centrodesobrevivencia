import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "email" | string;
  loginAt: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (name: string, email: string, password?: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const toAppUser = (u: User, profile?: { full_name?: string | null; avatar_url?: string | null; is_admin?: boolean | null; provider?: string | null } | null): AuthUser => ({
  id: u.id,
  name: profile?.full_name || u.user_metadata?.full_name || (u.email ? u.email.split("@")[0] : "Sobrevivente"),
  email: u.email ?? "",
  avatar: profile?.avatar_url || u.user_metadata?.avatar_url || "",
  provider: (profile?.provider as string) || (u.app_metadata?.provider as string) || "email",
  loginAt: u.created_at ?? new Date().toISOString(),
  isAdmin: profile?.is_admin ?? false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega perfil do user (precisa porque auth.users não expõe is_admin via SDK)
  const loadProfile = useCallback(async (u: User): Promise<AuthUser> => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_admin, provider")
        .eq("id", u.id)
        .maybeSingle();
      if (error) console.warn("[auth] loadProfile:", error.message);
      return toAppUser(u, profile);
    } catch (e) {
      console.warn("[auth] loadProfile fallback:", (e as Error).message);
      return toAppUser(u);
    }
  }, []);

  // Bootstrap session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const appUser = await loadProfile(data.session.user);
        if (mounted) setUser(appUser);
      }
      if (mounted) setIsLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        const appUser = await loadProfile(newSession.user);
        setUser(appUser);
        // Bump last_active_date + award XP
        supabase
          .from("profiles")
          .update({ last_active_date: new Date().toISOString().slice(0, 10) })
          .eq("id", newSession.user.id)
          .then(() => {});
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const loginWithGoogle = useCallback(async () => {
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
    // OAuth redireciona o browser; o estado será restaurado onAuthStateChange
  }, []);

  const loginWithEmail = useCallback(async (name: string, email: string, password?: string) => {
    // Para login por senha (caso tenha sido feito signup com senha)
    if (password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return;
    }
    // Magic link (passwordless)
    const redirectTo = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, data: { full_name: name, provider: "email" } },
    });
    if (error) throw error;
  }, []);

  const signupWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const redirectTo = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: name, provider: "email" },
      },
    });
    if (error) throw error;
    // Se confirm email estiver desligado, fica logado imediatamente.
    if (data.session?.user) {
      const appUser = await loadProfile(data.session.user);
      setUser(appUser);
    }
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
