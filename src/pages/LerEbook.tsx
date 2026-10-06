import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ebooks } from "@/data/mockData";
import { useAppSetting } from "@/hooks/useAppSetting";
import { MANUAL_URL } from "@/lib/manual";
import { ArrowLeft, Download, BookOpen, ShoppingBag, Compass, X } from "lucide-react";
import { toast } from "sonner";

const LerEbook = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const ebook = ebooks.find((e) => e.id === id);

  const { value: downloadEnabled, loading: loadingSetting } = useAppSetting<"true" | "false">(
    "ebooks_download_enabled",
    "false"
  );
  const canDownload = downloadEnabled === "true";

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  if (!ebook || !ebook.pdfUrl) {
    return (
      <Layout>
        <SEO title="E-book não disponível — Centro de Sobrevivência" />
        <div className="container mx-auto px-4 py-24 text-center">
          <BookOpen size={48} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">E-book não encontrado ou não disponível para leitura.</p>
          <Button asChild className="mt-6 gap-2 uppercase tracking-wider text-xs">
            <Link to="/ebooks">
              <ArrowLeft size={14} /> Voltar à biblioteca
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`Ler: ${ebook.title} — Centro de Sobrevivência`}
        description={`Leitura na plataforma do e-book "${ebook.title}" de ${ebook.author}.`}
        noIndex
      />

      {/* Top bar fixo */}
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/ebooks/${ebook.id}`)}
              className="gap-1 text-xs shrink-0"
            >
              <ArrowLeft size={14} /> Voltar
            </Button>
            <span className="text-xs sm:text-sm font-medium text-foreground truncate">
              {ebook.title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canDownload && ebook.pdfUrl ? (
              <Button asChild size="sm" className="gap-1 text-xs">
                <a href={ebook.pdfUrl} download={`${ebook.id}.pdf`}>
                  <Download size={14} /> Baixar PDF
                </a>
              </Button>
            ) : (
              <span className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 hidden sm:flex items-center gap-1">
                <BookOpen size={10} /> Somente leitura
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Iframe do PDF */}
      <div className="pt-12 sm:pt-14 min-h-screen bg-background">
        <motion.iframe
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          src={ebook.pdfUrl}
          title={`Leitura: ${ebook.title}`}
          className="w-full"
          style={{ height: "calc(100vh - 3.5rem)" }}
          allowFullScreen
        />
      </div>

      {/* CTA flutuante no rodapé — Loja + Bússola */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border rounded-full p-1 pl-4 shadow-2xl"
      >
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground pr-2">
          Continue:
        </span>
        <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-xs">
          <Link to="/equipamentos">
            <ShoppingBag size={12} /> Loja
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-xs">
          <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer">
            <Compass size={12} /> Bússola
          </a>
        </Button>
      </motion.div>
    </Layout>
  );
};

export default LerEbook;
