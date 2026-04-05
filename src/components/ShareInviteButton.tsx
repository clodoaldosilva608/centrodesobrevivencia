import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, X, Copy, Check, MessageCircle, Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const INVITE_URL = "https://centrodesobrevivencia.lovable.app";
const INVITE_TEXT = `🏕️ Descubra o SURVIVAL HUB — a plataforma definitiva para sobrevivencialismo, bushcraft e aventura!\n\n✅ Simuladores realistas de sobrevivência\n✅ Mapa interativo com GPS e pontos secretos\n✅ +50 desafios com sistema de XP e conquistas\n✅ Jogos, e-books e equipamentos avaliados\n✅ 100% gratuito!\n\nJunte-se a milhares de sobreviventes:\n${INVITE_URL}`;

const shareChannels = [
  {
    label: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    url: `https://wa.me/?text=${encodeURIComponent(INVITE_TEXT)}`,
  },
  {
    label: "Telegram",
    icon: Send,
    color: "#0088cc",
    url: `https://t.me/share/url?url=${encodeURIComponent(INVITE_URL)}&text=${encodeURIComponent(INVITE_TEXT)}`,
  },
  {
    label: "Twitter / X",
    icon: Globe,
    color: "#1DA1F2",
    url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(INVITE_TEXT)}`,
  },
];

const ShareInviteButton = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_URL);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Survival Hub", text: INVITE_TEXT, url: INVITE_URL });
      } catch { /* user cancelled */ }
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      {/* Floating CTA Button */}
      <motion.button
        onClick={nativeShare}
        className="fixed bottom-20 right-4 z-[80] group"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 200 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center">
            <Share2 size={22} />
          </div>
          {/* Tooltip */}
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-card border border-border rounded-lg px-3 py-1.5 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="text-xs font-medium text-foreground">Convide amigos!</span>
          </div>
        </div>
      </motion.button>

      {/* Share Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary/20 to-primary/5 p-6 pb-4">
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
                <div className="text-center">
                  <div className="text-4xl mb-2">🏕️</div>
                  <h3 className="font-heading text-lg text-foreground tracking-wider">Convide seus Amigos!</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Compartilhe o Survival Hub e sobrevivam juntos
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="px-6 py-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Seu amigo vai ter acesso a:</p>
                {[
                  "🗺️ Mapa interativo com GPS em tempo real",
                  "🎮 Simuladores e jogos de sobrevivência",
                  "🏆 Sistema de XP, conquistas e ranking",
                  "📚 +20 E-books de bushcraft e sobrevivência",
                  "⚡ +50 desafios com recompensas",
                ].map((b, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                    className="text-sm text-foreground/90 py-1">
                    {b}
                  </motion.div>
                ))}
              </div>

              {/* Share Buttons */}
              <div className="px-6 pb-3 grid grid-cols-3 gap-2">
                {shareChannels.map((ch) => (
                  <a
                    key={ch.label}
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <ch.icon size={22} style={{ color: ch.color }} />
                    <span className="text-[10px] text-muted-foreground font-medium">{ch.label}</span>
                  </a>
                ))}
              </div>

              {/* Copy Link */}
              <div className="px-6 pb-6">
                <Button onClick={copyLink} variant="outline" className="w-full gap-2" size="sm">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado!" : "Copiar Link"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareInviteButton;
