import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  fullDescription: string;
  benefits: string[];
  price: string;
  image: string;
  specs: string[];
  buyLink: string;
  affiliateNetwork?: string | null;
  inStock?: boolean;
  featured?: boolean;
}

const ProdutoDetalhe = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("slug", id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setProduct({
            id: data.slug,
            name: data.name,
            category: data.category ?? "",
            description: data.description ?? "",
            fullDescription: data.full_description ?? "",
            benefits: Array.isArray(data.benefits) ? data.benefits : [],
            price: data.price ?? "",
            image: data.image ?? "",
            specs: Array.isArray(data.specs) ? data.specs : [],
            buyLink: data.buy_link ?? "",
            affiliateNetwork: data.affiliate_network,
            inStock: data.in_stock,
            featured: data.featured,
          });
        }
      } catch (e) {
        console.error("Erro ao carregar produto:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <SEO title="Carregando produto..." description="" />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <SEO title="Produto não encontrado" description="" />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground">Produto não encontrado.</p>
          <Link to="/equipamentos" className="text-primary hover:underline mt-4 inline-block">Voltar</Link>
        </div>
      </Layout>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.fullDescription || product.description,
    image: product.image,
    category: product.category,
    offers: product.price ? {
      "@type": "Offer",
      price: product.price.replace(/[^0-9,]/g, "").replace(",", ".") || "0",
      priceCurrency: "BRL",
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: product.buyLink,
    } : undefined,
  };

  return (
    <Layout>
      <SEO
        title={`${product.name} — Centro de Sobrevivência`}
        description={product.description}
        image={product.image}
        type="product"
        jsonLd={jsonLd}
      />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/equipamentos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft size={16} /> Voltar para Equipamentos
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative rounded-xl overflow-hidden border border-border shadow-lg">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full aspect-square bg-muted flex items-center justify-center">
                <Package size={48} className="text-muted-foreground/40" />
              </div>
            )}
            {product.featured && (
              <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                ★ Destaque
              </span>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-xs text-primary uppercase tracking-wider font-medium mb-2">{product.category}</p>
            <h1 className="font-heading text-2xl md:text-3xl text-foreground uppercase tracking-wider mb-3">
              {product.name}
            </h1>

            {product.price && (
              <p className="text-2xl font-bold text-primary mb-4">{product.price}</p>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {product.fullDescription || product.description}
            </p>

            {/* Benefits */}
            {product.benefits.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-heading uppercase tracking-wider text-foreground mb-2">Benefícios</h3>
                <ul className="space-y-1">
                  {product.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specs */}
            {product.specs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-heading uppercase tracking-wider text-foreground mb-2">Especificações</h3>
                <ul className="space-y-1">
                  {product.specs.map((s, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buy button */}
            {product.buyLink && product.buyLink !== "#" && (
              <a
                href={product.buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading tracking-wider uppercase px-8 py-3 rounded-md hover:opacity-90 transition-opacity text-sm"
              >
                <ExternalLink size={16} />
                Comprar {product.affiliateNetwork === "mercadolivre" ? "no Mercado Livre" : product.affiliateNetwork === "amazon" ? "na Amazon" : "Agora"}
              </a>
            )}

            {/* Stock */}
            {product.inStock !== undefined && (
              <p className="mt-4 text-xs text-muted-foreground">
                {product.inStock ? "✓ Em estoque" : "✗ Fora de estoque"}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProdutoDetalhe;
