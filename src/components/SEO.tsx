import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://centrodesobrevivencia.vercel.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
const OG_W = 1200;
const OG_H = 630;

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

      <meta property="og:site_name" content="Survival Hub" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:image:width" content={String(OG_W)} />
      <meta property="og:image:height" content={String(OG_H)} />
      <meta property="og:image:alt" content={finalTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:image:alt" content={finalTitle} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export { SEO };
export default SEO;
