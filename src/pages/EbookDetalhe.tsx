import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ebooks } from "@/data/mockData";
import { toOgImage } from "@/lib/ogImage";
import { MANUAL_URL } from "@/lib/manual";
import { useAppSetting } from "@/hooks/useAppSetting";
import { ArrowLeft, Download, BookOpen, User, FileText, Tag, ChevronDown, ShoppingBag, Compass, ExternalLink } from "lucide-react";
import { useState } from "react";

const EbookDetalhe = () => {
  const { id } = useParams();
  const ebook = ebooks.find((e) => e.id === id);
  const [synopsisOpen, setSynopsisOpen] = useState(true);
  const { value: downloadEnabled } = useAppSetting<"true" | "false">(
    "ebooks_download_enabled",
    "false"
  );
  const canDownload = downloadEnabled === "true";

  if (!ebook) {
    return (
      <Layout>
        <SEO
          title="E-book não encontrado"
          description="O e-book buscado não está na biblioteca. Veja a coleção completa do Centro de Sobrevivência."
          noIndex
        />
        <div className="container mx-auto px-4 py-24 text-center">
          <BookOpen size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">E-book não encontrado.</p>
          <Link to="/ebooks" className="text-primary hover:underline mt-4 inline-block">Voltar à biblioteca</Link>
        </div>
      </Layout>
    );
  }

  // Find related ebooks (same category, excluding current)
  const related = ebooks.filter((e) => e.category === ebook.category && e.id !== ebook.id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: ebook.title,
    author: { "@type": "Person", name: ebook.author },
    description: ebook.synopsis || ebook.description,
    image: ebook.image,
    numberOfPages: ebook.pages,
    genre: ebook.category,
    inLanguage: "pt-BR",
  };

  return (
    <Layout>
      <SEO
        title={`${ebook.title} — E-book`}
        description={(ebook.description || ebook.synopsis).slice(0, 160)}
        image={toOgImage(ebook.image)}
        type="book"
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-12">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/ebooks" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary text-sm mb-10 transition-colors">
            <ArrowLeft size={16} /> Voltar à biblioteca
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-10 lg:gap-14">
          {/* Cover with hover glow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative mx-auto md:mx-0 w-full max-w-[320px]"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden border border-border shadow-xl relative group">
              <img src={ebook.image} alt={ebook.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {/* Glow effect behind cover */}
            <div className="absolute -inset-3 bg-primary/10 rounded-2xl blur-2xl -z-10 opacity-60" />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col"
          >
            {/* Category badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mb-4">
              <Tag size={12} /> {ebook.category}
            </span>

            <h1 className="font-heading text-3xl lg:text-4xl text-foreground tracking-wider leading-tight">
              {ebook.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><User size={14} className="text-primary" /> {ebook.author}</span>
              <span className="flex items-center gap-1.5"><FileText size={14} className="text-primary" /> {ebook.pages} páginas</span>
              <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-primary" /> {ebook.category}</span>
            </div>

            {/* Short description */}
            <p className="mt-6 text-muted-foreground leading-relaxed text-base">
              {ebook.description}
            </p>

            {/* Collapsible synopsis */}
            <div className="mt-6 border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setSynopsisOpen(!synopsisOpen)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/50 hover:bg-muted transition-colors text-sm font-heading tracking-wide text-foreground"
              >
                <span>Sinopse Completa</span>
                <motion.div animate={{ rotate: synopsisOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} />
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{ height: synopsisOpen ? "auto" : 0, opacity: synopsisOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="px-5 py-4 text-sm text-muted-foreground leading-relaxed">
                  {ebook.synopsis || ebook.description}
                </p>
              </motion.div>
            </div>

            {/* Botão "Ler E-book" (leitura na plataforma via iframe) + download opcional */}
            <div className="mt-8 flex flex-col gap-3">
              {ebook.pdfUrl ? (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex"
                >
                  <Link
                    to={`/ler-ebook/${ebook.id}`}
                    className="bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-4 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-3 w-fit text-base glow-orange"
                  >
                    <BookOpen size={20} /> Ler E-book Agora
                  </Link>
                </motion.div>
              ) : (
                <div className="bg-muted text-muted-foreground font-heading tracking-wider uppercase px-8 py-4 rounded-xl inline-flex items-center gap-3 w-fit text-base">
                  <BookOpen size={20} /> E-book em breve
                </div>
              )}

              {/* Botão de download — só aparece se admin ativou */}
              {canDownload && ebook.pdfUrl ? (
                <motion.a
                  href={ebook.pdfUrl}
                  download={`${ebook.id}.pdf`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="border border-primary text-primary font-heading tracking-wider uppercase px-6 py-2.5 rounded-xl hover:bg-primary/10 transition-all inline-flex items-center gap-2 w-fit text-sm"
                >
                  <Download size={16} /> Baixar PDF
                </motion.a>
              ) : (
                <p className="text-[11px] text-muted-foreground max-w-md">
                  📖 Leitura exclusiva na plataforma. {canDownload ? "" : "Download disponível apenas para membros."}
                </p>
              )}
            </div>

            {/* CTAs complementares — Loja + Bússola */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/equipamentos"
                className="group border border-border rounded-xl p-4 hover:border-primary/50 transition-colors flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm uppercase tracking-wider text-foreground">
                    Visite a Loja
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gear tático e ferramentas para sua próxima aventura
                  </p>
                </div>
              </Link>
              <a
                href={MANUAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-border rounded-xl p-4 hover:border-primary/50 transition-colors flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <Compass size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm uppercase tracking-wider text-foreground flex items-center gap-1">
                    App Bússola
                    <ExternalLink size={10} className="opacity-60" />
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manual do Sobrevivente — bússola tática no seu bolso
                  </p>
                </div>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Related ebooks */}
        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <h2 className="font-heading text-xl text-foreground tracking-wider mb-6">E-books Relacionados</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {related.map((e) => (
                <Link key={e.id} to={`/ebooks/${e.id}`} className="group block">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border shadow-md">
                    <img src={e.image} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <h3 className="mt-2 text-sm font-heading text-foreground tracking-wide line-clamp-2 group-hover:text-primary transition-colors">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{e.author}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default EbookDetalhe;
