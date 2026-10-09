import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { MANUAL_URL } from "@/lib/manual";

const Footer = () => (
  <footer className="bg-card border-t border-border py-10">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="font-heading text-lg text-gradient-survival mb-3">SURVIVAL HUB</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seu portal completo de sobrevivencialismo, bushcraft e aventura.
            Conectado ao Manual do Sobrevivente.
          </p>
        </div>
        <div>
          <h4 className="font-heading text-xs uppercase tracking-wider text-foreground mb-3">Explorar</h4>
          <div className="space-y-1.5">
            {[
              { label: "Equipamentos", path: "/equipamentos" },
              { label: "E-books", path: "/ebooks" },
              { label: "Jogos", path: "/jogos" },
              { label: "Guia de enchentes", path: "/enchente-o-que-fazer" },
            ].map((l) => (
              <Link key={l.path} to={l.path} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading text-xs uppercase tracking-wider text-foreground mb-3">Ferramentas</h4>
          <div className="space-y-1.5">
            {[
              { label: "Simulador", path: "/simulador" },
              { label: "Mapa", path: "/mapa-sobrevivencia" },
              { label: "GIS Tático", path: "/gis" },
              { label: "Visão OSIRIS", path: "/visao-osiris" },
            ].map((l) => (
              <Link key={l.path} to={l.path} className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
            <a
              href={MANUAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Bússola Tática ↗
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-heading text-xs uppercase tracking-wider text-foreground mb-3">Conta</h4>
          <div className="space-y-1.5">
            <Link to="/login" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Entrar / Criar conta
            </Link>
            <Link to="/perfil" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Meu perfil
            </Link>
            <Link to="/estatisticas" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Estatísticas
            </Link>
            <Link to="/comunidade" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
              Comunidade
            </Link>
            {/* Apoie — contribuição voluntária que mantém o Manual gratuito */}
            <a
              href={`${MANUAL_URL}/colaboradores`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Apoie o projeto ↗
            </a>
            {/* Acesso admin discreto no rodapé — não toma espaço na navbar */}
            <Link
              to="/admin"
              className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-primary transition-colors mt-3"
              title="Painel administrativo"
            >
              <Shield size={11} /> Admin
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>© 2026 Centro de Sobrevivência. Todos os direitos reservados.</p>
        <p className="opacity-70">
          Powered by Supabase · OSIRIS · MapLibre
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
