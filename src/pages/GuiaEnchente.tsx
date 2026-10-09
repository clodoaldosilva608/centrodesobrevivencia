import { motion } from "framer-motion";
import { ExternalLink, Droplets, Backpack, AlertTriangle, HeartPulse } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";

/**
 * Página-pilar do cluster SEO "enchente o que fazer" (Pack SEO do Hub,
 * seção 3). Texto integral autoral; os deep links para o Manual carregam
 * UTM (source=centro, medium=artigo, campaign=pilar-enchentes) e NÃO devem
 * ser alterados — é o que permite ao GA4 atribuir conversões a este artigo.
 */

const MANUAL = "https://manualdosobrevivente.vercel.app";
const UTM = "?utm_source=centro&utm_medium=artigo&utm_campaign=pilar-enchentes";

const links = {
  deposito: `${MANUAL}/deposito${UTM}`,
  aguaEVida: `${MANUAL}/manual/agua-e-vida${UTM}`,
  menteForte: `${MANUAL}/manual/mente-forte-sobrevive${UTM}`,
  home: `${MANUAL}/${UTM}`,
  perfil: `${MANUAL}/perfil${UTM}`,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Enchente: o que fazer — guia completo do kit de 72 horas",
  description:
    "Plano completo para enchente: kit de 72 horas, evacuação em segurança, água, energia e recuperação. Com checklist gratuito e aplicativo de prontidão.",
  image: "https://centrodesobrevivencia.vercel.app/og-enchente.jpg",
  author: { "@type": "Organization", name: "Centro de Sobrevivência" },
  publisher: { "@type": "Organization", name: "Centro de Sobrevivência" },
  inLanguage: "pt-BR",
  mainEntityOfPage: "https://centrodesobrevivencia.vercel.app/enchente-o-que-fazer",
};

const LinkManual = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary font-medium underline decoration-primary/40 underline-offset-4 hover:decoration-primary transition-colors inline-flex items-center gap-1"
  >
    {children}
    <ExternalLink size={13} className="inline opacity-70" />
  </a>
);

const ItemKit = ({ titulo, itens }: { titulo: string; itens: string }) => (
  <div className="rounded-lg border border-border bg-card/60 p-4">
    <p className="font-heading text-sm uppercase tracking-wider text-primary mb-1">{titulo}</p>
    <p className="text-sm text-muted-foreground leading-relaxed">{itens}</p>
  </div>
);

const GuiaEnchente = () => {
  return (
    <Layout>
      <SEO
        title="Enchente: o que fazer — guia completo do kit de 72 horas"
        description="Plano completo para enchente: kit de 72 horas, evacuação em segurança, água, energia e recuperação. Com checklist gratuito e aplicativo de prontidão."
        image="/og-enchente.jpg"
        type="article"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <div className="relative h-[42vh] min-h-[300px] overflow-hidden">
        <img
          src="/og-enchente.jpg"
          alt="Família com mochilas de emergência em ponto alto durante enchente urbana"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 pb-8">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-heading text-xs uppercase tracking-[0.3em] text-primary mb-2"
            >
              Guia de prontidão · Enchentes
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="font-heading text-3xl md:text-5xl uppercase text-foreground max-w-3xl leading-tight"
            >
              Enchente: o que fazer — guia completo do kit de 72 horas
            </motion.h1>
          </div>
        </div>
      </div>

      {/* Corpo do artigo */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Introdução */}
          <section>
            <h2 className="font-heading text-2xl uppercase text-foreground mb-4 flex items-center gap-3">
              <span className="w-8 h-1 bg-primary inline-block" />
              Enchente avisada não é enchente sofrida: comece aqui
            </h2>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                Chuva forte no Brasil parou de ser surpresa. De Porto Alegre ao litoral de São
                Paulo, de Petrópolis ao Recife, o padrão se repete: a água sobe rápido, a luz cai,
                a comunicação falha e famílias inteiras descobrem, tarde demais, que não tinham
                nem uma mochila pronta nem água estocada. Este guia inverte essa lógica: mostra,
                em ordem de prioridade, o que fazer antes, durante e depois de uma enchente urbana
                — com um kit de 72 horas que qualquer casa consegue montar.
              </p>
              <div className="border-l-4 border-primary bg-primary/5 p-4 rounded-r-lg">
                <p>
                  A regra de ouro da Defesa Civil é simples: <strong>72 horas de autonomia</strong>{" "}
                  — três dias em que sua família se sustenta sem rede de água, sem energia e sem
                  compras, até a ajuda organizada chegar. Tudo neste guia serve a esse objetivo. Se
                  você fizer só três coisas depois de ler, que sejam: estocar água, montar a
                  mochila de emergência e combinar o ponto de encontro da família.
                </p>
              </div>
            </div>
          </section>

          {/* Kit de 72 horas */}
          <section>
            <h2 className="font-heading text-2xl uppercase text-foreground mb-4 flex items-center gap-3">
              <Backpack size={22} className="text-primary" />
              Antes da água subir: o kit de 72 horas
            </h2>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                O kit não é mochila de trilha: é uma sacola resistente por pessoa, guardada em
                lugar alto e seco, que você agarra com uma mão ao sair. Dentro dela, quatro
                grupos: água e alimento (2 litros de água por pessoa por dia, alimentos que não
                precisam de fogo), proteção (capa de chuva, manta de alumínio, troca de roupa em
                saco plástico), saúde (kit de primeiros socorros, remédios de uso contínuo com
                receita) e reconexão (celular carregado, power bank, rádio a pilha, cópia de
                documentos em saco plástico).
              </p>
              <div className="grid sm:grid-cols-2 gap-3 py-2">
                <ItemKit titulo="Água e alimento" itens="2 litros de água por pessoa por dia; alimentos que não precisam de fogo." />
                <ItemKit titulo="Proteção" itens="Capa de chuva, manta de alumínio, troca de roupa em saco plástico." />
                <ItemKit titulo="Saúde" itens="Kit de primeiros socorros; remédios de uso contínuo com receita." />
                <ItemKit titulo="Reconexão" itens="Celular carregado, power bank, rádio a pilha, documentos em saco plástico." />
              </div>
              <p>
                Não precisa comprar tudo de uma vez. Comece pelos itens de sobrevivência imediata
                — água, pastilha purificadora, lanterna de cabeça, rádio a pilha, kit de primeiros
                socorros — e evolua o kit com o tempo. A lista completa, com pesos e preços de
                referência, está no{" "}
                <LinkManual href={links.deposito}>Depósito de Suprimentos do Manual do Sobrevivente</LinkManual>
                , catálogo curado por contexto que aponta exatamente o que reunir primeiro.
              </p>
            </div>

            <h3 className="font-heading text-xl uppercase text-foreground mt-8 mb-3 flex items-center gap-3">
              <Droplets size={19} className="text-primary" />
              Água: a prioridade número um
            </h3>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                Na enchente, a rede de abastecimento é a primeira vítima: tubulação rompida mistura
                esgoto na água que sai da torneira. Estoque 12 litros por pessoa (três dias × 4
                litros entre beber e cozinhar) e mantenha um filtro de 0,1 mícron ou pastilhas de
                cloramina como reserva. Nunca use água de poço, cisterna ou caixa alagada sem
                tratamento — nem para lavar louça. O passo a passo de tratamento caseiro está no
                tópico <LinkManual href={links.aguaEVida}>Água e vida do Manual</LinkManual>, que
                funciona sem internet.
              </p>
            </div>

            <h3 className="font-heading text-xl uppercase text-foreground mt-8 mb-3 flex items-center gap-3">
              <AlertTriangle size={19} className="text-primary" />
              Energia e comunicação
            </h3>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                Apagão acompanha enchente: energia desligada por segurança nas áreas alagadas.
                Carregue tudo antes da chuva chegar, guarde o power bank carregado e desconfie do
                90% que some em poucas horas de uso pesado. Rádio a pilha ou a dínamo é o único
                canal que sobra quando operadora cai — a Defesa Civil emite avisos por rádio AM/FM
                justamente por isso. Anote em papel os telefones essenciais: a agenda do celular
                morre junto com a bateria.
              </p>
            </div>
          </section>

          {/* Durante */}
          <section>
            <h2 className="font-heading text-2xl uppercase text-foreground mb-4 flex items-center gap-3">
              <AlertTriangle size={22} className="text-primary" />
              Durante: evacuar ou abrigar-se?
            </h2>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                Só uma autoridade decide isso por você: o aviso oficial da Defesa Civil (alertas
                da prefeitura, sirene, rádio). Se a ordem for evacuar, saia imediatamente com a
                mochila, desligando gás e energia; ande em direção ao ponto alto combinado pela
                família, nunca por água corrente — vinte centímetros de água em movimento derrubam
                um adulto. Se for abrigar-se, suba ao andar mais alto com o kit, deixe a área
                elétrica seca e espere. Nunca entre em água turva a pé ou de carro: o buraco
                debaixo da água não tem sinal.
              </p>
              <p>
                Em multidão — filas de resgate, abrigos lotados — a técnica que salva é a
                respiração lenta e a decisão por etapas, não a correria. O tópico{" "}
                <LinkManual href={links.menteForte}>Mente forte sobrevive</LinkManual> ensina o
                protocolo de parar-pensar-agir que os socorristas usam. Vale treinar antes de
                precisar.
              </p>
            </div>
          </section>

          {/* Depois */}
          <section>
            <h2 className="font-heading text-2xl uppercase text-foreground mb-4 flex items-center gap-3">
              <HeartPulse size={22} className="text-primary" />
              Depois: os perigos que ficam
            </h2>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                A água baixa e o pior começa: tudo que tocou a enchente é contaminado. Use botas e
                luvas, descarte alimentos que tiveram qualquer contato com a água (lata amassada
                incluída), lave com água e sabão, depois desinfete com água sanitária, superfícies
                que entraram em contato. Ferimentos, mesmo pequenos, precisam de lavagem abundante
                e curativo — vidro e ferrugem submersos são a maior fonte de infecção. Procure
                médico se aparecer febre nas semanas seguintes: leptospirose se apresenta como
                gripe.
              </p>
            </div>
          </section>

          {/* CTA final */}
          <section className="border border-primary/30 bg-primary/5 rounded-xl p-6 md:p-8">
            <h2 className="font-heading text-2xl uppercase text-foreground mb-4">
              Transforme o guia em prática
            </h2>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                Ler é o primeiro passo; conferir é o que salva. O{" "}
                <LinkManual href={links.home}>Manual do Sobrevivente</LinkManual> é um aplicativo
                gratuito que transforma este plano em rotina: mochila de 72 horas com 89 itens
                catalogados para marcar o que já tem, teste de prontidão offline, mapa tático com
                radar de chuva e ciclones ao vivo, e o manual completo de técnicas salvo no próprio
                aparelho — funciona sem internet, exatamente quando você mais precisa.{" "}
                <LinkManual href={links.perfil}>
                  Instale grátis e faça o teste de prontidão da sua família
                </LinkManual>{" "}
                em menos de dez minutos.
              </p>
            </div>
          </section>
        </div>
      </article>
    </Layout>
  );
};

export default GuiaEnchente;
