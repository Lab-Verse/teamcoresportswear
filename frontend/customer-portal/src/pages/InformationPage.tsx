import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SEOHead } from "@/components/common/SEOHead";
import BrandPage from "@/pages/BrandPage";
import { commonQuestions } from "@/config/brand";
const pages: Record<
  string,
  { title: string; intro: string; sections: [string, string][] }
> = {
  "/about": {
    title: "A shared passion. A single team.",
    intro:
      "Welcome to Team Core Sports Wear. A place to find the gear for your game and discuss the requirements of your team or business.",
    sections: [
      [
        "Your game, your way.",
        "Explore our product range, choose the right variants and shop online where available. For larger quantities or specific requirements, request a tailored quotation directly from our team.",
      ],
      [
        "One company. A direct conversation.",
        "Every order and quotation on this website is handled by Team Core Sports Wear. Your account brings together your purchases, quotation requests and conversations with us.",
      ],
      [
        "Start with what matters.",
        "The right product starts with the right information. If you need sizing, product specifications or help planning a team order, speak with us before placing your order.",
      ],
    ],
  },
  "/wholesale": {
    title: "Big ambitions. Personal attention.",
    intro:
      "For teams, clubs and businesses. Put your requirements in one place and let us prepare a quotation.",
    sections: [
      [
        "01 / Build your quote basket",
        "Explore the catalogue. Select variants and quantities, then use “Add to quote basket”. Your quote basket stays separate from your shopping bag.",
      ],
      [
        "02 / Tell us what you need",
        "Sign in and send your company or team name, contact information and delivery requirements. Sending a request does not place an order or take payment.",
      ],
      [
        "03 / Review your quotation",
        "View the itemised prices, currency, delivery charges, terms and expiry in your account. Accept or decline an active quotation. Contact us if anything needs to change.",
      ],
      [
        "04 / Order and follow progress",
        "Accepting a quotation creates an order. Where online payment is available, pay from the order page. Track fulfilment through your account.",
      ],
    ],
  },
  "/help": {
    title: "A little help goes a long way.",
    intro:
      "Find your next step, from selecting products to following an order.",
    sections: [
      [
        "Choosing your products",
        "Check the product details and variant SKU before adding to your shopping bag or quote basket. Our sizing guidance explains what to confirm before ordering.",
      ],
      [
        "Orders and payments",
        "Your account shows your orders and their current status. An interrupted payment can be resumed from a payable order. A payment is confirmed only after the payment provider confirms it to us.",
      ],
      [
        "Quotations and support",
        "Find your enquiries and quotations in your account. You can contact our team with a product SKU, order number or enquiry reference so we can help with the right context.",
      ],
    ],
  },
  "/size-guide": {
    title: "Team Uniform Size Guide",
    intro:
      "Sizes can differ by product. Use the specific product information before making your selection.",
    sections: [
      [
        "Check the variant",
        "Select the size or variant shown for the product. Use its SKU when asking our team about measurements or fit.",
      ],
      [
        "Measure before ordering",
        "For clothing, compare your measurements with the product-specific size chart when available. For equipment, confirm dimensions and intended use. A universal size chart may not describe your product accurately.",
      ],
      [
        "Buying for a team?",
        "Ask for the garment’s size chart and check whether it uses body or garment measurements. Record each player’s measurements using the chart’s instructions, then group the quantities by size. Use the confirmed chart for that design rather than assuming the same label fits across all garments.",
      ],
    ],
  },
  "/shipping-delivery": {
    title: "From our team to yours.",
    intro: "Delivery availability depends on your basket and destination.",
    sections: [
      [
        "Check delivery before you pay",
        "Enter your address at checkout to calculate available delivery charges. If we cannot calculate delivery for your destination or products, request a quotation instead.",
      ],
      [
        "Wholesale delivery",
        "Your quotation specifies delivery charges and any agreed arrangements. Review them before accepting the quote.",
      ],
      [
        "Follow your order",
        "Available shipment and tracking updates appear in your account. Contact us with your order reference if you need assistance. Delivery estimates are provided only where a configured shipping method includes them.",
      ],
    ],
  },
  "/returns-refunds": {
    title: "Let’s put it right.",
    intro:
      "Contact our team about a damaged, incorrect or unsuitable item with your order reference.",
    sections: [
      [
        "Before returning an item",
        "Start a return request from your account or contact support. Keep the product and packaging available and describe the issue. Wait for return instructions before sending goods back.",
      ],
      [
        "Order-specific terms",
        "Return eligibility, deadlines, return shipping responsibility and any exclusions must be stated in your purchase terms or accepted quotation. Ask our team if any of these details are unclear before ordering.",
      ],
      [
        "Refund status",
        "A return request is not a confirmed refund. Track the request in your account and follow the instructions from our team. Payment-provider processing is separate from return approval.",
      ],
    ],
  },
  "/payment-options": {
    title: "Clear totals. A clear next step.",
    intro:
      "Review your products, delivery, tax and currency before continuing to payment.",
    sections: [
      [
        "Online checkout",
        "Where enabled, card payments are completed on the payment provider’s hosted page. This website does not collect your full card number or security code.",
      ],
      [
        "Wholesale quotations",
        "An accepted quote becomes an order. Payment availability and terms depend on the quotation and your order state. Quote acceptance does not mean that payment has been received.",
      ],
      [
        "Interrupted payment",
        "Check your order before retrying. A pending payment may still be awaiting confirmation. Use the resume action on your order rather than creating another order.",
      ],
    ],
  },
  "/privacy-policy": {
    title: "Your information matters.",
    intro:
      "We use your information to manage your account, respond to enquiries and fulfil your orders. Contact Team Core Sports Wear with questions about your data.",
    sections: [
      [
        "Information used to provide the service",
        "Account details, delivery addresses, order and quote details, support requests and messages are used to manage your account, fulfil orders and respond to enquiries.",
      ],
      [
        "Payment information",
        "The payment provider processes card details. The store retains transaction references, amounts, currency and payment status needed to reconcile orders.",
      ],
      [
        "Browser storage",
        "Essential browser storage keeps sign-in state, product selections and checkout recovery information. This implementation does not add advertising trackers.",
      ],
      [
        "Your questions",
        "Use the contact form to ask about your account or personal data. Do not include passwords, payment card details or other secrets in a support message.",
      ],
    ],
  },
  "/terms": {
    title: "Before you place an order.",
    intro:
      "Review your order and any quotation-specific terms carefully. Final legal company details and sales terms require business approval before launch.",
    sections: [
      [
        "Product information and pricing",
        "Product availability and prices are rechecked before an order is created. Your final total and currency are shown before payment. Resolve any discrepancy before proceeding.",
      ],
      [
        "Quotations",
        "A quotation has its own terms and expiry. Submitting an enquiry does not create an order. Accepting a valid quotation creates an order using its agreed prices; payment is a separate step.",
      ],
      [
        "Delivery, returns and support",
        "Read the shipping and returns information and ask us about any missing requirements before ordering. Company-approved terms must define the applicable jurisdiction and business-specific obligations.",
      ],
    ],
  },
  "/cookie-policy": {
    title: "Storage with a purpose.",
    intro:
      "The storefront uses browser storage to make account and shopping features work.",
    sections: [
      [
        "Essential storage",
        "Authentication state, shopping and quote basket selections, and checkout recovery keys are stored in your browser. Clearing browser storage may sign you out and remove unsent selections.",
      ],
      [
        "Analytics and advertising",
        "No advertising or optional analytics service is added by this redesign. If optional tracking is introduced later, this page and any required consent controls must be updated first.",
      ],
      [
        "Your controls",
        "You can clear stored data in your browser settings. Sign out when using a shared device. Your submitted orders and enquiries remain in your account.",
      ],
    ],
  },
  "/accessibility": {
    title: "Sport is for everyone.",
    intro:
      "We aim to make the store useful with a keyboard, touch input and assistive technology.",
    sections: [
      [
        "Using the website",
        "Navigation and forms support keyboard focus. Product options have text labels, and error messages describe what needs attention.",
      ],
      [
        "Motion and viewing preferences",
        "The storefront respects reduced-motion preferences and adapts to different screen sizes. You can use browser zoom without changing your account settings.",
      ],
      [
        "Tell us about a barrier",
        "If something prevents you from using the store, contact us with the page address and what you were trying to do. This statement describes our approach, not an independent certification.",
      ],
    ],
  },
};
// eslint-disable-next-line react-refresh/only-export-components
export const informationPaths = [
  ...Object.keys(pages),
  "/custom-uniforms",
  "/private-label",
  "/manufacturing-process",
];
export default function InformationPage() {
  const { pathname } = useLocation();
  if (
    [
      "/about",
      "/wholesale",
      "/custom-uniforms",
      "/private-label",
      "/manufacturing-process",
    ].includes(pathname)
  )
    return <BrandPage />;
  const p = pages[pathname];
  if (!p) return <NotFoundPage />;
  return (
    <>
      <SEOHead title={p.title} description={p.intro} />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">Team Core Sports Wear</p>
          <h1>{p.title}</h1>
          <p>{p.intro}</p>
        </div>
      </div>
      <div className="container-main section content-layout">
        <article className="prose-content">
          {p.sections.map(([title, text]) => (
            <section key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </section>
          ))}
          {pathname === "/wholesale" && (
            <Link className="action action-red mt-8" to="/products">
              Build your quote basket <ArrowUpRight size={18} />
            </Link>
          )}
        </article>
        <aside className="content-aside">
          <p className="eyebrow">A DIRECT CONVERSATION</p>
          <h2>We're here to help.</h2>
          <p>
            Questions about a product, an order or a team requirement? Tell us
            what you have in mind.
          </p>
          <Link className="action action-red" to="/contact">
            Get in touch <ArrowUpRight size={18} />
          </Link>
          <nav className="grid gap-4 mt-8 text-sm">
            <Link to="/faq">Frequently asked questions →</Link>
            <Link to="/account/orders">Your orders →</Link>
            <Link to="/account/wholesale">Your quotations →</Link>
          </nav>
        </aside>
      </div>
    </>
  );
}
export function NotFoundPage() {
  return (
    <div className="container-main section data-notice">
      <SEOHead title="Page not found" />
      <p className="eyebrow">404 / OUT OF PLAY</p>
      <h1 className="content-title">Let's get you back in the game.</h1>
      <p>That page isn't available. Explore the range or head back home.</p>
      <Link className="action action-red" to="/products">
        Explore products <ArrowUpRight size={18} />
      </Link>
      <Link className="text-link" to="/">
        Back home →
      </Link>
    </div>
  );
}
export function FAQPage() {
  const questions = [
    ...commonQuestions,
    [
      "Can I buy directly or do I need a quote?",
      "For a custom team uniform, add the design and your quantities to the quote basket. The reviewed quotation confirms pricing, sizes and delivery. Check the product page for the available order options.",
    ],
    [
      "Is this a marketplace?",
      "No. This is the Team Core Sports Wear company store. All products, enquiries and orders are handled by one company.",
    ],
    [
      "Does sending an enquiry commit me to an order?",
      "No. You review a quotation with its prices and terms before accepting. Acceptance creates an order; payment is a separate step.",
    ],
    [
      "How do I check my payment?",
      "Open the order in your account. The payment status comes from the server, not just the return page. If a payment is still pending, refresh the status before trying again.",
    ],
    [
      "Where can you deliver?",
      "Include your country, city and any delivery deadline in the enquiry. We confirm availability, delivery charges and arrangements for your destination in the quotation.",
    ],
    [
      "How do I find sizing information?",
      "Check the product details and SKU. If measurements are missing or unclear, ask our team before ordering.",
    ],
  ];
  return (
    <>
      <SEOHead title="Custom Teamwear FAQs" description="Answers about ordering custom uniforms, minimum quantities, names and numbers, sizing, quotes and delivery." />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</p>
          <h1>Custom teamwear FAQs</h1>
        </div>
      </div>
      <div className="container-main section max-w-4xl">
        {questions.map(([q, a]) => (
          <details className="faq-item" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <Link className="action action-red mt-8" to="/contact">
          Still need a hand? <ArrowUpRight size={18} />
        </Link>
      </div>
    </>
  );
}
