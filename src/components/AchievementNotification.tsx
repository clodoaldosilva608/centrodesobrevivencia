import { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Achievement } from "@/hooks/useUserProfile";

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

/* ── Confetti particle ── */
const ConfettiPiece = ({ index }: { index: number }) => {
  const style = useMemo(() => {
    const colors = [
      "hsl(var(--primary))",
      "#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
    ];
    const color = colors[index % colors.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = 1.2 + Math.random() * 1;
    const rotate = Math.random() * 720 - 360;
    const size = 6 + Math.random() * 6;
    const xDrift = (Math.random() - 0.5) * 120;
    return { color, left, delay, duration, rotate, size, xDrift };
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 1, y: -10, x: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, 80, 200],
        x: [0, style.xDrift],
        rotate: style.rotate,
        scale: [1, 1.2, 0.6],
      }}
      transition={{ duration: style.duration, delay: style.delay, ease: "easeOut" }}
      className="absolute pointer-events-none"
      style={{
        left: `${style.left}%`,
        top: -8,
        width: style.size,
        height: style.size,
        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
        backgroundColor: style.color,
      }}
    />
  );
};

const CONFETTI_COUNT = 30;

const AchievementNotification = ({ achievement, onDismiss }: AchievementNotificationProps) => {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        >
          {/* Confetti layer */}
          <div className="absolute inset-x-0 -top-2 h-[220px] overflow-hidden pointer-events-none">
            {Array.from({ length: CONFETTI_COUNT }).map((_, i) => (
              <ConfettiPiece key={i} index={i} />
            ))}
          </div>

          <div
            onClick={onDismiss}
            className="relative flex items-center gap-4 bg-card border-2 border-primary/60 rounded-xl px-6 py-4 shadow-2xl cursor-pointer backdrop-blur-sm"
          >
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="text-4xl"
            >
              {achievement.icon}
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Trophy size={14} className="text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Conquista Desbloqueada!</span>
              </div>
              <p className="font-heading text-foreground text-sm">{achievement.title}</p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: 2, duration: 0.6, delay: 0.3 }}
              className="text-primary text-xl"
            >
              🎉
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;
