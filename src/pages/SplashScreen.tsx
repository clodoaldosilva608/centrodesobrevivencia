import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Flame, Shield, Compass } from "lucide-react";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1600);
    const t3 = setTimeout(() => onFinish(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary glow-orange">
            <Flame className="w-14 h-14 text-primary" />
          </div>
          {/* Orbiting icons */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center border border-accent"
              >
                <Shield className="w-5 h-5 text-accent-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border"
              >
                <Compass className="w-5 h-5 text-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="font-heading text-3xl tracking-[0.3em] uppercase text-foreground">
            Survival <span className="text-gradient-survival">Hub</span>
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-muted-foreground mt-2 tracking-wider"
          >
            Sobreviva. Aprenda. Conquiste.
          </motion.p>
        </motion.div>

        {/* Loading bar */}
        <motion.div className="w-48 h-1 rounded-full bg-muted overflow-hidden mt-4">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.8, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
