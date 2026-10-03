import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface ContentCardProps {
  image: string;
  title: string;
  description: string;
  link: string;
  buttonLabel: string;
  badge?: string;
  price?: string;
}

const ContentCard = ({ image, title, description, link, buttonLabel, badge, price }: ContentCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    className="bg-gradient-card rounded-lg border border-border overflow-hidden group"
  >
    <div className="aspect-[4/3] overflow-hidden relative">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {badge && (
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
          {badge}
        </span>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-heading text-lg text-foreground tracking-wide">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>
      {price && (
        <p className="mt-2 text-primary font-bold text-lg">{price}</p>
      )}
      <Link
        to={link}
        className="mt-4 inline-block bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
      >
        {buttonLabel}
      </Link>
    </div>
  </motion.div>
);

export default ContentCard;
