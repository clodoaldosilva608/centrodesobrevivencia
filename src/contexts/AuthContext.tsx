import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: "google" | "email";
  loginAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: (name: string, email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = "sh_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }, [user]);

  const loginWithGoogle = useCallback(() => {
    // Simulação local — quando Supabase estiver conectado, usar supabase.auth.signInWithOAuth
    const googleUser: AuthUser = {
      id: crypto.randomUUID(),
      name: "Sobrevivente Google",
      email: "sobrevivente@gmail.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      provider: "google",
      loginAt: new Date().toISOString(),
    };
    setUser(googleUser);
  }, []);

  const loginWithEmail = useCallback((name: string, email: string) => {
    const emailUser: AuthUser = {
      id: crypto.randomUUID(),
      name,
      email,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
      provider: "email",
      loginAt: new Date().toISOString(),
    };
    setUser(emailUser);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginWithGoogle, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
