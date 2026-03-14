import { motion } from "framer-motion";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

const CategoryFilter = ({ categories, selected, onSelect }: CategoryFilterProps) => (
  <div className="flex flex-wrap gap-2 mb-8">
    <button
      onClick={() => onSelect("Todos")}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        selected === "Todos"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
      }`}
    >
      Todos
    </button>
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onSelect(cat)}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          selected === cat
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
        }`}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default CategoryFilter;
