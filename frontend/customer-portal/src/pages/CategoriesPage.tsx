import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SportGrid } from "@/components/home/SportGrid";
import { storefront } from "@/services/storefront";
import { SEOHead } from "@/components/common/SEOHead";
import { sports } from "@/config/brand";
import { AudienceCollections } from "@/components/discovery/BuyerGuides";
import { SportDiscovery } from "@/components/discovery/SportDiscovery";
import { RecentlyViewed } from "@/components/discovery/RecentlyViewed";
export default function CategoriesPage() {
  const q = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: storefront.categories,
  });
  const extra =
    q.data?.filter((c) => !sports.some((s) => s.slug === c.slug)) || [];
  return (
    <>
      <SEOHead
        title="Shop by sport"
        description="Explore American Football, Baseball, Basketball, Ice Hockey, Rugby and Soccer uniforms from Team Core Sports Wear."
      />
      <div className="page-intro">
        <div className="container-main">
          <p className="eyebrow">THE TEAM CORE COLLECTION</p>
          <h1>
            Find your sport.
            <br />
            Make it your own.
          </h1>
          <p>
            Explore uniform designs and start a conversation about your team's
            next kit.
          </p>
        </div>
      </div>
      <section className="section container-main">
        <SportGrid />
        {extra.length > 0 && (
          <div className="tc-extra-categories">
            <h2>More collections</h2>
            {extra.map((c) => (
              <Link key={c.id} to={`/categories/${c.slug}`}>
                {c.name}
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        )}
        <div className="tc-catalogue-note">
          <p>
            Have a custom requirement? Tell us your sport, quantity and design
            ideas.
          </p>
          <Link className="text-link" to="/contact">
            Talk to our team <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <SportDiscovery />
      <AudienceCollections />
      <RecentlyViewed />
    </>
  );
}
