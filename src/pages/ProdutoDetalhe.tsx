import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { products } from "@/data/mockData";
import { toOgImage } from "@/lib/ogImage";
import { ArrowLeft, ExternalLink } from "lucide-react";

const ProdutoDetalhe = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Produto não encontrado.</p>
          <Link to="/equipamentos" className="text-primary hover:underline mt-4 inline-block">Voltar</Link>
        </div>
      </Layout>
    );
  }

  const priceNum = parseFloat(product.price.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.fullDescription || product.description,
    image: product.image,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: priceNum.toFixed(2),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <Layout>
      <SEO
        title={`${product.name} — Equipamentos`}
        description={(product.description || product.fullDescription).slice(0, 160)}
        image={toOgImage(product.image)}
        type="product"
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-12">
        <Link to="/equipamentos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8">
          <ArrowLeft size={16} /> Voltar aos equipamentos
        </Link>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="aspect-square rounded-lg overflow-hidden border border-border">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded">{product.category}</span>
            <h1 className="font-heading text-3xl text-foreground tracking-wider mt-3">{product.name}</h1>
            <p className="text-primary font-heading text-2xl mt-3">{product.price}</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.fullDescription || product.description}</p>
            {product.benefits && product.benefits.length > 0 && (
              <div className="mt-6">
                <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">Benefícios</h3>
                <ul className="space-y-2">
                  {product.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6">
              <h3 className="font-heading text-sm uppercase tracking-wider text-foreground mb-3">Especificações</h3>
              <ul className="space-y-2">
                {product.specs.map((s) => (
                  <li key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <button className="mt-8 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <ExternalLink size={16} /> Comprar Agora
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProdutoDetalhe;
