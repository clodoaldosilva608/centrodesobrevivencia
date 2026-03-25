import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Achievement } from "@/hooks/useUserProfile";

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

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
          <div
            onClick={onDismiss}
            className="flex items-center gap-4 bg-card border-2 border-primary/60 rounded-xl px-6 py-4 shadow-2xl cursor-pointer backdrop-blur-sm"
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
