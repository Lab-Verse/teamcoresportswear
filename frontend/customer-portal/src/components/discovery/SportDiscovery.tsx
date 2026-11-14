import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { storefront } from "@/services/storefront";
import { sports } from "@/config/brand";
import { ShelfResults } from "./ProductShelf";
import { collectionKey, sportCollection } from "@/lib/collections";

export function SportDiscovery() {
  const [selected, setSelected] = useState("soccer");
  const categories = useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: storefront.categories,
  });
  const available = categories.data || [];
  const active = available.find((c) => c.slug === selected) || available[0];
  const params = sportCollection(active?.slug || selected);
  const query = useQuery({
    queryKey: collectionKey(params),
    queryFn: () => storefront.products(params),
    enabled: !!active,
  });
  return (
    <section
      className="section tc-soft-section"
      aria-label="Explore your sport"
    >
      <div className="container-main">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE MORE YOUR GAME</p>
            <h2>Explore your sport.</h2>
            <p className="tc-section-description">
              Switch sports to find a starting point for your next kit.
            </p>
          </div>
          <Link className="text-link" to="/categories">
            All sports <ArrowUpRight size={18} />
          </Link>
        </div>
        {categories.isError ? (
          <div className="data-notice" role="alert">
            <p>Sports are temporarily unavailable.</p>
            <button
              className="text-link"
              onClick={() => void categories.refetch()}
            >
              Reload sports
            </button>
          </div>
        ) : categories.isPending ? (
          <p role="status">Loading sports…</p>
        ) : !available.length ? (
          <div className="data-notice">
            <p>Our collection is being prepared.</p>
            <Link to="/contact">Tell us about your sport →</Link>
          </div>
        ) : (
          <>
            <div
              className="tc-sport-switcher"
              role="group"
              aria-label="Choose a sport"
            >
              {available.map((c) => (
                <button
                  key={c.id}
                  aria-pressed={active?.slug === c.slug}
                  onClick={() => setSelected(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="tc-discovery-caption" role="status">
              <p>
                <strong>{active?.name}</strong> ·{" "}
                {sports.find((s) => s.slug === active?.slug)?.description ||
                  active?.description ||
                  "Uniform designs for your team."}
              </p>
              <Link
                className="text-link"
                to={`/categories/${encodeURIComponent(active?.slug || selected)}`}
              >
                View the full range <ArrowUpRight size={16} />
              </Link>
            </div>
            <ShelfResults
              products={query.data?.data}
              pending={query.isPending}
              error={query.isError}
              retry={() => void query.refetch()}
            />
          </>
        )}
      </div>
    </section>
  );
}
