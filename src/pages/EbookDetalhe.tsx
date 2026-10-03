import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { ebooks } from "@/data/mockData";
import { toOgImage } from "@/lib/ogImage";
import { ArrowLeft, Download, BookOpen, User, FileText, Tag, ChevronDown } from "lucide-react";
import { useState } from "react";

const EbookDetalhe = () => {
  const { id } = useParams();
  const ebook = ebooks.find((e) => e.id === id);
  const [synopsisOpen, setSynopsisOpen] = useState(true);

  if (!ebook) {
    return (
      <Layout>
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

            {/* Download button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-8 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-4 rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-3 w-fit text-base glow-orange"
            >
              <Download size={20} /> Baixar E-book Grátis
            </motion.button>
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
