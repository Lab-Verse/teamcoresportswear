import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin, Phone, Instagram } from "lucide-react";
import { Brand } from "@/components/common/Brand";
import { brand, sports } from "@/config/brand";
export function Footer() {
  return (
    <footer className="site-footer tc-footer">
      <div className="container-main">
        <div className="tc-footer-cta">
          <div>
            <p className="eyebrow">LET'S BUILD YOUR NEXT KIT</p>
            <h2>
              Made for your team.
              <br />
              Ready for your next chapter.
            </h2>
          </div>
          <Link className="action action-red" to="/wholesale">
            Talk about your order <ArrowUpRight size={19} />
          </Link>
        </div>
        <div className="footer-grid">
          <div>
            <Brand inverse />
            <p className="footer-description">
              Custom sports uniforms and teamwear. A direct manufacturing
              partner for clubs, teams and apparel brands.
            </p>
            <a
              href={brand.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Team Core Sports Wear on Instagram"
            >
              <Instagram size={21} />
            </a>
          </div>
          <div>
            <h3>Shop by sport</h3>
            {sports.map((s) => (
              <Link key={s.slug} to={`/categories/${s.slug}`}>
                {s.name}
              </Link>
            ))}
          </div>
          <div>
            <h3>Made for you</h3>
            {[
              ["/custom-uniforms", "Custom uniforms"],
              ["/private-label", "Private label"],
              ["/design-studio", "Design your kit"],
              ["/wholesale", "Wholesale & team orders"],
              ["/manufacturing-process", "Our process"],
              ["/about", "About Team Core"],
            ].map(([url, label]) => (
              <Link key={url} to={url}>
                {label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Here to help</h3>
            {[
              ["/help", "Help centre"],
              ["/size-guide", "Size guidance"],
              ["/shipping-delivery", "Shipping & delivery"],
              ["/returns-refunds", "Returns & refunds"],
              ["/account/orders", "Your orders"],
              ["/account/wholesale", "Your quotations"],
            ].map(([url, label]) => (
              <Link key={url} to={url}>
                {label}
              </Link>
            ))}
          </div>
          <div className="tc-footer-contact">
            <h3>Get in touch</h3>
            <p>
              <MapPin size={17} />
              <span>{brand.location}</span>
            </p>
            <a href={brand.phoneHref}>
              <Phone size={17} />
              <span>{brand.phone}</span>
            </a>
            <a href={`mailto:${brand.email}`}>
              <Mail size={17} />
              <span>{brand.email}</span>
            </a>
            <a href={brand.whatsapp} target="_blank" rel="noreferrer">
              <span>Chat on WhatsApp</span> <ArrowUpRight size={15} />
            </a>
            <Link to="/contact">
              <span>Send us a message</span> <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <div>
            {[
              ["/privacy-policy", "Privacy"],
              ["/terms", "Terms"],
              ["/cookie-policy", "Cookies"],
              ["/accessibility", "Accessibility"],
            ].map(([url, label]) => (
              <Link key={url} to={url}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
