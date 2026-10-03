import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, ArrowRight } from "lucide-react";

interface EquipmentCardProps {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price: string;
}

const EquipmentCard = ({ id, name, description, category, image, price }: EquipmentCardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/equipamentos/${id}`} className="block">
        {/* Image with 3D lift */}
        <div className="relative perspective-[800px]">
          <motion.div
            animate={{
              rotateY: hovered ? -8 : 0,
              scale: hovered ? 1.03 : 1,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="aspect-[4/3] rounded-lg overflow-hidden border border-border shadow-lg origin-left"
            style={{
              boxShadow: hovered
                ? "8px 8px 24px hsl(var(--background) / 0.6), 2px 0 8px hsl(var(--primary) / 0.15)"
                : "2px 4px 12px hsl(var(--background) / 0.4)",
            }}
          >
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Category badge */}
            <span className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
              {category}
            </span>

            {/* Price badge */}
            <span className="absolute top-2 right-2 bg-background/80 text-primary text-xs font-bold px-2 py-0.5 rounded backdrop-blur-sm">
              {price}
            </span>

            {/* Overlay on hover */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent flex flex-col justify-end p-4"
                >
                  <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">
                    {description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-primary text-xs font-semibold">
                    Ver produto <ArrowRight size={12} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-1">
          <h3 className="font-heading text-sm text-foreground tracking-wide line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag size={11} className="shrink-0" />
            <span className="truncate">{category}</span>
          </div>
          <p className="text-primary font-bold text-sm">{price}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default EquipmentCard;
