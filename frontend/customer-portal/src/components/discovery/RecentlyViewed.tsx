import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { storefront } from "@/services/storefront";
import { ShelfResults } from "./ProductShelf";
import type { Product } from "@/types";

export function RecentlyViewed({
  excludeSlug,
  contained = false,
}: {
  excludeSlug?: string;
  contained?: boolean;
}) {
  const viewed = useUIStore((s) => s.recentlyViewed);
  const clear = useUIStore((s) => s.clearRecentlyViewed);
  const slugs =
    typeof window === "undefined"
      ? []
      : viewed.filter((s) => s !== excludeSlug).slice(0, 4);
  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ["storefront", "product", slug],
      queryFn: () => storefront.product(slug),
      retry: false,
      staleTime: 0,
      refetchOnMount: "always" as const,
    })),
  });
  if (!slugs.length) return null;
  const products = queries.map((q) => q.data).filter((p): p is Product => !!p);
  const pending = queries.some((q) => q.isPending);
  const errors = queries.filter(
    (q) =>
      q.isError &&
      (q.error as { response?: { status?: number } })?.response?.status !== 404,
  );
  return (
    <section
      className={`section ${contained ? "" : "container-main"}`}
      aria-label="Pick up where you left off"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR RECENT DISCOVERIES</p>
          <h2>Pick up where you left off.</h2>
          <p className="tc-section-description">
            Designs you've viewed on this browser.
          </p>
        </div>
        <button className="text-link" onClick={clear}>
          Clear history <X size={17} />
        </button>
      </div>
      <ShelfResults
        products={products}
        pending={pending && !products.length}
        error={!!errors.length && !products.length}
        retry={() => {
          queries.forEach((q) => void q.refetch());
        }}
        empty="These designs are no longer available. Explore the current collection."
      />
      {products.length > 0 && errors.length > 0 && (
        <p role="status">
          Some recent designs could not load.{" "}
          <button
            className="text-link"
            onClick={() => errors.forEach((q) => void q.refetch())}
          >
            Retry missing designs
          </button>
        </p>
      )}
      <Link className="text-link tc-shelf-footer" to="/products">
        Keep exploring <ArrowUpRight size={16} />
      </Link>
    </section>
  );
}
