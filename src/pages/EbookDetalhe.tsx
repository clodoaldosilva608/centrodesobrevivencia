import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { ebooks } from "@/data/mockData";
import { ArrowLeft, Download } from "lucide-react";

const EbookDetalhe = () => {
  const { id } = useParams();
  const ebook = ebooks.find((e) => e.id === id);

  if (!ebook) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">E-book não encontrado.</p>
          <Link to="/ebooks" className="text-primary hover:underline mt-4 inline-block">Voltar</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Link to="/ebooks" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8">
          <ArrowLeft size={16} /> Voltar à biblioteca
        </Link>
        <div className="grid md:grid-cols-[300px_1fr] gap-10">
          <div className="aspect-[3/4] rounded-lg overflow-hidden border border-border">
            <img src={ebook.image} alt={ebook.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-heading text-3xl text-foreground tracking-wider">{ebook.title}</h1>
            <p className="text-primary mt-2">por {ebook.author}</p>
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span>{ebook.pages} páginas</span>
              <span>•</span>
              <span>{ebook.category}</span>
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">{ebook.synopsis || ebook.description}</p>
            <button className="mt-8 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <Download size={16} /> Baixar E-book
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EbookDetalhe;
