import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ArrowRight,
  Palette,
  Shirt,
  Tag,
  MessageCircle,
  PencilRuler,
} from "lucide-react";
import { storefront } from "@/services/storefront";
import { ProductCard } from "@/components/product/ProductCard";
import { SEOHead } from "@/components/common/SEOHead";
import { SportGrid } from "@/components/home/SportGrid";
import {
  AudienceCollections,
  BulkOrderFinder,
  PersonalizationGuide,
} from "@/components/discovery/BuyerGuides";
import { ProductShelf } from "@/components/discovery/ProductShelf";
import { quoteCollection } from "@/lib/collections";
import { SportDiscovery } from "@/components/discovery/SportDiscovery";
import { RecentlyViewed } from "@/components/discovery/RecentlyViewed";
import {
  brand,
  capabilities,
  processSteps,
  commonQuestions,
} from "@/config/brand";
import { TeamCoreHero } from "@/components/home/TeamCoreHero";
import { TechnologyCapabilities } from "@/components/home/TechnologyCapabilities";
const icons = [Palette, Shirt, Tag, MessageCircle];
export default function HomePage() {
  const products = useQuery({
    queryKey: ["storefront", "home"],
    queryFn: () => storefront.products({ limit: 8 }),
  });
  return (
    <>
      <SEOHead
        title="Custom Team Uniforms & Wholesale Sportswear"
        description="Discover custom sports uniforms from Team Core Sports Wear. Explore six sports, design your team kit and discuss wholesale and private-label requirements."
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${import.meta.env.VITE_SITE_URL || "https://teamcoresportswear.org"}/#organization`,
          name: brand.name,
          url: import.meta.env.VITE_SITE_URL || "https://teamcoresportswear.org",
          logo: new URL(brand.logo, import.meta.env.VITE_SITE_URL || "https://teamcoresportswear.org").href,
          sameAs: [brand.instagram],
          address: { "@type": "PostalAddress", addressLocality: "Sialkot", addressRegion: "Punjab", addressCountry: "PK" },
          email: brand.email,
          telephone: brand.phone,
        }}
      />
      <TeamCoreHero />
      <div className="tc-capability-band">
        <div className="container-main">
          {[
            "Custom teamwear",
            "Names & numbers",
            "Private labels",
            "Bulk enquiries",
          ].map((s, i) => {
            const Icon = icons[i];
            return (
              <span key={s}>
                <Icon size={19} />
                {s}
              </span>
            );
          })}
        </div>
      </div>
      <section className="section container-main">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR GAME</p>
            <h2>Six sports. One team.</h2>
            <p className="tc-section-description">
              Your next uniform starts with your sport.
            </p>
          </div>
          <Link className="text-link" to="/categories">
            Explore all sports <ArrowUpRight size={18} />
          </Link>
        </div>
        <SportGrid />
      </section>
      <section className="section tc-soft-section">
        <div className="container-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE TEAM CORE COLLECTION</p>
              <h2>Find your team's next look.</h2>
            </div>
            <Link className="text-link" to="/products">
              View all uniforms <ArrowUpRight size={18} />
            </Link>
          </div>
          {products.isPending ? (
            <div
              className="product-grid"
              aria-busy="true"
              aria-label="Loading uniform designs"
            >
              {[0, 1, 2, 3].map((n) => (
                <div className="product-placeholder skeleton" key={n} />
              ))}
            </div>
          ) : products.isError ? (
            <div className="data-notice">
              <h3>The collection is temporarily unavailable.</h3>
              <p>Try again, or talk to us about your team requirements.</p>
              <button className="text-link" onClick={() => products.refetch()}>
                Try again <ArrowRight size={17} />
              </button>
              <Link to="/contact">Contact our team</Link>
            </div>
          ) : products.data?.data.length ? (
            <div className="product-grid">
              {products.data.data.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="data-notice">
              <h3>Your next uniform starts with a conversation.</h3>
              <p>
                Our catalogue is being prepared. Share your sport, quantity and
                design requirements.
              </p>
              <Link className="action action-red" to="/contact">
                Discuss your team kit <ArrowUpRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>
      <section className="section container-main tc-feature-grid">
        <div className="tc-kit-panel">
          <div>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h2>
              A kit as individual
              <br />
              as your team.
            </h2>
            <p>
              Choose your colours. Add your identity. Bring every player into
              the design.
            </p>
            <Link className="action action-red" to="/design-studio">
              Design your kit <PencilRuler size={18} />
            </Link>
          </div>
          <img
            src="/teamcore/products/ice-hockey-01.webp"
            alt="Custom ice hockey jersey design"
            width="550"
            height="550"
            loading="lazy"
          />
        </div>
        <div className="tc-private-panel">
          <Tag size={29} />
          <p className="eyebrow">FOR BRANDS & WHOLESALERS</p>
          <h2>
            Your label.
            <br />
            Our next collaboration.
          </h2>
          <p>
            Build a collection around your brand. Talk to us about garment
            details, labels and packaging.
          </p>
          <Link className="text-link" to="/private-label">
            Explore private label <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <AudienceCollections />
      <SportDiscovery />
      <BulkOrderFinder />
      <PersonalizationGuide />
      <ProductShelf
        eyebrow="READY FOR YOUR NEXT TEAM ORDER"
        title="Built for the whole squad."
        params={quoteCollection}
        href="/products?mode=quote"
        description="Explore quote-ready designs. Compare each product's minimum quantity before building your list."
      />
      <section className="section container-main">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DETAILS MAKE THE DIFFERENCE</p>
            <h2>More than a team jersey.</h2>
          </div>
          <Link className="text-link" to="/custom-uniforms">
            Customization options <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="tc-capability-grid">
          {capabilities.map(([title, text], i) => {
            const Icon = icons[i];
            return (
              <article key={title}>
                <Icon size={28} strokeWidth={1.5} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            );
          })}
        </div>
      </section>
      <TechnologyCapabilities />
      <section className="section tc-process-section">
        <div className="container-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A CLEAR PATH TO YOUR NEXT KIT</p>
              <h2>From your idea to your team.</h2>
            </div>
            <Link className="text-link" to="/manufacturing-process">
              See our process <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="tc-process-grid">
            {processSteps.map(([title, text], i) => (
              <article key={title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section container-main tc-about-panel">
        <div className="tc-about-art">
          <img
            src="/teamcore/products/rugby-01.webp"
            alt="Team Core rugby uniform design"
            width="550"
            height="550"
            loading="lazy"
          />
          <span>
            MADE FOR
            <br />
            THE WHOLE TEAM.
          </span>
        </div>
        <div>
          <p className="eyebrow">MEET TEAM CORE SPORTS WEAR</p>
          <h2>
            Different sports.
            <br />A shared team spirit.
          </h2>
          <p>
            Based in Sialkot, Pakistan, we work with teams and apparel brands on
            custom sports uniforms. Your sport, your design and your
            requirements shape the conversation.
          </p>
          <p>
            From club kits to private-label collections, let's build the details
            around you.
          </p>
          <Link className="text-link" to="/about">
            Get to know Team Core <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section tc-soft-section">
        <div className="container-main tc-faq-layout">
          <div>
            <p className="eyebrow">BEFORE THE FIRST WHISTLE</p>
            <h2>A few good questions.</h2>
            <p>Everything starts with the right information.</p>
            <Link className="text-link" to="/faq">
              All questions <ArrowUpRight size={18} />
            </Link>
          </div>
          <div>
            {commonQuestions.slice(0, 4).map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <RecentlyViewed />
    </>
  );
}
