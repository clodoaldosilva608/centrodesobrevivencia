import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Mail, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

const Login = () => {
  const { loginWithGoogle, loginWithEmail, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"choose" | "email">("choose");

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogle = () => {
    loginWithGoogle();
    navigate(from, { replace: true });
  };

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      loginWithEmail(name.trim(), email.trim());
      navigate(from, { replace: true });
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-heading text-2xl tracking-wider uppercase text-foreground">
                Acessar Plataforma
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Faça login para acessar todas as ferramentas de sobrevivência
              </p>
            </div>

            {mode === "choose" ? (
              <div className="space-y-4">
                <Button
                  onClick={handleGoogle}
                  className="w-full h-12 font-heading tracking-wider uppercase text-sm gap-3"
                  variant="outline"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Entrar com Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  onClick={() => setMode("email")}
                  variant="secondary"
                  className="w-full h-12 font-heading tracking-wider uppercase text-sm gap-3"
                >
                  <Mail className="w-5 h-5" />
                  Entrar com E-mail
                </Button>
              </div>
            ) : (
              <form onSubmit={handleEmail} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nome</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome de sobrevivente"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="mt-1"
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 font-heading tracking-wider uppercase text-sm gap-3">
                  <LogIn className="w-5 h-5" />
                  Entrar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode("choose")}
                  className="w-full text-sm"
                >
                  ← Voltar
                </Button>
              </form>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">
              Seus dados ficam salvos localmente no seu dispositivo.
            </p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
