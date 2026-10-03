import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import ThemeToggle from "./ThemeToggle";
import { MANUAL_URL } from "@/lib/manual";

interface NavItem {
  label: string;
  /** Internal path starting with `/`. */
  path?: string;
  /** External URL (https://...). When set, opens in new tab. */
  href?: string;
  /** Highlight this item with primary border. */
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { label: "Início", path: "/" },
  { label: "Equipamentos", path: "/equipamentos" },
  { label: "E-books", path: "/ebooks" },
  { label: "Jogos", path: "/jogos" },
  { label: "Simulador", path: "/simulador" },
  { label: "Mapa", path: "/mapa-sobrevivencia" },
  // Botão "Bússola" — abre o app externo Manual do Sobrevivente em nova aba
  { label: "Bússola", href: MANUAL_URL, highlight: true },
  { label: "GIS Tático", path: "/gis" },
  { label: "Visão OSIRIS", path: "/visao-osiris", highlight: true },
  { label: "Desafios", path: "/desafios" },
  { label: "Comunidade", path: "/comunidade" },
  { label: "Perfil", path: "/perfil" },
  { label: "Estatísticas", path: "/estatisticas" },
  { label: "Admin", path: "/admin" },
];

const itemClass = (item: NavItem, isActive: boolean) => {
  const base = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  if (isActive) return `${base} text-primary bg-primary/10`;
  if (item.highlight) return `${base} text-primary border border-primary/40 hover:bg-primary/10`;
  return `${base} text-muted-foreground hover:text-foreground hover:bg-muted`;
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1500] bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="Survival Hub" className="h-8 w-8 sm:h-10 sm:w-10 shrink-0" />
          <span className="font-heading text-base sm:text-xl tracking-wider text-gradient-survival truncate">
            SURVIVAL HUB
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.href ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 ${itemClass(item, false)}`}
              >
                {item.label}
                <ExternalLink size={12} className="opacity-60" />
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.path!}
                className={itemClass(item, location.pathname === item.path)}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ThemeToggle />
          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-foreground"
            aria-label={open ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden max-h-[80vh] overflow-y-auto"
          >
            <div className="px-3 sm:px-4 py-3 space-y-1">
              {navItems.map((item) =>
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between ${itemClass(item, false)}`}
                  >
                    <span>{item.label}</span>
                    <ExternalLink size={14} className="opacity-60" />
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.path!}
                    onClick={() => setOpen(false)}
                    className={`block ${itemClass(item, location.pathname === item.path)}`}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
