import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { APP_NAME } from "@/constants/config";
import { brand } from "@/config/brand";
import { seoRoute } from "@/lib/seo";
interface Props {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
  breadcrumbs?: { name: string; path: string }[];
}
export function SEOHead({
  title,
  description,
  image,
  url,
  type = "website",
  jsonLd,
  breadcrumbs,
}: Props) {
  const location = useLocation();
  const base =
    import.meta.env.VITE_SITE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost");
  const route = seoRoute(location.pathname, location.search);
  const canonical = url || new URL(route.canonicalPath, base).href;
  const privatePage = route.noindex || title === "Page not found";
  const desc =
    description ||
    "Custom sports uniforms from Team Core Sports Wear. Explore team kits, private labels and bulk quotation options.";
  const structuredData = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map(({ name, path }, i) => ({
      "@type": "ListItem", position: i + 1, name, item: new URL(path, base).href,
    })),
  } : jsonLd;
  return (
    <Helmet>
      <title>{title ? `${title} | ${APP_NAME}` : APP_NAME}</title>
      <meta name="description" content={desc} />
      <meta
        name="robots"
        content={privatePage ? "noindex,follow" : "index,follow"}
      />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title || APP_NAME} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image ? new URL(image, base).href : base + brand.socialImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || APP_NAME} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={new URL(image || brand.socialImage, base).href} />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData).replace(/</g, "\\u003c")}
        </script>
      )}
    </Helmet>
  );
}
