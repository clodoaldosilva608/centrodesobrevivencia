import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-card border-t border-border py-12">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-heading text-lg text-gradient-survival mb-4">SURVIVAL HUB</h3>
          <p className="text-sm text-muted-foreground">
            Seu portal completo de sobrevivencialismo, bushcraft e aventura.
          </p>
        </div>
        <div>
          <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">Explorar</h4>
          <div className="space-y-2">
            {[
              { label: "Equipamentos", path: "/equipamentos" },
              { label: "E-books", path: "/ebooks" },
              { label: "Jogos", path: "/jogos" },
            ].map((l) => (
              <Link key={l.path} to={l.path} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">Interativo</h4>
          <div className="space-y-2">
            {[
              { label: "Simulador", path: "/simulador" },
              { label: "Mapa", path: "/mapa-sobrevivencia" },
              { label: "Desafios", path: "/desafios" },
            ].map((l) => (
              <Link key={l.path} to={l.path} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">Comunidade</h4>
          <p className="text-sm text-muted-foreground">
            Junte-se a milhares de sobrevivencialistas e exploradores.
          </p>
        </div>
      </div>
      <div className="border-t border-border mt-8 pt-8 text-center text-xs text-muted-foreground">
        © 2026 Survival Hub. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
