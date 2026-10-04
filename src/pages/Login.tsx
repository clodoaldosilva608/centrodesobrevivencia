import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Shield, Mail, LogIn, UserPlus, KeyRound, AlertCircle, CheckCircle2,
  Compass, Mountain, Flame, BookOpen, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import { toast } from "sonner";

type Mode = "choose" | "magic" | "password" | "signup";

const features = [
  { icon: Compass, title: "Bússola Tática", desc: "Acesso ao Manual do Sobrevivente" },
  { icon: Mountain, title: "Mapa Interativo", desc: "GIS tático com waypoints e rotas" },
  { icon: Flame, title: "Simulador", desc: "Cenários de sobrevivência em árvore de decisões" },
  { icon: BookOpen, title: "E-books", desc: "20+ guias de bushcraft e sobrevivência" },
];

const Login = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("choose");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verificando sessão…</p>
        </div>
        <SEO title="Carregando…" description="" />
      </div>
    );
  }

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogle = async () => {
    setError(null); setInfo(null); setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setError(null); setInfo(null); setSubmitting(true);
    try {
      await loginWithEmail(name.trim(), email.trim());
      setInfo("Enviamos um link mágico para " + email.trim() + ". Clique nele para entrar.");
      toast.success("Link mágico enviado!");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Senha precisa ter no mínimo 6 caracteres.");
      return;
    }
    setError(null); setInfo(null); setSubmitting(true);
    try {
      await signupWithEmail(name.trim(), email.trim(), password);
      setInfo("Conta criada! Verifique seu e-mail se solicitada confirmação.");
      toast.success("Conta criada!");
      setTimeout(() => navigate(from, { replace: true }), 800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setError(null); setInfo(null); setSubmitting(true);
    try {
      await loginWithEmail(name.trim(), email.trim(), password);
      toast.success("Login realizado!");
      navigate(from, { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Acessar — Centro de Sobrevivência" description="Entre com Google ou e-mail para acessar todas as ferramentas de sobrevivência." />
      <div className="min-h-screen flex">
        {/* Lado esquerdo — marketing panel (escondido em mobile) */}
        <aside className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-tactical">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 75% 75%, var(--primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
          <div className="relative flex flex-col justify-between p-12 w-full">
            <div>
              <Link to="/" className="flex items-center gap-2">
                <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-lg" />
                <span className="font-heading text-2xl tracking-wider text-gradient-survival">
                  SURVIVAL HUB
                </span>
              </Link>
              <h1 className="font-heading text-4xl text-foreground mt-12 leading-tight">
                Sobrevivência é<br />
                <span className="text-gradient-survival">conhecimento</span>.<br />
                Conhecimento é <span className="text-gradient-survival">poder</span>.
              </h1>
              <p className="text-muted-foreground mt-4 max-w-md">
                Junte-se a milhares de sobrevivencialistas e exploradores.
                Acesse simuladores, mapa tático, e-books, desafios e a visão OSIRIS em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mt-12">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="p-4 rounded-lg bg-card/60 backdrop-blur border border-border"
                >
                  <f.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-medium text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </aside>

        {/* Lado direito — form panel */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md">
            {/* Logo no mobile (visível só em telas pequenas) */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2">
                <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-lg" />
                <span className="font-heading text-xl tracking-wider text-gradient-survival">
                  SURVIVAL HUB
                </span>
              </Link>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border-2 border-primary">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-heading text-xl sm:text-2xl tracking-wider uppercase text-foreground">
                  Acessar Plataforma
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-2 min-h-[2.5em]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={mode}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="block"
                    >
                      {mode === "choose" && "Faça login para acessar todas as ferramentas de sobrevivência"}
                      {mode === "magic" && "Enviaremos um link mágico para você entrar sem senha"}
                      {mode === "password" && "Entre com sua conta de e-mail e senha"}
                      {mode === "signup" && "Crie sua conta de sobrevivente em segundos"}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/40 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{error}</p>
                </div>
              )}
              {info && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">{info}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {mode === "choose" && (
                  <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    <Button
                      onClick={handleGoogle}
                      disabled={submitting}
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
                        <span className="bg-card px-2 text-muted-foreground">ou continue com e-mail</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={() => { setMode("magic"); setError(null); setInfo(null); }} variant="secondary" className="h-14 flex-col gap-1 text-[10px]">
                        <Mail className="w-4 h-4" />
                        Link mágico
                      </Button>
                      <Button onClick={() => { setMode("password"); setError(null); setInfo(null); }} variant="secondary" className="h-14 flex-col gap-1 text-[10px]">
                        <KeyRound className="w-4 h-4" />
                        Com senha
                      </Button>
                      <Button onClick={() => { setMode("signup"); setError(null); setInfo(null); }} variant="secondary" className="h-14 flex-col gap-1 text-[10px]">
                        <UserPlus className="w-4 h-4" />
                        Criar conta
                      </Button>
                    </div>
                  </motion.div>
                )}

                {mode === "magic" && (
                  <motion.form key="magic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleMagic} className="space-y-4" autoComplete="off">
                    <div>
                      <label className="text-sm font-medium text-foreground">Nome</label>
                      <Input name="magic-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome de sobrevivente" className="mt-1" required autoComplete="off" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">E-mail</label>
                      <Input name="magic-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1" required autoComplete="off" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full h-12 font-heading tracking-wider uppercase text-sm gap-3">
                      <Mail className="w-5 h-5" />
                      {submitting ? "Enviando…" : "Enviar link mágico"}
                    </Button>
                    <BackButton onBack={() => setMode("choose")} />
                  </motion.form>
                )}

                {mode === "password" && (
                  <motion.form key="password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handlePassword} className="space-y-4" autoComplete="off">
                    <div>
                      <label className="text-sm font-medium text-foreground">E-mail</label>
                      <Input name="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1" required autoComplete="off" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Senha</label>
                      <Input name="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" required minLength={6} autoComplete="new-password" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full h-12 font-heading tracking-wider uppercase text-sm gap-3">
                      <LogIn className="w-5 h-5" />
                      {submitting ? "Entrando…" : "Entrar"}
                    </Button>
                    <BackButton onBack={() => setMode("choose")} />
                  </motion.form>
                )}

                {mode === "signup" && (
                  <motion.form key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSignup} className="space-y-4" autoComplete="off">
                    <div>
                      <label className="text-sm font-medium text-foreground">Nome</label>
                      <Input name="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome de sobrevivente" className="mt-1" required autoComplete="off" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">E-mail</label>
                      <Input name="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1" required autoComplete="off" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Senha</label>
                      <Input name="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" className="mt-1" required minLength={6} autoComplete="new-password" spellCheck={false} data-lpignore="true" data-1p-ignore />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full h-12 font-heading tracking-wider uppercase text-sm gap-3">
                      <UserPlus className="w-5 h-5" />
                      {submitting ? "Criando…" : "Criar conta"}
                    </Button>
                    <BackButton onBack={() => setMode("choose")} />
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
              Autenticação gerenciada pelo <strong>Supabase Auth</strong>.<br />
              Seus dados ficam protegidos com criptografia do PostgreSQL.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

const BackButton = ({ onBack }: { onBack: () => void }) => (
  <Button type="button" variant="ghost" onClick={onBack} className="w-full text-sm">
    ← Voltar
  </Button>
);

export default Login;
