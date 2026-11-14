import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { storefront } from "@/services/storefront";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

import {
  collectionKey,
  latestCollection,
  type CollectionParams,
} from "@/lib/collections";

export function ShelfResults({
  products,
  pending,
  error,
  retry,
  empty = "No designs in this collection yet. Tell us what you have in mind.",
}: {
  products?: Product[];
  pending: boolean;
  error: boolean;
  retry: () => void;
  empty?: string;
}) {
  if (pending)
    return (
      <div
        className="product-grid tc-shelf-grid"
        aria-label="Loading designs"
        aria-busy="true"
      >
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="product-placeholder skeleton" />
        ))}
      </div>
    );
  if (error)
    return (
      <div className="data-notice" role="alert">
        <p>We couldn't load these designs.</p>
        <button className="text-link" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (!products?.length)
    return (
      <div className="data-notice">
        <p>{empty}</p>
        <Link className="text-link" to="/contact">
          Discuss a custom kit <ArrowUpRight size={16} />
        </Link>
      </div>
    );
  return (
    <div className="product-grid tc-shelf-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductShelf({
  title,
  eyebrow,
  description,
  params = latestCollection,
  href = "/products?sort=newest",
  excludeSlug,
  contained = false,
}: {
  title: string;
  eyebrow: string;
  description?: string;
  params?: CollectionParams;
  href?: string;
  excludeSlug?: string;
  contained?: boolean;
}) {
  const query = useQuery({
    queryKey: collectionKey(params),
    queryFn: () => storefront.products(params),
  });
  const products = query.data?.data
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, 4);
  return (
    <section
      className={`section ${contained ? "" : "container-main"}`}
      aria-label={title}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {description && (
            <p className="tc-section-description">{description}</p>
          )}
        </div>
        <Link className="text-link" to={href}>
          Explore collection <ArrowUpRight size={18} />
        </Link>
      </div>
      <ShelfResults
        products={products}
        pending={query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      />
    </section>
  );
}
