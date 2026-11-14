import { Link } from "react-router-dom";
import { ArrowUpRight, PenTool, Ruler, Scissors, Sparkles, Layers3, Truck } from "lucide-react";

const steps = [
  { title: "Product designing", icon: PenTool, text: "Start with your idea, a reference or a design from our studio. Share colours, artwork and placement preferences so we can shape a clear design brief together." },
  { title: "Pattern making", icon: Ruler, text: "The fit comes first. Discuss measurements, size ranges and construction with our team, and confirm the sample requirements before your order moves forward." },
  { title: "Cutting & printing", icon: Scissors, text: "Make the design your own. We’ll confirm suitable fabrics, print methods and artwork placement in your quotation, with a proof to review before production." },
  { title: "Embroidery & detail", icon: Sparkles, text: "It’s the details that make a collection yours. Discuss embroidered logos, transfers and finishing options, with availability and costs confirmed for your chosen product." },
  { title: "Production", icon: Layers3, text: "Keep the specification clear from the start. Agree on quantities, materials, approved artwork and any sample sign-off with our team before production begins." },
  { title: "Packing & shipping", icon: Truck, text: "Plan the final step with confidence. Confirm packing requirements, your delivery destination and shipping costs with your quotation, then follow your order from your account." },
];

export function WhyChooseUs() {
  return (
    <section className="why-section" aria-labelledby="why-heading">
      <div className="container-main">
        <div className="why-title"><span className="eyebrow">YOUR IDEAS. OUR NEXT PROJECT.</span><h2 id="why-heading">Why choose <span>Team Core Sports Wear?</span></h2><span className="why-title-mark" aria-hidden="true">TC /</span></div>
        <div className="why-intro"><p>One team to talk to, from the first sketch to the final shipment. Bring us your vision and we’ll help you work through the details that make your collection yours.</p><Link to="/wholesale" className="text-link">Let’s build your collection <ArrowUpRight size={20} /></Link></div>
        <div className="why-grid">{steps.map(({ title, text, icon: Icon }, index) => (
          <article className={`why-card${index === 2 ? " why-card-featured" : ""}`} key={title}>
            <div className="why-icon" aria-hidden="true"><Icon size={29} strokeWidth={1.6} /></div><span className="why-number" aria-hidden="true">0{index + 1}</span>
            <h3>{title}</h3><p>{text}</p>
          </article>
        ))}</div>
        <p className="why-footnote">Every project starts with a conversation. Product options, samples, pricing and lead times are confirmed in your quotation.</p>
      </div>
    </section>
  );
}
