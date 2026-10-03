import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

const Section = ({ title, subtitle, children, className = "" }: SectionProps) => (
  <section className={`py-16 md:py-24 ${className}`}>
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl md:text-4xl tracking-wider text-foreground uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        )}
        <div className="mt-4 w-16 h-1 bg-primary mx-auto rounded-full" />
      </motion.div>
      {children}
    </div>
  </section>
);

export default Section;
