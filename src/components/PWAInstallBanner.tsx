import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("sh_pwa_dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("sh_pwa_dismissed", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-4 left-4 right-4 z-[90] max-w-md mx-auto"
        >
          <div className="relative rounded-2xl border border-primary/20 bg-card p-4 shadow-lg shadow-primary/10">
            <button
              onClick={handleDismiss}
              aria-label="Dispensar banner de instalação"
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-sm font-bold text-foreground">
                  Instalar Survival Hub
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Acesso rápido, funciona offline e receba notificações.
                </p>
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="mt-2 gap-1.5 text-xs h-8"
                >
                  <Download size={14} />
                  Instalar App
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
