import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Check } from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";
import { SportGrid } from "@/components/home/SportGrid";
import { capabilities, processSteps } from "@/config/brand";
import {
  BulkOrderFinder,
  PersonalizationGuide,
  AudienceCollections,
} from "@/components/discovery/BuyerGuides";
import { ProductShelf } from "@/components/discovery/ProductShelf";
import { quoteCollection } from "@/lib/collections";
import { TechnologyCapabilities } from "@/components/home/TechnologyCapabilities";
const searchTitles: Record<string, string> = {
  "/custom-uniforms": "Custom Team Uniforms",
  "/private-label": "Private Label Sportswear",
  "/manufacturing-process": "How Custom Teamwear Is Made",
  "/about": "About Our Sialkot Sportswear Team",
  "/wholesale": "Wholesale Team Uniforms & Bulk Quotes",
};

const buyerAnswers: Record<string, { question: string; answer: string; url: string; label: string }> = {
  "/custom-uniforms": {
    question: "What do I need to design custom team uniforms?",
    answer: "Start with the sport and garment style. Bring your logo, colour references, player names and numbers, and a count by size. If you only need a jersey or want a complete kit, say so in the brief. Review artwork placement, spelling and measurements on the proof before approving production.",
    url: "/design-studio", label: "Explore the Team Core Design Studio",
  },
  "/private-label": {
    question: "What should a private-label sportswear brief include?",
    answer: "Share the garment styles, target quantities, size range, logo files and any label or packaging requirements. List any samples you need and the intended delivery destination. The quotation confirms the agreed specifications; ask about minimum quantities and sample costs before placing an order.",
    url: "/contact?topic=Private%20label%20enquiry", label: "Discuss a private-label brief",
  },
  "/wholesale": {
    question: "How do I request a quote for a bulk uniform order?",
    answer: "Add the designs and quantities you need to your quote list. Sign in and submit your team details, delivery country and city, and any notes about sizing, artwork or deadlines. You can also contact us with a custom brief if your garment is not in the catalogue. A request does not place an order or take payment.",
    url: "/products", label: "Browse uniform designs for your quote",
  },
};
const content: Record<
  string,
  {
    eyebrow: string;
    title: string;
    intro: string;
    image: string;
    cards: readonly (readonly [string, string])[];
    action: string;
    url: string;
  }
> = {
  "/custom-uniforms": {
    eyebrow: "YOUR SPORT. YOUR SIGNATURE.",
    title: "A uniform that brings your team together.",
    intro:
      "Start with your sport. Explore colours, team logos, player names and numbers, and agree the details around your squad.",
    image: "soccer-01",
    cards: [
      [
        "Colour & design",
        "Explore a garment design that carries your team's identity. Discuss your colour references and artwork before production.",
      ],
      [
        "Names & numbers",
        "Bring your player roster and size requirements together. Confirm spelling, numbering and sizing in your production proof.",
      ],
      [
        "Decoration & fabric",
        "Discuss sublimation, embroidery, screen printing and fabric requirements with our team. Your agreed specification defines the finished garment.",
      ],
    ],
    action: "Explore uniform designs",
    url: "/products",
  },
  "/private-label": {
    eyebrow: "FOR BRANDS & WHOLESALERS",
    title: "Your brand. Built into every detail.",
    intro:
      "Develop sportswear around your own identity. Talk to us about the garments, quantities, labels and packaging your collection needs.",
    image: "baseball-01",
    cards: [
      [
        "Start with your collection",
        "Share your target sport, product types and quantities. Tell us about your audience and the garment details that matter to your brand.",
      ],
      [
        "Make your mark",
        "Discuss logo application, private labels, size and care tags, and packaging. These requirements become part of your reviewed quotation.",
      ],
      [
        "Plan your order",
        "Confirm specifications, pricing, sample requirements and delivery arrangements before production. Keep your agreed details together in your account.",
      ],
    ],
    action: "Discuss your private label",
    url: "/contact?topic=Private%20label%20enquiry",
  },
  "/manufacturing-process": {
    eyebrow: "FROM THE FIRST IDEA TO THE NEXT GAME",
    title: "Every detail. Agreed together.",
    intro:
      "A clear brief and a reviewed design set the direction. Follow the steps from your uniform requirements to production and dispatch.",
    image: "rugby-01",
    cards: processSteps,
    action: "Start your team enquiry",
    url: "/wholesale",
  },
  "/about": {
    eyebrow: "TEAM CORE SPORTS WEAR",
    title: "Different sports. A shared team spirit.",
    intro:
      "Based in Sialkot, Pakistan, Team Core Sports Wear works on custom sports uniforms for teams, clubs and apparel brands. Your requirements shape the product and the conversation.",
    image: "american-football-01",
    cards: capabilities,
    action: "Explore our sports",
    url: "/categories",
  },
  "/wholesale": {
    eyebrow: "FOR TEAMS, CLUBS & APPAREL BRANDS",
    title: "Your next team order starts here.",
    intro:
      "Choose uniform designs and quantities, or tell us about a completely custom brief. Review an itemised quotation with the agreed specifications before you commit.",
    image: "basketball-01",
    cards: [
      [
        "Choose your uniforms",
        "Select a product, variant and quantity, then add it to your quote list. Keep different sizes and garments together in one request.",
      ],
      [
        "Share your requirements",
        "Sign in to submit your quote basket. Include team or company details, your destination and any customization requirements.",
      ],
      [
        "Review your quotation",
        "Check products, prices, currency, delivery, terms and expiry in your account. Accepting a quotation creates an order; payment is a separate step.",
      ],
    ],
    action: "Build your quote list",
    url: "/products?mode=quote",
  },
};
export default function BrandPage() {
  const { pathname } = useLocation();
  const page = content[pathname];
  if (!page) return null;
  const buyerAnswer = buyerAnswers[pathname];
  return (
    <>
      <SEOHead title={searchTitles[pathname]} description={page.intro} image={`/teamcore/products/${page.image}.webp`} />
      <section className="container-main section tc-marketing-hero">
        <div>
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{["/custom-uniforms", "/private-label", "/wholesale"].includes(pathname) ? searchTitles[pathname] : page.title}</h1>
          <p>{page.intro}</p>
          <div className="tc-marketing-actions">
            <Link className="action action-red" to={page.url}>
              {page.action}
              <ArrowUpRight size={18} />
            </Link>
            {pathname === "/wholesale" ? (
              <Link className="text-link" to="/quote-basket">
                View your quote list <ArrowRight size={18} />
              </Link>
            ) : (
              <Link className="text-link" to="/contact">
                Talk to our team <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
        <div className="tc-marketing-image">
          <img
            src={`/teamcore/products/${page.image}.webp`}
            alt={`Team Core ${page.image.split(/-\d/)[0].replaceAll("-", " ")} uniform design`}
            width="550"
            height="550"
            fetchPriority="high"
          />
        </div>
      </section>
      {buyerAnswer && (
        <section className="container-main section prose-content" aria-labelledby="buyer-answer">
          <h2 id="buyer-answer">{buyerAnswer.question}</h2>
          <p>{buyerAnswer.answer}</p>
          <Link className="text-link" to={buyerAnswer.url}>{buyerAnswer.label} <ArrowUpRight size={16} /></Link>
        </section>
      )}
      <section className="section tc-soft-section">
        <div className="container-main tc-marketing-content">
          {page.cards.map(([title, text], i) => (
            <article key={title}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      {pathname === "/wholesale" || pathname === "/custom-uniforms" ? (
        <section className="section container-main">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CHOOSE YOUR STARTING POINT</p>
              <h2>Find your team's sport.</h2>
            </div>
            <Link className="text-link" to="/products">
              All uniforms <ArrowUpRight size={18} />
            </Link>
          </div>
          <SportGrid />
        </section>
      ) : null}
      <section className="section container-main">
        <div className="tc-catalogue-note">
          <div>
            <h2 className="text-xl mb-3">Have something specific in mind?</h2>
            <p>
              <Check size={16} className="inline mr-2" />
              Share your sport, quantity, artwork and delivery requirements.
            </p>
          </div>
          <Link
            className="action action-red"
            to={`/contact?topic=${encodeURIComponent(pathname === "/private-label" ? "Private label enquiry" : "Custom team uniform enquiry")}`}
          >
            Send your brief <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="text-sm text-text-muted mt-6">
          For artwork, use a supported design-studio template or discuss the
          appropriate file format with our team. Sending a message does not
          place an order.
        </p>
      </section>
      {pathname === "/wholesale" && <BulkOrderFinder />}
      {pathname === "/custom-uniforms" && <PersonalizationGuide />}
      {[
        "/custom-uniforms",
        "/private-label",
        "/manufacturing-process",
      ].includes(pathname) && <TechnologyCapabilities />}
      {pathname === "/about" && <AudienceCollections />}
      {pathname !== "/manufacturing-process" && (
        <ProductShelf
          eyebrow="START WITH A REAL DESIGN"
          title={
            pathname === "/private-label"
              ? "A starting point for your collection."
              : "Explore designs for your next brief."
          }
          params={quoteCollection}
          href="/products?mode=quote"
          description="Choose a design, review its options and add quantities to your quote list."
        />
      )}
    </>
  );
}
