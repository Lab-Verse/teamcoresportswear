import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Palette,
  Printer,
  Layers,
  Flame,
  Scissors,
  Tag,
  Target,
  Ruler,
  Grid2X2,
  Droplets,
  MoveHorizontal,
  Sprout,
} from "lucide-react";
const options = [
  {
    title: "Sublimation printing",
    text: "Discuss full-colour patterns and artwork across your garment.",
    icon: Palette,
  },
  {
    title: "Screen printing",
    text: "Explore logo, lettering and player-number applications.",
    icon: Printer,
  },
  {
    title: "Embroidery",
    text: "Discuss stitched logos and the finish your identity needs.",
    icon: Layers,
  },
  {
    title: "Heat transfer",
    text: "Ask about transfer decoration for your design and fabric.",
    icon: Flame,
  },
  {
    title: "Tackle twill",
    text: "Discuss sewn lettering and numbering for your team kit.",
    icon: Scissors,
  },
  {
    title: "Custom labels",
    text: "Plan brand, size and care labels for your collection.",
    icon: Tag,
  },
  {
    title: "Colour matching",
    text: "Bring Pantone references and review colour requirements.",
    icon: Target,
  },
  {
    title: "Cut & sew",
    text: "Agree your garment construction, fit and stitching details.",
    icon: Ruler,
  },
  {
    title: "Polyester & mesh",
    text: "Discuss fabric weight, texture and your sport's requirements.",
    icon: Grid2X2,
  },
  {
    title: "Moisture management",
    text: "Ask about breathability, finishes and fabric specifications.",
    icon: Droplets,
  },
  {
    title: "Stretch & compression",
    text: "Confirm stretch, support and fit requirements for your kit.",
    icon: MoveHorizontal,
  },
  {
    title: "Dye & environmental requirements",
    text: "Discuss dye processes and any supporting documentation you need.",
    icon: Sprout,
  },
] as const;
export function TechnologyCapabilities() {
  return (
    <section
      className="section tc-technology"
      aria-labelledby="technology-title"
    >
      <div className="container-main">
        <div className="tc-technology-heading">
          <p className="eyebrow">
            <span /> CAPABILITIES <span />
          </p>
          <h2 id="technology-title">Technology & Fabric Capabilities</h2>
          <p>
            Explore the details behind your next uniform, from team artwork to
            fabric and construction.
          </p>
        </div>
        <div className="tc-technology-grid">
          {options.map(({ title, text, icon: Icon }) => (
            <Link
              key={title}
              className="tc-technology-card"
              to={`/contact?topic=${encodeURIComponent(title + " enquiry")}`}
            >
              <span className="tc-technology-icon">
                <Icon size={24} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowUpRight
                className="tc-technology-arrow"
                size={16}
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
        <p className="tc-technology-note">
          Options depend on your garment and project. Your reviewed quotation
          confirms available techniques, fabric specifications and any
          performance or environmental requirements.
        </p>
      </div>
    </section>
  );
}
