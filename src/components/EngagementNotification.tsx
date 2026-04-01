import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Gift, Trophy, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LAST_VISIT_KEY = "sh_last_visit_time";
const NOTIF_DISMISSED_KEY = "sh_engagement_dismissed";

interface Notification {
  icon: React.ReactNode;
  title: string;
  message: string;
  cta: string;
  route: string;
}

const getNotification = (hoursSinceVisit: number): Notification | null => {
  if (hoursSinceVisit < 4) return null;

  if (hoursSinceVisit >= 72) {
    return {
      icon: <Flame className="w-6 h-6 text-destructive" />,
      title: "Seu streak está em perigo! 🔥",
      message: "Faz mais de 3 dias que você não acessa. Volte agora para não perder seu progresso!",
      cta: "Resgatar Streak",
      route: "/perfil",
    };
  }
  if (hoursSinceVisit >= 24) {
    return {
      icon: <Gift className="w-6 h-6 text-primary" />,
      title: "Novas missões disponíveis! 🎁",
      message: "Suas missões diárias foram renovadas. Complete todas para ganhar bônus de XP!",
      cta: "Ver Missões",
      route: "/perfil",
    };
  }
  if (hoursSinceVisit >= 4) {
    return {
      icon: <Trophy className="w-6 h-6 text-primary" />,
      title: "Novos desafios esperam por você! 🏆",
      message: "Continue sua jornada de sobrevivência e ganhe mais XP.",
      cta: "Ver Desafios",
      route: "/desafios",
    };
  }

  return null;
};

const EngagementNotification = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const now = Date.now();
    const dismissed = sessionStorage.getItem(NOTIF_DISMISSED_KEY);
    if (dismissed) return;

    const lastVisitStr = localStorage.getItem(LAST_VISIT_KEY);
    const lastVisit = lastVisitStr ? parseInt(lastVisitStr, 10) : now;
    const hoursSince = (now - lastVisit) / (1000 * 60 * 60);

    const notif = getNotification(hoursSince);
    if (notif) {
      setTimeout(() => {
        setNotification(notif);
        setVisible(true);
      }, 2000);
    }

    localStorage.setItem(LAST_VISIT_KEY, now.toString());
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(NOTIF_DISMISSED_KEY, "1");
  };

  const handleCta = () => {
    dismiss();
    if (notification) navigate(notification.route);
  };

  return (
    <AnimatePresence>
      {visible && notification && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[80] bg-card border border-border rounded-xl p-4 shadow-2xl"
        >
          <button onClick={dismiss} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              {notification.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm text-foreground tracking-wider">{notification.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
              <Button size="sm" className="mt-3 h-7 text-xs gap-1" onClick={handleCta}>
                <Zap size={12} /> {notification.cta}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EngagementNotification;
