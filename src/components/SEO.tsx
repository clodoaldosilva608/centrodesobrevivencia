import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://centrodesobrevivencia.lovable.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512.png`;

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "article" | "product" | "book";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noIndex?: boolean;
}

const SEO = ({ title, description, image, type = "website", jsonLd, noIndex }: SEOProps) => {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${pathname}`;
  const finalImage = image || DEFAULT_OG_IMAGE;
  const finalTitle = title.length > 60 ? `${title.slice(0, 57)}...` : title;
  const finalDesc = description.length > 160 ? `${description.slice(0, 157)}...` : description;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;
